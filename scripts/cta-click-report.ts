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

  // Device split (column added 2026-11-18; older rows have none) and the search-box funnel.
  const dev = (await withDb((sql) => sql`
    SELECT cta, coalesce(device, 'unknown') AS device, count(*)::int AS clicks
    FROM cta_clicks WHERE click_day > current_date - ${days}::int
      AND cta IN ('report_address_selected', 'report_submit', 'guide_closing_report')
    GROUP BY 1, 2 ORDER BY 1, clicks DESC
  `)) as unknown as Array<{ cta: string; device: string; clicks: number }>;
  if (dev.length) {
    console.log(`\n  by device (report actions only)\n`);
    for (const r of dev) console.log(`  ${String(r.clicks).padStart(4)}  ${r.cta.padEnd(24)} ${r.device}`);
  }
})();
