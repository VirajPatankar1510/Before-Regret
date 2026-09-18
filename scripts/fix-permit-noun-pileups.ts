// Two more quick answers where an agency name was butted straight against a system name.
//
//   npx tsx scripts/fix-permit-noun-pileups.ts            # dry run
//   APPLY=true npx tsx scripts/fix-permit-noun-pileups.ts
//
// -----------------------------------------------------------------------------------------------
// Found by scanning all 19 permit guides after the same defect was fixed on San Bernardino. Two
// real instances, and one of them is not a grammar problem at all.
//
// BRONX IS A FACTUAL ERROR. "the NYC Department of Buildings Information System (BIS)" merges two
// separate things: the NYC DEPARTMENT OF BUILDINGS, which is the agency, and the BUILDINGS
// INFORMATION SYSTEM, which is one of its two public databases. Run together they name an agency
// that does not exist, on a page whose whole job is telling someone where those records live. The
// same sentence then correctly names DOB NOW as the second system, so it lists two systems and gets
// the first one's name wrong. Verified against NYC DOB before rewriting: BIS is the legacy database
// holding older permits, violations and Certificates of Occupancy; DOB NOW carries filings from
// 2018 onward. The replacement says which is which, which the original never did.
//
// LOS ANGELES is the San Bernardino defect exactly: "the LA County Department of Public Works
// EpicLA portal". Department name, portal name, nothing in between.
//
// -----------------------------------------------------------------------------------------------
// WHY THIS IS SAFE TO DO WHILE AN EXPERIMENT IS RUNNING, stated so it can be argued with.
//
// Both pages are CONTROLS in the Generative-AI verdict test (started 2026-09-17, reporting mid
// October). That test's independent variable is whether the quick answer OPENS WITH A VERDICT.
// Both of these open procedurally now and both replacements still do, asserted below -- so neither
// page moves between arms and the variable under test is untouched. It is still a content change to
// a control page, which adds noise; that is a real cost and it is accepted here because one of the
// two is a factual error about a public agency.
//
// What does NOT change, on either page: title, meta_description, body_markdown, slug, canonical.
// quick_answer renders as the on-page TL;DR and fills FAQPage.acceptedAnswer. Nothing else reads it.
//
// LOS ANGELES ALSO COMES IN UNDER THE CEILING. Its quick answer was 481 characters against a 450
// mobile ceiling, and it sits in the longTldr grandfather list. Since the sentence was being
// rewritten anyway, landing under 450 is free, and that list is only allowed to shrink.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const QA_MAX = 450;

/** Openings the verdict test counts as treated. Neither replacement may start with one. */
const VERDICT = /^\s*(yes|no|not\s|usually|generally|often|rarely|sometimes|it can|it does|it will|it depends|probably|in most|in many|only\b|typically|most\b|maybe)/i;

interface Fix { slug: string; next: string; keep: string[]; banned: RegExp[] }

const FIXES: Fix[] = [
  {
    slug: 'check-building-permits-bronx-ny',
    next:
      'You can check building permits in the Bronx through the NYC Department of Buildings, which ' +
      'runs two public databases: the Buildings Information System (BIS) holds older permits, ' +
      'violations and Certificates of Occupancy, and DOB NOW carries filings from 2018 onward. ' +
      'Search either by property address or Block and Lot (BBL) number.',
    keep: ['Bronx', 'NYC Department of Buildings', 'Buildings Information System', 'BIS', 'DOB NOW', 'BBL'],
    // The agency the original invented.
    banned: [/Department of Buildings Information System/i],
  },
  {
    slug: 'check-building-permits-los-angeles-county-ca',
    next:
      'To check building permits in Los Angeles County, first work out whether the property sits in ' +
      'an unincorporated area or in one of the county’s 88 incorporated cities. For unincorporated ' +
      'properties, search EpicLA, the portal run by LA County Public Works. For a property inside a ' +
      'city, the records sit with that city — in the City of Los Angeles, with the Department of ' +
      'Building and Safety (LADBS).',
    keep: ['Los Angeles County', 'unincorporated', '88', 'EpicLA', 'LADBS', 'Public Works'],
    banned: [/Public Works EpicLA/i, /\bspecific municipality/i],
  },
];

async function main() {
  const slugs = FIXES.map((f) => f.slug);
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, quick_answer FROM articles
    WHERE slug = ANY(${slugs}) AND status='published'`)) as unknown as any[];
  if (rows.length !== FIXES.length) throw new Error(`ABORT: found ${rows.length} of ${FIXES.length} published`);

  for (const f of FIXES) {
    const prev = String(rows.find((r) => r.slug === f.slug)!.quick_answer);

    if (f.next.length < 120 || f.next.length > QA_MAX) {
      throw new Error(`ABORT: ${f.slug} is ${f.next.length} chars, budget 120-${QA_MAX}`);
    }
    if (VERDICT.test(f.next)) throw new Error(`ABORT: ${f.slug} replacement opens with a verdict -- it would move test arms`);
    if (VERDICT.test(prev) !== VERDICT.test(f.next)) throw new Error(`ABORT: ${f.slug} opening changed category`);
    for (const k of f.keep) {
      if (!f.next.includes(k)) throw new Error(`ABORT: ${f.slug} drops "${k}", which the page ranks on`);
    }
    for (const b of f.banned) {
      if (b.test(f.next)) throw new Error(`ABORT: ${f.slug} still matches ${b}`);
      if (!b.test(prev)) console.warn(`  note: ${f.slug} -- ${b} was not in the previous text`);
    }

    console.log(`\n  ${f.slug}`);
    console.log(`\n  BEFORE (${prev.length} chars)`);
    for (const s of prev.split(/(?<=\.)\s+/)) console.log(`    | ${s}`);
    console.log(`\n  AFTER  (${f.next.length} chars)${prev.length > QA_MAX && f.next.length <= QA_MAX ? '   <-- now under the 450 mobile ceiling' : ''}`);
    for (const s of f.next.split(/(?<=\.)\s+/)) console.log(`    | ${s}`);
  }

  console.log(`\n  unchanged on both: title, meta_description, body_markdown, slug, canonical`);
  console.log(`  both openings stay procedural, so both pages stay in the verdict test's control arm`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const f of FIXES) {
    await withDb((sql) => sql`UPDATE articles SET quick_answer = ${f.next}, updated_at = now() WHERE slug = ${f.slug}`);
    console.log(`  wrote ${f.slug}`);
  }
  console.log(`\n  Guides are prerendered -- run \`npm run build\` or this is not live.`);
  console.log(`  Then drop check-building-permits-los-angeles-county-ca from longTldr in data/quality-grandfathered.json.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
