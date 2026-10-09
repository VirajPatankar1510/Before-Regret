// Generates the ninth study, /research/oldest-housing/ -- housing built before 1940, by county.
//
//   npx tsx scripts/fetch-oldest-housing-data.ts     # Census API -> docs/data/oldest-housing-raw.json
//   npx tsx scripts/build-oldest-housing-study.ts    # -> docs/oldest-housing.html (+ embed, CSV, figures)
//
// -------------------------------------------------------------------------------------------
// WHY THIS STUDY (owner-approved 2026-10-09, the backlink batch, item 4).
//
// The one link this site has earned came from a trade business citing a neutral source. A county
// number is the other thing people link to: a local reporter, an electrician's "older homes in our
// area" page, an insurance agent's blog. Census publishes year-built counts for every county, but as
// a table nobody reads; what is new here is the cut (where pre-1940 housing concentrates, and how
// unevenly) and the framing for someone deciding about one house.
//
// WHAT IT MUST NOT SAY. "Built before 1940" is not "has knob-and-tube wiring" or "has original
// pipes". The Census measures when a building was first constructed, not what is in it now, and a
// 1925 house may have been rewired twice. So the era section quotes the report engine's own era
// statements (read at build time from PRIORITY_RULES, never retyped) and frames them as reasons to
// ask, not findings about any house. The Census Bureau's own warning that year built is self-reported
// and error-prone is quoted on the page.
//
// PUERTO RICO is excluded from every ranking and from the CSV, and the page says so. The ACS file
// carries its 78 municipios as county equivalents; an earlier study on this site was broken by a
// Puerto Rico outlier (memory: beforeregret_insurance_risk_study), and the question here is about the
// housing stock of the states.
import fs from 'node:fs';
import path from 'node:path';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const RAW = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-raw.json');
const OUT = path.join(process.cwd(), 'docs', 'oldest-housing.html');
const OUT_EMBED = path.join(process.cwd(), 'docs', 'oldest-housing.embed.html');
const OUT_CSV = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-by-county.csv');
const OUT_FIG = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-figures.json');

const PUBLISHED = '9 October 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/oldest-housing/';
const TITLE_SHORT = 'Before 1940';
const MIN_UNITS = 10_000;        // share rankings only consider counties with at least this many housing units
const MIN_UNITS_LARGE = 200_000; // the "large counties" table
const MOE_FLAG = 0.5;            // pre-1940 margin of error above half the estimate is flagged

if (!fs.existsSync(RAW)) throw new Error('ABORT: run scripts/fetch-oldest-housing-data.ts first');
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => v.toLocaleString('en-US');

type County = {
  geoid: string; name: string; county: string; state: string;
  total: number; pre40: number; moe40: number; pre60: number; share40: number; share60: number; flag: boolean;
  bins: Record<string, number>;
  median: { year: number; moe: number; openBottom: boolean };
};
const all = raw.counties as Array<{ geoid: string; name: string; est: Record<string, number>; moe: Record<string, number>; median: { year: number; moe: number; openBottom: boolean } }>;
if (!raw.medianYearBuilt || all.some((c) => !c.median)) throw new Error('ABORT: median year built missing -- rerun scripts/fetch-oldest-housing-data.ts');
// Census prints a median in the open bottom bin as 1938 + annotation "1939-". Never show "1938".
const medLabel = (m: { year: number; openBottom: boolean }) => (m.openBottom ? '1939 or earlier' : String(m.year));
const pr = all.filter((c) => c.geoid.startsWith('72'));
const counties: County[] = all.filter((c) => !c.geoid.startsWith('72')).map((c) => {
  const [county, state] = c.name.split(', ');
  const e = c.est;
  const pre60 = e.built1939OrEarlier + e.built1940to1949 + e.built1950to1959;
  return {
    geoid: c.geoid, name: c.name, county, state,
    total: e.total, pre40: e.built1939OrEarlier, moe40: c.moe.built1939OrEarlier, pre60,
    share40: e.total ? e.built1939OrEarlier / e.total : 0,
    share60: e.total ? pre60 / e.total : 0,
    flag: e.built1939OrEarlier > 0 && c.moe.built1939OrEarlier > MOE_FLAG * e.built1939OrEarlier,
    bins: e,
    median: c.median,
  };
});

// ---- national -------------------------------------------------------------------------------
const US_TOTAL = counties.reduce((a, c) => a + c.total, 0);
const US_PRE40 = counties.reduce((a, c) => a + c.pre40, 0);
const US_PRE60 = counties.reduce((a, c) => a + c.pre60, 0);
const US_SHARE = US_PRE40 / US_TOTAL;
const byCount = [...counties].sort((a, b) => b.pre40 - a.pre40);
const heldBy = (n: number) => byCount.slice(0, n).reduce((a, c) => a + c.pre40, 0) / US_PRE40;
const TOP10 = heldBy(10), TOP50 = heldBy(50), TOP100 = heldBy(100);
// Smallest number of counties holding half of all pre-1940 housing.
let halfN = 0; { let acc = 0; for (const c of byCount) { acc += c.pre40; halfN++; if (acc >= US_PRE40 / 2) break; } }

const eligible = counties.filter((c) => c.total >= MIN_UNITS);
const byShare = [...eligible].sort((a, b) => b.share40 - a.share40);
const large = counties.filter((c) => c.total >= MIN_UNITS_LARGE).sort((a, b) => b.share40 - a.share40);
const over25 = counties.filter((c) => c.share40 >= 0.25).length;
const flagged = counties.filter((c) => c.flag);

const stateAgg = new Map<string, { total: number; pre40: number }>();
for (const c of counties) {
  const s = stateAgg.get(c.state) ?? { total: 0, pre40: 0 };
  s.total += c.total; s.pre40 += c.pre40; stateAgg.set(c.state, s);
}
const states = [...stateAgg.entries()].map(([state, s]) => ({ state, ...s, share: s.pre40 / s.total })).sort((a, b) => b.share - a.share);
const realStates = states.filter((s) => s.state !== 'District of Columbia');
const DC = states.find((s) => s.state === 'District of Columbia')!;

// ---- age: the median year built, and the share older than each threshold ---------------------
const US_MEDIAN = raw.medianYearBuilt.us as { median: number; moe: number };
const shareBefore = (keys: string[]) => counties.reduce((a, c) => a + keys.reduce((s, k) => s + c.bins[k], 0), 0) / US_TOTAL;
const PRE50 = shareBefore(['built1939OrEarlier', 'built1940to1949']);
const PRE60 = US_PRE60 / US_TOTAL;
const PRE80 = shareBefore(['built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969', 'built1970to1979']);
const stateMedian = new Map<string, { median: number; moe: number }>(
  (raw.medianYearBuilt.states as Array<{ name: string; geoid: string; median: number; moe: number }>)
    .filter((s) => s.geoid !== '72').map((s) => [s.name, s]));
const statesByMedian = [...stateMedian.entries()].filter(([n]) => n !== 'District of Columbia').sort((a, b) => a[1].median - b[1].median);
const OLDEST_MED = statesByMedian[0], NEWEST_MED = statesByMedian[statesByMedian.length - 1];
const DC_MED = stateMedian.get('District of Columbia')!;

const find = (geoid: string) => { const c = counties.find((x) => x.geoid === geoid); if (!c) throw new Error(`ABORT: ${geoid} missing`); return c; };
const STL = find('29510'), KINGS = find('36047'), COOK = find('17031'), SF = find('06075'), LA = find('06037');

// ---- assertions: every claim the prose makes about rank or size ---------------------------------
if (counties.length !== 3144) throw new Error(`ABORT: ${counties.length} counties, the page says 3,144`);
if (byShare[0].geoid !== STL.geoid) throw new Error('ABORT: St. Louis city is no longer the highest share');
if (byShare[1].geoid !== KINGS.geoid) throw new Error('ABORT: Kings County is no longer second');
if (byCount[0].geoid !== COOK.geoid) throw new Error('ABORT: Cook County is no longer first by count');
if (byCount[1].geoid !== LA.geoid) throw new Error('ABORT: Los Angeles County is no longer second by count');
if (realStates[0].state !== 'Massachusetts' || realStates[realStates.length - 1].state !== 'Nevada') throw new Error('ABORT: state extremes changed');
if (TOP100 < 0.5 || halfN > 100) throw new Error(`ABORT: the top 100 no longer hold half (${pct(TOP100)}, ${halfN} counties)`);
if (large[0].geoid !== KINGS.geoid) throw new Error('ABORT: Kings is no longer first among large counties');
if (!(SF.share40 > 0.4)) throw new Error('ABORT: San Francisco no longer above 40%');
// "the third-highest share among the large counties, behind only Kings County and Boston's Suffolk County"
if (large[1].geoid !== '25025' || large[2].geoid !== SF.geoid) throw new Error('ABORT: large-county order is no longer Kings, Suffolk, San Francisco');
// "Old cities ... St. Louis, Brooklyn, Boston's Suffolk County, Manhattan, Baltimore and Philadelphia" all in the top 20 by share
for (const g of ['25025', '36061', '24510', '42101']) if (!byShare.slice(0, 20).some((c) => c.geoid === g)) throw new Error(`ABORT: ${g} left the top 20 the prose names`);
// "a run of smaller counties across upstate New York and Pennsylvania"
if (byShare.slice(0, 20).filter((c) => c.total < 100_000 && (c.state === 'New York' || c.state === 'Pennsylvania')).length < 5) throw new Error('ABORT: the small NY/PA band is no longer in the top 20');
if (!(US_SHARE > 0.11 && US_SHARE < 0.13)) throw new Error('ABORT: national share drifted; reread the prose');
// The age section: "about half" of housing predates 1980, which is consistent with a 1980 median.
if (US_MEDIAN.median !== 1980 || Math.abs(PRE80 - 0.5) > 0.02) throw new Error(`ABORT: median ${US_MEDIAN.median} / pre-1980 ${pct(PRE80)} no longer match the "about half" wording`);
if (OLDEST_MED[0] !== 'New York' || NEWEST_MED[0] !== 'Nevada') throw new Error(`ABORT: state median extremes are now ${OLDEST_MED[0]} / ${NEWEST_MED[0]}`);
if (!STL_MEDIAN_CHECK()) throw new Error('ABORT: St. Louis median is no longer in the open 1939-or-earlier bracket');
function STL_MEDIAN_CHECK() { return counties.find((c) => c.geoid === '29510')!.median.openBottom; }

// ---- era statements, read from the report engine, never retyped -------------------------------
const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0];
const rule = (id: string) => { const r = PRIORITY_RULES.find((p) => p.id === id); if (!r) throw new Error(`ABORT: engine rule ${id} missing`); return r; };
const ERA_KT = firstSentence(rule('knob_and_tube').eraBasis);
const ERA_CI = firstSentence(rule('sewer_cast_iron').eraBasis);
const ERA_LEAD = firstSentence(rule('lead_paint_disclosure').eraBasis);
if (!/before roughly 1950/.test(ERA_KT) || !/early 1970s/.test(ERA_CI) || !/1978/.test(ERA_LEAD)) throw new Error('ABORT: an engine era statement changed; reread the era section');
// The carrier rule: never let an engine sentence about what insurers do into the study.
for (const s of [ERA_KT, ERA_CI, ERA_LEAD]) if (/carrier|insurer/i.test(s)) throw new Error(`ABORT: carrier claim in era sentence: ${s}`);

// ---- outputs: CSV and figures -----------------------------------------------------------------
const BIN_KEYS = ['built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969', 'built1970to1979',
  'built1980to1989', 'built1990to1999', 'built2000to2009', 'built2010to2019', 'built2020OrLater'];
const csvCell = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
const csv = [
  ['geoid', 'county', 'state', 'housing_units', 'built_1939_or_earlier', 'built_1939_or_earlier_moe', 'share_built_before_1940',
    'share_built_before_1960', 'moe_over_half_of_estimate', 'median_year_built', 'median_year_built_moe', 'median_in_1939_or_earlier_bracket', ...BIN_KEYS.slice(1).map((k) => k.replace(/([A-Z0-9]+)/g, '_$1').toLowerCase())].join(','),
  ...[...counties].sort((a, b) => a.geoid.localeCompare(b.geoid)).map((c) => [
    c.geoid, csvCell(c.county), csvCell(c.state), c.total, c.pre40, c.moe40, c.share40.toFixed(4), c.share60.toFixed(4),
    c.flag ? 'yes' : 'no', c.median.openBottom ? '' : c.median.year, c.median.openBottom ? '' : c.median.moe, c.median.openBottom ? 'yes' : 'no', ...BIN_KEYS.slice(1).map((k) => c.bins[k]),
  ].join(',')),
].join('\n') + '\n';

const figures = {
  title: 'Before 1940: housing built before 1940, by US county',
  source: raw.source, vintage: raw.vintage, api: raw.api, variables: raw.variables, fetchedAt: raw.fetchedAt,
  generated: new Date().toISOString().slice(0, 10),
  scope: { counties: counties.length, excludedPuertoRicoMunicipios: pr.length, minUnitsForShareRankings: MIN_UNITS },
  national: { housingUnits: US_TOTAL, builtBefore1940: US_PRE40, shareBefore1940: +US_SHARE.toFixed(4), shareBefore1960: +(US_PRE60 / US_TOTAL).toFixed(4) },
  concentration: { top10Share: +TOP10.toFixed(4), top50Share: +TOP50.toFixed(4), top100Share: +TOP100.toFixed(4), countiesHoldingHalf: halfN, countiesAtLeast25pct: over25 },
  topByShare: byShare.slice(0, 25).map((c) => ({ geoid: c.geoid, name: c.name, share: +c.share40.toFixed(4), builtBefore1940: c.pre40, moe: c.moe40, housingUnits: c.total })),
  topByCount: byCount.slice(0, 25).map((c) => ({ geoid: c.geoid, name: c.name, builtBefore1940: c.pre40, moe: c.moe40, share: +c.share40.toFixed(4) })),
  states: states.map((s) => ({ state: s.state, housingUnits: s.total, builtBefore1940: s.pre40, share: +s.share.toFixed(4) })),
  dataQuality: { countiesWithMoeOverHalf: flagged.length },
  age: { usMedianYearBuilt: US_MEDIAN.median, usMedianMoe: US_MEDIAN.moe, shareBefore1950: +PRE50.toFixed(4), shareBefore1960: +PRE60.toFixed(4), shareBefore1980: +PRE80.toFixed(4),
    stateMedians: [...stateMedian.entries()].map(([state, m]) => ({ state, medianYearBuilt: m.median, moe: m.moe })).sort((a, b) => a.medianYearBuilt - b.medianYearBuilt) },
  faq: [] as Array<{ q: string; a: string }>,
};

// ---- page pieces --------------------------------------------------------------------------------
const bar = (v: number, max: number) => `<td class="bar"><span style="width:${Math.max(1, Math.round((v / max) * 100))}%"></span></td>`;
const shareRows = (list: County[]) => list.map((c, i) => `      <tr><td class="n">${i + 1}</td><td>${esc(c.county)}, ${esc(c.state)}</td><td class="n"><b>${pct(c.share40)}</b></td><td class="n">${num(c.pre40)}</td><td class="n">${num(c.total)}</td>${bar(c.share40, list[0].share40)}</tr>`).join('\n');
const countRows = byCount.slice(0, 10).map((c, i) => `      <tr><td class="n">${i + 1}</td><td>${esc(c.county)}, ${esc(c.state)}</td><td class="n">${num(c.pre40)}</td><td class="n">&plusmn;${num(c.moe40)}</td><td class="n">${pct(c.share40)}</td></tr>`).join('\n');
const stateRows = states.map((s) => `      <tr${s.state === 'District of Columbia' ? ' class="dc"' : ''}><td>${esc(s.state)}</td><td class="n"><b>${pct(s.share)}</b></td><td class="n">${stateMedian.get(s.state)!.median}</td><td class="n">${num(s.pre40)}</td>${bar(s.share, states[0].share)}</tr>`).join('\n');

const lookupData = [...counties].sort((a, b) => a.state.localeCompare(b.state) || a.county.localeCompare(b.county))
  .map((c) => [c.name, c.total, c.pre40, c.moe40, medLabel(c.median), c.flag ? 1 : 0]);

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
    <p class="lk-eyebrow">Look up any of the ${num(counties.length)} counties</p>
    <label for="ohpick" style="position:absolute;left:-9999px">Choose a county</label>
    <select id="ohpick"><option value="">Choose a county&hellip;</option></select>
    <div id="ohout" aria-live="polite"></div>
    <p class="lk-caveat">Census Bureau estimates from the American Community Survey, ${esc(raw.vintage)}. They
    count housing units by the year the building was first built, as reported by residents, not what
    is inside it now. A county figure says nothing about any one house.</p>
  </div>`;

const DATA_SCRIPT = `<script type="application/json" id="oh-data">${JSON.stringify(lookupData).replace(/</g, '\\u003c')}</script>`;

const JS_SCRIPT = `<script>
(function(){
  var d=JSON.parse(document.getElementById('oh-data').textContent);
  var s=document.getElementById('ohpick'),o=document.getElementById('ohout');
  var US=${(US_SHARE * 100).toFixed(1)};
  d.forEach(function(c,i){var e=document.createElement('option');e.value=i;e.textContent=c[0];s.appendChild(e);});
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  function fmt(n){return n.toLocaleString('en-US');}
  s.addEventListener('change',function(){
    var c=d[s.value]; if(!c){o.innerHTML='';return;}
    var share=c[1]?Math.round(c[2]/c[1]*1000)/10:0;
    o.innerHTML='<div class="lk-grid">'
      +cell(fmt(c[2]),'housing units built before 1940 (&plusmn;'+fmt(c[3])+')')
      +cell(share.toFixed(1)+'%','of the county&rsquo;s '+fmt(c[1])+' units')
      +cell(c[4],'median year built')
      +cell((share/US).toFixed(1)+'&times;','the US share of '+US.toFixed(1)+'%')
      +'</div>'
      +(c[5]?'<p class="lk-msg">The margin of error here is more than half the estimate, so treat this county&rsquo;s figure as rough.</p>':'');
  });
})();
</script>`;

const KEY_FINDINGS = keyFindingsBlock([
  `Of ${num(US_TOTAL)} housing units in the 50 states and the District of Columbia, ${num(US_PRE40)} (${pct(US_SHARE)}) were built before 1940, according to the Census Bureau&rsquo;s American Community Survey, ${esc(raw.vintage)}.`,
  `That housing is concentrated: ${pct(TOP100)} of it is in just 100 of the ${num(counties.length)} counties, and the 10 counties with the most hold ${pct(TOP10)}.`,
  `Cook County, Illinois has more housing units built before 1940 than any other county: ${num(COOK.pre40)}, or ${pct(COOK.share40)} of its housing.`,
  `Among counties with at least ${num(MIN_UNITS)} housing units, St. Louis city, Missouri has the highest share built before 1940, at ${pct(STL.share40)}, followed by Kings County (Brooklyn), New York, at ${pct(KINGS.share40)}.`,
  `By state, the share ranges from ${pct(realStates[0].share)} in Massachusetts to ${pct(realStates[realStates.length - 1].share)} in Nevada; in the District of Columbia it is ${pct(DC.share)}.`,
], `Source: U.S. Census Bureau, American Community Survey 5-year estimates, ${esc(raw.vintage)}, table B25034; analysis by Before Regret. Puerto Rico is not included.`);

// ---- questions this data answers -------------------------------------------------------------
// Phrased the way people ask them. Demand evidence (Bing market sample, 2026-10-09, relative only):
// "when was my house built" 212 exact, "what year was my house built" 133, "when was my house built
// by address" 112, "how old is my house" 83 -- captures data/keywords/2026-10-09-demand-*. The
// county-level questions are what a writer asks; no volume is claimed for them. Plain text here:
// the same strings feed the visible list and the FAQPage markup, so the two cannot disagree.
const st = (n: string) => { const s = states.find((x) => x.state === n); if (!s) throw new Error(`ABORT: state ${n}`); return s; };
const [S1, S2, S3] = realStates;
const n0 = (v: number) => v.toLocaleString('en-US');
const p0 = (v: number) => `${(v * 100).toFixed(1)}%`;
const FAQ: Array<{ q: string; a: string }> = [
  { q: 'What percentage of US homes were built before 1940?',
    a: `${p0(US_SHARE)}. Of ${n0(US_TOTAL)} housing units in the 50 states and the District of Columbia, ${n0(US_PRE40)} were built in 1939 or earlier, according to the Census Bureau's American Community Survey 5-year estimates, ${raw.vintage}.` },
  { q: 'How old is the average house in the US?',
    a: `The median US housing unit was built in ${US_MEDIAN.median} (margin of error plus or minus ${US_MEDIAN.moe} year), according to the Census Bureau's American Community Survey, ${raw.vintage}. About half of all housing units, ${p0(PRE80)}, were built before 1980; ${p0(PRE60)} before 1960; and ${p0(PRE50)} before 1950.` },
  { q: 'Which state has the oldest housing?',
    a: `By share built before 1940, ${S1.state} (${p0(S1.share)}), then ${S2.state} (${p0(S2.share)}) and ${S3.state} (${p0(S3.share)}). By median year built, ${OLDEST_MED[0]} has the oldest housing of any state, ${OLDEST_MED[1].median}; the District of Columbia's median is ${DC_MED.median}. ${NEWEST_MED[0]} has the newest, ${NEWEST_MED[1].median}.` },
  { q: 'Which US county has the oldest housing?',
    a: `Among counties with at least ${n0(MIN_UNITS)} housing units, St. Louis city, Missouri: ${p0(STL.share40)} of its housing was built before 1940, and its median year built falls in the Census bracket of 1939 or earlier. Cook County, Illinois has the most pre-1940 housing units of any county, ${n0(COOK.pre40)}.` },
  { q: 'How can I find out what year my house was built?',
    a: `Look up the parcel on your county assessor's or property appraiser's website and find the year built field, then check the building permit history for the address. Counties define the field differently: Sarasota County, Florida's property appraiser defines Actual Year Built as the year an improvement is completed, while Gunnison County, Colorado's assessor records Original Year Built as the year the construction permit was initiated. An effective year built is not the construction year.` },
  { q: 'Where can I download housing age data by county?',
    a: `This study publishes a CSV for all ${n0(counties.length)} counties in the 50 states and DC, with housing units by decade built, the share built before 1940 and before 1960, the median year built and the Census margins of error, under a CC BY 4.0 licence. The source is Census table B25034 (Year Structure Built) and B25035 (Median Year Structure Built), ${raw.vintage}.` },
];
if (st('New York').share < 0) throw new Error('unreachable');
figures.faq = FAQ;
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
  td.bar{width:28%;padding-right:0}
  td.bar span{display:block;height:9px;background:#6f5a3a;min-width:2px}
  tr.dc td{color:#6a6a6a;font-style:italic}
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
  <p class="kicker">National analysis &middot; ${num(counties.length)} counties &middot; Census ACS ${esc(raw.vintage)}</p>
  <h1>Before 1940</h1>
  <p class="standfirst">${num(US_PRE40)} American homes still standing were built before 1940
  &mdash; ${pct(US_SHARE)} of the country&rsquo;s housing. They are not spread evenly. Half of them sit
  in ${halfN} of the ${num(counties.length)} counties, and in St. Louis the share reaches
  ${pct(STL.share40)}. Here is where they are, county by county.</p>

  <div class="figs">
    <div class="fig"><b>${num(US_PRE40)}</b><span>housing units built before 1940</span></div>
    <div class="fig"><b>${pct(US_SHARE)}</b><span>of all US housing</span></div>
    <div class="fig"><b>${halfN}</b><span>counties hold half of them</span></div>
    <div class="fig"><b>${pct(STL.share40)}</b><span>in St. Louis city, the highest share</span></div>
  </div>

  ${KEY_FINDINGS}

  ${LOOKUP_MARKUP}

  <div class="cta">
    <h2>A county is not a house</h2>
    <p>Everything here is a count of buildings by the decade they went up. It cannot tell you what
    is behind the walls of one house, or whether anything original is still in it.</p>
    <p>For one address, a free Before Regret report builds the inspection priorities and seller
    questions for a house of that decade and county, so you know what to ask about before you
    make an offer.</p>
    <p><a class="btn" href="/">Run a free property report</a></p>
  </div>

  <h2>Concentrated, not scattered</h2>
  <h3>Half of America&rsquo;s pre-1940 housing is in ${halfN} counties.</h3>

  <p>There are ${num(US_TOTAL)} housing units in the 50 states and the District of Columbia, and
  ${num(US_PRE40)} of them were built in 1939 or earlier. Sorted by how many each county holds, the
  first ten counties account for ${pct(TOP10)} of the total, the first fifty for ${pct(TOP50)}, and the
  first hundred for ${pct(TOP100)}. The other ${num(counties.length - 100)} counties share the rest.</p>

  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Built before 1940</th><th class="n">Margin</th><th class="n">Share</th></tr></thead>
      <tbody>
${countRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The ten counties with the most housing units built before 1940. Margin is the Census
  Bureau&rsquo;s 90% margin of error on the count.</p>

  <p>Cook County, Illinois leads with ${num(COOK.pre40)}. Los Angeles County is second by count,
  ${num(LA.pre40)}, even though only ${pct(LA.share40)} of its housing is that old: it is simply very
  large. The share and the count tell different stories, and a reader quoting either should say
  which one they mean.</p>

  <h2>Where the share is highest</h2>
  <h3>Old cities, and a band of small counties in New York and Pennsylvania.</h3>

  <p>Ranked by share, among the ${num(eligible.length)} counties with at least ${num(MIN_UNITS)}
  housing units, two kinds of place lead. One is the old cores of eastern and midwestern cities:
  St. Louis city, Missouri at ${pct(STL.share40)}, Kings County (Brooklyn) at ${pct(KINGS.share40)},
  Boston&rsquo;s Suffolk County, Manhattan, Baltimore and Philadelphia. The other is a run of smaller
  counties across upstate New York and Pennsylvania, where a large share of the housing predates 1940.</p>

  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Share</th><th class="n">Before 1940</th><th class="n">All units</th><th class="bar"></th></tr></thead>
      <tbody>
${shareRows(byShare.slice(0, 20))}
      </tbody>
    </table>
  </div>
  <p class="cap">Counties with at least ${num(MIN_UNITS)} housing units, by share built before 1940.
  St. Louis and Baltimore are independent cities that the Census counts as counties.</p>

  <div class="finding">
    <p>The one western county near the top is San Francisco, at ${pct(SF.share40)} &mdash; the
    third-highest share among the ${num(large.length)} counties with ${num(MIN_UNITS_LARGE)} or more
    housing units, behind only Kings County and Boston&rsquo;s Suffolk County.</p>
  </div>

  <div class="scroll">
    <table>
      <thead><tr><th class="n">#</th><th>County</th><th class="n">Share</th><th class="n">Before 1940</th><th class="n">All units</th><th class="bar"></th></tr></thead>
      <tbody>
${shareRows(large.slice(0, 12))}
      </tbody>
    </table>
  </div>
  <p class="cap">Counties with at least ${num(MIN_UNITS_LARGE)} housing units, by share built before 1940.</p>

  <p>Across all ${num(counties.length)} counties, ${num(over25)} have a quarter or more of their
  housing from before 1940.</p>

  <h2>By state</h2>
  <h3>From ${pct(realStates[0].share)} in Massachusetts to ${pct(realStates[realStates.length - 1].share)} in Nevada.</h3>

  <div class="scroll tall">
    <table>
      <thead><tr><th>State</th><th class="n">Share</th><th class="n">Median year built</th><th class="n">Built before 1940</th><th class="bar"></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>
  <p class="cap">All 50 states and the District of Columbia (in italics), by share of housing units
  built before 1940. Median year built is the Census Bureau&rsquo;s own estimate (table B25035).</p>

  <h2>How old is the average house in the US?</h2>
  <h3>The median American home was built in ${US_MEDIAN.median}.</h3>

  <p>The Census Bureau puts the median year built for all US housing units at ${US_MEDIAN.median}, with
  a margin of error of ${US_MEDIAN.moe} year. Half of the country&rsquo;s housing is older than that
  and half is newer. In the decade counts behind this study, ${pct(PRE80)} of housing units were
  built before 1980, ${pct(PRE60)} before 1960 and ${pct(PRE50)} before 1950.</p>

  <p>By state, the median runs from ${OLDEST_MED[1].median} in ${OLDEST_MED[0]}, the oldest of any
  state, to ${NEWEST_MED[1].median} in ${NEWEST_MED[0]}. The District of Columbia&rsquo;s median is
  ${DC_MED.median}. In St. Louis city the median falls in the Census&rsquo;s bottom bracket, 1939 or
  earlier: more than half its housing predates 1940.</p>

  <p>One date matters for buyers in particular. ${esc(ERA_LEAD)} The Census decade brackets end at
  1979, so the ${pct(PRE80)} figure for housing built before 1980 is the closest this data comes; it
  is not a count of homes built before 1978.</p>

  <h2>What the year tells a buyer, and what it doesn&rsquo;t</h2>
  <h3>A reason to ask, not an answer.</h3>

  <p>The age of a building is the first clue an inspector uses about what may be inside it. Three
  of the era checks in the Before Regret report engine reach back past 1940:</p>
  <ul>
    <li>${esc(ERA_KT)} (<a href="/guides/what-is-knob-and-tube-wiring/">what knob-and-tube wiring is</a>)</li>
    <li>${esc(ERA_CI)} (<a href="/guides/why-cast-iron-pipes-corrode/">why cast iron pipes corrode</a>)</li>
    <li>${esc(ERA_LEAD)}</li>
  </ul>
  <p>None of that is a finding about any particular house. The Census measures when a building was
  first constructed, not when it was rewired, re-plumbed or renovated, and many of these homes have
  been updated more than once. A pre-1940 house is a reason to ask the seller and the inspector
  specific questions, and to <a href="/guides/look-up-building-permits-by-address/">look up the
  permit history by address</a> to see what work was recorded.</p>

  <h2>When was my house built? How to find out by address</h2>
  <h3>Census data cannot tell you. Three records can.</h3>

  <p>Everything above describes counties. For one house, the year comes from local records:</p>
  <ul>
    <li><strong>The assessor or property appraiser&rsquo;s parcel record.</strong> Search the address
    on your county assessor&rsquo;s or property appraiser&rsquo;s website and find the year built
    field. Counties do not all define it the same way. Sarasota County, Florida&rsquo;s property
    appraiser defines Actual Year Built as &ldquo;the year an improvement is completed.&rdquo;
    Gunnison County, Colorado&rsquo;s assessor records Original Year Built as &ldquo;the year the
    construction permit was initiated.&rdquo;</li>
    <li><strong>Not the effective year built.</strong> Some records show a second date. Sarasota
    describes Effective Year Built as an appraisal judgment of a structure&rsquo;s condition and
    utility; in Gunnison it stays the same as the original year &ldquo;until there are significant
    updates or remodels that extend the life of the structure.&rdquo; Either way, it is not when the
    house was built.</li>
    <li><strong>The building permit history.</strong> The original construction permit, where one
    survives, dates the house, and later permits show what has been rewired, re-plumbed or added.
    Here is <a href="/guides/look-up-building-permits-by-address/">how to look up building permits
    by address</a> in any county.</li>
  </ul>
  <p>Once you have the year, a free Before Regret report uses it to list the checks that matter for
  a house of that era in that county.</p>

  <h2>Method</h2>
  <h3>What was counted.</h3>

  <p>Sources are tables B25034, Year Structure Built, and B25035, Median Year Structure Built, from
  the U.S. Census Bureau&rsquo;s American Community Survey 5-year estimates for ${esc(raw.vintage)}, retrieved from the Census API for every
  county. The variable labels were checked against the Census metadata for that release, and each
  county&rsquo;s decade counts were checked to sum to its total. Housing units include occupied and
  vacant units, and an apartment building counts once per unit, not once per building.</p>

  <p>The ${num(counties.length)} counties and county equivalents of the 50 states and the District
  of Columbia are included. Puerto Rico&rsquo;s ${pr.length} municipios are in the same Census table
  and are left out of every figure here, because the question is about the housing stock of the
  states. Share rankings consider only counties with at least ${num(MIN_UNITS)} housing units, so
  that a very small county with a large margin of error cannot top a list.</p>

  <h2>Limitations</h2>
  <h3>What this does not show.</h3>

  <p>The Census Bureau warns about this question in its own subject definitions:</p>
  <blockquote>Data on year structure built are more susceptible to errors of response and
  non-reporting than data for many other questions because respondents must rely on their memory or
  on estimates by people who have lived in the neighborhood a long time.</blockquote>
  <p>Year built refers to when the building was first constructed, not when it was remodeled, added
  to, or converted, and the counts are of buildings still standing when the survey was taken. Every
  figure is an estimate with a margin of error; ${num(flagged.length)} counties have a margin on
  the pre-1940 count larger than half the estimate itself, and the data file flags them.</p>

  <h2>Questions this data answers</h2>
  <div class="faq">
${FAQ_HTML}
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;Before 1940: where America&rsquo;s oldest housing is, by county.&rdquo;
    ${PUBLISHED}. Analysis of U.S. Census Bureau American Community Survey 5-year estimates,
    ${esc(raw.vintage)}, tables B25034 and B25035, for ${num(counties.length)} counties.<br>
    <a href="${STUDY_URL}">${STUDY_URL}</a><br>
    Data: <a href="https://www.beforeregret.com/research/data/oldest-housing-by-county.csv">every county (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/oldest-housing-figures.json">figures (JSON)</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the county lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="360" style="border:1px solid #ded9cf"
        title="Housing built before 1940, by county"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code>.
  </div>

  <div class="cite">
    <b>For newsrooms and local businesses</b>
    Published under a Creative Commons Attribution 4.0 licence: republish the figures, redraw the
    tables, or run your own cut without asking, with credit to Before Regret and a link to this page.
    The underlying Census data is a US Government work. Happy to pull a specific county or check a
    figure before it prints &mdash; hello@beforeregret.com.
  </div>

  <footer class="spine">
    Source: U.S. Census Bureau, American Community Survey 5-year estimates, ${esc(raw.vintage)},
    tables B25034 and B25035, retrieved ${raw.fetchedAt.slice(0, 10)}. A US Government work.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/north-texas-roof-age/">Built Together, Due Together</a> &#183;
    <a href="/research/permit-pulse/">Permit Pulse</a> &#183;
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
<title>Housing built before 1940, by county &mdash; Before Regret</title>
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
<p class="embed-credit"><a href="${STUDY_URL}" target="_blank" rel="noopener">${TITLE_SHORT}: housing by county</a> &mdash; Before Regret</p>
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
for (const [name, doc] of [['study', html], ['embed', embed]] as Array<[string, string]>) {
  if (!doc.includes('lk-caveat')) throw new Error(`ABORT: ${name} lost the lookup caveat`);
  if (!doc.includes('oh-data')) throw new Error(`ABORT: ${name} lost the lookup data`);
}
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
// Claims the page must never make: era is not presence.
for (const banned of [/homes? (?:have|has|contain) knob/i, /likely (?:has|have) (?:knob|cast iron|lead)/i, /most (?:insurers|carriers)/i]) {
  if (banned.test(html)) throw new Error(`ABORT: unsupported claim matched ${banned}`);
}
assertKeyFindingsNumbers(html.slice(0, html.indexOf('<script type="application/json"')), 'build-oldest-housing-study');

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
fs.writeFileSync(OUT_CSV, csv);
fs.writeFileSync(OUT_FIG, JSON.stringify(figures, null, 2));
console.log(`wrote ${path.relative(process.cwd(), OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`wrote ${path.relative(process.cwd(), OUT_EMBED)}  (${(embed.length / 1024).toFixed(1)} KB)`);
console.log(`wrote ${path.relative(process.cwd(), OUT_CSV)}  (${counties.length} counties)`);
console.log(`  US ${num(US_PRE40)} of ${num(US_TOTAL)} = ${pct(US_SHARE)}; half in ${halfN} counties; top100 ${pct(TOP100)}; flagged ${flagged.length}`);
