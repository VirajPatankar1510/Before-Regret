// Generates docs/north-texas-roof-age.html -- the second regional storm-and-premium study.
//
//   npx tsx scripts/analyse-storm-and-premium.ts   # must run first
//   npx tsx scripts/build-north-texas-study.ts
//
// -------------------------------------------------------------------------------------------
// A DIFFERENT ARGUMENT, WHICH IS THE POINT OF THE SERIES.
//
// The Allegheny study is a single-county piece about coverage: its two largest exposures sit
// outside the homeowners policy, so a cheap premium describes the policy rather than the place.
// This one is a screen across all 100 counties that narrows to three, and it is about timing
// rather than coverage. If the second piece had been the first piece with different variables,
// it would be the retired county pages again with better typography.
//
// -------------------------------------------------------------------------------------------
// WHAT WAS ABANDONED, AND WHY, because the first version of this study was wrong.
//
// The obvious North Texas story is that Collin and Denton have the newest housing stock of the 100
// counties and among the highest shares of households paying over $3,000 to insure it -- newest
// houses, biggest bills. That headline does not survive contact with the data.
//
// ACS table B25141 reports premiums in ABSOLUTE DOLLAR BANDS. A county of expensive houses puts
// more households above $3,000 whatever its weather does, so "share paying over $3,000" is partly
// a measure of home value. Hidalgo County is the tell: sixth-newest stock in the study, in Texas,
// under hail, and only 6.0% of its households are in the top band. Collin and Denton are affluent
// DFW suburbs and Hidalgo is not.
//
// Controlling for it needs ACS median home value (B25077) and CENSUS_API_KEY is empty in .env, so
// it could not be run. Rather than publish a headline a reporter could dismantle in one query, the
// premium figures are demoted to a limitation and the study is built on two measures that carry no
// wealth confound at all: when the housing was built (Census) and how often hail was recorded
// (NOAA). Both are counts of things, not dollars.
import fs from 'node:fs';
import path from 'node:path';
import { LOOKUP_CSS, lookupPayload, lookupMarkup, dataScript, JS_SCRIPT, embedDocument } from './lib/county-lookup.js';

const FIG = path.join(process.cwd(), 'docs', 'data', 'storm-and-premium-figures.json');
const RAW = path.join(process.cwd(), 'docs', 'data', 'storm-and-premium-yearbuilt.json');
const OUT = path.join(process.cwd(), 'docs', 'north-texas-roof-age.html');
const OUT_EMBED = path.join(process.cwd(), 'docs', 'north-texas-roof-age.embed.html');

const PUBLISHED = '6 September 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/north-texas-roof-age/';

const fig = JSON.parse(fs.readFileSync(FIG, 'utf8'));
const counties: any[] = fig.counties;
if (!fs.existsSync(RAW)) throw new Error('ABORT: year-built file missing -- run scripts/analyse-storm-and-premium.ts');
const yearBuilt: Record<string, Record<string, number>> = JSON.parse(fs.readFileSync(RAW, 'utf8'));

const DECADES = ['built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969',
  'built1970to1979', 'built1980to1989', 'built1990to1999', 'built2000to2009', 'built2010to2019', 'built2020OrLater'];
const LABELS = ['pre-1940', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

// The screen. Concentration is the largest share of a county's housing built in any single
// twenty-year window -- a blunt measure on purpose, because it is the one a reader can check.
type Row = { name: string; county: string; state: string; conc: number; era: string; hail: number; units: number; shares: number[] };
const rows: Row[] = counties.map((c) => {
  const yb = yearBuilt[c.geoid];
  if (!yb) throw new Error(`ABORT: no year-built data for ${c.county}, ${c.state}`);
  const units = c.housingUnits || 1;
  const shares = DECADES.map((k) => (yb[k] || 0) / units);
  let best = 0;
  for (let i = 0; i < shares.length - 1; i++) if (shares[i] + shares[i + 1] > shares[best] + shares[best + 1]) best = i;
  return {
    name: `${c.county.charAt(0)}${c.county.slice(1).toLowerCase()}, ${c.state}`,
    county: c.county, state: c.state,
    conc: shares[best] + shares[best + 1],
    era: `${LABELS[best]}–${LABELS[best + 1]}`,
    hail: c.hail, units: c.housingUnits, shares,
  };
});

const CONC_MIN = 0.45;
const HAIL_MIN = 100;
const survivors = rows.filter((r) => r.conc >= CONC_MIN && r.hail >= HAIL_MIN).sort((a, b) => b.hail - a.hail);
const denton = rows.find((r) => r.county === 'DENTON')!;
const collin = rows.find((r) => r.county === 'COLLIN')!;
const tarrant = rows.find((r) => r.county === 'TARRANT')!;
const dallas = rows.find((r) => r.county === 'DALLAS')!;

// Assertions, so a data refresh cannot quietly turn the argument into a different one.
if (survivors.length !== 3) throw new Error(`ABORT: screen returns ${survivors.length} counties, the piece says three`);
if (!survivors.some((r) => r.county === 'DENTON') || !survivors.some((r) => r.county === 'COLLIN')) {
  throw new Error('ABORT: Denton and Collin no longer survive the screen');
}
if (tarrant.conc >= CONC_MIN) throw new Error('ABORT: Tarrant now passes the concentration screen; the contrast breaks');

const dfwHail = denton.hail + collin.hail + tarrant.hail + dallas.hail;
const rankHail = (r: Row) => [...rows].sort((a, b) => b.hail - a.hail).findIndex((x) => x.county === r.county && x.state === r.state) + 1;
const rankConc = (r: Row) => [...rows].sort((a, b) => b.conc - a.conc).findIndex((x) => x.county === r.county && x.state === r.state) + 1;
const ord = (n: number) => { const t = n % 100; if (t >= 11 && t <= 13) return `${n}th`; return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`; };
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => v.toLocaleString('en-US');

// Counties that are just as concentrated but see almost no hail -- the control group that stops
// "half the houses are the same age" being read as the finding on its own.
const concentratedNoHail = rows.filter((r) => r.conc >= CONC_MIN && r.hail < 60).sort((a, b) => b.conc - a.conc).slice(0, 5);

const bars = (r: Row) => r.shares.map((s, i) => `      <div class="bar-row">
        <span class="bar-label">${LABELS[i]}</span>
        <span class="bar" style="width:${Math.max(1, Math.round((s / 0.30) * 100))}%"></span>
        <span class="bar-val">${(s * 100).toFixed(1)}%</span>
      </div>`).join('\n');

const survivorRows = survivors.map((r) => `      <tr${r.state === 'TX' ? ' class="me"' : ''}>
        <td>${r.name}</td><td class="n">${pct(r.conc)}</td><td>${r.era}</td>
        <td class="n">${num(r.hail)}</td><td class="n">${num(r.units)}</td>
      </tr>`).join('\n');

const controlRows = concentratedNoHail.map((r) => `      <tr>
        <td>${r.name}</td><td class="n">${pct(r.conc)}</td><td>${r.era}</td><td class="n">${num(r.hail)}</td>
      </tr>`).join('\n');

const allRows = [...rows].sort((a, b) => b.conc - a.conc).map((r, i) => `      <tr${r.conc >= CONC_MIN && r.hail >= HAIL_MIN ? ' class="me"' : ''}>
        <td class="n">${i + 1}</td><td>${r.name}</td><td class="n">${pct(r.conc, 0)}</td>
        <td>${r.era}</td><td class="n">${num(r.hail)}</td></tr>`).join('\n');

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
  .fig b{display:block;font:700 1.65rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
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
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:1.6rem;margin:0 0 .4rem}
  .cols h4{font:700 12px/1.3 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem;color:#1a1a1a}
  .bar-row{display:grid;grid-template-columns:4.6rem 1fr 3rem;align-items:center;gap:.4rem;margin-bottom:.3rem;font:400 11px/1.3 ui-sans-serif,system-ui,sans-serif}
  .bar-label{color:#4a4a4a}
  .bar{height:10px;background:#8a6d3b;display:block;min-width:2px}
  .bar-val{text-align:right;font-variant-numeric:tabular-nums;color:#4a4a4a}
  .cite{background:#f5f2ec;border:1px solid #e5e0d8;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6d3b;margin-bottom:.5rem}
  .snippet{background:#fff;border:1px solid #e5e0d8;padding:.7rem .8rem;margin:.7rem 0;overflow-x:auto;font:400 11.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#4a4a4a;white-space:pre}
  .cite code{font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;padding:.1em .3em;border:1px solid #e5e0d8}
  .wrap a{color:#8a6d3b}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e5e0d8;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
${LOOKUP_CSS}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}.cols{grid-template-columns:1fr;gap:1.2rem}}
</style>

<div class="wrap">
  <p class="kicker">Regional analysis &middot; Collin and Denton counties, north of Dallas&ndash;Fort Worth</p>
  <h1>Built together, due together</h1>
  <p class="standfirst">Half the houses in Collin and Denton counties &mdash; McKinney, Plano,
  Frisco, Denton, Lewisville and Flower Mound among them &mdash; went up inside the same twenty
  years, in one of the country's heaviest hail corridors. Roofs do not age one house at a time
  here. They age in a cohort, and the cohort comes due together.</p>

  <div class="figs">
    <div class="fig"><b>${pct(collin.conc)}</b><span>of Collin County's ${num(collin.units)} homes were built ${collin.era.replace('–', ' or ')}</span></div>
    <div class="fig"><b>${pct(denton.conc)}</b><span>the same for Denton County, the ${ord(rankConc(denton))} most concentrated stock of the 100</span></div>
    <div class="fig"><b>${num(dfwHail)}</b><span>hailstorms recorded across the four DFW counties, 2015&ndash;2024</span></div>
    <div class="fig"><b>${survivors.length} of 100</b><span>counties are both this concentrated and this hail-exposed</span></div>
  </div>

  ${LOOKUP_MARKUP}

  <h2>The screen</h2>
  <h3>Two conditions, applied to all ${counties.length} counties, leave three standing.</h3>

  <p>Take the share of a county's housing built in its busiest twenty-year window &mdash; a crude
  measure of whether the place went up gradually or in a burst. Then take the number of hailstorms
  NOAA recorded there between 2015 and 2024. Ask for at least ${pct(CONC_MIN, 0)} in one window and
  at least ${HAIL_MIN} hailstorms, and almost nothing qualifies.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Built in one 20 years</th><th>Which years</th><th class="n">Hailstorms</th><th class="n">Housing units</th></tr></thead>
      <tbody>
${survivorRows}
      </tbody>
    </table>
  </div>
  <p class="cap">All ${counties.length} counties screened. Two of the three survivors share a border.</p>

  <p>Denton ranks ${ord(rankHail(denton))} of the hundred for recorded hail and Collin
  ${ord(rankHail(collin))}. They are also the ${ord(rankConc(collin))} and
  ${ord(rankConc(denton))} most concentrated housing stocks in the study. Very few places in
  America are both.</p>

  <h2>Why concentration is not the finding on its own</h2>
  <h3>Plenty of counties were built in a burst. Almost none of them get hailed on.</h3>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Built in one 20 years</th><th>Which years</th><th class="n">Hailstorms</th></tr></thead>
      <tbody>
${controlRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The most concentrated housing stocks that see almost no hail. Brooklyn, San
  Francisco and Philadelphia are concentrated in pre-1940 construction; Fort Bend and Clark are
  modern, like Collin and Denton, but sit outside the hail corridor.</p>

  <p>That is the comparison that matters. Fort Bend County is more concentrated than either North
  Texas county &mdash; ${pct(rows.find((r) => r.county === 'FORT BEND')!.conc)} of its homes went up
  in the ${rows.find((r) => r.county === 'FORT BEND')!.era} &mdash; and recorded
  ${rows.find((r) => r.county === 'FORT BEND')!.hail} hailstorms in ten years against Denton's
  ${denton.hail}. Clark County, Nevada is built the same way and recorded
  ${rows.find((r) => r.county === 'CLARK')!.hail}. Synchronised construction is common. Synchronised
  construction under hail is not.</p>

  <h2>What that does to a roof</h2>
  <h3>The component hail destroys is the one with a fixed service life.</h3>

  <p>Hail damages roofs before it damages anything else, and an asphalt shingle roof has a finite
  life regardless of what the sky does &mdash; commonly quoted at fifteen to thirty years depending
  on product and installation. Insurers price on that directly: roof age is one of the few things an
  underwriter asks about a specific house, and past a certain age carriers move from replacement
  cost to actual cash value, raise the wind and hail deductible, or decline the risk. The same
  underwriting logic is what makes <a href="/guides/get-home-insurance-flat-roof/">a flat roof hard
  to insure</a>, where the age caps are shorter still.</p>

  <p>In a county where the housing arrived gradually, that is a rolling problem. Some roofs are new,
  some are old, and the replacement bill for the county is spread across every year. Allegheny
  County, Pennsylvania has housing from every decade and a largest single decade of
  ${pct(Math.max(...rows.find((r) => r.county === 'ALLEGHENY')!.shares))}, which is the ordinary case.</p>

  <div class="cols">
    <div>
      <h4>Collin County, TX</h4>
${bars(collin)}
    </div>
    <div>
      <h4>Allegheny County, PA</h4>
${bars(rows.find((r) => r.county === 'ALLEGHENY')!)}
    </div>
  </div>
  <p class="cap">Share of housing units by decade built. Bars scaled to 30%. Census ACS 5-year.</p>

  <div class="finding">
    <p>Collin and Denton did not arrive gradually. Over half of each county's housing went up in a
    single twenty-year window, which means the original roofs went on in that window too. They do
    not come due one house at a time; they come due together, in a place that records a hailstorm
    somewhere in the county roughly every ten days of the storm season.</p>
  </div>

  <h2>The county with the hail but not the timing</h2>
  <h3>Tarrant records more hail than either and does not have this problem in the same shape.</h3>

  <p>Tarrant County logged ${num(tarrant.hail)} hailstorms over the decade, ${ord(rankHail(tarrant))}
  of the ${counties.length} counties and more than Denton or Collin. But its housing is spread much
  more evenly &mdash; ${pct(tarrant.conc)} in its busiest twenty years, against Collin's
  ${pct(collin.conc)} &mdash; so Tarrant has the hail without the cohort. Its roofs were not all
  installed at once and do not expire at once.</p>

  <p>That difference is the whole argument. Hail frequency alone does not create a synchronised
  replacement wave, and neither does concentrated construction alone. It takes both, and across the
  ${counties.length} counties examined here only ${survivors.length} have both.</p>


  <h2>For newsrooms</h2>
  <h3>Free to reuse, including the underlying county data.</h3>

  <p>This analysis and its data are published under a Creative Commons Attribution 4.0 licence, so
  a newsroom can republish the figures, redraw the charts, or run its own cut without asking. Both
  source datasets are US Government works and public domain in their own right: the Census Bureau's
  American Community Survey year-structure-built estimates, and the NOAA Storm Events Database.
  The decade-by-decade housing counts behind the concentration figures are published as their own
  file, so the central number in this study can be recomputed rather than taken on trust.</p>

  <p>If you are looking for Dallas&ndash;Fort Worth hail statistics, Collin or Denton County
  housing data, or a count of hailstorms by county, this is the whole of what we hold. One caution
  before quoting it: decade of construction is not roof age, and this study makes no claim about
  how many roofs in either county are past their service life &mdash; the ACS does not track
  replacement.</p>

  <p>Happy to pull the same cut for Tarrant, Dallas, Wake or any other county in the file, walk
  through the method, or check a figure before it prints &mdash; hello@beforeregret.com. If you
  find an error, say so and it will be corrected on the page with a note.</p>

  <h2>Method</h2>
  <h3>How this was built.</h3>

  <p>Housing counts by decade of construction are American Community Survey 5-year estimates, year
  structure built, expressed as a share of total housing units. Concentration is the largest
  combined share of any two adjacent decade buckets &mdash; a twenty-year window that moves, not a
  fixed one. Hail counts are every county-tagged hail entry in NOAA's Storm Events Database for the
  ten calendar years 2015&ndash;2024. The comparison set is the ${counties.length} counties in
  ${fig.coverage.states} states with complete data.</p>

  <p>Raw hail counts are used rather than hail per square mile, for the reason set out in the
  companion study: across these counties, event density correlates with population density at a
  Spearman coefficient of ${fig.diagnostics.spearmanEventDensityVsPopulationDensity.toFixed(3)},
  because NOAA records reports and an unwitnessed storm is frequently never written down.</p>

  <h2>Limitations</h2>
  <h3>What this cannot tell you.</h3>

  <p>This study deliberately does not use insurance prices, and the reason is worth stating because
  the obvious version of this story does. ACS table B25141 reports premiums in absolute dollar
  bands, so a county of expensive houses places more households above $3,000 whatever its weather
  does. Collin and Denton do sit high on that measure, and they are also affluent; Hidalgo County
  has similarly new housing, sits in Texas, and has only 6.0% of households in the top band.
  Separating the two would need median home values, which are not in this dataset, so no claim is
  made here about what anyone pays.</p>

  <p>Decade of construction is not roof age. A roof installed in 2005 may have been replaced twice
  since, particularly after a hail claim, and the ACS does not track that. What the concentration
  measure establishes is when the housing &mdash; and therefore the first roof on it &mdash;
  arrived, which sets the clock rather than reading it.</p>

  <p>The twenty-year window is a choice. A fifteen- or thirty-year window would rank counties
  differently, and the full table below is published so a different threshold can be applied to the
  same numbers. The ${pct(CONC_MIN, 0)} and ${HAIL_MIN} cut-offs were chosen to be round, not to
  produce three survivors.</p>

  <p>Nothing here describes an individual property. Every figure is a county aggregate.</p>

  <h2>Appendix</h2>
  <h3>All ${counties.length} counties by housing concentration.</h3>

  <div class="scroll tall">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Peak 20yr</th><th>Years</th><th class="n">Hail</th></tr></thead>
      <tbody>
${allRows}
      </tbody>
    </table>
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;Built together, due together: synchronised housing construction and hail
    exposure in North Texas.&rdquo; Analysis of Census ACS year-built estimates and NOAA Storm
    Events across ${counties.length} US counties. Full county dataset:
    <a href="https://www.beforeregret.com/research/data/storm-and-premium-counties.csv">CSV</a> &middot;
    <a href="https://www.beforeregret.com/research/data/storm-and-premium-figures.json">JSON</a> &middot;
    <a href="https://www.beforeregret.com/research/data/storm-and-premium-yearbuilt.json">housing by decade</a>.
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
    it to resize with the content.
  </div>

  <footer class="spine">
    Sources: US Census Bureau, American Community Survey 5-year, year structure built; NOAA National
    Centers for Environmental Information, Storm Events Database, 2015&ndash;2024. All US Government
    works.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/allegheny-storm-premium/">Third Stormiest, Sixth Cheapest</a> &#183;
    <a href="/research/risk-without-price/">Risk Without Price</a> &#183;
    <a href="/research/risk-without-cover/">Risk Without Cover</a> &#183;
    <a href="/research/outside-the-zone/">Outside the Zone</a>
  </footer>
</div>
${DATA_SCRIPT}
${JS_SCRIPT}
`;

const embed = embedDocument(STUDY_URL, 'Built Together, Due Together', LOOKUP_MARKUP, DATA_SCRIPT);

if (!embed.includes('lk-caveat')) throw new Error('ABORT: embed lost its caveat');
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
if (!html.includes('lk-caveat')) throw new Error('ABORT: study page lost the lookup caveat');
if (!html.includes('id="alg-data"')) throw new Error('ABORT: study page lost the lookup data');

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
console.log(`wrote ${path.relative(process.cwd(), OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`wrote ${path.relative(process.cwd(), OUT_EMBED)}  (${(embed.length / 1024).toFixed(1)} KB)`);
console.log(`  survivors of the screen (${pct(CONC_MIN, 0)} + ${HAIL_MIN} hail): ${survivors.map((r) => r.name).join('; ')}`);
console.log(`  Collin ${pct(collin.conc)} ${collin.era} / hail ${collin.hail} | Denton ${pct(denton.conc)} / hail ${denton.hail} | Tarrant ${pct(tarrant.conc)} / hail ${tarrant.hail}`);
