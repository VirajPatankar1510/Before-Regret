// Inbound link to /guides/hurricane-flood-insurance-gulf-coast-homebuyers/ (2026-10-09).
//
//   npx tsx scripts/link-hurricane-flood-insurance-guide.ts            # dry run
//   APPLY=true npx tsx scripts/link-hurricane-flood-insurance-guide.ts
//
// suggest-inbound-links.ts found no distinctive terms (every title word is common across the library),
// so these were placed by hand. Each anchor is text that ALREADY discusses the new guide's subject --
// hurricane and wind deductibles.
// No sentence is added or reworded; only existing words become a link. Each edit asserts the exact
// stored text first and aborts if it has changed.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/hurricane-flood-insurance-gulf-coast-homebuyers/';

const EDITS: Array<{ slug: string; find: string; replace: string }> = [
  {
    // The sentence already explains percentage wind deductibles; the new guide's section on Florida
    // Statutes § 627.701 hurricane deductibles is the detail behind it.
    slug: 'prove-roof-age-for-insurance',
    find: 'carriers frequently apply a separate percentage deductible to wind and hail claims',
    replace: `carriers frequently apply a [separate percentage deductible](${TARGET}) to wind and hail claims`,
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
