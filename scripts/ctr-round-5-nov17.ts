// CTR round 5 (2026-11-17): titles and/or descriptions on 7 guides that Google shows in positions ~6-10 but that
// earn a CTR below what our own pages get at the same positions. The owner approved: "publish for the pages that you
// recommend to change". Only title + meta_description change. Body, slug, status, H1 handling and quick answer are
// untouched.
//
//   npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-5-nov17.ts            # dry run
//   APPLY=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-5-nov17.ts
//   ROLLBACK=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/ctr-round-5-nov17.ts
//
// Baseline (Google, 90 days to 2026-11-17, page dimension): impressions / clicks / CTR / position
//   #267 100-amp            444 / 4 / 0.90% / 6.1     #53 not inspected storage   268 / 1 / 0.37% / 5.8
//   #71  flat roof ins.     322 / 3 / 0.93% / 7.0     #284 termites found         301 / 3 / 1.00% / 10.4
//   #320 identify pipes     213 / 1 / 0.47% / 9.9     #35  oil tanks (meta only)  248 / 2 / 0.81% / 9.5
//   #39  leased solar (meta only) 161 / 1 / 0.62% / 6.2
// Queries: Google discloses ~5% of them for these pages; Bing GetPageQueryStats filled in (all recorded in the
// 2026-11-17 session). Benchmark: our own pages reach ~2.5% at positions 5-7 (splice Romex 2.81% at 5.4, fuse box
// 2.41% at 5.8) and ~1.6% at 8-11.
//
// READ 2026-12-15: CTR and position per page, 28 days after the change vs the same-length window before it.
// Stop condition: a page whose CTR has not improved AND whose position fell by more than 2 goes back to its old
// wording (ROLLBACK=true restores all; trim EDITS to pick).
//
// Held back on purpose: /sunlight/ (title lives in scripts/prerender-sunlight.tsx; proposed "Which Direction Gets the
// Most Sun? Check Any Room by County") until the 2026-12-07 read of the south-facing guide, which targets the same
// searches; the 7 round-4 pages (read 2026-12-07); all 21 county permit guides (split test reads 2026-11-25).
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ROLLBACK = process.env.ROLLBACK === 'true';

type Edit = { id: number; slug: string; oldTitle: string; oldMeta: string; title: string; meta: string; requires: string[] };

const EDITS: Edit[] = [
  {
    id: 267, slug: '100-amp-service-enough-house-re-buying',
    oldTitle: "Is 100-Amp Service Enough for a House You're Buying?",
    oldMeta: 'Buying a home with 100-amp electrical service? Learn how to assess the current load, estimate upgrade complexities, and negotiate before closing.',
    title: 'Is 100-Amp Service Enough for a House? What to Check',
    meta: 'Often yes for a smaller home that uses gas for heat, hot water and cooking. An EV charger, heat pump or all-electric home may need 200 amps.',
    requires: ['Gas-Dependent Home', 'Electric Vehicle (EV) Charging', 'Heat Pumps', '200-amp', 'Locate and Read the Main Breaker'],
  },
  {
    id: 53, slug: 'not-inspected-due-storage-mean-inspection-report',
    oldTitle: 'What Does "Not Inspected Due to Storage" Mean?',
    oldMeta: 'Discover what "not inspected due to storage" means on a home inspection report, the hidden risks involved, and how to address blocked areas before closing.',
    // Kept a question mark so the existing quick answer stays on a question title (owner rule 2026-10-09).
    title: 'Not Inspected Due to Storage? What It Means and What to Do',
    meta: "The inspector couldn't reach a panel, furnace, wall or attic behind the seller's things. What that leaves unchecked and how to get it re-inspected.",
    requires: ['Main Electrical Panels', 'HVAC Equipment', 'Attic Access', 'Perimeter Walls', 'Re-Inspection'],
  },
  {
    id: 71, slug: 'get-home-insurance-flat-roof',
    oldTitle: 'Flat Roof Home Insurance: What Underwriters Require',
    oldMeta: 'Flat roof home insurance is available but conditional: strict roof age limits, material standards, and water damage exclusions. What carriers ask for.',
    title: 'Can You Get Home Insurance With a Flat Roof? What to Check',
    meta: 'Generally yes, but roof age, material and drainage matter. How insurers may view BUR, modified bitumen, TPO and EPDM, and what to check before you buy.',
    requires: ['Built-Up Roofs (BUR)', 'Modified Bitumen', 'TPO, PVC, EPDM', 'Roof Age Limits', 'Drainage'],
  },
  {
    id: 284, slug: 'happens-if-termite-infestation-found-during-home-inspection',
    oldTitle: 'What Happens If a Home Inspection Finds Termites?',
    oldMeta: 'The sale usually pauses for licensed treatment and a clear wood-destroying organism report, which lenders often require. Who pays is then negotiated.',
    title: 'Termites Found During a Home Inspection? What to Do Next',
    meta: 'The sale usually pauses for treatment and a clear WDO report, which lenders often require. Active vs. inactive termites, who pays, and your next steps.',
    requires: ['Active vs. Inactive', 'Who Pays', 'Your Next Steps', 'WDO'],
  },
  {
    id: 320, slug: 'identify-water-pipes-pex-copper-galvanized',
    oldTitle: "PEX, Copper or Galvanized? How to Tell a House's Water Pipes",
    oldMeta: 'Tell PEX, CPVC, copper, galvanized, polybutylene and lead supply pipes apart on a viewing, with a magnet and a coin, and know which mean a repipe.',
    title: 'How to Tell If You Have PEX, Copper or Galvanized Pipes',
    meta: 'Check above the water heater and under the sinks with a magnet and a coin. How to tell PEX, CPVC, copper, galvanized, polybutylene and lead apart.',
    requires: ['magnet', 'coin', 'Above the water heater', 'Under the kitchen and bathroom sinks', 'CPVC', 'Polybutylene', 'Lead inside the house'],
  },
  {
    id: 35, slug: 'home-inspection-check-underground-oil-tanks',
    oldTitle: 'Does a Home Inspection Check for Underground Oil Tanks?',
    oldMeta: 'Standard home inspections do not test for buried heating oil tanks. Learn how to spot red flags and why an oil tank sweep is essential before closing.',
    title: 'Does a Home Inspection Check for Underground Oil Tanks?',
    meta: "No. A standard home inspection doesn't test for a buried heating oil tank. The signs to look for before you buy, and how a tank sweep confirms one.",
    requires: ['Red Flags', 'Oil Tank Sweep'],
  },
  {
    id: 39, slug: 'home-solar-panels-don-t-own-affect-getting-insurance',
    oldTitle: 'Do Leased Solar Panels Affect Getting Home Insurance?',
    oldMeta: 'Solar panels you do not own can complicate a home insurance application: what carriers ask, who insures the array, and what to check before closing.',
    title: 'Do Leased Solar Panels Affect Getting Home Insurance?',
    meta: 'Rarely a denial, but leased panels belong to the solar company. Who insures them, detach-and-reset costs for a roof job, and what to check before closing.',
    requires: ['Detach and Reset', 'Due Diligence'],
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
    if (!already && (row.title !== expected.title || row.meta_description !== expected.meta)) problems.push(`#${e.id}: stored title/meta changed since this script was written\n    stored title: ${row.title}\n    stored meta:  ${row.meta_description}`);
    if (target.title.length > 60) problems.push(`#${e.id}: title ${target.title.length} > 60`);
    if (target.meta.length < 70 || target.meta.length > 155) problems.push(`#${e.id}: meta ${target.meta.length} outside 70-155`);
    if (/[—’‘“”]/.test(e.meta) || (e.title !== e.oldTitle && /[—’‘“”]/.test(e.title))) problems.push(`#${e.id}: em dash or curly quote in new text`);
    if (isQuestion(target.title) && !row.quick_answer) problems.push(`#${e.id}: question title needs a quick answer`);
    if (!isQuestion(target.title) && row.quick_answer) problems.push(`#${e.id}: quick answer on a non-question title`);
    if (!ROLLBACK) for (const r of e.requires) if (!row.body_markdown.toLowerCase().includes(r.toLowerCase())) problems.push(`#${e.id}: body lacks "${r}"`);
    console.log(`#${e.id} ${e.slug}${already ? '  (already applied)' : ''}\n  title: ${row.title}\n     -> ${target.title} (${target.title.length})\n  meta:  ${row.meta_description}\n     -> ${target.meta} (${target.meta.length})\n`);
  }
  if (problems.length) { console.error('REFUSING:\n  ' + problems.join('\n  ')); process.exit(1); }
  if (!APPLY && !ROLLBACK) { console.log('Dry run: nothing written. APPLY=true to write.'); return; }
  for (const e of EDITS) {
    const t = ROLLBACK ? e.oldTitle : e.title, m = ROLLBACK ? e.oldMeta : e.meta;
    const ft = ROLLBACK ? e.title : e.oldTitle, fm = ROLLBACK ? e.meta : e.oldMeta;
    const res = await withDb((sql) => sql`UPDATE articles SET title = ${t}, meta_description = ${m}, updated_at = now()
      WHERE id = ${e.id} AND slug = ${e.slug} AND ((title = ${ft} AND meta_description = ${fm}) OR (title = ${t} AND meta_description = ${m})) RETURNING id`) as any[];
    console.log(res.length === 1 ? `  wrote #${e.id}` : `  #${e.id} NOT written (stored text changed)`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
