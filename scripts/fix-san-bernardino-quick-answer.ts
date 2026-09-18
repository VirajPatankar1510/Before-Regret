// A grammar fix to one quick_answer.
//
//   npx tsx scripts/fix-san-bernardino-quick-answer.ts          # dry run
//   APPLY=true npx tsx scripts/fix-san-bernardino-quick-answer.ts
//
// -----------------------------------------------------------------------------------------------
// WHAT WAS WRONG. The two branches of the either/or were not parallel:
//
//   "use the ... portal FOR UNINCORPORATED AREAS, or contact the specific city's building
//    department IF THE PROPERTY LIES WITHIN MUNICIPAL LIMITS"
//
// The first branch says what the portal is for; the second conditions on where the property is. The
// sentence switches its logical subject halfway through, and the reader has to recast the first
// half to line the two up. Also "the SPECIFIC city's building department" -- specific does no work
// -- and a final list ("insurance, safety, and financing") that puts a physical concern between two
// transactional ones, when an open violation record does not affect anyone's safety; the defect
// behind it might.
//
// -----------------------------------------------------------------------------------------------
// WHY THIS PAGE NEEDS CARE. It is the best-ranking page on the site: position 8.7, 414 impressions
// over 28 days. It is also a CONTROL in the Generative-AI verdict test that started 2026-09-17.
//
// So the replacement deliberately preserves three things, each asserted below rather than trusted:
//
//   1. The procedural, non-verdict opening. The test compares verdict-opening pages against pages
//      like this one. Rewriting it into "Yes, you can..." would silently move it between arms and
//      corrupt a reading nobody would think to question in October.
//   2. Every entity the page ranks for -- San Bernardino County, Land Use Services, EZ Online
//      Permitting. Those are the words the query matches.
//   3. The length budget, and the fact that nothing else changes. Title, meta_description, body,
//      slug and canonical are untouched; quick_answer feeds the on-page TL;DR and the FAQPage
//      acceptedAnswer, and nothing else.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'check-building-permits-san-bernardino-county-ca';

const NEXT =
  'To check building permits in San Bernardino County, start with EZ Online Permitting, the portal ' +
  'run by county Land Use Services, if the property sits in an unincorporated area. If it sits ' +
  'inside city limits, the city’s own building department holds the records, not the county. ' +
  'Checking before closing is how unpermitted additions and open violations surface, and either ' +
  'can complicate financing or an insurance claim later.';

/** The openings the verdict test counts as treated. This page must not start with one of them. */
const VERDICT = /^\s*(yes|no|not\s|usually|generally|often|rarely|sometimes|it can|it does|it will|it depends|probably|in most|in many|only\b|typically|most\b|maybe)/i;
/** Words the page ranks on. Losing one of these to a tidy-up is how a rewrite costs a position. */
const KEEP = ['San Bernardino County', 'Land Use Services', 'EZ Online', 'unincorporated'];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, quick_answer, meta_description FROM articles
    WHERE slug = ${SLUG} AND status = 'published'`)) as unknown as any[];
  if (!rows.length) throw new Error(`ABORT: ${SLUG} is not published`);
  const prev = String(rows[0].quick_answer);

  if (NEXT.length < 120 || NEXT.length > 450) throw new Error(`ABORT: ${NEXT.length} chars, budget 120-450`);
  if (VERDICT.test(NEXT)) throw new Error('ABORT: replacement opens with a verdict, which would move this page between test arms');
  if (VERDICT.test(prev) !== VERDICT.test(NEXT)) throw new Error('ABORT: the opening changed category');
  for (const k of KEEP) {
    if (!NEXT.includes(k)) throw new Error(`ABORT: replacement drops "${k}", which this page ranks on`);
    if (!prev.includes(k)) console.warn(`  note: "${k}" was not in the previous text either`);
  }
  // The specific defects, gone.
  if (/\bspecific city/i.test(NEXT)) throw new Error('ABORT: "specific city" survived');
  if (/insurance, safety, and financing/i.test(NEXT)) throw new Error('ABORT: the mismatched list survived');
  // The noun pile-up: a department name butted straight against a system name, with nothing
  // between them to tell a reader where one ends. "Land Use Services EZ Online Permitting" is not
  // anything's name.
  if (/Land Use Services\s+EZ Online/i.test(NEXT)) {
    throw new Error('ABORT: the two proper names are still stacked with no grammatical joint');
  }
  // Parallel branches: both conditions must now be stated the same way, about the property.
  if ((NEXT.match(/\bif the property sits\b|\bIf it sits\b/g) ?? []).length !== 2) {
    throw new Error('ABORT: the two branches are still not parallel');
  }

  console.log(`  ${SLUG}`);
  console.log(`\n  BEFORE (${prev.length} chars)`);
  for (const s of prev.split(/(?<=\.)\s+/)) console.log(`    | ${s}`);
  console.log(`\n  AFTER  (${NEXT.length} chars)`);
  for (const s of NEXT.split(/(?<=\.)\s+/)) console.log(`    | ${s}`);
  console.log(`\n  unchanged: title, meta_description, body_markdown, slug, canonical`);
  console.log(`  opening stays procedural, so the page stays in the verdict test's control arm`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`UPDATE articles SET quick_answer = ${NEXT}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  written. Guides are prerendered -- run \`npm run build\` or this is not live.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
