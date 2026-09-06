// Links every orphaned guide, and fixes eight over-long meta descriptions.
//
//   npx tsx scripts/fix-orphans-and-metas.ts            # dry run
//   APPLY=true npx tsx scripts/fix-orphans-and-metas.ts
//
// -------------------------------------------------------------------------------------------
// THE ORPHANS. 14 of 44 published guides had no inbound internal link from anywhere. They are
// almost all the inspection-report cluster -- "what does X mean on a report", plus the
// insurability pages -- while the permits cluster is densely interlinked. That split is the whole
// problem: permits pages got the linking work in three previous passes and these never did.
//
// The standing rule has been to link a page only where existing prose earns it, rather than
// bolting a sentence onto a host page to justify a link. That rule is why these stayed orphaned
// through three passes, and it is kept here: every anchor below is appended to a sentence that
// ALREADY discusses the destination's subject. Each was found by searching the corpus for the
// orphan's own topic terms and then read individually -- which matters, because the search threw
// up false positives that are deliberately NOT used:
//
//     "deal-breaker" matched a breaker search        (legalize-unpermitted-deck)
//     "storage costs" / "underground storage tank"   matched a stored-belongings search
//     "settling them" (claims)                       matched a settlement-cracking search
//     "National Association of..."                   matched a homeowners-association search
//     Miami-Dade's municipal "special assessment"    is a municipal lien, not an HOA assessment
//
// That last one is worth stating: linking a page about HOA litigation from a bullet about
// municipal road-improvement liens would be wrong, not merely weak. The HOA guide is genuinely
// isolated -- no other guide mentions associations at all -- so it is linked instead from the one
// honest connection that exists: a sentence about a mortgage stalling for a reason that has
// nothing to do with the condition of the house.
//
// Reciprocal pairs (termites <-> WDO) are deliberate. Those two pages each tell the reader to go
// read the other's subject, in their own existing words, and the link was simply missing.
//
// -------------------------------------------------------------------------------------------
// THE METAS. Eight descriptions exceeded 155 characters, so Google was truncating the tail in
// results. One was 217 and one 170. Rewritten to fit, keeping each page's own claim -- no page
// gets a new promise it does not deliver.
//
// NOT FIXED, and deliberately: the anchor "unpermitted work" points at
// find-unpermitted-work-before-buying from four different pages. The content standard's threshold
// is seven ("Seven identical anchors into one page is a footprint"), each page uses it once, and
// it is the natural phrase in all four sentences. Rewriting them to hit a number would make the
// prose worse for no measured gain. Flagged rather than changed.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

// [source page, orphan being linked, tail of the existing sentence, sentence appended after it]
// The tail is matched verbatim and must appear exactly once. Short distinctive tails are used
// rather than whole sentences because several of these sentences contain typographic quotes and
// em-dashes that are easy to get wrong by hand.
const LINKS: Array<[string, string, string, string]> = [
  [
    'find-unpermitted-work-before-buying', 'home-inspection-check-underground-oil-tanks',
    'An inspector evaluates the physical condition of what is in front of them.',
    ' What is buried in the yard is not in front of them, which is why [an underground oil tank goes unfound](/guides/home-inspection-check-underground-oil-tanks/) unless somebody looks for it specifically.',
  ],
  [
    'find-unpermitted-work-before-buying', 'amateur-workmanship-mean-home-inspection-report',
    'but their report will not definitively state whether a permit was pulled.',
    ' That phrasing is a signal rather than a finding, and [what an inspector means by amateur workmanship](/guides/amateur-workmanship-mean-home-inspection-report/) is worth reading before you decide how hard to push.',
  ],
  [
    'home-inspection-check-underground-oil-tanks', 'not-inspected-due-storage-mean-inspection-report',
    'limit their evaluations to visible and readily accessible systems [ASHI].',
    ' The same limit produces the report language buyers most often misread — [an area marked not inspected due to storage](/guides/not-inspected-due-storage-mean-inspection-report/) has not been cleared, it has been skipped.',
  ],
  [
    'home-inspection-check-underground-oil-tanks', 'buy-house-active-hoa-lawsuit',
    'Without valid property insurance, mortgage lenders will not fund a loan at closing.',
    ' A mortgage can stall for reasons that have nothing to do with the condition of the house: [an HOA in active litigation](/guides/buy-house-active-hoa-lawsuit/) can make a development non-warrantable no matter how sound the individual property is.',
  ],
  [
    'standard-home-inspection-include-termites', 'negotiate-radon-mitigation-after-inspection',
    'However, general home inspectors operate under a specific, limited scope of practice.',
    ' Radon sits outside that scope for the same reason: it is tested separately, and [an elevated result becomes its own negotiation](/guides/negotiate-radon-mitigation-after-inspection/) with its own deadlines.',
  ],
  [
    'standard-home-inspection-include-termites', 'wdo-report-who-supposed-order',
    'you must order a dedicated Wood-Destroying Organism (WDO) inspection.',
    ' Who is expected to pay for it, and who actually orders it, varies by state and by contract — [the WDO report and who is supposed to order it](/guides/wdo-report-who-supposed-order/) covers both.',
  ],
  [
    'wdo-report-who-supposed-order', 'standard-home-inspection-include-termites',
    'the scope of a WDO inspection is significantly broader than just termites.',
    ' The reverse misconception is commoner still: [a standard home inspection does not include termites](/guides/standard-home-inspection-include-termites/) at all.',
  ],
  [
    'get-clue-report-before-buying-house', 'get-insurance-house-trampoline-unfenced-pool',
    'is a costly nightmare for home buyers.',
    ' Past claims are only one way a house becomes hard to insure. Features in the yard are another — [a trampoline or an unfenced pool](/guides/get-insurance-house-trampoline-unfenced-pool/) can cost you the policy outright.',
  ],
  [
    'typical-settlement-cracking-mean-inspection-report', 'standard-home-inspection-check-eifs-stucco-moisture',
    'and not extending through the main structural components of the foundation or framing.',
    ' Cracking in stucco is the exception worth treating differently, because it can admit water into the wall assembly behind it — [EIFS and stucco moisture inspection](/guides/standard-home-inspection-check-eifs-stucco-moisture/) explains what that involves.',
  ],
  [
    'amateur-workmanship-mean-home-inspection-report', 'double-tapped-breaker-did-inspector-flag',
    'which can cause conductors to overheat before the breaker trips.',
    ' The related defect at the panel itself is [a double-tapped breaker](/guides/double-tapped-breaker-did-inspector-flag/), which is among the commonest things an inspector flags in a panel worked on by an amateur.',
  ],
  [
    'federal-pacific-stab-lok-panel-inspectors-flag', 'get-home-insurance-aluminum-wiring',
    'Many insurance carriers will refuse to write a new homeowners policy for a property with an active Stab-Lok panel.',
    ' A panel is not the only electrical feature that does this. [Aluminum branch wiring](/guides/get-home-insurance-aluminum-wiring/), common in houses of much the same era, produces the same conversation with an underwriter.',
  ],
  [
    'double-tapped-breaker-did-inspector-flag', 'seller-back-out-after-accepting-inspection-response',
    'You can request that the seller hire a licensed electrician to correct the issue.',
    ' Before you do, it is worth knowing [whether a seller can back out after accepting your inspection response](/guides/seller-back-out-after-accepting-inspection-response/), because a repair request is a contract move and not only a repair.',
  ],
  [
    'seller-back-out-after-accepting-inspection-response', 'typical-settlement-cracking-mean-inspection-report',
    'the contract may allow for a renegotiation of terms.',
    ' Foundation language is where this happens most, and the distinction is worth learning first: [what typical settlement cracking actually means](/guides/typical-settlement-cracking-mean-inspection-report/) separates the routine finding from the one that reopens a contract.',
  ],
  [
    'not-inspected-due-storage-mean-inspection-report', 'evidence-prior-repair-mean-home-inspection-report',
    'or improperly patched drywall that covers structural movement.',
    ' When a patch is visible rather than hidden, the report says so in its own phrase — [evidence of prior repair](/guides/evidence-prior-repair-mean-home-inspection-report/) — which raises a different question: what was repaired, and did it hold.',
  ],
];

// Rewritten to <=155 characters, keeping each page's own claim.
const METAS: Record<string, string> = {
  'check-building-permits-maricopa-county-az':
    'Check permit records in Maricopa County and Phoenix-area cities to uncover unpermitted additions, open permits, and structural risks before closing.',
  'reverse-polarity-mean-electrical-inspection':
    'What reverse polarity means on an electrical inspection report, why swapped hot and neutral wires pose a shock risk, and how to resolve it before closing.',
  'negotiate-radon-mitigation-after-inspection':
    'High radon found during inspection? How radon contingencies work, who pays for mitigation, and how to negotiate a repair or credit before closing.',
  'amateur-workmanship-mean-home-inspection-report':
    'What inspectors mean by "amateur workmanship", the DIY defects it points to in electrical, plumbing and structural work, and how to proceed before closing.',
  'why-cast-iron-pipes-corrode':
    'Cast iron drain lines corrode from the inside, attacked by acid the sewage itself creates. How to identify them, and what to check before buying.',
  'standard-home-inspection-include-termites':
    'Relying on a standard home inspection to catch termites is a risky mistake. What general inspectors cover, and why you need a separate WDO report.',
  'typical-settlement-cracking-mean-inspection-report':
    '"Typical settlement cracking" usually means minor, expected movement. How to tell it from signs of real foundation trouble, and what to do next.',
  'check-building-permits-cook-county-il':
    'How to check building permits in Cook County IL, navigate Chicago and suburban jurisdictions, and spot unpermitted structural work before closing.',
};

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, meta_description, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const bodies = new Map<string, string>(rows.map((r) => [r.slug, r.body_markdown]));
  const live = new Set(bodies.keys());

  // ---- links ----------------------------------------------------------------------------------
  for (const [source, orphan, tail, addition] of LINKS) {
    const b = bodies.get(source);
    if (b === undefined) throw new Error(`ABORT: source ${source} not published`);
    if (!live.has(orphan)) throw new Error(`ABORT: target ${orphan} not published`);
    const n = b.split(tail).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${source} -> ${orphan}: tail matched ${n} times, expected 1`);
    bodies.set(source, b.replace(tail, tail + addition));
    console.log(`  ok  ${source}\n        -> ${orphan}`);
  }

  // ---- metas ----------------------------------------------------------------------------------
  for (const [slug, meta] of Object.entries(METAS)) {
    const row = rows.find((r) => r.slug === slug);
    if (!row) throw new Error(`ABORT: ${slug} not published`);
    if (row.meta_description.length <= 155) throw new Error(`ABORT: ${slug} meta already ${row.meta_description.length}`);
    if (meta.length > 155) throw new Error(`ABORT: new meta for ${slug} is ${meta.length} chars`);
    if (meta.length < 70) throw new Error(`ABORT: new meta for ${slug} is only ${meta.length} chars`);
    console.log(`  ok  meta ${slug}: ${row.meta_description.length} -> ${meta.length}`);
  }

  // ---- assertions -----------------------------------------------------------------------------
  let dead = 0;
  let nested = 0;
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); dead++; }
      if (m[1] === slug) { console.log(`  SELF LINK: ${slug}`); dead++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these render as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (dead || nested) throw new Error(`ABORT: ${dead} dead/self link(s), ${nested} nested link/bold`);

  // Recompute the graph. Zero orphans is the point of the pass, so it is asserted, not reported.
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const [slug, b] of bodies) {
    const seen = new Set<string>();
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) if (m[1] !== slug) seen.add(m[1]);
    outbound.set(slug, seen.size);
    for (const t of seen) inbound.set(t, (inbound.get(t) || 0) + 1);
  }
  const orphans = [...live].filter((s) => !inbound.has(s));
  const deadEnds = [...live].filter((s) => (outbound.get(s) || 0) === 0);
  if (orphans.length) throw new Error(`ABORT: ${orphans.length} orphan(s) remain: ${orphans.join(', ')}`);

  // Anchor diversity across the whole library.
  const pairs = new Map<string, number>();
  for (const [, b] of bodies) {
    for (const m of b.matchAll(/\[([^\]]+)\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      const k = `${m[1].toLowerCase()} -> ${m[2]}`;
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
  }
  const worst = [...pairs.entries()].filter(([, v]) => v > 4);
  if (worst.length) throw new Error(`ABORT: anchor repeats >4x: ${worst.map(([k, v]) => `${v}x ${k}`).join('; ')}`);

  console.log(`\n  orphans   : 14 -> ${orphans.length}`);
  console.log(`  dead ends : 15 -> ${deadEnds.length}${deadEnds.length ? ` (${deadEnds.join(', ')})` : ''}`);
  console.log(`  metas >155: 8 -> 0`);
  console.log(`  pages touched: ${new Set([...LINKS.map((l) => l[0]), ...Object.keys(METAS)]).size}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  const touched = new Set([...LINKS.map((l) => l[0]), ...Object.keys(METAS)]);
  for (const slug of touched) {
    const meta = METAS[slug];
    if (meta) {
      await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!},
        meta_description = ${meta}, updated_at = now() WHERE slug = ${slug}`);
    } else {
      await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!},
        updated_at = now() WHERE slug = ${slug}`);
    }
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
