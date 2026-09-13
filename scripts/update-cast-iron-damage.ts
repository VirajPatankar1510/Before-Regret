// Retarget the cast iron guide at the damage/cost intent it already half-ranks for.
//
//   npx tsx scripts/update-cast-iron-damage.ts            # dry run
//   APPLY=true npx tsx scripts/update-cast-iron-damage.ts
//
// -----------------------------------------------------------------------------------------------
// THE TARGET IS NOT THE PHRASE THAT WAS ASKED FOR, and that is the pipeline working.
//
// The request named "cast iron pipes problems". That exact string appears in no capture, so under
// step 1 it cannot be targeted -- targeting an unmeasured phrase is the invented-keyword failure the
// provenance gate exists to stop. The measured demand next to it is larger anyway:
//
//   cast iron pipe damage             104 impressions, position 84.8
//   cast iron sewer pipe corrosion     52 impressions, position 71.0
//   cast iron drain pipes problems      1 impression,  position 69.0
//
// WHAT IS ACTUALLY WRONG WITH THE PAGE, which metadata alone cannot fix. At position 71-85 nothing
// written in a title earns a click; the page has to deserve the ranking first. It currently:
//
//   - contains ZERO dollar figures, while carrying a heading called "What actually drives
//     replacement cost". It explains what drives the cost and then never gives one.
//   - never uses the word "damage" -- the single word in its largest query.
//   - mentions "sewer" twice, in a subject where the two biggest queries both say "sewer pipe".
//   - opens with a 527-character quick_answer, over the 450 mobile ceiling, almost entirely about
//     sulfur chemistry rather than what the reader should do.
//
// So this is a substance edit with a metadata edit attached, not the reverse. It also shrinks TWO
// grandfather lists at once: reproducibility (a real cost figure) and the TL;DR ceiling.
//
// The page's existing caution -- "a single national figure would be misleading" -- is right and is
// kept. The engine's numbers are ranges, and its own header says costs there are "always ranges,
// never point estimates", so a planning range does not contradict that. It replaces silence.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'why-cast-iron-pipes-corrode';

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'cast iron pipe damage',
  capture: '2026-09-13-gsc-queries',
  intent: 'transactional',
  who: 'a buyer whose inspector flagged cast iron drain lines in a pre-1973 house, now deciding whether to pay for a sewer scope before the option period closes',
  want: 'to know what a scope costs, what a repair costs if it finds something, and whether this is a walk-away or a negotiation',
  achieve: 'price the risk before removing the inspection contingency, rather than discovering it after closing',
  titlePromise: 'what scoping and repairing cast iron actually costs',
};

const rule = (PRIORITY_RULES as any[]).find((r) => r.id === 'sewer_cast_iron');
if (!rule) throw new Error('ABORT: engine rule "sewer_cast_iron" no longer exists');
const SCOPE = (String(rule.costToCheck).match(/\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?/) ?? [])[0];
const REPAIR = String(rule.typicalRepairCost);
const SPOT = (REPAIR.match(/Spot repair (\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?)/) ?? [])[1];
const FULL = (REPAIR.match(/full replacement (\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?)/) ?? [])[1];
const LIFE = (String(rule.eraBasis).match(/roughly (\d+ to \d+) years/) ?? [])[1];
if (!SCOPE || !SPOT || !FULL || !LIFE) {
  throw new Error(`ABORT: engine figures unreadable — scope=${SCOPE} spot=${SPOT} full=${FULL} life=${LIFE}`);
}

const TITLE = 'Cast Iron Sewer Pipe Damage: What Scoping and Repair Cost';
const META =
  `Cast iron drain lines last roughly ${LIFE} years and fail from the inside. What a scope costs, what repair costs, and how to price it before you close.`;

const QUICK_ANSWER =
  `A camera scope costs ${SCOPE} and is the only way to know the pipe's condition — cast iron corrodes from the inside, so age and appearance tell you little. Spot repair of one failed section runs ${SPOT}; replacing the whole line runs ${FULL}. Service life is roughly ${LIFE} years, so a pre-1973 house is at or past it. Scope before your option period ends.`;

/** Appended after the existing "what drives it" list, which stays: the page is right that a single
 *  national figure misleads, and wrong only to have given no figure at all. */
const COST_BLOCK = `

Those are the variables, and they are why a quote on your house is the number that matters. As a planning range before you have one:

| | |
|---|---|
| Camera scope of the line | **${SCOPE}** |
| Spot repair, one failed section | **${SPOT}** |
| Full replacement | **${FULL}** |

Cast iron drain lines have a service life of roughly ${LIFE} years, so a house built before 1973 is at or past that window regardless of how the pipe looks from outside.

Damage in a cast iron sewer line is almost always interior and invisible until the line is scoped. That is what makes the scope the cheapest money in this decision rather than an optional extra: without it you are pricing sewer damage you cannot see, and the difference between a spot repair and a full replacement is the difference between a credit you can negotiate and one that changes whether you want the house.

Ask the plumber for the recording, not just the verdict. A scope that finds damage should hand you footage showing where it is and how far the line runs, which is what a contractor quotes against and what a seller's agent will ask to see.`;

async function main() {
  validateBrief(BRIEF);

  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, meta_description, quick_answer, body_markdown FROM articles WHERE slug = ${SLUG}
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  // Distinguish these two. Reporting "not found" for an unreachable database sends the reader
  // looking for a missing slug that is actually sitting there.
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');
  if (!rows.length) throw new Error(`ABORT: ${SLUG} is not in the articles table`);
  const cur = rows[0];

  // Append the cost block to the existing section rather than replacing the reasoning in it.
  const ANCHOR = 'Responsibility for the segment between the house and the municipal main varies by jurisdiction, and that segment is often the most expensive to';
  let body = String(cur.body_markdown);
  const idx = body.indexOf(ANCHOR);
  if (idx < 0) throw new Error('ABORT: cost-section anchor not found — the article changed');
  // Insert after the end of that bullet's paragraph.
  const endOfPara = body.indexOf('\n\n', idx);
  if (endOfPara < 0) throw new Error('ABORT: could not find the end of the cost bullet list');
  body = body.slice(0, endOfPara) + COST_BLOCK + body.slice(endOfPara);

  // --- gates -------------------------------------------------------------------------------
  if (TITLE.length > 60) throw new Error(`ABORT: title ${TITLE.length} chars`);
  if (META.length > 155 || META.length < 70) throw new Error(`ABORT: meta ${META.length} chars`);
  if (QUICK_ANSWER.length > 450 || QUICK_ANSWER.length < 120) throw new Error(`ABORT: tldr ${QUICK_ANSWER.length} chars`);
  // The metadata now promises cost; the body must deliver it.
  for (const need of [SCOPE, SPOT, FULL, LIFE]) {
    if (!body.includes(need)) throw new Error(`ABORT: body lacks engine figure "${need}"`);
  }
  // The title promises "Sewer Pipe Damage", so the body must actually be about both. A metadata
  // promise the body does not deliver is the defect the `requires` gate exists to catch, and my
  // first draft of this edit tripped it: title said sewer damage, body said "sewer" twice and
  // "damage" once.
  for (const [word, min] of [['damage', 3], ['sewer', 4]] as Array<[string, number]>) {
    const n = (body.match(new RegExp(word, 'gi')) ?? []).length;
    if (n < min) throw new Error(`ABORT: title promises "${word}" but body uses it ${n}x, want ${min}+`);
  }
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
  }
  // Table needs a separator row or it renders as garbled prose.
  if (![...body.matchAll(/\n\|[^\n]+\|\n\|[\s:|-]+\|\n/g)].length) throw new Error('ABORT: malformed table');

  console.log(`\n  ${SLUG}`);
  console.log(`    title  ${String(cur.title).length} -> ${TITLE.length}`);
  console.log(`      -  ${cur.title}`);
  console.log(`      +  ${TITLE}`);
  console.log(`    meta   ${String(cur.meta_description).length} -> ${META.length}`);
  console.log(`    tldr   ${String(cur.quick_answer).length} -> ${QUICK_ANSWER.length}  (ceiling 450)`);
  console.log(`    body   ${String(cur.body_markdown).length} -> ${body.length}`);
  console.log(`\n    engine figures added: scope ${SCOPE} | spot ${SPOT} | full ${FULL} | life ${LIFE} yrs`);
  console.log(`    "damage" occurrences: ${(String(cur.body_markdown).match(/damage/gi) ?? []).length} -> ${(body.match(/damage/gi) ?? []).length}`);
  console.log(`    "sewer"  occurrences: ${(String(cur.body_markdown).match(/sewer/gi) ?? []).length} -> ${(body.match(/sewer/gi) ?? []).length}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    UPDATE articles SET title = ${TITLE}, meta_description = ${META}, quick_answer = ${QUICK_ANSWER},
      body_markdown = ${body}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  wrote ${SLUG}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
