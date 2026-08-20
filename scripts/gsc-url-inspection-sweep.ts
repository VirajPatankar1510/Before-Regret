// Runs Search Console's URL Inspection API (the same check as "URL Inspection" in the GSC UI)
// across a list of URLs, instead of clicking through the UI one at a time.
//
//   npx tsx scripts/gsc-url-inspection-sweep.ts <url1> <url2> ...   # inspect exactly these
//   npx tsx scripts/gsc-url-inspection-sweep.ts                     # inspect every never-shown guide
//
// WHY THIS EXISTS. scripts/gsc-page-coverage.ts answers "has Google ever shown this URL to
// anyone" from impressions data, which is silent about a URL Google hasn't crawled yet at all --
// impressions and crawl/index status are genuinely different facts, and only this API reports
// the second one. This is specifically the tool for checking whether a manual "Request Indexing"
// submission in the GSC UI actually landed: coverageState moving to "Submitted and indexed" (or
// at least off "URL is unknown to Google") is the signal that a submission was processed.
//
// NO ARGS defaults to every currently never-shown guide (published, zero impressions in 90 days --
// the same set gsc-page-coverage.ts's "NEVER SHOWN" list reports), not a hardcoded list of "the
// ones someone manually submitted." That list only ever existed in a GSC UI session and isn't
// recorded anywhere this script can read -- guessing at it and reporting on the wrong URLs would
// be worse than not guessing. Sweeping every never-shown guide necessarily includes whichever
// ones were actually submitted (a submission doesn't remove a URL from "never shown" until Google
// finishes indexing it) and reports on the rest too, which answers the real underlying question
// -- "did anything move" -- more completely than a narrower, unverifiable list would.
//
// RATE LIMIT: the API allows far more than this site will ever need in one run (order of
// thousands/day, hundreds/minute) -- the 400ms delay between calls here is just good manners, not
// a requirement worked around.
import 'dotenv/config';
import { fetchUrlInspection, isSearchConsoleConfigured } from '../src/server/searchConsoleService.js';
import { withDb, isDbConfigured } from '../src/server/db.js';

const SITE = (process.env.GSC_SITE_URL || '').startsWith('http')
  ? process.env.GSC_SITE_URL!.replace(/\/$/, '')
  : 'https://www.beforeregret.com';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function neverShownGuideUrls(): Promise<string[]> {
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');
  const { fetchPagePerformance } = await import('../src/server/searchConsoleService.js');

  const articles = await withDb((sql) => sql`
    SELECT slug FROM articles WHERE status = 'published' ORDER BY published_at DESC
  `) as unknown as Array<{ slug: string }>;

  const perf = await fetchPagePerformance(90);
  const normalize = (u: string) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '').toLowerCase();
  const shownSet = new Set(perf.map((r) => normalize(r.page)));

  return articles
    .map((a) => `${SITE}/guides/${a.slug}/`)
    .filter((u) => !shownSet.has(normalize(u)));
}

async function main() {
  if (!isSearchConsoleConfigured()) throw new Error('Search Console is not configured (see searchConsoleService.ts).');

  const argUrls = process.argv.slice(2);
  const urls = argUrls.length > 0 ? argUrls : await neverShownGuideUrls();

  if (argUrls.length === 0) {
    console.log(`No URLs passed -- inspecting all ${urls.length} currently never-shown guide(s).\n`);
  } else {
    console.log(`Inspecting ${urls.length} URL(s) passed on the command line.\n`);
  }

  const results: Awaited<ReturnType<typeof fetchUrlInspection>>[] = [];
  for (let i = 0; i < urls.length; i++) {
    const r = await fetchUrlInspection(urls[i]);
    results.push(r);
    const mark = r.error ? 'ERR ' : r.indexed ? 'IDX ' : '.   ';
    console.log(`${mark}[${String(i + 1).padStart(3)}/${urls.length}] ${r.coverageState.padEnd(32)} ${r.url}`);
    if (r.error) console.log(`      -> ${r.error}`);
    if (i < urls.length - 1) await sleep(400);
  }

  const indexed = results.filter((r) => r.indexed);
  const errored = results.filter((r) => r.error);
  const byState = new Map<string, number>();
  for (const r of results) {
    if (r.error) continue;
    byState.set(r.coverageState, (byState.get(r.coverageState) ?? 0) + 1);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`checked           : ${results.length}`);
  console.log(`indexed           : ${indexed.length}`);
  console.log(`errors            : ${errored.length}`);
  console.log(`\ncoverage state breakdown:`);
  for (const [state, count] of [...byState.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${state}`);
  }

  if (indexed.length > 0) {
    console.log(`\n=== NOW INDEXED ===`);
    for (const r of indexed) console.log(`  ${r.url}  (crawled ${r.lastCrawlTime ?? 'unknown'})`);
  }

  const recentlyCrawled = results.filter((r) => !r.indexed && !r.error && r.lastCrawlTime);
  if (recentlyCrawled.length > 0) {
    console.log(`\n=== CRAWLED BUT NOT YET INDEXED (has a lastCrawlTime) ===`);
    for (const r of recentlyCrawled) console.log(`  ${r.coverageState.padEnd(32)} ${r.lastCrawlTime}  ${r.url}`);
  }
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
