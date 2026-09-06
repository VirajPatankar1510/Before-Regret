// Connects the disconnected plumbing/pest island to the main link graph.
//
//   npx tsx scripts/connect-island-clusters.ts            # dry run
//   APPLY=true npx tsx scripts/connect-island-clusters.ts
//
// -------------------------------------------------------------------------------------------
// WHY THIS EXISTS. The orphan pass got every published guide an inbound link, which was the
// stated goal, but a breadth-first search from the permits hub afterwards reached only 36 of 44
// pages. Eight had inbound links exclusively FROM EACH OTHER:
//
//     spot-polybutylene-pipes-before-buying-house      why-cast-iron-pipes-corrode
//     orangeburg-pipe-collapse                         homeowners-insurance-cover-failed-sump-pump
//     tpr-valve-inspectors-always-check                standard-home-inspection-include-termites
//     wdo-report-who-supposed-order                    negotiate-radon-mitigation-after-inspection
//
// "Not an orphan" and "reachable" are different properties, and only the second one moves link
// equity. A closed loop of eight pages citing each other receives nothing from the rest of the
// site no matter how densely it is linked internally -- a crawler arriving through the permits
// cluster, which is where nearly all of this site's ranking currently sits, could not walk to any
// of them. That is worth fixing on its own terms, not as a tidiness exercise.
//
// Same rule as every previous pass: each anchor is appended to a sentence that already discusses
// the destination's subject. Four bridges, chosen because they are the honest ones available:
//
//   eifs-stucco-moisture -> wdo-report          "trapped moisture feeds wood-destroying fungi"
//   amateur-workmanship  -> tpr-valve           a water heater rupturing and flooding a home
//   amateur-workmanship  -> polybutylene        a drain using improper materials
//   clue-report          -> failed-sump-pump    "multiple water-related claims"
//
// The first bridge alone carries the pest trio, because wdo-report already links to termites and
// termites already links to radon. The rest of the island hangs off the two plumbing bridges.
//
// The script asserts reachability rather than reporting it: if a BFS from the hub does not reach
// all 44 published guides, it refuses to write.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

// [source, target, verbatim tail of an existing sentence, text appended after it]
const BRIDGES: Array<[string, string, string, string]> = [
  [
    'standard-home-inspection-check-eifs-stucco-moisture', 'wdo-report-who-supposed-order',
    'leading to severe rot in stud walls, band joists, and subfloors without showing any visible signs on the exterior surface.',
    ' Rot of that kind is what a pest inspector is actually looking for, and it is reported separately from the home inspection — [the WDO report covers wood-destroying organisms](/guides/wdo-report-who-supposed-order/), fungi included, not only insects.',
  ],
  [
    'amateur-workmanship-mean-home-inspection-report', 'tpr-valve-inspectors-always-check',
    'an insurance adjuster may evaluate whether the installation violated safety codes, potentially complicating claim resolutions.',
    ' The single component inspectors check first on a water heater is [the TPR valve](/guides/tpr-valve-inspectors-always-check/), because a missing or wrongly routed discharge pipe is both common in amateur installations and genuinely dangerous.',
  ],
  [
    'amateur-workmanship-mean-home-inspection-report', 'spot-polybutylene-pipes-before-buying-house',
    'concealed plumbing lines inside the wall or crawlspace were installed with incorrect slope or improper venting.',
    ' Material matters as much as workmanship here: [how to spot polybutylene supply pipes](/guides/spot-polybutylene-pipes-before-buying-house/) is worth knowing before you accept any plumbing as sound, because the failure mode is invisible from outside the pipe.',
  ],
  [
    'get-clue-report-before-buying-house', 'homeowners-insurance-cover-failed-sump-pump',
    'Multiple water-related claims often indicate ongoing plumbing or drainage defects.',
    ' Basement water is the recurring one, and the coverage question surprises people: [whether homeowners insurance covers a failed sump pump](/guides/homeowners-insurance-cover-failed-sump-pump/) usually turns on an endorsement the policy does not include by default.',
  ],
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const bodies = new Map<string, string>(rows.map((r) => [r.slug, r.body_markdown]));
  const live = new Set(bodies.keys());

  const reach = (map: Map<string, string>) => {
    const adj = new Map<string, string[]>();
    for (const [slug, b] of map) {
      adj.set(slug, [...new Set([...b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))]);
    }
    const seen = new Set([HUB]);
    const queue = [HUB];
    while (queue.length) {
      for (const t of adj.get(queue.shift()!) || []) if (live.has(t) && !seen.has(t)) { seen.add(t); queue.push(t); }
    }
    return seen;
  };

  const before = reach(bodies);
  console.log(`  reachable from hub before: ${before.size}/${live.size}`);

  for (const [source, target, tail, addition] of BRIDGES) {
    const b = bodies.get(source);
    if (b === undefined) throw new Error(`ABORT: source ${source} not published`);
    if (!live.has(target)) throw new Error(`ABORT: target ${target} not published`);
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
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
  }
  if (bad) throw new Error(`ABORT: ${bad} link defect(s)`);

  const after = reach(bodies);
  const unreachable = [...live].filter((s) => !after.has(s));
  console.log(`  reachable from hub after : ${after.size}/${live.size}`);
  if (unreachable.length) throw new Error(`ABORT: still unreachable: ${unreachable.join(', ')}`);

  const inbound = new Map<string, number>();
  for (const [slug, b] of bodies) {
    for (const t of new Set([...b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))) {
      if (t !== slug) inbound.set(t, (inbound.get(t) || 0) + 1);
    }
  }
  const orphans = [...live].filter((s) => !inbound.has(s));
  if (orphans.length) throw new Error(`ABORT: orphans reappeared: ${orphans.join(', ')}`);

  console.log(`\n  orphans   : ${orphans.length}`);
  console.log(`  total links: ${[...inbound.values()].reduce((a, b) => a + b, 0)}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const slug of new Set(BRIDGES.map((b) => b[0]))) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
