// Generates docs/permit-pulse.html -- the study page for the monthly building-permit index.
//
//   npx tsx scripts/build-permit-pulse-study.ts
//
// Same contract as build-north-texas-study.ts: this emits a FRAGMENT, a <style> block followed by
// <div class="wrap">. scripts/prerender-research.tsx slices at that div, treats everything before
// it as head content, injects the press kit into the .cite block, and wraps the result in the site
// shell. Editing this file does not regenerate the page -- run it, then run the build.
//
// -----------------------------------------------------------------------------------------------
// EVERY NUMBER IS READ FROM docs/data/permit-pulse-figures.json AT RUN TIME. This page is republished
// every month against a new Census file, so a hand-typed figure would survive into a month where it
// is false. The assertions at the bottom fail the run rather than let that ship.
//
// The finding is a cancellation, and cancellations are the easiest thing in statistics to describe
// dishonestly. Three of the four size classes Census tracks FELL. The one that rose -- buildings of
// five units or more -- rose by enough to cancel the other three, which is how a year in which
// housing construction declined on three of four measures reports as +0.1% and gets written up as
// "flat". Every framing decision on this page follows from that: the headline is named as a
// composite, never as the finding.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FIG = path.join(ROOT, 'docs', 'data', 'permit-pulse-figures.json');
const OUT = path.join(ROOT, 'docs', 'permit-pulse.html');

if (!fs.existsSync(FIG)) throw new Error('ABORT: run scripts/build-permit-pulse.ts first');
const f = JSON.parse(fs.readFileSync(FIG, 'utf8'));

/**
 * Below this many single-family units in EITHER year, the lookup shows the counts and withholds
 * the percentage. Matches MIN_SF_FOR_PCT in scripts/inject-permit-pulse.ts deliberately: the county
 * guides and this page quote the same data and must not apply different standards to it.
 */
const MIN_SF_FOR_PCT = 50;

const num = (x: number) => x.toLocaleString('en-US');
const sgn = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x)}%`;
const dirWord = (x: number) => (x < 0 ? 'fell' : 'rose');

const nat = f.national;
const size = nat.bySize as Array<{ label: string; prior: number; current: number; changePct: number }>;
const fell = size.filter((s) => s.changePct < 0);
const rose = size.filter((s) => s.changePct > 0);

// The study's entire premise. If a future month does not have this shape, the prose below is wrong.
if (rose.length !== 1 || !/5\+/.test(rose[0].label)) {
  throw new Error(`ABORT: ${rose.length} size class(es) rose (${rose.map((r) => r.label).join(', ')}). ` +
    'This page is written around exactly one rising class, 5+ units. Rewrite the prose before republishing.');
}

const period = new Date(`${f.period.yearToDateThrough}-01T00:00:00Z`)
  .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
const year = f.period.yearToDateThrough.slice(0, 4);
const priorYear = f.period.comparedWith.slice(0, 4);
const states = new Set(f.counties.map((c: any) => c.state)).size;

const byHouses = [...f.counties].filter((c: any) => c.sfPrior >= 250)
  .sort((a: any, b: any) => a.sfChangePct - b.sfChangePct);
const worstHouses = byHouses.slice(0, 12);
const bestHouses = [...byHouses].reverse().slice(0, 12);
const misleading = f.counties.filter((c: any) => c.headlineMisleading)
  .sort((a: any, b: any) => b.unitsCurrent - a.unitsCurrent).slice(0, 12);

const row = (c: any, i?: number) => `      <tr>${i !== undefined ? `<td class="n">${i + 1}</td>` : ''}` +
  `<td>${c.county}, ${stAbbr(c.state)}</td><td class="n">${num(c.sfPrior)}</td>` +
  `<td class="n">${num(c.sfCurrent)}</td><td class="n">${sgn(c.sfChangePct)}</td>` +
  `<td class="n">${sgn(c.unitsChangePct)}</td></tr>`;

const FIPS_ST: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
  '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY', '72': 'PR',
};
function stAbbr(fips: string) { return FIPS_ST[fips] ?? fips; }

// Compact payload for the county lookup: name, houses prior/current/%, total %, reported share.
const lookup = f.counties
  .map((c: any) => ({
    n: `${c.county}, ${stAbbr(c.state)}`,
    a: c.sfPrior, b: c.sfCurrent, s: c.sfChangePct, t: c.unitsChangePct, r: c.reportedShare,
  }))
  .sort((x: any, y: any) => x.n.localeCompare(y.n));

const html = `<style>
  .wrap{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.65 Charter,Georgia,'Times New Roman',serif;color:#1a1a1a}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#2f6f5e;margin:0 0 .9rem}
  .wrap h1{font-size:2.35rem;line-height:1.12;margin:0 0 1rem;font-weight:600;letter-spacing:-.015em}
  .standfirst{font-size:1.16rem;line-height:1.6;color:#3d3d3d;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#2f6f5e;margin:2.75rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #dfe5e2}
  .wrap h3{font-size:1.32rem;line-height:1.35;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;background:#dfe5e2;border:1px solid #dfe5e2;margin:0 0 2rem}
  .fig{background:#fbfcfb;padding:1rem .9rem}
  .fig b{display:block;font:700 1.65rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .fig span{display:block;font:400 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin-top:.3rem}
  .finding{background:#f5f9f7;border-left:3px solid #2f6f5e;padding:1.1rem 1.2rem;margin:0 0 1.4rem;font-size:1.02rem}
  .finding p{margin:0}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1a1a1a;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #eaefec;padding:.45rem .4rem}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1.6rem}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:0 0 1.8rem}
  .sizes{margin:0 0 1.6rem}
  .srow{display:grid;grid-template-columns:8.5rem 1fr 4.2rem;align-items:center;gap:.5rem;margin-bottom:.45rem;font:400 12px/1.3 ui-sans-serif,system-ui,sans-serif}
  .slabel{color:#4a4a4a}
  .stray{position:relative;height:14px;background:#eef2f0}
  .sbar{position:absolute;top:0;bottom:0;display:block}
  .sbar.dn{background:#b4453a;right:50%}
  .sbar.up{background:#2f6f5e;left:50%}
  .szero{position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#9aa8a2}
  .sval{text-align:right;font-variant-numeric:tabular-nums;color:#4a4a4a}
  .lk{border:1px solid #dfe5e2;background:#fbfcfb;padding:1rem 1.1rem;margin:0 0 1.6rem}
  .lk input{width:100%;padding:.55rem .65rem;font:400 14px ui-sans-serif,system-ui,sans-serif;border:1px solid #c9d4cf;background:#fff;color:#1a1a1a}
  .lk .out{margin-top:.8rem;font:400 13px/1.55 ui-sans-serif,system-ui,sans-serif}
  .lk .hit{padding:.5rem 0;border-bottom:1px solid #eaefec}
  .lk .hit b{font-size:14px}
  .lk .muted{color:#6b6b6b}
  .cite{background:#f2f6f4;border:1px solid #dfe5e2;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2f6f5e;margin-bottom:.5rem}
  .cite code{font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;padding:.1em .3em;border:1px solid #dfe5e2}
  .wrap a{color:#2f6f5e}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #dfe5e2;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}.srow{grid-template-columns:6.5rem 1fr 3.6rem}}
</style>

<div class="wrap">
  <p class="kicker">Monthly index &middot; US Census Building Permits Survey &middot; year to date through ${period} ${year}</p>
  <h1>Flat on top, falling underneath</h1>
  <p class="standfirst">American residential building permits are almost exactly level with last
  year &mdash; ${num(nat.all.prior)} units against ${num(nat.all.current)}, a change of
  ${sgn(nat.all.changePct!)}. That number is a composite of two opposite movements, and it is the
  only one most people will read. Three of the four categories the Census Bureau counts
  ${dirWord(-1)}. The one that rose is apartment buildings.</p>

  <div class="figs">
    <div class="fig"><b>${sgn(nat.all.changePct!)}</b><span>all permitted units, year to date ${priorYear} against ${year}</span></div>
    <div class="fig"><b>${sgn(size[0].changePct)}</b><span>single-family houses, ${num(size[0].prior)} to ${num(size[0].current)} units</span></div>
    <div class="fig"><b>${sgn(size[3].changePct)}</b><span>buildings of five units or more</span></div>
    <div class="fig"><b>${f.findings.countiesHousesFell} of ${f.findings.eligibleCounties}</b><span>counties where house permits fell</span></div>
  </div>

  <h2>Finding 01</h2>
  <h3>Three of the four categories fell. The fourth cancelled them.</h3>
  <div class="sizes">
${size.map((s) => {
  const w = Math.min(50, Math.round((Math.abs(s.changePct) / 12) * 50));
  return `    <div class="srow"><span class="slabel">${s.label}</span>` +
    `<span class="stray"><span class="sbar ${s.changePct < 0 ? 'dn' : 'up'}" style="width:${Math.max(1, w)}%"></span><span class="szero"></span></span>` +
    `<span class="sval">${sgn(s.changePct)}</span></div>`;
}).join('\n')}
  </div>
  <p class="cap">Change in permitted units by structure size, year to date through ${period}, ${priorYear} against ${year}. Source: US Census Bureau, Building Permits Survey.</p>
  <p>Single-family permits are ${sgn(size[0].changePct)}, from ${num(size[0].prior)} to
  ${num(size[0].current)} units. Two-unit buildings are ${sgn(size[1].changePct)}; three- and
  four-unit buildings ${sgn(size[2].changePct)}. Only buildings of five units or more rose, by
  ${sgn(size[3].changePct)} &mdash; ${num(size[3].current - size[3].prior)} additional units, which
  is more than enough to offset the ${num(size[0].prior - size[0].current)} houses that were not
  permitted this year.</p>
  <div class="finding"><p>A year in which three of four construction categories declined reports as
  ${sgn(nat.all.changePct!)} and is described as flat. The composite is not wrong. It is just not
  about houses.</p></div>

  <h2>Finding 02</h2>
  <h3>Half of the counties we can measure are building fewer houses</h3>
  <p>Of the ${f.findings.eligibleCounties} counties with enough permitting volume and enough
  directly reported data to measure (see the method note below),
  ${f.findings.countiesHousesFell} &mdash;
  ${Math.round((100 * f.findings.countiesHousesFell) / f.findings.eligibleCounties)}% &mdash;
  permitted fewer single-family homes than in the same months of ${priorYear}. This is not
  concentrated in one region: those counties sit across ${states} states.</p>

  <h2>Finding 03</h2>
  <h3>In ${f.findings.countiesTotalUpHousesFell} counties, "permits are up" means houses are down</h3>
  <p>${f.findings.countiesTotalUp} of the eligible counties permitted more housing units this year
  than last. In ${f.findings.countiesTotalUpHousesFell} of them &mdash;
  ${Math.round((100 * f.findings.countiesTotalUpHousesFell) / f.findings.countiesTotalUp)}% &mdash;
  single-family permits fell at the same time. In those places a true statement about the local
  permit total carries the opposite implication about the house market.</p>
  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Houses ${priorYear}</th><th class="n">Houses ${year}</th><th class="n">Houses</th><th class="n">All units</th></tr></thead>
      <tbody>
${misleading.map((c: any) => row(c)).join('\n')}
      </tbody>
    </table>
  </div>
  <p class="cap">The ${Math.min(12, misleading.length)} largest counties by permit volume where the total rose and single-family fell. Full list in the CSV below.</p>

  <h2>Your county</h2>
  <h3>Look up any of the ${f.findings.eligibleCounties} counties</h3>
  <div class="lk">
    <input id="pp-q" type="search" placeholder="Type a county name &mdash; Dallas, Cook, King&hellip;" autocomplete="off" aria-label="Search counties">
    <div class="out" id="pp-out"><span class="muted">${f.findings.eligibleCounties} counties across ${states} states.</span></div>
  </div>

  <h2>Where houses fell hardest</h2>
  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Houses ${priorYear}</th><th class="n">Houses ${year}</th><th class="n">Houses</th><th class="n">All units</th></tr></thead>
      <tbody>
${worstHouses.map((c: any, i: number) => row(c, i)).join('\n')}
      </tbody>
    </table>
  </div>
  <p class="cap">Counties permitting at least 250 houses in ${priorYear}, ranked by change in single-family permits. Restricting to counties of that size keeps the ranking from filling up with places where a dozen houses is a large percentage.</p>

  <h2>Where houses rose most</h2>
  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Houses ${priorYear}</th><th class="n">Houses ${year}</th><th class="n">Houses</th><th class="n">All units</th></tr></thead>
      <tbody>
${bestHouses.map((c: any, i: number) => row(c, i)).join('\n')}
      </tbody>
    </table>
  </div>
  <p class="cap">Same population and the same ranking, reversed.</p>

  <h2>Method</h2>
  <p>The Census Bureau's Building Permits Survey publishes residential permits for every US county
  each month. This compares the year-to-date file through ${period} ${year} against the file for the
  same months of ${priorYear}, so the two cover identical calendar windows. Both are linked below.
  Counties are joined on FIPS code, never on name: Harris County is 48201 in Texas and 13145 in
  Georgia, and the two report very differently.</p>
  <p>Of the ${num(f.countiesInFile)} counties in the file, ${f.findings.eligibleCounties} are
  reported here. The rest are withheld for one of two reasons, both of which would otherwise
  produce numbers that look precise and are not.</p>
  <p><b>Too small to express as a percentage.</b> ${num(f.gates.suppressedThin)} counties permitted
  fewer than ${f.gates.minUnits} units in either year. In a county that permitted eleven houses,
  one subdivision is a ninety-percent swing.</p>
  <p><b>Too much of the number is estimated.</b> The Census Bureau imputes permit counts for
  offices that do not report, and the file marks which units were actually reported.
  ${num(f.gates.suppressedImputed)} counties fall below
  ${Math.round(f.gates.minReportedShare * 100)}% directly reported and are withheld. Some are
  entirely modelled: the file carries hundreds of units for counties where no permit office
  reported anything at all. Those are estimates of a county, not a record of it, and they are not
  used here.</p>

  <h2>What this does not show</h2>
  <p><b>Permits are not completions.</b> A permit is an intention to build, filed at the start.
  Some of these units will not be finished, and the ones that are will be finished across several
  years.</p>
  <p><b>Units are not buildings.</b> The apartment figures count units, so a single approval can
  move a county by hundreds. The house figures count buildings and units together, because a
  single-family permit is one of each.</p>
  <p><b>This is a count, not an explanation.</b> Interest rates, land cost, local zoning changes,
  labour, insurance and disaster rebuilding all plausibly contribute to any county's movement, and
  nothing here separates them. Where a county's figure looks dramatic, the cause is usually local
  and specific, and finding it means reading that county's own records.</p>
  <p><b>Year-to-date figures are revised.</b> The Census Bureau revises earlier months as late
  reports arrive, so a county's figure here may differ slightly from the same county next month.
  This page is rebuilt against the current file each month rather than corrected in place.</p>

  <div class="cite">
    <b>Cite it, check it, take it apart</b>
    <p style="margin:0 0 .6rem">Free to reuse with attribution under
    <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Every figure on this page
    is computed by BeforeRegret from the Census Bureau files named below. Nothing is restated from
    another publisher, and the derived table is published so the arithmetic can be checked.</p>
    <p style="margin:0 0 .6rem">Source files:
    <a href="${f.sourceUrls[0]}"><code>${f.sourceUrls[0].split('/').pop()}</code></a> and
    <a href="${f.sourceUrls[1]}"><code>${f.sourceUrls[1].split('/').pop()}</code></a>,
    US Census Bureau, Building Permits Survey.</p>
  </div>

  <footer class="spine">
    <p style="margin:0">Published by <a href="https://www.beforeregret.com/">Before Regret</a>.
    Data through ${period} ${year}; this index is rebuilt monthly.</p>
  </footer>
</div>

<script type="application/json" id="pp-data">${JSON.stringify(lookup)}</script>
<script>
(function(){
  var el=document.getElementById('pp-data'); if(!el) return;
  var rows=JSON.parse(el.textContent||'[]');
  var q=document.getElementById('pp-q'), out=document.getElementById('pp-out');
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function pc(v){return (v>0?'+':v<0?'\\u2212':'')+Math.abs(v)+'%';}
  function render(){
    var t=(q.value||'').trim().toLowerCase();
    if(t.length<2){out.innerHTML='<span class="muted">${f.findings.eligibleCounties} counties across ${states} states.</span>';return;}
    var hits=rows.filter(function(r){return r.n.toLowerCase().indexOf(t)>-1;}).slice(0,8);
    if(!hits.length){out.innerHTML='<span class="muted">No county matching that name carries a usable figure. It may be below the size or reporting thresholds described in the method note.</span>';return;}
    out.innerHTML=hits.map(function(r){
      // The county gate is on TOTAL units, so a county can qualify on apartments while permitting
      // almost no houses -- Harrisonburg VA passes on total and went 55 houses to 8, which renders
      // as "-85.5%" and means nothing. Below MIN_SF the counts are shown and the percentage is not,
      // the same rule the county-guide blocks follow. Without this the two disagree.
      var sf = (r.a >= ${MIN_SF_FOR_PCT} && r.b >= ${MIN_SF_FOR_PCT})
        ? ' ('+pc(r.s)+')'
        : ' <span class="muted">(too few houses to express as a percentage)</span>';
      return '<div class="hit"><b>'+esc(r.n)+'</b><br><span class="muted">houses '+r.a.toLocaleString()+' &rarr; '+r.b.toLocaleString()+sf+' &middot; all units '+pc(r.t)+' &middot; '+r.r+'% directly reported</span></div>';
    }).join('');
  }
  q.addEventListener('input',render);
})();
</script>
`;

// --- assertions: the page must not be able to disagree with its own data ------------------------
const mustAppear = [
  num(nat.all.prior), num(nat.all.current), num(size[0].prior), num(size[0].current),
  String(f.findings.eligibleCounties), String(f.findings.countiesHousesFell),
  String(f.findings.countiesTotalUpHousesFell),
];
for (const v of mustAppear) {
  if (!html.includes(v)) throw new Error(`ABORT: ${v} is in the data but not on the page`);
}
if (/\b(20[0-9]{2})-(0[0-9]|1[0-2])\b/.test(html.replace(/permit-pulse|co[0-9]{4}y/g, ''))) {
  // a raw YYYY-MM anywhere in prose means a period escaped the formatter
  console.warn('  note: a raw YYYY-MM appears in the output; check it is inside a URL or filename');
}
if (!html.includes('<div class="cite">')) throw new Error('ABORT: no .cite block for the press kit to attach to');
if (!html.includes('<div class="wrap">')) throw new Error('ABORT: prerender-research.tsx slices at <div class="wrap">');

fs.writeFileSync(OUT, html);
console.log(`wrote ${path.relative(ROOT, OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`  period      ${f.period.yearToDateThrough} vs ${f.period.comparedWith}`);
console.log(`  headline    all ${sgn(nat.all.changePct!)}, houses ${sgn(size[0].changePct)}, 5+ ${sgn(size[3].changePct)}`);
console.log(`  counties    ${f.findings.eligibleCounties} eligible across ${states} states`);
console.log(`  size classes that fell: ${fell.length} of 4 (${fell.map((s) => s.label).join(', ')})`);
