// Adds a claims section to the aluminum-wiring guide.
//
//   npx tsx scripts/add-aluminum-claims-section.ts          # dry run
//   APPLY=true npx tsx scripts/add-aluminum-claims-section.ts
//
// -----------------------------------------------------------------------------------------------
// EVIDENCE. Google's biggest query for this page is "will homeowners insurance COVER aluminum
// wiring" -- 21 impressions at position 36.4, its worst placement by a wide margin. The page is
// titled "Can You GET Home Insurance with Aluminum Wiring?" and every one of its thirteen H2s is
// about underwriting: who will write the policy, what remediation they accept, what they reject.
//
// Those are different questions. GET is underwriting. COVER is claims. The page currently contains
// "cover a claim" 0 times, "denied" 0 times and "pay out" 0 times. Position 36 is what a page looks
// like when it is topically adjacent to a query but does not answer it.
//
// This is an UPDATE EXISTING, not a new URL: a separate page on claims would cannibalise this one,
// which already ranks 13.4 on Google and 1-5 on Bing for the underwriting half.
//
// -----------------------------------------------------------------------------------------------
// THE INSURANCE CLAIM IS SOURCED, because the framework's hard stop forbids shipping one that is
// not. The Texas Department of Insurance consumer guide lists "fire and lightning" among damages
// most policies in that state cover and "wear and tear" among those they do not. Those two lines
// are the poles the section is built on. TDI is attributed as a state regulator describing policies
// in its own state rather than quoted as a national rule, because it is not one.
//
// CARRIER RULE. No insurer is named anywhere near an underwriting or claims verb, and there is no
// blanket "most insurers refuse X". The only quantified claim is TDI's own "most policies", carried
// with its attribution.
//
// NOT TOUCHED: quick_answer, title, meta_description, slug, canonical. This page is a control in
// the Generative-AI verdict test, whose variable is whether the quick answer opens with a verdict.
// Adding a body section does not touch that variable at all, which makes this the safest kind of
// change available while the test runs.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'get-home-insurance-aluminum-wiring';
/** Insert before this heading: the underwriting arc closes, then claims, then mortgage. */
const ANCHOR = '## How Aluminum Wiring Impacts Mortgage Approval';

const SECTION = `## Will a Policy Cover Aluminum Wiring Damage?

Getting a policy and having a claim paid are separate questions, and they have different answers.

Fire is a covered peril on a standard homeowners form. The Texas Department of Insurance, describing what most policies in that state cover, lists "fire and lightning" among the damages they pay for and "wear and tear" among the damages they do not. Those two lines decide most aluminum-wiring claims. If a connection overheats and ignites, the fire damage is what the policy responds to. Replacing aging aluminum branch circuits because they are aging is maintenance, and maintenance is what the exclusion names.

The disputes sit between those poles, and they turn on whether the failure was sudden or gradual. One connection that overheated and ignited reads as sudden. Insulation that crumbled over four decades reads as deterioration. Which of those two descriptions the adjuster accepts is usually what a denial rests on.

A third way a claim fails has nothing to do with the wiring. If the application asked about the home's wiring and the answer was wrong, a carrier can seek to rescind the policy for misrepresentation. That problem is created at the application, not at the fire, and it is a reason to know what is behind the walls before anyone fills in the form.

Policy forms are not identical across states or carriers. Read the declarations page for the form name and the exclusions section for the wear-and-tear language, rather than relying on a general description of either.

`;

/** Reused from assert-article-quality.ts. One list, not two that drift. */
const CLICHES: Array<[string, RegExp]> = [
  ['no legitimate use here', /\b(delve[sd]?|delving|tapestry|demystif\w+|myriad|plethora|realm of|pivotal|in conclusion|moreover|furthermore|a testament to|navigating the complexities|it'?s worth noting|embark on)\b/i],
  ['metaphorical landscape', /\b(regulatory|current|evolving|changing|competitive|digital|modern)\s+landscape\b/i],
  ['leverage as a verb', /\b(to|can|will|should|must|help[s]?\s+you)\s+leverage\b|\bleveraging\b/i],
  ['seamless as a metaphor', /\bseamless(ly)?\s+(experience|integration|process|transition|journey)\b/i],
  ['filler', /\b(it is important to note|when it comes to|needless to say|at the end of the day|in today'?s world)\b/i],
  ['empty intensifier', /\bcrucial\b/i],
];
const SLOP: Array<[string, RegExp]> = [
  ['hollow opener', /\b(in this (article|guide|post)|this (article|guide) (will|explores|covers)|let'?s (dive|take a look))\b/i],
  ['promissory filler', /\b(read on|keep reading|we'?ll (explain|cover|explore))\b/i],
  ['empty summary close', /\b(ultimately|in summary|to sum up|the bottom line is)\b/i],
  ['unsourced consensus', /\b(experts (agree|say|recommend)|studies show|research (shows|suggests))\b/i],
  ['not-only-but-also', /\bnot only\b[^.]{0,80}\bbut also\b/i],
];
const NAMED_CARRIER = /\b(State Farm|Allstate|Geico|Progressive|Farmers|USAA|Liberty Mutual|Nationwide|Travelers|Citizens Property|American Family|Erie Insurance|Hippo|Lemonade)\b/;
const BLANKET = /\b(most|all|every|no)\s+(insurers?|carriers?)\s+\w+/i;

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, body_markdown, quick_answer FROM articles
    WHERE slug = ${SLUG} AND status='published'`)) as unknown as any[];
  if (!rows.length) throw new Error(`ABORT: ${SLUG} is not published`);
  const body = String(rows[0].body_markdown);

  if (!body.includes(ANCHOR)) throw new Error(`ABORT: anchor heading not found -- the page structure changed`);
  if (/## Will a Policy Cover/i.test(body)) throw new Error('ABORT: the section is already there');

  for (const [label, re] of [...CLICHES, ...SLOP]) {
    const m = SECTION.match(re);
    if (m) throw new Error(`ABORT: [${label}] "${m[0].trim()}"`);
  }
  if (NAMED_CARRIER.test(SECTION)) throw new Error('ABORT: names a carrier');
  // TDI's own "most policies" is attributed and allowed; "most insurers" is not.
  if (BLANKET.test(SECTION)) throw new Error('ABORT: blanket insurer claim');
  if (!/Texas Department of Insurance/.test(SECTION)) throw new Error('ABORT: the claim lost its source');

  const next = body.replace(ANCHOR, `${SECTION}${ANCHOR}`);
  const newH2s = [...next.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]);
  const dupes = newH2s.filter((h, i) => newH2s.indexOf(h) !== i);
  if (dupes.length) throw new Error(`ABORT: duplicate H2 introduced: ${dupes.join(', ')}`);

  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  console.log(`  ${SLUG}`);
  console.log(`    body       ${words(body)} -> ${words(next)} words (+${words(next) - words(body)})`);
  console.log(`    H2 count   ${(body.match(/^## /gm) ?? []).length} -> ${(next.match(/^## /gm) ?? []).length}`);
  console.log(`    inserted before: ${ANCHOR}`);
  console.log(`    quick_answer, title, meta, slug, canonical: unchanged`);
  console.log(`\n  --- the section ---\n`);
  for (const line of SECTION.trimEnd().split('\n')) console.log(`  ${line}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  written. Run \`npm run build\` or it is not live.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
