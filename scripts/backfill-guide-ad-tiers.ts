import 'dotenv/config';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { GUIDE_AD_TIER_PRICES_USD } from '../src/server/adPricing.js';

// One-off backfill for articles.ad_tier, which decides what a guide's ad slot sells for (see
// src/server/adPricing.ts). Every article defaults to 'standard'; this marks the county-specific
// ones as 'geo'.
//
// This lives in a script rather than in db.ts's init because init runs on every boot, and a
// slug-pattern UPDATE running on every boot would silently overwrite any tier an admin later set
// by hand -- the exact thing the column exists to make possible. Run it once, then edit tiers
// individually from then on.
//
// DRY RUN BY DEFAULT. Pass --apply to actually write. The pattern below decides pricing for real
// inventory, so it prints every row it would change and waits to be told twice -- same
// assert-before-write posture as every other content-touching script here.

// Matches the two shapes the county guides actually use: an explicit '-county-' or '-city-'
// segment, or a trailing two-letter state code (e.g. '...-travis-county-tx'). Deliberately narrow:
// a false positive prices a national guide at the county rate, which a vendor would discover at
// checkout, so the pattern is checked against printed output before anything is written.
const GEO_SLUG_PATTERN =
  "slug ~ '-(county|city)-' OR slug ~ '-(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)$'";

// Slugs the pattern matches but that are NOT about one place. Caught by reading the dry-run
// output, which is the entire reason this script prints before it writes.
//
// 'listing-square-footage-differs-from-county-tax-records' is about county tax records as a
// category -- every county has them, and the guide is written for a reader anywhere in the US.
// The pattern sees '-county-' and can't tell the difference. Pricing it as local inventory would
// mean selling a nationwide audience to a contractor at the local rate, which is the one direction
// of error a vendor would be right to be annoyed about.
const NOT_ACTUALLY_LOCAL = new Set<string>([
  'listing-square-footage-differs-from-county-tax-records',
]);

async function main() {
  const apply = process.argv.includes('--apply');
  if (!isDbConfigured()) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const candidates = await withDb((sql) => sql`
    SELECT id, slug, ad_tier FROM articles
    WHERE status = 'published'
      AND (slug ~ '-(county|city)-' OR slug ~ '-(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)$')
    ORDER BY slug
  `) as unknown as Array<{ id: number; slug: string; ad_tier: string }>;

  const excluded = candidates.filter((c) => NOT_ACTUALLY_LOCAL.has(c.slug));
  const toChange = candidates.filter((c) => c.ad_tier !== 'geo' && !NOT_ACTUALLY_LOCAL.has(c.slug));

  console.log(`\nPattern: ${GEO_SLUG_PATTERN}\n`);
  console.log(`Published guides matching the county pattern: ${candidates.length}`);
  console.log(`Excluded as not actually local: ${excluded.length}`);
  console.log(`Would change to 'geo': ${toChange.length}\n`);
  for (const c of toChange) console.log(`  ${c.ad_tier.padEnd(9)} -> geo    ${c.slug}`);
  for (const c of excluded) console.log(`  EXCLUDED  (stays ${c.ad_tier})    ${c.slug}`);

  // The counter-check that matters more than the list above: what is being LEFT at the standard
  // rate. A guide that is county-specific but whose slug doesn't say so would be invisible in the
  // list above and would keep selling at the national price, which is the failure this print
  // exists to catch. Reviewed by eye rather than asserted, because no pattern can decide it.
  const standardCount = await withDb((sql) => sql`
    SELECT count(*)::int AS n FROM articles WHERE status = 'published'
      AND NOT (slug ~ '-(county|city)-' OR slug ~ '-(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)$')
  `) as unknown as Array<{ n: number }>;
  console.log(`\nStaying at the standard rate: ${standardCount[0].n} guides`);
  console.log(
    `\nPrices: geo $${GUIDE_AD_TIER_PRICES_USD.geo.toFixed(2)} / standard $${GUIDE_AD_TIER_PRICES_USD.standard.toFixed(2)} per 30 days`
  );
  const geoCount = candidates.length - excluded.length;
  console.log(
    `Inventory value at full sell-through: $${(
      geoCount * GUIDE_AD_TIER_PRICES_USD.geo +
      (standardCount[0].n + excluded.length) * GUIDE_AD_TIER_PRICES_USD.standard
    ).toFixed(2)} / month`
  );
  // The number that actually matters for planning: how much of the county inventory has to sell to
  // clear a given month. Printed because "33 slots exist" is not a target and "11 of them" is.
  console.log(
    `County slots needed for $300/month: ${Math.ceil(300 / GUIDE_AD_TIER_PRICES_USD.geo)} of ${geoCount}` +
    ` (${((Math.ceil(300 / GUIDE_AD_TIER_PRICES_USD.geo) / geoCount) * 100).toFixed(0)}% sell-through)`
  );

  if (!apply) {
    console.log('\nDRY RUN -- nothing written. Re-run with --apply to commit these changes.\n');
    return;
  }
  if (toChange.length === 0) {
    console.log('\nNothing to change.\n');
    return;
  }

  // Updated by explicit id list rather than by re-running the pattern as an UPDATE ... WHERE, so
  // what gets written is exactly the set that was printed and reviewed above -- not whatever the
  // pattern happens to match a second time.
  await withDb(async (sql) => {
    for (const c of toChange) {
      await sql`UPDATE articles SET ad_tier = 'geo' WHERE id = ${c.id}`;
    }
  });
  console.log(`\nApplied: ${toChange.length} guides moved to the 'geo' tier.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
