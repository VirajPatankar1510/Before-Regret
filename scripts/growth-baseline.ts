// P0 of docs/plans/growth-execution-plan-2026-10.md: one dated snapshot that every later "it worked" is compared to.
// Run the same script each week (P8) so the method never changes between readings.
//
//   npx tsx --import ./scripts/lib/neon-curl.ts scripts/growth-baseline.ts            # prints, writes nothing
//   WRITE=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/growth-baseline.ts # also writes data/experiments/<date>-growth-baseline.json
//
// Google: the PAGE dimension (the honest total -- the query dimension is a filtered sample), 28 days ending today,
// which includes Search Console's 2-3 day lag. Bing: the latest data/keywords/*-bing-queries.json capture (Bing
// discloses all its queries; its counts are a thin sample, so read them relative, never as market size).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fetchPagePerformance } from '../src/server/searchConsoleService.js';
import { withDb } from '../src/server/db.js';

const DAYS = 28;
const SITE = 'https://www.beforeregret.com';
const today = new Date().toISOString().slice(0, 10);

// A guide URL Google still shows that is NOT a published guide (pruned/410, or a pre-pivot leftover) gets its own
// kind, so it never inflates the per-page average of live guides. Section anchors (#...) fold into their page.
type Kind = 'county-permit-guide' | 'other-guide' | 'unpublished-guide-url' | 'research' | 'homepage' | 'other';
let PUBLISHED = new Set<string>();
const kindOf = (p: string): Kind =>
  p.startsWith('/guides/') && p !== '/guides/' && !PUBLISHED.has(p) ? 'unpublished-guide-url'
    : p.startsWith('/guides/check-building-permits-') ? 'county-permit-guide'
    : p.startsWith('/guides/') && p !== '/guides/' ? 'other-guide'
      : p.startsWith('/research/') && p !== '/research/' ? 'research'
        : p === '/' ? 'homepage' : 'other';

async function main() {
  const rows = await fetchPagePerformance(DAYS);
  const articles = (await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`)) as unknown as Array<{ slug: string }>;
  PUBLISHED = new Set(articles.map((a) => `/guides/${a.slug}/`));
  const sitemapPages = fs.readFileSync(path.join(process.cwd(), 'public', 'sitemaps', 'sitemap-pages.xml'), 'utf8');
  const researchCount = (sitemapPages.match(/<loc>[^<]*\/research\/[a-z0-9-]+\/<\/loc>/g) || []).length;
  const published: Record<Kind, number> = {
    'county-permit-guide': articles.filter((a) => a.slug.startsWith('check-building-permits-')).length,
    'other-guide': articles.filter((a) => !a.slug.startsWith('check-building-permits-')).length,
    'unpublished-guide-url': 0, research: researchCount, homepage: 1, other: 0,
  };
  const google: Record<string, { pagesShown: number; published: number; impressions: number; clicks: number; imprPerPublishedPage: number | null }> = {};
  for (const k of Object.keys(published) as Kind[]) google[k] = { pagesShown: 0, published: published[k], impressions: 0, clicks: 0, imprPerPublishedPage: null };
  let totImpr = 0, totClicks = 0;
  const seen = new Map<string, Kind>();
  const unpublishedShown: Array<{ url: string; impressions: number; clicks: number }> = [];
  for (const r of rows as Array<{ page: string; clicks: number; impressions: number }>) {
    const p = r.page.replace(SITE, '').split('?')[0].split('#')[0] || '/';
    const kind = kindOf(p);
    const g = google[kind];
    if (!seen.has(p)) { g.pagesShown++; seen.set(p, kind); }
    g.impressions += r.impressions; g.clicks += r.clicks;
    if (kind === 'unpublished-guide-url') unpublishedShown.push({ url: p, impressions: r.impressions, clicks: r.clicks });
    totImpr += r.impressions; totClicks += r.clicks;
  }
  for (const g of Object.values(google)) g.imprPerPublishedPage = g.published ? Math.round(g.impressions / g.published) : null;

  const bingFile = fs.readdirSync(path.join(process.cwd(), 'data', 'keywords')).filter((f) => f.endsWith('-bing-queries.json')).sort().pop()!;
  const bing = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'keywords', bingFile), 'utf8'));
  const bingKw = bing.keywords as Array<{ impressions: number; clicks: number }>;

  const cta = (await withDb((sql) => sql`
    SELECT cta, count(*)::int AS n FROM cta_clicks WHERE click_day >= current_date - ${DAYS}::int GROUP BY cta ORDER BY n DESC`)) as unknown as Array<{ cta: string; n: number }>;
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'backlinks', 'ledger.json'), 'utf8'));

  const out = {
    generatedAt: new Date().toISOString(),
    script: 'scripts/growth-baseline.ts',
    google: { source: 'Search Console page dimension', days: DAYS, endingOn: today, note: 'includes the 2-3 day reporting lag', totals: { impressions: totImpr, clicks: totClicks, urlsShown: seen.size }, byKind: google,
      unpublishedGuideUrlsShown: unpublishedShown.sort((a, b) => b.impressions - a.impressions) },
    bing: { source: `data/keywords/${bingFile}`, queries: bingKw.length, impressions: bingKw.reduce((s, k) => s + k.impressions, 0), clicks: bingKw.reduce((s, k) => s + k.clicks, 0), note: 'relative only' },
    ctaClicks: { days: DAYS, unit: 'unique visitor-days', byCta: cta, total: cta.reduce((s, c) => s + c.n, 0) },
    backlinks: { source: 'data/backlinks/ledger.json', earned: (ledger.links || []).length },
  };
  console.log(JSON.stringify(out, null, 2));
  if (process.env.WRITE === 'true') {
    const file = path.join(process.cwd(), 'data', 'experiments', `${today}-growth-baseline.json`);
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
    console.log(`\nwrote ${path.relative(process.cwd(), file)}`);
  }
}
main().catch((e) => { console.error(e?.message || e); process.exit(1); });
