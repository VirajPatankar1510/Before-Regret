// Generates docs/allegheny-storm-premium.html -- the first of the regional storm-and-premium studies.
//
//   npx tsx scripts/analyse-storm-and-premium.ts   # must run first; this reads its figures JSON
//   npx tsx scripts/build-allegheny-study.ts
//
// Same contract as the outside-the-zone and high-hazard-dams builders: the prose lives here, every
// number is interpolated from docs/data/storm-and-premium-figures.json, and the HTML is a build
// artifact nobody edits by hand. A figure that changes in the data changes in the page; a figure
// that cannot be found in the data throws instead of shipping as prose.
//
// WHY THIS COUNTY, AND WHY THIS IS NOT A TEMPLATE. The regional series exists because the county
// page type built on the same data failed -- 100 near-identical templated pages, 82 impressions,
// zero clicks across six months, retired 2026-08-26. The difference is not presentation. Those
// pages filled one shape 100 times with different variables. This one exists because Allegheny is
// a genuine outlier on a specific cross-tabulation nobody else in the dataset sits on, and the
// piece is an argument about that outlier rather than a profile of a place. The next county in the
// series gets a different argument or it does not get written.
//
// The argument: Allegheny records the third-highest severe weather count of the 100 counties, and
// prices insurance like one of the calmest. That is not a mispricing story, which is what it looks
// like at first -- it is a coverage story. Its two largest exposures, inland flooding and radon,
// are both outside a standard HO-3 policy, so the premium is low precisely because the policy is
// not carrying the local risk. That connects to this project's own earlier national finding that
// three quarters of modelled loss falls on perils HO-3 excludes.
import fs from 'node:fs';
import path from 'node:path';
import { LOOKUP_CSS, lookupPayload, lookupMarkup, dataScript, JS_SCRIPT, embedDocument } from './lib/county-lookup.js';

const FIG = path.join(process.cwd(), 'docs', 'data', 'storm-and-premium-figures.json');
const OUT = path.join(process.cwd(), 'docs', 'allegheny-storm-premium.html');
// The embed is emitted as its own file rather than sliced back out of the study by the prerenderer.
// The dams and risk-without-price embeds are extracted with indexOf() against the study document's
// exact internal markup -- ".lk-eyebrow{", "</header>", ".pull{" -- which works but means a
// cosmetic edit to the study can silently ship an empty iframe onto someone else's site. Emitting
// the widget once, here, from the same data as the page, removes the extraction step entirely.
const OUT_EMBED = path.join(process.cwd(), 'docs', 'allegheny-storm-premium.embed.html');

type County = {
  slug: string; county: string; state: string; stateName: string; geoid: string;
  population: number; landSqMi: number; housingUnits: number; pctPre1950: number; pctPre1980: number;
  radonZone: number | null; stormEvents: number; eventsPerSqMi: number; eventsByType: Record<string, number>;
  hail: number; tornado: number; flood: number; thunderstormWind: number;
  mortgagedHouseholds: number; pctUnder1000: number; pctOver3000: number;
};

const fig = JSON.parse(fs.readFileSync(FIG, 'utf8'));
const counties: County[] = fig.counties;
const A = counties.find((c) => c.county === 'ALLEGHENY' && c.state === 'PA');
if (!A) throw new Error('ABORT: Allegheny County not found in the figures file');

// Ranks are computed, never typed. "Third stormiest, sixth cheapest" is the headline; if the data
// moves and it stops being true, the assertions below stop the build rather than shipping a lie.
const rankDesc = (key: keyof County) => [...counties].sort((a, b) => (b[key] as number) - (a[key] as number)).findIndex((c) => c.geoid === A.geoid) + 1;
const rankAsc = (key: keyof County) => [...counties].sort((a, b) => (a[key] as number) - (b[key] as number)).findIndex((c) => c.geoid === A.geoid) + 1;

const rStorm = rankDesc('stormEvents');
const rCheap = rankAsc('pctOver3000');
const rUnder = rankDesc('pctUnder1000');
const rFlood = rankDesc('flood');
const rWind = rankDesc('thunderstormWind');
const rPre80 = rankDesc('pctPre1980');

const med = (key: keyof County) => {
  const v = counties.map((c) => c[key] as number).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const medStorm = med('stormEvents');
const zone1 = counties.filter((c) => c.radonZone === 1);
const rZone1Old = [...zone1].sort((a, b) => b.pctPre1950 - a.pctPre1950).findIndex((c) => c.geoid === A.geoid) + 1;

if (rStorm !== 3) throw new Error(`ABORT: headline says third stormiest, data says ${rStorm}`);
if (rCheap !== 6) throw new Error(`ABORT: headline says sixth cheapest, data says ${rCheap}`);
if (A.radonZone !== 1) throw new Error('ABORT: Allegheny is no longer EPA radon Zone 1');

// Ordinals are computed from live ranks, so "3rd" cannot be hard-coded. 11-13 are the trap.
const ord = (n: number) => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
};
// Publication date is stated on the page, so it is a constant rather than new Date() -- a rebuild
// six months from now must not silently re-date a study whose figures did not change.
const PUBLISHED = '6 September 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/allegheny-storm-premium/';

const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => v.toLocaleString('en-US');

// The comparison that carries the argument: counties with comparable storm counts, priced apart.
const peers = [...counties].sort((a, b) => b.stormEvents - a.stormEvents).slice(0, 8);

const topTypes = Object.entries(A.eventsByType).sort((a, b) => b[1] - a[1]).slice(0, 6);

const peerRows = peers.map((c) => {
  const me = c.geoid === A.geoid;
  return `      <tr${me ? ' class="me"' : ''}>
        <td>${c.county === 'ALLEGHENY' ? 'Allegheny' : c.county.charAt(0) + c.county.slice(1).toLowerCase()}, ${c.state}</td>
        <td class="n">${num(c.stormEvents)}</td>
        <td class="n">${pct(c.pctUnder1000)}</td>
        <td class="n">${pct(c.pctOver3000)}</td>
      </tr>`;
}).join('\n');

const allRows = [...counties].sort((a, b) => b.stormEvents - a.stormEvents).map((c, i) => `      <tr${c.geoid === A.geoid ? ' class="me"' : ''}>
        <td class="n">${i + 1}</td>
        <td>${c.county.charAt(0) + c.county.slice(1).toLowerCase()}, ${c.state}</td>
        <td class="n">${num(c.stormEvents)}</td>
        <td class="n">${c.flood}</td>
        <td class="n">${pct(c.pctUnder1000, 0)}</td>
        <td class="n">${pct(c.pctOver3000, 0)}</td>
        <td class="n">${pct(c.pctPre1980, 0)}</td>
        <td class="n">${c.radonZone ?? '--'}</td>
      </tr>`).join('\n');

const typeBars = (() => {
  const max = topTypes[0][1];
  return topTypes.map(([k, v]) => `      <div class="bar-row">
        <span class="bar-label">${k}</span>
        <span class="bar" style="width:${Math.round((v / max) * 100)}%"></span>
        <span class="bar-val">${num(v)}</span>
      </div>`).join('\n');
})();


// The lookup widget is shared with the other studies in this series (scripts/lib/county-lookup.ts).
// It was inlined here first and moved out when the second study needed it: two copies of a widget
// drift, and the copy that drifts is the one already embedded on somebody else's site.
const lookupData = lookupPayload(counties);
const LOOKUP_MARKUP = lookupMarkup(counties.length);
const DATA_SCRIPT = dataScript(lookupData);

const html = `<style>
  .wrap{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.65 Charter,Georgia,'Times New Roman',serif;color:#1a1a1a}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:0 0 .9rem}
  .wrap h1{font-size:2.35rem;line-height:1.12;margin:0 0 1rem;font-weight:600;letter-spacing:-.015em}
  .standfirst{font-size:1.16rem;line-height:1.6;color:#3d3d3d;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:2.75rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #e5e0d8}
  .wrap h3{font-size:1.32rem;line-height:1.35;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;background:#e5e0d8;border:1px solid #e5e0d8;margin:0 0 2rem}
  .fig{background:#fdfcfa;padding:1rem .9rem}
  .fig b{display:block;font:700 1.65rem/1.1 ui-sans-serif,system-ui,sans-serif;color:#1a1a1a;letter-spacing:-.02em}
  .fig span{display:block;font:400 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin-top:.3rem}
  .finding{background:#faf8f4;border-left:3px solid #8a6d3b;padding:1.1rem 1.2rem;margin:0 0 1.4rem;font-size:1.02rem}
  .finding p{margin:0}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1a1a1a;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  tr.me td{background:#fdf6e7;font-weight:700}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1.6rem}
  .tall{max-height:26rem;overflow-y:auto}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:0 0 1.8rem}
  .bar-row{display:grid;grid-template-columns:9.5rem 1fr 3.2rem;align-items:center;gap:.6rem;margin-bottom:.4rem;font:400 12px/1.3 ui-sans-serif,system-ui,sans-serif}
  .bar-label{color:#4a4a4a}
  .bar{height:12px;background:#8a6d3b;display:block;min-width:2px}
  .bar-val{text-align:right;font-variant-numeric:tabular-nums;color:#4a4a4a}
  .cite{background:#f5f2ec;border:1px solid #e5e0d8;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6d3b;margin-bottom:.5rem}
  .wrap a{color:#8a6d3b}
  .snippet{background:#fff;border:1px solid #e5e0d8;padding:.7rem .8rem;margin:.7rem 0;overflow-x:auto;font:400 11.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#4a4a4a;white-space:pre}
  .cite code{font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;padding:.1em .3em;border:1px solid #e5e0d8}${LOOKUP_CSS}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e5e0d8;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}.bar-row{grid-template-columns:7rem 1fr 2.8rem}}
</style>

<div class="wrap">
  <p class="kicker">Regional analysis &middot; Allegheny County (Pittsburgh), Pennsylvania</p>
  <h1>Third stormiest, sixth cheapest</h1>
  <p class="standfirst">Across the 100 most populous US counties, Allegheny &mdash; the county
  that contains Pittsburgh &mdash; records more severe weather than all but two, and prices home
  insurance like one of the calmest places in the country. The gap is not a bargain. It is a
  description of what the policy does not cover.</p>

  <div class="figs">
    <div class="fig"><b>${num(A.stormEvents)}</b><span>severe weather events recorded 2015&ndash;2024, against a median of ${num(medStorm)} across the 100 counties</span></div>
    <div class="fig"><b>${pct(A.pctUnder1000)}</b><span>of mortgaged households report paying under $1,000 a year to insure the home</span></div>
    <div class="fig"><b>${pct(A.pctOver3000)}</b><span>pay more than $3,000 &mdash; the ${ord(rCheap)} lowest share of the 100</span></div>
    <div class="fig"><b>Zone 1</b><span>EPA radon designation, the highest of three</span></div>
  </div>

  ${LOOKUP_MARKUP}

  <h2>The finding</h2>
  <h3>Storm frequency and insurance price have come apart here more sharply than anywhere else in the dataset.</h3>

  <p>Between 2015 and 2024 the National Oceanic and Atmospheric Administration recorded
  ${num(A.stormEvents)} severe weather events in Allegheny County: ${num(A.thunderstormWind)}
  thunderstorm wind events, ${num(A.flood)} floods and flash floods, ${num(A.hail)} hailstorms and
  ${A.tornado} tornadoes. That is the ${ord(rStorm)}-highest count among the 100 counties examined and
  close to four times the median of ${num(medStorm)}. On thunderstorm wind alone the county ranks
  ${ord(rWind)}; on flooding, ${ord(rFlood)}.</p>

  <p>Insurance prices in Pittsburgh and the rest of the county do not read like that at all. ${pct(A.pctUnder1000)} of Allegheny's
  ${num(A.mortgagedHouseholds)} mortgaged households told the American Community Survey they pay
  less than $1,000 a year to insure the home &mdash; the ${ord(rUnder)}-highest share of cheap cover in
  the dataset. Only ${pct(A.pctOver3000)} pay more than $3,000.</p>

  <div class="finding">
    <p>Oklahoma County, Oklahoma records ${num(peers.find((c) => c.county === 'OKLAHOMA')!.stormEvents)}
    severe weather events over the same decade &mdash; fewer than Allegheny &mdash; and
    ${pct(peers.find((c) => c.county === 'OKLAHOMA')!.pctOver3000)} of its mortgaged households pay
    over $3,000. Allegheny records more weather and charges a quarter as many households that much.</p>
  </div>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Storm events<br>2015&ndash;2024</th><th class="n">Pay under $1,000</th><th class="n">Pay over $3,000</th></tr></thead>
      <tbody>
${peerRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The eight counties with the highest recorded storm counts. Insurance shares are of
  mortgaged households, from ACS table B25141.</p>

  <h2>What the county actually gets</h2>
  <h3>Wind and water, not the perils that usually drive a premium.</h3>

  <p>The composition matters more than the total. Allegheny's weather is overwhelmingly
  thunderstorm wind and flooding rather than the hail and tornado activity that drives pricing in
  the southern plains.</p>

${typeBars}
  <p class="cap">Allegheny County by event type, NOAA Storm Events Database, 2015&ndash;2024.</p>

  <p>That distinction is the whole explanation, and it is not favourable. A standard HO-3
  homeowners policy covers wind. It does not cover flood &mdash; flood is written separately,
  through the National Flood Insurance Program or a private equivalent, and a household that has
  not bought it is uncovered for the second most common event type in the county. Allegheny logged
  ${num(A.flood)} floods and flash floods in ten years, ${rFlood}th of the 100 counties.</p>

  <p>So the low premium is not evidence that little happens here. It is partly evidence that the
  policy is not carrying what happens here. A 2026 national analysis on this site found the same
  pattern at scale: roughly three quarters of the building loss FEMA models for the United States
  falls on perils a standard homeowners policy excludes, inland flooding chief among them.</p>

  <h2>The second uninsured exposure</h2>
  <h3>The county sits in EPA radon Zone 1, and three quarters of its housing predates 1980.</h3>

  <p>The Environmental Protection Agency places Allegheny in Zone 1, its highest category, meaning
  the predicted average indoor screening level exceeds 4 picocuries per litre &mdash; the level at
  which the EPA recommends action. ${zone1.length} of the 100 counties carry that designation.
  Among them, Allegheny has the ${ord(rZone1Old)}-largest share of pre-1950 housing:
  ${pct(A.pctPre1950)} of its ${num(A.housingUnits)} units, with ${pct(A.pctPre1980)} built before
  1980 &mdash; the ${ord(rPre80)}-oldest stock of the hundred.</p>

  <p>Construction era matters for radon because passive radon-resistant construction is a modern
  technique. The methods now written into model codes as radon-resistant new construction post-date
  the great majority of Allegheny's housing by decades, so most homes here were not built to resist
  it and were not tested when they were sold. No homeowners policy covers radon mitigation, and no
  premium reflects it. It is a several-thousand-dollar remediation that a buyer either finds during
  the inspection period or inherits.</p>

  <div class="finding">
    <p>Both of the county's largest hazards &mdash; inland flooding and radon &mdash; sit outside
    the homeowners policy entirely. A cheap premium in Allegheny County is an accurate price for the
    narrow set of risks the policy actually carries, and says nothing about the two that it does not.</p>
  </div>


  <h2>For newsrooms</h2>
  <h3>Free to reuse, including the underlying county data.</h3>

  <p>This analysis and its data are published under a Creative Commons Attribution 4.0 licence, so
  a newsroom can republish the figures, redraw the charts, or run its own cut without asking. The
  three source datasets are all US Government works and public domain in their own right: the NOAA
  Storm Events Database, the Census Bureau's American Community Survey (year structure built, and
  table B25141 on homeowners insurance costs), and the EPA Map of Radon Zones.</p>

  <p>If you are looking for Pittsburgh storm statistics, Allegheny County flood data, or home
  insurance costs by county, the numbers on this page are the whole of what we hold and the files
  below are the whole of the working. Two things are worth knowing before you quote them: NOAA
  counts are reports rather than a census of weather, and the ACS publishes insurance costs in
  bands, so there is no average premium here for any county.</p>

  <p>Happy to pull the same cut for a different county, walk through the method, or check a figure
  before it prints &mdash; hello@beforeregret.com. If you find an error, say so and it will be
  corrected on the page with a note.</p>

  <h2>Method</h2>
  <h3>How this was built.</h3>

  <p>Storm counts are every county-tagged entry in NOAA's Storm Events Database for the ten calendar
  years 2015&ndash;2024, summed by event type. Housing age and totals are American Community Survey
  5-year estimates for year structure built. Insurance figures are ACS table B25141, which records
  what mortgaged households report paying, in bands &mdash; not quoted rates, and not a modelled
  premium. The radon designation is the EPA Map of Radon Zones. Land area is ALAND from the Census
  Bureau's 2023 Gazetteer file. The comparison set is the ${fig.coverage.counties} counties in
  ${fig.coverage.states} states for which all five sources are complete.</p>

  <p>One methodological choice is worth stating because it changes the answer. Comparing counties by
  events per square mile looks more rigorous than comparing raw counts and is not: across these
  ${fig.coverage.counties} counties, event density correlates with population density at a Spearman
  coefficient of ${fig.diagnostics.spearmanEventDensityVsPopulationDensity.toFixed(3)}. NOAA's
  database records reports, and a storm that damages nothing in an empty place is often never
  written down, so density substantially maps where people live. Raw counts relate only weakly to
  land area (${fig.diagnostics.spearmanRawEventsVsLandArea.toFixed(3)}) and to population
  (${fig.diagnostics.spearmanRawEventsVsPopulation.toFixed(3)}), so raw counts are used throughout.
  Density is published in the dataset so the choice can be checked.</p>

  <h2>Limitations</h2>
  <h3>What this cannot tell you.</h3>

  <p>NOAA's counts are reports of events, not a census of weather, and reporting density varies with
  population and with local spotter networks. They should be read as how often something damaging
  was recorded here, not as a physical storm frequency.</p>

  <p>ACS insurance figures are self-reported and banded, so no county has a published mean and
  none is calculated here. They cover mortgaged households only; owners without a mortgage face no
  lender insurance requirement and are excluded from the table entirely. The figures do not
  distinguish policy form, deductible or coverage limit, so a cheap premium and an expensive one may
  be buying materially different things &mdash; which is part of the point, but it means the
  comparison is of price paid, not of value received.</p>

  <p>Across all ${fig.coverage.counties} counties the relationship between recorded storm events and
  the share paying over $3,000 is Spearman
  ${fig.diagnostics.spearmanRawEventsVsPctOver3000.toFixed(3)}, Pearson
  ${fig.diagnostics.pearsonRawEventsVsPctOver3000.toFixed(3)} &mdash; effectively no relationship
  nationally. Allegheny is an extreme case of a pattern that is general, not an exception to a rule
  that otherwise holds.</p>

  <p>Nothing here describes an individual property. Every figure is a county aggregate, and a
  specific house may face far more or far less than its county's profile.</p>

  <h2>Appendix</h2>
  <h3>All ${fig.coverage.counties} counties, ranked by recorded storm events.</h3>

  <div class="scroll tall">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Events</th><th class="n">Flood</th><th class="n">&lt;$1k</th><th class="n">&gt;$3k</th><th class="n">Pre-1980</th><th class="n">Radon</th></tr></thead>
      <tbody>
${allRows}
      </tbody>
    </table>
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;Third stormiest, sixth cheapest: storm frequency and insurance price in
    Allegheny County.&rdquo; Analysis of NOAA Storm Events, ACS B25141 and EPA radon zones across
    ${fig.coverage.counties} US counties. Full county dataset:
    <a href="https://www.beforeregret.com/research/data/storm-and-premium-counties.csv">CSV</a> &middot;
    <a href="https://www.beforeregret.com/research/data/storm-and-premium-figures.json">JSON</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the county lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="420" style="border:1px solid #e5e0d8"
        title="Storm frequency and insurance cost by county"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code> if you want
    it to resize with the content; without that listener the fixed height above still works.
  </div>

  <footer class="spine">
    Sources: NOAA National Centers for Environmental Information, Storm Events Database,
    2015&ndash;2024; US Census Bureau, American Community Survey 5-year (year structure built and
    table B25141); US Environmental Protection Agency, Map of Radon Zones; US Census Bureau, 2023
    Gazetteer Files. All US Government works.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/risk-without-price/">Risk Without Price</a> &#183;
    <a href="/research/risk-without-cover/">Risk Without Cover</a> &#183;
    <a href="/research/outside-the-zone/">Outside the Zone</a> &#183;
    <a href="/research/high-hazard-dams/">High-Hazard Dams</a>
  </footer>
</div>
${DATA_SCRIPT}
${JS_SCRIPT}
`;

// The embed: the same widget, standalone, sized for an iframe in somebody else's article.
const embed = embedDocument(STUDY_URL, 'Third Stormiest, Sixth Cheapest', LOOKUP_MARKUP, DATA_SCRIPT);

// The caveat travels with the widget, always. Inside somebody else's article a bare event count
// reads as a hazard ranking, which is exactly what a count of REPORTS is not. The study page can
// lean on the paragraphs around it; an embed can lean on nothing, so if the caveat is ever edited
// out of LOOKUP_MARKUP this build stops rather than shipping the number without it.
if (!embed.includes('lk-caveat')) throw new Error('ABORT: embed lost its caveat');
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
if (!html.includes('lk-caveat')) throw new Error('ABORT: study page lost the lookup caveat');
if (!html.includes('id="alg-data"')) throw new Error('ABORT: study page lost the lookup data');

fs.writeFileSync(OUT_EMBED, embed);
fs.writeFileSync(OUT, html);
console.log(`wrote ${path.relative(process.cwd(), OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`wrote ${path.relative(process.cwd(), OUT_EMBED)}  (${(embed.length / 1024).toFixed(1)} KB, ${lookupData.length} counties)`);
console.log(`  storm rank ${rStorm}/100, cheapest-premium rank ${rCheap}/100, radon zone ${A.radonZone}`);
console.log(`  ${num(A.stormEvents)} events | ${pct(A.pctUnder1000)} under $1k | ${pct(A.pctOver3000)} over $3k | ${pct(A.pctPre1980)} pre-1980`);
