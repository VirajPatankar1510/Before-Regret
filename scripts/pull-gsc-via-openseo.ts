// Pull Search Console query data from a local OpenSEO instance into a citable capture.
//
//   npx tsx scripts/pull-gsc-via-openseo.ts
//   npx tsx scripts/pull-gsc-via-openseo.ts --range last_28_days
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS ALONGSIDE scripts/import-gsc-export.ts.
//
// The import script reads a CSV a human downloaded. This one reads the same data over OpenSEO's MCP
// server, which holds a live Google OAuth grant, so it can be re-run without anyone visiting a
// dashboard. Same destination, same capture shape, and scripts/assert-keyword-provenance.ts cannot
// tell them apart -- both are measurement, which is the only property the gate cares about.
//
// OPENSEO AND DATAFORSEO ARE DIFFERENT THINGS, and this script only touches the half that is free.
// OpenSEO (MIT, self-hosted here in Docker) draws its keyword, backlink and SERP features from
// DataForSEO, a separate paid vendor whose account is currently paused. Search Console is not one of
// those features: the data comes from the site owner's own Google account through OpenSEO's OAuth
// grant, and OpenSEO meters no credits for it. Nothing here costs money or depends on that pause.
//
// WHY structuredContent AND NOT THE TEXT. The MCP tool returns both a human-readable pipe table and
// a structuredContent object. The table is for reading; parsing it would break the first time a
// query contained a pipe character or the column order changed. Only structuredContent is read here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');
const MCP = process.env.OPENSEO_MCP_URL ?? 'http://localhost:3001/mcp';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function callTool(name: string, args: Record<string, unknown>): Promise<any> {
  const res = await fetch(MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`MCP ${name} HTTP ${res.status}`);
  const j = await res.json() as any;
  // A tool can fail INSIDE a 200 response, the same envelope trap documented for DataForSEO in
  // docs/ai-overview-schema.md. Both levels are checked.
  if (j.error) throw new Error(`MCP ${name}: ${JSON.stringify(j.error).slice(0, 300)}`);
  const sc = j.result?.structuredContent;
  if (!sc) throw new Error(`MCP ${name} returned no structuredContent`);
  if (sc.ok === false) throw new Error(`MCP ${name}: ${JSON.stringify(sc).slice(0, 300)}`);
  return sc;
}

async function main() {
  // EXPLICIT DATES, NOT dateRange. The tool's convenience windows set the end date ~3 days back
  // "for GSC data lag", so every capture silently omitted its most recent days -- measured at 444
  // impressions and 5 clicks between last_3_months and today. Fresh rows are incomplete and will
  // rise on a later pull, which is a reason to re-pull, not a reason to discard them: a capture
  // that stops three days short makes "did the change work" unanswerable for three days.
  //
  // Defaults to the full 16-month lookback so the window is the site's entire history rather than
  // an arbitrary slice; --days narrows it.
  const days = Number(arg('days') ?? 480);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const range = arg('range');

  const projects = await callTool('list_projects', {});
  const project = (projects.projects ?? projects.items ?? [])[0];
  const projectId = project?.id ?? project?.projectId;
  if (!projectId) throw new Error('ABORT: no OpenSEO project found. Open http://localhost:3001 first.');

  // Page until Google stops returning rows. GSC caps a single request; startRow walks past it.
  const all: Row[] = [];
  let siteUrl = '', startDate = '', endDate = '';
  for (let startRow = 0; startRow < 25000; startRow += 500) {
    const sc = await callTool('get_search_console_performance', {
      projectId, dimensions: ['query'], rowLimit: 500, startRow,
      // A --range wins if given, for reproducing an older capture exactly.
      ...(range ? { dateRange: range } : { startDate: iso(start), endDate: iso(end) }),
    });
    siteUrl ||= sc.siteUrl; startDate ||= sc.startDate; endDate ||= sc.endDate;
    const rows: Row[] = sc.rows ?? [];
    all.push(...rows);
    process.stdout.write(`\r  fetched ${all.length} rows...`);
    if (rows.length < 500) break;
  }
  console.log('');
  if (!all.length) throw new Error('ABORT: Search Console returned no rows.');

  const keywords = all.map((r) => ({
    keyword: r.keys[0],
    // The gate reads search_volume. For a measured export the honest analogue is impressions --
    // how often this site was actually shown. NOT market volume; the endpoint field says so.
    search_volume: r.impressions ?? null,
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position == null ? null : Number(r.position.toFixed(1)),
    ctr: r.ctr == null ? null : Number((r.ctr * 100).toFixed(2)),
  }));

  const id = `${endDate}-gsc-queries`;
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CAPTURE_DIR, `${id}.json`), `${JSON.stringify({
    source: 'gsc',
    endpoint: 'openseo mcp get_search_console_performance (measured impressions, not market volume)',
    captured_at: new Date().toISOString(),
    location_name: 'United States', language_code: 'en', cost_usd: 0,
    site_url: siteUrl, date_range: `${startDate}..${endDate}`,
    keywords,
  }, null, 2)}\n`);

  const clicked = keywords.filter((k) => k.clicks > 0);
  const impr = keywords.reduce((s, k) => s + k.impressions, 0);
  const clicks = keywords.reduce((s, k) => s + k.clicks, 0);
  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`  ${siteUrl}  ${startDate} -> ${endDate}`);
  console.log(`  ${keywords.length} queries | ${impr.toLocaleString()} impressions | ${clicks} clicks | ${clicked.length} query(ies) earned a click\n`);

  console.log('  QUERIES THAT EARNED CLICKS');
  console.log('    clicks  impr    pos   query');
  for (const k of [...clicked].sort((a, b) => b.clicks - a.clicks)) {
    console.log(`    ${String(k.clicks).padStart(6)}  ${String(k.impressions).padStart(5)}  ${String(k.position ?? '-').padStart(5)}   ${k.keyword}`);
  }

  // Striking distance: real demand, ranking just off page one, no clicks yet. This is the list
  // worth acting on, and it is the thing that cannot be produced by guessing.
  const striking = keywords
    .filter((k) => k.clicks === 0 && k.impressions >= 5 && k.position != null && k.position >= 8 && k.position <= 25)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 15);
  console.log('\n  STRIKING DISTANCE (5+ impressions, position 8-25, zero clicks)');
  console.log('    impr    pos   query');
  for (const k of striking) console.log(`    ${String(k.impressions).padStart(5)}  ${String(k.position).padStart(5)}   ${k.keyword}`);
}

main().catch((e) => { console.error(`\n${e.message || e}`); process.exit(1); });
