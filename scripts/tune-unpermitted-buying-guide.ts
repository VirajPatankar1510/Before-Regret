// Second pass on find-unpermitted-work-before-buying, from an SEO review of the page.
//
//   npx tsx scripts/tune-unpermitted-buying-guide.ts            # dry run
//   APPLY=true npx tsx scripts/tune-unpermitted-buying-guide.ts
//
// WHAT THE REVIEW GOT RIGHT, and what was already done. Its central point -- that the target query
// is an anxiety query and the page was built as a methodology tutorial -- is correct, and the
// consequences section added on 2026-09-05 already answers it. Checked the rest of its blueprint
// against the live body: transfer of obligation, appraiser treatment, insurer behaviour, seller
// disclosure, open/never-finalled permits and the assessor footprint comparison are all present.
//
// THREE THINGS WERE GENUINELY MISSING OR WRONG, and this fixes those:
//
//   1. The meta description was 171 characters. Google truncates around 155-160, so the tail was
//      being cut. Rewritten to 152.
//   2. The H2s described the content instead of matching the questions people type. "What Actually
//      Happens If You Buy It" says the same thing as "What Happens If You Buy a House with
//      Unpermitted Work?" and ranks for less. Renamed, and the discovery section renamed to name
//      escrow, which is when this reader is actually searching.
//   3. Insurance had no heading of its own despite being the single most asked sub-question. It
//      was one paragraph inside the consequences list and one bullet at the bottom. Now a section.
//
// Also adds the one factual line the review correctly identified as absent: a home inspector is
// not a code compliance officer. The page said an inspection "is not a code compliance review"
// only in the guide added later; this states it where the inspector section actually is.
//
// THE PROPOSED CTA IS NOT IMPLEMENTED, deliberately. See the note at the bottom of this file.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'find-unpermitted-work-before-buying';

// 54 characters. The previous title was 60, which is the edge of where Google truncates.
const NEW_TITLE = 'Buying a House With Unpermitted Work: What You Take On';

// 152 characters. The previous one was 171 and lost its tail in the results page.
const NEW_META = 'Buying a house with unpermitted work: who inherits the liability, how insurers and appraisers treat it, and how to find it before escrow closes.';

const EDITS: Array<[string, string, string]> = [
  [
    'H2 now matches the question people type, not a description of the section',
    '## What Actually Happens If You Buy It',
    '## What Happens If You Buy a House with Unpermitted Work?',
  ],
  [
    'discovery H2 names escrow, which is when this reader is searching',
    '## Step-by-Step Guide to Pulling Permit Records',
    '## How to Find Unpermitted Renovations Before Escrow Ends',
  ],
  [
    'inspector section states plainly that an inspector is not a code officer',
    `## The Home Inspector's Role and Limitations`,
    `## The Home Inspector's Role and Limitations

A home inspector is not a code compliance officer, and this is the misconception that costs buyers most often. An inspector evaluates the physical condition of what is in front of them. They do not hold the municipality's permit registry, they are not asked to compare the house to it, and a clean inspection report is not evidence that the work was permitted. Those are two different questions answered by two different offices, and only one of them is included in the fee you are paying.`,
  ],
];

// Insurance is the most-asked sub-question and had no heading. Placed directly after the
// consequences section, where the reader has just been told a claim can be contested.
const INSURANCE = `## Will Insurance Cover an Unpermitted Addition?

Usually the policy still exists and still covers the house. The exposure is narrower and more specific than "you have no insurance", and worth understanding precisely.

Carriers vary a great deal here, which is itself the problem — there is no single industry rule to look up. Some are indifferent to permit status. Some exclude an unpermitted structure while covering the rest of the property. Some will contest a claim where the loss is traced back to a system that was never inspected, which is the scenario that matters: a fire that started in uninspected wiring is exactly the claim you most need paid and the one most likely to be argued over.

Two practical points. First, some applications ask directly whether additions were permitted, and an inaccurate answer there is a separate problem from the permit itself — it goes to the accuracy of the application rather than the condition of the house. Second, the answer is knowable before you commit: give a prospective carrier the specifics and ask how they treat it, in writing if they will. That is a phone call during your contingency period, not a discovery after a loss.

`;

async function main() {
  const [row] = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles WHERE slug = ${SLUG}
  `)) as unknown as Array<any>;
  if (!row) throw new Error(`ABORT: ${SLUG} not found`);
  if (row.status !== 'published') throw new Error(`ABORT: ${SLUG} is '${row.status}'`);

  let body: string = row.body_markdown;
  for (const [note, oldText, newText] of EDITS) {
    const n = body.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: "${note}" matched ${n} times, expected 1`);
    body = body.replace(oldText, newText);
    console.log(`  ok  ${note}`);
  }

  const anchor = '## How to Find Unpermitted Renovations Before Escrow Ends';
  if (body.split(anchor).length - 1 !== 1) throw new Error('ABORT: insurance anchor not unique');
  body = body.replace(anchor, INSURANCE + anchor);
  console.log('  ok  insurance promoted to its own section');

  // --- assertions -------------------------------------------------------------------------
  if (NEW_TITLE.length > 60) throw new Error(`ABORT: title ${NEW_TITLE.length} chars`);
  if (NEW_META.length > 155) throw new Error(`ABORT: meta ${NEW_META.length} chars`);

  const live = new Set((await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`) as unknown as Array<{ slug: string }>).map((r) => r.slug));
  const dead = [...new Set([...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))].filter((s) => !live.has(s));
  if (dead.length) throw new Error(`ABORT: dead internal link(s): ${dead.join(', ')}`);

  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    const hit = body.match(re);
    if (hit) throw new Error(`ABORT: nested link/bold: ${hit[0]}`);
  }

  // Density guard. Adding headings that repeat the phrase is exactly how a page tips into
  // stuffing, so this refuses rather than trusting the edit.
  const visible = body.replace(/[#*_>|`-]/g, ' ');
  const words = visible.split(/\s+/).filter(Boolean).length;
  const phrase = 'buying a house with unpermitted work';
  const hits = (`${NEW_TITLE} ${NEW_META} ${visible}`.toLowerCase().split(phrase).length - 1);
  const density = (hits * phrase.split(' ').length) / words * 100;
  if (density > 2) throw new Error(`ABORT: phrase density ${density.toFixed(2)}% -- too high`);

  console.log(`\n  title   : ${NEW_TITLE} (${NEW_TITLE.length} chars, was ${row.title.length})`);
  console.log(`  meta    : ${NEW_META.length} chars (was ${row.meta_description.length})`);
  console.log(`  body    : ${row.body_markdown.length} -> ${body.length} chars`);
  console.log(`  phrase  : ${hits} occurrence(s), ${density.toFixed(2)}% density`);
  console.log('  H2s     :');
  for (const m of body.matchAll(/^## (.+)$/gm)) console.log(`     ${m[1]}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  const res = (await withDb((sql) => sql`
    UPDATE articles SET title = ${NEW_TITLE}, meta_description = ${NEW_META},
      body_markdown = ${body}, updated_at = now()
    WHERE slug = ${SLUG} RETURNING slug, length(body_markdown) AS len
  `)) as unknown as Array<{ slug: string; len: number }>;
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  updated ${res[0].slug} (${res[0].len} chars)`);
}

// THE CTA IN THE REVIEW IS NOT IMPLEMENTED, AND SHOULD NOT BE.
//
// It reads: "Our instant diagnostic engine automatically cross-references active listings with
// local building permit histories, zoning codes, and regional flood maps to flag hidden permit
// discrepancies before you sign."
//
// The product does not do that. The report pulls live seismic hazard data, validates the address,
// and builds era- and county-specific inspection priorities and seller questions -- that is what
// ArticleClosingNote.tsx and the homepage FAQ both say, and no server code performs a per-address
// permit or zoning lookup. There is no per-address permit archive behind this site, which is the
// entire reason these guides teach the reader to pull the records themselves.
//
// So the copy would promise, at the top of a page about permits, that the tool does the one thing
// the page exists to explain the reader must do manually. On a site that charges for the report,
// that is a refund complaint with a paper trail, and it contradicts this project's own standing
// rule: never describe a data source that does not exist.
//
// The placement idea is sound. An honest version of the same block -- "this report gives you the
// seller questions and the inspection priorities for a house of this era and county; it does not
// pull permits, and here is how to do that part yourself" -- would work, and the page already
// carries the free-report CTA below the body plus a vendor ad slot above it. Whether a third
// call to action helps or crowds the page is a judgement worth making deliberately rather than
// inheriting from a template.
main().catch((e) => { console.error(e.message || e); process.exit(1); });
