// Which pages send readers on to a report? Reads cta_clicks (src/server/ctaClicksApi.ts).
//
//   npx tsx scripts/cta-click-report.ts [days]     # default 28
//
// Counts are unique visitors per page, CTA and day. Pair with Vercel Analytics page views for a rate:
// this table can only see clicks, never views (prerendered pages never reach the server).
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const days = parseInt(process.argv[2] || '28', 10);
(async () => {
  const rows = (await withDb((sql) => sql`
    SELECT page_path, cta, count(*)::int AS clicks
    FROM cta_clicks WHERE click_day > current_date - ${days}::int
    GROUP BY 1, 2 ORDER BY clicks DESC, page_path
  `)) as unknown as Array<{ page_path: string; cta: string; clicks: number }>;
  console.log(`\n  report CTA clicks, last ${days} days (unique visitors per day)\n`);
  if (!rows.length) { console.log('  none yet'); return; }
  const total = rows.reduce((n, r) => n + r.clicks, 0);
  for (const r of rows) console.log(`  ${String(r.clicks).padStart(4)}  ${r.cta.padEnd(22)} ${r.page_path}`);
  console.log(`\n  total ${total}`);
})();
