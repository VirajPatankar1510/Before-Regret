// Measures the brand-visibility signals that a low-authority site's search performance most
// plausibly hinges on, and tests one specific published claim against this site's own data.
//
//   npx tsx scripts/brand-signal-report.ts
//
// WHY THIS EXISTS. Analysis of Google endpoint data by Mark Williams-Cook (2TB, ~90M queries,
// covered by Search Engine Land and Search Engine Roundtable) reports a `site_quality_score` whose
// inputs include brand search visibility, user interactions, and off-page anchor text relevance,
// and which below roughly 0.4 excludes a site from People Also Ask and featured snippets.
//
// That is leak-derived, NOT documented by Google, and this script does not assume it is true. What
// makes it worth measuring anyway is that it produces a falsifiable prediction for this site: if
// brand search is at the floor, enhanced SERP appearances should be absent. So the script reports
// the two facts side by side and lets them be read together, rather than asserting the mechanism.
//
// THE TRAP THIS AVOIDS. "Branded impressions: 0" is not the same as "nobody searched for us".
// Search Console withholds queries below an anonymity threshold, so low-volume branded searches
// are dropped from the query report entirely while still counting in the page report. That gap is
// reported explicitly below -- reading a suppressed zero as a real zero would be the single
// easiest way to draw a wrong conclusion from this data.
import 'dotenv/config';
import {
  fetchTopSearchQueries,
  fetchPagePerformance,
  fetchSearchAppearance,
  isSearchConsoleConfigured,
} from '../src/server/searchConsoleService.js';

const BRAND = /before\s*regret|beforeregret/i;

// Appearances that are special-but-not-rich. Anything OUTSIDE this set is an enhanced result --
// the thing the 0.4 threshold is claimed to gate.
//
// Read an EMPTY result carefully: the searchAppearance dimension only ever returns rows for
// special appearance types. An ordinary blue link produces no row at all. So "no rows" means "no
// enhanced appearances", NOT "no impressions" and NOT "something is broken" -- and for a young,
// low-traffic site, having none is entirely unremarkable on its own.
const PLAIN_APPEARANCES = new Set(['AMP_BLUE_LINK', 'WEBLITE', 'ORGANIC_SHOPPING']);

async function main() {
  if (!isSearchConsoleConfigured()) throw new Error('Search Console is not configured.');

  const [queries, pages, appearances] = await Promise.all([
    fetchTopSearchQueries(),
    fetchPagePerformance(90),
    fetchSearchAppearance(90),
  ]);

  const branded = queries.filter((q) => BRAND.test(q.query));
  const nonBranded = queries.filter((q) => !BRAND.test(q.query));
  const sum = (rows: any[], k: string) => rows.reduce((n, r) => n + (r[k] || 0), 0);

  const queryImpressions = sum(queries, 'impressions');
  const pageImpressions = sum(pages, 'impressions');
  const suppressed = pageImpressions - queryImpressions;

  console.log('=== BRAND SEARCH (last 90 days) ===\n');
  console.log(`  branded queries      : ${branded.length} row(s), ${sum(branded, 'impressions')} impressions, ${sum(branded, 'clicks')} clicks`);
  for (const b of branded.slice(0, 10)) {
    console.log(`      "${b.query}"  ${b.impressions} imp / ${b.clicks} clk / pos ${b.position?.toFixed(1)}`);
  }
  console.log(`  non-branded queries  : ${nonBranded.length} row(s), ${sum(nonBranded, 'impressions')} impressions, ${sum(nonBranded, 'clicks')} clicks`);

  console.log('\n  --- how much of this is even visible? ---');
  console.log(`  impressions at page level  : ${pageImpressions}`);
  console.log(`  impressions at query level : ${queryImpressions}`);
  console.log(`  withheld by anonymisation  : ${suppressed} (${pageImpressions ? Math.round((suppressed / pageImpressions) * 100) : 0}%)`);
  if (branded.length === 0) {
    console.log('\n  NOTE: zero branded ROWS does not prove zero branded searches. Low-volume queries');
    console.log('  are withheld entirely, and the withheld share above is large. Read this as');
    console.log('  "below the reporting threshold", not "nobody searched".');
  }

  console.log('\n=== SERP APPEARANCE TYPES (last 90 days) ===\n');
  if (appearances.length === 0) {
    console.log('  No appearance rows at all -- the site has not been recorded in any SERP feature.');
  } else {
    for (const a of appearances.sort((x, y) => y.impressions - x.impressions)) {
      const kind = PLAIN_APPEARANCES.has(a.appearance) ? 'plain' : 'ENHANCED';
      console.log(`  ${kind.padEnd(9)} ${a.appearance.padEnd(26)} ${String(a.impressions).padStart(5)} imp  ${String(a.clicks).padStart(3)} clk`);
    }
  }
  const enhanced = appearances.filter((a) => !PLAIN_APPEARANCES.has(a.appearance));

  console.log('\n=== READING IT ===\n');
  console.log(`  brand search      : ${branded.length === 0 ? 'below reporting threshold (floor)' : `${sum(branded, 'impressions')} impressions`}`);
  console.log(`  enhanced results  : ${enhanced.length === 0 ? 'none' : `${enhanced.length} type(s)`}`);
  console.log('');
  if (branded.length === 0 && enhanced.length === 0) {
    console.log('  Both at zero. This is CONSISTENT with the site_quality_score model (no brand');
    console.log('  signal -> low score -> excluded from enhanced results), but it does not');
    console.log('  demonstrate it: a two-month-old site with ~500 total impressions would look');
    console.log('  exactly the same for reasons that have nothing to do with a threshold.');
    console.log('  Consistent-with is not evidence-for. What makes this worth tracking is the');
    console.log('  DIVERGENCE: if brand search rises and enhanced results stay at zero, the model');
    console.log('  is wrong here. If they move together, it earns some credit.');
  } else if (branded.length > 0 && enhanced.length === 0) {
    console.log('  Brand search is registering but no enhanced result has appeared. If this holds');
    console.log('  as brand search grows, the threshold model does not explain this site.');
  } else {
    console.log('  Enhanced results are present. Whatever gate the model describes, this site is');
    console.log('  not wholly on the wrong side of it.');
  }
  console.log('\n  Re-run monthly. The single number worth tracking is branded impressions; it is');
  console.log('  the only input to that model anyone here can actually move.');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
