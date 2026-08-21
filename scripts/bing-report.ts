// Bing Webmaster Tools report -- the second opinion on everything Search Console has been telling
// us about this site.
//
//   npx tsx scripts/bing-report.ts
//
// The point is not Bing traffic for its own sake; Bing is a small share of US search. The point is
// that Bing's index is an INDEPENDENT judgment of the same pages. Google reports nearly every
// /county/ page as "Discovered - currently not indexed", and from inside Google there is no way to
// separate "these pages are weak" from "this site is too new for Google to spend crawl on". A page
// Bing has indexed and Google has not is evidence about Google's threshold rather than about the
// page -- which is the distinction this project keeps needing.
import 'dotenv/config';
import {
  isBingWebmasterConfigured, fetchBingSites, fetchBingTraffic, fetchBingQueries,
  fetchBingPages, fetchBingCrawlStats, fetchBingSubmissionQuota,
} from '../src/server/bingWebmasterService.js';

const SITE = 'https://www.beforeregret.com';
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '????-??-??');

async function main() {
  if (!isBingWebmasterConfigured()) throw new Error('BING_WEBMASTER_API_KEY is not set.');

  const sites = await fetchBingSites();
  console.log('=== VERIFIED SITES ===');
  for (const s of sites) console.log(`  ${s.isVerified ? 'verified  ' : 'UNVERIFIED'} ${s.url}`);

  const [traffic, queries, pages, crawl, quota] = await Promise.all([
    fetchBingTraffic(SITE), fetchBingQueries(SITE), fetchBingPages(SITE),
    fetchBingCrawlStats(SITE), fetchBingSubmissionQuota(SITE),
  ]);

  console.log('\n=== TRAFFIC ===');
  const imp = traffic.reduce((n, t) => n + t.impressions, 0);
  const clk = traffic.reduce((n, t) => n + t.clicks, 0);
  console.log(`  ${traffic.length} data point(s): ${imp} impressions, ${clk} clicks`);
  for (const t of traffic.slice(-10)) console.log(`    ${day(t.date)}  ${String(t.impressions).padStart(5)} imp  ${String(t.clicks).padStart(3)} clk`);

  console.log('\n=== CRAWL & INDEX (Bing) ===');
  if (crawl.length === 0) console.log('  no crawl data');
  for (const c of crawl.slice(-8)) {
    console.log(`    ${day(c.date)}  crawled ${String(c.crawledPages).padStart(5)}  inIndex ${String(c.inIndex).padStart(5)}  inLinks ${String(c.inLinks).padStart(6)}`);
    console.log(`                 2xx ${String(c.code2xx).padStart(4)}  301 ${String(c.code301).padStart(3)}  302 ${String(c.code302).padStart(3)}  4xx ${String(c.code4xx).padStart(3)}  5xx ${String(c.code5xx).padStart(3)}  robots-blocked ${c.blockedByRobotsTxt}  other ${c.allOtherCodes}`);
  }
  const latest = crawl[crawl.length - 1];
  if (latest) {
    console.log(`\n  latest: ${latest.inIndex} page(s) in Bing's index, ${latest.crawledPages} crawled`);
    // The comparison worth making. Google has 3 hub pages + a handful of guides indexed and is
    // declining ~250 URLs; if Bing's index count is far higher, the pages are fine and Google's
    // threshold is the variable.
    if (latest.inIndex > 50) {
      console.log('  -> Bing has indexed substantially more than Google has. That points at');
      console.log('     Google\'s threshold for a young site, NOT at the pages being weak.');
    } else if (latest.inIndex > 0) {
      console.log('  -> Bing has indexed some pages but not many. Weaker signal either way.');
    }
  }

  console.log('\n=== TOP QUERIES (Bing) ===');
  if (queries.length === 0) console.log('  none');
  for (const q of queries.slice(0, 15)) {
    console.log(`  ${String(q.impressions).padStart(4)} imp ${String(q.clicks).padStart(3)} clk  avgPos ${String(q.avgImpressionPosition).padStart(4)}  "${q.query}"`);
  }

  console.log('\n=== TOP PAGES (Bing) ===');
  if (pages.length === 0) console.log('  none');
  for (const p of pages.slice(0, 15)) {
    console.log(`  ${String(p.impressions).padStart(4)} imp ${String(p.clicks).padStart(3)} clk  avgPos ${String(p.avgImpressionPosition).padStart(4)}  ${p.page}`);
  }

  console.log('\n=== URL SUBMISSION QUOTA ===');
  console.log(`  daily: ${quota.dailyQuota}   monthly: ${quota.monthlyQuota}`);
  console.log('  Unlike Google, Bing accepts URL submissions through the API rather than only the');
  console.log('  UI -- see scripts/bing-submit-urls.ts. Worth noting this is submission, which asks');
  console.log('  Bing to crawl; it is not a promise to index.');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
