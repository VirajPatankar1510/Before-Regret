// Title test, 2026-10-11 (owner: "apply those three and publish"). Titles only -- slugs, meta and
// bodies untouched. Each new title keeps the query the page already earns impressions for and
// promises only what the body covers. Baseline (Google, 28 days to ~2026-10-09):
//   #312 home-insurance-aerial-photos-roof       65 impr,  0 clk, pos  7.6
//   #300 why-cast-iron-pipes-corrode              292 impr,  1 clk, pos 39.9  (top query "cast iron pipe damage", 186/90d)
//   #23  will-zinsco-panel-fail-4-point-inspection  2 impr,  0 clk, pos  4.5
// Read 2026-11-11: same or better position and more clicks, or revert to the old title.
// Owner's other two requests were declined on advice: the fuse-box guide (pos 5.1, best-ranked of the
// five; proposed title claimed carrier underwriting data we do not hold) and the deck guide (a "Yes,
// but" experiment read 2026-11-13; proposed title overlapped legalize-unpermitted-deck).
//   npx tsx scripts/retitle-2026-10-11.ts            # dry run
//   APPLY=true npx tsx scripts/retitle-2026-10-11.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
const APPLY = process.env.APPLY === 'true';
const EDITS = [
  { id: 312, slug: 'home-insurance-aerial-photos-roof', from: 'Home Insurance Aerial Photos: Why Roofs Get Flagged', to: 'Roof Flagged by Aerial Photos? How to Appeal a Nonrenewal' },
  { id: 300, slug: 'why-cast-iron-pipes-corrode', from: 'Cast Iron Sewer Pipe Damage: What Scoping and Repair Cost', to: 'Cast Iron Sewer Pipe Damage: Belly, Cracks & Repair Credits' },
  { id: 23, slug: 'will-zinsco-panel-fail-4-point-inspection', from: 'Will a Zinsco Panel Fail a 4-Point Inspection?', to: 'Zinsco Panel Failed a 4-Point Inspection? What to Do Next' },
];
for (const e of EDITS) {
  if (e.to.length > 60) throw new Error(`ABORT: #${e.id} title ${e.to.length} chars`);
  const r = (await withDb((sql) => sql`SELECT slug, title, body_markdown FROM articles WHERE id = ${e.id} AND status = 'published'`)) as unknown as Array<{ slug: string; title: string; body_markdown: string }>;
  if (r.length !== 1 || r[0].slug !== e.slug) throw new Error(`ABORT: #${e.id} is not ${e.slug}`);
  if (r[0].title !== e.from) throw new Error(`ABORT: #${e.id} title is now "${r[0].title}", not "${e.from}"`);
  const b = r[0].body_markdown;
  // The title may only promise what the body delivers.
  const needs: Record<number, RegExp[]> = { 312: [/appeal|complain|dispute/i, /nonrenew|non-renew/i], 300: [/\bbell(y|ies)\b/i, /crack/i, /credit/i], 23: [/4-point|four-point/i] };
  for (const re of needs[e.id]) if (!re.test(b)) throw new Error(`ABORT: #${e.id} body does not cover ${re}`);
  console.log(`  #${e.id} (${e.to.length})\n    - ${e.from}\n    + ${e.to}`);
  if (APPLY) { await withDb((sql) => sql`UPDATE articles SET title = ${e.to}, updated_at = now() WHERE id = ${e.id}`); console.log('    written'); }
}
if (!APPLY) console.log('\n  DRY RUN -- nothing written.');
