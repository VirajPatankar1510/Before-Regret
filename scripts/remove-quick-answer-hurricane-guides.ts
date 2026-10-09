// Owner, 2026-10-09: the quick-answer box "should not be a must everywhere... only where it's
// relevant and when the article answers a question". On the two Hurricane Isaias guides it read as
// AI filler (#327 named by the owner; #328, the checklist, approved the same day). Empties
// quick_answer on those rows only -- the page then renders no box and no title-as-question schema
// entry, and assert-article-quality allows it because neither title asks a question. Asserts the
// exact stored text first; a row already empty is skipped. Slug, title and meta untouched.
//   npx tsx scripts/remove-quick-answer-hurricane-guides.ts            # dry run
//   APPLY=true npx tsx scripts/remove-quick-answer-hurricane-guides.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
const APPLY = process.env.APPLY === 'true';
const ROWS: Array<{ id: number; slug: string; expectStart: string }> = [
  { id: 327, slug: 'hurricane-flood-insurance-gulf-coast-homebuyers', expectStart: 'No, a FEMA flood zone does not show every flood risk' },
  { id: 328, slug: 'hurricane-home-checklist-flood-insurance', expectStart: 'Follow official instructions first: if you live in a mandatory evacuation zone' },
];
for (const row of ROWS) {
  const r = (await withDb((sql) => sql`SELECT id, slug, title, quick_answer, body_markdown FROM articles WHERE id = ${row.id} AND status = 'published'`)) as unknown as Array<{ id: number; slug: string; title: string; quick_answer: string; body_markdown: string }>;
  if (r.length !== 1 || r[0].slug !== row.slug) throw new Error(`ABORT: row ${row.id} is not ${row.slug}`);
  if (!r[0].quick_answer.trim()) { console.log(`  #${row.id} already empty -- skipped`); continue; }
  if (!r[0].quick_answer.startsWith(row.expectStart)) throw new Error(`ABORT: #${row.id} quick_answer has changed since it was read`);
  // The checklist's quick answer carried the evacuate-first line; it must survive in the body.
  if (row.id === 328 && !/do so immediately/.test(r[0].body_markdown)) throw new Error('ABORT: #328 body lost the evacuate-first line; keep the quick answer');
  console.log(`  #${row.id} ${r[0].title}\n    - ${r[0].quick_answer}\n    + (empty)`);
  if (APPLY) { await withDb((sql) => sql`UPDATE articles SET quick_answer = '', updated_at = now() WHERE id = ${row.id}`); console.log('    written'); }
}
if (!APPLY) console.log('\n  DRY RUN -- nothing written.');
