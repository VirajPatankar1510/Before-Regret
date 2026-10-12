import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { isPayPalConfigured, createPayPalOrder, capturePayPalOrder } from './paypalService.js';
import { TRADE_CATEGORIES, requiresLicenceNumber } from '../data/sponsoredVendors.js';
import { requireVerifiedUser } from './clerkAuth.js';
import { TERMS_VERSION } from '../data/legalVersions.js';
import { checkVendorWebsite } from '../data/vendorWebsite.js';
import { AD_CLUSTERS, MIN_OPEN_GUIDES_FOR_SPONSORSHIP, adClusterByKey, adClusterForGuide } from '../data/adClusters.js';
import {
  AD_CLUSTER_PRICE_USD,
  GUIDE_AD_TIER_PRICES_USD,
  SLOT_DURATION_DAYS,
  normaliseTier,
  priceForTier,
  quoteGuideSlots,
  quoteGuideRenewal,
  GuideNotSellableError,
} from './adPricing.js';

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

// Pricing moved to adPricing.ts when the flat rate became two tiers -- see that file for why a
// county guide and a national one stopped costing the same. PRICE_PER_SLOT_USD is kept as the
// standard-tier price so existing importers keep compiling, but nothing here should compute a
// charge from it: an amount must come from quoteGuideSlots(), which reads each guide's tier from
// the database rather than assuming every slot costs alike.
export const PRICE_PER_SLOT_USD = GUIDE_AD_TIER_PRICES_USD.standard;
export { SLOT_DURATION_DAYS };
const SLOT_POSITION = 'top';

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

function isValidArticleIdList(slots: unknown): slots is number[] {
  return Array.isArray(slots) && slots.length > 0 && slots.every((id) => Number.isFinite(id));
}

type Sql = Parameters<Parameters<typeof withDb>[0]>[0];

// Topic sponsorships with a live placement right now (see src/data/adClusters.ts). Same definition
// of "live" as every other availability check in this file.
async function sponsoredClusterKeys(sql: Sql): Promise<Set<string>> {
  const rows = await sql`
    SELECT DISTINCT cluster_key FROM guide_ad_purchases
    WHERE cluster_key IS NOT NULL AND position = ${SLOT_POSITION} AND active = true AND paid_through > now()
  `;
  return new Set((rows as unknown as Array<{ cluster_key: string }>).map((r) => r.cluster_key));
}

// Whether a guide is covered by a live topic sponsorship. A sponsored cluster's guides are sold out
// as single slots: the sponsor bought "the only advertiser on every guide in this topic", and that
// includes guides published after they paid, which have no purchase row of their own.
async function isInSponsoredCluster(sql: Sql, articleId: number, sponsored: Set<string>): Promise<boolean> {
  if (sponsored.size === 0) return false;
  const rows = await sql`SELECT slug, title FROM articles WHERE id = ${articleId} LIMIT 1`;
  const row = (rows as unknown as Array<{ slug: string; title: string }>)[0];
  const cluster = row ? adClusterForGuide(row.slug, row.title) : null;
  return cluster !== null && sponsored.has(cluster.key);
}

// Shared by checkout and capture -- checkout must reject an already-taken slot before a vendor
// pays for it, and capture must re-check the same thing in case someone else bought it in the
// gap between order creation and payment completing. Same query, same definition of "taken"
// (paid_through in the future AND active), used both places so they can't quietly diverge.
async function findAlreadyTakenArticleIds(articleIds: number[]): Promise<number[]> {
  return withDb(async (sql) => {
    const sponsored = await sponsoredClusterKeys(sql);
    const taken: number[] = [];
    for (const articleId of articleIds) {
      // cluster_key IS NULL: a topic sponsorship's row sits on its anchor guide but is not that
      // guide's single-guide advertiser; the sponsorship check below covers it.
      const rows = await sql`
        SELECT id FROM guide_ad_purchases
        WHERE article_id = ${articleId} AND position = ${SLOT_POSITION} AND cluster_key IS NULL
          AND active = true AND paid_through > now()
        LIMIT 1
      `;
      if ((rows as unknown[]).length > 0 || (await isInSponsoredCluster(sql, articleId, sponsored))) taken.push(articleId);
    }
    return taken;
  });
}

type VendorDetails =
  | { ok: false; error: string }
  | {
      ok: true; businessName: string; tradeCategory: string; phone: string; contactEmail: string;
      website: string | null; licenceNumber: string;
    };

// The business details both checkouts (single guides and topic sponsorships) collect, validated
// once. A rule enforced on one checkout and not the other would just move a vendor to the other.
function readVendorDetails(body: any): VendorDetails {
  const { businessName, tradeCategory, phone, website, contactEmail, attestedAccurate, licenceNumber } = body || {};
  if (!businessName || typeof businessName !== 'string') return { ok: false, error: 'Business name is required.' };
  if (!tradeCategory || !(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) {
    return { ok: false, error: 'Please choose a valid trade category.' };
  }
  if (!phone || typeof phone !== 'string') return { ok: false, error: 'Phone number is required.' };
  if (!contactEmail || typeof contactEmail !== 'string') return { ok: false, error: 'Contact email is required.' };
  if (attestedAccurate !== true) {
    return { ok: false, error: 'You must accept the Terms of Service and confirm your business details before checking out.' };
  }
  // Mirrors the identical check in zipAdsApi.ts's checkout -- both ad products are advertising for
  // the same trades, so a licence requirement enforced on only one of them would just move an
  // unlicensed advertiser to the cheaper product. See requiresLicenceNumber() for the rationale.
  const trimmedLicence = typeof licenceNumber === 'string' ? licenceNumber.trim() : '';
  if (requiresLicenceNumber(tradeCategory)) {
    if (trimmedLicence.length < 3) {
      return { ok: false, error: 'A licence, registration, or certification number is required for this trade category.' };
    }
    if (trimmedLicence.length > 60) {
      return { ok: false, error: 'That licence number looks too long -- please enter just the number.' };
    }
  }
  // Official business website only -- see src/data/vendorWebsite.ts. Normalised value is what's stored.
  const site = checkVendorWebsite(website);
  if (!site.ok) return { ok: false, error: site.error as string };
  return {
    ok: true, businessName, tradeCategory, phone, contactEmail, website: site.url ?? null, licenceNumber: trimmedLicence,
  };
}

/** What the success page needs to say "you sponsor the Stucco & EIFS guides" instead of naming one guide. */
function clusterSummary(key: unknown): { key: string; name: string } | null {
  const cluster = adClusterByKey(key);
  return cluster ? { key: cluster.key, name: cluster.name } : null;
}

function approvalUrlFor(orderId: string): string {
  return `https://www.${
    process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
  }/cgi-bin/webscr?cmd=_express-checkout&token=${orderId}`;
}

export function registerGuideAdsRoutes(app: Express) {
  // --- Public: every published guide, with its slot's current availability -------------------
  app.get('/api/guide-ads/slots', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const guides = await withDb(
        (sql) => sql`SELECT id, slug, title, ad_tier FROM articles WHERE status = 'published' ORDER BY title ASC`
      );
      const takenRows = await withDb(
        (sql) => sql`SELECT article_id FROM guide_ad_purchases WHERE position = ${SLOT_POSITION} AND cluster_key IS NULL AND active = true AND paid_through > now()`
      );
      const takenSet = new Set((takenRows as unknown as Array<{ article_id: number }>).map((r) => r.article_id));
      const sponsored = await withDb((sql) => sponsoredClusterKeys(sql));
      // Each guide now carries its own price. The client renders these and sums them for display,
      // but the amount actually charged is always recomputed server-side at checkout from the same
      // ad_tier column -- see quoteGuideSlots(). What's shown here is a quote, never the invoice.
      const guideRows = guides as unknown as Array<{ id: number; slug: string; title: string; ad_tier: string }>;
      const result = guideRows.map((g) => {
        const tier = normaliseTier(g.ad_tier);
        const cluster = adClusterForGuide(g.slug, g.title);
        return {
          articleId: g.id,
          slug: g.slug,
          title: g.title,
          // A guide inside a sponsored topic is taken even with no purchase row of its own.
          taken: takenSet.has(g.id) || (cluster !== null && sponsored.has(cluster.key)),
          tier,
          priceUsd: priceForTier(tier),
          clusterKey: cluster?.key ?? null,
        };
      });
      // Topic sponsorships on offer. Only topics nobody sponsors yet, and only while at least
      // MIN_OPEN_GUIDES_FOR_SPONSORSHIP of their guides are open (owner rule 2026-10-12). Every member
      // is listed, with `taken` marking the ones a single-guide advertiser holds, so the vendor sees
      // exactly which pages the sponsorship starts on.
      const clusters = AD_CLUSTERS.flatMap((c) => {
        const members = guideRows.filter((g) => adClusterForGuide(g.slug, g.title)?.key === c.key);
        const open = members.filter((g) => !takenSet.has(g.id));
        if (!members.some((g) => g.slug === c.anchorSlug)) return [];
        if (sponsored.has(c.key) || open.length < MIN_OPEN_GUIDES_FOR_SPONSORSHIP) return [];
        return [{
          key: c.key,
          name: c.name,
          priceUsd: AD_CLUSTER_PRICE_USD,
          trades: c.trades,
          openCount: open.length,
          guides: members.map((g) => ({ articleId: g.id, slug: g.slug, title: g.title, taken: takenSet.has(g.id) })),
        }];
      });
      res.json({
        success: true,
        guides: result,
        clusters,
        // Retained for older clients that read a single flat price; current ones use guide.priceUsd.
        pricePerSlotUsd: PRICE_PER_SLOT_USD,
        tierPricesUsd: GUIDE_AD_TIER_PRICES_USD,
        slotDurationDays: SLOT_DURATION_DAYS,
      });
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
      // Joined to articles so an unpublished guide reports no active vendor. Third place the same
      // rule is enforced, after the renew route's article_status check and its older `active = true`
      // check: an ad on a page that isn't published is being shown to nobody, so answering
      // "active: true" states something that isn't true about the world.
      //
      // Today nothing reaches this with an unpublished id -- GuideAdSlot only renders on published
      // guide pages -- so this changes no behaviour a reader can see. It matters for the case that
      // is not hypothetical: a guide unpublished while a placement is still paid and live. That
      // silently stops delivering, and an endpoint still reporting the vendor as active is the
      // thing that would keep it looking fine.
      const rows = await withDb((sql) => sql`
        SELECT p.id, p.business_name, p.trade_category, p.phone, p.website, p.licence_number
        FROM guide_ad_purchases p
        JOIN articles a ON a.id = p.article_id
        WHERE p.article_id = ${articleId} AND p.position = ${SLOT_POSITION} AND p.cluster_key IS NULL
          AND p.active = true AND p.paid_through > now()
          AND a.status = 'published'
        ORDER BY p.created_at DESC LIMIT 1
      `);
      let row = (rows as unknown as any[])[0];
      // No advertiser of its own: the guide may sit in a sponsored topic. That sponsor's row is
      // stored on the cluster's anchor guide and shown on every member, including guides published
      // after the sponsor paid (see src/data/adClusters.ts). Clicks attribute to that same row.
      if (!row) {
        const articleRows = await withDb((sql) => sql`
          SELECT slug, title FROM articles WHERE id = ${articleId} AND status = 'published' LIMIT 1
        `);
        const article = (articleRows as unknown as Array<{ slug: string; title: string }>)[0];
        const cluster = article ? adClusterForGuide(article.slug, article.title) : null;
        if (cluster) {
          const sponsorRows = await withDb((sql) => sql`
            SELECT p.id, p.business_name, p.trade_category, p.phone, p.website, p.licence_number
            FROM guide_ad_purchases p
            JOIN articles a ON a.id = p.article_id
            WHERE p.cluster_key = ${cluster.key} AND p.position = ${SLOT_POSITION}
              AND p.active = true AND p.paid_through > now()
              AND a.status = 'published'
            ORDER BY p.created_at DESC LIMIT 1
          `);
          row = (sponsorRows as unknown as any[])[0];
        }
      }
      if (!row) {
        res.json({ success: true, active: false });
        return;
      }
      res.json({
        success: true,
        active: true,
        vendor: {
          // The placement id, needed by the client to attribute a click to the right advertiser
          // (see adClicksApi.ts). Safe to expose: it identifies an ad that is already public on
          // this page, and every route that accepts it re-checks the placement is live and paid
          // before doing anything with it.
          purchaseId: row.id,
          businessName: row.business_name,
          tradeCategory: row.trade_category,
          phone: row.phone,
          website: row.website,
          licenceNumber: row.licence_number || undefined,
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
    const vendor = readVendorDetails(req.body);
    if ('error' in vendor) {
      res.status(400).json({ success: false, error: vendor.error });
      return;
    }
    const { businessName, tradeCategory, phone, contactEmail } = vendor;
    const { slots } = req.body;
    if (!isValidArticleIdList(slots)) {
      res.status(400).json({ success: false, error: 'Select at least one guide page.' });
      return;
    }
    // Deduplicated before anything prices or persists it. A guide can only be sold once -- capture's
    // INSERT ... WHERE NOT EXISTS grants the first copy and skips the rest -- but the amount was
    // computed from the raw list, so a cart containing the same id twice charged twice and granted
    // once. The checkout UI selects into a Set and so can't produce that, but this route accepts
    // whatever JSON array it is handed, and a retry or a hand-made request is enough.
    //
    // Deduping here rather than at pricing time is deliberate: slots_json is written from this same
    // list and read back by capture, so a duplicate surviving to storage would reappear as a
    // "skipped" guide on the vendor's receipt for a slot they were charged for.
    const uniqueSlots = [...new Set(slots)];

    try {
      const alreadyTaken = await findAlreadyTakenArticleIds(uniqueSlots);
      if (alreadyTaken.length > 0) {
        res.status(409).json({
          success: false,
          error: 'One or more selected guides were just taken by another advertiser.',
          takenArticleIds: alreadyTaken,
        });
        return;
      }

      // Priced from the database, never from the request. The client sends which guides it wants;
      // what each one costs is looked up here. When every slot was the same price this distinction
      // didn't matter (slots.length * FLAT was unforgeable), but with two tiers a client-supplied
      // price or tier would be a way to buy a $29 county slot at the $7.99 rate.
      const quote = await withDb((sql) => quoteGuideSlots(sql, uniqueSlots));
      const amount = quote.amount;
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `Before Regret guide ad -- ${uniqueSlots.length} guide${uniqueSlots.length === 1 ? '' : 's'} x 30 days`,
        returnUrl: `${appUrl}/topic-ads/success`,
        cancelUrl: `${appUrl}/topic-ads`,
        userEmail: contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, contact_email, slots_json, amount_usd, status, clerk_user_id,
          terms_version, terms_accepted_at, licence_number, slot_prices_json
        ) VALUES (
          ${paypalOrder.orderId}, ${businessName}, ${tradeCategory}, ${phone}, ${vendor.website},
          ${contactEmail}, ${JSON.stringify(uniqueSlots)}, ${amount}, 'pending', ${req.verifiedUserId as string},
          ${TERMS_VERSION}, now(), ${vendor.licenceNumber || null}, ${JSON.stringify(quote.lines)}
        )
      `);

      // Same approval-URL shape the generic /api/paypal/orders route builds -- the client does a
      // full-page redirect here, there's no PayPal JS SDK button on this page.
      const approvalUrl = approvalUrlFor(paypalOrder.orderId);

      res.json({ success: true, orderId: paypalOrder.orderId, amount, lines: quote.lines, approvalUrl });
    } catch (err: any) {
      // A guide that isn't for sale is the caller asking for the wrong thing, not a server fault --
      // most likely a stale tab whose guide list predates the guide being unpublished. 400 says
      // "reload and pick again"; the 500 this used to return said "we broke, try later", which is
      // both wrong and unactionable.
      if (err instanceof GuideNotSellableError) {
        res.status(400).json({
          success: false,
          error: 'One of the guides you selected is no longer available -- reload the page and choose again.',
          unavailableArticleId: err.articleId,
        });
        return;
      }
      console.error('[guide-ads] checkout failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Could not start checkout.' });
    }
  });

  // --- Start checkout for a topic sponsorship (src/data/adClusters.ts) -------------------------
  // One flat price for every guide in a topic. Stored as a single order for the cluster's anchor
  // guide, tagged with cluster_key, so the capture route below grants it with no separate path.
  app.post('/api/guide-ads/cluster-checkout', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    if (!isPayPalConfigured()) {
      res.status(503).json({ success: false, error: 'Payment processing is not configured on this server.' });
      return;
    }
    const cluster = adClusterByKey(req.body?.clusterKey);
    if (!cluster) {
      res.status(400).json({ success: false, error: 'That topic is not available for sponsorship.' });
      return;
    }
    const vendor = readVendorDetails(req.body);
    if ('error' in vendor) {
      res.status(400).json({ success: false, error: vendor.error });
      return;
    }
    try {
      const guides = (await withDb((sql) => sql`
        SELECT id, slug, title, ad_tier FROM articles WHERE status = 'published'
      `)) as unknown as Array<{ id: number; slug: string; title: string; ad_tier: string }>;
      const members = guides.filter((g) => adClusterForGuide(g.slug, g.title)?.key === cluster.key);
      const anchor = members.find((g) => g.slug === cluster.anchorSlug);
      if (!anchor) {
        res.status(400).json({ success: false, error: 'This topic is not open for sponsorship yet.' });
        return;
      }
      const live = (await withDb((sql) => sql`
        SELECT article_id, cluster_key FROM guide_ad_purchases
        WHERE position = ${SLOT_POSITION} AND active = true AND paid_through > now()
      `)) as unknown as Array<{ article_id: number; cluster_key: string | null }>;
      const singleTaken = new Set(live.filter((p) => p.cluster_key === null).map((p) => p.article_id));
      const openCount = members.filter((g) => !singleTaken.has(g.id)).length;
      if (live.some((p) => p.cluster_key === cluster.key) || openCount < MIN_OPEN_GUIDES_FOR_SPONSORSHIP) {
        res.status(409).json({
          success: false,
          error: 'This topic is no longer open for sponsorship.',
          clusterTaken: true,
        });
        return;
      }

      const amount = AD_CLUSTER_PRICE_USD.toFixed(2);
      const lines = [{ articleId: anchor.id, tier: normaliseTier(anchor.ad_tier), priceUsd: AD_CLUSTER_PRICE_USD }];
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const paypalOrder = await createPayPalOrder({
        amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `Before Regret topic sponsorship -- ${cluster.name} guides x ${SLOT_DURATION_DAYS} days`,
        returnUrl: `${appUrl}/topic-ads/success`,
        cancelUrl: `${appUrl}/topic-ads`,
        userEmail: vendor.contactEmail,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, contact_email, slots_json, amount_usd, status, clerk_user_id,
          terms_version, terms_accepted_at, licence_number, slot_prices_json, cluster_key
        ) VALUES (
          ${paypalOrder.orderId}, ${vendor.businessName}, ${vendor.tradeCategory}, ${vendor.phone}, ${vendor.website},
          ${vendor.contactEmail}, ${JSON.stringify([anchor.id])}, ${amount}, 'pending', ${req.verifiedUserId as string},
          ${TERMS_VERSION}, now(), ${vendor.licenceNumber || null}, ${JSON.stringify(lines)}, ${cluster.key}
        )
      `);

      res.json({ success: true, orderId: paypalOrder.orderId, amount, approvalUrl: approvalUrlFor(paypalOrder.orderId) });
    } catch (err: any) {
      console.error('[guide-ads] cluster checkout failed:', err);
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
          cluster: clusterSummary(order.cluster_key),
        });
        return;
      }

      const requestedArticleIds = JSON.parse(order.slots_json) as number[];

      // What each slot was quoted at, recorded when the order was created. Rebuilt as a map here so
      // every purchase row below can be stamped with the number this vendor actually agreed to pay
      // -- which is what their renewals will quote from for as long as the placement lives.
      // Falls back to the article's current tier only for orders created before slot_prices_json
      // existed, where nothing better was ever recorded.
      const quotedPrices = new Map<number, number>();
      try {
        for (const line of (JSON.parse(order.slot_prices_json || '[]') as Array<{ articleId: number; priceUsd: number }>)) {
          if (Number.isFinite(line?.articleId) && Number.isFinite(line?.priceUsd)) {
            quotedPrices.set(line.articleId, line.priceUsd);
          }
        }
      } catch { /* malformed breakdown falls through to the tier lookup below */ }
      if (quotedPrices.size === 0) {
        await withDb(async (sql) => {
          for (const articleId of requestedArticleIds) {
            const rows = await sql`SELECT ad_tier FROM articles WHERE id = ${articleId} LIMIT 1`;
            const tier = normaliseTier((rows as unknown as Array<{ ad_tier: string }>)[0]?.ad_tier);
            quotedPrices.set(articleId, priceForTier(tier));
          }
        });
      }

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
      const clusterKey: string | null = order.cluster_key ?? null;
      await withDb(async (sql) => {
        // A single-guide order must not claim a guide that a topic sponsor bought in the meantime.
        // Checked before the insert rather than inside it: sponsored membership is computed from
        // titles (src/data/adClusters.ts), which no SQL predicate here can see.
        const sponsored = clusterKey ? new Set<string>() : await sponsoredClusterKeys(sql);
        for (const articleId of requestedArticleIds) {
          if (await isInSponsoredCluster(sql, articleId, sponsored)) {
            skippedArticleIds.push(articleId);
            continue;
          }
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
              order_id, article_id, position, business_name, trade_category, phone, website, paid_through,
              licence_number, price_usd, cluster_key
            )
            SELECT ${order.id}, ${articleId}, ${SLOT_POSITION}, ${order.business_name}, ${order.trade_category},
                   ${order.phone}, ${order.website}, ${paidThrough.toISOString()},
                   ${order.licence_number ?? null}, ${quotedPrices.get(articleId) ?? null}, ${clusterKey}
            WHERE NOT EXISTS (
              SELECT 1 FROM guide_ad_purchases
              -- A topic sponsorship contends only with another sponsorship of the same topic: its row
              -- may share the anchor guide with that guide's single-guide advertiser, who keeps it.
              WHERE (CASE WHEN ${clusterKey}::text IS NULL THEN article_id = ${articleId} ELSE cluster_key = ${clusterKey} END)
                AND position = ${SLOT_POSITION} AND active = true AND paid_through > now()
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
        cluster: clusterSummary(clusterKey),
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
        SELECT p.id, p.paid_through, p.trade_category, p.licence_number, o.contact_email,
               a.status AS article_status, a.title AS article_title
        FROM guide_ad_purchases p
        JOIN guide_ad_orders o ON o.id = p.order_id
        JOIN articles a ON a.id = p.article_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} AND p.active = true LIMIT 1
      `);
      const purchase = (owned as unknown as Array<{
        id: number; paid_through: string; trade_category: string; licence_number: string | null; contact_email: string;
        article_status: string; article_title: string;
      }>)[0];
      if (!purchase) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      // Renewal is the one path that could keep an unlicensed ad live indefinitely: it copies the
      // stored vendor details forward without going through the checkout form, so a placement sold
      // before licence numbers existed (or in a category that later became licence-required) would
      // renew forever with an empty number -- exactly the situation collecting the number was meant
      // to end. Blocked here rather than silently allowed.
      //
      // The vendor is not stuck and does not need support: POST /api/my-ads/<kind>/:id/licence
      // backfills a MISSING required number regardless of whether the one-time contact edit has
      // been used (see myAdsApi.ts -- it can only ever go from absent to present, never change an
      // existing number, which is why it is safe to leave outside that allowance).
      if (requiresLicenceNumber(purchase.trade_category) && !(purchase.licence_number || '').trim()) {
        res.status(409).json({
          success: false,
          error: 'This placement has no licence number on file, which is now required for ' +
            `${purchase.trade_category}. Add it to this placement first (use "Add licence number" on ` +
            'the placement), then renew.',
          needsLicenceNumber: true,
        });
        return;
      }
      // Same principle as the `active = true` check above, one cause further out: that one catches a
      // placement an admin pulled, this catches the guide itself no longer being published. Either
      // way the ad has no page to render on, so charging $29 to extend it would be taking money for
      // something that cannot be delivered. Only the reason differs, so it gets its own message --
      // "placement not found" would be actively misleading when the placement is fine and the page
      // is the thing that went away.
      if (purchase.article_status !== 'published') {
        res.status(409).json({
          success: false,
          error: `"${purchase.article_title}" is no longer published, so this placement can't be renewed -- ` +
            'it would have nowhere to appear. Pick a different guide from Topic Ads instead.',
          guideUnpublished: true,
        });
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
      // The renewal price comes from the placement itself, not from a constant: a county slot and a
      // standard one no longer cost the same, and a vendor who bought at a founding rate keeps it
      // (see quoteGuideRenewal). Charging PRICE_PER_SLOT_USD here would have quietly renewed every
      // $29 county placement for $7.99.
      const renewalQuote = await withDb((sql) => quoteGuideRenewal(sql, purchaseId));
      // PayPal appends `&token=<orderId>` to this on redirect back -- see
      // GuideAdsCheckoutSuccess.tsx's own returnUrl handling for the same pattern this mirrors.
      const paypalOrder = await createPayPalOrder({
        amount: renewalQuote.amount,
        currency: 'USD',
        type: 'vendor_subscription',
        description: `Before Regret guide ad renewal -- ${SLOT_DURATION_DAYS} more days`,
        returnUrl: `${appUrl}/my-ads?renewed=guide`,
        cancelUrl: `${appUrl}/my-ads`,
        userEmail: purchase.contact_email,
      });

      await withDb((sql) => sql`
        INSERT INTO guide_ad_orders (
          paypal_order_id, business_name, trade_category, phone, website, contact_email,
          slots_json, amount_usd, status, clerk_user_id, renews_purchase_id, licence_number
        )
        -- licence_number carried across from the purchase being renewed, like every other vendor
        -- detail here: a renewal is the same advertiser continuing, so re-prompting for a number
        -- they already gave would be friction, and dropping it would silently strip the licence
        -- from an ad that had been displaying one.
        SELECT ${paypalOrder.orderId}, business_name, trade_category, phone, website,
               ${purchase.contact_email}, '[]', ${renewalQuote.amount}, 'pending', ${clerkUserId}, ${purchaseId},
               licence_number
        FROM guide_ad_purchases WHERE id = ${purchaseId}
      `);

      const approvalUrl = `https://www.${
        process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
      }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`;

      res.json({ success: true, orderId: paypalOrder.orderId, amount: renewalQuote.amount, approvalUrl });
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
