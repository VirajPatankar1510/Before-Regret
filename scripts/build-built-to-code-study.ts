// Generates the tenth study, /research/built-to-code/ -- which building code the new houses of 2025
// were permitted under, permit office by permit office.
//
//   npx tsx scripts/fetch-code-permits-data.ts    # FEMA BCAT + Census BPS -> docs/data/built-to-code-raw.json (gitignored)
//   npx tsx scripts/build-built-to-code-study.ts   # -> docs/built-to-code.html (+ embed, two CSVs, figures)
//
// -------------------------------------------------------------------------------------------
// WHY THIS STUDY (owner picked it 2026-11-25 from the Gemini topic list, memory
// beforeregret_gemini_research_topics). FEMA publishes code adoption as a share of JURISDICTIONS
// (34%) and of POPULATION (53%). Nobody had weighted it by where houses are actually being built,
// and the 2020 "65% of communities" line is still the one that gets repeated. The new cut: the
// permit office that issued each 2025 house permit, matched to that office's own code rating.
//
// WHAT IT MUST NOT SAY.
//  - A rating is not a finding about any house. FEMA rates the code a government ADOPTED; it does
//    not inspect houses, and its own page says adoption "is just the first step".
//  - "No residential code" in BCAT does not mean "no rules" in Texas: Local Government Code
//    233.153 can require IRC compliance in a county's unincorporated area if the county opted in.
//    The Texas section says this, quoting the statute (read 2026-11-25 on statutes.capitol.texas.gov).
//  - Timing: BCAT is as of 2026-09-30, the permits are 2025. Codes move forward almost always, so the
//    share of houses permitted under a not-current code is a FLOOR. The page says so, with
//    Oklahoma (2024 IRC effective 09/14/2026, per FEMA's own adoption note) as the example.
//  - No insurer names, no claims about what carriers do. No fear words.
import fs from 'node:fs';
import path from 'node:path';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';
import { joinOffices, totalUnits, resGroup, RATING_LABEL, STATE_NAME, type Joined } from './lib/built-to-code-join.js';

const RAW = path.join(process.cwd(), 'docs', 'data', 'built-to-code-raw.json');
const OUT = path.join(process.cwd(), 'docs', 'built-to-code.html');
const OUT_EMBED = path.join(process.cwd(), 'docs', 'built-to-code.embed.html');
const OUT_CSV_COUNTY = path.join(process.cwd(), 'docs', 'data', 'built-to-code-by-county.csv');
const OUT_CSV_OFFICE = path.join(process.cwd(), 'docs', 'data', 'built-to-code-by-permit-office.csv');
const OUT_FIG = path.join(process.cwd(), 'docs', 'data', 'built-to-code-figures.json');

const PUBLISHED = '25 November 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/built-to-code/';
const STUDY_NAME = 'Built to Which Code?';

if (!fs.existsSync(RAW)) throw new Error('ABORT: run scripts/fetch-code-permits-data.ts first');
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const BPS_YEAR: number = raw.bpsYear;
const BCAT_ASOF: string = raw.sources.bcat.dataCurrency[0];
if (raw.sources.bcat.dataCurrency.length !== 1) throw new Error('ABORT: BCAT rows carry more than one data-currency date; reread the timing language');
if (BPS_YEAR !== 2025 || BCAT_ASOF !== '2026-09-30') throw new Error(`ABORT: inputs are ${BPS_YEAR} permits / BCAT ${BCAT_ASOF}; the prose names 2025 and September 30, 2026`);

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => v.toLocaleString('en-US');

// ---- join -------------------------------------------------------------------------------------
// Puerto Rico's permit offices are in the South file; the question is about the states, and FEMA's
// BCAT rows for PR are municipios with their own story. Left out of every figure, and the page says so.
const countyNames = new Map<string, string>(raw.counties.map((c: { state: string; county: string; name: string }) => [c.state + c.county, c.name.trim()]));
const prOffices = raw.offices.filter((o: { state: string }) => o.state === '72');
const J: Joined[] = joinOffices(raw.jurisdictions, raw.offices.filter((o: { state: string }) => o.state !== '72'), countyNames);
const H = (o: Joined) => o.units.u1;          // single-family houses: the study's unit
const A = (o: Joined) => totalUnits(o.units); // all housing units, for the CSVs and one context line
const rating = (o: Joined) => o.j?.Combined_Hazard_Code ?? 'unmatched';
const sum = (list: Joined[], f: (o: Joined) => number) => list.reduce((a, o) => a + f(o), 0);

const HOUSES = sum(J, H), ALL = sum(J, A);
const CUR = sum(J.filter((o) => rating(o) === '2'), H);
const OLD = sum(J.filter((o) => rating(o) === '1'), H);
const NODATA = sum(J.filter((o) => rating(o) === '0'), H);
const UNMATCHED = sum(J.filter((o) => rating(o) === 'unmatched'), H);
const NOCODE = sum(J.filter((o) => o.j?.Res_Code === 'No Residential Code'), H);
const WEAK_CUR_ED = J.filter((o) => /^(2021|2024) IRC$/.test(o.j?.Res_Code ?? '') && rating(o) === '1');
const WEAK = sum(WEAK_CUR_ED, H);
const REPORTED_SHARE = sum(J, (o) => o.reported.u1) / HOUSES;
const MATCHED_SHARE = 1 - UNMATCHED / HOUSES;
const CTRL = raw.counties.filter((c: { state: string }) => c.state !== '72').reduce((a: number, c: { units: number }) => a + c.units, 0);
if (Math.abs(ALL - CTRL) / CTRL > 0.005) throw new Error(`ABORT: place files sum to ${ALL} units, county file to ${CTRL}`);
const SHARE_OLD = OLD / HOUSES, SHARE_CUR = CUR / HOUSES;

// Residential code edition of the issuing office.
const RES_ORDER = ['2024 IRC', '2021 IRC', '2018 IRC', '2015 IRC', '2012 IRC or older', "Wisconsin's own dwelling code", 'Other or pre-IRC code', 'No residential code', 'No data', 'Unmatched'];
const byRes = new Map<string, number>(RES_ORDER.map((k) => [k, 0]));
for (const o of J) { const g = resGroup(o.j?.Res_Code); if (!byRes.has(g)) throw new Error(`ABORT: unexpected code group ${g}`); byRes.set(g, byRes.get(g)! + H(o)); }

// ---- states -------------------------------------------------------------------------------------
type Agg = { houses: number; cur: number; old: number; none: number; all: number; offices: number };
const blank = (): Agg => ({ houses: 0, cur: 0, old: 0, none: 0, all: 0, offices: 0 });
const add = (a: Agg, o: Joined) => {
  a.houses += H(o); a.all += A(o); a.offices++;
  if (rating(o) === '2') a.cur += H(o);
  if (rating(o) === '1') a.old += H(o);
  if (o.j?.Res_Code === 'No Residential Code') a.none += H(o);
};
const stAgg = new Map<string, Agg>();
for (const o of J) { if (!stAgg.has(o.st)) stAgg.set(o.st, blank()); add(stAgg.get(o.st)!, o); }
const states = [...stAgg.entries()].map(([st, a]) => ({ st, name: STATE_NAME[st], ...a, share: a.houses ? a.cur / a.houses : 0 }))
  .sort((a, b) => b.houses - a.houses);
const MIN_STATE = 1_000;
const allCur = states.filter((s) => s.houses >= MIN_STATE && s.cur === s.houses - (s.houses - s.cur - s.old) && s.old === 0);
const noneCur = states.filter((s) => s.houses >= MIN_STATE && s.cur === 0);
const poolRank = [...states].sort((a, b) => b.old - a.old);
const TX = states.find((s) => s.st === 'TX')!, NC = states.find((s) => s.st === 'NC')!;

// ---- counties -----------------------------------------------------------------------------------
const ctyAgg = new Map<string, Agg & { geoid: string; county: string; st: string; offices_: Joined[] }>();
for (const o of J) {
  const g = o.state + o.county;
  if (!ctyAgg.has(g)) ctyAgg.set(g, { ...blank(), geoid: g, county: o.countyName || `${o.name} (county ${o.county})`, st: o.st, offices_: [] });
  const c = ctyAgg.get(g)!; add(c, o); c.offices_.push(o);
}
const counties = [...ctyAgg.values()];
const byOld = [...counties].sort((a, b) => b.old - a.old);
const byHouses = [...counties].sort((a, b) => b.houses - a.houses);
const cty = (geoid: string) => { const c = ctyAgg.get(geoid); if (!c) throw new Error(`ABORT: county ${geoid} missing`); return c; };
const HARRIS = cty('48201'), MONTG = cty('48339'), FTBEND = cty('48157'), MARICOPA = cty('04013'), WAKE = cty('37183');
const split = counties.filter((c) => c.cur >= 200 && c.old >= 200);

// ---- hazards ------------------------------------------------------------------------------------
const HAZARDS: Array<[string, keyof NonNullable<Joined['j']>]> = [
  ['Hurricane wind', 'Hurricane_Code'], ['Flood', 'Flood_Code'], ['Damaging wind', 'Wind_Code'], ['Tornado', 'Tornado_Code'], ['Seismic', 'Seismic_Code'],
];
const hazards = HAZARDS.map(([label, k]) => {
  let atRisk = 0, cur = 0;
  for (const o of J) { const v = o.j ? String(o.j[k]) : ''; if (v === '1' || v === '2') { atRisk += H(o); if (v === '2') cur += H(o); } }
  return { label, atRisk, cur, share: cur / atRisk };
});
const hz = (l: string) => hazards.find((h) => h.label === l)!;

// ---- named offices the prose leans on ----------------------------------------------------------
const office = (st: string, name: string) => { const o = J.find((x) => x.st === st && x.name === name); if (!o || !o.j) throw new Error(`ABORT: office ${name}, ${st} missing or unmatched`); return o; };
const HARRIS_UNINC = office('TX', 'Harris County Unincorporated Area');
const OKC = office('OK', 'Oklahoma City');
const RALEIGH = office('NC', 'Raleigh');
const PHOENIX = office('AZ', 'Phoenix');
const MARICOPA_UNINC = office('AZ', 'Maricopa County Unincorporated Area');
const weakByState = new Map<string, number>(); for (const o of WEAK_CUR_ED) weakByState.set(o.st, (weakByState.get(o.st) ?? 0) + H(o));
const weakRank = [...weakByState.entries()].sort((a, b) => b[1] - a[1]);
const ncNote: string = raw.jurisdictions.find((j: { State_abbr: string; Adoption_Notes?: string }) => j.State_abbr === 'NC' && j.Adoption_Notes)?.Adoption_Notes ?? '';
const okNote: string = raw.jurisdictions.find((j: { State_abbr: string; Place: string }) => j.State_abbr === 'OK' && j.Place === 'Oklahoma City')?.Adoption_Notes ?? '';

// ---- assertions: every claim the prose makes about rank, size or shape --------------------------
const must = (cond: boolean, msg: string) => { if (!cond) throw new Error(`ABORT: ${msg}`); };
must(SHARE_OLD > 0.44 && SHARE_OLD < 0.49, `"nearly half" no longer fits (${pct(SHARE_OLD)})`);
must(MATCHED_SHARE > 0.995, `match rate fell to ${pct(MATCHED_SHARE)}`);
must(states[0].st === 'TX', 'Texas is no longer the state with the most new houses');
must(poolRank[0].st === 'TX' && poolRank[1].st === 'NC', `pool order is now ${poolRank[0].st}, ${poolRank[1].st}`);
must((TX.old + NC.old) / OLD > 1 / 3, 'Texas and North Carolina no longer hold more than a third of the pool');
for (const s of ['FL', 'CA', 'GA', 'SC', 'WA']) must(allCur.some((x) => x.st === s), `${s} is no longer 100% current`);
for (const s of ['NC', 'OH', 'IN', 'MI', 'VA', 'OK', 'ID']) must(noneCur.some((x) => x.st === s), `${s} is no longer 0% current`);
must(NC.offices > 0 && J.filter((o) => o.st === 'NC' && H(o) > 0).every((o) => o.j?.Res_Code === '2015 IRC'), 'not every North Carolina office is on the 2015 IRC');
must(/S\.L\. 2025-2/.test(ncNote), 'FEMA North Carolina note no longer cites S.L. 2025-2');
must(/2024 IBC and IRC: effective 09\/14\/2026/.test(okNote), 'FEMA Oklahoma note no longer gives the 09/14/2026 date');
must(byOld[0].geoid === '48201' && byOld[1].geoid === '48339' && byOld[2].geoid === '48157', 'Harris, Montgomery, Fort Bend are no longer the top three counties');
for (const c of [HARRIS, MONTG, FTBEND]) must(c.none > 9_000, `${c.county} no longer has 9,000+ houses under no county residential code`);
must(HARRIS_UNINC.j!.Res_Code === 'No Residential Code', 'unincorporated Harris County no longer "No Residential Code"');
must(Math.abs(MARICOPA.cur / MARICOPA.houses - 0.5) < 0.05, 'Maricopa County is no longer roughly half and half');
must(byHouses[0].geoid === '04013', 'Maricopa County is no longer first by houses permitted');
must(PHOENIX.j!.Res_Code === '2024 IRC' && rating(PHOENIX) === '2', 'Phoenix is no longer 2024 IRC, rated current');
must(MARICOPA_UNINC.j!.Res_Code === '2012 IRC', 'unincorporated Maricopa is no longer 2012 IRC');
must(WAKE.cur === 0 && WAKE.houses > 5_000, 'Wake County line changed');
must(RALEIGH.j!.Res_Code === '2015 IRC', 'Raleigh is no longer 2015 IRC');
must(OKC.j!.Res_Code === '2024 IRC' && rating(OKC) === '1', 'Oklahoma City is no longer 2024 IRC rated not current');
must(weakRank[0][0] === 'VA', `Virginia is no longer the largest weakened-current-edition state (${weakRank[0][0]})`);
const hzByShare = [...hazards].sort((a, b) => a.share - b.share);
must(hzByShare[0].label === 'Tornado' && hzByShare[hazards.length - 1].label === 'Seismic', 'hazard order changed (tornado lowest, seismic highest)');
must(split.length >= 30, `only ${split.length} split counties`);
// "most of them in the unincorporated parts of Texas counties"
const txUnincNone = sum(J.filter((o) => o.st === 'TX' && /Unincorporated Area$/i.test(o.name) && o.j?.Res_Code === 'No Residential Code'), H);
must(txUnincNone / NOCODE > 0.5, `unincorporated Texas is no longer most of the no-code houses (${pct(txUnincNone / NOCODE)})`);

// ---- CSVs -----------------------------------------------------------------------------------------
const cell = (s: string | number) => { const t = String(s ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const officeCsv = [
  ['state', 'county_fips', 'county', 'permit_office', 'bps_6digit_id', 'units_all_2025', 'houses_1unit_2025', 'units_2_to_4', 'units_5plus', 'months_reported',
    'fema_bcat_jurisdiction', 'residential_code', 'building_code', 'fema_combined_rating', 'fema_rating_label', 'fema_weakening_note', 'match_method'].join(','),
  ...[...J].sort((a, b) => a.state.localeCompare(b.state) || a.county.localeCompare(b.county) || a.name.localeCompare(b.name)).map((o) => [
    o.st, o.state + o.county, cell(o.countyName), cell(o.name), o.id6, A(o), o.units.u1, o.units.u2 + o.units.u34, o.units.u5, o.monthsReported,
    cell(o.j?.Place ?? ''), cell(o.j?.Res_Code ?? ''), cell(o.j?.Building_Code ?? ''), o.j?.Combined_Hazard_Code ?? '', cell(o.j ? RATING_LABEL[o.j.Combined_Hazard_Code] ?? '' : ''),
    cell(o.j?.Local_Code_Weakening_Note ?? ''), o.method,
  ].join(',')),
].join('\n') + '\n';
const countyCsv = [
  ['county_fips', 'county', 'state', 'permit_offices', 'units_all_2025', 'houses_1unit_2025', 'houses_by_offices_rated_current', 'share_houses_rated_current',
    'houses_by_offices_old_weakened_or_no_code', 'houses_by_offices_with_no_residential_code'].join(','),
  ...[...counties].sort((a, b) => a.geoid.localeCompare(b.geoid)).map((c) => [
    c.geoid, cell(c.county), c.st, c.offices, c.all, c.houses, c.cur, c.houses ? (c.cur / c.houses).toFixed(4) : '', c.old, c.none,
  ].join(',')),
].join('\n') + '\n';

// ---- page pieces ----------------------------------------------------------------------------------
const bar = (v: number, max = 1) => `<td class="bar"><span style="width:${Math.max(1, Math.round((v / max) * 100))}%"></span></td>`;
const stateRows = states.filter((s) => s.houses >= MIN_STATE).map((s) =>
  `      <tr><td>${esc(s.name)}</td><td class="n">${num(s.houses)}</td><td class="n"><b>${pct(s.share, 0)}</b></td><td class="n">${s.none ? num(s.none) : '&ndash;'}</td>${bar(s.share)}</tr>`).join('\n');
const SMALL_STATES = states.filter((s) => s.houses < MIN_STATE).map((s) => s.name);
const countyRows = byOld.slice(0, 15).map((c, i) =>
  `      <tr><td class="n">${i + 1}</td><td>${esc(c.county)}, ${c.st}</td><td class="n">${num(c.houses)}</td><td class="n"><b>${num(c.old)}</b></td><td class="n">${c.none ? num(c.none) : '&ndash;'}</td></tr>`).join('\n');
const resRows = RES_ORDER.filter((k) => byRes.get(k)! > 0).map((k) =>
  `      <tr><td>${esc(k)}</td><td class="n">${num(byRes.get(k)!)}</td><td class="n">${pct(byRes.get(k)! / HOUSES)}</td>${bar(byRes.get(k)!, Math.max(...byRes.values()))}</tr>`).join('\n');
const hazardRows = hazards.map((h) =>
  `      <tr><td>${esc(h.label)}</td><td class="n">${num(h.atRisk)}</td><td class="n"><b>${pct(h.share)}</b></td>${bar(h.share)}</tr>`).join('\n');
const maricopaRows = [...MARICOPA.offices_].sort((a, b) => H(b) - H(a)).slice(0, 8).map((o) =>
  `      <tr><td>${esc(o.name.replace(/ Unincorporated Area$/, ' (unincorporated)'))}</td><td class="n">${num(H(o))}</td><td>${esc(o.j?.Res_Code ?? 'unmatched')}</td><td>${rating(o) === '2' ? 'Current' : rating(o) === '1' ? 'Not current' : 'No data'}</td></tr>`).join('\n');

// Lookup: every county, with its largest permit offices.
// Kept compact (the page was 558 KB with the first version): counties with at least one new house,
// their four largest offices, the code shortened ("2024 IRC" -> "2024 IRC" stays readable, "No
// Residential Code" -> "None"), and the rating as a digit the script maps back to words.
const LK_OFFICES = 4;
const RATING_DIGIT: Record<string, number> = { '2': 2, '1': 1, '0': 0, unmatched: 3 };
const shortCode = (s: string) => (s === 'No Residential Code' ? 'None' : s === 'No Data' ? '' : s);
const lookupCounties = counties.filter((c) => c.houses > 0);
const lookupData = [...lookupCounties].sort((a, b) => a.st.localeCompare(b.st) || a.county.localeCompare(b.county)).map((c) => {
  const offs = [...c.offices_].filter((o) => H(o) > 0).sort((a, b) => H(b) - H(a));
  return [`${c.county}, ${c.st}`, c.houses, c.cur, c.old, c.none,
    offs.slice(0, LK_OFFICES).map((o) => [o.name.replace(/ Unincorporated Area$/, ' (uninc.)'), H(o), shortCode(o.j?.Res_Code ?? ''), RATING_DIGIT[rating(o)]]),
    Math.max(0, offs.length - LK_OFFICES)];
});

const LOOKUP_CSS = `
  .lookup{border:1px solid #ded9cf;background:#fbfaf7;padding:1.1rem 1.2rem;margin:0 0 2.2rem}
  .lk-eyebrow{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#6f5a3a;margin:0 0 .7rem}
  .lookup select{width:100%;font:400 15px/1.4 ui-sans-serif,system-ui,sans-serif;padding:.55rem .6rem;border:1px solid #c9c1b3;background:#fff;color:#1a1a1a;border-radius:2px}
  .lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7rem,1fr));gap:1px;background:#ded9cf;border:1px solid #ded9cf;margin:.9rem 0 0}
  .lk-cell{background:#fbfaf7;padding:.65rem .7rem}
  .lk-cell b{display:block;font:700 1.3rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .lk-cell span{display:block;font:400 11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin-top:.25rem}
  .lk-offices{width:100%;border-collapse:collapse;font:400 12.5px/1.45 ui-sans-serif,system-ui,sans-serif;margin:.8rem 0 0}
  .lk-offices td{border-bottom:1px solid #ece8e1;padding:.35rem .3rem}
  .lk-offices td.n{text-align:right;font-variant-numeric:tabular-nums}
  .lk-msg{font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.8rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;

const LOOKUP_MARKUP = `<div class="lookup">
    <p class="lk-eyebrow">Look up any of the ${num(lookupCounties.length)} counties that permitted new houses in ${BPS_YEAR}</p>
    <label for="btcpick" style="position:absolute;left:-9999px">Choose a county</label>
    <select id="btcpick"><option value="">Choose a county&hellip;</option></select>
    <div id="btcout" aria-live="polite"></div>
    <p class="lk-caveat">New single-family houses permitted in ${BPS_YEAR} (Census Building Permits Survey), by the permit
    office that issued them, and the code FEMA&rsquo;s Building Code Adoption Tracking lists for that office as of
    ${'September 30, 2026'}. &ldquo;Current&rdquo; is FEMA&rsquo;s rating: the 2021 or 2024 codes with no weakening
    amendments. A rating describes the code a government adopted, not how any one house was built.</p>
  </div>`;

// The lookup data is its own file (about 340 KB inline made the page 374 KB; the other studies are
// 70-200 KB). Page and embed both fetch it from the same origin; prerender-research copies it.
const LOOKUP_FILE = 'built-to-code-lookup.json';
const LOOKUP_URL = `/research/data/${LOOKUP_FILE}`;
const DATA_SCRIPT = `<script type="application/json" id="btc-data">${JSON.stringify({ src: LOOKUP_URL })}</script>`;
const JS_SCRIPT = `<script>
(function(){
  var s=document.getElementById('btcpick'),o=document.getElementById('btcout'),d=[];
  var src=JSON.parse(document.getElementById('btc-data').textContent).src;
  s.disabled=true;
  fetch(src).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){
    d=j; s.disabled=false;
    d.forEach(function(c,i){var e=document.createElement('option');e.value=i;e.textContent=c[0];s.appendChild(e);});
  }).catch(function(){o.innerHTML='<p class="lk-msg">The county list did not load. The same figures are in the county CSV below.</p>';});
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  function fmt(n){return n.toLocaleString('en-US');}
  function h(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  var W=['no FEMA data','not current','current','not matched'];
  s.addEventListener('change',function(){
    var c=d[s.value]; if(!c){o.innerHTML='';return;}
    var share=Math.round(c[2]/c[1]*1000)/10;
    var rows=c[5].map(function(x){return '<tr><td>'+h(x[0])+'</td><td class="n">'+fmt(x[1])+'</td><td>'+(x[2]==='None'?'No residential code':(x[2]?h(x[2]):'&ndash;'))+'</td><td>'+W[x[3]]+'</td></tr>';}).join('');
    o.innerHTML='<div class="lk-grid">'
      +cell(fmt(c[1]),'new houses permitted in ${BPS_YEAR}')
      +cell(share.toFixed(1)+'%','permitted by offices FEMA rates current')
      +cell(fmt(c[3]),'permitted under an old or weakened code, or none')
      +cell(fmt(c[4]),'where FEMA lists no residential code')
      +'</div>'
      +'<table class="lk-offices"><tbody>'+rows+'</tbody></table>'
      +(c[6]?'<p class="lk-msg">Plus '+c[6]+' smaller permit office'+(c[6]>1?'s':'')+' in the data file.</p>':'');
  });
})();
</script>`;

const top3None = HARRIS.none + MONTG.none + FTBEND.none;
const KEY_FINDINGS = keyFindingsBlock([
  `Of ${num(HOUSES)} new single-family houses permitted in the US in ${BPS_YEAR}, ${num(OLD)} (${pct(SHARE_OLD)}) were permitted by local governments that FEMA, as of September 30, 2026, rates as having an old or weakened building code, or none.`,
  `${num(NOCODE)} new houses, ${pct(NOCODE / HOUSES)} of the total, were permitted where FEMA lists no residential code at all, most of them in the unincorporated parts of Texas counties.`,
  `Texas and North Carolina together account for ${pct((TX.old + NC.old) / OLD, 0)} of the houses permitted under codes FEMA does not rate as current: ${num(TX.old)} in Texas and ${num(NC.old)} in North Carolina, where the statewide code is still based on the 2015 International Residential Code.`,
  `In Harris, Montgomery and Fort Bend counties, Texas, ${num(top3None)} new houses were permitted in places where FEMA lists no residential code.`,
  `Among houses permitted in places FEMA marks as tornado-prone, ${pct(hz('Tornado').share)} were permitted under codes FEMA rates current for tornadoes, the lowest of the five hazards it tracks.`,
], `Source: U.S. Census Bureau, Building Permits Survey, ${BPS_YEAR} annual place files; FEMA Building Code Adoption Tracking, data as of September 30, 2026. Analysis by Before Regret. Puerto Rico is not included.`);

// ---- questions this data answers ----------------------------------------------------------------
const FAQ: Array<{ q: string; a: string }> = [
  { q: 'What percentage of new homes are built to current building codes?',
    a: `Of ${num(HOUSES)} new single-family houses permitted in the US in ${BPS_YEAR}, ${pct(SHARE_CUR)} were permitted by local governments that FEMA rates as having current hazard-resistant codes, meaning the 2021 or 2024 International Residential and Building Codes with no weakening amendments. ${pct(SHARE_OLD)} were permitted under codes FEMA rates as old or weakened, or where no code is adopted. FEMA's ratings are as of September 30, 2026; the permit counts are from the Census Building Permits Survey.` },
  { q: 'Which states have the most new homes built under old building codes?',
    a: `By count, Texas (${num(TX.old)} new houses in ${BPS_YEAR}) and North Carolina (${num(NC.old)}), followed by ${poolRank[2].name} (${num(poolRank[2].old)}). Every permit office in North Carolina works under the state code based on the 2015 IRC; FEMA's note says the 2021 update was adopted but its effective date was delayed by S.L. 2025-2.` },
  { q: 'Does Texas have a statewide building code for houses?',
    a: `No. FEMA's tracking says Texas has no mandatory statewide building or residential code. Cities set their own, and Texas Local Government Code section 233.153 lets a county require new houses in its unincorporated area to conform to the International Residential Code published as of May 1, 2008, or the version used in the county seat, if the county adopts a resolution or order to apply it.` },
  { q: 'How do I find out which building code applies to my address?',
    a: `Find out which government issues building permits for the address: the city if it is inside city limits, otherwise usually the county. FEMA's Building Code Adoption Tracking portal lists the residential and building code edition each jurisdiction has adopted. For a house already built, the permit record shows when it was permitted, and the code in force on that date is the one that applied.` },
  { q: 'Where can I download building code adoption data by county?',
    a: `This study publishes two CSV files under a CC BY 4.0 licence: every US county with ${BPS_YEAR} house permits split by FEMA's rating of the issuing office, and every one of the ${num(J.length)} Census permit-issuing offices with its matched FEMA jurisdiction, residential code edition, rating and weakening note. FEMA's underlying data is in its Building Code Adoption Tracking portal.` },
];
const FAQ_HTML = FAQ.map((f) => `    <h3 class="faq-q">${esc(f.q)}</h3>\n    <p>${esc(f.a)}</p>`).join('\n');

const html = `<style>
  .wrap{max-width:45rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.68 Charter,Georgia,'Times New Roman',serif;color:#1b1a18}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#6f5a3a;margin:0 0 .9rem}
  .wrap h1{font-size:2.4rem;line-height:1.1;margin:0 0 1rem;font-weight:600;letter-spacing:-.02em}
  .standfirst{font-size:1.17rem;line-height:1.6;color:#3a3936;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#6f5a3a;margin:2.8rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #ded9cf}
  .wrap h3{font-size:1.34rem;line-height:1.34;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr));gap:1px;background:#ded9cf;border:1px solid #ded9cf;margin:0 0 2rem}
  .fig{background:#fbfaf7;padding:1rem .9rem}
  .fig b{display:block;font:700 1.7rem/1.05 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.025em}
  .fig span{display:block;font:400 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin-top:.3rem}
  .finding{background:#f6f3ec;border-left:3px solid #6f5a3a;padding:1.1rem 1.2rem;margin:0 0 1.4rem;font-size:1.02rem}
  .finding p{margin:0}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem;font-variant-numeric:tabular-nums}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1b1a18;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a;white-space:nowrap}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right}
  td.bar{width:24%;padding-right:0}
  td.bar span{display:block;height:9px;background:#6f5a3a;min-width:2px}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1.5rem}
  .tall{max-height:26rem;overflow-y:auto}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:0 0 1.9rem}
  blockquote{margin:0 0 1.2rem;padding:.2rem 0 .2rem 1rem;border-left:3px solid #ded9cf;color:#3a3936;font-style:italic}
  .cite{background:#f3f0e9;border:1px solid #ded9cf;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.4rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:#6f5a3a;margin-bottom:.5rem}
  .snippet{background:#fff;border:1px solid #ded9cf;padding:.7rem .8rem;margin:.7rem 0;overflow-x:auto;font:400 11.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#4a4a4a;white-space:pre}
  .cite code{font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;padding:.1em .3em;border:1px solid #ded9cf}
  .wrap a{color:#6f5a3a}
  .cta{border:1px solid #d6cdbd;background:#fcfaf5;padding:1.3rem 1.4rem;margin:0 0 2.4rem}
  .cta h2{margin-top:0;padding-top:0;border-top:0}
  .cta p{font:400 14.5px/1.62 ui-sans-serif,system-ui,sans-serif;color:#2e2e2e;margin:0 0 .9rem}
  .cta a.btn{display:inline-block;background:#6f5a3a;color:#fff;font:700 14px/1 ui-sans-serif,system-ui,sans-serif;padding:.75rem 1.1rem;border-radius:2px;text-decoration:none}
  .cta a.btn:hover{background:#584628}
  .faq h3.faq-q{font-size:1.08rem;margin:1.3rem 0 .4rem}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #ded9cf;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a}
${LOOKUP_CSS}
  @media(max-width:560px){.wrap h1{font-size:1.9rem}td.bar,th.bar{display:none}}
${KF_CSS}
</style>

<div class="wrap">
  <p class="kicker">National analysis &middot; ${num(J.length)} permit offices &middot; Census permits ${BPS_YEAR} &middot; FEMA BCAT</p>
  <h1>${STUDY_NAME}</h1>
  <p class="standfirst">Every new house is built to a code, but not the same one. We matched each of the
  ${num(HOUSES)} single-family houses permitted in the US in ${BPS_YEAR} to the government that issued the
  permit and the code FEMA says that government has adopted. Nearly half, ${num(OLD)} houses or ${pct(SHARE_OLD)},
  came from places FEMA rates as having an old or weakened code, or none.</p>

  <div class="figs">
    <div class="fig"><b>${num(HOUSES)}</b><span>new houses permitted in ${BPS_YEAR}</span></div>
    <div class="fig"><b>${pct(SHARE_OLD)}</b><span>under a code FEMA does not rate current</span></div>
    <div class="fig"><b>${num(NOCODE)}</b><span>where FEMA lists no residential code</span></div>
    <div class="fig"><b>${pct(MATCHED_SHARE)}</b><span>of houses matched to a FEMA rating</span></div>
  </div>

  ${KEY_FINDINGS}

  ${LOOKUP_MARKUP}

  <div class="cta">
    <h2>A code rating is not an inspection</h2>
    <p>FEMA rates the code a city or county adopted. It does not look at houses, and a house permitted under
    an older edition can be well built. What the rating tells you is which questions are worth asking about a
    newer house: which code edition it was permitted under, and whether the inspections were signed off.</p>
    <p>For one address, a free Before Regret report lists what to check for a house of that age in that
    county, and where its permit records are. No sign-up required.</p>
    <p><a class="btn" href="/">Get the free report</a></p>
  </div>

  <h2>What FEMA counts as current</h2>
  <h3>The two newest editions, with nothing weakened.</h3>

  <p>FEMA&rsquo;s Building Code Adoption Tracking, BCAT for short, follows the codes adopted by about 30,000
  state, local, tribal and territorial governments, and updates them every quarter. Its test is narrow. In
  FEMA&rsquo;s words, it considers a community &ldquo;hazard-resistant&rdquo; if it has &ldquo;adopted the latest
  or second most recent codes without weakening the hazard-resistant provisions through amendments.&rdquo;
  Today that means the 2021 or 2024 International Residential Code, and the International Building Code of
  the same vintage. The map legend in FEMA&rsquo;s portal labels everything else &ldquo;${esc(RATING_LABEL['1'])}.&rdquo;</p>

  <p>FEMA reports the result two ways: as of its FY2026 fourth-quarter data, 34% of hazard-prone jurisdictions
  have current codes, and 53% of the population lives in one. Neither number says where new houses are
  going up. A small town with a current code and a fast-growing county without one count the same in the
  first measure. This study weights the ratings by the houses each permit office actually approved.</p>

  <p>FEMA is careful about what &ldquo;not current&rdquo; means, and so are we. Its page says the measure
  &ldquo;does not mean communities built to the 2015 codes &ndash; for example &ndash; are suddenly
  underprepared,&rdquo; and that &ldquo;adoption is just the first step in natural hazard resistance.
  Enforcement is key.&rdquo;</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Residential code of the permit office</th><th class="n">New houses, ${BPS_YEAR}</th><th class="n">Share</th><th class="bar"></th></tr></thead>
      <tbody>
${resRows}
      </tbody>
    </table>
  </div>
  <p class="cap">New single-family houses permitted in ${BPS_YEAR}, by the residential code edition FEMA lists for the
  issuing office. Wisconsin uses its own Uniform Dwelling Code instead of the IRC. Edition alone is not FEMA&rsquo;s rating:
  ${num(WEAK)} houses were permitted by offices on the 2021 or 2024 IRC that FEMA still rates not current, because of
  weakening amendments or an older building code alongside.</p>

  <h2>By state</h2>
  <h3>Whole states sit on one side of the line or the other.</h3>

  <p>Where a state sets one mandatory code for everyone, every permit office lands in the same place. In
  ${allCur.map((s) => s.name).slice(0, -1).join(', ')} and ${allCur[allCur.length - 1].name}, every new house in our data was permitted under a
  code FEMA rates current. In ${noneCur.map((s) => s.name).slice(0, -1).join(', ')} and ${noneCur[noneCur.length - 1].name}, none was.
  The split states are the ones where cities and counties choose for themselves, and Texas, which permitted
  more new houses than any other state, ${num(TX.houses)}, is the largest of those: ${pct(TX.share, 0)} of its new
  houses came from offices FEMA rates current.</p>

  <div class="scroll tall">
    <table>
      <thead><tr><th>State</th><th class="n">New houses</th><th class="n">Rated current</th><th class="n">No residential code</th><th class="bar"></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>
  <p class="cap">States with at least ${num(MIN_STATE)} new single-family houses permitted in ${BPS_YEAR}, by houses. &ldquo;Rated
  current&rdquo; is the share permitted by offices FEMA rates current. ${SMALL_STATES.length} smaller states and DC
  (${esc(SMALL_STATES.join(', '))}) are in the data file.</p>

  <p>Two states hold more than a third of all the houses on the not-current side between them: Texas with
  ${num(TX.old)} and North Carolina with ${num(NC.old)}.</p>

  <h2>Same county, different codes</h2>
  <h3>The line usually runs between a city and the land around it.</h3>

  <p>A county is not one building code. Maricopa County, Arizona permitted more new houses than any other
  county in ${BPS_YEAR}, ${num(MARICOPA.houses)}, and they split almost evenly: Phoenix is on the 2024 IRC and
  rated current, while the unincorporated county is on the 2012 IRC. ${num(split.length)} counties have at
  least 200 new houses on each side of FEMA&rsquo;s line.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Maricopa County permit office</th><th class="n">New houses</th><th>Residential code</th><th>FEMA rating</th></tr></thead>
      <tbody>
${maricopaRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The eight Maricopa County permit offices that approved the most new houses in ${BPS_YEAR}.</p>

  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">New houses</th><th class="n">Not current</th><th class="n">No res. code</th></tr></thead>
      <tbody>
${countyRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The 15 counties with the most new houses permitted under codes FEMA does not rate current, ${BPS_YEAR}.</p>

  <h2>Texas</h2>
  <h3>&ldquo;No residential code&rdquo; doesn&rsquo;t always mean no rules.</h3>

  <p>The top three counties on that list are all around Houston. In Harris, Montgomery and Fort Bend
  counties, ${num(top3None)} new houses were permitted in places where FEMA lists no residential code, nearly all
  of them in unincorporated areas. That follows from how Texas is set up. FEMA&rsquo;s note for Texas says
  the state &ldquo;has no mandatory statewide building or residential code.&rdquo; Cities adopt their own;
  counties mostly can&rsquo;t.</p>

  <p>There is one state rule that can apply, and buyers should know about it. Under Texas Local Government
  Code &sect; 233.153, new houses in the unincorporated area of a county that has opted in &ldquo;shall conform
  to the version of the International Residential Code published as of May 1, 2008, or the version of the
  International Residential Code that is applicable in the county seat of that county.&rdquo; It applies only
  in a county &ldquo;that has adopted a resolution or order requiring the application&rdquo; of those rules
  (&sect; 233.152). The builder, not the county, hires the inspectors, and &sect; 233.154 requires at least
  three inspections: the foundation before the concrete is poured, framing and mechanical systems before the
  drywall goes up, and completion.</p>

  <p>So for a new house outside city limits in Texas, the useful questions are whether the county opted in,
  which code the builder used, and whether the builder can show you the three inspection reports. If the
  house sits in a city&rsquo;s extraterritorial jurisdiction and that city has a building code there, the
  city&rsquo;s code controls instead (&sect; 233.153(c)).</p>

  <h2>North Carolina</h2>
  <h3>A whole state still on the 2015-based code.</h3>

  <p>North Carolina permitted ${num(NC.houses)} new houses in ${BPS_YEAR}, and every one of them came from an office
  working under the state&rsquo;s residential code based on the 2015 IRC. Wake County alone, Raleigh and the
  towns around it, accounted for ${num(WAKE.houses)}. FEMA&rsquo;s note for the state explains the delay: North
  Carolina adopted the 2021 codes with an original effective date of July 1, 2025, then &ldquo;enacted S.L.
  2025-2, which delays the effective date until 12 months after the SFM certifies that certain statutory and
  publication and distribution requirements have been met.&rdquo; Until then, it says, the previous code
  &ldquo;remains in effect.&rdquo;</p>

  <h2>New edition, still not current</h2>
  <h3>${num(WEAK)} houses came from offices on the 2021 or 2024 IRC that FEMA still marks down.</h3>

  <p>An office can adopt the newest residential code and still miss FEMA&rsquo;s bar, because the rating
  looks at the building code too, and at amendments that weaken flood, wind, tornado or seismic
  provisions. ${STATE_NAME[weakRank[0][0]]} has the most houses in this group, ${num(weakRank[0][1])}: its statewide code
  is based on the 2021 IRC, and FEMA still rates it not current for at least one hazard. Oklahoma City is
  another case: FEMA lists it on the 2024 IRC but not current, and its note shows the timing problem every
  reader of this data should keep in mind. The 2024 codes there took effect on 09/14/2026; the 2018
  residential code ran until 09/13/2026, so the city&rsquo;s ${BPS_YEAR} houses were permitted under that.</p>

  <h2>By hazard</h2>
  <h3>Tornado country has the lowest share on current codes.</h3>

  <p>FEMA rates each jurisdiction separately for each hazard it faces. Counting only the new houses permitted
  in places FEMA marks as exposed to a hazard, the share permitted under codes current for that hazard runs
  from ${pct(hz('Seismic').share)} for earthquakes down to ${pct(hz('Tornado').share)} for tornadoes.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Hazard</th><th class="n">New houses in exposed places</th><th class="n">Current for that hazard</th><th class="bar"></th></tr></thead>
      <tbody>
${hazardRows}
      </tbody>
    </table>
  </div>
  <p class="cap">New single-family houses permitted in ${BPS_YEAR} by offices FEMA marks as exposed to each hazard. A
  house can count under several hazards.</p>

  <h2>What this means if you&rsquo;re buying a newer house</h2>
  <h3>Ask which code it was permitted under.</h3>

  <p>A house built in the last few years isn&rsquo;t automatically built to the latest code. The code that
  applied is the one adopted by whoever issued the permit, on the date it was issued. Three things will tell
  you more than the age of the house:</p>
  <ul>
    <li><strong>The permit record.</strong> It shows the issuing office and the date, and often the
    inspections that were passed. Here is <a href="/guides/look-up-building-permits-by-address/">how to look
    up building permits by address</a>.</li>
    <li><strong>Final sign-off.</strong> A permit that was issued but never closed is worth a question
    before closing. <a href="/guides/resolve-open-building-permits-before-closing/">What to do about an open
    permit</a> explains the usual fixes.</li>
    <li><strong>Your own inspector.</strong> A new-construction inspection can still find problems a code
    inspection didn&rsquo;t look for. <a href="/guides/home-inspection-checklist-cost/">What a home inspection
    covers</a> lists what to expect.</li>
  </ul>

  <h2>Method</h2>
  <h3>How the match was made.</h3>

  <p>Permit counts are from the U.S. Census Bureau&rsquo;s Building Permits Survey, ${BPS_YEAR} annual place
  files, which report new privately owned housing units authorized by each of ${num(J.length)} permit-issuing
  offices in the 50 states and DC: cities, towns, townships, and counties for their unincorporated land. We
  use single-family units, the 1-unit column, as &ldquo;new houses&rdquo;. The place files total
  ${num(ALL)} units of all kinds, against ${num(CTRL)} in the Census county file for the same year.</p>

  <p>Code ratings are from FEMA&rsquo;s Building Code Adoption Tracking jurisdiction layer, the data behind
  FEMA&rsquo;s BCAT portal, pulled on ${raw.fetchedAt.slice(0, 10)}. Every row carries a data date of
  September 30, 2026. We use FEMA&rsquo;s combined hazard rating and its residential code field as they are.</p>

  <p>The two datasets share no ID, so each permit office was matched to a FEMA jurisdiction by state,
  county and name, in a fixed order: same name in the same county; a county&rsquo;s unincorporated area to
  FEMA&rsquo;s row for that county; a name found only once in the state; a FEMA name that starts with the
  office name. Where FEMA lists jurisdictions in a county but not the office itself, the office takes the
  county&rsquo;s rating only if every jurisdiction FEMA lists there has the same rating and code. Houses
  matched this way cover ${pct(MATCHED_SHARE)} of the total. The rest, ${num(UNMATCHED)} houses, are mostly permits
  issued by state agencies directly, and are counted as unmatched rather than guessed. The method used for
  every office is in the data file.</p>

  <p>Puerto Rico&rsquo;s ${num(prOffices.length)} permit offices are in the Census files and are left out of every figure here.</p>

  <h2>Limitations</h2>
  <h3>What this does not show.</h3>

  <p><strong>Timing.</strong> The permits are from ${BPS_YEAR}; the ratings are as of September 30, 2026. A place
  that adopted a newer code in 2026 is rated on that newer code, though its ${BPS_YEAR} houses were permitted under
  the old one. Codes rarely move backward, so the ${pct(SHARE_OLD)} figure is more likely to understate the share
  permitted under a not-current code than to overstate it.</p>

  <p><strong>Adoption is not enforcement.</strong> A rating describes the code on a government&rsquo;s books, not
  how well it was inspected or how any house was built. Permits are authorizations, not completed houses, and
  manufactured homes, which follow a separate federal standard, are not in the Census count.</p>

  <p><strong>Estimates.</strong> The Census Bureau imputes permits for offices that did not report every month;
  ${pct(REPORTED_SHARE)} of the houses here were directly reported, the rest imputed. A county figure covers every
  permit office in the county, so it can blend very different codes, and it says nothing about any one house.</p>

  <h2>Questions this data answers</h2>
  <div class="faq">
${FAQ_HTML}
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;${STUDY_NAME} New US homes by the building code they were permitted under.&rdquo;
    ${PUBLISHED}. Analysis of U.S. Census Bureau Building Permits Survey ${BPS_YEAR} place files and FEMA Building
    Code Adoption Tracking data as of September 30, 2026, for ${num(J.length)} permit offices.<br>
    <a href="${STUDY_URL}">${STUDY_URL}</a><br>
    Data: <a href="https://www.beforeregret.com/research/data/built-to-code-by-county.csv">every county (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/built-to-code-by-permit-office.csv">every permit office (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/built-to-code-figures.json">figures (JSON)</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the county lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="460" style="border:1px solid #ded9cf"
        title="New houses by building code, by county"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code>.
  </div>

  <div class="cite">
    <b>For newsrooms, builders and inspectors</b>
    Published under a Creative Commons Attribution 4.0 licence: republish the figures, redraw the tables, or run
    your own cut without asking, with credit to Before Regret and a link to this page. The Census and FEMA data
    are US Government works. Happy to pull a specific county or permit office, or check a figure before it
    prints &mdash; hello@beforeregret.com.
  </div>

  <footer class="spine">
    Sources: U.S. Census Bureau, Building Permits Survey, ${BPS_YEAR} annual place and county files; FEMA Building
    Code Adoption Tracking, jurisdiction layer, data as of September 30, 2026, retrieved ${raw.fetchedAt.slice(0, 10)};
    Texas Local Government Code &sect;&sect; 233.152&ndash;233.154, read ${'2026-11-25'}.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/permit-pulse/">Permit Pulse</a> &#183;
    <a href="/research/oldest-housing/">Before 1940</a> &#183;
    <a href="/research/permit-search-done-right/">Permit search done right</a>
  </footer>
</div>
${DATA_SCRIPT}
${JS_SCRIPT}
`;

const embed = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New houses by building code, by county &mdash; Before Regret</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${STUDY_URL}">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:16px;background:#fbfaf7;color:#1b1a18;font:16px/1.6 Charter,Georgia,serif;-webkit-font-smoothing:antialiased}
${LOOKUP_CSS}
  .lookup{max-width:680px;margin:0 auto}
  .embed-credit{max-width:680px;margin:12px auto 0;font:400 11px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;text-align:right}
  .embed-credit a{color:#6f5a3a}
</style>
</head>
<body>
${LOOKUP_MARKUP}
<p class="embed-credit"><a href="${STUDY_URL}" target="_blank" rel="noopener">${STUDY_NAME} New houses by building code</a> &mdash; Before Regret</p>
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

// ---- guards ---------------------------------------------------------------------------------------
if (!html.includes('class="cta"')) throw new Error('ABORT: study lost its call to action');
if (embed.includes('class="cta"')) throw new Error('ABORT: the CTA leaked into the embed');
for (const [name, doc] of [['study', html], ['embed', embed]] as Array<[string, string]>) {
  if (!doc.includes('lk-caveat')) throw new Error(`ABORT: ${name} lost the lookup caveat`);
  if (!doc.includes('btc-data')) throw new Error(`ABORT: ${name} lost the lookup data`);
}
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
const visible = html.slice(0, html.indexOf('<script type="application/json"'));
for (const banned of [/most (?:insurers|carriers)/i, /\b(insurer|carrier)s? (?:will|won't|refuse|deny|drop)/i, /\b(unsafe|dangerous|death ?trap|deadly)\b/i, /this (?:house|home) (?:was|is|has)/i]) {
  if (banned.test(visible)) throw new Error(`ABORT: unsupported or fear claim matched ${banned}`);
}
assertKeyFindingsNumbers(visible, 'build-built-to-code-study');

const figures = {
  title: `${STUDY_NAME} New US houses by the building code they were permitted under`,
  generated: new Date().toISOString().slice(0, 10),
  fetchedAt: raw.fetchedAt,
  sources: raw.sources,
  permitYear: BPS_YEAR,
  bcatDataAsOf: BCAT_ASOF,
  scope: { permitOffices: J.length, counties: counties.length, excludedPuertoRicoOffices: prOffices.length, unit: 'single-family (1-unit) housing units authorized' },
  national: {
    houses: HOUSES, allUnits: ALL, countyFileAllUnits: CTRL,
    housesRatedCurrent: CUR, housesOldWeakenedOrNone: OLD, housesNoBcatData: NODATA, housesUnmatched: UNMATCHED,
    shareRatedCurrent: +SHARE_CUR.toFixed(4), shareOldWeakenedOrNone: +SHARE_OLD.toFixed(4),
    housesNoResidentialCode: NOCODE, housesCurrentEditionButNotRatedCurrent: WEAK,
    shareDirectlyReported: +REPORTED_SHARE.toFixed(4), shareMatched: +MATCHED_SHARE.toFixed(4),
  },
  ratingLabels: RATING_LABEL,
  byResidentialCode: RES_ORDER.map((k) => ({ code: k, houses: byRes.get(k)! })),
  states: states.map((s) => ({ state: s.name, abbr: s.st, houses: s.houses, ratedCurrent: s.cur, oldWeakenedOrNone: s.old, noResidentialCode: s.none, shareRatedCurrent: +s.share.toFixed(4) })),
  topCountiesNotCurrent: byOld.slice(0, 25).map((c) => ({ geoid: c.geoid, county: c.county, state: c.st, houses: c.houses, oldWeakenedOrNone: c.old, noResidentialCode: c.none })),
  splitCounties: split.length,
  hazards: hazards.map((h) => ({ hazard: h.label, housesInExposedPlaces: h.atRisk, housesUnderCodesCurrentForHazard: h.cur, share: +h.share.toFixed(4) })),
  matchMethods: Object.fromEntries(['exact', 'county', 'state', 'prefix', 'uniform', 'unmatched'].map((m) => [m, sum(J.filter((o) => o.method === m), H)])),
  faq: FAQ,
};

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
fs.writeFileSync(OUT_CSV_COUNTY, countyCsv);
fs.writeFileSync(OUT_CSV_OFFICE, officeCsv);
fs.writeFileSync(OUT_FIG, JSON.stringify(figures, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'docs', 'data', LOOKUP_FILE), JSON.stringify(lookupData));
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${(html.length / 1024).toFixed(1)} KB), embed (${(embed.length / 1024).toFixed(1)} KB)`);
console.log(`wrote county CSV (${counties.length}), office CSV (${J.length}), figures`);
console.log(`  houses ${num(HOUSES)}: current ${pct(SHARE_CUR)}, old/weak/none ${pct(SHARE_OLD)}, no res code ${num(NOCODE)}, unmatched ${num(UNMATCHED)}; split counties ${split.length}`);
