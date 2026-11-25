// Generates the twelfth study, /research/mortgage-denied-collateral/ -- how often a 2024 home-purchase
// mortgage was denied with the property itself ("collateral", HMDA denial reason 4) as a reason, by loan
// type, home type, neighbourhood housing age, state and county.
//
//   npx tsx scripts/fetch-hmda-collateral-data.ts               # FFIEC HMDA 2024 -> docs/data/hmda-collateral-raw.json (gitignored)
//   set -a && . ./.env && set +a && npx tsx scripts/build-mortgage-denied-collateral-study.ts
//                                                               # -> docs/mortgage-denied-collateral.html (+ embed, CSVs, figures, lookup)
//   (.env supplies CENSUS_API_KEY, used once for county names.)
//
// -------------------------------------------------------------------------------------------
// WHY THIS STUDY. A buyer worries about a loan falling through over their own finances. HMDA shows how
// often it is the house instead, and where. Nobody publishes the collateral reason cut by tract housing
// age or by county with a lookup; the FFIEC data browser has the rows, not the answer.
//
// WHAT IT MUST NOT SAY.
//  - WHY the collateral was not enough. HMDA code 4 is just "Collateral" (FFIEC LAR field definitions);
//    Regulation B's sample notice words it "Value or type of collateral not sufficient". The file can't
//    split a low appraisal from the condition of the house or the type of property, so the page doesn't.
//  - Anything about a specific house. Housing age is the census TRACT median, not the home's own age.
//  - Condo or co-op explanations for the top counties. HMDA has no condo or co-op field. The page says
//    it can't tell why and stops there.
//  - Race, ethnicity, sex or age of applicants. Not used anywhere.
//  - No lender names, no insurer names, no fear words.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';

const SLUG = 'mortgage-denied-collateral';
const RAW = path.join(process.cwd(), 'docs', 'data', 'hmda-collateral-raw.json');
const OUT = path.join(process.cwd(), 'docs', `${SLUG}.html`);
const OUT_EMBED = path.join(process.cwd(), 'docs', `${SLUG}.embed.html`);
const OUT_CSV_COUNTY = path.join(process.cwd(), 'docs', 'data', `${SLUG}-by-county.csv`);
const OUT_CSV_STATE = path.join(process.cwd(), 'docs', 'data', `${SLUG}-by-state.csv`);
const OUT_FIG = path.join(process.cwd(), 'docs', 'data', `${SLUG}-figures.json`);
const LOOKUP_FILE = `${SLUG}-lookup.json`;

const PUBLISHED = '25 November 2026';
const STUDY_URL = `https://www.beforeregret.com/research/${SLUG}/`;
const STUDY_NAME = 'Denied Because of the House';
const MIN_LOOKUP = 100;   // county rates are shown only from this many applications
const MIN_RANK = 3_000;   // counties ranked in the page table
const MIN_STATE = 2_000;  // states shown in the page table

if (!fs.existsSync(RAW)) throw new Error('ABORT: run scripts/fetch-hmda-collateral-data.ts first');
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const FETCHED = String(raw.fetchedAt).slice(0, 10);
const YEAR: number = raw.year;

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => Math.round(v).toLocaleString('en-US');
const per = (v: number) => v.toFixed(1);
const must = (cond: boolean, msg: string) => { if (!cond) throw new Error(`ABORT: ${msg}`); };

// ---- rows -----------------------------------------------------------------------------------------
const KF: string[] = raw.keyFields, VF: string[] = raw.valueFields;
must(KF.join() === 'state_code,county_code,loan_type,construction_method,lien_status,occupancy_type,units,tract_median_housing_age', 'raw key fields changed');
must(VF.length === 14 && VF[2] === 'collateral_any' && VF[13] === 'denied_reason_exempt', 'raw value fields changed');
type Key = Record<string, string>;
const rows: Array<[Key, number[]]> = Object.entries(raw.data as Record<string, number[]>).map(([k, v]) => [Object.fromEntries(KF.map((f, i) => [f, k.split('|')[i]])), v]);

type Agg = { apps: number; denied: number; coll: number; collFirst: number; r: number[]; exempt: number };
const blank = (): Agg => ({ apps: 0, denied: 0, coll: 0, collFirst: 0, r: new Array(10).fill(0), exempt: 0 });
const add = (a: Agg, v: number[]) => { a.apps += v[0]; a.denied += v[1]; a.coll += v[2]; a.collFirst += v[3]; for (let i = 1; i <= 9; i++) a.r[i] += v[3 + i]; a.exempt += v[13]; };
const agg = (pred: (k: Key) => boolean) => { const a = blank(); for (const [k, v] of rows) if (pred(k)) add(a, v); return a; };
const group = (pred: (k: Key) => boolean, by: (k: Key) => string) => { const m = new Map<string, Agg>(); for (const [k, v] of rows) if (pred(k)) { const g = by(k); if (!m.has(g)) m.set(g, blank()); add(m.get(g)!, v); } return m; };
const reasoned = (a: Agg) => a.denied - a.exempt;
const mx = (a: Agg) => ({ denialRate: a.denied / a.apps, collShare: a.coll / reasoned(a), per1000: (a.coll / a.apps) * 1000 });

// The typical buyer: a first-lien loan on a single-unit home they will live in.
const CORE = (k: Key) => k.lien_status === '1' && k.occupancy_type === '1' && k.units === '1';
const SITE = (k: Key) => CORE(k) && k.construction_method === '1';
const MANU = (k: Key) => CORE(k) && k.construction_method === '2';

const ALL = agg(() => true), AM = mx(ALL);
const C = agg(CORE), CM = mx(C);
must(ALL.apps === raw.expected && raw.rows === raw.expected && raw.malformed === 0, 'raw row count does not match the FFIEC aggregation total');

const REASONS: Array<[number, string]> = [[1, 'Debt-to-income ratio'], [3, 'Credit history'], [5, 'Insufficient cash (down payment, closing costs)'], [9, 'Other'], [4, 'Collateral'], [6, 'Unverifiable information'], [7, 'Credit application incomplete'], [2, 'Employment history'], [8, 'Mortgage insurance denied']];
const reasonShare = (a: Agg, i: number) => a.r[i] / reasoned(a);
must(C.r[4] === C.coll && ALL.r[4] === ALL.coll, 'collateral count and reason-4 mention count disagree');

const LT: Record<string, string> = { '1': 'Conventional', '2': 'FHA', '3': 'VA', '4': 'USDA' };
const AGES = ['<20', '20-39', '40-59', '60+'];
const AGE_LABEL: Record<string, string> = { '<20': 'Under 20 years', '20-39': '20 to 39 years', '40-59': '40 to 59 years', '60+': '60 years or more' };
const byAge = (pred: (k: Key) => boolean) => AGES.map((g) => ({ g, a: agg((k) => pred(k) && k.tract_median_housing_age === g) })).map((x) => ({ ...x, ...mx(x.a) }));
const ageSite = byAge(SITE), ageConv = byAge((k) => SITE(k) && k.loan_type === '1'), ageFha = byAge((k) => SITE(k) && k.loan_type === '2');
const siteTotal = agg(SITE);
const ageNA = agg((k) => SITE(k) && !AGES.includes(k.tract_median_housing_age));

const loanCore = Object.keys(LT).map((t) => { const a = agg((k) => CORE(k) && k.loan_type === t); return { t, a, ...mx(a) }; });
const manuLoan = Object.keys(LT).map((t) => { const a = agg((k) => MANU(k) && k.loan_type === t); return { t, a, ...mx(a) }; });
const siteLoan = Object.keys(LT).map((t) => { const a = agg((k) => SITE(k) && k.loan_type === t); return { t, a, ...mx(a) }; });
const MANU_ALL = agg(MANU), MM = mx(MANU_ALL), SITE_M = mx(siteTotal);

const PURPOSE: Array<[string, (k: Key) => boolean]> = [
  ['Home they will live in, 1 unit', CORE],
  ['Home they will live in, 2 to 4 units', (k) => k.lien_status === '1' && k.occupancy_type === '1' && k.units === '2-4'],
  ['Second home, 1 unit', (k) => k.lien_status === '1' && k.occupancy_type === '2' && k.units === '1'],
  ['Investment property, 1 unit', (k) => k.lien_status === '1' && k.occupancy_type === '3' && k.units === '1'],
  ['Investment property, 2 to 4 units', (k) => k.lien_status === '1' && k.occupancy_type === '3' && k.units === '2-4'],
];
const purposes = PURPOSE.map(([label, p]) => { const a = agg(p); return { label, a, ...mx(a) }; });
const INV = purposes[3], TWO4 = purposes[1], SECOND = purposes[2];

// ---- names ----------------------------------------------------------------------------------------
const KEY = (process.env.CENSUS_API_KEY || '').replace(/^["']|["']$/g, '');
must(!!KEY, 'CENSUS_API_KEY is not set (load .env)');
// curl rather than fetch(): Node's fetch hangs on api.census.gov in this environment (see fetch-oldest-housing-data.ts).
const census = JSON.parse(execFileSync('curl', ['-s', '-L', '--max-time', '120', `https://api.census.gov/data/2023/acs/acs5?get=NAME&for=county:*&key=${KEY}`], { maxBuffer: 16 * 1024 * 1024 }).toString()) as string[][];
const CNAME = new Map(census.slice(1).map(([n, s, c]) => [s + c, n]));
must(CNAME.size > 3_200, `Census county list is short (${CNAME.size})`);
const STATE_NAME: Record<string, string> = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam' };

// ---- states and counties (typical buyer only) -----------------------------------------------------
const stMap = group(CORE, (k) => k.state_code);
const naState = stMap.get('NA'); stMap.delete('NA');
for (const s of stMap.keys()) must(!!STATE_NAME[s], `no name for state ${s}`);
const states = [...stMap.entries()].map(([s, a]) => ({ s, name: STATE_NAME[s], a, ...mx(a) })).sort((x, y) => y.per1000 - x.per1000);
const statesShown = states.filter((x) => x.a.apps >= MIN_STATE);
const ctMap = group(CORE, (k) => k.county_code);
const naCounty = ctMap.get('NA'); ctMap.delete('NA');
// Two borough names readers know better than the county names.
const ALIAS: Record<string, string> = { '36061': 'New York County (Manhattan), New York', '36047': 'Kings County (Brooklyn), New York' };
const counties = [...ctMap.entries()].map(([f, a]) => ({ f, name: ALIAS[f] ?? CNAME.get(f) ?? '', a, ...mx(a) }));
const unnamed = counties.filter((x) => !x.name);
must(unnamed.reduce((s, x) => s + x.a.apps, 0) < 2_000, `${unnamed.length} counties without a Census name hold too many applications`);
const named = counties.filter((x) => x.name).sort((x, y) => x.f.localeCompare(y.f));
const ranked = named.filter((x) => x.a.apps >= MIN_RANK).sort((x, y) => y.per1000 - x.per1000);
const lookupable = named.filter((x) => x.a.apps >= MIN_LOOKUP);
const TOP_CTY = 10;
const topCounties = ranked.slice(0, TOP_CTY);
const lowCounties = ranked.slice(-5).reverse();

// ---- assertions: every claim the prose makes about size, rank or shape ----------------------------
must(AM.collShare > 0.12 && AM.collShare < 0.15, `all-applications collateral share moved (${pct(AM.collShare)})`);
must(CM.collShare > 0.095 && CM.collShare < 0.12, `"about 1 in 10" no longer fits the typical-buyer collateral share (${pct(CM.collShare)})`);
must([1, 3, 5].every((i) => C.r[i] > C.r[4]), 'collateral is no longer behind debt-to-income, credit history and cash for the typical buyer');
must(C.r[1] > C.r[3], 'debt-to-income is no longer the most-cited reason');
must(C.collFirst / C.coll > 0.85, `collateral listed first in ${pct(C.collFirst / C.coll)} of its denials`);
const [a20, a2039, a4059, a60] = ageSite;
must(a20.per1000 < a2039.per1000 && a2039.per1000 < a4059.per1000 && a60.per1000 > a2039.per1000, 'housing-age gradient is no longer rising');
const AGE_RATIO = a4059.per1000 / a20.per1000;
must(AGE_RATIO > 1.8 && AGE_RATIO < 2.3, `"about twice" no longer fits 40-59 vs under-20 (${AGE_RATIO.toFixed(2)})`);
const denRange = Math.max(...ageSite.map((x) => x.denialRate)) - Math.min(...ageSite.map((x) => x.denialRate));
must(denRange < 0.01, `overall denial rates by housing age now differ by ${pct(denRange)}`);
for (const [nm, list] of [['Conventional', ageConv], ['FHA', ageFha]] as const) must(list[2].per1000 > 1.5 * list[0].per1000, `${nm}: older-tract gradient no longer holds`);
must(ageNA.apps < siteTotal.apps * 0.01, 'too many site-built applications have no tract housing age');
must(MM.denialRate > 0.5, `manufactured denial rate is ${pct(MM.denialRate)}, prose says more than half`);
must(MANU_ALL.r[3] === Math.max(...MANU_ALL.r) && MANU_ALL.r[3] / reasoned(MANU_ALL) > 0.5, '"mostly for credit history" no longer holds for manufactured-home denials');
const mFha = manuLoan[1], mVa = manuLoan[2], mConv = manuLoan[0], sFha = siteLoan[1], sVa = siteLoan[2];
must(mFha.collShare > 0.3 && mVa.collShare > 0.3, `manufactured FHA/VA collateral share moved (${pct(mFha.collShare)}, ${pct(mVa.collShare)})`);
must(mFha.per1000 > 2.5 * sFha.per1000 && mVa.per1000 > 2.5 * sVa.per1000, 'manufactured FHA/VA per-1,000 no longer far above site-built');
must(mConv.collShare < 0.05, 'manufactured conventional collateral share moved');
must(INV.per1000 > 2 * CM.per1000 && SECOND.per1000 > 2 * CM.per1000 && TWO4.per1000 > 2 * CM.per1000, 'second home / investment / 2-4 unit no longer more than twice the typical rate');
must(topCounties[0].f === '36061', `top county is ${topCounties[0].name}`);
must(['36061', '12086', '36081', '12011', '36047'].every((f) => topCounties.slice(0, 5).some((x) => x.f === f)), 'the top five counties changed');
must(topCounties[0].per1000 > 5 * CM.per1000, 'Manhattan is no longer more than five times the national rate');
must(states.length >= 51, `only ${states.length} states`);
const ST = (s: string) => states.find((x) => x.s === s)!;
const states51 = statesShown.filter((x) => !['PR', 'GU', 'VI'].includes(x.s));
const topState = states51[0], lowState = states51.at(-1)!;
must(statesShown[0].s === 'PR' && ST('PR').per1000 > 2 * topState.per1000, 'Puerto Rico no longer stands apart');
must(states51.length === 51, `${states51.length} states + DC in the table`);

// ---- CSVs -----------------------------------------------------------------------------------------
const cell = (s: string | number) => { const t = String(s ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const aggCols = ['applications', 'denied', 'denied_with_reasons', 'collateral_denials', 'collateral_first_reason', 'denial_rate', 'collateral_share_of_denials_with_reasons', 'collateral_denials_per_1000_applications',
  'dti_mentions', 'employment_mentions', 'credit_history_mentions', 'cash_mentions', 'unverifiable_mentions', 'incomplete_mentions', 'mortgage_insurance_mentions', 'other_mentions'];
const aggVals = (a: Agg) => { const m = mx(a); return [a.apps, a.denied, reasoned(a), a.coll, a.collFirst, m.denialRate.toFixed(4), reasoned(a) ? m.collShare.toFixed(4) : '', m.per1000.toFixed(2), a.r[1], a.r[2], a.r[3], a.r[5], a.r[6], a.r[7], a.r[8], a.r[9]]; };
const countyCsv = [['county_fips', 'county', ...aggCols].join(','), ...named.map((x) => [x.f, cell(x.name), ...aggVals(x.a)].join(','))].join('\n') + '\n';
const stateCsv = [['state', 'state_name', ...aggCols].join(','), ...[...states].sort((x, y) => x.s.localeCompare(y.s)).map((x) => [x.s, cell(x.name), ...aggVals(x.a)].join(','))].join('\n') + '\n';

// ---- page pieces ----------------------------------------------------------------------------------
const bar = (v: number, max: number) => `<td class="bar"><span style="width:${Math.max(1, Math.round((v / max) * 100))}%"></span></td>`;
const reasonMax = reasonShare(C, 1);
const reasonRows = REASONS.map(([i, l]) => `      <tr${i === 4 ? ' class="hl"' : ''}><td>${esc(l)}</td><td class="n">${num(C.r[i])}</td><td class="n"><b>${pct(reasonShare(C, i))}</b></td>${bar(reasonShare(C, i), reasonMax)}</tr>`).join('\n');
const ageRows = ageSite.map((x, i) => `      <tr><td>${AGE_LABEL[x.g]}</td><td class="n">${num(x.a.apps)}</td><td class="n">${pct(x.denialRate)}</td><td class="n">${pct(x.collShare)}</td><td class="n"><b>${per(x.per1000)}</b></td><td class="n">${per(ageConv[i].per1000)}</td><td class="n">${per(ageFha[i].per1000)}</td></tr>`).join('\n');
const homeRows = Object.keys(LT).map((t, i) => `      <tr><td>${LT[t]}</td><td class="n">${num(siteLoan[i].a.apps)}</td><td class="n">${pct(siteLoan[i].collShare)}</td><td class="n">${per(siteLoan[i].per1000)}</td><td class="n">${num(manuLoan[i].a.apps)}</td><td class="n">${pct(manuLoan[i].denialRate, 0)}</td><td class="n">${pct(manuLoan[i].collShare)}</td><td class="n"><b>${per(manuLoan[i].per1000)}</b></td></tr>`).join('\n');
const purposeRows = purposes.map((x) => `      <tr><td>${x.label}</td><td class="n">${num(x.a.apps)}</td><td class="n">${pct(x.denialRate)}</td><td class="n">${pct(x.collShare)}</td><td class="n"><b>${per(x.per1000)}</b></td></tr>`).join('\n');
const stMax = statesShown[0].per1000;
const stateRows = statesShown.map((x) => `      <tr><td>${esc(x.name)}</td><td class="n">${num(x.a.apps)}</td><td class="n">${pct(x.denialRate)}</td><td class="n">${pct(x.collShare)}</td><td class="n"><b>${per(x.per1000)}</b></td>${bar(x.per1000, stMax)}</tr>`).join('\n');
const ctyRow = (x: typeof ranked[number]) => `      <tr><td>${esc(x.name)}</td><td class="n">${num(x.a.apps)}</td><td class="n">${pct(x.denialRate)}</td><td class="n">${pct(x.collShare)}</td><td class="n"><b>${per(x.per1000)}</b></td></tr>`;
const countyRows = topCounties.map(ctyRow).join('\n');
const lowRows = lowCounties.map(ctyRow).join('\n');
const shortName = (n: string) => n.replace(/ County(?= \(|,)/, '').replace(/,.*$/, '');

// Lookup: every named county with at least MIN_LOOKUP applications from the typical buyer.
// [name, applications, denied, denied with reasons, collateral denials]
const lookupCounties = lookupable.slice().sort((x, y) => { const sx = x.name.split(', ').at(-1)!, sy = y.name.split(', ').at(-1)!; return sx.localeCompare(sy) || x.name.localeCompare(y.name); })
  .map((x) => [x.name, x.a.apps, x.a.denied, reasoned(x.a), x.a.coll]);
const NAT = { apps: C.apps, per1000: +CM.per1000.toFixed(1), share: +(CM.collShare * 100).toFixed(1), denial: +(CM.denialRate * 100).toFixed(1) };

const LOOKUP_CSS = `
  .lookup{border:1px solid #ded9cf;background:#fbfaf7;padding:1.1rem 1.2rem;margin:0 0 2.2rem}
  .lk-eyebrow{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#6f5a3a;margin:0 0 .7rem}
  .lookup select{width:100%;font:400 15px/1.4 ui-sans-serif,system-ui,sans-serif;padding:.55rem .6rem;border:1px solid #c9c1b3;background:#fff;color:#1a1a1a;border-radius:2px}
  .lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7rem,1fr));gap:1px;background:#ded9cf;border:1px solid #ded9cf;margin:.9rem 0 0}
  .lk-cell{background:#fbfaf7;padding:.65rem .7rem}
  .lk-cell b{display:block;font:700 1.3rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .lk-cell span{display:block;font:400 11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin-top:.25rem}
  .lk-msg{font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.8rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;

const LOOKUP_MARKUP = `<div class="lookup">
    <p class="lk-eyebrow">Look up any of the ${num(lookupable.length)} counties with ${num(MIN_LOOKUP)}+ home-purchase applications in ${YEAR}</p>
    <label for="mdcpick" style="position:absolute;left:-9999px">Choose a county</label>
    <select id="mdcpick"><option value="">Choose a county&hellip;</option></select>
    <div id="mdcout" aria-live="polite"></div>
    <p class="lk-caveat">${YEAR} HMDA home-purchase applications that reached a decision (approved or denied), first-lien
    loans on single-unit homes the buyer would live in, from the FFIEC HMDA data, pulled ${FETCHED}. &ldquo;Collateral&rdquo; is
    the lender&rsquo;s reported reason; the data doesn&rsquo;t say whether it was the appraised value, the condition or
    the type of property. Figures describe applications in the county, not any one house.</p>
  </div>`;

const LOOKUP_URL = `/research/data/${LOOKUP_FILE}`;
const DATA_SCRIPT = `<script type="application/json" id="mdc-data">${JSON.stringify({ src: LOOKUP_URL, nat: NAT })}</script>`;
const JS_SCRIPT = `<script>
(function(){
  var s=document.getElementById('mdcpick'),o=document.getElementById('mdcout'),d=[];
  var cfg=JSON.parse(document.getElementById('mdc-data').textContent),N=cfg.nat;
  s.disabled=true;
  fetch(cfg.src).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){
    d=j.c; s.disabled=false;
    d.forEach(function(c,i){var e=document.createElement('option');e.value=i;e.textContent=c[0];s.appendChild(e);});
  }).catch(function(){o.innerHTML='<p class="lk-msg">The county list did not load. The same figures are in the county CSV below.</p>';});
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  function fmt(n){return Math.round(n).toLocaleString('en-US');}
  s.addEventListener('change',function(){
    var c=d[s.value]; if(!c){o.innerHTML='';return;}
    var p=c[4]/c[1]*1000, sh=c[3]?c[4]/c[3]*100:0;
    o.innerHTML='<div class="lk-grid">'
      +cell(fmt(c[1]),'applications decided')
      +cell((c[2]/c[1]*100).toFixed(1)+'%','denied (US: '+N.denial+'%)')
      +cell(fmt(c[4]),'denials citing collateral')
      +cell(p.toFixed(1),'per 1,000 applications (US: '+N.per1000+')')
      +'</div>'
      +'<p class="lk-msg">'+(c[3]?'Collateral was a reason in '+sh.toFixed(1)+'% of denials that gave reasons, against '+N.share+'% nationally.':'No denials here gave a reason.')
      +(c[1]<1000?' With fewer than 1,000 applications, a handful of denials moves these rates a lot.':'')+'</p>';
  });
})();
</script>`;

const KEY_FINDINGS = keyFindingsBlock([
  `Of ${num(ALL.apps)} home-purchase mortgage applications that lenders approved or denied in ${YEAR}, ${num(ALL.denied)} were denied, and ${num(ALL.coll)} of those denials named the collateral, the property itself, as a reason (HMDA ${YEAR}).`,
  `For a first-lien loan on a single-unit home the buyer would live in, collateral was a reason in ${pct(CM.collShare)} of denials that gave reasons, or ${per(CM.per1000)} per 1,000 applications decided.`,
  `For site-built homes in census tracts where the median home was 40 to 59 years old, collateral denials ran at ${per(a4059.per1000)} per 1,000 applications, against ${per(a20.per1000)} in tracts where it was under 20 years, while overall denial rates were within ${Math.ceil(denRange * 100)} percentage point of each other.`,
  `For manufactured homes, collateral was a reason in ${pct(mFha.collShare)} of FHA denials and ${pct(mVa.collShare)} of VA denials that gave reasons, against ${pct(mConv.collShare)} for conventional loans.`,
  `Among counties with at least ${num(MIN_RANK)} applications from buyers who would live in the home, ${esc(topCounties[0].name)} had the highest rate of collateral denials, ${per(topCounties[0].per1000)} per 1,000 applications.`,
], `Source: FFIEC Home Mortgage Disclosure Act (HMDA) data, ${YEAR} nationwide loan/application records, home purchase, action taken originated, approved but not accepted or denied; pulled ${FETCHED}. Analysis by Before Regret.`);

// ---- questions this data answers ----------------------------------------------------------------
const FAQ: Array<{ q: string; a: string }> = [
  { q: 'What does it mean when a mortgage is denied for collateral?',
    a: `It means the lender reported the property itself as a reason it would not make the loan. Lenders report it under HMDA as denial reason "Collateral", and Regulation B's sample notice words it "Value or type of collateral not sufficient". The data does not say which: a low appraisal, the condition of the house, or a type of property the loan program will not accept.` },
  { q: 'How often are mortgages denied because of the appraisal or the property?',
    a: `In ${YEAR}, ${num(ALL.coll)} of ${num(ALL.denied)} denied home-purchase applications named collateral as a reason. For a first-lien loan on a single-unit home the buyer would live in, it was a reason in ${pct(CM.collShare)} of denials that gave reasons, or ${per(CM.per1000)} per 1,000 applications decided. Debt-to-income ratio and credit history were cited far more often.` },
  { q: 'Are mortgages on older homes denied more often because of the house?',
    a: `In ${YEAR} HMDA data, yes by neighbourhood: for site-built homes, collateral denials ran at ${per(a4059.per1000)} per 1,000 applications in census tracts where the median home was 40 to 59 years old, against ${per(a20.per1000)} where it was under 20. The overall denial rate barely changed. HMDA records the tract's median housing age, not the age of the house being bought.` },
  { q: 'Can I get a copy of the appraisal if my mortgage is denied?',
    a: `Yes. Regulation B (12 CFR 1002.14) requires a lender to give you a copy of every appraisal and written valuation developed for a first-lien loan on a home, promptly after it is completed or three business days before closing, whichever is earlier, even if the loan does not close. If credit is denied, Regulation B (12 CFR 1002.9) also requires a notice within 30 days, and the statement of reasons must be specific.` },
  { q: 'Where can I download mortgage denial data by county?',
    a: `This study publishes two CSV files under a CC BY 4.0 licence: every county and every state, with ${YEAR} home-purchase applications, denials and the count of denials citing each reason, for first-lien loans on single-unit homes the buyer would live in. The underlying data is the public FFIEC HMDA data browser, which needs no key.` },
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
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem;font-variant-numeric:tabular-nums}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1b1a18;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right}
  tr.hl td{background:#f3f0e9}
  td.bar{width:22%;padding-right:0}
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
  <p class="kicker">National analysis &middot; ${YEAR} HMDA &middot; ${num(ALL.apps)} applications &middot; ${num(named.length)} counties</p>
  <h1>${STUDY_NAME}</h1>
  <p class="standfirst">Most mortgage denials are about the buyer: debt, credit, cash. Some are about the house. Lenders
  must report why they turn down a home loan, and in ${YEAR} they named the property itself, the collateral, in
  ${num(ALL.coll)} denials of home-purchase applications. We counted them by loan type, home type, neighbourhood
  housing age, state and county.</p>

  <div class="figs">
    <div class="fig"><b>${num(ALL.coll)}</b><span>denials in ${YEAR} naming the collateral</span></div>
    <div class="fig"><b>${pct(CM.collShare)}</b><span>of denials with reasons, typical buyer</span></div>
    <div class="fig"><b>${per(CM.per1000)}</b><span>collateral denials per 1,000 applications</span></div>
    <div class="fig"><b>${AGE_RATIO.toFixed(1)}&times;</b><span>the rate in tracts of 40&ndash;59-year-old homes vs under 20</span></div>
  </div>

  ${KEY_FINDINGS}

  ${LOOKUP_MARKUP}

  <div class="cta">
    <h2>Check the house before the lender does</h2>
    <p>An appraisal or a lender&rsquo;s property review comes late, after the offer and the deposit. The questions that
    lead to a collateral problem, such as the condition of the roof and systems, unpermitted work, or a home type the
    loan program has rules about, can be asked before you commit.</p>
    <p>For one address, a free Before Regret report lists what to check, ask and verify for that area before you buy.
    No sign-up required.</p>
    <p><a class="btn" href="/">Get the free report</a></p>
  </div>

  <h2>What &ldquo;collateral&rdquo; means on a denial</h2>
  <h3>The lender&rsquo;s reason, not the full story.</h3>

  <p>Lenders covered by the Home Mortgage Disclosure Act report every home-loan application they receive. Regulation C,
  12 CFR 1003.4(a)(16), requires them to report, for a denied application, &ldquo;the principal reason or reasons the
  financial institution denied the application&rdquo;, up to four. The FFIEC&rsquo;s field definitions give nine codes,
  and code 4 is simply &ldquo;Collateral&rdquo;.</p>

  <p>Collateral on a home loan is the home. Regulation B&rsquo;s sample adverse-action notice words the same reason
  &ldquo;Value or type of collateral not sufficient&rdquo;. A denial coded this way can follow an appraisal below the
  price, a house in a condition the loan program won&rsquo;t accept, or a type of property the lender won&rsquo;t lend
  on. HMDA doesn&rsquo;t say which, so neither does this page.</p>

  <h2>How often the house is the reason</h2>
  <h3>About 1 in 10 denials for a typical buyer.</h3>

  <p>For the typical buyer, a first-lien loan on a single-unit home they would live in, lenders decided
  ${num(C.apps)} home-purchase applications in ${YEAR} and denied ${num(C.denied)}, ${pct(CM.denialRate)}. Collateral was a
  reason in ${num(C.coll)} of those denials: ${pct(CM.collShare)} of the ones that gave reasons, or ${per(CM.per1000)} for every
  1,000 applications decided. In ${pct(C.collFirst / C.coll, 0)} of them, the lender listed collateral as the first reason.</p>

  <p>The buyer&rsquo;s own finances come up far more. Debt-to-income ratio was a reason in ${pct(reasonShare(C, 1))} of
  denials and credit history in ${pct(reasonShare(C, 3))}. A lender can give more than one reason, so the shares add to
  more than 100%.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Denial reason</th><th class="n">Denials citing it</th><th class="n">Share of denials</th><th class="bar"></th></tr></thead>
      <tbody>
${reasonRows}
      </tbody>
    </table>
  </div>
  <p class="cap">First-lien home-purchase applications for single-unit homes the buyer would live in, denied in ${YEAR}.
  Share of the ${num(reasoned(C))} denials that gave reasons; ${num(C.exempt)} denials came from lenders exempt from reporting
  reasons. Reason names as in the FFIEC HMDA field definitions.</p>

  <h2>Older neighbourhoods</h2>
  <h3>Twice the rate where the typical home is 40 to 59 years old.</h3>

  <p>HMDA attaches census data to every application, including the median age of the homes in its census tract. For
  site-built homes in ${YEAR}, collateral denials ran at ${per(a4059.per1000)} per 1,000 applications in tracts where the median
  home was 40 to 59 years old and ${per(a60.per1000)} where it was 60 or more, against ${per(a20.per1000)} in tracts where it
  was under 20.</p>

  <p>The overall denial rate hardly moved across those tracts, staying between ${pct(Math.min(...ageSite.map((x) => x.denialRate)))}
  and ${pct(Math.max(...ageSite.map((x) => x.denialRate)))}. What changed was the reason: in older neighbourhoods more of the
  denials were about the property. The same pattern holds for conventional and FHA loans taken separately. The tract
  median is a neighbourhood figure; a new house can sit in an old tract.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Tract median home age</th><th class="n">Applications</th><th class="n">Denied</th><th class="n">Collateral share of denials</th><th class="n">Per 1,000, all loans</th><th class="n">Conventional</th><th class="n">FHA</th></tr></thead>
      <tbody>
${ageRows}
      </tbody>
    </table>
  </div>
  <p class="cap">First-lien home-purchase applications for site-built, single-unit homes the buyer would live in, ${YEAR}, by
  HMDA&rsquo;s tract median age of housing units. &ldquo;Per 1,000&rdquo; is denials citing collateral per 1,000 applications
  decided.</p>

  <h2>Manufactured homes</h2>
  <h3>For FHA and VA, the house is often the problem.</h3>

  <p>Manufactured homes are a different market. Lenders denied ${pct(MM.denialRate)} of ${num(MANU_ALL.apps)} manufactured-home
  purchase applications from buyers who would live in them, mostly for credit history. Collateral rarely
  comes up on conventional manufactured-home loans: ${pct(mConv.collShare)} of denials. On government-backed ones it&rsquo;s
  far more common. Collateral was a reason in ${pct(mFha.collShare)} of FHA denials and ${pct(mVa.collShare)} of VA denials for
  manufactured homes, or ${per(mFha.per1000)} and ${per(mVa.per1000)} per 1,000 applications, against ${per(sFha.per1000)} and
  ${per(sVa.per1000)} for site-built homes with the same loans.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Loan type</th><th class="n">Site-built apps</th><th class="n">Collateral share</th><th class="n">Per 1,000</th><th class="n">Manufactured apps</th><th class="n">Denied</th><th class="n">Collateral share</th><th class="n">Per 1,000</th></tr></thead>
      <tbody>
${homeRows}
      </tbody>
    </table>
  </div>
  <p class="cap">First-lien home-purchase applications for single-unit homes the buyer would live in, ${YEAR}. Collateral share
  is of denials that gave reasons. USDA manufactured-home figures rest on ${num(manuLoan[3].a.apps)} applications.</p>

  <h2>Second homes, rentals and multi-unit buildings</h2>
  <h3>More than twice the rate.</h3>

  <p>Collateral denials were more than twice as common for homes the buyer wouldn&rsquo;t live in, and for small
  multi-unit buildings. For a single-unit investment property, ${per(INV.per1000)} applications in 1,000 were denied with
  collateral as a reason, and collateral was named in ${pct(INV.collShare)} of denials that gave reasons. For a 2-to-4-unit
  building the buyer would live in, it was ${per(TWO4.per1000)} per 1,000.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Home and use</th><th class="n">Applications</th><th class="n">Denied</th><th class="n">Collateral share</th><th class="n">Per 1,000</th></tr></thead>
      <tbody>
${purposeRows}
      </tbody>
    </table>
  </div>
  <p class="cap">First-lien home-purchase applications, ${YEAR}, all loan types and home types. Collateral share is of denials
  that gave reasons.</p>

  <h2>By state</h2>
  <h3>Puerto Rico stands apart; ${esc(topState.name)} leads the states.</h3>

  <p>Puerto Rico had the highest rate of collateral denials for the typical buyer, ${per(ST('PR').per1000)} per 1,000 applications,
  and collateral was a reason in ${pct(ST('PR').collShare)} of its denials that gave reasons. Among the 50 states and
  Washington, D.C., the rate ranged from ${per(topState.per1000)} in ${esc(topState.name)} to ${per(lowState.per1000)} in ${esc(lowState.name)}. New York&rsquo;s was ${per(ST('NY').per1000)},
  Florida&rsquo;s ${per(ST('FL').per1000)}, California&rsquo;s ${per(ST('CA').per1000)} and Texas&rsquo;s ${per(ST('TX').per1000)}.</p>

  <div class="scroll tall">
    <table>
      <thead><tr><th>State</th><th class="n">Applications</th><th class="n">Denied</th><th class="n">Collateral share</th><th class="n">Per 1,000</th><th class="bar"></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>
  <p class="cap">First-lien home-purchase applications for single-unit homes the buyer would live in, ${YEAR}, in states and
  territories with at least ${num(MIN_STATE)}, ranked by collateral denials per 1,000 applications. All are in the state CSV.</p>

  <h2>By county</h2>
  <h3>Five big urban counties stand out.</h3>

  <p>Among the ${num(ranked.length)} counties with at least ${num(MIN_RANK)} applications from typical buyers, ${esc(topCounties[0].name)}
  had the highest rate of collateral denials, ${per(topCounties[0].per1000)} per 1,000 applications, and collateral was a
  reason in ${pct(topCounties[0].collShare)} of its denials that gave reasons. ${esc(shortName(topCounties[1].name))},
  ${esc(shortName(topCounties[2].name))}, ${esc(shortName(topCounties[3].name))} and ${esc(shortName(topCounties[4].name))} follow.
  HMDA has no field for whether a home is a condominium or a co-op, so the data can&rsquo;t say what these counties
  have in common.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Applications</th><th class="n">Denied</th><th class="n">Collateral share</th><th class="n">Per 1,000</th></tr></thead>
      <tbody>
${countyRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The ${TOP_CTY} highest of ${num(ranked.length)} counties with at least ${num(MIN_RANK)} first-lien home-purchase applications
  for single-unit homes the buyer would live in, ${YEAR}. The five lowest:</p>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Applications</th><th class="n">Denied</th><th class="n">Collateral share</th><th class="n">Per 1,000</th></tr></thead>
      <tbody>
${lowRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Every county is in the county CSV and in the lookup above.</p>

  <h2>What this means if you&rsquo;re buying</h2>
  <h3>Two rights to use if the house is the reason.</h3>

  <p>A collateral denial is uncommon for a typical buyer, but it comes late, after the appraisal or the lender&rsquo;s
  review of the property. Federal rules give you two things to work with.</p>
  <ul>
    <li><strong>A copy of the appraisal.</strong> Regulation B, 12 CFR 1002.14, requires the lender to give you a copy of
    every appraisal and written valuation developed for a first-lien loan on a home, promptly after it&rsquo;s done or
    three business days before closing, whichever is earlier. The rule attaches to the application, whether or not the
    loan closes.</li>
    <li><strong>The reason in writing.</strong> Regulation B, 12 CFR 1002.9, requires a notice within 30 days of a
    completed application being denied, and the statement of reasons &ldquo;must be specific and indicate the
    principal reason(s)&rdquo;. If the reason is the collateral, ask which part: the value, the condition, or the
    type of property.</li>
  </ul>
  <p>Before an offer, the pattern in this data points at a few questions worth asking about an older house, a
  manufactured home on an FHA or VA loan, or a two-to-four-unit building: what condition the main systems are in,
  whether past work had permits, and whether the loan program you plan to use has rules for this kind of property.
  Our study <a href="/research/oldest-housing/">Before 1940</a> shows where the oldest housing is, county by county.</p>

  <h2>Method</h2>
  <h3>How the figures were built.</h3>

  <p>The data is the FFIEC&rsquo;s ${YEAR} nationwide HMDA loan/application records, filtered in the HMDA data browser to
  home-purchase loans with action taken &ldquo;loan originated&rdquo;, &ldquo;application approved but not
  accepted&rdquo; or &ldquo;application denied&rdquo;. We streamed the full file on ${FETCHED} and counted it without
  keeping any rows: ${num(raw.rows)} records, matching the data browser&rsquo;s own count, with no malformed rows. Withdrawn
  and incomplete files are left out, so &ldquo;applications&rdquo; means applications a lender decided.</p>

  <p>A denial counts as citing collateral if collateral is any of its up-to-four reasons. Shares are of denials that
  gave reasons: lenders with a partial exemption may report reason code 1111, exempt, and those ${num(ALL.exempt)} denials are
  left out of the denominator. &ldquo;Typical buyer&rdquo; means a first-lien loan on a single-unit home the buyer would
  live in as a principal residence. Regulation C counts the dwelling units securing the loan, so a loan on one
  condominium or co-op unit is a single unit. County names come from the Census
  Bureau&rsquo;s 2023 county list.</p>

  <h2>Limitations</h2>
  <h3>What this does not show.</h3>

  <p><strong>Not every lender reports.</strong> Regulation C, 12 CFR 1003.2(g), covers lenders above size and volume
  thresholds, including a minimum of 25 closed-end mortgage loans in each of the two prior years, and a lender must have
  had an office in a metropolitan area. Small lenders and some rural ones aren&rsquo;t in the data.</p>

  <p><strong>Applications, not buyers or houses.</strong> A buyer turned down by one lender may apply to another, and
  each application counts. A denied application doesn&rsquo;t mean the house didn&rsquo;t sell.</p>

  <p><strong>The reason is the lender&rsquo;s.</strong> HMDA records what the lender reported, in its own categories. It
  doesn&rsquo;t record the appraised value, the condition of the house, or why the collateral fell short. Housing age is
  the tract median from census data, not the age of the house. ${num((naState?.apps ?? 0))} typical-buyer applications have no
  state recorded and ${num((naCounty?.apps ?? 0) + unnamed.reduce((s, x) => s + x.a.apps, 0))} have no county we could name; they are
  in the national figures only.</p>

  <h2>Questions this data answers</h2>
  <div class="faq">
${FAQ_HTML}
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;${STUDY_NAME}: home-purchase mortgages denied for collateral, ${YEAR} HMDA.&rdquo;
    ${PUBLISHED}. Analysis of the FFIEC ${YEAR} nationwide HMDA loan/application records, pulled ${FETCHED}, for
    ${num(ALL.apps)} decided home-purchase applications.<br>
    <a href="${STUDY_URL}">${STUDY_URL}</a><br>
    Data: <a href="https://www.beforeregret.com/research/data/${SLUG}-by-county.csv">every county (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/${SLUG}-by-state.csv">every state (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/${SLUG}-figures.json">figures (JSON)</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the county lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="420" style="border:1px solid #ded9cf"
        title="Mortgages denied for collateral by county"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code>.
  </div>

  <div class="cite">
    <b>For newsrooms, researchers and housing counsellors</b>
    Published under a Creative Commons Attribution 4.0 licence: republish the figures, redraw the tables, or run
    your own cut without asking, with credit to Before Regret and a link to this page. HMDA data is published by the
    FFIEC and the CFPB; this study is not endorsed by either. Happy to pull a specific county or check a figure before
    it prints &mdash; hello@beforeregret.com.
  </div>

  <footer class="spine">
    Sources: FFIEC HMDA data browser, ${YEAR} nationwide loan/application records, retrieved ${FETCHED}; FFIEC LAR data
    field definitions; 12 CFR 1003.2(g) and 1003.4(a)(16) (Regulation C); 12 CFR 1002.9, 1002.14 and Appendix C
    (Regulation B), read 2026-11-25; Census Bureau ACS 2023 county names.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/oldest-housing/">Before 1940</a> &#183;
    <a href="/research/built-to-code/">Built to Which Code?</a> &#183;
    <a href="/research/fema-aid-gap/">What FEMA Pays Homeowners</a>
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
<title>Mortgages denied for collateral by county &mdash; Before Regret</title>
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
<p class="embed-credit"><a href="${STUDY_URL}" target="_blank" rel="noopener">${STUDY_NAME}</a> &mdash; Before Regret</p>
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
  if (!doc.includes('mdc-data')) throw new Error(`ABORT: ${name} lost the lookup data`);
}
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
const visible = html.slice(0, html.indexOf('<script type="application/json"'));
for (const banned of [/most (?:insurers|carriers|lenders)/i, /\b(insurer|carrier)s? (?:will|won't|refuse|deny|drop)/i,
  /\b(unsafe|dangerous|death ?trap|deadly|devastat\w*|catastroph\w*|nightmare)\b/i, /this (?:house|home) (?:was|is|has)/i,
  /\b(race|racial|ethnicity|hispanic|black|white|asian)\b/i, /\bcondo(?:minium)?s? (?:are|were|cause|drive)/i, /because (?:of )?(?:the )?(?:co-?ops?|condo)/i]) {
  if (banned.test(visible.replace(/<style[\s\S]*?<\/style>/g, ' '))) throw new Error(`ABORT: unsupported or out-of-scope claim matched ${banned}`);
}
assertKeyFindingsNumbers(visible, 'build-mortgage-denied-collateral-study');

const figAgg = (a: Agg) => ({
  applications: a.apps, denied: a.denied, deniedWithReasons: reasoned(a), deniedReasonExempt: a.exempt, collateralDenials: a.coll, collateralFirstReason: a.collFirst,
  denialRate: +mx(a).denialRate.toFixed(4), collateralShareOfDeniedWithReasons: +mx(a).collShare.toFixed(4), collateralDenialsPer1000: +mx(a).per1000.toFixed(2),
  reasonMentions: Object.fromEntries(REASONS.map(([i, l]) => [l, a.r[i]])),
});
const figures = {
  title: `${STUDY_NAME}: home-purchase mortgages denied for collateral, ${YEAR} HMDA`,
  generated: new Date().toISOString().slice(0, 10),
  fetchedAt: raw.fetchedAt, year: YEAR, source: raw.source, query: raw.query, records: raw.rows,
  typicalBuyer: 'first lien, principal residence, single unit (total_units = 1)',
  national: figAgg(ALL),
  typicalBuyerNational: figAgg(C),
  byLoanTypeTypicalBuyer: loanCore.map((x) => ({ loanType: LT[x.t], ...figAgg(x.a) })),
  siteBuiltByTractMedianHousingAge: ageSite.map((x, i) => ({ tractMedianAge: AGE_LABEL[x.g], all: figAgg(x.a), conventional: figAgg(ageConv[i].a), fha: figAgg(ageFha[i].a) })),
  manufacturedByLoanType: manuLoan.map((x) => ({ loanType: LT[x.t], ...figAgg(x.a) })),
  siteBuiltByLoanType: siteLoan.map((x) => ({ loanType: LT[x.t], ...figAgg(x.a) })),
  byHomeAndUse: purposes.map((x) => ({ group: x.label, ...figAgg(x.a) })),
  states: states.map((x) => ({ state: x.name, abbr: x.s, ...figAgg(x.a) })),
  topCounties: topCounties.map((x) => ({ fips: x.f, county: x.name, ...figAgg(x.a) })),
  faq: FAQ,
};

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
fs.writeFileSync(OUT_CSV_COUNTY, countyCsv);
fs.writeFileSync(OUT_CSV_STATE, stateCsv);
fs.writeFileSync(OUT_FIG, JSON.stringify(figures, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'docs', 'data', LOOKUP_FILE), JSON.stringify({ c: lookupCounties }));
const kb = (f: string) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${(html.length / 1024).toFixed(1)} KB), embed (${(embed.length / 1024).toFixed(1)} KB), lookup ${kb(path.join('docs', 'data', LOOKUP_FILE))} KB (${lookupable.length} counties)`);
console.log(`county CSV ${named.length} (${kb(OUT_CSV_COUNTY)} KB), state CSV ${states.length}; unnamed counties ${unnamed.length} (${unnamed.reduce((s, x) => s + x.a.apps, 0)} apps)`);
console.log(`  all ${num(ALL.apps)} denied ${num(ALL.denied)} coll ${num(ALL.coll)} ${pct(AM.collShare)} ${per(AM.per1000)}/1000; typical ${pct(CM.collShare)} ${per(CM.per1000)}; age ${ageSite.map((x) => per(x.per1000)).join('/')}; manu FHA ${pct(mFha.collShare)} VA ${pct(mVa.collShare)}`);
console.log(`  states top ${statesShown.slice(0, 3).map((x) => `${x.s} ${per(x.per1000)}`).join(', ')} ... bottom ${statesShown.slice(-3).map((x) => `${x.s} ${per(x.per1000)}`).join(', ')}`);
console.log(`  counties top ${topCounties.slice(0, 5).map((x) => `${shortName(x.name)} ${per(x.per1000)}`).join('; ')}`);
