// Fix for guide #340 (fall home maintenance checklist), 2026-10-31: assert-article-quality's [reproducible] rule
// failed after publishing -- the guide cited NFPA's tip sheet but no standard by name AND number. Adds NFPA 211's
// annual chimney inspection requirement (ledger f10, quoted via CSIA) to the report table and the method note.
// Guard: the stored body must equal the new file body with the two new sentences reverted, i.e. exactly what
// publish-fall-home-maintenance-checklist.ts wrote. Dry run unless APPLY=true.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';

const ID = 340;
const SLUG = 'fall-home-maintenance-checklist-new-homeowners';
const PAIRS: Array<[string, string]> = [
  ['Have it inspected and cleaned before the first fire. NFPA advises a yearly inspection by a qualified professional.',
   'Have it inspected and cleaned before the first fire. The chimney standard, NFPA 211, calls for chimneys, fireplaces and vents to be inspected at least once a year, and that includes the chimney or vent a gas furnace uses.'],
  ["  - NFPA's heating safety tip sheet;",
   "  - NFPA's heating safety tip sheet, and the NFPA 211 chimney inspection requirement as quoted by the Chimney Safety Institute of America (NFPA's own text needs an account, so we didn't read it directly);"],
];
(async () => {
  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${SLUG}.md`), 'utf8');
  const body = raw.slice(raw.match(/^---\n[\s\S]*?\n---\n/)![0].length).replace(/^#\s.*\n+/, '').trim();
  let before = body;
  for (const [oldS, newS] of PAIRS) before = before.replace(newS, oldS);
  const rows = (await withDb((sql) => sql`SELECT body_markdown FROM articles WHERE id = ${ID} AND slug = ${SLUG}`)) as unknown as Array<{ body_markdown: string }>;
  if (!rows[0]) throw new Error('row not found');
  if (rows[0].body_markdown !== before) throw new Error('stored body is not the published version -- re-read before fixing');
  console.log('  guard ok: stored body matches the published version');
  if (process.env.APPLY !== 'true') { console.log('  DRY RUN'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = ${ID} AND slug = ${SLUG}`);
  console.log(`  updated #${ID}`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
