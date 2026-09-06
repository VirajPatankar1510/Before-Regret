// Restores the four removed guides that hold vendor-payable Google positions, and links them in.
//
//   npx tsx scripts/restore-vendor-payable-guides.ts            # dry run
//   APPLY=true npx tsx scripts/restore-vendor-payable-guides.ts
//
// -------------------------------------------------------------------------------------------
// WHY THESE FOUR. A split of the 91 page-one query positions by whether a vendor would pay for
// the reader came out badly: 45% are people looking for a county permit portal (no vendor, and
// they do not click a guide -- all 91 page-one positions earned ZERO clicks in 28 days), 27% is
// junk including 45 impressions of Spanish and Indonesian traffic on one electrical page, and
// only 20% is vendor-payable.
//
// Then the removed set was measured the same way, and it inverts:
//
//     44 published pages   -> 20% of page-one impressions vendor-payable
//     17 removed pages     -> 95% of 248 impressions vendor-payable
//
// 28 of the 40 vendor-payable page-one impressions -- 70% -- are on pages that no longer exist.
// The 2026-09-02 prune cut 155 -> 35 guides on zero-impression data while the domain was still
// unindexed by Google. That was reasonable on the information available, but the information was
// an artifact of not being indexed rather than evidence the pages were weak. This is the third
// time that misread has surfaced, after the fuse-box page and the 25 county guides.
//
//     102i, 16 page-one, best 7.0   va-loan-require-termite-inspection            (pest control)
//      16i,  5 page-one, best 7.0   get-home-insurance-flat-roof                  (insurance)
//       9i,             best 11.0   happens-if-termite-infestation-found-...      (pest control)
//       6i,  6 page-one, best 2.3   hvac-techs-wish-buyers-knew-about-system-age  (HVAC)
//
// Restores, not new publishing, so the standing "do not publish more until existing pages are
// indexed" rule is not in play the way it would be for a new article.
//
// -------------------------------------------------------------------------------------------
// WHAT A NAIVE RESTORE WOULD BREAK. All four have zero inbound and zero outbound internal links,
// so flipping status alone would create four orphans and four dead ends -- undoing the two passes
// that just took both counts to zero. So each gets one inbound and one outbound link, on the same
// rule as every previous pass: the anchor is appended to a sentence that already names the
// subject. One meta is 157 characters and is rewritten to fit at the same time.
//
// KNOB-AND-TUBE IS DELIBERATELY NOT HERE. what-is-knob-and-tube-wiring is the second-largest
// removed page (84 impressions) and the cannibalisation check came back clean -- across 44
// knob/tube queries the removed page takes 44 of them and the live
// knob-tube-wiring-have-be-replaced-before-closing takes exactly one, with ZERO overlap, so
// Google is already separating "what is it" from "must I replace it to close". It is a safe
// restore on the evidence. It is left out of this script only because it was not part of the
// instruction, and it deserves its own decision rather than being swept in.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

const RESTORE = [
  'va-loan-require-termite-inspection',
  'get-home-insurance-flat-roof',
  'happens-if-termite-infestation-found-during-home-inspection',
  'hvac-techs-wish-buyers-knew-about-system-age',
];

// 157 -> 134. The tail was being truncated in results.
const META_FIX: Record<string, string> = {
  'get-home-insurance-flat-roof':
    'You can get home insurance with a flat roof, but underwriters apply strict age limits, material standards, and water damage exclusions.',
};

// [source, target, verbatim tail of an existing sentence, text appended after it]
const LINKS: Array<[string, string, string, string]> = [
  // --- inbound, so none of the four lands as an orphan ---
  [
    'standard-home-inspection-include-termites', 'va-loan-require-termite-inspection',
    'the lender will require a clean WDO report before they will clear the loan for closing [HUD].',
    ' The VA\'s own rule is narrower than buyers expect and depends on where the property sits — [whether a VA loan requires a termite inspection](/guides/va-loan-require-termite-inspection/) sets out the zones and who is allowed to pay the fee.',
  ],
  [
    'standard-home-inspection-include-termites', 'happens-if-termite-infestation-found-during-home-inspection',
    'Buying a home with undetected termite damage can lead to catastrophic structural repairs that are rarely covered by standard homeowners insurance.',
    ' Detected damage is a different situation with its own options — [what happens if an inspection finds termites](/guides/happens-if-termite-infestation-found-during-home-inspection/) covers the effect on the mortgage and what you can still negotiate.',
  ],
  [
    'will-zinsco-panel-fail-4-point-inspection', 'hvac-techs-wish-buyers-knew-about-system-age',
    'the 4-point inspection focuses narrowly on four major structural systems: the roof, plumbing, HVAC, and electrical system [ASHI].',
    ' Of those four, HVAC is the one judged mostly on age rather than condition, and [what HVAC technicians wish buyers knew about system age](/guides/hvac-techs-wish-buyers-knew-about-system-age/) explains what an underwriter is really reading.',
  ],
  [
    'get-home-insurance-aluminum-wiring', 'get-home-insurance-flat-roof',
    'insurers require a formal 4-Point inspection report focusing on four major systems: roofing, plumbing, HVAC, and electrical.',
    ' Roofing carries its own underwriting rules, and the hardest case is not age but shape — [getting home insurance with a flat roof](/guides/get-home-insurance-flat-roof/) runs into age limits and water exclusions that a pitched roof never meets.',
  ],

  // --- outbound, so none of the four lands as a dead end ---
  [
    'va-loan-require-termite-inspection', 'wdo-report-who-supposed-order',
    'the rules regarding wood-destroying insect (WDI) inspections are highly specific.',
    ' The report itself is the same document a conventional buyer orders, and [who is supposed to order a WDO report](/guides/wdo-report-who-supposed-order/) varies by state as much as by loan programme.',
  ],
  [
    'happens-if-termite-infestation-found-during-home-inspection', 'wdo-report-who-supposed-order',
    'buyers commonly order a dedicated Wood-Destroying Organism (WDO) inspection.',
    ' Who pays for it and who is expected to arrange it is not standard across states — [the WDO report and who is supposed to order it](/guides/wdo-report-who-supposed-order/) sets out both.',
  ],
  [
    'hvac-techs-wish-buyers-knew-about-system-age', 'standard-home-inspection-include-termites',
    'A standard home inspection typically includes a functional check of the HVAC system, noting its age and general operational status.',
    ' It is worth being precise about the rest of that scope, because buyers routinely assume more of it than is there — [a standard inspection does not include termites](/guides/standard-home-inspection-include-termites/) at all, for instance.',
  ],
  [
    'get-home-insurance-flat-roof', 'homeowners-insurance-cover-failed-sump-pump',
    'increases the likelihood of long-term structural water damage [FEMA].',
    ' Water that reaches the basement raises a separate coverage question with the same surprising answer — [whether homeowners insurance covers a failed sump pump](/guides/homeowners-insurance-cover-failed-sump-pump/) usually turns on an endorsement the policy does not include by default.',
  ],
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  for (const s of RESTORE) {
    const r = byslug.get(s);
    if (!r) throw new Error(`ABORT: ${s} not found`);
    if (r.status !== 'removed') throw new Error(`ABORT: ${s} is '${r.status}', expected 'removed'`);
  }

  // The link graph after the restore: published today, plus the four coming back.
  const live = new Set([...rows.filter((r) => r.status === 'published').map((r) => r.slug), ...RESTORE]);
  const bodies = new Map<string, string>([...live].map((s) => [s, byslug.get(s)!.body_markdown]));

  for (const [source, target, tail, addition] of LINKS) {
    const b = bodies.get(source);
    if (b === undefined) throw new Error(`ABORT: source ${source} not in the live set`);
    if (!live.has(target)) throw new Error(`ABORT: target ${target} not in the live set`);
    const n = b.split(tail).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${source} -> ${target}: tail matched ${n} times, expected 1`);
    bodies.set(source, b.replace(tail, tail + addition));
    console.log(`  ok  ${source}\n        -> ${target}`);
  }

  // ---- assertions -----------------------------------------------------------------------------
  let bad = 0;
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); bad++; }
      if (m[1] === slug) { console.log(`  SELF LINK: ${slug}`); bad++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these render as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
  }

  for (const [slug] of bodies) {
    const meta = META_FIX[slug] ?? byslug.get(slug)!.meta_description;
    if (!meta || meta.length > 155) { console.log(`  META ${slug}: ${meta?.length ?? 'NULL'}`); bad++; }
    if (byslug.get(slug)!.title.length > 60) { console.log(`  TITLE ${slug}: ${byslug.get(slug)!.title.length}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  const adj = new Map<string, Set<string>>();
  for (const [slug, b] of bodies) {
    adj.set(slug, new Set([...b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]).filter((t) => t !== slug)));
  }
  const inbound = new Map<string, number>();
  for (const [, t] of adj) for (const x of t) inbound.set(x, (inbound.get(x) || 0) + 1);
  const orphans = [...live].filter((s) => !inbound.has(s));
  const deadEnds = [...live].filter((s) => (adj.get(s) || new Set()).size === 0);
  const seen = new Set([HUB]);
  const q = [HUB];
  while (q.length) for (const t of adj.get(q.shift()!) || []) if (!seen.has(t)) { seen.add(t); q.push(t); }

  console.log(`\n  published : 44 -> ${live.size}`);
  console.log(`  orphans   : ${orphans.length}${orphans.length ? ` (${orphans.join(', ')})` : ''}`);
  console.log(`  dead ends : ${deadEnds.length}${deadEnds.length ? ` (${deadEnds.join(', ')})` : ''}`);
  console.log(`  reachable : ${seen.size}/${live.size}`);
  console.log(`  links     : ${[...adj.values()].reduce((a, b) => a + b.size, 0)}`);
  if (orphans.length) throw new Error('ABORT: orphans');
  if (deadEnds.length) throw new Error('ABORT: dead ends');
  if (seen.size !== live.size) throw new Error(`ABORT: only ${seen.size}/${live.size} reachable`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const s of RESTORE) {
    const meta = META_FIX[s];
    if (meta) {
      await withDb((sql) => sql`UPDATE articles SET status='published', meta_description=${meta},
        body_markdown=${bodies.get(s)!}, updated_at=now() WHERE slug=${s} AND status='removed'`);
    } else {
      await withDb((sql) => sql`UPDATE articles SET status='published',
        body_markdown=${bodies.get(s)!}, updated_at=now() WHERE slug=${s} AND status='removed'`);
    }
    console.log(`  restored ${s}`);
  }
  for (const s of new Set(LINKS.map((l) => l[0]).filter((s) => !RESTORE.includes(s)))) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown=${bodies.get(s)!}, updated_at=now() WHERE slug=${s}`);
    console.log(`  linked from ${s}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
