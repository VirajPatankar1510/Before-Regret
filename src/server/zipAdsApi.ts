import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors.js';
import type { SponsoredVendor } from '../types.js';
import { requireVerifiedUser } from './clerkAuth.js';

// Self-serve, ZIP-targeted vendor ad slots inside reports: one vendor per (zip, trade category)
// purchase, at most MAX_SLOTS_PER_ZIP_TRADE active at once per pair, $29 for a flat 30-day
// window, no auto-renewal -- same no-subscription rationale as guideAdsApi.ts (a genuine PayPal
// subscription is a separate Billing Plans + webhooks integration, not worth building before
// anyone here has paid for anything once). Replaces the old /api/vendor-slots and
// /api/vendor-interest routes, which only logged a submission to console and asked a human to
// follow up manually -- this one actually takes payment and activates the slot itself.

// Exported so myAdsApi.ts can quote the real renewal price before sending a vendor to PayPal --
// same reasoning as guideAdsApi.ts's exported constants.
export const PRICE_PER_SLOT_USD = 29;
export const SLOT_DURATION_DAYS = 30;

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

// Shared by checkout, capture, and the availability endpoint -- all three need the same
// definition of "how many active, unexpired vendors currently occupy this (zip, trade) pair" and
// must never quietly diverge.
async function countActiveSlots(zipCode: string, tradeCategory: string): Promise<number> {
  return withDb(async (sql) => {
    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM zip_ad_purchases
      WHERE zip_code = ${zipCode} AND trade_category = ${tradeCategory}
        AND active = true AND paid_through > now()
    `;
    return (rows as unknown as Array<{ count: number }>)[0]?.count ?? 0;
  });
}

// Pre-fetch-once-per-report pattern: report generation used to call getSponsoredVendorForZipAndTrade
// (a synchronous lookup into an always-empty static array) once per finding and once per
// inspection-priority item -- up to ~14 calls per report. Doing that against a real database would
// mean ~14 round trips per report instead of one. This fetches every active vendor for the ZIP in a
// single query and builds an in-memory map that the existing per-item logic in server.ts can
// consult synchronously.
export async function fetchActiveZipVendors(zipCode: string | undefined | null): Promise<Map<string, SponsoredVendor[]>> {
  const map = new Map<string, SponsoredVendor[]>();
  if (!zipCode || !isDbConfigured()) return map;
  try {
    const rows = await withDb((sql) => sql`
      SELECT id, zip_code, trade_category, business_name, phone, website, tagline
      FROM zip_ad_purchases
      WHERE zip_code = ${zipCode} AND active = true AND paid_through > now()
      ORDER BY created_at ASC
    `);
    for (const row of rows as unknown as Array<{
      id: number; zip_code: string; trade_category: string; business_name: string; phone: string; website: string | null; tagline: string | null;
    }>) {
      // All active vendors for a (zip, trade) pair now, not just the first -- ORDER BY created_at
      // ASC keeps earliest-purchased first within each list. Capped at MAX_SLOTS_PER_ZIP_TRADE as
      // a defensive match to what checkout/renewal actually enforce as sellable inventory; the
      // query itself can never return more than that many active rows for one pair anyway.
      const list = map.get(row.trade_category) ?? [];
      if (list.length < MAX_SLOTS_PER_ZIP_TRADE) {
        list.push({
          id: String(row.id),
          zipCode: row.zip_code,
          businessName: row.business_name,
          tradeCategory: row.trade_category,
          phone: row.phone,
          website: row.website || undefined,
          tagline: row.tagline || undefined,
          active: true,
        });
        map.set(row.trade_category, list);
      }
    }
  } catch (err) {
    console.error('[zip-ads] vendor pre-fetch failed:', err);
  }
  return map;
}

export function registerZipAdsRoutes(app: Express) {
  // --- Public: slot availability for a (zip, trade category) pair, checked before the checkout
  // form reveals its remaining fields, and re-checked authoritatively at checkout and capture. ---
  app.get('/api/zip-ads/slots', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const zipCode = typeof req.query.zip === 'string' ? req.query.zip.trim() : '';
    const tradeCategory = typeof req.query.tradeCategory === 'string' ? req.query.tradeCategory.trim() : '';
    if (!/^\d{5}$/.test(zipCode)) {
      res.status(400).json({ success: false, error: 'A valid 5-digit ZIP code is required.' });
      return;
    }
    if (!(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) {
      res.status(400).json({ success: false, error: 'tradeCategory must be one of the supported categories.' });
      return;
    }
    try {
      const slotsTaken = await countActiveSlots(zipCode, tradeCategory);
      const slotsRemaining = Math.max(0, MAX_SLOTS_PER_ZIP_TRADE - slotsTaken);
      res.json({
        success: true,
        zipCode,
        tradeCategory,
        slotsTotal: MAX_SLOTS_PER_ZIP_TRADE,
        slotsTaken,
        slotsRemaining,
        available: slotsRemaining > 0,
        pricePerSlotUsd: PRICE_PER_SLOT_USD,
        slotDurationDays: SLOT_DURATION_DAYS,
      });
    } catch (err: any) {
      console.error('[zip-ads] slot availability check failed:', err);
      res.status(500).json({ success: false, error: 'Could not check slot availability.' });
    }
  });

  // --- Start checkout for one (zip, trade category) slot ---------------------------------------
  // Availability checking (above) stays public, but the actual checkout write requires a verified
  // Clerk session -- same reasoning and same requireVerifiedUser middleware as guideAdsApi.ts.
  // This calls paypalService.ts directly rather than the generic /api/paypal/orders route, which
  // has its own separate Clerk userId handling.
  app.post('/api/zip-ads/checkout', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { businessName, tradeCategory, zipCode, phone, website, tagline, contactEmail } = req.body || {};
    const errors: string[] = [];
    if (typeof businessName !== 'string' || !businessName.trim()) errors.push('Business name is required.');
    if (typeof tradeCategory !== 'string' || !(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) errors.push('Please choose a valid trade category.');
    if (typeof zipCode !== 'string' || !/^\d{5}$/.test(zipCode)) errors.push('A valid 5-digit ZIP code is required.');
    if (typeof phone !== 'string' || phone.trim().length < 7) errors.push('A valid phone number is required.');
    if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.push('A valid contact email is required.');
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }

    try {
      const slotsTaken = await countActiveSlots(zipCode, tradeCategory);
      if (slotsTaken >= MAX_SLOTS_PER_ZIP_TRADE) {
        res.status(409).json({
          success: false,
          error: `Both slots for ${tradeCategory} in ZIP ${zipCode} are already taken.`,
        });
        return;
      }

      const amount = PRICE_PER_SLOT_USD.toFixed(2);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret ZIP ad -- ${tradeCategory} in ${zipCode} x 30 days`,
        returnUrl: `${appUrl}/report-ads/success`,
        cancelUrl: `${appUrl}/report-ads`,
        userEmail: contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO zip_ad_orders (
          paypal_order_id, business_name, trade_category, zip_code, phone, website, tagline, contact_email, amount_usd, status, clerk_user_id
        ) VALUES (
          ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${zipCode}, ${phone}, ${website || null}, ${tagline || null},
          ${contactEmail}, ${amount}, 'pending', ${req.verifiedUserId as string}
        )
      `);

      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, amount, approvalUrl });
    } catch (err: any) {
      console.error('[zip-ads] checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start checkout.' });
    }
  });

  // --- Public: capture payment and activate the slot if it's still available ------------------
  app.post('/api/zip-ads/checkout/:orderId/capture', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { orderId } = req.params;
    try {
      const orderRows = await withDb((sql) => sql`SELECT * FROM zip_ad_orders WHERE paypal_order_id = ${orderId} LIMIT 1`);
      const order = (orderRows as unknown as any[])[0];
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }
      // Same guard and reasoning as guideAdsApi.ts's checkout capture route -- a renewal order
      // captured here would take the vendor's money and grant nothing.
      if (order.renews_purchase_id) {
        res.status(400).json({ success: false, error: 'This is a renewal order -- capture it through the renewal route.' });
        return;
      }
      // Same reload-safety reasoning as guideAdsApi.ts's capture route: rebuild real details from
      // what was persisted instead of the bare acknowledgement this used to return.
      if (order.status === 'completed') {
        const purchaseRows = await withDb((sql) => sql`
          SELECT paid_through FROM zip_ad_purchases WHERE order_id = ${order.id} ORDER BY created_at DESC LIMIT 1
        `);
        const purchase = (purchaseRows as unknown as Array<{ paid_through: string }>)[0];
        res.json({
          success: true,
          alreadyCaptured: true,
          granted: Boolean(purchase),
          captureId: order.paypal_capture_id,
          paidThrough: purchase?.paid_through ?? null,
          zipCode: order.zip_code,
          tradeCategory: order.trade_category,
        });
        return;
      }

      // Capture-id-first, same reasoning as guideAdsApi.ts's checkout capture route: the PayPal
      // charge is the one irreversible step, so it leaves a durable trace immediately and a retry
      // resumes past it instead of re-charging (and failing on ORDER_ALREADY_CAPTURED forever).
      let captureId: string = order.paypal_capture_id;
      if (!captureId) {
        const captureResult = await capturePayPalOrder(orderId);
        captureId = captureResult.captureId;
        await withDb((sql) => sql`
          UPDATE zip_ad_orders SET paypal_capture_id = ${captureId}, updated_at = now() WHERE id = ${order.id}
        `);
      }

      // Computed in JS, not a `now() + interval '${SLOT_DURATION_DAYS} days'` SQL literal -- the
      // sql`` tagged template parameterizes every ${...}, which breaks splicing a variable into a
      // quoted interval literal. A plain Date sidesteps that ambiguity entirely.
      const paidThrough = new Date(Date.now() + SLOT_DURATION_DAYS * 24 * 60 * 60 * 1000);
      let granted = false;
      await withDb(async (sql) => {
        // The pre-capture availability check and the insert used to be two separate round trips,
        // leaving a race window: two vendors' capture calls for the same (zip, trade) pair, close
        // enough together, could both pass the COUNT(*) check before either INSERT landed and
        // oversell past MAX_SLOTS_PER_ZIP_TRADE -- and neither PayPal charge could be undone by
        // that point anyway. Folding the count into the INSERT's own WHERE makes Postgres
        // evaluate "is there still room" and "claim it" as one atomic statement, so only inserts
        // that land before the cap fills can ever succeed.
        const inserted = await sql`
          INSERT INTO zip_ad_purchases (
            order_id, zip_code, trade_category, business_name, phone, website, tagline, paid_through
          )
          SELECT ${order.id}, ${order.zip_code}, ${order.trade_category}, ${order.business_name},
                 ${order.phone}, ${order.website}, ${order.tagline}, ${paidThrough.toISOString()}
          WHERE (
            SELECT COUNT(*) FROM zip_ad_purchases
            WHERE zip_code = ${order.zip_code} AND trade_category = ${order.trade_category}
              AND active = true AND paid_through > now()
          ) < ${MAX_SLOTS_PER_ZIP_TRADE}
          RETURNING id
        `;
        granted = (inserted as unknown[]).length > 0;
        await sql`
          UPDATE zip_ad_orders SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
          WHERE id = ${order.id}
        `;
      });

      res.json({
        success: true,
        captureId,
        granted,
        paidThrough: granted ? paidThrough.toISOString() : null,
        zipCode: order.zip_code,
        tradeCategory: order.trade_category,
      });
    } catch (err: any) {
      console.error('[zip-ads] capture failed:', err);
      try {
        // Same reasoning as guideAdsApi.ts: never bury a completed order, and never write off one
        // whose payment already went through -- it has to stay retryable.
        await withDb((sql) => sql`
          UPDATE zip_ad_orders SET status = 'failed', updated_at = now()
          WHERE paypal_order_id = ${orderId} AND status <> 'completed' AND paypal_capture_id IS NULL
        `);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Payment capture failed.' });
    }
  });

  // --- Renew: extend a placement the signed-in vendor already owns, in place ------------------
  // Same reasoning as guideAdsApi.ts's renew routes: the regular checkout flow's availability
  // check counts the vendor's own active row toward MAX_SLOTS_PER_ZIP_TRADE, so renewing early
  // through it would silently sell a second, duplicate listing instead of extending the first.
  // This flow skips availability entirely -- ownership is the only check -- and extends
  // paid_through on the existing row at capture time.
  app.post('/api/zip-ads/renew/:purchaseId', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const clerkUserId = req.verifiedUserId as string;
    if (!Number.isFinite(purchaseId)) {
      res.status(400).json({ success: false, error: 'Invalid placement.' });
      return;
    }
    try {
      // active = true for the same reason as guideAdsApi.ts's renew route: a pulled placement
      // never renders, so charging to extend one would be taking money for nothing.
      const owned = await withDb((sql) => sql`
        SELECT p.id, p.paid_through, o.contact_email
        FROM zip_ad_purchases p JOIN zip_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} AND p.active = true LIMIT 1
      `);
      const purchase = (owned as unknown as Array<{ id: number; paid_through: string; contact_email: string }>)[0];
      if (!purchase) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      // Once actually expired, one of the (up to) 2 slots for this (zip, trade) pair may already
      // belong to someone else -- that case goes through the normal "Buy again" checkout flow
      // instead (see MyAdsPanel.tsx's Expired section), which re-checks availability properly.
      if (new Date(purchase.paid_through).getTime() <= Date.now()) {
        res.status(409).json({ success: false, error: 'This placement has already expired -- buy it again from My Placements instead.' });
        return;
      }

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const paypalOrder = await createPayPalOrder({
        amount: PRICE_PER_SLOT_USD.toFixed(2),
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret ZIP ad renewal -- ${SLOT_DURATION_DAYS} more days`,
        returnUrl: `${appUrl}/my-ads?renewed=zip`,
        cancelUrl: `${appUrl}/my-ads`,
        userEmail: purchase.contact_email,
      });

      await withDb((sql) => sql`
        INSERT INTO zip_ad_orders (
          paypal_order_id, business_name, trade_category, zip_code, phone, website, tagline,
          contact_email, amount_usd, status, clerk_user_id, renews_purchase_id
        )
        SELECT ${paypalOrder.orderId}, business_name, trade_category, zip_code, phone, website, tagline,
               ${purchase.contact_email}, ${PRICE_PER_SLOT_USD.toFixed(2)}, 'pending', ${clerkUserId}, ${purchaseId}
        FROM zip_ad_purchases WHERE id = ${purchaseId}
      `);

      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, approvalUrl });
    } catch (err: any) {
      console.error('[zip-ads] renew checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start renewal.' });
    }
  });

  // --- Public: capture a renewal payment and extend the existing placement --------------------
  // No requireVerifiedUser, same as the regular capture route above -- reached from PayPal's
  // redirect back, identified by the unguessable orderId, not a fresh Authorization header.
  app.post('/api/zip-ads/renew/:orderId/capture', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { orderId } = req.params;
    try {
      const orderRows = await withDb((sql) => sql`SELECT * FROM zip_ad_orders WHERE paypal_order_id = ${orderId} LIMIT 1`);
      const order = (orderRows as unknown as any[])[0];
      if (!order || !order.renews_purchase_id) {
        res.status(404).json({ success: false, error: 'Renewal order not found.' });
        return;
      }

      if (order.status === 'completed') {
        const rows = await withDb((sql) => sql`SELECT paid_through, zip_code, trade_category FROM zip_ad_purchases WHERE id = ${order.renews_purchase_id} LIMIT 1`);
        const row = (rows as unknown as Array<{ paid_through: string; zip_code: string; trade_category: string }>)[0];
        res.json({ success: true, alreadyCaptured: true, paidThrough: row?.paid_through ?? null, zipCode: row?.zip_code, tradeCategory: row?.trade_category });
        return;
      }

      let captureId: string = order.paypal_capture_id;
      if (!captureId) {
        const captureResult = await capturePayPalOrder(orderId);
        captureId = captureResult.captureId;
        await withDb((sql) => sql`
          UPDATE zip_ad_orders SET paypal_capture_id = ${captureId}, updated_at = now() WHERE id = ${order.id}
        `);
      }

      // One statement, order-status transition as the lock, contact_edited reset for the new paid
      // term -- see guideAdsApi.ts's renew capture route for the full reasoning behind all three.
      const rows = await withDb((sql) => sql`
        WITH claimed AS (
          UPDATE zip_ad_orders
          SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
          WHERE id = ${order.id} AND status <> 'completed'
          RETURNING renews_purchase_id
        )
        UPDATE zip_ad_purchases p
        SET paid_through = GREATEST(p.paid_through, now()) + (${SLOT_DURATION_DAYS} * interval '1 day'),
            contact_edited = false
        FROM claimed
        WHERE p.id = claimed.renews_purchase_id
        RETURNING p.paid_through, p.zip_code, p.trade_category
      `);
      const updated = (rows as unknown as Array<{ paid_through: string; zip_code: string; trade_category: string }>)[0];

      if (!updated) {
        const existing = await withDb((sql) => sql`
          SELECT paid_through, zip_code, trade_category FROM zip_ad_purchases WHERE id = ${order.renews_purchase_id} LIMIT 1
        `);
        const row = (existing as unknown as Array<{ paid_through: string; zip_code: string; trade_category: string }>)[0];
        res.json({ success: true, alreadyCaptured: true, captureId, paidThrough: row?.paid_through ?? null, zipCode: row?.zip_code, tradeCategory: row?.trade_category });
        return;
      }

      res.json({
        success: true,
        captureId,
        paidThrough: updated.paid_through,
        zipCode: updated.zip_code,
        tradeCategory: updated.trade_category,
      });
    } catch (err: any) {
      console.error('[zip-ads] renew capture failed:', err);
      try {
        await withDb((sql) => sql`
          UPDATE zip_ad_orders SET status = 'failed', updated_at = now()
          WHERE paypal_order_id = ${orderId} AND status <> 'completed' AND paypal_capture_id IS NULL
        `);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Renewal payment capture failed.' });
    }
  });
}
