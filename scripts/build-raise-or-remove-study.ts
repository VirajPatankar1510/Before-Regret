// Generates docs/raise-or-remove.html and its embed.
//
//   npx tsx scripts/analyse-raise-or-remove.ts   # must run first
//   npx tsx scripts/build-raise-or-remove-study.ts
//
// -------------------------------------------------------------------------------------------
// A THIRD SHAPE, deliberately.
//
// The Allegheny study is a single county argued from coverage. North Texas is a screen across a
// hundred counties argued from timing. This one is national and argued from a test that failed:
// the obvious reading of the data is wrong, and what survives the check is the finding. The page
// is built in that order -- claim, disconfirmation, what is left -- because that is the order the
// analysis actually went in, and because a reader who can see the confound being handled has a
// reason to trust the number that follows it.
//
// -------------------------------------------------------------------------------------------
// WHAT IS NEW HERE, stated plainly because the honest version is narrower than the exciting one.
//
// FEMA buyouts are not an unexamined subject. NRDC and Climate Central have both published on
// acquisitions, and any claim to have discovered them would be wrong. Three things in this study
// are new as far as I can establish: the decision cut by FOUNDATION TYPE, the split between the
// five states that use elevation and the twenty that effectively do not, and the framing for
// someone deciding whether to buy a house rather than someone writing policy.
//
// The last of those is why it belongs here and not on a climate desk. Foundation type is an
// inspection finding. Nobody else writes for the person standing in a crawl space.
import fs from 'node:fs';
import path from 'node:path';

const FIG = path.join(process.cwd(), 'docs', 'data', 'raise-or-remove-figures.json');
const ZIPS = path.join(process.cwd(), 'docs', 'data', 'raise-or-remove-zips.json');
const OUT = path.join(process.cwd(), 'docs', 'raise-or-remove.html');
const OUT_EMBED = path.join(process.cwd(), 'docs', 'raise-or-remove.embed.html');

const PUBLISHED = '7 September 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/raise-or-remove/';
const TITLE_SHORT = 'Raise or Remove';

const f = JSON.parse(fs.readFileSync(FIG, 'utf8'));
const zips: Array<any> = JSON.parse(fs.readFileSync(ZIPS, 'utf8'));

const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => v.toLocaleString('en-US');
const FOUND_LABEL: Record<string, string> = {
  'Elevated on Piers, Piles, Posts or Columns': 'Piers, piles or columns',
  'Slab on Grade': 'Slab on grade',
  'Crawl Space': 'Crawl space',
  Basement: 'Basement',
};

const A = f.regimes.elevating;
const B = f.regimes.removing;
const elevatingStates = f.states.filter((s: any) => s.demolishedShare < f.regimes.cutoff);
const removingStates = f.states.filter((s: any) => s.demolishedShare >= f.regimes.cutoff);

// Assertions, so a data refresh cannot leave the prose describing a finding the numbers no longer
// support. Each mirrors a sentence that appears on the page.
if (elevatingStates.length !== 5) throw new Error(`ABORT: ${elevatingStates.length} elevating states, the piece says five`);
if (A.byFoundation.length < 4 || B.byFoundation.length < 4) throw new Error('ABORT: a foundation row dropped below the reporting threshold');
if (f.scope.demolishedShare < 0.70) throw new Error('ABORT: the headline demolition share has moved below 70%');
const lo = A.byFoundation[0];
const hi = A.byFoundation[A.byFoundation.length - 1];
if (!/Piers/.test(lo.foundation) || hi.foundation !== 'Basement') throw new Error('ABORT: the foundation gradient no longer runs piers -> basement');

const foundationRows = (t: any) => t.byFoundation.map((x: any) => `      <tr>
        <td>${FOUND_LABEL[x.foundation] ?? x.foundation}</td>
        <td class="n">${num(x.n)}</td><td class="n">${pct(x.demolishedShare)}</td>
        <td class="bar"><span style="width:${Math.round(x.demolishedShare * 100)}%"></span></td>
      </tr>`).join('\n');

const stateRows = f.states.map((s: any) => `      <tr${s.demolishedShare < f.regimes.cutoff ? ' class="me"' : ''}>
        <td>${s.state}</td><td class="n">${num(s.n)}</td><td class="n">${pct(s.demolishedShare)}</td>
        <td class="bar"><span style="width:${Math.round(s.demolishedShare * 100)}%"></span></td>
      </tr>`).join('\n');

const lookupData = zips.map((z) => ({ z: z.zip, s: z.state, c: z.county, n: z.n, d: z.demolished, r: z.raised, a: z.firstYear, b: z.lastYear }));

const LOOKUP_CSS = `
  .lookup{border:1px solid #e0dcd3;background:#fbfaf7;padding:1.1rem 1.2rem;margin:0 0 2.2rem}
  .lk-eyebrow{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#7d5f3c;margin:0 0 .7rem}
  .lookup input{width:100%;font:400 15px/1.4 ui-sans-serif,system-ui,sans-serif;padding:.55rem .6rem;border:1px solid #cbc3b6;background:#fff;color:#1a1a1a;border-radius:2px}
  .lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7rem,1fr));gap:1px;background:#e0dcd3;border:1px solid #e0dcd3;margin:.9rem 0 0}
  .lk-cell{background:#fbfaf7;padding:.65rem .7rem}
  .lk-cell b{display:block;font:700 1.3rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .lk-cell span{display:block;font:400 11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin-top:.25rem}
  .lk-msg{font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.8rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;

const LOOKUP_MARKUP = `<div class="lookup">
    <p class="lk-eyebrow">Look up a ZIP code</p>
    <label for="rrzip" style="position:absolute;left:-9999px">Five-digit ZIP code</label>
    <input id="rrzip" type="text" inputmode="numeric" maxlength="5" placeholder="Enter a 5-digit ZIP code&hellip;" autocomplete="postal-code">
    <div id="rrout" aria-live="polite"></div>
    <p class="lk-caveat">Covers the ${num(zips.length)} ZIP codes with at least five FEMA-funded
    decisions on single-family homes. A ZIP with no result is not a ZIP with no flooding &mdash; it
    is one where FEMA did not fund this kind of work, or funded fewer than five. These are grant
    records, not a register of every home bought or raised in America.</p>
  </div>`;

const DATA_SCRIPT = `<script type="application/json" id="rr-data">${JSON.stringify(lookupData)}</script>`;

const JS_SCRIPT = `<script>
(function(){
  var d=JSON.parse(document.getElementById('rr-data').textContent),m={};
  d.forEach(function(x){m[x.z]=x;});
  var i=document.getElementById('rrzip'),o=document.getElementById('rrout');
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  function unit(st){return st==='Louisiana'?' Parish':st==='Alaska'?' Borough':' County';}
  i.addEventListener('input',function(){
    var v=i.value.replace(/[^0-9]/g,'').slice(0,5);
    if(v!==i.value)i.value=v;
    if(v.length<5){o.innerHTML='';return;}
    var x=m[v];
    if(!x){o.innerHTML='<p class="lk-msg">No FEMA-funded acquisition or elevation of single-family homes on record for '+v+', or fewer than five.</p>';return;}
    var share=Math.round(x.d/x.n*1000)/10;
    o.innerHTML='<div class="lk-grid">'
      +cell(x.n,'homes bought or raised')
      +cell(x.d,'demolished after purchase')
      +cell(x.r,'raised in place')
      +cell(share.toFixed(1)+'%','were removed, not raised')
      +'</div><p class="lk-msg">'+x.c+unit(x.s)+', '+x.s+' &middot; grant years '+x.a+'&ndash;'+x.b+'</p>';
  });
})();
</script>`;

const html = `<style>
  .wrap{max-width:45rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.68 Charter,Georgia,'Times New Roman',serif;color:#191919}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#7d5f3c;margin:0 0 .9rem}
  .wrap h1{font-size:2.4rem;line-height:1.1;margin:0 0 1rem;font-weight:600;letter-spacing:-.02em}
  .standfirst{font-size:1.17rem;line-height:1.6;color:#3a3a3a;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#7d5f3c;margin:2.8rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #e0dcd3}
  .wrap h3{font-size:1.34rem;line-height:1.34;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr));gap:1px;background:#e0dcd3;border:1px solid #e0dcd3;margin:0 0 2rem}
  .fig{background:#fbfaf7;padding:1rem .9rem}
  .fig b{display:block;font:700 1.7rem/1.05 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.025em}
  .fig span{display:block;font:400 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin-top:.3rem}
  .finding{background:#f7f4ee;border-left:3px solid #7d5f3c;padding:1.1rem 1.2rem;margin:0 0 1.4rem;font-size:1.02rem}
  .finding p{margin:0}
  .finding p+p{margin-top:.8rem}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem}
  th{text-align:left;font-weight:700;border-bottom:2px solid #191919;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  td.bar{width:34%;padding-right:0}
  td.bar span{display:block;height:9px;background:#7d5f3c;min-width:2px}
  tr.me td{background:#fdf7ea;font-weight:700}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1.5rem}
  .tall{max-height:24rem;overflow-y:auto}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:0 0 1.9rem}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:1.7rem;margin:0 0 .4rem}
  .split h4{font:700 12px/1.3 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem;color:#191919;text-transform:uppercase;letter-spacing:.06em}
  .cite{background:#f4f1ea;border:1px solid #e0dcd3;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.4rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:#7d5f3c;margin-bottom:.5rem}
  .snippet{background:#fff;border:1px solid #e0dcd3;padding:.7rem .8rem;margin:.7rem 0;overflow-x:auto;font:400 11.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#4a4a4a;white-space:pre}
  .cite code{font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;padding:.1em .3em;border:1px solid #e0dcd3}
  .wrap a{color:#7d5f3c}

  .cta{border:1px solid #d8d0c2;background:#fdfbf6;padding:1.3rem 1.4rem;margin:0 0 2.4rem}
  .cta h4{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#7d5f3c;margin:0 0 .7rem}
  .cta p{font:400 14.5px/1.62 ui-sans-serif,system-ui,sans-serif;color:#2e2e2e;margin:0 0 .9rem}
  .cta p.small{font-size:12.5px;color:#6a6a6a;margin:0}
  .cta a.btn{display:inline-block;background:#7d5f3c;color:#fff;font:700 14px/1 ui-sans-serif,system-ui,sans-serif;padding:.75rem 1.1rem;border-radius:2px;text-decoration:none}
  .cta a.btn:hover{background:#66492b}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e0dcd3;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a}
${LOOKUP_CSS}
  @media(max-width:560px){.wrap h1{font-size:1.9rem}.split{grid-template-columns:1fr;gap:1.3rem}}
</style>

<div class="wrap">
  <p class="kicker">National analysis &middot; ${num(f.scope.decisions)} federal decisions, ${f.source.fiscalYears[0]}&ndash;${f.source.fiscalYears[1]}</p>
  <h1>Raise or remove</h1>
  <p class="standfirst">When a house floods badly enough for the federal government to intervene,
  there are two outcomes: it gets lifted, or it gets bought and knocked down. Across
  ${num(f.scope.decisions)} single-family homes, demolition won ${f.scope.ratio.toFixed(1)} times
  out of every one elevation. Which one your house gets is decided first by your state, and only
  then by what it stands on.</p>

  <div class="figs">
    <div class="fig"><b>${num(f.scope.demolished)}</b><span>single-family homes bought and demolished</span></div>
    <div class="fig"><b>${num(f.scope.raised)}</b><span>raised in place instead</span></div>
    <div class="fig"><b>${elevatingStates.length} of ${f.states.length}</b><span>states do nearly all the elevating</span></div>
    <div class="fig"><b>${pct(A.byFoundation[A.byFoundation.length - 1].demolishedShare, 0)}</b><span>of basement homes are removed even in those states</span></div>
  </div>

  ${LOOKUP_MARKUP}

  <div class="cta">
    <h4>A ZIP code is not a house</h4>
    <p>Everything above is an aggregate. It cannot tell you whether the house you are looking at
    floods, whether it has ever been damaged, or whether it would be bought or raised &mdash; and a
    ZIP with a long grant history contains plenty of homes that have never taken on water.</p>
    <p>What we can do for one address is narrower and more useful than a map: pull live USGS
    seismic design values for the parcel, confirm the address resolves to a residential property,
    and build inspection priorities and seller questions specific to that county and that era of
    construction. Anything not independently verified is labelled as such rather than guessed at.</p>
    <p><a class="btn" href="/">Run a free property report</a></p>
    <p class="small">First report free, no card. Additional reports $14.99. It does not pull permit
    records, flood-zone determinations or dam inundation mapping &mdash; no per-address source for
    those exists behind this site, and the guides explain how to obtain them yourself.</p>
  </div>

  <h2>The record</h2>
  <h3>Two outcomes, one lopsided ledger.</h3>

  <p>FEMA publishes every property its hazard mitigation grants have paid to alter or remove.
  Filtered to single-family houses facing water &mdash; where the choice was acquisition and
  demolition, or elevation &mdash; the file holds ${num(f.scope.decisions)} decisions across
  ${num(f.scope.counties)} counties and ${num(f.scope.zips)} ZIP codes, spanning fiscal
  ${f.source.fiscalYears[0]} to ${f.source.fiscalYears[1]}.</p>

  <p>${pct(f.scope.demolishedShare)} of them ended with the house gone. That is the first thing
  worth sitting with: the federal response to a repeatedly flooded home is usually not to make it
  survivable. It is to remove it and leave the lot empty.</p>

  <h2>The obvious explanation, and why it fails</h2>
  <h3>Basements look decisive until you check whether it is really the basement.</h3>

  <p>Sorted by foundation, the national numbers are tidy. Homes with basements were demolished
  93.4% of the time; homes already standing on piers or piles, 46.3%. It reads as engineering:
  you cannot easily lift a house with a hole under it, so those houses go.</p>

  <p>That reading does not survive a simple check. Louisiana has pier-built housing and raises
  houses. Iowa has basements and demolishes them. If the states that build one way are also the
  states that choose one way, foundation would look decisive while explaining nothing.</p>

  <p>So the same question has to be asked inside states rather than across them &mdash; and doing
  that splits the country before it says anything about foundations at all.</p>

  <h2>Five states, and everyone else</h2>
  <h3>Elevation is not a national policy. It is a regional one.</h3>

  <p>Ranked by how often they demolish, the ${f.states.length} states with at least
  ${f.regimes.minStateN} decisions do not form a spectrum. They form two groups with an empty gap
  between them: five states sit between ${pct(f.states[0].demolishedShare)} and
  ${pct(elevatingStates[elevatingStates.length - 1].demolishedShare)}, then nothing until
  ${pct(removingStates[0].demolishedShare)}, after which twenty states run up to 100%.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>State</th><th class="n">Decisions</th><th class="n">Demolished</th><th></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Highlighted rows are the ${elevatingStates.length} states that use elevation. The
  dividing line is drawn at ${pct(f.regimes.cutoff, 0)}, and it can be moved anywhere between 55%
  and 70% without a single state changing group.</p>

  <p>Eight states out of twenty-five demolish more than 97% of the time. Kansas and Oklahoma have
  never raised a single-family home with these grants &mdash; not rarely, never.</p>

  <h2>What the foundation decides</h2>
  <h3>It matters enormously, and only in five states.</h3>

  <div class="split">
    <div>
      <h4>Where elevation is used &mdash; ${num(A.decisions)} decisions</h4>
      <table>
        <thead><tr><th>Foundation</th><th class="n">n</th><th class="n">Removed</th><th></th></tr></thead>
        <tbody>
${foundationRows(A)}
        </tbody>
      </table>
    </div>
    <div>
      <h4>Where it is not &mdash; ${num(B.decisions)} decisions</h4>
      <table>
        <thead><tr><th>Foundation</th><th class="n">n</th><th class="n">Removed</th><th></th></tr></thead>
        <tbody>
${foundationRows(B)}
        </tbody>
      </table>
    </div>
  </div>
  <p class="cap">Share of homes bought and demolished rather than raised, by foundation type,
  within each group of states.</p>

  <div class="finding">
    <p>In the five states that elevate, the foundation moves the outcome by
    ${(f.regimes.foundationSpreadElevating * 100).toFixed(1)} points: a house on piers is removed
    ${pct(A.byFoundation[0].demolishedShare)} of the time, a house on a basement
    ${pct(A.byFoundation[A.byFoundation.length - 1].demolishedShare)}.</p>
    <p>In the other twenty the same range collapses to
    ${(f.regimes.foundationSpreadRemoving * 100).toFixed(1)} points around a base rate of
    ${pct(B.demolishedShare)}. How the house is built stops mattering, because the question of
    whether to save it is not being asked.</p>
  </div>

  <p>The order matters for anyone reading this about a specific house. Geography is the first
  filter and it is close to binary. Construction is the second, and it only gets a turn if the
  first one allows it.</p>

  <h2>Method</h2>
  <h3>What was counted.</h3>

  <p>Source is FEMA's Hazard Mitigation Assistance Mitigated Properties file, ${num(f.source.totalRecords)}
  records, downloaded in bulk from the OpenFEMA API. Rows are kept where the structure is
  single-family and the action was either acquisition and demolition, or elevation &mdash;
  ${num(f.scope.decisions)} of them. Safe rooms, wind retrofits, seismic retrofits, floodproofing,
  vacant-land purchases and non-residential structures are excluded: none of those is a choice
  between saving a house and removing it, and counting them would inflate the sample while blurring
  the question.</p>

  <p>A state is classed as using elevation when it demolishes in fewer than ${pct(f.regimes.cutoff, 0)}
  of its decisions, and only states with at least ${f.regimes.minStateN} decisions are ranked.
  Foundation shares are computed within each group rather than nationally, which is the whole point
  of the exercise. Fiscal year is the grant's year, not the year a house came down.</p>

  <h2>Limitations</h2>
  <h3>What this does not show.</h3>

  <p>These are federally funded decisions only. States, counties and cities run their own buyout
  programmes, and homeowners elevate houses privately every year; none of that is here. A ZIP with
  no record is not a ZIP where nothing happened.</p>

  <p>Nor is this a sample of flooded homes. A property appears because somebody applied for a grant
  and the application succeeded, so every figure describes the population of funded decisions and
  not the population of houses at risk. The direction of that bias is unknown.</p>

  <p>Foundation type is blank or recorded as "other" on ${num(f.dataQuality.foundationBlankOrOther)}
  rows, ${pct(f.dataQuality.foundationBlankShare)} of the set; those rows are excluded from the
  foundation tables and included everywhere else. A payment amount is present on only
  ${pct(f.dataQuality.amountPaidShare)} of rows, which is why no cost-per-decision figure appears
  anywhere in this study.</p>

  <p>One reading of the gradient is engineering rather than preference: lifting a house over a
  basement may simply be impractical, in which case the number describes a constraint and not a
  choice. This data cannot separate the two, and nothing here should be read as saying a state
  preferred to demolish a particular house.</p>

  <p>FEMA buyouts are not an unexamined subject &mdash; the Natural Resources Defense Council and
  Climate Central have both published analyses of acquisitions. What appears to be new here is the
  cut by foundation type and the two-regime split, not the existence of the programme.</p>

  <h2>Appendix</h2>
  <h3>Every ranked state.</h3>

  <div class="scroll tall">
    <table>
      <thead><tr><th>State</th><th class="n">Decisions</th><th class="n">Demolished</th><th></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;Raise or remove: what the United States actually does with a flooded
    house.&rdquo; Analysis of ${num(f.scope.decisions)} FEMA-funded single-family acquisition and
    elevation decisions, fiscal ${f.source.fiscalYears[0]}&ndash;${f.source.fiscalYears[1]}. Data:
    <a href="https://www.beforeregret.com/research/data/raise-or-remove-states.csv">state table (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/raise-or-remove-zips.csv">ZIP table (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/raise-or-remove-figures.json">figures (JSON)</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the ZIP lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="420" style="border:1px solid #e0dcd3"
        title="FEMA home buyouts and elevations by ZIP code"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code>.
  </div>

  <div class="cite">
    <b>For newsrooms</b>
    Published under a Creative Commons Attribution 4.0 licence: republish the figures, redraw the
    charts, or run your own cut without asking. The source is a US Government work and public
    domain in its own right. If you are looking for FEMA buyout data by state, home elevation
    statistics, or how many houses the government has demolished after flooding, the tables above
    are the whole of what we hold and the files are the whole of the working. Happy to pull a
    specific state or county, or check a figure before it prints &mdash; hello@beforeregret.com.
  </div>

  <footer class="spine">
    Source: Federal Emergency Management Agency, Hazard Mitigation Assistance Mitigated Properties,
    retrieved ${f.generated}. A US Government work.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/risk-without-cover/">Risk Without Cover</a> &#183;
    <a href="/research/outside-the-zone/">Outside the Zone</a> &#183;
    <a href="/research/risk-without-price/">Risk Without Price</a> &#183;
    <a href="/research/high-hazard-dams/">High-Hazard Dams</a>
  </footer>
</div>
${DATA_SCRIPT}
${JS_SCRIPT}
`;

const embed = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FEMA home buyouts and elevations by ZIP code &mdash; Before Regret</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${STUDY_URL}">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:16px;background:#fbfaf7;color:#191919;font:16px/1.6 Charter,Georgia,serif;-webkit-font-smoothing:antialiased}
${LOOKUP_CSS}
  .lookup{max-width:680px;margin:0 auto}
  .embed-credit{max-width:680px;margin:12px auto 0;font:400 11px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;text-align:right}
  .embed-credit a{color:#7d5f3c}
</style>
</head>
<body>
${LOOKUP_MARKUP}
<p class="embed-credit"><a href="${STUDY_URL}" target="_blank" rel="noopener">${TITLE_SHORT}</a> &mdash; Before Regret</p>
${DATA_SCRIPT}
${JS_SCRIPT}
<script>
(function(){
  function post(){
    var h=Math.ceil(document.documentElement.getBoundingClientRect().height);
    try{parent.postMessage({beforeRegretEmbedHeight:h},'*');}catch(e){}
  }
  if(window.ResizeObserver) new ResizeObserver(post).observe(document.body);
  window.addEventListener('load',post);
  setTimeout(post,60);
})();
</script>
</body>
</html>
`;

if (!html.includes('class="cta"')) throw new Error('ABORT: study lost its call to action');
if (embed.includes('class="cta"')) throw new Error('ABORT: the CTA leaked into the embed');
// Claims the product cannot support must never appear in the CTA. This is the third time a
// proposed CTA promised a per-address permit lookup that does not exist.
for (const banned of ['verify if this specific parcel', 'municipal flood permits', 'open structural building files', '$29']) {
  if (html.includes(banned)) throw new Error(`ABORT: CTA claims something unsupported: "${banned}"`);
}

for (const [name, doc] of [['study', html], ['embed', embed]] as Array<[string, string]>) {
  if (!doc.includes('lk-caveat')) throw new Error(`ABORT: ${name} lost the lookup caveat`);
  if (!doc.includes('rr-data')) throw new Error(`ABORT: ${name} lost the lookup data`);
}
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
console.log(`wrote ${path.relative(process.cwd(), OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`wrote ${path.relative(process.cwd(), OUT_EMBED)}  (${(embed.length / 1024).toFixed(1)} KB, ${zips.length} ZIPs)`);
console.log(`  ${pct(f.scope.demolishedShare)} demolished, ratio ${f.scope.ratio.toFixed(2)}:1`);
console.log(`  elevating ${elevatingStates.length} states, spread ${(f.regimes.foundationSpreadElevating * 100).toFixed(1)}pts`);
console.log(`  removing  ${removingStates.length} states, spread ${(f.regimes.foundationSpreadRemoving * 100).toFixed(1)}pts`);
