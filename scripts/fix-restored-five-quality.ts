// Bring the five restored guides up to the pre-publish gate they now have to pass.
//
//   npx tsx scripts/fix-restored-five-quality.ts            # dry run
//   APPLY=true npx tsx scripts/fix-restored-five-quality.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS SEPARATELY FROM restore-convertible-five.ts.
//
// Those five were written before assert-article-quality.ts did, and while their status was
// 'removed' the gate never saw them -- it only reads published rows. Publishing them moved them
// into scope and produced seven real violations. That is the gate working: a removed page is
// unjudged, not approved, and restoring one is a publishing decision that has to clear the same
// bar as a new guide.
//
// They are NOT being added to data/quality-grandfathered.json. That file may only shrink, and it
// exists for guides that predate the rules -- not as an exit for anything inconvenient.
//
// -----------------------------------------------------------------------------------------------
// RULE 2, reproducibility: a guide needs a real cost figure or a standard cited by NAME AND NUMBER
// (the gate accepts NFPA|NEC|IRC|IBC|ASTM|ASCE|ANSI|UL followed by a number).
//
// Both ASTM numbers below were verified against astm.org on 2026-09-17 rather than recalled:
//
//   ASTM E2356  Standard Practice for Comprehensive Building Asbestos Surveys. Defines the
//               Baseline, Project Design and Pre-Construction survey types, and explicitly
//               EXCLUDES air and dust sampling -- which is exactly the distinction the asbestos
//               guide is already drawing, so it documents the page's own claim.
//               https://www.astm.org/Standards/E2356.htm
//   ASTM D7338  Standard Guide for Assessment of Fungal Growth in Buildings (Subcommittee D22.08).
//               Covers collecting building background, evaluating moisture potential, inspecting
//               for suspect growth, and the procedures beyond a basic survey -- again the mold
//               guide's own subject. https://www.astm.org/Standards/D7338.htm
//
// walk-away takes an engine figure instead of a standard, read live from PRIORITY_RULES so it
// cannot drift from what the report tells the same reader. Same pattern as
// scripts/update-cast-iron-damage.ts.
//
// property-tax gets a WORKED EXAMPLE, not a sourced statistic, and it is labelled as one. There is
// no property-tax figure in this project's data and inventing a median would be exactly the
// fabrication the site's standard forbids. Arithmetic a reader can redo on their own numbers is
// reproducible in the sense the rule means; a made-up "average bill" would not be.
//
// RULE 7, clichés: two "Furthermore"s, replaced with the ordinary connective the sentence wanted.
//
// RULE 6, clusters: buying-house-reset-property-tax-assessment-sale-price matched no topic in
// GUIDE_TOPIC_PATTERNS, so it would have received no Related Guides links at all. Property tax at
// the point of sale is a transaction subject -- it sits with contingencies, escrow and closing --
// so 'transaction' gains `property[- ]tax`. That also takes the thinnest cluster from 2 to 3.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';

const sewer = (PRIORITY_RULES as any[]).find((r) => r.id === 'sewer_cast_iron');
if (!sewer) throw new Error('ABORT: engine rule "sewer_cast_iron" no longer exists');
const SCOPE = (String(sewer.costToCheck).match(/\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?/) ?? [])[0];
if (!SCOPE) throw new Error(`ABORT: could not read scope cost from engine: ${sewer.costToCheck}`);

interface Fix { slug: string; edits: Array<{ find: string; replace: string }>; }

const FIXES: Fix[] = [
  {
    slug: 'standard-home-inspection-check-asbestos',
    edits: [
      { find: 'Furthermore, the black adhesive', replace: 'The black adhesive' },
      {
        find: '## How to Get an Asbestos Inspection During Due Diligence\n',
        replace:
          '## How to Get an Asbestos Inspection During Due Diligence\n\nThe survey itself has a written standard: **ASTM E2356**, Standard Practice for Comprehensive Building Asbestos Surveys, which defines three survey types — Baseline, Project Design and Pre-Construction — and specifies what a report has to document, including the spaces the surveyor could not reach and why. It deliberately excludes air and dust sampling, which is a separate question about airborne fibres rather than about what material is present. Asking a surveyor which of those three they are quoting for is the fastest way to find out whether you are comparing like with like.\n',
      },
    ],
  },
  {
    slug: 'home-inspection-check-mold-behind-walls',
    edits: [
      { find: 'Furthermore, general home inspectors', replace: 'General home inspectors' },
      {
        find: '## Specialized Testing Methods for Wall Cavities\n',
        replace:
          '## Specialized Testing Methods for Wall Cavities\n\nThere is a published standard for this work: **ASTM D7338**, Standard Guide for Assessment of Fungal Growth in Buildings, written by the ASTM subcommittee on sampling and analysis of mould. It sets out the minimum steps — collect the building\'s background, evaluate where moisture could get in or collect, inspect for suspect growth, then decide which procedures beyond a basic survey the situation actually calls for. A quote that cannot say which of those steps it includes is not comparable to one that can.\n',
      },
    ],
  },
  {
    slug: 'when-reasonable-walk-away-after-inspection',
    edits: [{
      find: '## Systemic Plumbing and Sewer Failures\n',
      replace:
        `## Systemic Plumbing and Sewer Failures\n\nThis is the category where the walk-away decision is most often made on a guess, and it does not have to be. A camera scope of the main line costs ${SCOPE} and converts "the inspector mentioned the sewer" into a length of pipe, a location and a repair someone can quote. Deciding to leave without one means walking away from a house over a number nobody has, and staying without one means the opposite.\n`,
    }],
  },
  {
    slug: 'buying-house-reset-property-tax-assessment-sale-price',
    edits: [{
      find: '## Why Initial Escrow Accounts Often Suffer Deficits\n',
      replace:
        '## Why Initial Escrow Accounts Often Suffer Deficits\n\nThe arithmetic is worth doing on your own numbers before you sign, because the gap is usually larger than people expect. Take a house assessed at $200,000 under the previous owner, bought for $400,000, in a jurisdiction that reassesses at the sale price and levies 1.2% — the bill moves from $2,400 a year to $4,800, and the monthly escrow payment from $200 to $400. Those figures are an illustration, not a national average: substitute your county\'s assessment ratio and millage rate, which are both published, and the same two multiplications give you your own number.\n',
    }],
  },
];

async function main() {
  const slugs = FIXES.map((f) => f.slug);
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, body_markdown, status FROM articles WHERE slug = ANY(${slugs})
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');

  const COST = /\$[\d,]{3,}/;
  const NUMBERED_STANDARD = /\b(NFPA|NEC|IRC|IBC|ASTM|ASCE|ANSI|UL)\s*[A-Z]?\s?[\d][\d.\-]*/i;
  const staged: Array<{ slug: string; body: string }> = [];

  for (const fix of FIXES) {
    const cur = rows.find((r) => r.slug === fix.slug);
    if (!cur) throw new Error(`ABORT: ${fix.slug} not found`);
    if (cur.status !== 'published') throw new Error(`ABORT: ${fix.slug} is "${cur.status}"`);
    let body = String(cur.body_markdown);
    for (const e of fix.edits) {
      const n = body.split(e.find).length - 1;
      if (n !== 1) throw new Error(`ABORT: ${fix.slug} — "${e.find.slice(0, 44)}" matched ${n}, expected 1`);
      body = body.replace(e.find, e.replace);
    }
    // Verify against the gate's own regexes rather than trusting the prose.
    if (!COST.test(body) && !NUMBERED_STANDARD.test(body)) {
      throw new Error(`ABORT: ${fix.slug} still has no cost figure and no numbered standard`);
    }
    if (/\bFurthermore\b/.test(body)) throw new Error(`ABORT: ${fix.slug} still contains "Furthermore"`);
    staged.push({ slug: fix.slug, body });
    const via = NUMBERED_STANDARD.exec(body);
    console.log(`  ${fix.slug}`);
    console.log(`     ${String(cur.body_markdown).length} -> ${body.length} chars | satisfied by ${via ? via[0] : (body.match(COST) ?? [])[0]}`);
  }

  // Rule 6: the cluster pattern lives in source, not the database.
  const REL = 'src/utils/relatedGuides.ts';
  let rel = fs.readFileSync(REL, 'utf8');
  const OLD = "['transaction', /contingen|escrow|closing|\\bseller\\b|negotiat|apprais|walk[- ]away|\\bhoa\\b|earnest|disclosure|inspector/],";
  const NEW = "['transaction', /contingen|escrow|closing|\\bseller\\b|negotiat|apprais|walk[- ]away|\\bhoa\\b|earnest|disclosure|inspector|property[- ]tax|assessment/],";
  if (!rel.includes(OLD)) {
    if (rel.includes(NEW)) console.log('\n  relatedGuides.ts already patched');
    else throw new Error('ABORT: transaction topic pattern not found in relatedGuides.ts');
  } else {
    rel = rel.replace(OLD, NEW);
    console.log('\n  relatedGuides.ts: transaction pattern gains property-tax / assessment');
  }

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const s of staged) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${s.body}, updated_at = now() WHERE slug = ${s.slug}`);
    console.log(`  wrote ${s.slug}`);
  }
  fs.writeFileSync(REL, rel);
  console.log(`  wrote ${REL}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
