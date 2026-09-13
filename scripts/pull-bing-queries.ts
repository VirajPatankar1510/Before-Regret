// Pull Bing Webmaster query data into a citable capture.
//
//   npx tsx scripts/pull-bing-queries.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS, given scripts/import-gsc-export.ts already accepts a Bing CSV.
//
// It does not need one. src/server/bingWebmasterService.js has held fetchBingQueries since before
// this session, and BING_WEBMASTER_API_KEY is set -- so the CSV export was never necessary and the
// capture on disk from 2026-09-11 was typed in by hand for no reason. The import path stays for
// the case where the API is unavailable; this is the one to reach for first.
//
// WHY BING AT ALL, restated because the click totals make it easy to dismiss: Bing's query report
// disclosed 100% of its clicks where Google's disclosed 4%. It is not a traffic source on this
// property, it is the only usable QUERY instrument. See [[beforeregret-bing-vs-google-measurement]].
//
// A NOTE ON DUPLICATE ROWS. The API returns the same page more than once -- sump-pump appears twice
// with different impression counts. Those are separate buckets, not a bug, so rows are summed by
// query rather than assumed unique.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBingWebmasterConfigured, fetchBingQueries } from '../src/server/bingWebmasterService.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');
const SITE = 'https://www.beforeregret.com';

async function main() {
  if (!isBingWebmasterConfigured()) throw new Error('ABORT: BING_WEBMASTER_API_KEY is not set.');

  const raw = await fetchBingQueries(SITE);
  if (!raw?.length) throw new Error('ABORT: Bing returned no query rows.');

  // Sum duplicates rather than letting the last row win.
  const byQuery = new Map<string, { impressions: number; clicks: number; posSum: number; n: number }>();
  for (const r of raw as any[]) {
    const q = String(r.query ?? r.Query ?? '').trim();
    if (!q) continue;
    const imp = Number(r.impressions ?? r.Impressions ?? 0);
    const clk = Number(r.clicks ?? r.Clicks ?? 0);
    const pos = Number(r.avgImpressionPosition ?? r.AvgImpressionPosition ?? r.position ?? 0);
    const cur = byQuery.get(q) ?? { impressions: 0, clicks: 0, posSum: 0, n: 0 };
    cur.impressions += imp; cur.clicks += clk;
    if (pos) { cur.posSum += pos * (imp || 1); cur.n += (imp || 1); }
    byQuery.set(q, cur);
  }

  const keywords = [...byQuery].map(([keyword, v]) => ({
    keyword,
    // The gate reads search_volume. For a measured report the honest analogue is impressions --
    // how often this site was actually shown. NOT market volume; the endpoint field says so.
    search_volume: v.impressions,
    clicks: v.clicks,
    impressions: v.impressions,
    position: v.n ? Number((v.posSum / v.n).toFixed(1)) : null,
  })).sort((a, b) => b.impressions - a.impressions);

  const id = `${new Date().toISOString().slice(0, 10)}-bing-queries`;
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CAPTURE_DIR, `${id}.json`), `${JSON.stringify({
    source: 'bing',
    endpoint: 'bing webmaster api GetQueryStats (measured impressions, not market volume)',
    captured_at: new Date().toISOString(),
    location_name: 'United States', language_code: 'en', cost_usd: 0,
    site_url: SITE,
    keywords,
  }, null, 2)}\n`);

  const clicks = keywords.reduce((s, k) => s + k.clicks, 0);
  const impr = keywords.reduce((s, k) => s + k.impressions, 0);
  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`  ${keywords.length} queries | ${impr} impressions | ${clicks} clicks\n`);
  for (const k of keywords.filter((k) => k.clicks > 0).slice(0, 12)) {
    console.log(`    ${String(k.clicks).padStart(2)} clk  ${String(k.impressions).padStart(3)} imp  pos ${String(k.position).padStart(5)}   ${k.keyword.slice(0, 58)}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
