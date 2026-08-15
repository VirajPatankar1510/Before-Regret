import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES } from '../data/sponsoredVendors.js';
import { requireVerifiedUser } from './clerkAuth.js';

// Self-serve vendor ad slots on guide pages: one slot per guide, open market (any business, any
// guide, no trade-category matching required), $7.99 per slot for a flat 30-day window, no
// auto-renewal. Used to be two slots per guide ('top', 'bottom') at the same price -- retired
// because a rational vendor always bought 'top' (it sits right after the Quick Answer; 'bottom'
// sits after the whole article), so 'bottom' never sold and every guide showed two empty
// recruitment CTAs instead of one. The `position` column stays on guide_ad_purchases (always
// 'top' for anything sold from here on) rather than being dropped, so a second placement can come
// back later without a migration -- see src/server/db.ts for why this is two tables
// (guide_ad_orders = checkout attempt, guide_ad_purchases = actually-sold inventory) and why
// (article_id, position) is deliberately not unique.

const PRICE_PER_SLOT_USD = 7.99;
const SLOT_DURATION_DAYS = 30;
const SLOT_POSITION = 'top';

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

function isValidArticleIdList(slots: unknown): slots is number[] {
  return Array.isArray(slots) && slots.length > 0 && slots.every((id) => Number.isFinite(id));
}

// Shared by checkout and capture -- checkout must reject an already-taken slot before a vendor
// pays for it, and capture must re-check the same thing in case someone else bought it in the
// gap between order creation and payment completing. Same query, same definition of "taken"
// (paid_through in the future AND active), used both places so they can't quietly diverge.
async function findAlreadyTakenArticleIds(articleIds: number[]): Promise<number[]> {
  return withDb(async (sql) => {
    const taken: number[] = [];
    for (const articleId of articleIds) {
      const rows = await sql`
        SELECT id FROM guide_ad_purchases
        WHERE article_id = ${articleId} AND position = ${SLOT_POSITION}
          AND active = true AND paid_through > now()
        LIMIT 1
      `;
      if ((rows as unknown[]).length > 0) taken.push(articleId);
    }
    return taken;
  });
}

export function registerGuideAdsRoutes(app: Express) {
  // --- Public: every published guide, with its slot's current availability -------------------
  app.get('/api/guide-ads/slots', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const guides = await withDb(
        (sql) => sql`SELECT id, slug, title FROM articles WHERE status = 'published' ORDER BY title ASC`
      );
      const takenRows = await withDb(
        (sql) => sql`SELECT article_id FROM guide_ad_purchases WHERE position = ${SLOT_POSITION} AND active = true AND paid_through > now()`
      );
      const takenSet = new Set((takenRows as unknown as Array<{ article_id: number }>).map((r) => r.article_id));
      const result = (guides as unknown as Array<{ id: number; slug: string; title: string }>).map((g) => ({
        articleId: g.id,
        slug: g.slug,
        title: g.title,
        taken: takenSet.has(g.id),
      }));
      res.json({ success: true, guides: result, pricePerSlotUsd: PRICE_PER_SLOT_USD, slotDurationDays: SLOT_DURATION_DAYS });
    } catch (err: any) {
      console.error('[guide-ads] slots list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load guide ad slots.' });
    }
  });

  // --- Public: the currently active vendor for one guide's slot, if any -----------------------
  // Used by GuideAdSlot.tsx to decide whether to render a real vendor card or the recruitment CTA.
  app.get('/api/guide-ads/active/:articleId', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const articleId = parseInt(req.params.articleId, 10);
    if (!Number.isFinite(articleId)) {
      res.status(400).json({ success: false, error: 'Invalid slot.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT business_name, trade_category, phone, website, tagline
        FROM guide_ad_purchases
        WHERE article_id = ${articleId} AND position = ${SLOT_POSITION} AND active = true AND paid_through > now()
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

  // --- Start checkout for a set of selected guide slots ---------------------------------------
  // Guide browsing and the business form stay public (GuideAdsCheckout.tsx renders both before
  // sign-in), but the actual checkout write requires a verified Clerk session -- requireVerifiedUser
  // checks the Authorization: Bearer token against Clerk's own signing keys and sets
  // req.verifiedUserId, which is what gets stored as guide_ad_orders.clerk_user_id below. This
  // used to trust a client-sent `clerkUserId` field with no verification at all; that would have
  // let anyone attribute an order (and later, read/edit it via /my-ads) to any account they typed
  // in, not just their own. This calls paypalService.ts's functions directly rather than the
  // generic /api/paypal/orders route, which has its own separate Clerk userId handling.
  app.post('/api/guide-ads/checkout', requireVerifiedUser, async (req: Request, res: Response) => {
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
    if (!isValidArticleIdList(slots)) {
      res.status(400).json({ success: false, error: 'Select at least one guide page.' });
      return;
    }

    try {
      const alreadyTaken = await findAlreadyTakenArticleIds(slots);
      if (alreadyTaken.length > 0) {
        res.status(409).json({
          success: false,
          error: 'One or more selected guides were just taken by another advertiser.',
          takenArticleIds: alreadyTaken,
        });
        return;
      }

      const amount = (slots.length * PRICE_PER_SLOT_USD).toFixed(2);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret guide ad -- ${slots.length} guide${slots.length === 1 ? '' : 's'} x 30 days`,
        returnUrl: `${appUrl}/topic-ads/success`,
        cancelUrl: `${appUrl}/topic-ads`,
        userEmail: contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, tagline, contact_email, slots_json, amount_usd, status, clerk_user_id
        ) VALUES (
          ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${phone}, ${website || null}, ${tagline || null},
          ${contactEmail}, ${JSON.stringify(slots)}, ${amount}, 'pending', ${req.verifiedUserId as string}
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
      // A page refresh (or the client re-firing the capture call on mount) lands here on the
      // second hit -- rebuild the same shape from what was actually persisted, rather than the
      // bare acknowledgement this used to return, so the success page still has real details to
      // show instead of going blank on a reload.
      if (order.status === 'completed') {
        const purchased = await withDb((sql) => sql`
          SELECT p.article_id, a.slug, a.title, p.paid_through
          FROM guide_ad_purchases p JOIN articles a ON a.id = p.article_id
          WHERE p.order_id = ${order.id}
          ORDER BY a.title ASC
        `);
        const rows = purchased as unknown as Array<{ article_id: number; slug: string; title: string; paid_through: string }>;
        res.json({
          success: true,
          alreadyCaptured: true,
          captureId: order.paypal_capture_id,
          paidThrough: rows[0]?.paid_through ?? null,
          grantedGuides: rows.map((r) => ({ articleId: r.article_id, slug: r.slug, title: r.title })),
          skippedGuides: [],
        });
        return;
      }

      const requestedArticleIds = JSON.parse(order.slots_json) as number[];
      const captureResult = await capturePayPalOrder(orderId);

      // Computed in JS, not as a `now() + interval '${SLOT_DURATION_DAYS} days'` SQL literal --
      // the sql`` tagged template parameterizes every ${...} it's given, which breaks trying to
      // splice a variable into a quoted interval literal. A plain Date is unambiguous either way.
      const paidThrough = new Date(Date.now() + SLOT_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const grantedArticleIds: number[] = [];
      const skippedArticleIds: number[] = [];
      await withDb(async (sql) => {
        for (const articleId of requestedArticleIds) {
          // The availability check and the insert used to be two separate round trips (a
          // findAlreadyTakenArticleIds SELECT, then an unconditional INSERT), which left a real
          // race window: two vendors' capture calls for the same guide, close enough together,
          // could both pass the SELECT before either INSERT landed, and both PayPal captures
          // still succeed either way (that money is already spent by the time we're here) so
          // neither vendor's charge could be undone after the fact. Folding the check into the
          // INSERT's own WHERE NOT EXISTS makes Postgres evaluate "is this slot still free" and
          // "claim it" as one atomic statement, so only the first insert to arrive can ever win.
          const inserted = await sql`
            INSERT INTO guide_ad_purchases (
              order_id, article_id, position, business_name, trade_category, phone, website, tagline, paid_through
            )
            SELECT ${order.id}, ${articleId}, ${SLOT_POSITION}, ${order.business_name}, ${order.trade_category},
                   ${order.phone}, ${order.website}, ${order.tagline}, ${paidThrough.toISOString()}
            WHERE NOT EXISTS (
              SELECT 1 FROM guide_ad_purchases
              WHERE article_id = ${articleId} AND position = ${SLOT_POSITION} AND active = true AND paid_through > now()
            )
            RETURNING id
          `;
          if ((inserted as unknown[]).length > 0) {
            grantedArticleIds.push(articleId);
          } else {
            skippedArticleIds.push(articleId);
          }
        }
        await sql`
          UPDATE guide_ad_orders SET status = 'completed', paypal_capture_id = ${captureResult.captureId}, updated_at = now()
          WHERE id = ${order.id}
        `;
      });

      // Titles resolved one-by-one after the insert above, same loop-per-id shape as
      // findAlreadyTakenArticleIds -- the list is at most however many guides one vendor selected
      // in one checkout, never worth a batched IN/ANY query for.
      const titleMap = new Map<number, { slug: string; title: string }>();
      await withDb(async (sql) => {
        for (const id of new Set([...grantedArticleIds, ...skippedArticleIds])) {
          const rows = await sql`SELECT slug, title FROM articles WHERE id = ${id} LIMIT 1`;
          const row = (rows as unknown as Array<{ slug: string; title: string }>)[0];
          if (row) titleMap.set(id, row);
        }
      });
      const toGuideList = (ids: number[]) =>
        ids.map((id) => {
          const t = titleMap.get(id);
          return { articleId: id, slug: t?.slug ?? '', title: t?.title ?? `Guide #${id}` };
        });

      res.json({
        success: true,
        captureId: captureResult.captureId,
        paidThrough: paidThrough.toISOString(),
        grantedGuides: toGuideList(grantedArticleIds),
        skippedGuides: toGuideList(skippedArticleIds),
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
