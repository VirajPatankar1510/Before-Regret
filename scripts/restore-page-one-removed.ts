// Restores the removed guides that Google still ranks on page one.
//
//   npx tsx scripts/restore-page-one-removed.ts            # dry run
//   APPLY=true npx tsx scripts/restore-page-one-removed.ts
//
// -------------------------------------------------------------------------------------------
// WHY THESE SIX. A Search Console pull for the seven days to 2026-09-05 found 394 impressions
// landing on guide URLs that answer 410. Sixteen removed guides are still being served by Google,
// several on page one, and two of them are earning CLICKS from a page that does not exist:
//
//     59i  2 clicks  pos 6.9   splice-romex-knob-tube-wiring
//     48i            pos 5.9   who-s-responsible-shared-well-shared-driveway
//     47i            pos 6.1   100-amp-service-enough-house-re-buying
//     34i            pos 5.8   when-foundation-crack-need-structural-engineer
//     17i  1 click   pos 5.4   home-solar-panels-don-t-own-affect-getting-insurance
//     11i            pos 4.6   home-inspection-include-septic-system
//
// THE INDEXING RULE DOES NOT BITE HERE, and it is worth being explicit about why, because it has
// been the reason to hold back all session. The rule exists because publishing pages Google has
// not yet indexed, on a young domain, is what got the library suppressed. These are the opposite
// case: Google has already indexed them, already ranks them between 4.6 and 6.9, and is already
// sending people to them. The 410 is throwing away rankings the site already holds. Restoring
// them asks for no new crawl budget -- it makes URLs resolve that Google is pointing at today.
//
// -------------------------------------------------------------------------------------------
// SIX EXCLUDED, and the first three matter most.
//
// pest-inspectors-wish-buyers-knew-about-termites, contractors-wish-buyers-knew-about-renovation-
// costs and insurance-agents-wish-buyers-knew-about-coverage are three of the six "what X wish
// buyers knew" pages. The content standard names that formula specifically -- it was "the most
// legible scaled-content marker in the library and all six were deleted." Restoring three would
// rebuild the footprint that helped get the library suppressed, for 9 impressions between them.
//
// I ALREADY RESTORED A FOURTH ONE TODAY without noticing the rule:
// hvac-techs-wish-buyers-knew-about-system-age is live, on the strength of position 2.3. That was
// a real signal and the page is worth having, but it means the formula now has one live member and
// should not gain three more. Flagged here rather than quietly left.
//
// polybutylene-pipes-always-leak: 7 impressions, no FAQs at all, and its live sibling
// spot-polybutylene-pipes-before-buying-house drew zero queries in 28 days. Not worth the row.
// get-homeowners-insurance-wood-burning-fireplace-no-chimney-c: 2 impressions and the slug is
// visibly truncated ("chimney-c"), which is its own problem to fix before publishing it anywhere.
// regret-buying-a-house: 1 impression, a 64-character title, a dead internal link, and it is a
// post-purchase subject on a site about the decision before the purchase.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

const RESTORE = [
  'splice-romex-knob-tube-wiring',
  'who-s-responsible-shared-well-shared-driveway',
  '100-amp-service-enough-house-re-buying',
  'when-foundation-crack-need-structural-engineer',
  'home-solar-panels-don-t-own-affect-getting-insurance',
  'home-inspection-include-septic-system',
];

// 156 -> 148. One character over is still truncated. The first rewrite came out at 162
// and the assertion below caught it, which is the reason the assertion is there.
const META_FIX: Record<string, string> = {
  'home-solar-panels-don-t-own-affect-getting-insurance':
    'Solar panels you do not own can complicate a home insurance application: what carriers ask, who insures the array, and what to check before closing.',
};

// [source, restored target, verbatim tail matched exactly once, text appended after it]
// One host page each, so no page carries two of these.
const INBOUND: Array<[string, string, string, string]> = [
  [
    'knob-tube-wiring-have-be-replaced-before-closing', 'splice-romex-knob-tube-wiring',
    'This process involves pulling modern cable through existing walls, installing modern junction boxes, updating three-prong outlets, and bringing the home up to current electrical codes.',
    ' Partial jobs raise their own question, because the two systems meet somewhere — [whether Romex can be spliced to knob and tube](/guides/splice-romex-knob-tube-wiring/) is the detail an inspector looks for at that junction.',
  ],
  [
    'how-common-are-title-insurance-claims', 'who-s-responsible-shared-well-shared-driveway',
    'A recorded lien, a break in the chain of title, an old easement running across the back of the lot: all discoverable in public records.',
    ' What the record often does not settle is who pays to maintain what it describes — [responsibility for a shared well or a shared driveway](/guides/who-s-responsible-shared-well-shared-driveway/) is a separate question from who holds the right to use it.',
  ],
  [
    'check-building-permits-san-diego-county-ca', '100-amp-service-enough-house-re-buying',
    'Many mid-century San Diego homes originally featured 60-amp or 100-amp electrical panels.',
    ' Whether that is a problem depends on what the house is asked to run: [100-amp service is still adequate for some homes and not others](/guides/100-amp-service-enough-house-re-buying/).',
  ],
  [
    'typical-settlement-cracking-mean-inspection-report', 'when-foundation-crack-need-structural-engineer',
    'Some types of cracking can indicate more serious issues, such as foundation failure, significant structural movement, or underlying soil problems that require immediate attention from a specialist.',
    ' The threshold is knowable rather than a judgement call — [the crack characteristics that warrant a structural engineer](/guides/when-foundation-crack-need-structural-engineer/) are specific.',
  ],
  [
    'check-building-permits-clark-county-nv', 'home-solar-panels-don-t-own-affect-getting-insurance',
    'Residential rooftop solar installations require dual approval from the local building safety department and the electric utility provider.',
    ' Ownership matters as much as approval when it comes to insuring the house: [panels held on a lease or a power purchase agreement](/guides/home-solar-panels-don-t-own-affect-getting-insurance/) are insured differently from panels the owner bought.',
  ],
  [
    'spot-polybutylene-pipes-before-buying-house', 'home-inspection-include-septic-system',
    'Standard home inspection guidelines require inspectors to identify and report on visible supply piping materials [ASHI].',
    ' What leaves the house is treated differently from what enters it — [a septic system is not part of a standard inspection](/guides/home-inspection-include-septic-system/) and is booked separately.',
  ],
];

// Outbound from each restored page, so none lands as a dead end -- that count was taken to zero
// earlier today and should not regress. Same rule: the anchor joins a sentence already on the
// subject. Three first drafts were thrown out for matching only on "before closing", which is a
// phrase every guide contains and predicts nothing about the destination.
const OUTBOUND: Array<[string, string, string, string]> = [
  [
    'splice-romex-knob-tube-wiring', 'what-is-knob-and-tube-wiring',
    'Finding modern Romex cabling spliced directly into vintage knob-and-tube wiring is one of the most common electrical discoveries during a pre-purchase home inspection.',
    ' If you are not certain that is what you are looking at, [knob-and-tube has a set of attic tells](/guides/what-is-knob-and-tube-wiring/) that separate it from later cloth-sheathed wiring.',
  ],
  [
    'who-s-responsible-shared-well-shared-driveway', 'how-common-are-title-insurance-claims',
    "An easement is a legal right to use a portion of another person's land for a specific purpose.",
    ' An easement missing from the record is one of the defects a title policy exists for, and [unrecorded easements are among the commoner claims](/guides/how-common-are-title-insurance-claims/).',
  ],
  [
    '100-amp-service-enough-house-re-buying', 'get-home-insurance-fuse-box',
    'Buyers who overlook the limits of a 100-amp panel often find themselves unable to add modern conveniences like electric vehicle chargers or heat pumps without triggering a mandatory system upgrade.',
    ' Capacity is not the only question an old panel raises either: [a fuse box is an insurability problem before it is a capacity one](/guides/get-home-insurance-fuse-box/).',
  ],
  [
    'when-foundation-crack-need-structural-engineer', 'typical-settlement-cracking-mean-inspection-report',
    'This shrinkage creates internal tensile stresses that are commonly relieved by minor, superficial hairline cracks.',
    ' That is the ordinary case, and it is what an inspector means by [typical settlement cracking](/guides/typical-settlement-cracking-mean-inspection-report/) when the phrase appears in a report.',
  ],
  [
    'home-solar-panels-don-t-own-affect-getting-insurance', 'get-home-insurance-flat-roof',
    'One of the most frequent friction points for homes with unowned solar panels involves the physical labor required to move panels during structural roof repairs.',
    ' The roof underneath is its own underwriting question before the panels are considered &mdash; [a flat roof is harder to insure](/guides/get-home-insurance-flat-roof/) whatever is mounted on it.',
  ],
  [
    'home-inspection-include-septic-system', 'standard-home-inspection-include-termites',
    'Inspecting these components requires specialized tools, excavation, and safety training that fall outside the scope of a general home inspection license.',
    ' Septic is not the only thing outside that scope, and the exclusion buyers are caught by most often is that [a standard inspection does not cover termites](/guides/standard-home-inspection-include-termites/) either.',
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

  const live = new Set([...rows.filter((r) => r.status === 'published').map((r) => r.slug), ...RESTORE]);
  const bodies = new Map<string, string>([...live].map((s) => [s, byslug.get(s)!.body_markdown]));

  for (const [source, target, tail, addition] of [...INBOUND, ...OUTBOUND]) {
    const b = bodies.get(source);
    if (b === undefined) throw new Error(`ABORT: source ${source} not live`);
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
    // renderArticleMarkdown.tsx's parseInline does not recurse; these ship as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
  }
  for (const slug of live) {
    const row = byslug.get(slug)!;
    const meta = META_FIX[slug] ?? row.meta_description;
    if (!meta || meta.length > 155) { console.log(`  META ${slug}: ${meta?.length ?? 'NULL'}`); bad++; }
    if (row.title.length > 60) { console.log(`  TITLE ${slug}: ${row.title.length}`); bad++; }
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

  console.log(`\n  published : ${live.size - RESTORE.length} -> ${live.size}`);
  console.log(`  orphans   : ${orphans.length}${orphans.length ? ` (${orphans.join(', ')})` : ''}`);
  console.log(`  dead ends : ${deadEnds.length}${deadEnds.length ? ` (${deadEnds.join(', ')})` : ''}`);
  console.log(`  reachable : ${seen.size}/${live.size}`);
  if (orphans.length) throw new Error('ABORT: orphans');
  if (deadEnds.length) throw new Error(`ABORT: dead ends: ${deadEnds.join(', ')}`);
  if (seen.size !== live.size) throw new Error(`ABORT: only ${seen.size}/${live.size} reachable`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const s of RESTORE) {
    const meta = META_FIX[s];
    if (meta) {
      await withDb((sql) => sql`UPDATE articles SET status='published', meta_description=${meta},
        body_markdown=${bodies.get(s)!}, updated_at=now() WHERE slug=${s} AND status='removed'`);
    } else {
      await withDb((sql) => sql`UPDATE articles SET status='published', body_markdown=${bodies.get(s)!},
        updated_at=now() WHERE slug=${s} AND status='removed'`);
    }
    console.log(`  restored ${s}`);
  }
  for (const s of new Set([...INBOUND, ...OUTBOUND].map((l) => l[0]).filter((x) => !RESTORE.includes(x)))) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown=${bodies.get(s)!}, updated_at=now() WHERE slug=${s}`);
    console.log(`  linked from ${s}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
