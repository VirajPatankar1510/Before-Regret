// Re-submits the guides changed in this session to Bing, and prints the GSC request-indexing list.
//
//   npx tsx scripts/bing-submit-updated.ts            # DRY RUN
//   npx tsx scripts/bing-submit-updated.ts --write    # actually submits
//
// WHY NOT bing-submit-urls.ts. That script exists to work through a BACKLOG: it skips any URL
// already present in bing_url_submissions, which is exactly right when the job is "get every page
// submitted once" and exactly wrong here. All 34 of these URLs were submitted weeks ago; what
// changed today is their CONTENT, and the ask is a re-crawl. Running the backlog script would
// correctly decide there was nothing to do and submit nothing.
//
// Re-submitting a URL whose content genuinely changed is the intended use of SubmitUrlBatch, not
// an abuse of it. Quota is not a concern at this size: 100/day and 2500/month remain against 34.
//
// THE WINDOW. Pages are selected by updated_at rather than by a hand-typed list, because a list I
// retype is a list that can silently disagree with what actually changed. The cutoff is
// 2026-09-05T12:00Z, which sits inside a 43-hour gap in the updated_at distribution -- the last
// edit before this session's work was 2026-09-03 17:51, and the first edit of it was
// 2026-09-05 12:48. So the boundary is read off the data, not guessed.
//
// WHAT THIS IS NOT. Submitting asks Bing to crawl. It is not a promise to index, and it has no
// effect whatsoever on Google -- Google's equivalent is UI-only, one URL at a time, which is why
// this script prints a prioritised list for a human to paste rather than pretending to automate it.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';
import { isBingWebmasterConfigured, fetchBingSubmissionQuota } from '../src/server/bingWebmasterService.js';

const SITE = 'https://www.beforeregret.com';
const WRITE = process.argv.includes('--write');
const SINCE = '2026-09-05T12:00:00Z';

// Google's Request Indexing is rate-limited to roughly a dozen URLs a day, so an unordered list of
// 34 is not actionable. These are the pages whose CONTENT changed substantively -- new sections,
// a retarget, a restore -- as opposed to the ones that gained an internal link or a shorter meta.
// Everything else is worth submitting to Bing but not worth spending a scarce GSC slot on today.
const PRIORITY = [
  'check-code-violations-property-online',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
  'legalize-unpermitted-deck',
  'check-building-permits-philadelphia-county-pa',
  'check-building-permits-clark-county-nv',
  'check-building-permits-bronx-ny',
];

async function retry<T>(fn: () => Promise<T>, n = 8): Promise<T> {
  for (let i = 1; i <= n; i++) {
    try { return await fn(); } catch (e: any) {
      const msg = String(e?.message || e?.sourceError?.cause || e);
      if (i === n || !/ENOTFOUND|fetch failed|timeout/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 2000 * i));
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

  if (rows.length === 0) throw new Error('ABORT: no guides updated since the cutoff -- refusing to submit an empty batch.');

  const urls = rows.map((r) => `${SITE}/guides/${r.slug}/`);
  const slugs = new Set(rows.map((r) => r.slug));
  for (const p of PRIORITY) if (!slugs.has(p)) throw new Error(`ABORT: priority slug ${p} is not in the updated set`);

  console.log(`guides updated since ${SINCE.slice(0, 10)}: ${rows.length}`);

  if (!isBingWebmasterConfigured()) throw new Error('BING_WEBMASTER_API_KEY is not set.');
  const quota = await fetchBingSubmissionQuota(SITE);
  console.log(`bing quota: ${quota.dailyQuota}/day, ${quota.monthlyQuota}/month remaining`);
  if (urls.length > quota.dailyQuota) throw new Error(`ABORT: ${urls.length} URLs exceeds the daily quota of ${quota.dailyQuota}`);

  if (!WRITE) {
    console.log('\nwould submit:');
    for (const u of urls) console.log(`  ${u.replace(SITE, '')}`);
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
  try { json = JSON.parse(text); } catch { /* empty body is a success for this endpoint */ }
  if (json?.ErrorCode) throw new Error(`SubmitUrlBatch error ${json.ErrorCode}: ${json.Message}`);

  for (const u of urls) {
    await retry(() => withDb((sql) => sql`
      INSERT INTO bing_url_submissions (url) VALUES (${u}) ON CONFLICT (url) DO NOTHING`));
  }
  console.log(`\nsubmitted ${urls.length} URL(s) to Bing.`);
  const after = await fetchBingSubmissionQuota(SITE);
  console.log(`quota now : ${after.dailyQuota}/day, ${after.monthlyQuota}/month remaining`);

  console.log('\n================ GOOGLE SEARCH CONSOLE ================');
  console.log('Request Indexing is UI-only and capped near a dozen URLs a day.');
  console.log(`\nPRIORITY -- substantive content changes (${PRIORITY.length}):`);
  for (const s of PRIORITY) console.log(`${SITE}/guides/${s}/`);
  const rest = rows.map((r) => r.slug).filter((s) => !PRIORITY.includes(s));
  console.log(`\nREMAINDER -- internal links and meta only (${rest.length}):`);
  for (const s of rest) console.log(`${SITE}/guides/${s}/`);
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
