import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES } from '../data/sponsoredVendors.js';

// Self-serve vendor ad slots on guide pages: two positions per guide ('top', 'bottom'), open
// market (any business, any guide, no trade-category matching required), $7.99 per slot for a
// flat 30-day window, no auto-renewal. See src/server/db.ts for why this is two tables
// (guide_ad_orders = checkout attempt, guide_ad_purchases = actually-sold inventory) and why
// (article_id, position) is deliberately not unique.

const PRICE_PER_SLOT_USD = 7.99;
const SLOT_DURATION_DAYS = 30;
const VALID_POSITIONS = new Set(['top', 'bottom']);

interface SlotSelection {
  articleId: number;
  position: 'top' | 'bottom';
}

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

function isValidSlotList(slots: unknown): slots is SlotSelection[] {
  return (
    Array.isArray(slots) &&
    slots.length > 0 &&
    slots.every(
      (s) =>
        s &&
        typeof s === 'object' &&
        Number.isFinite((s as any).articleId) &&
        VALID_POSITIONS.has((s as any).position)
    )
  );
}

// Shared by checkout and capture -- checkout must reject an already-taken slot before a vendor
// pays for it, and capture must re-check the same thing in case someone else bought it in the
// gap between order creation and payment completing. Same query, same definition of "taken"
// (paid_through in the future AND active), used both places so they can't quietly diverge.
async function findAlreadyTakenSlots(slots: SlotSelection[]): Promise<SlotSelection[]> {
  return withDb(async (sql) => {
    const taken: SlotSelection[] = [];
    for (const slot of slots) {
      const rows = await sql`
        SELECT id FROM guide_ad_purchases
        WHERE article_id = ${slot.articleId} AND position = ${slot.position}
          AND active = true AND paid_through > now()
        LIMIT 1
      `;
      if ((rows as unknown[]).length > 0) taken.push(slot);
    }
    return taken;
  });
}

export function registerGuideAdsRoutes(app: Express) {
  // --- Public: every published guide, with each slot's current availability ------------------
  app.get('/api/guide-ads/slots', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const guides = await withDb(
        (sql) => sql`SELECT id, slug, title FROM articles WHERE status = 'published' ORDER BY title ASC`
      );
      const takenRows = await withDb(
        (sql) => sql`SELECT article_id, position FROM guide_ad_purchases WHERE active = true AND paid_through > now()`
      );
      const takenSet = new Set(
        (takenRows as unknown as Array<{ article_id: number; position: string }>).map(
          (r) => `${r.article_id}:${r.position}`
        )
      );
      const result = (guides as unknown as Array<{ id: number; slug: string; title: string }>).map((g) => ({
        articleId: g.id,
        slug: g.slug,
        title: g.title,
        topTaken: takenSet.has(`${g.id}:top`),
        bottomTaken: takenSet.has(`${g.id}:bottom`),
      }));
      res.json({ success: true, guides: result, pricePerSlotUsd: PRICE_PER_SLOT_USD, slotDurationDays: SLOT_DURATION_DAYS });
    } catch (err: any) {
      console.error('[guide-ads] slots list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load guide ad slots.' });
    }
  });

  // --- Public: the currently active vendor for one specific slot, if any ---------------------
  // Used by GuideAdSlot.tsx to decide whether to render a real vendor card or the recruitment CTA.
  app.get('/api/guide-ads/active/:articleId/:position', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const articleId = parseInt(req.params.articleId, 10);
    const position = req.params.position;
    if (!Number.isFinite(articleId) || !VALID_POSITIONS.has(position)) {
      res.status(400).json({ success: false, error: 'Invalid slot.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT business_name, trade_category, phone, website, tagline
        FROM guide_ad_purchases
        WHERE article_id = ${articleId} AND position = ${position} AND active = true AND paid_through > now()
        ORDER BY created_at DESC LIMIT 1
      `);
      const row = (rows as unknown as any[])[0];
      if (!row) {
        res.json({ success: true, active: false });
        return;
      }
      res.json({
        success: true,
        active: true,
        vendor: {
          businessName: row.business_name,
          tradeCategory: row.trade_category,
          phone: row.phone,
          website: row.website,
          tagline: row.tagline,
        },
      });
    } catch (err: any) {
      console.error('[guide-ads] active-slot lookup failed:', err);
      res.status(500).json({ success: false, error: 'Could not load slot.' });
    }
  });

  // --- Public: start checkout for a set of selected slots ------------------------------------
  // No Clerk sign-in required -- this is a business buying ad space, not a report reader with an
  // account, and the existing generic /api/paypal/orders route hard-requires a Clerk userId, so
  // this calls paypalService.ts's functions directly rather than going through that route.
  app.post('/api/guide-ads/checkout', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { businessName, tradeCategory, phone, website, tagline, contactEmail, slots } = req.body;
    if (!businessName || typeof businessName !== 'string') {
      res.status(400).json({ success: false, error: 'Business name is required.' });
      return;
    }
    if (!tradeCategory || !(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) {
      res.status(400).json({ success: false, error: 'Please choose a valid trade category.' });
      return;
    }
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }
    if (!contactEmail || typeof contactEmail !== 'string') {
      res.status(400).json({ success: false, error: 'Contact email is required.' });
      return;
    }
    if (!isValidSlotList(slots)) {
      res.status(400).json({ success: false, error: 'Select at least one guide page slot.' });
      return;
    }

    try {
      const alreadyTaken = await findAlreadyTakenSlots(slots);
      if (alreadyTaken.length > 0) {
        res.status(409).json({
          success: false,
          error: 'One or more selected slots were just taken by another advertiser.',
          takenSlots: alreadyTaken,
        });
        return;
      }

      const amount = (slots.length * PRICE_PER_SLOT_USD).toFixed(2);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret guide ad -- ${slots.length} slot${slots.length === 1 ? '' : 's'} x 30 days`,
        returnUrl: `${appUrl}/advertise/success`,
        cancelUrl: `${appUrl}/advertise`,
        userEmail: contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, tagline, contact_email, slots_json, amount_usd, status
        ) VALUES (
          ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${phone}, ${website || null}, ${tagline || null},
          ${contactEmail}, ${JSON.stringify(slots)}, ${amount}, 'pending'
        )
      `);

      // Same approval-URL shape the generic /api/paypal/orders route builds -- the client does a
      // full-page redirect here, there's no PayPal JS SDK button on this page.
      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, amount, approvalUrl });
    } catch (err: any) {
      console.error('[guide-ads] checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start checkout.' });
    }
  });

  // --- Public: capture payment and activate whichever slots are still available --------------
  app.post('/api/guide-ads/checkout/:orderId/capture', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { orderId } = req.params;
    try {
      const orderRows = await withDb((sql) => sql`SELECT * FROM guide_ad_orders WHERE paypal_order_id = ${orderId} LIMIT 1`);
      const order = (orderRows as unknown as any[])[0];
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }
      if (order.status === 'completed') {
        res.json({ success: true, alreadyCaptured: true });
        return;
      }

      const requestedSlots = JSON.parse(order.slots_json) as SlotSelection[];
      // Re-check availability at capture time, not just at order-creation time -- a slot can be
      // bought by someone else in the gap between those two moments. Slots that lost the race are
      // simply skipped rather than failing the whole order; the vendor is still charged for what
      // they selected (PayPal capture happens below regardless), so this is reported back
      // clearly rather than silently dropping paid-for inventory.
      const stillTaken = await findAlreadyTakenSlots(requestedSlots);
      const stillTakenKeys = new Set(stillTaken.map((s) => `${s.articleId}:${s.position}`));
      const grantedSlots = requestedSlots.filter((s) => !stillTakenKeys.has(`${s.articleId}:${s.position}`));

      const captureResult = await capturePayPalOrder(orderId);

      // Computed in JS, not as a `now() + interval '${SLOT_DURATION_DAYS} days'` SQL literal --
      // the sql`` tagged template parameterizes every ${...} it's given, which breaks trying to
      // splice a variable into a quoted interval literal. A plain Date is unambiguous either way.
      const paidThrough = new Date(Date.now() + SLOT_DURATION_DAYS * 24 * 60 * 60 * 1000);
      await withDb(async (sql) => {
        for (const slot of grantedSlots) {
          await sql`
            INSERT INTO guide_ad_purchases (
              order_id, article_id, position, business_name, trade_category, phone, website, tagline, paid_through
            ) VALUES (
              ${order.id}, ${slot.articleId}, ${slot.position}, ${order.business_name}, ${order.trade_category},
              ${order.phone}, ${order.website}, ${order.tagline}, ${paidThrough.toISOString()}
            )
          `;
        }
        await sql`
          UPDATE guide_ad_orders SET status = 'completed', paypal_capture_id = ${captureResult.captureId}, updated_at = now()
          WHERE id = ${order.id}
        `;
      });

      res.json({
        success: true,
        captureId: captureResult.captureId,
        grantedSlots,
        skippedSlots: stillTaken,
      });
    } catch (err: any) {
      console.error('[guide-ads] capture failed:', err);
      try {
        await withDb((sql) => sql`UPDATE guide_ad_orders SET status = 'failed', updated_at = now() WHERE paypal_order_id = ${orderId}`);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Payment capture failed.' });
    }
  });
}
