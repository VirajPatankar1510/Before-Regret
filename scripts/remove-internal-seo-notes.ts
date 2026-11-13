// Remove internal SEO notes ("Why this page: Bing's AI Performance report...") from the "How we checked this" lists of
// five live guides (#287 found by the new INTERNAL_SEO_NOTE gate; owner approved each page). Owner, 2026-11-13: internal strategy, not information for a homebuyer; it makes the page read as
// written to capture an AI citation. Body-only, surgical: each exact line must match before anything is written.
// Slugs, titles, meta and status are untouched.
//
//   npx tsx scripts/remove-internal-seo-notes.ts            # dry run
//   APPLY=true npx tsx scripts/remove-internal-seo-notes.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const CUTS: Array<{ id: number; slug: string; line: string }> = [
  { id: 345, slug: 'home-insurance-water-sewer-service-line', line: `- **Why this page:** Bing's AI Performance report for our site listed "service line coverage" among the questions where AI answers cite other sites but not ours.` },
  { id: 346, slug: 'homeowners-insurance-cover-mold', line: `- **Why this page:** Bing's AI Performance report for our site listed several mold-coverage questions, where AI answers cite other sites but not ours.` },
  { id: 347, slug: 'sewer-lateral-inspection-at-sale-cities', line: `- **Why this page:** online lists of these rules contradicted each other, and Bing records searches for "sewer lateral" that our site wasn't answering.` },
  { id: 13, slug: 'get-clue-report-before-buying-house', line: `- **What people asked us.** The Bing searches that bring people to this page use words like "how to get", "order" and "for a property". People expect to pull the report themselves, which is why this page starts with what to send the seller rather than a definition.` },
  { id: 287, slug: 'find-unpermitted-work-before-buying', line: `- **What people asked us:** the questions quoted above come from our own Bing search data. They shaped the order of this page.` },
];

const rows = (await withDb((sql) => sql`SELECT id, slug, body_markdown FROM articles WHERE id = ANY(${CUTS.map((c) => c.id)})`)) as any[];
let bad = 0;
const updates: Array<{ id: number; body: string }> = [];
for (const c of CUTS) {
  const r = rows.find((x) => x.id === c.id);
  if (!r || r.slug !== c.slug) { console.log(`FAIL #${c.id}: row/slug mismatch`); bad++; continue; }
  const lines = String(r.body_markdown).split('\n');
  const idx = lines.findIndex((l) => l === c.line);
  if (idx < 0 || lines.filter((l) => l === c.line).length !== 1) { console.log(`FAIL #${c.id}: exact line not found once`); bad++; continue; }
  const next = lines.slice(idx + 1);
  const out = [...lines.slice(0, idx), ...next];
  console.log(`\n#${c.id} ${c.slug} -- removing line ${idx + 1}. Context after:`);
  console.log(out.slice(Math.max(0, idx - 2), idx + 2).map((l) => `   | ${l}`).join('\n'));
  updates.push({ id: c.id, body: out.join('\n') });
}
if (bad) { console.log(`\n${bad} problem(s) -- nothing written.`); process.exit(1); }
if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); process.exit(0); }
for (const u of updates) await withDb((sql) => sql`UPDATE articles SET body_markdown = ${u.body}, updated_at = now() WHERE id = ${u.id}`);
console.log(`\nwrote ${updates.length} article(s)`);
