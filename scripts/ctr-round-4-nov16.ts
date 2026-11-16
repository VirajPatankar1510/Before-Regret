// CTR round 4 (2026-11-16): titles and descriptions on 7 guides that rank in Google's top ~10 but
// get under 1.5% of viewers to click. Wording chosen with the owner; only title + meta_description
// change. Body, slug, status and quick answer are untouched.
//
//   npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-4-nov16.ts            # dry run
//   APPLY=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-4-nov16.ts
//   ROLLBACK=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-4-nov16.ts
//
// Baseline (Google, 28 days to 2026-11-16, page dimension):
//   open ground 1,157 impr / 2 clicks / pos 9.6     radon 528 / 5 / 5.8
//   seller back out 488 / 6 / 5.3                   south-facing 249 / 1 / 6.8
//   reverse polarity 192 / 0 / 7.3                  septic 187 / 1 / 5.9
//   GFCI 176 / 0 / 5.6
// Benchmark: our own best pages get ~3% (splice Romex 3.3% at 4.8; fuse box 3.1% at 6.6).
//
// READ 2026-12-07: CTR per page for the 28 days after the change vs the baseline above, plus position
// (a title change can move it). Stop condition: a page whose CTR has not improved AND whose position
// fell by more than 2 goes back to its old wording (ROLLBACK=true restores all; edit OLD to pick).
//
// Held back on purpose: the county permit guides (split test reads 2026-11-25) and the knob-and-tube
// mortgage guide (its own read 2026-11-21).
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ROLLBACK = process.env.ROLLBACK === 'true';

type Edit = { id: number; slug: string; oldTitle: string; oldMeta: string; title: string; meta: string; requires: string[] };

const EDITS: Edit[] = [
  {
    id: 235, slug: 'open-ground-mean-electrical-inspection',
    oldTitle: 'What Does “Open Ground” Mean on a Home Inspection?',
    oldMeta: 'An open ground means a three-prong outlet has no grounding path: a shock risk that also leaves surge protectors doing nothing. Who can fix it, and how.',
    title: 'What Does Open Ground Mean on an Outlet Tester?',
    meta: 'An open-ground reading means the tester detects no effective grounding path at the outlet. What the lights indicate, why it matters and the repair options.',
    requires: ['Tester', 'How to Fix an Open Ground Outlet'],
  },
  {
    id: 25, slug: 'negotiate-radon-mitigation-after-inspection',
    oldTitle: 'Can You Negotiate Radon Mitigation After Inspection?',
    oldMeta: 'High radon found during inspection? How radon contingencies work, who pays for mitigation, and how to negotiate a repair or credit before closing.',
    title: 'Who Pays for Radon Mitigation When Buying a House?',
    meta: "High radon doesn't automatically mean the seller pays. Compare a seller-installed system, closing credit or escrow holdback, and how to negotiate it.",
    requires: ['Seller-Installed Mitigation System', 'Financial Credit', 'Escrow Holdback'],
  },
  {
    id: 180, slug: 'seller-back-out-after-accepting-inspection-response',
    oldTitle: 'Can a Seller Back Out After Your Inspection Response?',
    oldMeta: 'Learn when a seller can legally back out of a home sale after agreeing to inspection repairs, and how to protect your earnest money and transaction.',
    title: 'Can a Seller Back Out After Agreeing to Repairs?',
    meta: 'A signed repair amendment generally becomes part of the contract, but terms and state law matter. When can a seller still withdraw, and what can buyers do?',
    // The body's words: "commonly becomes a legally binding amendment to the original purchase contract".
    requires: ['binding amendment to the original purchase contract', 'How a Seller Can Still Terminate', 'Next Steps for Home Buyers'],
  },
  {
    id: 314, slug: 'south-facing-house-sun-by-direction',
    oldTitle: 'South-Facing House: Is It Better? Sun Hours by Direction',
    oldMeta: 'A south window in Chicago gets 9.1 hours of direct sun on the shortest day; a north one gets none. Every side, winter and summer.',
    title: 'Is a South-Facing House Better? Sunlight by Window Direction',
    meta: "A south-facing front door doesn't tell you which rooms get sun. Compare direct-sun hours by window direction in winter and summer before you buy.",
    requires: ['How much direct sun each side gets'],
  },
  {
    id: 55, slug: 'reverse-polarity-mean-electrical-inspection',
    oldTitle: 'What Does "Reverse Polarity" Mean? Is It Dangerous?',
    oldMeta: 'What reverse polarity means on an electrical inspection report, why swapped hot and neutral wires pose a shock risk, and how to resolve it before closing.',
    // Title NOT changed: the owner's "What Does Reverse Polarity Mean on an Outlet Tester?" failed the
    // definition-echo rule in assert-article-quality.ts (rule 5); the old title passes because of
    // "Is It Dangerous?". Description changed only. A new title awaits the owner's choice.
    title: 'What Does "Reverse Polarity" Mean? Is It Dangerous?',
    meta: 'Reverse polarity swaps hot and neutral. A device may still work, but parts can remain energized when switched off. What testers detect and how to fix it.',
    requires: ['How Home Inspectors Test for Reverse Polarity', 'Isolated Fix'],
  },
  {
    id: 197, slug: 'home-inspection-include-septic-system',
    oldTitle: 'Does a Home Inspection Include the Septic System?',
    oldMeta: 'A standard home inspection rarely covers the septic system. Learn why relying on a general inspector can lead to costly underground repairs after closing.',
    title: 'Does a Home Inspection Check the Septic Tank?',
    meta: "Usually not. A general inspection typically doesn't evaluate the septic tank or drain field. What a septic inspection checks, and when to add one.",
    requires: ['The Septic Tank', 'Absorption Field', 'Structuring Your Contract'],
  },
  {
    id: 266, slug: 'need-gfci-outlets-pass-home-inspection',
    oldTitle: 'Do You Need GFCI Outlets to Pass a Home Inspection?',
    oldMeta: 'Do missing GFCI outlets mean a failed home inspection? Learn how inspectors evaluate electrical safety, how it affects your insurance, and the cost to fix.',
    title: 'Do Garage and Basement Outlets Need GFCI to Pass Inspection?',
    meta: "Inspections aren't pass or fail. Learn where GFCI protection is required in garages and basements, what inspectors flag, and how older-home rules differ.",
    requires: ['Pass/Fail', 'Where GFCI Protection Is Required Today', 'garage', 'basement', 'Older Homes'],
  },
];

const isQuestion = (t: string) => /\?/.test(t) || /^(can|could|does|do|did|is|are|was|should|will|would|what|when|where|which|who|why|how)\b/i.test(t.trim());

async function main() {
  const problems: string[] = [];
  for (const e of EDITS) {
    const [row] = await withDb((sql) => sql`SELECT id, slug, status, title, meta_description, quick_answer, body_markdown FROM articles WHERE id = ${e.id}`) as any[];
    if (!row || row.slug !== e.slug || row.status !== 'published') { problems.push(`#${e.id}: not the published row expected`); continue; }
    const target = ROLLBACK ? { title: e.oldTitle, meta: e.oldMeta } : { title: e.title, meta: e.meta };
    const expected = ROLLBACK ? { title: e.title, meta: e.meta } : { title: e.oldTitle, meta: e.oldMeta };
    const already = row.title === target.title && row.meta_description === target.meta;
    if (!already && (row.title !== expected.title || row.meta_description !== expected.meta)) problems.push(`#${e.id}: stored title/meta changed since this script was written`);
    if (target.title.length > 60) problems.push(`#${e.id}: title ${target.title.length} > 60`);
    if (target.meta.length < 70 || target.meta.length > 155) problems.push(`#${e.id}: meta ${target.meta.length} outside 70-155`);
    if (/[—’‘“”]/.test(e.meta) || (e.title !== e.oldTitle && /[—’‘“”]/.test(e.title))) problems.push(`#${e.id}: em dash or curly quote in new text`);
    if (isQuestion(target.title) && !row.quick_answer) problems.push(`#${e.id}: question title needs a quick answer`);
    if (!ROLLBACK) for (const r of e.requires) if (!row.body_markdown.toLowerCase().includes(r.toLowerCase())) problems.push(`#${e.id}: body lacks "${r}"`);
    console.log(`#${e.id} ${e.slug}${already ? '  (already applied)' : ''}\n  title: ${row.title}\n     -> ${target.title} (${target.title.length})\n  meta:  ${row.meta_description}\n     -> ${target.meta} (${target.meta.length})\n`);
  }
  if (problems.length) { console.error('REFUSING:\n  ' + problems.join('\n  ')); process.exit(1); }
  if (!APPLY && !ROLLBACK) { console.log('Dry run: nothing written. APPLY=true to write.'); return; }
  for (const e of EDITS) {
    const t = ROLLBACK ? e.oldTitle : e.title, m = ROLLBACK ? e.oldMeta : e.meta;
    const ft = ROLLBACK ? e.title : e.oldTitle, fm = ROLLBACK ? e.meta : e.oldMeta;
    await withDb((sql) => sql`UPDATE articles SET title = ${t}, meta_description = ${m}, updated_at = now()
      WHERE id = ${e.id} AND slug = ${e.slug} AND ((title = ${ft} AND meta_description = ${fm}) OR (title = ${t} AND meta_description = ${m}))`);
    console.log(`  wrote #${e.id}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
