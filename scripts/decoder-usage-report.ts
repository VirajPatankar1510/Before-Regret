// Inspection Report Decoder usage -- PRIVATE, for the owner and us only (owner, 2026-10-30). Nothing here is shown on
// the site; the /api/cta-click endpoint only accepts writes. Reads cta_clicks rows written by the Decoder
// (src/components/InspectionDecoder.tsx -> src/server/ctaClicksApi.ts).
//
//   npx tsx scripts/decoder-usage-report.ts [days]     # default 28
//
// Counts are unique visitors per event per day (the table's unique index), not raw clicks. A visitor who opens the same
// term twice in a day counts once. "Opens by term" tells us which terms people need -- the order to research next.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const days = parseInt(process.argv[2] || '28', 10);
(async () => {
  const rows = (await withDb((sql) => sql`
    SELECT cta, count(*)::int AS n, count(DISTINCT visitor_hash)::int AS people
    FROM cta_clicks WHERE cta LIKE 'decoder_%' AND click_day > current_date - ${days}::int
    GROUP BY 1 ORDER BY n DESC
  `)) as unknown as Array<{ cta: string; n: number; people: number }>;
  console.log(`\n  Inspection Report Decoder, last ${days} days (unique visitor-days; distinct visitors in brackets)\n`);
  if (!rows.length) { console.log('  no usage yet'); return; }
  const get = (k: string) => rows.find((r) => r.cta === k);
  for (const k of ['decoder_view', 'decoder_view_shared', 'decoder_scan_found', 'decoder_scan_none', 'decoder_share', 'decoder_print', 'decoder_guide_click']) {
    const r = get(k); console.log(`  ${k.padEnd(22)} ${String(r?.n ?? 0).padStart(5)}  (${r?.people ?? 0})`);
  }
  const opens = rows.filter((r) => r.cta.startsWith('decoder_open:'));
  console.log(`\n  opens by term (${opens.reduce((a, r) => a + r.n, 0)} total)`);
  for (const r of opens) console.log(`  ${String(r.n).padStart(5)}  ${r.cta.replace('decoder_open:', '')}`);
})();
