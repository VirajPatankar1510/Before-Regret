import type { Express, Request, Response } from 'express';
import zipcodes from 'zipcodes';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors.js';
import type { SponsoredVendor } from '../types.js';
import { requireVerifiedUser } from './clerkAuth.js';

// Self-serve, ZIP-targeted vendor ad slots inside reports: one vendor per (zip, trade category)
// purchase, at most MAX_SLOTS_PER_ZIP_TRADE active at once per pair, $29 for a flat 30-day
// window covering ZIPS_PER_BUNDLE (3) ZIP codes at once -- same no-subscription rationale as
// guideAdsApi.ts (a genuine PayPal subscription is a separate Billing Plans + webhooks
// integration, not worth building before anyone here has paid for anything once).
//
// Checkout uses a ticket-booking-app hold: the instant a vendor's 3 chosen ZIPs pass the
// availability check, they're atomically claimed as a pending hold (see HOLD_DURATION_MINUTES)
// before any PayPal order exists, so a second vendor can never start paying for a ZIP someone
// else is already mid-checkout on. Capture (after the hold already reserved the spot) still runs
// the same atomic per-ZIP claim as a defensive final check, for the rare case a hold lapsed
// mid-payment -- see the capture route below for why that's still needed even with holds.

export const PRICE_PER_BUNDLE_USD = 29;
export const SLOT_DURATION_DAYS = 30;
export const ZIPS_PER_BUNDLE = 3;
const HOLD_DURATION_MINUTES = 15;

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

// Shared by the public availability endpoint and the checkout-time atomic claim -- both need the
// same definition of "how many active, unexpired vendors OR live holds currently occupy this
// (zip, trade) pair". A live hold counts exactly like a real purchase: it's another vendor's
// zip_ad_orders row, still status='pending', whose hold_expires_at hasn't passed yet, that lists
// this zip in its zip_codes_json.
async function countActiveOrHeldSlots(zipCode: string, tradeCategory: string): Promise<number> {
  return withDb(async (sql) => {
    const purchased = await sql`
      SELECT COUNT(*)::int AS count FROM zip_ad_purchases
      WHERE zip_code = ${zipCode} AND trade_category = ${tradeCategory}
        AND active = true AND paid_through > now()
    `;
    const held = await sql`
      SELECT COUNT(*)::int AS count FROM zip_ad_orders
      WHERE trade_category = ${tradeCategory} AND status = 'pending' AND hold_expires_at > now()
        AND zip_codes_json::jsonb ? ${zipCode}
    `;
    return ((purchased as unknown as Array<{ count: number }>)[0]?.count ?? 0)
      + ((held as unknown as Array<{ count: number }>)[0]?.count ?? 0);
  });
}

// Pre-fetch-once-per-report pattern: report generation used to call getSponsoredVendorForZipAndTrade
// (a synchronous lookup into an always-empty static array) once per finding and once per
// inspection-priority item -- up to ~14 calls per report. Doing that against a real database would
// mean ~14 round trips per report instead of one. This fetches every active vendor for the ZIP in a
// single query and builds an in-memory map that the existing per-item logic in server.ts can
// consult synchronously. Unaffected by holds -- this only ever reads zip_ad_purchases, real sold
// inventory, never a pending checkout.
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

// Format alone (5 digits) admits plenty of numbers USPS never assigned -- 00000, 11111, 99999 --
// which would let a vendor pay for a slot no report can ever be generated in. zipcodes.lookup
// carries USPS's actual ZIP roster (incl. city/state/country), so this rejects anything that
// isn't a real, currently-assigned US ZIP code.
function isValidZip(zip: unknown): zip is string {
  return typeof zip === 'string' && /^\d{5}$/.test(zip) && zipcodes.lookup(zip)?.country === 'US';
}

export function registerZipAdsRoutes(app: Express) {
  // --- Public: live availability for a (ZIP, trade category) pair -- reflects real purchases AND
  // other vendors' in-progress holds, so this behaves like a real booking app ("someone else is
  // checking out with this seat right now"), not just "sold" vs "open". ---
  app.get('/api/zip-ads/slots', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const zipCode = typeof req.query.zip === 'string' ? req.query.zip.trim() : '';
    const tradeCategory = typeof req.query.tradeCategory === 'string' ? req.query.tradeCategory.trim() : '';
    if (!isValidZip(zipCode)) {
      res.status(400).json({ success: false, error: 'Enter a real, currently-assigned 5-digit U.S. ZIP code.' });
      return;
    }
    if (!(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) {
      res.status(400).json({ success: false, error: 'tradeCategory must be one of the supported categories.' });
      return;
    }
    try {
      const slotsTaken = await countActiveOrHeldSlots(zipCode, tradeCategory);
      const slotsRemaining = Math.max(0, MAX_SLOTS_PER_ZIP_TRADE - slotsTaken);
      res.json({
        success: true,
        zipCode,
        tradeCategory,
        slotsTotal: MAX_SLOTS_PER_ZIP_TRADE,
        slotsTaken,
        slotsRemaining,
        available: slotsRemaining > 0,
        pricePerBundleUsd: PRICE_PER_BUNDLE_USD,
        zipsPerBundle: ZIPS_PER_BUNDLE,
        slotDurationDays: SLOT_DURATION_DAYS,
      });
    } catch (err: any) {
      console.error('[zip-ads] slot availability check failed:', err);
      res.status(500).json({ success: false, error: 'Could not check slot availability.' });
    }
  });

  // --- Start checkout for a 3-ZIP bundle under one trade category -------------------------------
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
    const { businessName, tradeCategory, zipCodes, phone, website, tagline, contactEmail } = req.body || {};
    const errors: string[] = [];
    if (typeof businessName !== 'string' || !businessName.trim()) errors.push('Business name is required.');
    if (typeof tradeCategory !== 'string' || !(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) errors.push('Please choose a valid trade category.');
    const zipList: string[] = Array.isArray(zipCodes) ? zipCodes.filter((z) => typeof z === 'string') : [];
    const uniqueZips = Array.from(new Set(zipList));
    if (uniqueZips.length !== ZIPS_PER_BUNDLE || !uniqueZips.every(isValidZip)) {
      errors.push(`Select exactly ${ZIPS_PER_BUNDLE} different, real U.S. ZIP codes.`);
    }
    if (typeof phone !== 'string' || phone.trim().length < 7) errors.push('A valid phone number is required.');
    if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.push('A valid contact email is required.');
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }
    const [zip1, zip2, zip3] = uniqueZips;

    try {
      const amount = PRICE_PER_BUNDLE_USD.toFixed(2);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret ZIP ad -- ${tradeCategory} in ${uniqueZips.join(', ')} x 30 days`,
        returnUrl: `${appUrl}/report-ads/success`,
        cancelUrl: `${appUrl}/report-ads`,
        userEmail: contactEmail,
      });

      // Atomic claim, ticket-booking-app style: this single statement is both the availability
      // check AND the reservation, for all 3 ZIPs at once, so two vendors racing for the same
      // last slot can never both pass. The WHERE clause repeats the same
      // "real purchases + live holds < cap" test from countActiveOrHeldSlots above once per ZIP
      // rather than calling that function three times beforehand -- a separate check-then-insert
      // would reopen exactly the race this is built to close (see guideAdsApi.ts's capture route
      // for the same reasoning applied to a simpler, single-item case).
      const claimed = await withDb((sql) => sql`
        INSERT INTO zip_ad_orders (
          paypal_order_id, business_name, trade_category, zip_code, zip_codes_json, phone, website,
          tagline, contact_email, amount_usd, status, clerk_user_id, hold_expires_at
        )
        SELECT ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${zip1}, ${JSON.stringify(uniqueZips)},
               ${phone}, ${website || null}, ${tagline || null}, ${contactEmail}, ${amount}, 'pending',
               ${req.verifiedUserId as string}, now() + (${HOLD_DURATION_MINUTES} * interval '1 minute')
        WHERE (
          (SELECT COUNT(*)::int FROM zip_ad_purchases WHERE zip_code = ${zip1} AND trade_category = ${tradeCategory} AND active = true AND paid_through > now())
          + (SELECT COUNT(*)::int FROM zip_ad_orders WHERE trade_category = ${tradeCategory} AND status = 'pending' AND hold_expires_at > now() AND zip_codes_json::jsonb ? ${zip1})
        ) < ${MAX_SLOTS_PER_ZIP_TRADE}
        AND (
          (SELECT COUNT(*)::int FROM zip_ad_purchases WHERE zip_code = ${zip2} AND trade_category = ${tradeCategory} AND active = true AND paid_through > now())
          + (SELECT COUNT(*)::int FROM zip_ad_orders WHERE trade_category = ${tradeCategory} AND status = 'pending' AND hold_expires_at > now() AND zip_codes_json::jsonb ? ${zip2})
        ) < ${MAX_SLOTS_PER_ZIP_TRADE}
        AND (
          (SELECT COUNT(*)::int FROM zip_ad_purchases WHERE zip_code = ${zip3} AND trade_category = ${tradeCategory} AND active = true AND paid_through > now())
          + (SELECT COUNT(*)::int FROM zip_ad_orders WHERE trade_category = ${tradeCategory} AND status = 'pending' AND hold_expires_at > now() AND zip_codes_json::jsonb ? ${zip3})
        ) < ${MAX_SLOTS_PER_ZIP_TRADE}
        RETURNING id
      `);

      // Nothing to undo at PayPal -- an order that's created but never approved/captured never
      // charges anyone and simply expires on PayPal's own side. No cleanup needed here, same as
      // every other abandoned/failed order in this codebase.
      if ((claimed as unknown[]).length === 0) {
        res.status(409).json({
          success: false,
          error: 'One or more of your ZIP codes was just taken by another advertiser -- please choose different ones.',
        });
        return;
      }

      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, amount, approvalUrl });
    } catch (err: any) {
      console.error('[zip-ads] checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start checkout.' });
    }
  });

  // --- Public: capture payment and activate whichever ZIPs in the bundle are still available ---
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
      if (order.renews_order_id) {
        res.status(400).json({ success: false, error: 'This is a renewal order -- capture it through the renewal route.' });
        return;
      }
      // Same reload-safety reasoning as guideAdsApi.ts's capture route: rebuild real details from
      // what was persisted instead of the bare acknowledgement this used to return.
      if (order.status === 'completed') {
        const purchaseRows = await withDb((sql) => sql`
          SELECT zip_code, paid_through FROM zip_ad_purchases WHERE order_id = ${order.id} ORDER BY zip_code ASC
        `);
        const purchases = purchaseRows as unknown as Array<{ zip_code: string; paid_through: string }>;
        res.json({
          success: true,
          alreadyCaptured: true,
          grantedZips: purchases.map((p) => p.zip_code),
          captureId: order.paypal_capture_id,
          paidThrough: purchases[0]?.paid_through ?? null,
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
      const requestedZips = JSON.parse(order.zip_codes_json || '[]') as string[];
      const grantedZips: string[] = [];
      const skippedZips: string[] = [];
      await withDb(async (sql) => {
        // The hold already reserved these 3 ZIPs before payment started, so this should almost
        // always grant all of them. This atomic per-ZIP claim is the defensive final check for
        // the one case a hold doesn't cover: the vendor took longer than HOLD_DURATION_MINUTES to
        // finish at PayPal, the hold lapsed, and someone else's checkout claimed the ZIP in that
        // gap. Checked against real purchases only here -- once we're capturing, the only thing
        // that matters is who actually holds the inventory, not who else might be mid-checkout.
        for (const zip of requestedZips) {
          // This capture route can run more than once for the SAME order -- a page reload before
          // the fetch resolves, PayPal's return redirect re-firing, ZipAdsCheckoutSuccess.tsx
          // remounting. The `status === 'completed'` guard above only catches a retry that lands
          // AFTER status has actually flipped; one that lands in the gap between paypal_capture_id
          // being set and that UPDATE below would still reach this loop. Unlike guide ads' single
          // WHERE NOT EXISTS (safe there only because guide ads sell exactly 1 slot per position,
          // so "exists" and "at capacity" are the same test), zip ads sell up to
          // MAX_SLOTS_PER_ZIP_TRADE (2) per pair, so a bare COUNT(*) < cap check doesn't block a
          // second insert from this SAME order once it's already granted this ZIP once -- capacity
          // has room for a legitimate second vendor. Checking "did this order already grant this
          // ZIP" first, before touching capacity at all, is what actually makes a retry a no-op
          // instead of a duplicate charge-for-one-payment.
          const already = await sql`
            SELECT id FROM zip_ad_purchases WHERE order_id = ${order.id} AND zip_code = ${zip} LIMIT 1
          `;
          if ((already as unknown[]).length > 0) {
            grantedZips.push(zip);
            continue;
          }
          const inserted = await sql`
            INSERT INTO zip_ad_purchases (
              order_id, zip_code, trade_category, business_name, phone, website, tagline, paid_through
            )
            SELECT ${order.id}, ${zip}, ${order.trade_category}, ${order.business_name},
                   ${order.phone}, ${order.website}, ${order.tagline}, ${paidThrough.toISOString()}
            WHERE (
              SELECT COUNT(*) FROM zip_ad_purchases
              WHERE zip_code = ${zip} AND trade_category = ${order.trade_category}
                AND active = true AND paid_through > now()
            ) < ${MAX_SLOTS_PER_ZIP_TRADE}
            RETURNING id
          `;
          if ((inserted as unknown[]).length > 0) grantedZips.push(zip);
          else skippedZips.push(zip);
        }
        await sql`
          UPDATE zip_ad_orders SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
          WHERE id = ${order.id}
        `;
      });

      res.json({
        success: true,
        captureId,
        grantedZips,
        skippedZips,
        paidThrough: grantedZips.length > 0 ? paidThrough.toISOString() : null,
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

  // --- Renew: extend every ZIP in a bundle the signed-in vendor already owns, in place ----------
  // Same reasoning as guideAdsApi.ts's renew routes: the regular checkout flow's availability
  // check counts the vendor's own active rows toward MAX_SLOTS_PER_ZIP_TRADE, so renewing early
  // through it would silently sell duplicate listings instead of extending the real ones. This
  // flow skips availability entirely -- ownership is the only check -- and extends paid_through
  // on every purchase row under the original order at capture time, together, since the bundle
  // was sold and priced as one $29 unit rather than three independent ones. :orderId here is the
  // DB id of the original bundle order (not a purchase id, and not a PayPal token).
  app.post('/api/zip-ads/renew/:orderId', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const originalOrderId = parseInt(req.params.orderId, 10);
    const clerkUserId = req.verifiedUserId as string;
    if (!Number.isFinite(originalOrderId)) {
      res.status(400).json({ success: false, error: 'Invalid placement.' });
      return;
    }
    try {
      // Any one purchase row under the order is a representative source for business_name/phone/
      // website/tagline -- all rows in a bundle carry identical values, since they're only ever
      // written together at capture time (initial or renewal) and the one-time contact edit
      // (myAdsApi.ts) is applied to a single placement, not per-ZIP within a bundle... actually it
      // is applied per-purchase-row today, so this picks whichever the DB happens to return first.
      // Good enough for a renewal prefill; the vendor can still fix any one field via the edit flow.
      const owned = await withDb((sql) => sql`
        SELECT o.id AS order_id, o.zip_codes_json, o.trade_category, o.contact_email,
               p.paid_through, p.business_name, p.phone, p.website, p.tagline
        FROM zip_ad_orders o JOIN zip_ad_purchases p ON p.order_id = o.id
        WHERE o.id = ${originalOrderId} AND o.clerk_user_id = ${clerkUserId} AND p.active = true
        LIMIT 1
      `);
      const bundle = (owned as unknown as Array<{
        order_id: number; zip_codes_json: string; trade_category: string; contact_email: string;
        paid_through: string; business_name: string; phone: string; website: string | null; tagline: string | null;
      }>)[0];
      if (!bundle) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      // Once actually expired, one or more of the bundle's ZIPs may already belong to someone
      // else -- that case goes through the normal "Buy again" checkout flow instead (see
      // MyAdsPanel.tsx's Expired section), which re-checks availability (and re-claims a hold)
      // properly for a fresh 3-ZIP pick.
      if (new Date(bundle.paid_through).getTime() <= Date.now()) {
        res.status(409).json({ success: false, error: 'This placement has already expired -- buy it again from My Placements instead.' });
        return;
      }

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const zipCodes = JSON.parse(bundle.zip_codes_json || '[]') as string[];
      const paypalOrder = await createPayPalOrder({
        amount: PRICE_PER_BUNDLE_USD.toFixed(2),
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret ZIP ad renewal -- ${SLOT_DURATION_DAYS} more days`,
        returnUrl: `${appUrl}/my-ads?renewed=zip`,
        cancelUrl: `${appUrl}/my-ads`,
        userEmail: bundle.contact_email,
      });

      // No hold needed here (hold_expires_at left null) -- unlike a fresh checkout, a renewal
      // never contends with another vendor for availability, so there's nothing to reserve.
      await withDb((sql) => sql`
        INSERT INTO zip_ad_orders (
          paypal_order_id, business_name, trade_category, zip_code, zip_codes_json, phone, website, tagline,
          contact_email, amount_usd, status, clerk_user_id, renews_order_id
        ) VALUES (
          ${paypalOrder.orderId}, ${bundle.business_name}, ${bundle.trade_category}, ${zipCodes[0] ?? ''}, ${bundle.zip_codes_json},
          ${bundle.phone}, ${bundle.website}, ${bundle.tagline}, ${bundle.contact_email}, ${PRICE_PER_BUNDLE_USD.toFixed(2)},
          'pending', ${clerkUserId}, ${originalOrderId}
        )
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

  // --- Public: capture a renewal payment and extend every ZIP in the bundle --------------------
  // No requireVerifiedUser, same as the regular capture route above -- reached from PayPal's
  // redirect back, identified by the unguessable orderId (a PayPal token here, not a DB id), not
  // a fresh Authorization header.
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
      if (!order || !order.renews_order_id) {
        res.status(404).json({ success: false, error: 'Renewal order not found.' });
        return;
      }

      if (order.status === 'completed') {
        const rows = await withDb((sql) => sql`
          SELECT zip_code, trade_category, paid_through FROM zip_ad_purchases
          WHERE order_id = ${order.renews_order_id} ORDER BY zip_code ASC
        `);
        const purchases = rows as unknown as Array<{ zip_code: string; trade_category: string; paid_through: string }>;
        res.json({
          success: true, alreadyCaptured: true, captureId: order.paypal_capture_id,
          zips: purchases.map((p) => p.zip_code), tradeCategory: purchases[0]?.trade_category ?? order.trade_category,
          paidThrough: purchases[0]?.paid_through ?? null,
        });
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

      // Same order-status-transition-as-lock and contact_edited reset as guideAdsApi.ts's renew
      // capture route -- except this UPDATE naturally touches every purchase row under the
      // original order (up to ZIPS_PER_BUNDLE of them) in one statement, not just one, since
      // p.order_id = claimed.renews_order_id can match more than one row.
      const rows = await withDb((sql) => sql`
        WITH claimed AS (
          UPDATE zip_ad_orders
          SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
          WHERE id = ${order.id} AND status <> 'completed'
          RETURNING renews_order_id
        )
        UPDATE zip_ad_purchases p
        SET paid_through = GREATEST(p.paid_through, now()) + (${SLOT_DURATION_DAYS} * interval '1 day'),
            contact_edited = false
        FROM claimed
        WHERE p.order_id = claimed.renews_order_id
        RETURNING p.zip_code, p.trade_category, p.paid_through
      `);
      const updated = rows as unknown as Array<{ zip_code: string; trade_category: string; paid_through: string }>;

      // No rows means another request already completed this same renewal order first -- report
      // what's actually stored rather than pretending this call applied an extension it didn't.
      if (updated.length === 0) {
        const existing = await withDb((sql) => sql`
          SELECT zip_code, trade_category, paid_through FROM zip_ad_purchases
          WHERE order_id = ${order.renews_order_id} ORDER BY zip_code ASC
        `);
        const purchases = existing as unknown as Array<{ zip_code: string; trade_category: string; paid_through: string }>;
        res.json({
          success: true, alreadyCaptured: true, captureId,
          zips: purchases.map((p) => p.zip_code), tradeCategory: purchases[0]?.trade_category ?? order.trade_category,
          paidThrough: purchases[0]?.paid_through ?? null,
        });
        return;
      }

      res.json({
        success: true,
        captureId,
        zips: updated.map((r) => r.zip_code),
        tradeCategory: updated[0].trade_category,
        paidThrough: updated[0].paid_through,
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
