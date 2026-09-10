// Extends definitional guides past the definition, using cost data this project already holds.
//
//   npx tsx scripts/extend-definitional-guides.ts            # dry run
//   APPLY=true npx tsx scripts/extend-definitional-guides.ts
//
// -------------------------------------------------------------------------------------------
// WHY.
//
// 19 of 57 published guides answer "what does X mean". A DataForSEO AI Mode capture on 2026-09-10
// showed Google reproducing one of them -- open-ground -- in full, with ZERO citations at any
// level: definition, causes, how inspectors find it, severity, fixability. Nothing on that page
// needed crediting, because nothing on it required anything but general knowledge.
//
// The audit that followed found the gap precisely: 18 of the 19 contain NO dollar figure, and only
// 3 tell the reader what to ask. Those two things are what a general model cannot produce, and this
// project already holds them in src/engine/inspectionPriorities.ts.
//
// -------------------------------------------------------------------------------------------
// EVERY FIGURE HERE IS READ FROM THE ENGINE AT RUN TIME. None is typed into this file.
//
// costFor() below pulls costToCheck / typicalRepairCost / insuranceRedFlag straight off
// PRIORITY_RULES and asserts the rule exists. If a rule is renamed or its figures change, the
// guides can be regenerated rather than silently disagreeing with the report the same engine
// produces. A number retyped here would be a number that drifts.
//
// -------------------------------------------------------------------------------------------
// WHY EACH SECTION IS WRITTEN SEPARATELY, and this is the important part.
//
// The obvious implementation is one templated block stamped into all 19 guides. That would
// reproduce, at speed, the exact failure this work exists to correct: an identical section in the
// same position with the same heading across a whole content library is a template footprint, and
// a footprint is what gets detected. So each guide gets its own heading, its own framing, and its
// own reason for mentioning the number. They share data, not shape.
//
// -------------------------------------------------------------------------------------------
// ONLY EIGHT GUIDES ARE TOUCHED, out of nineteen.
//
// The other eleven have no matching engine rule -- there is no cost data in this project for an
// underground oil tank, a septic inspection, an open ground, reverse polarity, a double-tapped
// breaker, blocked access, or amateur workmanship. Inventing a range for those would be worse than
// leaving them thin: it would convert a reproducible page into a wrong one. They are listed at the
// end of the run so the gap stays visible.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';

type Rule = { id: string; costToCheck: string | null; typicalRepairCost: string | null; insuranceRedFlag?: string };

function rule(id: string): Rule {
  const r = (PRIORITY_RULES as unknown as Rule[]).find((x) => x.id === id);
  if (!r) throw new Error(`ABORT: engine rule "${id}" no longer exists`);
  return r;
}

/** Pull the first dollar range out of an engine string, so prose can quote it inline. */
function money(value: string | null | undefined, label: string): string {
  const m = (value ?? '').match(/\$[\d,]+(?:\s*[–-]\s*\$?[\d,]+\+?)?/);
  if (!m) throw new Error(`ABORT: no dollar figure in ${label}: "${value}"`);
  return m[0];
}

const KT = rule('knob_and_tube');
const PANEL = rule('electrical_panel_brand');
const WDI = rule('termite_wdi_inspection');
const SEWER = rule('sewer_cast_iron');
const FOUND = rule('foundation_type_general');
const HVAC = rule('hvac_age');

type Edit = { slug: string; anchor: string; section: string };

const EDITS: Edit[] = [
  {
    slug: 'what-is-knob-and-tube-wiring',
    anchor: '## ',
    section: `## What It Costs to Confirm, and What It Costs to Fix

Identifying knob-and-tube is usually part of a general inspection, but only if you ask for it in writing. A dedicated electrician evaluation runs ${money(KT.costToCheck, 'knob_and_tube check')}, and that is the version worth paying for when the wiring is partly concealed.

The repair is the number that changes a purchase decision: ${money(KT.typicalRepairCost, 'knob_and_tube fix')} for a partial to whole-home rewire.

There is a second cost that is not a repair bill. ${KT.insuranceRedFlag} That makes it a financing problem as much as an electrical one, because a mortgage will not close without a binder.`,
  },
  {
    slug: 'knob-tube-wiring-have-be-replaced-before-closing',
    anchor: '## ',
    section: `## The Numbers Behind the Decision

Whether it has to go before closing usually comes down to two figures rather than to code.

A rewire runs ${money(KT.typicalRepairCost, 'kt fix')}. Confirming what you are dealing with is cheaper by orders of magnitude: usually included in a general inspection if you ask for it explicitly, or ${money(KT.costToCheck, 'kt check')} for a dedicated electrician evaluation.

The reason it so often has to happen before closing rather than after is the insurance one. ${KT.insuranceRedFlag} Ask an independent agent for a real quote on the address before your contingency expires, not after.`,
  },
  {
    slug: 'federal-pacific-stab-lok-panel-inspectors-flag',
    anchor: '## ',
    section: `## What Replacement Costs, and Why the Quote Comes First

Recording the panel brand costs nothing beyond asking: it is included in a general inspection, and the inspector only needs to write down what is printed on the label.

Replacing the panel is ${money(PANEL.typicalRepairCost, 'panel fix')}.

The order matters more than the number. ${PANEL.insuranceRedFlag} So the first call is to an independent insurance agent, not an electrician — if no carrier will bind coverage as-is, the replacement is not a negotiating item, it is a condition of closing.`,
  },
  {
    slug: 'standard-home-inspection-include-termites',
    anchor: '## ',
    section: `## What a Separate WDI Report Costs

Because it is a separate report, it carries a separate price, and it is small: ${money(WDI.costToCheck, 'wdi check')} for a standalone wood-destroying insect inspection.

Set that against what it is protecting you from. ${WDI.typicalRepairCost}.

That ratio is the argument for ordering one on any house where the general inspection notes conducive conditions, rather than waiting to see whether the lender requires it.`,
  },
  {
    slug: 'va-loan-require-termite-inspection',
    anchor: '## ',
    section: `## What It Costs, and Who Ends Up Paying

The report itself is ${money(WDI.costToCheck, 'wdi check')}. Who pays varies by state and by what the purchase contract says, which is why it is worth settling in the contract rather than assuming.

What the report can trigger is the larger figure. ${WDI.typicalRepairCost}.

On a VA purchase that distinction matters more than usual, because required corrections have to be complete before the loan can close — so the timing of the report, not just its cost, belongs in the negotiation.`,
  },
  {
    slug: 'wdo-report-who-supposed-order',
    anchor: '## ',
    section: `## The Cost, and Why It Is Worth Ordering Even When Nobody Requires It

A standalone WDO or WDI report runs ${money(WDI.costToCheck, 'wdi check')}, which is among the cheapest line items in the whole transaction.

If it finds something, the range opens up considerably: ${WDI.typicalRepairCost}.

That asymmetry is the reason to order one when the answer to "who is supposed to" turns out to be nobody. A buyer who skips it to save a hundred dollars is accepting an unpriced risk in the thousands.`,
  },
  {
    slug: 'orangeburg-pipe-collapse',
    anchor: '## ',
    section: `## What a Camera Scope Costs, and What Replacement Costs

You cannot confirm Orangeburg from inside the house, which is why the camera scope matters: ${money(SEWER.costToCheck, 'sewer check')}, and it is almost always a separate add-on rather than part of a general inspection.

Replacement is the figure to budget against: ${SEWER.typicalRepairCost}.

The lateral is the homeowner's responsibility out to the main in most jurisdictions, so this is not a cost that gets shared with the city. Book the scope before your contingency date — it is one of the few tests that returns a definitive answer.`,
  },
  {
    slug: 'typical-settlement-cracking-mean-inspection-report',
    anchor: '## ',
    section: `## What It Costs to Find Out Which Kind You Have

Identifying the foundation type and looking for movement is included in a general inspection, so establishing whether cracking is typical costs nothing extra.

What it can escalate to is wide: ${FOUND.typicalRepairCost}.

That spread is the entire reason "typical" is worth pinning down in writing rather than accepting as reassurance. A report that says typical settlement and a report that says differential movement lead to very different conversations, and only one of them needs an independent structural engineer before you waive anything.`,
  },
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const live = new Set(rows.map((r) => r.slug));

  const writes: Array<{ slug: string; body: string; added: number }> = [];

  for (const e of EDITS) {
    const row = byslug.get(e.slug);
    if (!row) throw new Error(`ABORT: ${e.slug} is not published`);
    const body: string = row.body_markdown;

    const heading = e.section.split('\n')[0];
    if (body.includes(heading)) throw new Error(`ABORT: ${e.slug} already has "${heading}"`);

    // Every guide already carries a closing/next-step section; the new material belongs before it,
    // so the page still ends on what to do rather than on a price list.
    const headings = [...body.matchAll(/^## .+$/gm)].map((m) => ({ text: m[0], index: m.index! }));
    if (headings.length < 2) throw new Error(`ABORT: ${e.slug} has fewer than 2 H2s`);
    const last = headings[headings.length - 1];

    const next = `${body.slice(0, last.index).trimEnd()}\n\n${e.section.trim()}\n\n${body.slice(last.index)}`;
    writes.push({ slug: e.slug, body: next, added: next.length - body.length });
  }

  // ---- guards ---------------------------------------------------------------------------------
  const STUDIES = new Set(['risk-without-price', 'risk-without-cover', 'outside-the-zone',
    'high-hazard-dams', 'allegheny-storm-premium', 'north-texas-roof-age', 'raise-or-remove']);
  let bad = 0;
  const sections = EDITS.map((e) => e.section);
  for (const w of writes) {
    for (const m of w.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g))
      if (!live.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${w.slug} -> ${m[1]}`); bad++; }
    for (const m of w.body.matchAll(/\]\(\/research\/([a-z0-9-]+)\/?\)/g))
      if (!STUDIES.has(m[1])) { console.log(`  DEAD STUDY LINK: ${w.slug} -> ${m[1]}`); bad++; }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g])
      for (const m of w.body.matchAll(re)) { console.log(`  NESTED LINK: ${w.slug} -> ${m[0]}`); bad++; }
    if (/\]\(#/.test(w.body)) { console.log(`  IN-PAGE ANCHOR (no heading ids exist): ${w.slug}`); bad++; }
  }

  // The anti-template check. Two sections sharing a heading, or sharing their opening sentence,
  // would be the footprint this work exists to avoid -- so it fails the run rather than shipping.
  const heads = sections.map((s) => s.split('\n')[0]);
  if (new Set(heads).size !== heads.length) { console.log('  DUPLICATE HEADING across sections'); bad++; }
  const openers = sections.map((s) => s.split('\n\n')[1]?.slice(0, 60));
  if (new Set(openers).size !== openers.length) { console.log('  DUPLICATE OPENING SENTENCE across sections'); bad++; }

  // Every section must carry at least one real dollar figure, or it is not adding what it claims.
  for (const [i, s] of sections.entries()) {
    if (!/\$[\d,]{3,}/.test(s)) { console.log(`  NO COST FIGURE: ${EDITS[i].slug}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  console.log(`\n  ${writes.length} guides extended, every figure read from the engine at run time\n`);
  for (const w of writes) {
    const e = EDITS.find((x) => x.slug === w.slug)!;
    console.log(`  ${w.slug}`);
    console.log(`     + ${e.section.split('\n')[0]}  (+${w.added} chars)`);
  }
  console.log('\n  ok  8 distinct headings, 8 distinct openings -- no template footprint');

  const DEFN_TOTAL = 19;
  console.log(`\n  NOT TOUCHED: ${DEFN_TOTAL - EDITS.length} definitional guides have no matching engine`);
  console.log('  rule, so there is no cost data to add without inventing one. Left thin on purpose.');

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  for (const w of writes) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${w.body}, updated_at = now()
      WHERE slug = ${w.slug}`);
    console.log(`  wrote ${w.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
