// Submits today's three changed guides to Bing and prints the GSC request-indexing list.
//
//   npx tsx scripts/bing-submit-aerial.ts            # DRY RUN
//   npx tsx scripts/bing-submit-aerial.ts --write
//
// A separate script rather than a new cutoff in bing-submit-updated.ts, whose SINCE constant is
// documented against a specific 43-hour gap in the updated_at distribution. Moving it would make
// that comment describe a boundary the code no longer uses.
//
// The set is read from the database by updated_at rather than typed, so it cannot disagree with
// what actually changed. Only one of the three is worth a scarce Google slot: the two host guides
// gained a sentence and an internal link, which is not a re-crawl priority.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { isBingWebmasterConfigured, fetchBingSubmissionQuota } from '../src/server/bingWebmasterService.js';

const SITE = 'https://www.beforeregret.com';
const WRITE = process.argv.includes('--write');
const SINCE = '2026-09-08T00:00:00Z';
const EXPECTED = ['home-insurance-aerial-photos-roof', 'get-home-insurance-flat-roof', 'get-home-insurance-aluminum-wiring'];
const GSC_PRIORITY = ['home-insurance-aerial-photos-roof'];

async function retry<T>(fn: () => Promise<T>, n = 8): Promise<T> {
  for (let i = 1; i <= n; i++) {
    try { return await fn(); } catch (e: any) {
      const msg = String(e?.message || e?.sourceError?.cause || e);
      if (i === n || !/ENOTFOUND|fetch failed|timeout|not closed cleanly/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const rows = (await retry(() => withDb((sql) => sql`
    SELECT slug, updated_at FROM articles
    WHERE status = 'published' AND updated_at >= ${SINCE}
    ORDER BY updated_at
  `))) as unknown as Array<{ slug: string; updated_at: string }>;

  const slugs = rows.map((r) => r.slug);
  if (slugs.length === 0) throw new Error('ABORT: nothing updated since the cutoff.');
  for (const e of EXPECTED) if (!slugs.includes(e)) throw new Error(`ABORT: expected ${e} in the updated set, got ${slugs.join(', ')}`);
  if (slugs.length !== EXPECTED.length) throw new Error(`ABORT: ${slugs.length} guides changed, expected ${EXPECTED.length}: ${slugs.join(', ')}`);

  const urls = slugs.map((s) => `${SITE}/guides/${s}/`);

  // A URL is only worth submitting if it actually resolves. Submitting a soft 404 spends quota and
  // teaches Bing the page is thin.
  for (const u of urls) {
    const res = await fetch(u);
    if (!res.ok) throw new Error(`ABORT: ${u} returned ${res.status}`);
    const html = await res.text();
    if (!html.includes('<h1')) throw new Error(`ABORT: ${u} rendered without an H1 -- not prerendered yet`);
  }
  console.log(`  ok  all ${urls.length} URLs return 200 with rendered content`);

  if (!isBingWebmasterConfigured()) throw new Error('BING_WEBMASTER_API_KEY is not set.');
  const quota = await fetchBingSubmissionQuota(SITE);
  console.log(`  bing quota: ${quota.dailyQuota}/day, ${quota.monthlyQuota}/month remaining`);
  if (urls.length > quota.dailyQuota) throw new Error(`ABORT: ${urls.length} URLs exceeds daily quota ${quota.dailyQuota}`);

  if (!WRITE) {
    console.log('\nwould submit to Bing:');
    for (const u of urls) console.log(`  ${u}`);
    console.log('\nDRY RUN -- nothing submitted. Re-run with --write.');
    return;
  }

  const res = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${process.env.BING_WEBMASTER_API_KEY!}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ siteUrl: SITE, urlList: urls }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SubmitUrlBatch failed (${res.status}): ${text.slice(0, 400)}`);
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* an empty body is a success for this endpoint */ }
  if (json?.ErrorCode) throw new Error(`SubmitUrlBatch error ${json.ErrorCode}: ${json.Message}`);

  for (const u of urls) {
    await retry(() => withDb((sql) => sql`
      INSERT INTO bing_url_submissions (url) VALUES (${u}) ON CONFLICT (url) DO NOTHING`));
  }
  console.log(`\n  submitted ${urls.length} URLs to Bing`);
  const after = await fetchBingSubmissionQuota(SITE);
  console.log(`  quota now: ${after.dailyQuota}/day, ${after.monthlyQuota}/month remaining`);

  console.log('\nGoogle Search Console -- Request Indexing (UI only, one at a time):');
  for (const s of GSC_PRIORITY) console.log(`  ${SITE}/guides/${s}/`);
  console.log('\nLower priority (internal link added only, not worth a GSC slot today):');
  for (const s of slugs.filter((x) => !GSC_PRIORITY.includes(x))) console.log(`  ${SITE}/guides/${s}/`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
