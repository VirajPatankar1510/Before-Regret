// "Suggest a service" inbox (owner, 2026-11-22). Businesses with a live Report Ad can suggest a job
// that isn't on their trade's list (src/server/myAdsApi.ts, /suggest-service). Nothing they type is
// ever shown on an ad: a real service gets added to JOB_OPTIONS in src/data/vendorCardExtras.ts (then
// build + publish), a claim ("licensed", "#1", "certified", a price) is declined.
//
//   NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts" npx tsx scripts/service-suggestions.ts
//       lists pending suggestions (read-only)
//   ... scripts/service-suggestions.ts --all
//       lists every suggestion with its status
//   APPLY=true ... scripts/service-suggestions.ts --mark <id> added|declined
//       records the decision (after the job is actually added to JOB_OPTIONS, for "added")
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

type Row = { id: number; trade_category: string; suggestion: string; status: string; created_at: string; order_id: number };

(async () => {
  const args = process.argv.slice(2);
  const markIdx = args.indexOf('--mark');
  if (markIdx >= 0) {
    const id = parseInt(args[markIdx + 1], 10);
    const decision = args[markIdx + 2];
    if (!Number.isFinite(id) || (decision !== 'added' && decision !== 'declined')) {
      console.error('usage: --mark <id> added|declined');
      process.exit(1);
    }
    if (process.env.APPLY !== 'true') {
      console.log(`DRY RUN: would mark #${id} ${decision}. Re-run with APPLY=true.`);
      return;
    }
    const updated = (await withDb((sql) => sql`
      UPDATE vendor_service_suggestions SET status = ${decision}, reviewed_at = now() WHERE id = ${id} RETURNING id
    `)) as unknown as Array<{ id: number }>;
    console.log(updated.length ? `#${id} marked ${decision}` : `#${id} not found`);
    return;
  }
  const all = args.includes('--all');
  const rows = (await withDb((sql) => all
    ? sql`SELECT id, trade_category, suggestion, status, created_at, order_id FROM vendor_service_suggestions ORDER BY created_at DESC`
    : sql`SELECT id, trade_category, suggestion, status, created_at, order_id FROM vendor_service_suggestions WHERE status = 'pending' ORDER BY trade_category, created_at`
  )) as unknown as Row[];
  console.log(`\n  service suggestions (${all ? 'all' : 'pending'}): ${rows.length}\n`);
  for (const r of rows) {
    console.log(`  #${String(r.id).padEnd(4)} ${r.status.padEnd(9)} ${r.trade_category.padEnd(24)} "${r.suggestion}"  (order ${r.order_id}, ${new Date(r.created_at).toISOString().slice(0, 10)})`);
  }
})();
