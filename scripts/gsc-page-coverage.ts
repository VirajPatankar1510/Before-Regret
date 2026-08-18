// Which published URLs has Google actually shown to anyone?
//
//   npx tsx scripts/gsc-page-coverage.ts [days]        # default 90
//   npx tsx scripts/gsc-page-coverage.ts 28
//
// WHY THIS EXISTS. Search Console's UI and this codebase's existing keyword tool both report on
// the site in aggregate: which QUERIES earn impressions. Neither answers the question that
// actually matters when 106 URLs sit in "Discovered -- currently not indexed" -- namely, which
// individual pages have ever been shown at all, and which have been shown zero times.
//
// THE SUBTRACTION IS THE WHOLE POINT. Search Console returns a row only for pages with at least
// one impression in the window. A page with zero impressions is ABSENT from the response, not
// present with a zero. So "never shown" cannot be read off the API at all -- it only exists as the
// difference between the site's own published URL list (from the database, the authority on what
// is published) and the set of URLs Google reports on. Reading the API alone would silently
// undercount the problem to nothing.
//
// Read-only: queries Search Console and the database, writes nothing to either.
import 'dotenv/config';
import { fetchPagePerformance, isSearchConsoleConfigured } from '../src/server/searchConsoleService.js';
import { withDb, isDbConfigured } from '../src/server/db.js';

const SITE = (process.env.GSC_SITE_URL || '').startsWith('http')
  ? process.env.GSC_SITE_URL!.replace(/\/$/, '')
  : 'https://www.beforeregret.com';

interface Published {
  url: string;
  label: string;
  kind: 'guide' | 'county' | 'hub';
}

/** Trailing slash, protocol and host are all places a comparison can silently fail; normalize
 *  both sides through the same function rather than trusting either source's formatting. */
function normalize(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '').toLowerCase();
}

async function main() {
  const days = parseInt(process.argv[2] || '90', 10);
  if (!isSearchConsoleConfigured()) throw new Error('Search Console is not configured (see searchConsoleService.ts).');
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');

  const articles = await withDb((sql) => sql`
    SELECT slug, title, article_type FROM articles WHERE status = 'published' ORDER BY slug
  `) as unknown as Array<{ slug: string; title: string; article_type: string }>;
  const counties = await withDb((sql) => sql`
    SELECT slug, county_name, state_abbrev FROM county_data WHERE data_complete = true ORDER BY slug
  `) as unknown as Array<{ slug: string; county_name: string; state_abbrev: string }>;

  const published: Published[] = [
    ...articles.map((a) => ({ url: `${SITE}/guides/${a.slug}/`, label: a.title, kind: 'guide' as const })),
    ...counties.map((c) => ({ url: `${SITE}/county/${c.slug}/`, label: `${c.county_name}, ${c.state_abbrev}`, kind: 'county' as const })),
    { url: `${SITE}/`, label: 'Homepage', kind: 'hub' as const },
    { url: `${SITE}/guides/`, label: 'Guides index', kind: 'hub' as const },
    { url: `${SITE}/counties/`, label: 'Counties index', kind: 'hub' as const },
  ];

  console.log(`Fetching ${days}-day page performance from Search Console...`);
  const rows = await fetchPagePerformance(days);
  const byUrl = new Map(rows.map((r) => [normalize(r.page), r]));

  const seen = published.filter((p) => byUrl.has(normalize(p.url)));
  const unseen = published.filter((p) => !byUrl.has(normalize(p.url)));

  console.log(`\n=== COVERAGE (last ${days} days) ===`);
  console.log(`published URLs checked : ${published.length}`);
  console.log(`with >=1 impression    : ${seen.length}  (${Math.round((seen.length / published.length) * 100)}%)`);
  console.log(`with ZERO impressions  : ${unseen.length}  (${Math.round((unseen.length / published.length) * 100)}%)`);

  for (const kind of ['guide', 'county', 'hub'] as const) {
    const all = published.filter((p) => p.kind === kind);
    if (all.length === 0) continue;
    const shown = all.filter((p) => byUrl.has(normalize(p.url))).length;
    console.log(`  ${kind.padEnd(7)} ${String(shown).padStart(4)} of ${String(all.length).padStart(4)} shown`);
  }

  // Rows Google reports that are NOT in the published list -- stale URLs still being surfaced,
  // or a normalization bug in this script. Worth seeing either way rather than discarding.
  const publishedSet = new Set(published.map((p) => normalize(p.url)));
  const unmatched = rows.filter((r) => !publishedSet.has(normalize(r.page)));
  if (unmatched.length > 0) {
    console.log(`\n=== ${unmatched.length} URL(s) WITH IMPRESSIONS NOT IN THE PUBLISHED LIST ===`);
    console.log('(old slugs, legal pages, or a URL-shape mismatch worth checking)');
    for (const r of unmatched.slice(0, 15)) console.log(`  ${String(r.impressions).padStart(6)} imp  ${r.page}`);
  }

  console.log(`\n=== TOP 15 PAGES BY IMPRESSIONS ===`);
  for (const r of rows.slice(0, 15)) {
    console.log(`  ${String(r.impressions).padStart(6)} imp  ${String(r.clicks).padStart(4)} clk  pos ${r.position.toFixed(1).padStart(5)}  ${r.page.replace(SITE, '')}`);
  }

  console.log(`\n=== NEVER SHOWN (first 40 of ${unseen.length}) ===`);
  for (const p of unseen.slice(0, 40)) {
    console.log(`  [${p.kind}] ${p.url.replace(SITE, '')}  -- ${p.label.slice(0, 60)}`);
  }
  if (unseen.length > 40) console.log(`  ... and ${unseen.length - 40} more`);

  console.log('\nRe-run with a shorter window (e.g. 28) and compare against a longer one to see movement.');
}

main().catch((err) => {
  console.error('\nFAILED:', err?.message ?? err);
  process.exit(1);
});
