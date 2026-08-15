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

// Exported so myAdsApi.ts can quote the real renewal price to the vendor before sending them to
// PayPal -- the placement manager used to send them straight to a payment page with the amount
// never shown anywhere in our own UI.
export const PRICE_PER_SLOT_USD = 7.99;
export const SLOT_DURATION_DAYS = 30;
const SLOT_POSITION = 'top';

// ============================================================================================
// TEMPORARY -- $1 live-payment smoke test. REVERT TO PRICE_PER_SLOT_USD WHEN THE TEST IS DONE.
// ============================================================================================
// The one hop nothing else can exercise is PayPal actually returning a capture id and this code
// running against it: sandbox credentials aren't configured, and every other part of the renewal
// path is already verified against the real database. So renewals are temporarily priced at $1
// to drive one genuine payment through end to end.
//
// Scoped to renewals only -- new checkouts on /topic-ads still charge PRICE_PER_SLOT_USD -- and
// deliberately used for BOTH the amount charged and the amount myAdsApi.ts quotes in the
// dashboard, so the confirmation the vendor sees can never disagree with what PayPal bills.
export const GUIDE_RENEWAL_PRICE_USD = 1.00;

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
      // A renewal order must never be captured here: its slots_json is '[]' (it claims no new
      // inventory), so this route would happily take the vendor's money, insert zero purchases,
      // and mark the order completed -- charged, nothing granted, no extension. The renew capture
      // route has always had the mirror guard; this side was missing it.
      if (order.renews_purchase_id) {
        res.status(400).json({ success: false, error: 'This is a renewal order -- capture it through the renewal route.' });
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

      // Capture, then persist the capture id BEFORE doing anything else. Money moving at PayPal
      // is the one step that can't be undone or replayed, so it has to leave a durable trace the
      // moment it succeeds -- otherwise a failure anywhere below (a DB blip, a lost connection)
      // left the order marked 'failed' with the charge already taken, and a retry would call
      // PayPal again, get ORDER_ALREADY_CAPTURED, and fail forever. An order that already carries
      // a capture id skips straight past the PayPal call and resumes where it left off.
      let captureId: string = order.paypal_capture_id;
      if (!captureId) {
        const captureResult = await capturePayPalOrder(orderId);
        captureId = captureResult.captureId;
        await withDb((sql) => sql`
          UPDATE guide_ad_orders SET paypal_capture_id = ${captureId}, updated_at = now() WHERE id = ${order.id}
        `);
      }

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
          UPDATE guide_ad_orders SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
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
        captureId,
        paidThrough: paidThrough.toISOString(),
        grantedGuides: toGuideList(grantedArticleIds),
        skippedGuides: toGuideList(skippedArticleIds),
      });
    } catch (err: any) {
      console.error('[guide-ads] capture failed:', err);
      try {
        // Never overwrite a completed order, and never mark an order failed once its payment has
        // actually been captured -- 'failed' hides it from the vendor's order history, and an
        // order holding a capture id represents real money that still needs its slots granted, so
        // it has to stay in a retryable state rather than being written off.
        await withDb((sql) => sql`
          UPDATE guide_ad_orders SET status = 'failed', updated_at = now()
          WHERE paypal_order_id = ${orderId} AND status <> 'completed' AND paypal_capture_id IS NULL
        `);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Payment capture failed.' });
    }
  });

  // --- Renew: extend a placement the signed-in vendor already owns, in place ------------------
  // Deliberately a separate flow from /api/guide-ads/checkout above, not a variant of it -- that
  // route's availability check (findAlreadyTakenArticleIds) would always reject a still-active
  // slot as "taken," which is exactly the vendor's own placement (confirmed live before this was
  // built: renewing inside the old 5-day-left window still 409'd with "taken by another
  // advertiser"). Renewal never contends for availability at all -- ownership (verified via
  // clerk_user_id, same join pattern as myAdsApi.ts's edit routes) is the only check that
  // matters, and capture extends paid_through on the existing row instead of inserting a new one.
  app.post('/api/guide-ads/renew/:purchaseId', requireVerifiedUser, async (req: Request, res: Response) => {
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
      // active = true matters here, not just ownership: a placement pulled by an admin never
      // renders, so letting a vendor pay to extend one would be taking money for nothing. The
      // dashboard already hides those (its own query filters on active), but this endpoint is
      // reachable directly and has to enforce the same thing itself.
      const owned = await withDb((sql) => sql`
        SELECT p.id, p.paid_through, o.contact_email
        FROM guide_ad_purchases p JOIN guide_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} AND p.active = true LIMIT 1
      `);
      const purchase = (owned as unknown as Array<{ id: number; paid_through: string; contact_email: string }>)[0];
      if (!purchase) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      // Renewal only makes sense while still genuinely active -- once actually expired, the slot
      // may already belong to someone else, so that case goes through the normal "Buy again"
      // checkout flow instead (see MyAdsPanel.tsx's Expired section), not this one.
      if (new Date(purchase.paid_through).getTime() <= Date.now()) {
        res.status(409).json({ success: false, error: 'This placement has already expired -- buy it again from My Placements instead.' });
        return;
      }

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      // PayPal appends `&token=<orderId>` to this on redirect back -- see
      // GuideAdsCheckoutSuccess.tsx's own returnUrl handling for the same pattern this mirrors.
      const paypalOrder = await createPayPalOrder({
        amount: GUIDE_RENEWAL_PRICE_USD.toFixed(2), // TEMPORARY test price -- see the constant
        currency: 'USD',
        type: 'vendor_subscription',
        description: `BeforeRegret guide ad renewal -- ${SLOT_DURATION_DAYS} more days`,
        returnUrl: `${appUrl}/my-ads?renewed=guide`,
        cancelUrl: `${appUrl}/my-ads`,
        userEmail: purchase.contact_email,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, tagline, contact_email,
          slots_json, amount_usd, status, clerk_user_id, renews_purchase_id
        )
        SELECT ${paypalOrder.orderId}, business_name, trade_category, phone, website, tagline,
               ${purchase.contact_email}, '[]', ${GUIDE_RENEWAL_PRICE_USD.toFixed(2)}, 'pending', ${clerkUserId}, ${purchaseId}
        FROM guide_ad_purchases WHERE id = ${purchaseId}
      `);

      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, approvalUrl });
    } catch (err: any) {
      console.error('[guide-ads] renew checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start renewal.' });
    }
  });

  // --- Public: capture a renewal payment and extend the existing placement --------------------
  // No requireVerifiedUser here, same as the regular capture route above -- this is reached from
  // PayPal's redirect back, identified by the unguessable orderId it was created against, not a
  // fresh Authorization header. Ownership was already verified once, at renewal-checkout time.
  app.post('/api/guide-ads/renew/:orderId/capture', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const { orderId } = req.params;
    try {
      const orderRows = await withDb((sql) => sql`SELECT * FROM guide_ad_orders WHERE paypal_order_id = ${orderId} LIMIT 1`);
      const order = (orderRows as unknown as any[])[0];
      if (!order || !order.renews_purchase_id) {
        res.status(404).json({ success: false, error: 'Renewal order not found.' });
        return;
      }

      // Reload-safety, same reasoning as the regular capture route: rebuild from what's actually
      // persisted rather than re-capturing (and re-extending) an already-completed renewal.
      if (order.status === 'completed') {
        const rows = await withDb((sql) => sql`
          SELECT p.paid_through, a.slug, a.title FROM guide_ad_purchases p JOIN articles a ON a.id = p.article_id
          WHERE p.id = ${order.renews_purchase_id} LIMIT 1
        `);
        const row = (rows as unknown as Array<{ paid_through: string; slug: string; title: string }>)[0];
        res.json({ success: true, alreadyCaptured: true, paidThrough: row?.paid_through ?? null, slug: row?.slug, title: row?.title });
        return;
      }

      // Same capture-id-first rule as the checkout route above: persist the fact that money moved
      // before touching anything else, and skip PayPal entirely on a retry that already has one.
      let captureId: string = order.paypal_capture_id;
      if (!captureId) {
        const captureResult = await capturePayPalOrder(orderId);
        captureId = captureResult.captureId;
        await withDb((sql) => sql`
          UPDATE guide_ad_orders SET paypal_capture_id = ${captureId}, updated_at = now() WHERE id = ${order.id}
        `);
      }

      // Completing the order and extending the placement are one statement, not two, with the
      // order's own status transition acting as the lock: the CTE only yields a row if this order
      // wasn't already completed, so a concurrent (or retried) capture that loses the race updates
      // zero purchase rows instead of stacking a second +30 days onto the same payment. Splitting
      // these apart is what made a mid-sequence failure unrecoverable before.
      //
      // GREATEST(paid_through, now()) rather than always adding to the stored paid_through -- if
      // payment took long enough that the placement slipped past expiry mid-checkout, extending
      // from a stale past date would under-credit the vendor for however long it sat expired.
      // Multiplying an interval literal by a parameterized count (rather than splicing
      // SLOT_DURATION_DAYS into a quoted interval string) sidesteps the same sql`` parameterization
      // issue noted in the regular capture route above.
      //
      // contact_edited resets here because the vendor is buying a fresh 30-day term: the one-edit
      // allowance is per paid window, not per row for all time. Carrying the old lock forward left
      // someone who fixed a typo in month one unable to correct a changed phone number ever again.
      const rows = await withDb((sql) => sql`
        WITH claimed AS (
          UPDATE guide_ad_orders
          SET status = 'completed', paypal_capture_id = ${captureId}, updated_at = now()
          WHERE id = ${order.id} AND status <> 'completed'
          RETURNING renews_purchase_id
        )
        UPDATE guide_ad_purchases p
        SET paid_through = GREATEST(p.paid_through, now()) + (${SLOT_DURATION_DAYS} * interval '1 day'),
            contact_edited = false
        FROM claimed
        WHERE p.id = claimed.renews_purchase_id
        RETURNING p.paid_through, p.article_id
      `);
      const updated = (rows as unknown as Array<{ paid_through: string; article_id: number }>)[0];

      // No row means another request completed this same order first -- report what's actually
      // stored rather than pretending this call applied an extension it didn't.
      if (!updated) {
        const existing = await withDb((sql) => sql`
          SELECT p.paid_through, a.slug, a.title FROM guide_ad_purchases p JOIN articles a ON a.id = p.article_id
          WHERE p.id = ${order.renews_purchase_id} LIMIT 1
        `);
        const row = (existing as unknown as Array<{ paid_through: string; slug: string; title: string }>)[0];
        res.json({ success: true, alreadyCaptured: true, captureId, paidThrough: row?.paid_through ?? null, slug: row?.slug, title: row?.title });
        return;
      }

      const articleRows = await withDb((sql) => sql`SELECT slug, title FROM articles WHERE id = ${updated.article_id} LIMIT 1`);
      const article = (articleRows as unknown as Array<{ slug: string; title: string }>)[0];

      res.json({
        success: true,
        captureId,
        paidThrough: updated.paid_through,
        slug: article?.slug,
        title: article?.title,
      });
    } catch (err: any) {
      console.error('[guide-ads] renew capture failed:', err);
      try {
        // Same reasoning as the checkout capture route: an order whose payment already went
        // through must stay retryable rather than being written off as failed.
        await withDb((sql) => sql`
          UPDATE guide_ad_orders SET status = 'failed', updated_at = now()
          WHERE paypal_order_id = ${orderId} AND status <> 'completed' AND paypal_capture_id IS NULL
        `);
      } catch { /* best effort */ }
      res.status(500).json({ success: false, error: err.message || 'Renewal payment capture failed.' });
    }
  });
}
