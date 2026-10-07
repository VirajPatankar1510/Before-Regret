// Inserts a "Key findings" block into the four studies whose HTML in docs/ is the source of truth
// (their analysis scripts live outside this repo): High-Hazard Dams, Outside the Zone, Risk Without
// Price and Risk Without Cover. The three studies that have a builder here (Allegheny, North Texas,
// Raise or Remove) emit their block from the builder instead.
//
// Idempotent: an existing block is replaced, never duplicated. Every sentence restates a figure the
// page already states, and assertKeyFindingsNumbers() aborts if one does not -- see
// scripts/lib/keyFindings.ts. Dry run by default; APPLY=true writes.
//
//   npx tsx scripts/add-study-key-findings.ts
//   APPLY=true npx tsx scripts/add-study-key-findings.ts

import fs from 'node:fs';
import path from 'node:path';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';

const APPLY = process.env.APPLY === 'true';

interface Study {
  file: string;
  /** Inserted immediately before this marker (the county lookup), so it sits under the headline
   *  figures and outside every slice the embeds take. */
  before: string;
  /** Wraps the block for pages whose sections need the .spine column. */
  wrap?: (block: string) => string;
  items: string[];
  source: string;
}

const STUDIES: Study[] = [
  {
    file: 'high-hazard-dams.html',
    before: '<div class="lookup">',
    items: [
      'The US Army Corps of Engineers&rsquo; National Inventory of Dams classifies 17,049 US dams as high hazard potential, meaning failure would be expected to cause loss of life. The classification describes what lies downstream, not how likely a dam is to fail.',
      'Of those 17,049 dams, 2,791 (16.4%) have a recorded condition assessment of Poor or Unsatisfactory: 2,287 Poor and 504 Unsatisfactory.',
      '2,476 high-hazard-potential dams (14.5%) have no emergency action plan recorded in the inventory, and 636 of them also carry a Poor or Unsatisfactory condition rating.',
      'The 636 dams in that overlap have a median recorded completion year of 1955.',
      '77.4% of high-hazard-potential dams (13,201 of 17,049) do have an emergency action plan recorded.',
    ],
    source: 'Source: US Army Corps of Engineers, National Inventory of Dams, data last updated 2026-08-28; analysis by Before Regret. These are the regulating agencies&rsquo; own records, not an assessment of any dam.',
  },
  {
    file: 'outside-the-zone.html',
    before: '<div class="lookup">',
    items: [
      'Of 2,578,413 National Flood Insurance Program claims with a usable flood-zone code, 686,045 (26.6%) were on properties whose policy was rated outside the high-risk flood zone, in zones X, B or C.',
      'Those out-of-zone claims were paid $20.6 billion, 23.4% of everything the program has paid.',
      'In Texas, 50.7% of 380,408 flood claims were paid outside the mapped zone; in Harris County, 54.8% of 167,261.',
      'Outside the high-risk zone, 1.25% of homes carry flood insurance (1,321,764 policies across 105,487,685 homes), against 47.9% inside it.',
      'The share swings with each year&rsquo;s storms: 42.3% of claims fell outside the zone in 2017, the year of Hurricane Harvey, and 10.1% in 2024.',
    ],
    source: 'Source: FEMA, National Flood Insurance Program claims and policy data (OpenFEMA), claims from the 1970s to 2026; analysis by Before Regret. Each claim is counted by the zone its policy was rated in at the time, not today&rsquo;s map.',
  },
  {
    file: 'risk-without-price.html',
    before: '<section class="spine" id="lookup">',
    wrap: (b) => `<section class="spine" aria-label="Key findings">\n  ${b}\n</section>\n\n`,
    items: [
      'Across 3,093 US counties, the state a home is in explains 44% of the variation in what mortgaged homeowners report paying to insure it (R&sup2; 0.44); FEMA&rsquo;s modelled natural-hazard risk explains 20% (R&sup2; 0.20).',
      'Weighted by households, the gap widens: 65% for state against 30% for hazard risk.',
      'Counties facing the same modelled hazard still pay very different prices: within twenty equal bands of risk, the median gap between the cheapest and the most expensive county is 2.3&times;.',
      'In 11 of 43 states, counties facing more modelled hazard pay lower premiums than counties facing less.',
      '76.5% of the building loss FEMA expects American homes to suffer each year comes from perils a standard HO-3 homeowners policy does not cover, flooding above all, then earthquake.',
    ],
    source: 'Sources: US Census Bureau, American Community Survey 5-year 2023, table B25141 (premiums reported by 50,715,340 mortgaged households); FEMA National Risk Index; analysis by Before Regret.',
  },
  {
    file: 'risk-without-cover.html',
    before: '<section class="spine" id="lookup">',
    wrap: (b) => `<section class="spine" aria-label="Key findings">\n  ${b}\n</section>\n\n`,
    items: [
      'In the median US county, 15% of homes inside a FEMA-mapped flood zone carry NFIP flood insurance. In 705 of 2,304 counties fewer than one in ten do, and in 68 counties no policy is in force at all.',
      'Nationally, 39.8% of flood-zone homes are covered, a figure carried by a few large coastal counties: Florida alone accounts for 566,635 of the 1.5 million policies.',
      'Modelled flood risk explains almost none of the difference in coverage between counties (R&sup2; 0.004); the state a home is in explains 0.225.',
      'West Virginia has the highest flood loss rate of any state, $2.71 per $1,000 of building value, and the lowest take-up, 10.3%.',
      'South Carolina has the highest take-up in the country, 68.7%, and ranks forty-third of fifty on flood risk.',
    ],
    source: 'Sources: FEMA OpenFEMA, NFIP residential penetration rates as of 3 August 2026; FEMA National Risk Index; analysis by Before Regret. NFIP policies only: private flood insurance is not counted, so true coverage is somewhat higher.',
  },
];

const KF_RE = /(?:<section class="spine" aria-label="Key findings">\s*)?<section class="kf" id="key-findings">[\s\S]*?<\/section>(?:\s*<\/section>)?\s*/;

for (const st of STUDIES) {
  const p = path.join(process.cwd(), 'docs', st.file);
  const before = fs.readFileSync(p, 'utf8');
  let html = before.replace(KF_RE, '');

  if (html.split(st.before).length !== 2) throw new Error(`ABORT: ${st.file}: insertion marker not found exactly once`);
  const block = keyFindingsBlock(st.items, st.source);
  html = html.replace(st.before, (st.wrap ? st.wrap(block) : `${block}\n\n  `) + st.before);

  if (!html.includes('.kf{')) {
    const styleEnd = html.indexOf('</style>');
    if (styleEnd < 0) throw new Error(`ABORT: ${st.file}: no </style>`);
    html = html.slice(0, styleEnd) + KF_CSS + '\n' + html.slice(styleEnd);
  }

  assertKeyFindingsNumbers(html, st.file);
  const changed = html !== before;
  console.log(`${st.file}: ${st.items.length} findings ${changed ? (APPLY ? 'WRITTEN' : 'would write') : 'unchanged'}`);
  if (APPLY && changed) fs.writeFileSync(p, html);
}
if (!APPLY) console.log('\nDry run. APPLY=true to write.');
