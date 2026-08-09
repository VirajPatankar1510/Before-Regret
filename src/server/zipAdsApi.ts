import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors.js';
import type { SponsoredVendor } from '../types.js';

// Self-serve, ZIP-targeted vendor ad slots inside reports: one vendor per (zip, trade category)
// purchase, at most MAX_SLOTS_PER_ZIP_TRADE active at once per pair, $29 for a flat 30-day
// window, no auto-renewal -- same no-subscription rationale as guideAdsApi.ts (a genuine PayPal
// subscription is a separate Billing Plans + webhooks integration, not worth building before
// anyone here has paid for anything once). Replaces the old /api/vendor-slots and
// /api/vendor-interest routes, which only logged a submission to console and asked a human to
// follow up manually -- this one actually takes payment and activates the slot itself.

const PRICE_PER_SLOT_USD = 29;
const SLOT_DURATION_DAYS = 30;

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
export async function fetchActiveZipVendors(zipCode: string | undefined | null): Promise<Map<string, SponsoredVendor>> {
  const map = new Map<string, SponsoredVendor>();
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
      // First paying vendor for a (zip, trade) pair wins the single display slot if more than one
      // is active at once -- ORDER BY created_at ASC above plus "set only if absent" here keeps
      // that deterministic rather than picking whichever row the DB happens to return last.
      if (!map.has(row.trade_category)) {
        map.set(row.trade_category, {
          id: String(row.id),
          zipCode: row.zip_code,
          businessName: row.business_name,
          tradeCategory: row.trade_category,
          phone: row.phone,
          website: row.website || undefined,
          tagline: row.tagline || undefined,
          active: true,
        });
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

  // --- Public: start checkout for one (zip, trade category) slot ------------------------------
  // No Clerk sign-in required, same reasoning as guideAdsApi.ts -- this is a business buying ad
  // space, not a report reader with an account, so this calls paypalService.ts directly rather
  // than the generic /api/paypal/orders route (which hard-requires a Clerk userId).
  app.post('/api/zip-ads/checkout', async (req: Request, res: Response) => {
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
        returnUrl: `${appUrl}/vendors/success`,
        cancelUrl: `${appUrl}/vendors`,
        userEmail: contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO zip_ad_orders (
          paypal_order_id, business_name, trade_category, zip_code, phone, website, tagline, contact_email, amount_usd, status
        ) VALUES (
          ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${zipCode}, ${phone}, ${website || null}, ${tagline || null},
          ${contactEmail}, ${amount}, 'pending'
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
      if (order.status === 'completed') {
        res.json({ success: true, alreadyCaptured: true, granted: true });
        return;
      }

      // Re-check availability at capture time, not just at checkout time -- someone else could
      // have bought the last slot in the gap between those two moments. Payment is still captured
      // below either way (the vendor already approved it in PayPal); if the slot is gone, that's
      // reported back clearly rather than silently either dropping the payment or overselling the
      // slot past MAX_SLOTS_PER_ZIP_TRADE.
      const slotsTaken = await countActiveSlots(order.zip_code, order.trade_category);
      const granted = slotsTaken < MAX_SLOTS_PER_ZIP_TRADE;

      const captureResult = await capturePayPalOrder(orderId);

      // Computed in JS, not a `now() + interval '${SLOT_DURATION_DAYS} days'` SQL literal -- the
      // sql`` tagged template parameterizes every ${...}, which breaks splicing a variable into a
      // quoted interval literal. A plain Date sidesteps that ambiguity entirely.
      const paidThrough = new Date(Date.now() + SLOT_DURATION_DAYS * 24 * 60 * 60 * 1000);
      await withDb(async (sql) => {
        if (granted) {
          await sql`
            INSERT INTO zip_ad_purchases (
              order_id, zip_code, trade_category, business_name, phone, website, tagline, paid_through
            ) VALUES (
              ${order.id}, ${order.zip_code}, ${order.trade_category}, ${order.business_name},
              ${order.phone}, ${order.website}, ${order.tagline}, ${paidThrough.toISOString()}
            )
          `;
        }
        await sql`
          UPDATE zip_ad_orders SET status = 'completed', paypal_capture_id = ${captureResult.captureId}, updated_at = now()
          WHERE id = ${order.id}
        `;
      });

      res.json({
        success: true,
        captureId: captureResult.captureId,
        granted,
        zipCode: order.zip_code,
        tradeCategory: order.trade_category,
      });
    } catch (err: any) {
      console.error('[zip-ads] capture failed:', err);
      try {
        await withDb((sql) => sql`UPDATE zip_ad_orders SET status = 'failed', updated_at = now() WHERE paypal_order_id = ${orderId}`);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Payment capture failed.' });
    }
  });
}
