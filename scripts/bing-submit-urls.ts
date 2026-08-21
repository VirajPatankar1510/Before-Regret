// Submits URLs to Bing for crawling, via the Webmaster API.
//
//   npx tsx scripts/bing-submit-urls.ts                 # DRY RUN -- shows what would be sent
//   npx tsx scripts/bing-submit-urls.ts --write         # actually submits
//   npx tsx scripts/bing-submit-urls.ts --write --limit 50
//
// WHY THIS IS WORTH HAVING. Google's equivalent ("Request Indexing") is UI-only, one URL at a
// time, and heavily rate-limited -- which is why several manual Search Console steps keep landing
// on the user in this project. Bing exposes the same idea as an API with a real quota (100/day,
// 1100/month for this property), so the whole backlog can be submitted without clicking anything.
//
// WHAT IT IS NOT. Submitting asks Bing to CRAWL a URL. It is not a promise to index it, and it
// does not affect Google at all. Bing already had 95 pages indexed when this was written, against
// a handful at Google, so the marginal value here is finishing Bing's coverage of the ~262
// published URLs -- not fixing the Google problem, which this cannot touch.
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

async function collectUrls(): Promise<string[]> {
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');
  const urls: string[] = [`${SITE}/`, `${SITE}/guides/`, `${SITE}/counties/`, `${SITE}/about/`];
  const guides = await retry(() => withDb((sql) => sql`SELECT slug FROM articles WHERE status='published' ORDER BY published_at DESC`));
  for (const r of guides as any[]) urls.push(`${SITE}/guides/${r.slug}/`);
  const counties = await retry(() => withDb((sql) => sql`SELECT slug FROM county_data WHERE data_complete=true ORDER BY population DESC NULLS LAST`));
  for (const r of counties as any[]) urls.push(`${SITE}/county/${r.slug}/`);
  return urls;
}

async function main() {
  if (!isBingWebmasterConfigured()) throw new Error('BING_WEBMASTER_API_KEY is not set.');

  const quota = await fetchBingSubmissionQuota(SITE);
  const all = await collectUrls();
  const batch = all.slice(0, Math.min(LIMIT, quota.dailyQuota));

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

  console.log(`\nsubmitted ${batch.length} URL(s).`);
  const after = await fetchBingSubmissionQuota(SITE);
  console.log(`quota now: ${after.dailyQuota}/day, ${after.monthlyQuota}/month remaining`);
  console.log('\nThis asks Bing to crawl these URLs. It is not a promise to index them, and it has');
  console.log('no effect on Google.');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
