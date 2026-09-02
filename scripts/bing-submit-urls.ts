// Submits URLs to Bing for crawling, via the Webmaster API.
//
//   npx tsx scripts/bing-submit-urls.ts                 # DRY RUN -- shows what would be sent
//   npx tsx scripts/bing-submit-urls.ts --write         # actually submits
//   npx tsx scripts/bing-submit-urls.ts --write --limit 50
//
// WHY THIS IS WORTH HAVING. Google's equivalent ("Request Indexing") is UI-only, one URL at a
// time, and heavily rate-limited -- which is why several manual Search Console steps keep landing
// on the user in this project. Bing exposes the same idea as an API with a real quota (100/day,
// 2900/month for this property as of 2026-09-02), so a backlog can be submitted without clicking.
//
// WHAT IT IS NOT. Submitting asks Bing to CRAWL a URL. It is not a promise to index it, and it
// does not affect Google at all.
//
// STATE AS OF 2026-09-02. Bing has 104 pages indexed against roughly 25 at Google, and out-clicks
// Google about 5:1 on this property -- so Bing coverage is close to finished and this script has
// little left to do. All 35 surviving guides are already submitted. It stays because it is the
// only programmatic indexing lever this project has, and it is the right tool the next time a
// genuinely new page ships. It cannot touch the Google problem.
//
// DEFAULTS TO A DRY RUN on purpose. This is an outward-facing action against a third-party service
// with a monthly quota; it should not be possible to spend 1100 submissions by running a script
// without arguments.
import 'dotenv/config';
import { isBingWebmasterConfigured, fetchBingSubmissionQuota } from '../src/server/bingWebmasterService.js';
import { withDb, isDbConfigured } from '../src/server/db.js';

const SITE = 'https://www.beforeregret.com';
const WRITE = process.argv.includes('--write');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 100;

async function retry<T>(fn: () => Promise<T>, n = 6): Promise<T> {
  for (let i = 1; i <= n; i++) {
    try { return await fn(); } catch (e: any) {
      const msg = String(e?.message || e?.sourceError?.cause || e);
      if (i === n || !/ENOTFOUND|fetch failed/.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw new Error('unreachable');
}

// Only URLs that actually answer 200. Submitting anything else spends capped quota asking Bing to
// crawl a page that will tell it to go away.
//
// The county hub and the per-county URLs used to be built here and both were wrong by the time
// this was noticed: /counties/ has answered 410 since the 2026-08-23 county retirement (it is in
// legacyUrls.ts), and the /county/:slug page type was deleted outright on 2026-08-26 -- component,
// route and API. The county_data table survives only to back /api/v1/counties, so a row there is
// no longer evidence that a page exists. Rebuilding the list from county_data would therefore
// submit URLs with no page behind them at all.
//
// articles is filtered to status = 'published', which the 2026-09-02 prune reduced to 35. Removed
// guides answer 410 and merged ones 301, so neither belongs in a crawl request either.
async function collectUrls(): Promise<string[]> {
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');
  const urls: string[] = [`${SITE}/`, `${SITE}/guides/`, `${SITE}/about/`];
  const guides = await retry(() => withDb((sql) => sql`SELECT slug FROM articles WHERE status='published' ORDER BY published_at DESC`));
  for (const r of guides as any[]) urls.push(`${SITE}/guides/${r.slug}/`);
  return urls;
}

async function main() {
  if (!isBingWebmasterConfigured()) throw new Error('BING_WEBMASTER_API_KEY is not set.');

  const quota = await fetchBingSubmissionQuota(SITE);
  const all = await collectUrls();

  // Skip anything already sent. Without this the script took the first N of a deterministic list
  // every run, so a second run resent URLs from the first and never reached the remainder --
  // quietly spending a capped monthly quota on duplicates.
  const sentRows = await retry(() => withDb((sql) => sql`SELECT url FROM bing_url_submissions`));
  const alreadySent = new Set((sentRows as any[]).map((r) => r.url));
  const pending = all.filter((u) => !alreadySent.has(u));
  const batch = pending.slice(0, Math.min(LIMIT, quota.dailyQuota));

  console.log(`already submitted   : ${alreadySent.size}`);
  console.log(`still pending       : ${pending.length}`);

  console.log(`published URLs      : ${all.length}`);
  console.log(`quota               : ${quota.dailyQuota}/day, ${quota.monthlyQuota}/month`);
  console.log(`this run would send : ${batch.length}`);
  console.log(`\nfirst 8:`);
  for (const u of batch.slice(0, 8)) console.log(`  ${u.replace(SITE, '')}`);
  if (batch.length > 8) console.log(`  ... and ${batch.length - 8} more`);

  if (!WRITE) {
    console.log('\nDRY RUN -- nothing submitted. Re-run with --write to actually submit.');
    return;
  }

  // SubmitUrlBatch is a POST with a JSON body, unlike the GET endpoints in
  // bingWebmasterService.ts -- kept here rather than in the service because submitting is a
  // write against a third-party service and does not belong beside read-only reporting helpers.
  const apiKey = process.env.BING_WEBMASTER_API_KEY!;
  const res = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ siteUrl: SITE, urlList: batch }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SubmitUrlBatch failed (${res.status}): ${text.slice(0, 400)}`);
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (json?.ErrorCode) throw new Error(`SubmitUrlBatch error ${json.ErrorCode}: ${json.Message}`);

  // Recorded only after the API accepted the batch, so a failed call leaves them pending.
  for (const u of batch) {
    await retry(() => withDb((sql) => sql`
      INSERT INTO bing_url_submissions (url) VALUES (${u}) ON CONFLICT (url) DO NOTHING`));
  }
  console.log(`\nsubmitted ${batch.length} URL(s), recorded in bing_url_submissions.`);
  const after = await fetchBingSubmissionQuota(SITE);
  console.log(`quota now: ${after.dailyQuota}/day, ${after.monthlyQuota}/month remaining`);
  console.log('\nThis asks Bing to crawl these URLs. It is not a promise to index them, and it has');
  console.log('no effect on Google.');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
