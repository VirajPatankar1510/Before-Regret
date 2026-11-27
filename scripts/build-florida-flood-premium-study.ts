// Generates docs/florida-flood-premiums.html -- what Florida single-family homes pay for NFIP flood
// insurance today, against FEMA's own full-risk premium for the same policies, by ZIP and county.
//
//   npx tsx scripts/fetch-florida-flood-premiums.ts      # the data (about 15 min; OpenFEMA NfipPolicies v3)
//   npx tsx scripts/build-florida-flood-premium-study.ts # this page
//   -> docs/florida-flood-premiums.html
//
// WHY IT EXISTS (owner, 2026-11-27): first study from the "data scientist" research slate; the owner
// picked "Flood premiums (FL)". A buyer can budget with it, and the ZIP lookup is the base for a
// product (owner idea 2026-11-27: address checker for agents' and inspectors' sites).
//
// SOURCES CHECKED AT ORIGIN (2026-11-27)
// - Field meanings: OpenFEMA OpenFemaDataSetFields for NfipPolicies v3 (quoted in the fetch script).
// - 42 U.S.C. 4015(e)(1): "may not be increased by more than 18 percent each year" (law.cornell.edu).
// - FEMA single-family page (updated 23 Oct 2025): a premium below the risk-based premium "will increase
//   towards the full rate"; "annual increases will eventually stop once the full-risk rate is realized".
// - FEMA NFIP pricing page (updated 9 Apr 2026): discounts can be transferred "to a new owner by assigning
//   their flood insurance policy" (said of the pre-FIRM and newly mapped discounts).
//
// WHAT IT MUST NOT DO
// - Speak about one house. Figures are medians and shares over policies in a ZIP or county.
// - Promise a price. Years-to-full-risk is a MINIMUM at the 18% cap, with the full-risk premium held still.
// - Explain why elevated homes sit furthest below full risk: the data does not say, so the page says so.
// - Scare (owner rule). Practical: what to ask, what to budget.
//
// HEADLINES ARE ASSERTED, NOT TYPED (see the ABORT checks below).
import fs from 'node:fs';
import path from 'node:path';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';

const PUBLISHED = '27 November 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/florida-flood-premiums/';
const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'florida-flood-premiums.json'), 'utf8'));
type S = {
  policies: number; medianPolicyCost: number; medianPremium: number; medianFullRisk: number; shareBelowFullRisk: number;
  medianGapBelow: number; medianYearsToFullAt18: number; shareTenPlusYears: number; shareHighRiskZone: number;
  shareLenderRequired: number; medianBuildingCoverage: number; medianFullToPremiumRatio: number;
  yearsAt18Buckets: Record<string, number>; county?: string; name?: string;
};
const FL: S = d.florida;
const MIN_N: number = d.minPoliciesPerFigure;

// ---- Checks the prose depends on --------------------------------------------------------------
if (d.counts.unique !== d.counts.apiCount) throw new Error('ABORT: policy count does not match FEMA $count');
if (d.counts.droppedNonPositive !== (d.counts.nonPositiveWhy.fullRisk ?? 0)) throw new Error('ABORT: prose says every dropped policy lacked a full-risk premium');
// The CRS check: if FEMA's full-risk premium left out the community discount, every class with a discount
// would show a median ratio above 1. The page says it does not.
// would show a median ratio growing as the class improves (better class, bigger discount). The page says
// the ratios stay at or near 1, and names the one class that is not exactly 1.
const crsBig = (Object.entries(d.byCrsClass) as [string, S][]).filter(([k, s]) => k !== 'none' && s.policies >= 1000);
const crsOff = crsBig.filter(([, s]) => s.medianFullToPremiumRatio !== 1000);
if (crsOff.length !== 1 || crsOff[0][0] !== '3' || crsOff[0][1].medianFullToPremiumRatio > 1060) throw new Error(`ABORT: CRS ratios changed: ${crsOff.map(([k, s]) => k + '=' + s.medianFullToPremiumRatio)}`);
if (d.byCrsClass['2'].medianFullToPremiumRatio !== 1000) throw new Error('ABORT: page says the best-rated class pays exactly full risk at the median');
const crs3 = (crsOff[0][1].medianFullToPremiumRatio / 1000).toFixed(3);
const fdn = d.byFoundation as Record<string, S>;
const elev = fdn.elevated;
if (Object.values(fdn).some((s) => s !== elev && s.policies >= 1000 && s.shareBelowFullRisk >= elev.shareBelowFullRisk)) throw new Error('ABORT: page says elevated homes have the highest share below full risk');
const bigCounties = (Object.entries(d.byCounty) as [string, S][]).filter(([, s]) => s.policies >= 2000).sort((a, b) => b[1].shareBelowFullRisk - a[1].shareBelowFullRisk);
const topCounty = bigCounties[0][1];
if (topCounty.name !== 'Collier County') throw new Error(`ABORT: page names Collier as highest share below, data says ${topCounty.name}`);
const ZIP_FLOOR = 200; // ZIPs ranked in the table need this many policies
const bigZips = (Object.entries(d.byZip) as [string, S][]).filter(([, s]) => s.policies >= ZIP_FLOOR).sort((a, b) => b[1].shareTenPlusYears - a[1].shareTenPlusYears);
const [topZip, topZipS] = bigZips[0];
if (topZip !== '32931' || topZipS.county !== 'Brevard County') throw new Error(`ABORT: page names 32931 (Brevard) first, data says ${topZip}`);
const zoneA: S = d.byZone['A (high risk)'], zoneOut: S = d.byZone['outside high-risk zone'], zoneV: S = d.byZone['V (coastal high hazard)'];
if (!(zoneA.shareBelowFullRisk > zoneOut.shareBelowFullRisk)) throw new Error('ABORT: page says zone A has more policies below full risk than outside');
for (const [k, s] of Object.entries(d.byEra) as [string, S][]) if (k !== 'unknown' && Math.abs(s.shareBelowFullRisk - FL.shareBelowFullRisk) > 3) throw new Error(`ABORT: page says every era is within a few points of Florida; ${k} is ${s.shareBelowFullRisk}`);
const b = FL.yearsAt18Buckets;
const belowN = FL.policies - b.atOrAboveFull;
if (Math.abs(100 * belowN / FL.policies - FL.shareBelowFullRisk) > 0.05) throw new Error('ABORT: bucket totals disagree with shareBelowFullRisk');

// ---- Formatting -------------------------------------------------------------------------------
const num = (n: number) => n.toLocaleString('en-US');
const pct1 = (n: number) => `${n.toFixed(1)}%`;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const SNAP = fmtDate(d.snapshot);
const short = (n?: string) => (n ?? '').replace(/ County$/, '');

const countyRows = bigCounties.slice(0, 10).map(([, s]) => `      <tr${s.name === 'Brevard County' ? ' class="me"' : ''}><td>${short(s.name)}</td><td class="n">${num(s.policies)}</td><td class="n">${usd(s.medianPolicyCost)}</td><td class="n"><b>${pct1(s.shareBelowFullRisk)}</b></td><td class="n">${usd(s.medianGapBelow)}</td><td class="n">${pct1(s.shareTenPlusYears)}</td></tr>`).join('\n');
const zipRows = bigZips.slice(0, 10).map(([z, s]) => `      <tr><td>${z}</td><td>${short(s.county)}</td><td class="n">${num(s.policies)}</td><td class="n">${usd(s.medianPremium)}</td><td class="n"><b>${usd(s.medianFullRisk)}</b></td><td class="n">${pct1(s.shareTenPlusYears)}</td></tr>`).join('\n');
const groupRow = (label: string, s: S) => `      <tr><td>${label}</td><td class="n">${num(s.policies)}</td><td class="n">${usd(s.medianPremium)}</td><td class="n">${usd(s.medianFullRisk)}</td><td class="n"><b>${pct1(s.shareBelowFullRisk)}</b></td><td class="n">${pct1(s.shareTenPlusYears)}</td></tr>`;
const eraOrder = ['before 1975', '1975-1994', '1995-2001', '2002 or later'];
const eraRows = eraOrder.map((k) => groupRow(k.replace('-', '&ndash;'), d.byEra[k])).join('\n');
const fdnRows = ['slab', 'crawlspace', 'elevated', 'basement'].filter((k) => fdn[k]).map((k) => groupRow(k[0].toUpperCase() + k.slice(1), fdn[k])).join('\n');
const zoneRows = [groupRow('Zone A (high risk)', zoneA), groupRow('Zone V (coastal high hazard)', zoneV), groupRow('Outside the high-risk zone', zoneOut)].join('\n');
const brevardC = (Object.values(d.byCounty) as S[]).find((s) => s.name === 'Brevard County')!;

const KEY_FINDINGS = keyFindingsBlock([
  `Of ${num(FL.policies)} single-family National Flood Insurance Program policies in force in Florida on ${SNAP}, ${pct1(FL.shareBelowFullRisk)} were priced below FEMA&rsquo;s own full-risk premium for the same policy.`,
  `For those Florida policies below full risk, the median gap was ${usd(FL.medianGapBelow)} a year, and at the 18% yearly legal maximum the median policy needs at least ${FL.medianYearsToFullAt18} years of increases to reach full risk.`,
  `In Collier County, Florida, ${pct1(topCounty.shareBelowFullRisk)} of ${num(topCounty.policies)} single-family NFIP policies were below FEMA&rsquo;s full-risk premium, the highest share of any Florida county with at least ${num(2000)} policies.`,
  `In ZIP code ${topZip} in Brevard County, Florida, the median single-family NFIP premium was ${usd(topZipS.medianPremium)} against a median FEMA full-risk premium of ${usd(topZipS.medianFullRisk)}, and ${pct1(topZipS.shareTenPlusYears)} of policies there need ten or more years of 18% increases to reach full risk.`,
  `Elevated single-family homes in Florida had the largest share below full risk of any foundation type: ${pct1(elev.shareBelowFullRisk)} of ${num(elev.policies)} policies, with a median full-risk premium of ${usd(elev.medianFullRisk)} against ${usd(elev.medianPremium)} paid.`,
], `Source: FEMA OpenFEMA NFIP Policies (v3), every Florida policy in force on ${SNAP}; analysis by Before Regret. Medians over policies in an area, not the price of any one house.`);

// ---- ZIP lookup ---------------------------------------------------------------------------------
// Framework-free, no network request: the published ZIPs sit inline as compact arrays.
const lkRows = Object.fromEntries((Object.entries(d.byZip) as [string, S][]).map(([z, s]) => [z, [short(s.county), s.policies, s.medianPolicyCost, s.medianPremium, s.medianFullRisk, s.shareBelowFullRisk, s.medianGapBelow, s.shareTenPlusYears]]));
const LK_CSS = `
  .lookup{border:1px solid #e5e0d8;background:#fdfcfa;padding:1.1rem 1.2rem;margin:0 0 2rem}
  .lk-eyebrow{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:0 0 .7rem}
  .lk-row{display:flex;gap:.5rem}
  .lookup input{flex:1;min-width:0;font:400 16px/1.4 ui-sans-serif,system-ui,sans-serif;padding:.55rem .6rem;border:1px solid #cfc8bd;background:#fff;color:#1a1a1a;border-radius:2px}
  .lookup button{font:700 14px/1 ui-sans-serif,system-ui,sans-serif;padding:0 1rem;border:0;background:#8a6d3b;color:#fff;border-radius:2px;cursor:pointer}
  .lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr));gap:1px;background:#e5e0d8;border:1px solid #e5e0d8;margin:.9rem 0 0}
  .lk-cell{background:#fdfcfa;padding:.65rem .7rem}
  .lk-cell b{display:block;font:700 1.25rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .lk-cell span{display:block;font:400 11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin-top:.25rem}
  .lk-note{font:400 12.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.7rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;
const LK_MARKUP = `<div class="lookup">
    <p class="lk-eyebrow">Look up a Florida ZIP code</p>
    <form class="lk-row" id="ffpform" autocomplete="off">
      <label for="ffpzip" style="position:absolute;left:-9999px">Florida ZIP code</label>
      <input id="ffpzip" inputmode="numeric" maxlength="5" placeholder="5-digit ZIP, e.g. 32931">
      <button type="submit">Look up</button>
    </form>
    <div id="ffpout" aria-live="polite"></div>
    <p class="lk-caveat">Single-family NFIP policies in force on ${SNAP}. Medians over every policy in the
    ZIP, not a quote for any house. ZIPs with fewer than ${MIN_N} policies are not shown. &ldquo;Years&rdquo;
    are a minimum at the 18% yearly cap.</p>
  </div>`;
const LK_DATA = `<script type="application/json" id="ffp-data">${JSON.stringify({ min: MIN_N, fl: [FL.medianPolicyCost, FL.shareBelowFullRisk], z: lkRows })}</script>`;
const LK_JS = `<script>
(function(){
  var D=JSON.parse(document.getElementById('ffp-data').textContent);
  var f=document.getElementById('ffpform'),i=document.getElementById('ffpzip'),o=document.getElementById('ffpout');
  function $(n){return '$'+n.toLocaleString('en-US');}
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var z=(i.value||'').replace(/\\D/g,'').slice(0,5);
    if(z.length!==5){o.innerHTML='<p class="lk-note">Enter a 5-digit ZIP code.</p>';return;}
    var r=D.z[z];
    if(!r){o.innerHTML='<p class="lk-note">No figure for '+z+'. Either it is outside Florida, or it has fewer than '+D.min+' single-family flood policies, too few to publish.</p>';return;}
    o.innerHTML='<div class="lk-grid">'
      +cell($(r[2]),'median yearly cost now, fees included (Florida '+$(D.fl[0])+')')
      +cell($(r[3]),'median premium now')
      +cell($(r[4]),'median FEMA full-risk premium')
      +cell(r[5].toFixed(1)+'%','of policies priced below full risk (Florida '+D.fl[1].toFixed(1)+'%)')
      +'</div><p class="lk-note">ZIP '+z+(r[0]?', '+r[0]+' County':'')+': '+r[1].toLocaleString('en-US')+' single-family policies. '
      +(r[6]!=null?'Where a policy is below full risk, the median gap is '+$(r[6])+' a year. '+r[7].toFixed(1)+'% of all policies here need ten or more years of 18% increases to reach full risk.':'No policy here is below full risk.')+'</p>';
  });
})();
</script>`;

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
  .note{background:#faf8f4;border-left:3px solid #8a6d3b;padding:1rem 1.2rem;margin:0 0 1.6rem;font:400 14px/1.6 ui-sans-serif,system-ui,sans-serif}
  .note p{margin:0}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1a1a1a;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  tr.me td{background:#fdf6e7}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1rem}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:0 0 1.8rem}
  .wrap ul.plain{margin:0 0 1.2rem;padding-left:1.2rem}
  .wrap ul.plain li{margin:0 0 .5rem}
  .wrap blockquote{margin:0 0 1.1rem;padding:.2rem 0 .2rem 1rem;border-left:2px solid #e5e0d8;color:#3d3d3d}
  .cite{background:#f5f2ec;border:1px solid #e5e0d8;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6d3b;margin-bottom:.5rem}
  .wrap a{color:#8a6d3b}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e5e0d8;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
${LK_CSS}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}}
${KF_CSS}
</style>

<div class="wrap">
  <p class="kicker">Florida analysis &middot; FEMA flood insurance policies &middot; ${PUBLISHED}</p>
  <h1>Florida flood insurance: what owners pay now, and FEMA&rsquo;s full-risk price</h1>
  <p class="standfirst">Every Florida flood policy from FEMA&rsquo;s National Flood Insurance Program
  carries two prices: the premium the owner pays and FEMA&rsquo;s own full-risk premium for the same
  home. We read all ${num(d.counts.unique)} Florida policies in force on ${SNAP}. For single-family
  homes, ${pct1(FL.shareBelowFullRisk)} are priced below full risk, and by law those premiums can rise
  by up to 18% a year until they get there.</p>

  <div class="figs">
    <div class="fig"><b>${pct1(FL.shareBelowFullRisk)}</b><span>of ${num(FL.policies)} Florida single-family policies are below FEMA&rsquo;s full-risk premium</span></div>
    <div class="fig"><b>${usd(FL.medianGapBelow)}</b><span>median yearly gap to full risk, for those policies</span></div>
    <div class="fig"><b>${usd(FL.medianPolicyCost)}</b><span>median yearly cost now, fees included, all single-family policies</span></div>
    <div class="fig"><b>${num(d.zipsPublished)}</b><span>Florida ZIP codes in the lookup below</span></div>
  </div>

  <div class="note"><p><b>What these numbers are.</b> Medians and shares over real policies in an area,
  from FEMA&rsquo;s own records, as of ${SNAP}. They are not a quote for any house: a premium depends on
  that home&rsquo;s elevation, foundation, replacement cost and coverage. The number of years to full
  risk is a minimum, because a yearly increase can be smaller than 18%, and FEMA&rsquo;s full-risk
  figure can itself change.</p></div>

  ${KEY_FINDINGS}

  ${LK_MARKUP}

  <h2>Two prices on every flood policy</h2>
  <h3>FEMA records the premium charged and the premium the risk calls for.</h3>
  <p>FEMA&rsquo;s NFIP policy records, published through OpenFEMA, include a field for the
  premium on each policy and a separate field for its &ldquo;full risk premium&rdquo;, which FEMA
  defines as the premium &ldquo;based on its determined flood risk and the full cost to pay
  anticipated losses and expenses&rdquo;. Since FEMA&rsquo;s current pricing method reached all
  renewing policies in April 2022, a policy whose premium is below that figure moves toward it each
  year. FEMA&rsquo;s page on single-family pricing says such a premium &ldquo;will increase towards
  the full rate&rdquo;, and that &ldquo;annual increases will eventually stop once the full-risk rate
  is realized.&rdquo;</p>
  <p>The speed is set in federal law. Under 42 U.S.C. &sect; 4015(e), the premium rate for a property
  &ldquo;may not be increased by more than 18 percent each year&rdquo;, with exceptions the statute
  lists, such as a policyholder raising coverage or lowering the deductible. A policy priced at half
  its full-risk premium therefore needs at least five years of maximum increases to get there.</p>
  <p>The total a Florida owner pays each year is more than the premium. FEMA&rsquo;s &ldquo;policy
  cost&rdquo; adds the reserve fund assessment, the federal policy fee and the HFIAA surcharge. Across
  ${num(FL.policies)} single-family policies the median policy cost was ${usd(FL.medianPolicyCost)}
  against a median premium of ${usd(FL.medianPremium)}.</p>

  <h2>Where the gap is widest</h2>
  <h3>Southwest Florida and the Keys have the most policies still climbing.</h3>
  <p>In Collier County, ${pct1(topCounty.shareBelowFullRisk)} of single-family policies were below
  FEMA&rsquo;s full-risk premium on ${SNAP}, the highest share of the Florida counties with at least
  ${num(2000)} policies. Monroe and Lee follow. In Miami-Dade and Broward, the two counties with the most
  policies, the median gap for policies below full risk is far smaller.</p>
  <div class="scroll"><table>
    <thead><tr><th>County</th><th class="n">Policies</th><th class="n">Median cost now</th><th class="n">Below full risk</th><th class="n">Median gap, if below</th><th class="n">10+ years to full</th></tr></thead>
    <tbody>
${countyRows}
    </tbody>
  </table></div>
  <p class="cap">Florida counties with at least ${num(2000)} single-family NFIP policies, top ten by share
  below full risk. &ldquo;10+ years&rdquo; is the share of all policies that need ten or more years of 18%
  increases. Source: OpenFEMA NFIP Policies v3, in force ${SNAP}.</p>

  <h3>In a few ZIP codes, today&rsquo;s price is a small fraction of the full-risk premium.</h3>
  <p>ZIP code ${topZip}, on the Brevard County barrier island, has the largest share of policies a decade
  or more from full risk among Florida ZIPs with at least ${ZIP_FLOOR} single-family policies: the median
  premium there was ${usd(topZipS.medianPremium)} and the median full-risk premium ${usd(topZipS.medianFullRisk)}.
  Brevard as a whole looks ordinary next to that, with ${pct1(brevardC.shareBelowFullRisk)} of policies
  below full risk, which is why a county figure can mislead a buyer looking at one neighborhood.
  Brevard is also one of the counties in FEMA&rsquo;s November 2026 flood declaration; our
  <a href="/research/florida-flood-declaration/">county study of that declaration</a> covers its claims history.</p>
  <div class="scroll"><table>
    <thead><tr><th>ZIP</th><th>County</th><th class="n">Policies</th><th class="n">Median premium</th><th class="n">Median full risk</th><th class="n">10+ years to full</th></tr></thead>
    <tbody>
${zipRows}
    </tbody>
  </table></div>
  <p class="cap">Florida ZIP codes with at least ${ZIP_FLOOR} single-family NFIP policies, top ten by the
  share needing ten or more years of 18% increases. Premiums exclude fees. Source: OpenFEMA NFIP Policies
  v3, in force ${SNAP}.</p>

  <h2>Elevated homes, build era and flood zone</h2>
  <h3>Elevated homes sit furthest below full risk.</h3>
  <p>Among Florida single-family homes with flood policies, the ${num(elev.policies)} on elevated
  foundations had the largest share below full risk, ${pct1(elev.shareBelowFullRisk)}, and
  ${pct1(elev.shareTenPlusYears)} of them need ten or more years of maximum increases. The policy records
  do not say why. They do say that raising a house does not, on these figures, mean its flood premium
  has finished rising, which matters to a buyer comparing an elevated home with one on a slab.</p>
  <div class="scroll"><table>
    <thead><tr><th>Foundation</th><th class="n">Policies</th><th class="n">Median premium</th><th class="n">Median full risk</th><th class="n">Below full risk</th><th class="n">10+ years</th></tr></thead>
    <tbody>
${fdnRows}
    </tbody>
  </table></div>
  <p>By flood zone, ${pct1(zoneA.shareBelowFullRisk)} of single-family policies rated in an A zone were
  below full risk, against ${pct1(zoneOut.shareBelowFullRisk)} of those rated outside FEMA&rsquo;s mapped
  high-risk zone. Build era matters less than either: every era sits within a few points of the
  Florida figure.</p>
  <div class="scroll"><table>
    <thead><tr><th>Rated zone</th><th class="n">Policies</th><th class="n">Median premium</th><th class="n">Median full risk</th><th class="n">Below full risk</th><th class="n">10+ years</th></tr></thead>
    <tbody>
${zoneRows}
    </tbody>
  </table></div>
  <div class="scroll"><table>
    <thead><tr><th>Year built</th><th class="n">Policies</th><th class="n">Median premium</th><th class="n">Median full risk</th><th class="n">Below full risk</th><th class="n">10+ years</th></tr></thead>
    <tbody>
${eraRows}
    </tbody>
  </table></div>
  <p class="cap">Year built from FEMA&rsquo;s original construction date field. Policies with no usable
  date are left out of this table only.</p>

  <h2>If you are buying a house in Florida</h2>
  <h3>Budget for the full-risk premium, and ask about the seller&rsquo;s policy.</h3>
  <ul class="plain">
    <li><b>Ask the seller for the current flood policy&rsquo;s declarations page</b>, so you see what
    the house costs to insure today, and ask an insurance agent to quote the same house as a new
    policy. The difference is your own version of the gap on this page.</li>
    <li><b>Ask whether the policy can be assigned to you.</b> FEMA&rsquo;s pricing page says
    policyholders &ldquo;are able to transfer their discount to a new owner by assigning their flood
    insurance policy when their property changes ownership.&rdquo; Ask the agent which discounts on
    that policy would carry over.</li>
    <li><b>Plan your budget on the full-risk premium</b> for the ZIP, not today&rsquo;s price, if the
    lookup shows most policies there below full risk.</li>
    <li><b>Check the flood zone yourself</b>: our guide to <a href="/guides/flood-zone-by-address/">finding
    the flood zone for an address</a> shows how, and <a href="/guides/fema-flood-zone-letters-meaning/">what
    the zone letters mean</a> explains A, V and X.</li>
  </ul>

  <h2>How we checked this</h2>
  <p>On 27 November 2026 we read every Florida record in FEMA&rsquo;s OpenFEMA NFIP Policies dataset
  (version 3) that was in force on ${SNAP}: ${num(d.counts.unique)} policies, every one unique, matching
  the count FEMA&rsquo;s API reports for the same filter. We kept single-family homes (FEMA occupancy
  codes 1 and 11) insuring one unit: ${num(d.counts.kept + d.counts.droppedNonPositive)} policies. We then
  left out ${num(d.counts.droppedNonPositive)} with no full-risk premium recorded, leaving
  ${num(FL.policies)}. Each figure compares the premium field with the full-risk premium field; both
  exclude fees. Years to full risk are the fewest years of 18% increases that close the gap, with the
  full-risk premium held where it is.</p>
  <p>One check decided whether the comparison means anything. If FEMA&rsquo;s full-risk figure left out
  the discount a community earns through the Community Rating System, every discounted community would
  look below full risk, and more so the better its class, since a better class earns a bigger
  discount. That is not what the records show. In every CRS class with at least ${num(1000)} policies,
  the median policy&rsquo;s full-risk premium is within about 5% of what it pays: exactly equal in all
  but class 3, where it is ${crs3} times the premium, and exactly equal in class 2, the best-rated
  class with policies in Florida. No ZIP or county figure is published from fewer than
  ${MIN_N} policies; ${num(d.zipsSuppressed)} Florida ZIPs fall under that and are left out.</p>
  <p>What this cannot tell you: the premium for a particular house, why one group sits further below
  full risk than another, or how FEMA&rsquo;s full-risk figures will move. Field meanings are
  FEMA&rsquo;s own, from its OpenFEMA data dictionary.</p>

  <div class="cite"><b>Cite this</b>Before Regret, &ldquo;Florida flood insurance: what owners pay now,
  and FEMA&rsquo;s full-risk price,&rdquo; ${PUBLISHED}, ${STUDY_URL}. Free to reuse under
  <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a> with a
  link back. ZIP table: <a href="/research/data/florida-flood-premiums-by-zip.csv">CSV</a>, all figures:
  <a href="/research/data/florida-flood-premiums.json">JSON</a>.</div>

  <footer class="spine">Published ${PUBLISHED}. Part of <a href="/research/">Before Regret research</a>.</footer>
</div>`;

assertKeyFindingsNumbers(html, 'build-florida-flood-premium-study');
fs.writeFileSync(path.join(process.cwd(), 'docs', 'florida-flood-premiums.html'), html.replace(/<\/div>\s*$/, () => `</div>\n${LK_DATA}\n${LK_JS}`));
console.log(`wrote docs/florida-flood-premiums.html (${(html.length / 1024).toFixed(1)} KB + ${(LK_DATA.length / 1024).toFixed(1)} KB lookup); FL ${FL.shareBelowFullRisk}% below, gap $${FL.medianGapBelow}; top county ${topCounty.name}; top ZIP ${topZip}`);
