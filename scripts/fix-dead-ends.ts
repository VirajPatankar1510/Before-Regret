// Gives the last six dead-end guides outbound links.
//
//   npx tsx scripts/fix-dead-ends.ts            # dry run
//   APPLY=true npx tsx scripts/fix-dead-ends.ts
//
// -------------------------------------------------------------------------------------------
// A dead end is a published guide with no outbound internal links. Six remained after the orphan
// and island passes:
//
//     how-common-are-title-insurance-claims        us-housing-age-ranking-oldest-vs-newest-counties
//     get-insurance-house-trampoline-unfenced-pool  tpr-valve-inspectors-always-check
//     evidence-prior-repair-mean-home-inspection-report  negotiate-radon-mitigation-after-inspection
//
// A dead end is a milder defect than an orphan -- it still receives equity and still ranks, it
// just does not pass anything on, and it gives a reader who finished it nowhere to go. Worth
// fixing, but never worth inventing a sentence for, which is why these were left in the previous
// pass rather than forced.
//
// Same rule as every pass before: the anchor is appended to a sentence that ALREADY names the
// destination's subject. Two of the six needed their bodies read in full before an honest anchor
// appeared, and one candidate was rejected outright:
//
//   REJECTED -- how-common-are-title-insurance-claims contains "the money goes into preventing
//   claims rather than settling them", which a keyword search offers up as a link to the
//   settlement-cracking guide. "Settling" there means settling a claim, not soil movement. This
//   is the same false positive rejected in the orphan pass and it is rejected again. The honest
//   anchor on that page is its own point that a title search cannot surface everything -- which
//   is exactly where unrecorded municipal violations belong, and the violations guide already
//   says administrative fines not yet filed against land records appear in neither the
//   enforcement portal nor the title search. The two pages document the same gap from opposite
//   sides.
//
//   us-housing-age-ranking says outright that homes built before roughly 1950 "commonly feature
//   electrical systems that predate modern standards, such as knob-and-tube wiring" -- and there
//   is a dedicated knob-and-tube guide. That is a term-for-term match, not an approximation.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

// [dead-end page, target, verbatim tail of an existing sentence, text appended after it]
const LINKS: Array<[string, string, string, string]> = [
  [
    'how-common-are-title-insurance-claims', 'check-code-violations-property-online',
    'Unrecorded easements and boundary encroachments are a common source of disputes that no document search will surface.',
    ' Municipal enforcement sits in the same blind spot: a fine that has not yet been filed against the land records will not appear in a title search either, which is why [checking a property\'s code violations directly](/guides/check-code-violations-property-online/) is a separate errand from the one your title company runs.',
  ],
  [
    'us-housing-age-ranking-oldest-vs-newest-counties', 'knob-tube-wiring-have-be-replaced-before-closing',
    'For instance, homes built before roughly 1950 commonly feature electrical systems that predate modern standards, such as knob-and-tube wiring.',
    ' Whether that has to be dealt with before you can close is a narrower question than it sounds — [knob-and-tube wiring and what lenders and insurers actually require](/guides/knob-tube-wiring-have-be-replaced-before-closing/) covers it.',
  ],
  [
    'us-housing-age-ranking-oldest-vs-newest-counties', 'why-cast-iron-pipes-corrode',
    'Older homes often possess unique architectural character, but they may also come with specific considerations for inspection, maintenance, and insurance.',
    ' Drainage is the one buyers underestimate most in this age bracket, because [cast iron drain lines corrode from the inside](/guides/why-cast-iron-pipes-corrode/) and give very little warning from the outside.',
  ],
  [
    'get-insurance-house-trampoline-unfenced-pool', 'legalize-unpermitted-deck',
    'requiring a full perimeter fence and self-latching gate around the deck access points.',
    ' A deck built for pool access is also among the likeliest structures on a property to have been built without a permit, and [legalising an unpermitted deck](/guides/legalize-unpermitted-deck/) is worth understanding before you inherit both problems at once.',
  ],
  [
    'tpr-valve-inspectors-always-check', 'amateur-workmanship-mean-home-inspection-report',
    'helps home buyers distinguish between minor hardware fixes and dangerous DIY plumbing alterations.',
    ' A discharge pipe routed the wrong way is rarely the only sign of an amateur hand, so it is worth knowing [what an inspector means by amateur workmanship](/guides/amateur-workmanship-mean-home-inspection-report/) and what else it predicts.',
  ],
  [
    'evidence-prior-repair-mean-home-inspection-report', 'find-unpermitted-work-before-buying',
    'or unsafe electrical modifications that cost tens of thousands of dollars to rectify after closing.',
    ' A repair large enough to leave evidence is also large enough to have needed a permit, which makes this the point to check whether one was ever pulled — [finding unpermitted work before buying](/guides/find-unpermitted-work-before-buying/) sets out how.',
  ],
  [
    'evidence-prior-repair-mean-home-inspection-report', 'why-cast-iron-pipes-corrode',
    'shows where a section of pipe was cut out and replaced.',
    ' A spot repair on a drain line usually means the rest of the run is the same age and material as the piece that failed, and [cast iron corrodes from the inside out](/guides/why-cast-iron-pipes-corrode/) along its whole length rather than at one unlucky point.',
  ],
  [
    'negotiate-radon-mitigation-after-inspection', 'seller-back-out-after-accepting-inspection-response',
    'if you miss critical contract deadlines or fail to structure your repair request properly.',
    ' It runs the other way too, and it is worth knowing the limits before you ask: [whether a seller can back out after accepting your inspection response](/guides/seller-back-out-after-accepting-inspection-response/) depends on what the response actually changed.',
  ],
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const bodies = new Map<string, string>(rows.map((r) => [r.slug, r.body_markdown]));
  const live = new Set(bodies.keys());

  const graph = (map: Map<string, string>) => {
    const adj = new Map<string, Set<string>>();
    for (const [slug, b] of map) {
      adj.set(slug, new Set([...b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]).filter((t) => live.has(t) && t !== slug)));
    }
    const inbound = new Map<string, number>();
    for (const [, t] of adj) for (const x of t) inbound.set(x, (inbound.get(x) || 0) + 1);
    const seen = new Set([HUB]);
    const q = [HUB];
    while (q.length) for (const t of adj.get(q.shift()!) || []) if (!seen.has(t)) { seen.add(t); q.push(t); }
    return {
      orphans: [...live].filter((s) => !inbound.has(s)),
      deadEnds: [...live].filter((s) => (adj.get(s) || new Set()).size === 0),
      reachable: seen.size,
      total: [...adj.values()].reduce((a, b) => a + b.size, 0),
    };
  };

  const before = graph(bodies);
  console.log(`  before: ${before.deadEnds.length} dead ends, ${before.orphans.length} orphans, ${before.reachable}/${live.size} reachable, ${before.total} links`);

  for (const [source, target, tail, addition] of LINKS) {
    const b = bodies.get(source);
    if (b === undefined) throw new Error(`ABORT: ${source} not published`);
    if (!live.has(target)) throw new Error(`ABORT: target ${target} not published`);
    if (source === target) throw new Error(`ABORT: self link on ${source}`);
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
    // parseInline in renderArticleMarkdown.tsx does not recurse; these would render as literals.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
    // Repeat links from one page to one target. The threshold is 3, not 2, and that is a
    // considered choice rather than a convenience: at 2 this check fired on clark-county,
    // check-code-violations and philadelphia, and reading each one showed the same shape --
    // one contextual link inside the prose, plus the standard "Looking Up Permits Elsewhere"
    // see-also block that every county guide carries. An inline mention alongside a navigational
    // see-also is ordinary editorial practice, and Google attributes anchor text from the first
    // link anyway, so the second is redundant rather than harmful. Three would mean something
    // actually went wrong.
    const counts = new Map<string, number>();
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
    for (const [t, c] of counts) if (c > 2 && slug !== HUB) { console.log(`  REPEATED: ${slug} -> ${t} x${c}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} link defect(s)`);

  const after = graph(bodies);
  console.log(`\n  after : ${after.deadEnds.length} dead ends, ${after.orphans.length} orphans, ${after.reachable}/${live.size} reachable, ${after.total} links`);
  if (after.deadEnds.length) throw new Error(`ABORT: dead ends remain: ${after.deadEnds.join(', ')}`);
  if (after.orphans.length) throw new Error(`ABORT: orphans appeared: ${after.orphans.join(', ')}`);
  if (after.reachable !== live.size) throw new Error(`ABORT: only ${after.reachable}/${live.size} reachable`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const slug of new Set(LINKS.map((l) => l[0]))) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
