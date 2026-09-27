// Is there evidence anyone searches for a subject we are thinking of writing about? Answered only
// from first-party data -- our own Search Console and Bing accounts -- with no paid service.
//
//   npx tsx scripts/topic-demand.ts "unpermitted" "contractor found" "opened wall"
//
// Each argument is a seed phrase. Writes two captures to data/keywords/ (one per engine, so the
// provenance gate can check each against its own source) and prints the strongest tier of evidence
// it found. Replaces keyword-volume lookups through OpenSEO/DataForSEO, retired 2026-09-27 when the
// credits ran out and the owner chose not to depend on any paid or third-party SEO service again.
//
// THE THREE THINGS IT LOOKS AT, strongest first:
//
//   1. Queries this site is ALREADY shown for that contain a seed (Search Console, 16 months, with
//      the page that was shown; Bing's query report). Real people, real searches, and a ranking
//      signal besides. It also names the page Google already associates with the subject, which is
//      usually the answer: UPDATE that page rather than open a new URL that competes with it.
//   2. Bing's own count for each seed across all of Bing (GetKeyword), plus related queries
//      (GetRelatedKeywords) filtered to ones that contain every word of the seed -- unfiltered, a
//      seed like "unpermitted work" returns "work schedule" and "work quotes". THIN: calibrated at
//      0 exact / 9 broad over 90 days for a query a paid tool put at 1,300 a month on Google. Use
//      it to rank phrasings against each other, never as a volume, and never read its zero as "no
//      demand".
//   3. Nothing. Then the only honest evidence left is a person looking at a live results page --
//      scripts/record-observation.ts -- or publishing as a stated experiment with a stop condition.
//
// It cannot produce a monthly search volume, and nothing in this project may state one from here
// on unless it came from a capture made before 2026-09-27.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from '../src/server/searchConsoleService.js';
import { isBingWebmasterConfigured, fetchBingQueries } from '../src/server/bingWebmasterService.js';
import { fetchBingKeyword, fetchRelatedKeywords } from '../src/server/bingKeywordService.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');
const SITE = 'https://www.beforeregret.com';
const STOP = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'my', 'your', 'with', 'by']);

const seeds = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((s) => s.trim().toLowerCase()).filter(Boolean);
if (!seeds.length) {
  console.error('usage: npx tsx scripts/topic-demand.ts "<seed phrase>" ["<seed phrase>" ...]');
  process.exit(1);
}
// A one-word seed ("contractor", "diy") matches everything from "contractor foreman login" to
// "mr cool diy mini split" -- measured on the first run. Warn rather than refuse: a single
// distinctive term ("polybutylene") is fine.
for (const s of seeds) {
  if (s.split(/\s+/).length === 1) console.warn(`  note: "${s}" is one word -- Bing market rows for it will be mostly unrelated. Prefer 2-4 word phrasings.`);
}
const today = new Date().toISOString().slice(0, 10);
const tag = seeds[0].replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w));

interface SiteRow { query: string; page: string; impressions: number; clicks: number; position: number }

async function gscQueriesContaining(seed: string): Promise<SiteRow[]> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const token = await getAccessToken();
  const end = new Date();
  const start = new Date(end.getTime() - 480 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: iso(start), endDate: iso(end), dimensions: ['query', 'page'], rowLimit: 25_000,
        dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: seed }] }],
      }),
    },
  );
  if (!res.ok) throw new Error(`Search Console failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const rows = ((await res.json()) as { rows?: Array<{ keys: string[]; impressions: number; clicks: number; position: number }> }).rows ?? [];
  return rows.map((r) => ({ query: r.keys[0], page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: r.position }));
}

async function main() {
  // ---- 1. Measured on this site -------------------------------------------------------------
  const gsc: SiteRow[] = [];
  for (const s of seeds) gsc.push(...(await gscQueriesContaining(s)));
  const gscByQuery = new Map<string, { impressions: number; clicks: number; pages: Map<string, number>; posSum: number }>();
  for (const r of gsc) {
    const cur = gscByQuery.get(r.query) ?? { impressions: 0, clicks: 0, pages: new Map(), posSum: 0 };
    // A query appearing under two seeds is fetched twice; only count each (query, page) pair once.
    if (cur.pages.has(r.page)) continue;
    cur.impressions += r.impressions; cur.clicks += r.clicks; cur.posSum += r.position * r.impressions;
    cur.pages.set(r.page, r.impressions);
    gscByQuery.set(r.query, cur);
  }

  let bingSite: Array<{ query: string; impressions: number; clicks: number; position: number }> = [];
  const bingMarket: Array<{ keyword: string; exact: number; broad: number; kind: 'seed' | 'related' }> = [];
  let relatedDropped = 0;
  if (isBingWebmasterConfigured()) {
    const all = await fetchBingQueries(SITE);
    bingSite = all
      .filter((r) => seeds.some((s) => r.query.toLowerCase().includes(s)))
      .map((r) => ({ query: r.query, impressions: r.impressions, clicks: r.clicks, position: r.avgImpressionPosition }));

    // ---- 2. Bing market counts ----------------------------------------------------------------
    for (const s of seeds) {
      const k = await fetchBingKeyword(s);
      bingMarket.push({ keyword: s, exact: k.impressions, broad: k.broadImpressions, kind: 'seed' });
      const need = words(s);
      for (const r of await fetchRelatedKeywords(s)) {
        const have = new Set(words(r.query));
        if (!need.every((w) => have.has(w))) { relatedDropped++; continue; }
        if (bingMarket.some((m) => m.keyword === r.query.toLowerCase())) continue;
        bingMarket.push({ keyword: r.query.toLowerCase(), exact: r.impressions, broad: r.broadImpressions, kind: 'related' });
      }
    }
  }

  // ---- Captures -------------------------------------------------------------------------------
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  const base = { captured_at: new Date().toISOString(), location_name: 'United States', language_code: 'en', cost_usd: 0, seeds };
  const gscId = `${today}-demand-${tag}-gsc`;
  fs.writeFileSync(path.join(CAPTURE_DIR, `${gscId}.json`), `${JSON.stringify({
    source: 'gsc',
    endpoint: 'search console api searchAnalytics.query, dimensions=query+page, query contains seed, 16 months (this site\'s impressions, not market volume)',
    ...base,
    keywords: [...gscByQuery].map(([keyword, v]) => ({
      keyword, search_volume: v.impressions, impressions: v.impressions, clicks: v.clicks,
      position: v.impressions ? Number((v.posSum / v.impressions).toFixed(1)) : null,
      pages: Object.fromEntries(v.pages),
    })).sort((a, b) => b.impressions - a.impressions),
  }, null, 2)}\n`);
  const bingId = `${today}-demand-${tag}-bing`;
  fs.writeFileSync(path.join(CAPTURE_DIR, `${bingId}.json`), `${JSON.stringify({
    source: 'bing',
    endpoint: 'bing webmaster GetQueryStats (metric=site: this site\'s impressions) + GetKeyword/GetRelatedKeywords (metric=market: all of Bing, 90 days, thin sample -- relative only, zero means unknown)',
    ...base,
    keywords: [
      ...bingSite.map((r) => ({ keyword: r.query, search_volume: r.impressions, metric: 'site', clicks: r.clicks, position: r.position })),
      ...bingMarket.map((m) => ({ keyword: m.keyword, search_volume: m.exact || null, metric: 'market', broad_impressions: m.broad, kind: m.kind })),
    ],
  }, null, 2)}\n`);

  // ---- Report ---------------------------------------------------------------------------------
  const siteRows = [...gscByQuery].sort((a, b) => b[1].impressions - a[1].impressions);
  console.log(`\nSeeds: ${seeds.map((s) => `"${s}"`).join(', ')}\n`);
  console.log('1. ALREADY SHOWN ON THIS SITE (Search Console, 16 months)');
  if (!siteRows.length) console.log('   none');
  const pageTotals = new Map<string, number>();
  for (const [q, v] of siteRows.slice(0, 25)) {
    const top = [...v.pages].sort((a, b) => b[1] - a[1])[0][0].replace(SITE, '');
    console.log(`   ${String(v.impressions).padStart(5)} impr  ${String(v.clicks).padStart(2)} clk  pos ${(v.posSum / (v.impressions || 1)).toFixed(1).padStart(5)}   ${q}   -> ${top}`);
  }
  for (const [, v] of siteRows) for (const [p, n] of v.pages) pageTotals.set(p, (pageTotals.get(p) ?? 0) + n);
  if (pageTotals.size) {
    console.log('\n   Pages Google already shows for this subject (update one of these before creating a URL):');
    for (const [p, n] of [...pageTotals].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`   ${String(n).padStart(5)} impr   ${p.replace(SITE, '')}`);
  }
  console.log('\n   Bing, this site:');
  if (!bingSite.length) console.log('   none');
  for (const r of bingSite.slice(0, 15)) console.log(`   ${String(r.impressions).padStart(5)} impr  ${String(r.clicks).padStart(2)} clk   ${r.query}`);

  console.log('\n2. BING MARKET COUNTS (90 days, thin sample: relative only, zero = unknown)');
  if (!isBingWebmasterConfigured()) console.log('   skipped: BING_WEBMASTER_API_KEY not set');
  for (const m of bingMarket.sort((a, b) => b.broad - a.broad).slice(0, 20)) {
    console.log(`   exact ${String(m.exact).padStart(5)}  broad ${String(m.broad).padStart(6)}   ${m.kind === 'seed' ? '*' : ' '} ${m.keyword}`);
  }
  if (relatedDropped) console.log(`   (${relatedDropped} related queries dropped for not containing every word of their seed)`);

  const tier = siteRows.length || bingSite.length ? 1 : bingMarket.some((m) => m.exact || m.broad) ? 2 : 3;
  // Tier 1 on a handful of impressions is still tier 1, but it is thin -- the first run reached it
  // on 1-2 impressions per query, several of them long machine-shaped strings ("...measure
  // sustainability explained near me") that no person typed. So the total is always printed and a
  // small one is labelled, never rounded up into "measured demand".
  const siteImpr = siteRows.reduce((n, [, v]) => n + v.impressions, 0) + bingSite.reduce((n, r) => n + r.impressions, 0);
  const weak = tier === 1 && siteImpr < 20;
  console.log(`\nSTRONGEST EVIDENCE: tier ${tier}${weak ? ' (WEAK)' : ''} -- ${[
    '',
    `people already find this site through these searches: ${siteImpr} impressions across ${siteRows.length + bingSite.length} query rows.${weak ? ' Under 20 -- a hint that the subject exists, not measured demand. Read the queries; discount any no person would type.' : ' Measured demand.'}`,
    'Bing records searches for these phrasings, but not through this site. Real, unquantified demand.',
    'no first-party signal. Record what a live results page shows (scripts/record-observation.ts), or publish only as a stated experiment with a stop condition.',
  ][tier]}`);
  console.log(`\nCaptures: data/keywords/${gscId}.json, data/keywords/${bingId}.json`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
