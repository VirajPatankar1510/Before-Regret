// Which queries is this site already close to winning?
//
//   npx tsx scripts/keyword-opportunities.ts [days]      # default 28
//
// WHY THIS EXISTS. "Low-hanging fruit" has a precise meaning for a site in this position, and it
// is NOT "keywords with low difficulty scores" -- scripts/organic-difficulty.ts answers that, and
// its own note says it can never predict whether THIS domain will rank. The cheap wins are the
// queries where Google is ALREADY showing a page and putting it just off the first screen. Those
// need a title, an intro, or a section -- not a new article, and not backlinks the domain does
// not have.
//
// Everything here is query+page pairs, not queries alone: the same phrase can be served by two
// different URLs at two different positions, and the fix differs (one is on-page work, the other
// is two pages competing for one intent).
//
// BUCKETS, and why each is drawn where it is:
//   STRIKING DISTANCE (pos 4-20)  Page one is positions 1-10; 11-20 is page two. A page sitting
//                                 here has already convinced Google it is relevant, which is the
//                                 expensive part. Moving 15 -> 8 is on-page work.
//   PAGE-ONE, NO CLICKS (pos <=10, 0 clicks, >=10 impressions)  Google put it in front of people
//                                 and they did not click. That is a title/description problem,
//                                 the cheapest fix on this list, and it needs no ranking change.
//   DEEP (pos > 20)               Present but nowhere near. Listed for completeness, not as
//                                 low-hanging fruit -- these need authority the domain lacks.
//
// Read-only. Queries Search Console and Bing Webmaster, writes nothing.
import 'dotenv/config';

const SITE = (process.env.GSC_SITE_URL || 'https://www.beforeregret.com').replace(/\/$/, '');

interface Row { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number; }

async function gscQueryPages(days: number): Promise<Row[]> {
  // Reuse the project's own service-account auth rather than re-implementing the JWT exchange.
  const { getAccessToken } = await import('../src/server/searchConsoleService.js');
  const token = await getAccessToken();

  const end = new Date();
  const start = new Date(end.getTime() - days * 864e5);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const out: Row[] = [];
  const PAGE = 5000;

  for (let startRow = 0; ; startRow += PAGE) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: iso(start), endDate: iso(end),
          dimensions: ['query', 'page'], rowLimit: PAGE, startRow,
        }),
      }
    );
    if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
    const json = await res.json() as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
    const batch = json.rows || [];
    for (const r of batch) {
      out.push({ query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    }
    if (batch.length < PAGE) break;
  }
  return out;
}

const short = (u: string) => u.replace(/^https?:\/\/(www\.)?beforeregret\.com/, '') || '/';

function table(title: string, rows: Row[], note: string) {
  console.log(`\n=== ${title} (${rows.length}) ===`);
  console.log(`    ${note}\n`);
  if (!rows.length) { console.log('    none'); return; }
  console.log('    pos   imp  clk  query                                             page');
  for (const r of rows) {
    console.log(
      `   ${r.position.toFixed(1).padStart(5)} ${String(r.impressions).padStart(5)} ${String(r.clicks).padStart(4)}  ` +
      `${r.query.slice(0, 48).padEnd(48)}  ${short(r.page).slice(0, 46)}`
    );
  }
}

async function main() {
  const days = parseInt(process.argv[2] || '28', 10);
  const rows = await gscQueryPages(days);
  const totalImp = rows.reduce((n, r) => n + r.impressions, 0);
  const totalClk = rows.reduce((n, r) => n + r.clicks, 0);
  console.log(`Google, last ${days} days: ${rows.length} query+page pairs, ${totalImp} impressions, ${totalClk} clicks`);

  const striking = rows.filter((r) => r.position >= 4 && r.position <= 20)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position);
  const noClick = rows.filter((r) => r.position <= 10 && r.clicks === 0 && r.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions);
  const deep = rows.filter((r) => r.position > 20)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 15);

  table('STRIKING DISTANCE -- positions 4-20', striking.slice(0, 30),
    'Already ranked and relevant. Moving these is on-page work, not new content.');
  table('PAGE ONE BUT NO CLICKS -- pos <=10, 0 clicks, >=10 impressions', noClick.slice(0, 20),
    'Shown to people who did not click. A title/description problem; needs no ranking change.');
  table('DEEP -- position > 20 (top 15 by impressions)', deep,
    'NOT low-hanging. Present but far; these need authority the domain does not have yet.');

  // Two URLs answering one query is a self-inflicted problem and a genuinely cheap fix.
  const byQuery = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byQuery.has(r.query)) byQuery.set(r.query, []);
    byQuery.get(r.query)!.push(r);
  }
  const cannibal = [...byQuery.entries()].filter(([, rs]) => rs.length > 1)
    .sort((a, b) => b[1].reduce((n, r) => n + r.impressions, 0) - a[1].reduce((n, r) => n + r.impressions, 0));
  console.log(`\n=== ONE QUERY, TWO PAGES (${cannibal.length}) ===`);
  console.log('    Two URLs splitting one intent. Consolidating is cheaper than ranking either.\n');
  for (const [q, rs] of cannibal.slice(0, 10)) {
    console.log(`    "${q}"`);
    for (const r of rs.sort((a, b) => a.position - b.position)) {
      console.log(`       pos ${r.position.toFixed(1).padStart(5)}  ${String(r.impressions).padStart(4)} imp  ${short(r.page)}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
