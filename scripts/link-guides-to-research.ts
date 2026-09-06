// Links five guides out to the research studies.
//
//   npx tsx scripts/link-guides-to-research.ts            # dry run
//   APPLY=true npx tsx scripts/link-guides-to-research.ts
//
// WHY. A scan of all 62 URLs in the sitemap found the guide cluster and the research cluster
// touching nowhere in prose: guide article -> study was 0 links, study -> guide was 0. The only
// connection was the /guides/ index listing the studies. That matters in one direction especially
// -- the studies are the only assets built to attract external links, so any authority one earns
// currently flows nowhere near the 49 guides that would benefit from it.
//
// The three study -> guide links live in the two study builders. These are the five going the
// other way, and they follow the rule the whole library is linked on: the anchor is appended to a
// sentence that ALREADY discusses the destination, and where no honest anchor exists the gap is
// left rather than filled.
//
// ANCHORS COME FROM THE BODY, NOT THE QUICK ANSWER. Two of these were first written against
// sentences that turned out to live in quick_answer, which is rendered separately from the body
// markdown -- a link there is not a body link and may not render as one at all. Both were moved to
// real body sentences.
//
// ELEVEN CANDIDATES WERE REJECTED, and the rejects are the point. A keyword scan over-generates:
// a Clark County, Nevada permit page mentions "roof replacement", which a regex offers as a link
// to a Texas hail study, and Harris County mentions "severe weather", offered as a link to a study
// about Pittsburgh. Wrong region, wrong subject, and a reader following either learns nothing
// about the page they left. buy-house-active-hoa-lawsuit matched "separate policy" but that
// sentence is about TITLE insurance and already links correctly to the title guide.
//
// TWO STUDIES GET NOTHING, which is the right answer rather than a gap. No guide discusses dams,
// so high-hazard-dams has no honest inbound anchor. No guide substantively discusses flood-zone
// determination, so outside-the-zone has none -- itself worth noticing, since flood-zone
// determination is a real buyer question with no guide covering it.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

// [guide slug, study slug, verbatim body tail matched exactly once, text appended after it]
const LINKS: Array<[string, string, string, string]> = [
  [
    'homeowners-insurance-cover-failed-sump-pump', 'risk-without-cover',
    "It's important to understand that this endorsement is **not** flood insurance.",
    ' Nor do many households hold the separate policy instead: across 2,304 counties, [in the median county about one home in seven inside a mapped flood zone carries flood insurance](/research/risk-without-cover/).',
  ],
  [
    'evidence-prior-repair-mean-home-inspection-report', 'north-texas-roof-age',
    'an insurer may request a specialized roof certification or require a complete roof replacement as a condition of issuing a policy.',
    ' Roof age drives that decision more than almost anything else about a house, and where a county was built in a single burst [the roofs come due as a cohort rather than one at a time](/research/north-texas-roof-age/).',
  ],
  [
    'how-common-are-title-insurance-claims', 'risk-without-price',
    'For homeowners insurance over the same decade, claims consumed roughly 70% of premium.',
    ' What sets that premium is less obvious than it looks: across 3,093 counties, [state of residence explains more than twice as much of it as modelled hazard risk does](/research/risk-without-price/).',
  ],
  [
    'get-home-insurance-fuse-box', 'risk-without-price',
    'Rates for homes with fuse panels can be significantly higher than rates for homes equipped with a modern breaker panel.',
    ' How much of a premium the house itself sets is a live question, though &mdash; [where you are moves it more than the hazards you face](/research/risk-without-price/).',
  ],
  [
    'get-home-insurance-flat-roof', 'north-texas-roof-age',
    'insurance underwriters view them through a significantly stricter lens than standard sloped',
    '', // completed below once the full sentence is confirmed at runtime
  ],
];

// The flat-roof anchor is matched on a prefix because the sentence tail varies; the append is
// attached after the sentence's terminating period, found from the prefix.
const FLAT_ROOF_ADD = ' That stricter lens is roof age in another form, and it is why a county whose housing all went up at once faces [a synchronised roof-replacement problem](/research/north-texas-roof-age/) rather than a rolling one.';

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));

  for (const [slug, study, tail, add] of LINKS) {
    const b = bodies.get(slug);
    if (b === undefined) throw new Error(`ABORT: ${slug} is not published`);
    if (b.includes(`/research/${study}/`)) throw new Error(`ABORT: ${slug} already links ${study}`);

    if (add) {
      const n = b.split(tail).length - 1;
      if (n !== 1) throw new Error(`ABORT: ${slug} tail matched ${n} times, expected 1`);
      bodies.set(slug, b.replace(tail, tail + add));
    } else {
      // Prefix match: find the sentence containing it and append after its period.
      const i = b.indexOf(tail);
      if (i < 0) throw new Error(`ABORT: ${slug} prefix not found`);
      if (b.indexOf(tail, i + 1) !== -1) throw new Error(`ABORT: ${slug} prefix is not unique`);
      const stop = b.indexOf('.', i + tail.length);
      if (stop < 0) throw new Error(`ABORT: ${slug} sentence has no terminating period`);
      bodies.set(slug, b.slice(0, stop + 1) + FLAT_ROOF_ADD + b.slice(stop + 1));
    }
    console.log(`  ok  ${slug}\n        -> /research/${study}/`);
  }

  // ---- assertions ---------------------------------------------------------------------------
  const live = new Set(bodies.keys());
  const STUDIES = new Set(['risk-without-price', 'risk-without-cover', 'outside-the-zone',
    'high-hazard-dams', 'allegheny-storm-premium', 'north-texas-roof-age']);
  let bad = 0;
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    for (const m of b.matchAll(/\]\(\/research\/([a-z0-9-]+)\/?\)/g)) {
      if (!STUDIES.has(m[1])) { console.log(`  DEAD STUDY LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    // renderArticleMarkdown.tsx's parseInline does not recurse; these ship as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  const touched = [...new Set(LINKS.map((l) => l[0]))];
  console.log(`\n  guides touched      : ${touched.length}`);
  console.log(`  guide->study links  : 0 -> ${LINKS.length}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const slug of touched) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
