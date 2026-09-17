// The definition-vs-execution pivot, on the cast iron guide.
//
//   npx tsx scripts/cast-iron-execution-pivot.ts            # dry run
//   APPLY=true npx tsx scripts/cast-iron-execution-pivot.ts
//
// -----------------------------------------------------------------------------------------------
// THE IDEA. 99.33% of this site's impressions produce no click (7,291 -> 49 over 28 days). Fighting
// for the definitional click is fighting for the 0.67%. So: give the definition away where an AI
// or a featured snippet will lift it, and follow it immediately with something neither can deliver
// -- a physical check that only happens with the reader standing in the house.
//
// The zero-click reader gets the fact and owes us nothing. The reader who needs to evaluate THEIR
// basement finds the next step is a tool, not another paragraph.
//
// WHY THIS PAGE. It already ranks (283 impressions/28d), it was retargeted at "cast iron pipe
// damage" this week, and the walkthrough tool already carries a cast-iron check pointing back at
// it -- so the routing is bidirectional rather than a new dead end. /walkthrough/ currently has
// ZERO impressions, which is the other half of the problem this is meant to address.
//
// -----------------------------------------------------------------------------------------------
// EVERY PHYSICAL CHECK BELOW COMES FROM THIS ARTICLE'S OWN ESTABLISHED FACTS. That constraint
// killed the first draft.
//
// The obvious version of this advice -- "check the bottom 12 inches of the stack" -- CONTRADICTS
// the page. This guide's own subsection is headed "The top of the pipe fails before the bottom",
// because the acid forms on the damp walls ABOVE the flow (Thiobacillus), and it says in terms:
// "A pipe can look sound from underneath while its top is thinning toward failure." Telling a
// reader to inspect the underside would send them to the part that looks fine longest.
//
// So the checks are: magnet (the article states a refrigerator magnet sticks to cast iron), tap
// for the dull thud (it states plastic sounds hollow), inspect the TOP of horizontal runs (crown
// corrosion), and look at the floor beneath them (it states channeling lets waste escape into the
// soil under the slab or basement floor). Nothing invented, nothing that needs a tool the reader
// does not already own.
//
// The scope cost is read from PRIORITY_RULES at run time, never retyped, so it cannot drift from
// the figure the report gives the same reader.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'why-cast-iron-pipes-corrode';
const ANCHOR = '## What to do before you buy';

const rule = (PRIORITY_RULES as any[]).find((r) => r.id === 'sewer_cast_iron');
if (!rule) throw new Error('ABORT: engine rule "sewer_cast_iron" no longer exists');
const SCOPE = (String(rule.costToCheck).match(/\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?/) ?? [])[0];
if (!SCOPE) throw new Error(`ABORT: could not read the scope cost from the engine: ${rule.costToCheck}`);

const SECTION = `## What you can check yourself, standing in the basement

Crown corrosion is the reason a cast iron line cannot be judged from outside: the acid works on the damp surfaces above the flow, so a run can look sound from underneath while its top thins toward failure.

That is a limit on what looking achieves, not a reason to skip it. Four checks take about two minutes with a torch, and each answers a question a listing will not.

1. **Put a magnet on the stack.** It sticks to cast iron and falls off plastic. That settles what you are looking at before you spend anything on finding out its condition.
2. **Tap it.** Cast iron answers with a dull, solid thud. Plastic sounds hollow, and the difference is obvious once you have heard both on the same visit.
3. **Look at the top of any exposed horizontal run, not the underside.** The underside is the part that stays looking fine longest, which is exactly why people are reassured by it.
4. **Check the floor beneath those runs.** Where the bottom does erode it can wear into a groove and open, and what escapes goes into the soil under the slab — staining or persistent damp below a horizontal run is worth photographing.

None of that tells you the condition of the inside of the pipe, and nothing you can do in an afternoon will. What it tells you is whether the ${SCOPE} scope is worth booking, and every one of those four checks has to happen with you in the house, in the twenty minutes you actually get.

If you would rather not have to remember which of them applies to a house of this age and foundation, the [20-minute walkthrough checklist](/walkthrough/) builds the list for you and ticks off on a phone.

`;

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, body_markdown, status FROM articles WHERE slug = ${SLUG}`)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');
  if (!rows.length) throw new Error(`ABORT: ${SLUG} is not in the articles table`);
  const cur = rows[0];
  if (cur.status !== 'published') throw new Error(`ABORT: ${SLUG} is "${cur.status}"`);

  let body = String(cur.body_markdown);
  if (body.includes('standing in the basement')) throw new Error('ABORT: the pivot section is already present');

  const at = body.indexOf(ANCHOR);
  if (at < 0) throw new Error(`ABORT: anchor "${ANCHOR}" not found -- the article changed`);
  body = `${body.slice(0, at)}${SECTION}${body.slice(at)}`;

  // --- gates -----------------------------------------------------------------------------------
  // The claim that killed the first draft: the advice must not contradict the page it sits on.
  if (/bottom (12|twelve) inches/i.test(body)) {
    throw new Error('ABORT: body now tells the reader to inspect the bottom of the stack, which contradicts this page\'s own crown-corrosion section');
  }
  for (const need of ['magnet', 'dull, solid thud', 'top of any exposed horizontal run', SCOPE, '/walkthrough/']) {
    if (!body.includes(need)) throw new Error(`ABORT: the inserted section lost "${need}"`);
  }
  const CLICHES = /\b(delve|furthermore|crucial|regulatory landscape|when it comes to|moreover|navigate the)\b/i;
  const cl = body.match(CLICHES);
  if (cl) throw new Error(`ABORT: cliché "${cl[0]}"`);
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
  }
  // One /walkthrough/ link, not two -- the page must not start nagging.
  const walk = (body.match(/\/walkthrough\//g) ?? []).length;
  if (walk !== 1) throw new Error(`ABORT: ${walk} links to /walkthrough/, expected exactly 1`);

  console.log(`\n  ${SLUG}`);
  console.log(`    body ${String(cur.body_markdown).length} -> ${body.length} chars (+${body.length - String(cur.body_markdown).length})`);
  console.log(`    scope figure read from the engine: ${SCOPE}`);
  console.log(`    inserted before: "${ANCHOR}"`);
  console.log(`    routes to /walkthrough/ (currently 0 impressions) once, not twice`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  wrote ${SLUG}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
