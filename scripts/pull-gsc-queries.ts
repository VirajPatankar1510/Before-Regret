// Pull every Search Console query for the site into a citable capture, straight from Google.
//
//   npx tsx scripts/pull-gsc-queries.ts              # full 16-month history
//   npx tsx scripts/pull-gsc-queries.ts --days 28
//
// Replaces scripts/pull-gsc-via-openseo.ts (retired 2026-09-27). That script read the SAME data
// through a self-hosted OpenSEO container, whose paid keyword/SERP half (DataForSEO) ran out and is
// not coming back. Search Console never needed the middleman: src/server/searchConsoleService.ts
// already holds the OAuth grant, and it is free, uncapped for our volume, and first-party -- it
// reports this site's own impressions, nothing else. Same output file shape as before, so
// scripts/assert-keyword-provenance.ts and every existing capture keep working unchanged.
//
// WHAT IT IS NOT. Google's query dimension is disclosure-filtered (it showed ~5% of clicks here),
// so this answers "which queries exist", never "how much". Totals come from the page dimension --
// fetchPagePerformance(). And it only ever contains queries the site was ALREADY shown for; demand
// for a subject with no page yet is scripts/topic-demand.ts's job.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from '../src/server/searchConsoleService.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function main() {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) throw new Error('ABORT: GSC_SITE_URL is not set.');
  const token = await getAccessToken();

  // Explicit dates ending TODAY. The newest two or three days are incomplete and will rise on a
  // later pull; that is a reason to re-pull, not to cut them off (the old convenience windows
  // silently dropped them). 480 days covers Search Console's full ~16-month retention.
  const days = Number(arg('days') ?? 480);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Page until Google stops returning rows -- a silently truncated pull would read as "these
  // queries do not exist", which is the one conclusion this capture must never support by accident.
  const all: Row[] = [];
  for (let startRow = 0; startRow < 100_000; startRow += 25_000) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: iso(start), endDate: iso(end),
          dimensions: ['query'], rowLimit: 25_000, startRow,
        }),
        signal: AbortSignal.timeout(120_000),
      },
    );
    if (!res.ok) throw new Error(`Search Console query failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const rows = ((await res.json()) as { rows?: Row[] }).rows ?? [];
    all.push(...rows);
    if (rows.length < 25_000) break;
  }
  if (!all.length) throw new Error('ABORT: Search Console returned no rows.');

  const keywords = all.map((r) => ({
    keyword: r.keys[0],
    // The gate reads search_volume. For a measured report the honest analogue is impressions --
    // how often this site was actually shown. NOT market volume; the endpoint field says so.
    search_volume: r.impressions ?? null,
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position == null ? null : Number(r.position.toFixed(1)),
    ctr: r.ctr == null ? null : Number((r.ctr * 100).toFixed(2)),
  }));

  const id = `${iso(end)}-gsc-queries`;
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CAPTURE_DIR, `${id}.json`), `${JSON.stringify({
    source: 'gsc',
    endpoint: 'search console api searchAnalytics.query, dimension=query (measured impressions, not market volume)',
    captured_at: new Date().toISOString(),
    location_name: 'United States', language_code: 'en', cost_usd: 0,
    site_url: siteUrl, date_range: `${iso(start)}..${iso(end)}`,
    keywords,
  }, null, 2)}\n`);

  const clicked = keywords.filter((k) => k.clicks > 0);
  const impr = keywords.reduce((s, k) => s + k.impressions, 0);
  const clicks = keywords.reduce((s, k) => s + k.clicks, 0);
  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`  ${siteUrl}  ${iso(start)} -> ${iso(end)}`);
  console.log(`  ${keywords.length} queries | ${impr.toLocaleString()} impressions | ${clicks} clicks (query dimension -- a filtered sample, not the site total)\n`);
  console.log('  QUERIES THAT EARNED CLICKS');
  console.log('    clicks  impr    pos   query');
  for (const k of [...clicked].sort((a, b) => b.clicks - a.clicks)) {
    console.log(`    ${String(k.clicks).padStart(6)}  ${String(k.impressions).padStart(5)}  ${String(k.position ?? '-').padStart(5)}   ${k.keyword}`);
  }
  // Striking distance: real demand, ranking just off page one, no clicks yet. The list worth acting
  // on, and the one thing that cannot be produced by guessing.
  const striking = keywords
    .filter((k) => k.clicks === 0 && k.impressions >= 5 && k.position != null && k.position >= 8 && k.position <= 25)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 15);
  console.log('\n  STRIKING DISTANCE (5+ impressions, position 8-25, zero clicks)');
  console.log('    impr    pos   query');
  for (const k of striking) console.log(`    ${String(k.impressions).padStart(5)}  ${String(k.position).padStart(5)}   ${k.keyword}`);
}

main().catch((e) => { console.error(`\n${e.message || e}`); process.exit(1); });
