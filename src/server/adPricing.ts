import type { NeonQueryFunction } from '@neondatabase/serverless';

// The one place a guide ad slot's price is decided. Every route that quotes, charges, or renews a
// guide placement reads it from here -- same reasoning as contentAudit.ts being shared between the
// admin route and the article-faqs skill, and legacyUrls.ts between the 410 handler and its audit
// script: two things that must agree about a rule cannot be allowed to each carry their own copy
// of it. A checkout that priced a slot differently from the renewal quote shown in /my-ads would
// be a billing bug the vendor discovers, not us.
//
// WHY TWO TIERS. Guide ads were a flat $7.99 for any of the 151 published guides, sold as an open
// market with no targeting. That priced two very different things identically. A generic guide
// ("what does an open ground mean") reaches whoever is researching that defect, anywhere in the
// country -- a national audience for a local trade, which is worth little to the electrician who
// can only serve one metro. A county guide ("check building permits in cook county il") reaches
// someone researching permits in one specific county, which is exactly and only the audience a
// Chicago contractor can sell to. The second is worth several times the first to the buyer, and
// pricing them the same left the only genuinely local inventory on the site -- the 33 county
// guides, covering the largest metros in the US -- being sold at the national rate.
//
// The tier lives on the article row rather than being re-derived from the slug at price time.
// A regex over slugs was how the initial backfill was computed (see
// scripts/backfill-guide-ad-tiers.ts), but deriving it on every read would mean a slug edit could
// silently change what a page costs, and would leave no way to mark a guide as local when its slug
// doesn't happen to name a county.
export type GuideAdTier = 'standard' | 'geo';

export const GUIDE_AD_TIER_PRICES_USD: Record<GuideAdTier, number> = {
  standard: 7.99,
  geo: 29,
};

export const GUIDE_AD_TIER_LABELS: Record<GuideAdTier, string> = {
  standard: 'Guide',
  geo: 'County',
};

export const SLOT_DURATION_DAYS = 30;

/** Anything not exactly 'geo' prices as standard -- an unrecognised value must never price as free. */
export function normaliseTier(raw: unknown): GuideAdTier {
  return raw === 'geo' ? 'geo' : 'standard';
}

export function priceForTier(tier: GuideAdTier): number {
  return GUIDE_AD_TIER_PRICES_USD[tier];
}

/**
 * Thrown when a requested guide can't be priced because it isn't a published guide.
 *
 * A distinct type rather than a bare Error so the checkout route can answer 400 (the caller asked
 * for something that isn't for sale) instead of 500 (we broke). Matching on the message string
 * would work today and break silently the first time the wording is edited.
 */
export class GuideNotSellableError extends Error {
  constructor(public readonly articleId: number) {
    super(`Guide #${articleId} is not available for advertising.`);
    this.name = 'GuideNotSellableError';
  }
}

export interface GuideAdQuoteLine {
  articleId: number;
  tier: GuideAdTier;
  priceUsd: number;
}

export interface GuideAdQuote {
  lines: GuideAdQuoteLine[];
  /** Fixed to 2dp as a string, ready to hand to PayPal -- never a float. */
  amount: string;
  totalUsd: number;
}

/**
 * Price a set of guide slots from what the DATABASE says their tiers are.
 *
 * Deliberately takes only article ids and reads the tier itself: the client sends the list of
 * guides it wants, and the amount charged must never be derived from anything the client could
 * also have sent. An earlier shape of this (amount = slots.length * FLAT_PRICE) was safe only
 * because every slot cost the same; the moment two prices exist, a client-supplied tier or price
 * would be a way to buy a $29 county slot for $7.99.
 *
 * Throws when an id doesn't resolve to a published guide, rather than skipping it -- silently
 * dropping an unknown id would charge the vendor for fewer slots than their cart showed.
 */
export async function quoteGuideSlots(
  sql: NeonQueryFunction<false, false>,
  articleIds: number[]
): Promise<GuideAdQuote> {
  const lines: GuideAdQuoteLine[] = [];
  for (const articleId of articleIds) {
    const rows = await sql`
      SELECT ad_tier FROM articles WHERE id = ${articleId} AND status = 'published' LIMIT 1
    `;
    const row = (rows as unknown as Array<{ ad_tier: string }>)[0];
    if (!row) throw new GuideNotSellableError(articleId);
    const tier = normaliseTier(row.ad_tier);
    lines.push({ articleId, tier, priceUsd: priceForTier(tier) });
  }
  const totalUsd = lines.reduce((sum, l) => sum + l.priceUsd, 0);
  return { lines, amount: totalUsd.toFixed(2), totalUsd };
}

/**
 * What a specific existing placement costs to renew.
 *
 * Honours the price stored on the purchase when there is one (guide_ad_purchases.price_usd), and
 * only falls back to the article's current tier price when there isn't. That ordering is the
 * founding-vendor rate promise made concrete: a vendor who bought a county slot at the launch
 * price keeps that price on every renewal, even after the tier price rises, because the number
 * they agreed to is on their row rather than being looked up fresh each month. Rows sold before
 * price_usd existed have no stored price and fall through to the tier -- the honest answer for
 * them, since nothing was recorded.
 */
export async function quoteGuideRenewal(
  sql: NeonQueryFunction<false, false>,
  purchaseId: number
): Promise<{ priceUsd: number; amount: string; tier: GuideAdTier; lockedIn: boolean }> {
  const rows = await sql`
    SELECT p.price_usd, a.ad_tier
    FROM guide_ad_purchases p JOIN articles a ON a.id = p.article_id
    WHERE p.id = ${purchaseId} LIMIT 1
  `;
  const row = (rows as unknown as Array<{ price_usd: string | null; ad_tier: string }>)[0];
  if (!row) throw new Error('Placement not found.');
  const tier = normaliseTier(row.ad_tier);
  const stored = row.price_usd === null ? null : Number(row.price_usd);
  const priceUsd = stored !== null && Number.isFinite(stored) ? stored : priceForTier(tier);
  return { priceUsd, amount: priceUsd.toFixed(2), tier, lockedIn: stored !== null };
}
