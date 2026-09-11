// Second revision pass on the polybutylene insurance guide.
//
//   npx tsx scripts/revise-polybutylene-2.ts            # dry run
//   APPLY=true npx tsx scripts/revise-polybutylene-2.ts
//
// -----------------------------------------------------------------------------------------------
// ONE OF THE THREE POINTS WAS ALREADY DONE. "A mortgage will not fund without a bound policy" was
// softened in the previous pass and reads "a lender will generally require evidence of homeowners
// insurance before closing" in the database. The reviewer was reading the build that was still
// rolling out, which independently confirms the deploy was in flight rather than stuck.
//
// THE PIPE-VERSUS-ENSUING-DAMAGE POINT IS A GAP, NOT A BLUR. The review says the article
// "generally understands this distinction". Checking every sentence about what a policy pays for,
// it does not make it anywhere. It discusses exclusions on water damage originating from the supply
// lines, and never says that replacing the pipes is not a covered claim in the first place. Those
// are genuinely different questions and the second one is why the repipe cost lands on the buyer.
// Stating it also ties the piece together: it explains why the planning range matters at all.
//
// THE "SHORT ANSWER" BOX IS THE QUICK ANSWER, so it is strengthened rather than duplicated. The
// proposed box is near-identical in substance to what already renders above the fold; adding it as
// a second block would be the rephrase-padding that §7 and the FAQ skill both warn against. What
// the proposal genuinely adds is ENUMERATING the four outcomes -- exclusion, repipe requirement,
// higher cost, refusal -- which the current wording gestures at without listing. That goes into the
// quick answer itself, where mobile readers actually see it, inside the 450-character ceiling.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'polybutylene-pipes-home-insurance';

const rule = (PRIORITY_RULES as any[]).find((r) => r.id === 'polybutylene_supply');
const REPAIR = (String(rule?.typicalRepairCost).match(/\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?/) ?? [])[0];
if (!REPAIR) throw new Error('ABORT: engine cost range unavailable');

const NEW_QUICK_ANSWER =
  `Usually yes, but not always, and rarely without conditions. Depending on the insurer and the property you may meet a water-damage exclusion, a repipe requirement, a surcharge, or a refusal to write at all. No policy pays to replace the pipes either way — a whole-home repipe is roughly ${REPAIR}. Get a written answer on the actual address before your option period ends; an inspection report is not a binder.`;

const BODY_EDIT = {
  why: 'states the pipe-versus-ensuing-damage distinction, which the article never actually made',
  from: 'Get a local plumber to put a figure on your actual house before you take one into a negotiation.',
  to: `Get a local plumber to put a figure on your actual house before you take one into a negotiation.

One distinction is worth being explicit about, because it is easy to blur and the two halves get different answers. A homeowners policy is not designed to pay for the repipe: replacing supply lines is maintenance, and maintenance is what a policy excludes. What may be covered is the ensuing damage — the ceiling, the flooring, the contents — when a fitting lets go, and whether that is covered turns on the policy's own wording and exclusions. "Will you insure this house" and "will you pay if these pipes fail" are two questions, and an agent answering one has not answered the other.`,
};

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT quick_answer, body_markdown FROM articles WHERE slug = ${SLUG}
      `)) as unknown as any[];
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  if (!rows?.length) throw new Error(`ABORT: ${SLUG} not found`);

  const oldQa = String(rows[0].quick_answer);
  let body = String(rows[0].body_markdown);

  // The previous pass must already have landed, or this is being run against stale content.
  if (/will not fund/i.test(body)) throw new Error('ABORT: body still contains "will not fund" — earlier revision missing');
  if (!/generally require evidence/i.test(body)) throw new Error('ABORT: softened lender wording absent');

  const n = body.split(BODY_EDIT.from).length - 1;
  if (n !== 1) throw new Error(`ABORT: anchor matched ${n} times, expected 1`);
  body = body.replace(BODY_EDIT.from, BODY_EDIT.to);

  // Rule 3 ceiling. 63.3% of this site's Google clicks are mobile; the quick answer is what that
  // reader sees before scrolling.
  if (NEW_QUICK_ANSWER.length < 120 || NEW_QUICK_ANSWER.length > 450) {
    throw new Error(`ABORT: quick_answer ${NEW_QUICK_ANSWER.length} chars, must be 120-450`);
  }
  // Rule 1. The new text is entirely about carriers.
  for (const c of ['state farm', 'allstate', 'geico', 'liberty mutual', 'usaa', 'citizens property', 'nationwide']) {
    if (`${NEW_QUICK_ANSWER} ${body}`.toLowerCase().includes(c)) throw new Error(`ABORT: names carrier "${c}"`);
  }
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
  }
  if (!body.includes(REPAIR)) throw new Error('ABORT: engine cost figure absent from body');

  console.log(`\n  ${SLUG}`);
  console.log(`  quick_answer ${oldQa.length} -> ${NEW_QUICK_ANSWER.length} chars (ceiling 450)`);
  console.log(`    -  ${oldQa.slice(0, 120)}…`);
  console.log(`    +  ${NEW_QUICK_ANSWER.slice(0, 120)}…`);
  console.log(`\n  body +${BODY_EDIT.to.length - BODY_EDIT.from.length} chars`);
  console.log(`    ${BODY_EDIT.why}`);
  console.log(`\n  ok  carriers named: 0   cost figure intact   lender wording already softened`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    UPDATE articles SET quick_answer = ${NEW_QUICK_ANSWER}, body_markdown = ${body}, updated_at = now()
    WHERE slug = ${SLUG}`);
  console.log(`\n  wrote ${SLUG}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
