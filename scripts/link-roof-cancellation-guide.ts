// Inbound link to /guides/home-insurance-cancelled-after-buying-house-roof/ (2026-10-09).
//
//   npx tsx scripts/link-roof-cancellation-guide.ts            # dry run
//   APPLY=true npx tsx scripts/link-roof-cancellation-guide.ts
//
// suggest-inbound-links.ts found no distinctive terms (every title word is common across the library),
// so these were placed by hand. Each anchor is text that ALREADY discusses the new guide's subject --
// an insurer acting on the roof after closing (cancellation timing, nonrenewal notice).
// No sentence is added or reworded; only existing words become a link. Each edit asserts the exact
// stored text first and aborts if it has changed.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/home-insurance-cancelled-after-buying-house-roof/';

const EDITS: Array<{ slug: string; find: string; replace: string }> = [
  {
    // The sentence is about reading the roof before a nonrenewal notice arrives; the new guide sets
    // out what that notice must contain and when it must come.
    slug: 'home-insurance-aerial-photos-roof',
    find: 'Worth knowing before you own it rather than after a nonrenewal notice.',
    replace: `Worth knowing before you own it rather than [after a nonrenewal notice](${TARGET}).`,
  },
  {
    // The sentence is about the roof becoming the owner's problem after closing -- the new guide's subject.
    slug: 'prove-roof-age-for-insurance',
    find: 'After closing, the same problem is entirely yours,',
    replace: `[After closing](${TARGET}), the same problem is entirely yours,`,
  },
];

async function main() {
  for (const e of EDITS) {
    const r = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = ${e.slug} AND status = 'published'`)) as unknown as Array<{ id: number; body_markdown: string }>;
    if (r.length !== 1) throw new Error(`ABORT: ${e.slug} not found`);
    const body = r[0].body_markdown;
    if (body.includes(TARGET)) { console.log(`  skip ${e.slug}: already links the target`); continue; }
    if (body.split(e.find).length !== 2) throw new Error(`ABORT: ${e.slug}: anchor text not found exactly once`);
    const i = body.indexOf(e.find);
    // The anchor must not already sit inside a link.
    const before = body.slice(Math.max(0, i - 200), i);
    if (before.lastIndexOf('[') > before.lastIndexOf(']')) throw new Error(`ABORT: ${e.slug}: anchor is inside an existing link`);
    console.log(`  ${e.slug} (#${r[0].id})\n    - ${e.find}\n    + ${e.replace}`);
    if (APPLY) {
      await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body.replace(e.find, e.replace)}, updated_at = now() WHERE id = ${r[0].id}`);
      console.log('    written');
    }
  }
  if (!APPLY) console.log('\n  DRY RUN -- nothing written.');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
