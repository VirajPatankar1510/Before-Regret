// Turn a Search Console "Performance on Search Generative AI Features" export into a dated capture.
//
//   npx tsx scripts/import-ai-features.ts <path-to-export-dir>
//
// -----------------------------------------------------------------------------------------------
// WHY AN IMPORTER AND NOT A PULL SCRIPT. There is no API for this report. Verified 2026-09-17
// against the searchAnalytics endpoint: the `searchAppearance` dimension returns exactly one value
// on this property, TRANSLATED_RESULT, with or without `type: 'web'`, and filtering on
// AI_OVERVIEW / AI_MODE / SGE / GENERATIVE_AI returns nothing. Every other instrument in this repo
// pulls; this one cannot, so the export is the instrument and the importer is what makes it
// repeatable. Export from Search Console > Performance > Search type: Web > the Generative AI
// Features view, "Export" > CSV, and point this at the unzipped folder.
//
// WHY IT MATTERS ENOUGH TO BUILD. The first export, 28 days to 2026-09-17, showed 963 impressions
// -- 13.9% of everything Google showed for this site -- on a surface nobody here had measured once.
// It also refuted the standing explanation for the 4-5 September definitional collapse: AI and web
// impressions move together at Pearson r = 0.936, both fell on the same day, so AI Overviews were
// not absorbing those queries. See [[beforeregret-definitional-cluster-collapse]].
//
// WHAT THE CAPTURE IS FOR. Same provenance discipline as data/keywords/*.json: a dated file with
// its source and window, so a later claim about this channel cites a measurement rather than a
// memory. This report has no query dimension -- pages, countries, devices and a daily series are
// all Google gives -- so the shape differs from the keyword captures and is deliberately not
// pretending to be one.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from '../src/server/searchConsoleService.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data', 'keywords');
const SITE = 'https://www.beforeregret.com';

/** GSC exports are `Label,Number` with the label possibly containing commas. Split on the LAST. */
function readCsv(dir: string, file: string): Array<[string, number]> {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) throw new Error(`ABORT: ${file} not found in the export directory`);
  return fs.readFileSync(p, 'utf8').trim().split('\n').slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const i = l.lastIndexOf(',');
      return [l.slice(0, i).trim(), Number(l.slice(i + 1))] as [string, number];
    });
}

async function webDaily(start: string, end: string): Promise<Map<string, number>> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL!)}/searchAnalytics/query`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['date'], rowLimit: 500 }) }
  );
  if (!res.ok) throw new Error(`ABORT: Search Console daily query failed (${res.status})`);
  return new Map(((await res.json()) as any).rows?.map((r: any) => [r.keys[0], r.impressions]) ?? []);
}

/** Pearson r. Reported because the single most useful thing this export did was settle a causal
 *  question, and a correlation quoted without its coefficient is an assertion. */
function pearson(pairs: Array<[number, number]>): number {
  const n = pairs.length;
  if (n < 3) return NaN;
  const mx = pairs.reduce((s, [x]) => s + x, 0) / n;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / n;
  const cov = pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const sx = Math.sqrt(pairs.reduce((s, [x]) => s + (x - mx) ** 2, 0));
  const sy = Math.sqrt(pairs.reduce((s, [, y]) => s + (y - my) ** 2, 0));
  return cov / (sx * sy);
}

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error('ABORT: pass the path to the unzipped export directory');
  if (!fs.existsSync(dir)) throw new Error(`ABORT: ${dir} does not exist`);

  const chart = readCsv(dir, 'Chart.csv');
  const pages = readCsv(dir, 'Pages.csv');
  const countries = readCsv(dir, 'Countries.csv');
  const devices = readCsv(dir, 'Devices.csv');

  const total = pages.reduce((s, [, n]) => s + n, 0);
  const deviceTotal = devices.reduce((s, [, n]) => s + n, 0);
  // The four tables are four cuts of ONE number. If they disagree the export is partial, and a
  // capture built from a partial export would be quietly wrong forever.
  const countryTotal = countries.reduce((s, [, n]) => s + n, 0);
  if (Math.abs(deviceTotal - countryTotal) > 1) {
    throw new Error(`ABORT: devices total ${deviceTotal} != countries total ${countryTotal} -- partial export`);
  }

  const dates = chart.map(([d]) => d).sort();
  const start = dates[0], end = dates[dates.length - 1];
  const web = await webDaily(start, end);

  const pairs: Array<[number, number]> = [];
  for (const [d, ai] of chart) {
    const w = web.get(d);
    if (w !== undefined) pairs.push([w, ai]);
  }
  const r = pearson(pairs);
  const webTotal = pairs.reduce((s, [w]) => s + w, 0);

  const capture = {
    source: 'gsc-generative-ai-features',
    endpoint: 'Search Console UI export (no API exists -- searchAppearance exposes only TRANSLATED_RESULT)',
    captured_at: new Date().toISOString(),
    start_date: start,
    end_date: end,
    site_url: SITE,
    cost_usd: 0,
    ai_impressions: deviceTotal,
    web_impressions_same_window: webTotal,
    ai_share_of_web: webTotal ? Number((deviceTotal / webTotal).toFixed(4)) : null,
    pearson_r_ai_vs_web_daily: Number(r.toFixed(3)),
    daily: chart.map(([date, ai]) => ({ date, ai, web: web.get(date) ?? null })),
    pages: pages.map(([url, ai]) => ({ url, ai })),
    countries: countries.map(([country, ai]) => ({ country, ai })),
    devices: devices.map(([device, ai]) => ({ device, ai })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const id = `${new Date().toISOString().slice(0, 10)}-gsc-ai-features`;
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), `${JSON.stringify(capture, null, 2)}\n`);

  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`  window ${start} .. ${end}`);
  console.log(`  AI-feature impressions : ${deviceTotal}`);
  console.log(`  web impressions same window: ${webTotal}  (AI is ${(deviceTotal / webTotal * 100).toFixed(1)}% of it)`);
  console.log(`  Pearson r, AI vs web daily : ${r.toFixed(3)} over ${pairs.length} days`);
  console.log(`    ${r > 0.8 ? 'AI and web move together -- AI features are NOT cannibalising web impressions.'
    : r < 0.2 ? 'AI and web move independently -- worth investigating what drives AI separately.'
    : 'Partial relationship -- neither clearly coupled nor independent.'}`);
  const topDev = [...devices].sort((a, b) => b[1] - a[1]);
  console.log(`  devices: ${topDev.map(([d, n]) => `${d} ${(n / deviceTotal * 100).toFixed(0)}%`).join(', ')}`);
  const us = countries.find(([c]) => c === 'United States');
  if (us) console.log(`  United States: ${(us[1] / countryTotal * 100).toFixed(0)}% of AI impressions`);
  console.log(`\n  top pages by AI-feature impressions:`);
  for (const [u, n] of [...pages].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`    ${String(n).padStart(4)}  ${u.replace(SITE, '')}`);
  }
  console.log('');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
