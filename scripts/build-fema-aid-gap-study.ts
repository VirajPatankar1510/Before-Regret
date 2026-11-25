// Generates the eleventh study, /research/fema-aid-gap/ -- what FEMA's Individuals and Households
// Program (IHP) actually approved for homeowners, disaster by disaster and county by county, against
// the damage FEMA's own inspectors recorded.
//
//   npx tsx scripts/fetch-fema-aid-gap-data.ts     # OpenFEMA -> docs/data/fema-aid-gap-raw.json (gitignored)
//   npx tsx scripts/build-fema-aid-gap-study.ts    # -> docs/fema-aid-gap.html (+ embed, two CSVs, figures, lookup)
//
// -------------------------------------------------------------------------------------------
// WHY THIS STUDY (second pick from the Gemini topic list, memory beforeregret_gemini_research_topics).
// FEMA publishes the per-disaster dataset; nobody has added it up across every disaster since 2002 by
// county with the plain buyer question attached: if a disaster hits the house, how much does FEMA
// actually pay an owner? The answer (a few thousand dollars on average, the cap for about 1 in 100)
// is the reason to plan insurance before closing.
//
// WHAT IT MUST NOT SAY.
//  - Nothing about whether any applicant was insured. The dataset has no insurance field. The page
//    quotes 44 CFR 206.113(a)(2)-(5) for the rule (insurance first) and stops there.
//  - FEMA-recorded damage is FEMA Verified Loss under FEMA's guidelines, real AND personal property,
//    and repair aid is limited by 44 CFR 206.117(b)(2)(iii) to "a safe and sanitary living or
//    functioning condition". It is not a contractor's rebuild estimate; the page says so.
//  - The approved-amount bins (approvedBetween1And10000 etc.) are NOT used: in 13,705 of 39,941 rows
//    with a $25,001+ count, the row's approved dollars are smaller than that count x $25,001. Recorded
//    damage bins pass the same test and are used.
//  - Dollars are nominal (as approved). No inflation adjustment, so no "aid fell/rose" trend claims.
//  - No insurer names, no fear words.
import fs from 'node:fs';
import path from 'node:path';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';

const RAW = path.join(process.cwd(), 'docs', 'data', 'fema-aid-gap-raw.json');
const OUT = path.join(process.cwd(), 'docs', 'fema-aid-gap.html');
const OUT_EMBED = path.join(process.cwd(), 'docs', 'fema-aid-gap.embed.html');
const OUT_CSV_COUNTY = path.join(process.cwd(), 'docs', 'data', 'fema-aid-gap-by-county.csv');
const OUT_CSV_DISASTER = path.join(process.cwd(), 'docs', 'data', 'fema-aid-gap-by-disaster.csv');
const OUT_FIG = path.join(process.cwd(), 'docs', 'data', 'fema-aid-gap-figures.json');
const LOOKUP_FILE = 'fema-aid-gap-lookup.json';

const PUBLISHED = '25 November 2026';
const STUDY_URL = 'https://www.beforeregret.com/research/fema-aid-gap/';
const STUDY_NAME = 'What FEMA Pays Homeowners';
// Federal Register 2026-22693 (published 2026-11-06) and 2026-19854 (2026-09-29), read 2026-11-25.
const CAP_FY27 = 46_400, CAP_FY26 = 44_800;

if (!fs.existsSync(RAW)) throw new Error('ABORT: run scripts/fetch-fema-aid-gap-data.ts first');
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const FETCHED = String(raw.fetchedAt).slice(0, 10);

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const num = (v: number) => Math.round(v).toLocaleString('en-US');
const usd = (v: number) => `$${num(v)}`;
const bn = (v: number) => `$${(v / 1e9).toFixed(1)} billion`;
const must = (cond: boolean, msg: string) => { if (!cond) throw new Error(`ABORT: ${msg}`); };

// ---- rows ---------------------------------------------------------------------------------------
type Row = {
  disasterNumber: number; state: string; county: string; city: string; zipCode: string;
  validRegistrations: number; totalInspected: number; totalDamage: number; noFemaInspectedDamage: number;
  femaInspectedDamageBetween1And10000: number; femaInspectedDamageBetween10001And20000: number;
  femaInspectedDamageBetween20001And30000: number; femaInspectedDamageGreaterThan30000: number;
  approvedForFemaAssistance: number; totalApprovedIhpAmount: number; repairReplaceAmount: number;
  rentalAmount: number; otherNeedsAmount: number; totalMaxGrants: number;
};
const F: string[] = raw.owners.fields;
const ALL_ROWS: Row[] = raw.owners.rows.map((r: unknown[]) => Object.fromEntries(F.map((f, i) => [f, r[i] ?? (['state', 'county', 'city', 'zipCode'].includes(f) ? '' : 0)])));
type Disaster = { state: string; type: string; date: string; incidentType: string; title: string; begin: string };
const D: Record<string, Disaster> = raw.disasters;
// Disaster numbers with no declaration record can't be dated or typed. They're left out, and counted.
const MISSING = new Set<number>(raw.missingDisasters);
const rows = ALL_ROWS.filter((r) => !MISSING.has(r.disasterNumber));
const missingRows = ALL_ROWS.filter((r) => MISSING.has(r.disasterNumber));

type Agg = { reg: number; insp: number; dmg$: number; noDmg: number; d1: number; d2: number; d3: number; d4: number; appr: number; ihp: number; repair: number; rent: number; ona: number; max: number; dis: Set<number> };
const blank = (): Agg => ({ reg: 0, insp: 0, dmg$: 0, noDmg: 0, d1: 0, d2: 0, d3: 0, d4: 0, appr: 0, ihp: 0, repair: 0, rent: 0, ona: 0, max: 0, dis: new Set() });
const add = (a: Agg, r: Row) => {
  a.reg += r.validRegistrations; a.insp += r.totalInspected; a.dmg$ += r.totalDamage; a.noDmg += r.noFemaInspectedDamage;
  a.d1 += r.femaInspectedDamageBetween1And10000; a.d2 += r.femaInspectedDamageBetween10001And20000;
  a.d3 += r.femaInspectedDamageBetween20001And30000; a.d4 += r.femaInspectedDamageGreaterThan30000;
  a.appr += r.approvedForFemaAssistance; a.ihp += r.totalApprovedIhpAmount; a.repair += r.repairReplaceAmount;
  a.rent += r.rentalAmount; a.ona += r.otherNeedsAmount; a.max += r.totalMaxGrants; a.dis.add(r.disasterNumber);
};
const agg = (list: Row[]) => { const a = blank(); for (const r of list) add(a, r); return a; };
const damaged = (a: Agg) => a.d1 + a.d2 + a.d3 + a.d4;
const m = (a: Agg) => ({
  apprShare: a.appr / a.reg, perAppr: a.ihp / a.appr, maxShare: a.max / a.appr, damaged: damaged(a),
  over30Share: a.d4 / damaged(a), dmgPerDamaged: a.dmg$ / damaged(a), repairPerDollar: a.repair / a.dmg$,
});

const N = agg(rows), NM = m(N), MISS = agg(missingRows);
const years = rows.map((r) => D[r.disasterNumber].date.slice(0, 4)).sort();
const FIRST_DATE = Object.values(D).map((d) => d.date).sort()[0];
const LAST_DATE = Object.values(D).map((d) => d.date).sort().at(-1)!;
const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(And|Of|The|In)\b/g, (w) => w.toLowerCase()).replace(/^./, (c) => c.toUpperCase());
const dLabel = (n: number) => { const d = D[n]; return `${titleCase(d.title)} (${d.state}, ${d.date.slice(0, 4)})`; };

// ---- by incident type ---------------------------------------------------------------------------
const typeAgg = new Map<string, Agg>();
for (const r of rows) { const t = D[r.disasterNumber].incidentType; if (!typeAgg.has(t)) typeAgg.set(t, blank()); add(typeAgg.get(t)!, r); }
const MIN_TYPE = 50_000;
const types = [...typeAgg.entries()].map(([t, a]) => ({ t, a, ...m(a) })).sort((x, y) => y.a.reg - x.a.reg);
const bigTypes = types.filter((x) => x.a.reg >= MIN_TYPE);
const otherTypes = agg([]); for (const x of types.filter((y) => y.a.reg < MIN_TYPE)) for (const r of rows.filter((r) => D[r.disasterNumber].incidentType === x.t)) add(otherTypes, r);
const ty = (t: string) => { const x = types.find((y) => y.t === t); if (!x) throw new Error(`ABORT: incident type ${t} missing`); return x; };
const FIRE = ty('Fire'), HURR = ty('Hurricane'), FLOOD = ty('Flood');

// ---- by disaster --------------------------------------------------------------------------------
const disAgg = new Map<number, Agg>();
for (const r of rows) { if (!disAgg.has(r.disasterNumber)) disAgg.set(r.disasterNumber, blank()); add(disAgg.get(r.disasterNumber)!, r); }
const disasters = [...disAgg.entries()].map(([n, a]) => ({ n, a, d: D[n], ...m(a) })).sort((x, y) => y.a.reg - x.a.reg);
const dis = (n: number) => { const x = disasters.find((y) => y.n === n); if (!x) throw new Error(`ABORT: DR-${n} missing`); return x; };
const LA_FIRE = dis(4856), IRMA = dis(4337), KATRINA_LA = dis(1603);

// ---- by period (declaration year) ---------------------------------------------------------------
const PERIODS: Array<[string, string, string]> = [['2002 to 2009', '2002', '2009'], ['2010 to 2014', '2010', '2014'], ['2015 to 2019', '2015', '2019'], ['2020 to 2023', '2020', '2023'], ['2024 to 2026', '2024', '2026']];
const periods = PERIODS.map(([label, a, b]) => { const g = agg(rows.filter((r) => { const y = D[r.disasterNumber].date.slice(0, 4); return y >= a && y <= b; })); return { label, a: g, ...m(g) }; });
const RECENT = periods.at(-1)!;

// ---- by state -----------------------------------------------------------------------------------
const STATE_NAME: Record<string, string> = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam', AS: 'American Samoa', MP: 'Northern Mariana Islands', FM: 'Micronesia', MH: 'Marshall Islands', PW: 'Palau' };
const stAgg = new Map<string, Agg>();
for (const r of rows) { if (!stAgg.has(r.state)) stAgg.set(r.state, blank()); add(stAgg.get(r.state)!, r); }
for (const st of stAgg.keys()) must(!!STATE_NAME[st], `no name for state code ${st}`);
const states = [...stAgg.entries()].map(([st, a]) => ({ st, name: STATE_NAME[st], a, ...m(a) })).sort((x, y) => y.a.reg - x.a.reg);
const MIN_STATE = 10_000;
const stateShown = states.filter((s) => s.a.reg >= MIN_STATE);
const st = (s: string) => states.find((x) => x.st === s)!;

// ---- by county ----------------------------------------------------------------------------------
// FEMA's county field is the applicant's self-reported county, written "Harris (County)".
const countyLabel = (c: string) => c.replace(/\s*\((County|Parish|Borough|Census Area|Municipality|Municipio|City and Borough|city)\)\s*$/i, (_, t: string) => ` ${t === 'city' ? 'city' : t}`).replace(/\s*\(([^)]*)\)\s*$/, ' ($1)').trim();
const ctyAgg = new Map<string, Agg & { st: string; county: string }>();
for (const r of rows) {
  const k = `${r.state}|${r.county}`;
  if (!ctyAgg.has(k)) ctyAgg.set(k, { ...blank(), st: r.state, county: r.county });
  add(ctyAgg.get(k)!, r);
}
const counties = [...ctyAgg.values()].filter((c) => c.county).map((c) => ({ c, label: `${countyLabel(c.county)}, ${c.st}`, ...m(c) })).sort((x, y) => y.c.reg - x.c.reg);
const HARRIS = counties.find((x) => x.c.st === 'TX' && x.c.county === 'Harris (County)')!;

// ---- assertions: every claim the prose makes about rank, size or shape --------------------------
must(N.reg > 14_000_000 && N.reg < 16_000_000, `"about 15 million" registrations no longer fits (${num(N.reg)})`);
must(NM.apprShare > 0.44 && NM.apprShare < 0.49, `"fewer than half" approved, near 47%, no longer fits (${pct(NM.apprShare)})`);
must(NM.perAppr > 3_000 && NM.perAppr < 4_500, `average per approved registration moved (${usd(NM.perAppr)})`);
must(NM.maxShare < 0.015, `max-grant share is ${pct(NM.maxShare)}, prose says about 1 in 100`);
must(NM.over30Share < 0.04, `>$30k share of damaged homes is ${pct(NM.over30Share)}`);
must(NM.repairPerDollar > 0.3 && NM.repairPerDollar < 0.4, `repair per dollar of recorded damage moved (${NM.repairPerDollar.toFixed(2)})`);
must(MISS.reg / (N.reg + MISS.reg) < 0.02, 'unmatched disaster numbers now hold 2%+ of registrations');
must(HURR.a.reg / N.reg > 0.7, 'hurricanes no longer hold most registrations');
must(FIRE.dmgPerDamaged > 10 * NM.dmgPerDamaged, 'wildfire recorded damage per damaged home is no longer far above the rest');
must(FIRE.apprShare === Math.min(...bigTypes.map((x) => x.apprShare)), 'fire is no longer the lowest approval share among the large incident types');
must(FIRE.repairPerDollar === Math.min(...bigTypes.map((x) => x.repairPerDollar)), 'fire is no longer the lowest repair-per-dollar among the large incident types');
must(LA_FIRE.d.state === 'CA' && /WILDFIRES/.test(LA_FIRE.d.title) && LA_FIRE.d.date.startsWith('2025-01'), 'DR-4856 is not the January 2025 California wildfires');
must(LA_FIRE.apprShare < 0.12, `DR-4856 approval share is ${pct(LA_FIRE.apprShare)}`);
must(disasters[0].n === 4337, `Irma is no longer the largest by registrations (DR-${disasters[0].n})`);
must(IRMA.apprShare < 0.3, 'Irma approval share moved');
must(KATRINA_LA.repairPerDollar < 0.12, 'Katrina (LA) repair per dollar moved');
must(states[0].st === 'FL' && states[1].st === 'TX', `state order is ${states[0].st}, ${states[1].st}`);
must(counties[0].c.st === 'TX' && counties[0].c.county === 'Harris (County)', `top county is ${counties[0].label}`);
must(RECENT.maxShare < NM.maxShare, 'recent max-grant share is no longer below the all-years share');
must(disasters.slice(0, 12).every((x) => x.repairPerDollar >= KATRINA_LA.repairPerDollar), 'Katrina (LA) is no longer the lowest repair per dollar in the top 12');
must(N.d1 > NM.damaged / 2, '"most had less than $10,000" no longer holds');
must(Object.values(D).filter((d) => d.incidentType === 'Fire').every((d) => /FIRE/.test(d.title)), 'a Fire disaster title no longer names a fire');
must(N.d4 < N.max * 3, 'max grants vs >$30k homes shape changed'); // sanity: both small next to the totals

// ---- CSVs -----------------------------------------------------------------------------------------
const cell = (s: string | number) => { const t = String(s ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const r2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2);
const aggCols = ['homeowner_registrations', 'inspected', 'inspected_with_damage', 'inspected_no_damage', 'damage_over_30000', 'approved_for_ihp',
  'approval_share', 'ihp_approved_usd', 'repair_replace_usd', 'rental_usd', 'other_needs_usd', 'fema_recorded_damage_usd', 'max_grants'];
const aggVals = (a: Agg) => [a.reg, a.insp, damaged(a), a.noDmg, a.d4, a.appr, a.reg ? (a.appr / a.reg).toFixed(4) : '', r2(a.ihp), r2(a.repair), r2(a.rent), r2(a.ona), r2(a.dmg$), a.max];
const countyCsv = [
  ['state', 'county_as_reported_to_fema', 'disasters', ...aggCols].join(','),
  ...[...counties].sort((x, y) => x.c.st.localeCompare(y.c.st) || x.c.county.localeCompare(y.c.county)).map((x) => [x.c.st, cell(x.c.county), x.c.dis.size, ...aggVals(x.c)].join(',')),
].join('\n') + '\n';
const disStateAgg = new Map<string, Agg>();
for (const r of rows) { const k = `${r.disasterNumber}|${r.state}`; if (!disStateAgg.has(k)) disStateAgg.set(k, blank()); add(disStateAgg.get(k)!, r); }
const disasterCsv = [
  ['disaster_number', 'state', 'declaration_date', 'incident_type', 'declaration_title', ...aggCols].join(','),
  ...[...disStateAgg.entries()].sort((a, b) => Number(a[0].split('|')[0]) - Number(b[0].split('|')[0]) || a[0].localeCompare(b[0])).map(([k, a]) => {
    const [n, s] = k.split('|'); const d = D[n];
    return [n, s, d.date, cell(d.incidentType), cell(titleCase(d.title)), ...aggVals(a)].join(',');
  }),
].join('\n') + '\n';

// ---- page pieces ----------------------------------------------------------------------------------
const bar = (v: number, max = 1) => `<td class="bar"><span style="width:${Math.max(1, Math.round((v / max) * 100))}%"></span></td>`;
const typeRows = bigTypes.map((x) =>
  `      <tr><td>${esc(x.t)}</td><td class="n">${num(x.a.reg)}</td><td class="n">${pct(x.apprShare, 0)}</td><td class="n">${usd(x.dmgPerDamaged)}</td><td class="n"><b>${usd(x.perAppr)}</b></td><td class="n">${Math.round(x.repairPerDollar * 100)}&cent;</td></tr>`).join('\n')
  + `\n      <tr><td>Other types</td><td class="n">${num(otherTypes.reg)}</td><td class="n">${pct(otherTypes.appr / otherTypes.reg, 0)}</td><td class="n">${usd(otherTypes.dmg$ / damaged(otherTypes))}</td><td class="n"><b>${usd(otherTypes.ihp / otherTypes.appr)}</b></td><td class="n">${Math.round(otherTypes.repair / otherTypes.dmg$ * 100)}&cent;</td></tr>`;
const periodRows = periods.map((p) =>
  `      <tr><td>${p.label}</td><td class="n">${p.a.dis.size}</td><td class="n">${num(p.a.reg)}</td><td class="n">${pct(p.apprShare, 0)}</td><td class="n"><b>${usd(p.perAppr)}</b></td><td class="n">${num(p.a.max)}</td></tr>`).join('\n');
const TOP_DIS = 12;
const disasterRows = disasters.slice(0, TOP_DIS).map((x) =>
  `      <tr><td>${esc(dLabel(x.n))}</td><td class="n">${num(x.a.reg)}</td><td class="n">${pct(x.apprShare, 0)}</td><td class="n"><b>${usd(x.perAppr)}</b></td><td class="n">${Math.round(x.repairPerDollar * 100)}&cent;</td></tr>`).join('\n');
const stateRows = stateShown.map((s) =>
  `      <tr><td>${esc(s.name)}</td><td class="n">${num(s.a.reg)}</td><td class="n">${pct(s.apprShare, 0)}</td><td class="n"><b>${usd(s.perAppr)}</b></td><td class="n">${num(s.a.max)}</td>${bar(s.apprShare)}</tr>`).join('\n');
const damageRows = ([['$1 to $10,000', N.d1], ['$10,001 to $20,000', N.d2], ['$20,001 to $30,000', N.d3], ['More than $30,000', N.d4]] as Array<[string, number]>).map(([l, v]) =>
  `      <tr><td>${l}</td><td class="n">${num(v)}</td><td class="n">${pct(v / NM.damaged)}</td>${bar(v, N.d1)}</tr>`).join('\n');

// Lookup: every county, with its three largest disasters.
// [label, registrations, approved, ihp$, inspected, damaged, over30k, maxGrants, disasters, [[label, reg, approved, ihp$] x3]]
const LK_DIS = 3;
const lkDis: Record<number, string> = {};
const lookupCounties = [...counties].sort((x, y) => x.c.st.localeCompare(y.c.st) || x.label.localeCompare(y.label)).map((x) => {
  const per = new Map<number, Agg>();
  for (const r of rows) if (r.state === x.c.st && r.county === x.c.county) { if (!per.has(r.disasterNumber)) per.set(r.disasterNumber, blank()); add(per.get(r.disasterNumber)!, r); }
  const top = [...per.entries()].sort((a, b) => b[1].reg - a[1].reg).slice(0, LK_DIS).map(([n, a]) => { lkDis[n] = dLabel(n).replace(/ \([A-Z]{2}, /, ' ('); return [n, a.reg, a.appr, Math.round(a.ihp)]; });
  return [x.label, x.c.reg, x.c.appr, Math.round(x.c.ihp), x.c.insp, damaged(x.c), x.c.d4, x.c.max, x.c.dis.size, top];
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
  .lk-offices th{font-size:10.5px;padding:.3rem;border-bottom:1px solid #c9c1b3}
  .lk-offices td{border-bottom:1px solid #ece8e1;padding:.35rem .3rem}
  .lk-offices td.n,.lk-offices th.n{text-align:right;font-variant-numeric:tabular-nums}
  .lk-msg{font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.8rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6a6a6a;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;

const LOOKUP_MARKUP = `<div class="lookup">
    <p class="lk-eyebrow">Look up any of the ${num(counties.length)} counties with FEMA homeowner aid since ${FIRST_DATE.slice(0, 4)}</p>
    <label for="fagpick" style="position:absolute;left:-9999px">Choose a county</label>
    <select id="fagpick"><option value="">Choose a county&hellip;</option></select>
    <div id="fagout" aria-live="polite"></div>
    <p class="lk-caveat">Homeowner registrations for FEMA&rsquo;s Individuals and Households Program in major disasters
    declared from ${FIRST_DATE.slice(0, 4)} to ${LAST_DATE.slice(0, 4)}, from OpenFEMA, data refreshed ${FETCHED}. Dollars are as approved,
    not adjusted for inflation, and include rental and other-needs aid. County is the one the applicant reported.
    Figures describe past disasters in the county, not any one house.</p>
  </div>`;

const LOOKUP_URL = `/research/data/${LOOKUP_FILE}`;
const DATA_SCRIPT = `<script type="application/json" id="fag-data">${JSON.stringify({ src: LOOKUP_URL })}</script>`;
const JS_SCRIPT = `<script>
(function(){
  var s=document.getElementById('fagpick'),o=document.getElementById('fagout'),d=[],L={};
  var src=JSON.parse(document.getElementById('fag-data').textContent).src;
  s.disabled=true;
  fetch(src).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){
    d=j.c; L=j.d; s.disabled=false;
    d.forEach(function(c,i){var e=document.createElement('option');e.value=i;e.textContent=c[0];s.appendChild(e);});
  }).catch(function(){o.innerHTML='<p class="lk-msg">The county list did not load. The same figures are in the county CSV below.</p>';});
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  function fmt(n){return Math.round(n).toLocaleString('en-US');}
  function h(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function avg(ihp,a){return a>=5?'$'+fmt(ihp/a):'&ndash;';}
  s.addEventListener('change',function(){
    var c=d[s.value]; if(!c){o.innerHTML='';return;}
    var rows=c[9].map(function(x){return '<tr><td>'+h(L[x[0]])+'</td><td class="n">'+fmt(x[1])+'</td><td class="n">'+(x[1]?Math.round(x[2]/x[1]*100)+'%':'&ndash;')+'</td><td class="n">'+avg(x[3],x[2])+'</td></tr>';}).join('');
    o.innerHTML='<div class="lk-grid">'
      +cell(fmt(c[1]),'homeowner registrations, '+c[8]+' disaster'+(c[8]>1?'s':''))
      +cell(Math.round(c[2]/c[1]*100)+'%','approved for any FEMA aid')
      +cell(avg(c[3],c[2]),'average per approved registration')
      +cell(fmt(c[7]),'got the maximum grant')
      +'</div>'
      +'<table class="lk-offices"><thead><tr><th>Largest disasters here</th><th class="n">Registered</th><th class="n">Approved</th><th class="n">Average</th></tr></thead><tbody>'+rows+'</tbody></table>'
      +(c[8]>${LK_DIS}?'<p class="lk-msg">The totals above include all '+c[8]+' disasters with homeowner registrations here.</p>':'')
      +(c[2]<5?'<p class="lk-msg">Averages are left blank where fewer than five registrations were approved.</p>':'');
  });
})();
</script>`;

const KEY_FINDINGS = keyFindingsBlock([
  `FEMA recorded ${num(N.reg)} homeowner registrations for its Individuals and Households Program in ${num(N.dis.size)} major disasters declared from ${FIRST_DATE.slice(0, 4)} to ${LAST_DATE.slice(0, 4)}; ${pct(NM.apprShare)} were approved for any aid.`,
  `Approved homeowner registrations received ${usd(NM.perAppr)} on average, counting repair, rental and other-needs aid together. ${pct(NM.maxShare)} received FEMA's maximum grant.`,
  `Of the ${num(NM.damaged)} owner-occupied homes FEMA inspected and found damaged, ${pct(NM.over30Share)} had FEMA-recorded damage above $30,000.`,
  `FEMA approved ${Math.round(NM.repairPerDollar * 100)} cents of home repair and replacement aid for every dollar of damage its inspectors recorded to owners' homes and belongings.`,
  `In wildfire disasters, FEMA-recorded damage averaged ${usd(FIRE.dmgPerDamaged)} per damaged home, and ${pct(FIRE.apprShare)} of homeowner registrations were approved for aid, the lowest share of any major disaster type.`,
], `Source: FEMA, OpenFEMA Individuals and Households Program Housing Assistance Program Data (Owners), v2, refreshed ${FETCHED}; FEMA Disaster Declarations Summaries, v2. Analysis by Before Regret. Dollars as approved, not adjusted for inflation.`);

// ---- questions this data answers ----------------------------------------------------------------
const FAQ: Array<{ q: string; a: string }> = [
  { q: 'How much money does FEMA give homeowners after a disaster?',
    a: `Across ${num(N.dis.size)} major disasters declared from ${FIRST_DATE.slice(0, 4)} to ${LAST_DATE.slice(0, 4)}, approved homeowner registrations received ${usd(NM.perAppr)} on average from FEMA's Individuals and Households Program, counting home repair, rental and other-needs aid together. ${pct(NM.apprShare)} of the ${num(N.reg)} homeowner registrations were approved for any aid. Dollars are as approved, not adjusted for inflation.` },
  { q: 'What is the maximum FEMA assistance for a homeowner?',
    a: `For disasters declared on or after October 1, 2026, FEMA's notice in the Federal Register sets the maximum at $46,400 for housing assistance and $46,400 for other needs; for disasters declared from October 1, 2025 it was $44,800 each. In FEMA's own data, ${pct(NM.maxShare)} of approved homeowner registrations since ${FIRST_DATE.slice(0, 4)} received the maximum grant.` },
  { q: 'Does FEMA pay for home repairs if I have homeowners insurance?',
    a: `Generally only for what insurance does not cover. FEMA's rules (44 CFR 206.113) let it help an insured homeowner when the claim is denied, when insurance proceeds are significantly delayed and the homeowner agrees to repay FEMA from them, or when insurance and all other help are not enough. Repair aid is limited to making the home safe and sanitary to live in (44 CFR 206.117), not to restoring it as it was.` },
  { q: 'What share of FEMA applicants get approved?',
    a: `${pct(NM.apprShare)} of homeowner registrations in disasters declared from ${FIRST_DATE.slice(0, 4)} to ${LAST_DATE.slice(0, 4)} were approved for any Individuals and Households Program aid. The share varies by disaster: ${pct(IRMA.apprShare, 0)} for Hurricane Irma in Florida, the largest by registrations, and ${pct(LA_FIRE.apprShare, 0)} for the January 2025 California wildfires.` },
  { q: 'Where can I download FEMA disaster aid data by county?',
    a: `This study publishes two CSV files under a CC BY 4.0 licence: every county with FEMA homeowner registrations since ${FIRST_DATE.slice(0, 4)}, and every disaster by state, each with registrations, inspections, recorded damage, approvals and dollars. The underlying data is FEMA's OpenFEMA Housing Assistance Program Data (Owners) dataset, which is public and needs no key.` },
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
  <p class="kicker">National analysis &middot; ${num(N.dis.size)} disasters &middot; ${num(counties.length)} counties &middot; OpenFEMA</p>
  <h1>${STUDY_NAME}</h1>
  <p class="standfirst">When a disaster declaration covers a house, its owner can apply to FEMA for help. We added up
  every homeowner registration FEMA has published, ${num(N.reg)} across ${num(N.dis.size)} major disasters since
  ${FIRST_DATE.slice(0, 4)}. Fewer than half, ${pct(NM.apprShare)}, were approved for any aid, and approved owners got
  ${usd(NM.perAppr)} on average. FEMA&rsquo;s aid is built to make a home livable again, behind insurance, and the
  numbers show it.</p>

  <div class="figs">
    <div class="fig"><b>${num(N.reg)}</b><span>homeowner registrations since ${FIRST_DATE.slice(0, 4)}</span></div>
    <div class="fig"><b>${pct(NM.apprShare)}</b><span>approved for any FEMA aid</span></div>
    <div class="fig"><b>${usd(NM.perAppr)}</b><span>average per approved registration</span></div>
    <div class="fig"><b>${pct(NM.maxShare)}</b><span>of approved owners got the maximum</span></div>
  </div>

  ${KEY_FINDINGS}

  ${LOOKUP_MARKUP}

  <div class="cta">
    <h2>Plan for the gap before you buy</h2>
    <p>Disaster aid is a floor, not a rebuild fund. The time to find out what a home&rsquo;s area has been through,
    and what your own policy would and wouldn&rsquo;t pay for, is before closing, while you can still ask questions
    and compare quotes.</p>
    <p>For one address, a free Before Regret report lists what to check for that area before you buy. No sign-up
    required.</p>
    <p><a class="btn" href="/">Get the free report</a></p>
  </div>

  <h2>What the program is for</h2>
  <h3>Livable again, and behind insurance.</h3>

  <p>FEMA&rsquo;s Individuals and Households Program pays homeowners in three main ways: repair or replacement
  money for the home, rental help while it can&rsquo;t be lived in, and &ldquo;other needs&rdquo; such as
  belongings, medical and funeral costs. Two rules in FEMA&rsquo;s regulations shape every number on this page.</p>

  <p>The first is the purpose of repair money. Under 44 CFR 206.117, FEMA may pay to repair a damaged home
  &ldquo;to a safe and sanitary living or functioning condition,&rdquo; and its help &ldquo;will be limited to
  repairs of a quality necessary&rdquo; for that. The goal is a home that works, not the home as it was.</p>

  <p>The second is insurance. Under 44 CFR 206.113, when an applicant has insurance, FEMA may help only when the
  claim is denied, when insurance money is &ldquo;significantly delayed&rdquo; and the owner agrees to pay FEMA
  back from it, when no housing can be had on the private market, or when insurance and all other help are not
  enough. Section 206.117 adds that repair aid is for damage &ldquo;not covered by insurance.&rdquo; The
  dataset doesn&rsquo;t say which applicants were insured, so we can&rsquo;t split the figures that way.</p>

  <p>There is also a cap. FEMA adjusts it every year in the Federal Register. For disasters declared on or after
  October 1, 2026, it is ${usd(CAP_FY27)} for housing assistance and ${usd(CAP_FY27)} for other needs; the year before,
  ${usd(CAP_FY26)} each.</p>

  <h2>How much approved owners got</h2>
  <h3>A few thousand dollars, and the cap for about 1 in 100.</h3>

  <p>Counting repair, rental and other-needs money together, the average approved homeowner registration got
  ${usd(NM.perAppr)}. Only ${num(N.max)} registrations, ${pct(NM.maxShare)} of those approved, received FEMA&rsquo;s maximum grant.
  Of the ${bn(N.ihp)} FEMA approved for homeowners in these disasters, ${bn(N.repair)} was for repairing or replacing
  homes, ${bn(N.rent)} for rent and ${bn(N.ona)} for other needs.</p>

  <p>Part of the reason is what FEMA&rsquo;s inspectors find. Of ${num(N.insp)} owner-occupied homes inspected, ${num(N.noDmg)}
  had no damage recorded. Of the ${num(NM.damaged)} with damage, most had less than $10,000 of it under FEMA&rsquo;s
  guidelines, and ${pct(NM.over30Share)} had more than $30,000. That recorded damage, ${bn(N.dmg$)} in total, covers the
  home and its belongings. Against it, FEMA approved ${Math.round(NM.repairPerDollar * 100)} cents of home repair and
  replacement money for every dollar.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>FEMA-recorded damage</th><th class="n">Owner homes</th><th class="n">Share</th><th class="bar"></th></tr></thead>
      <tbody>
${damageRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Owner-occupied homes FEMA inspected and found damaged, in major disasters declared ${FIRST_DATE.slice(0, 4)} to
  ${LAST_DATE.slice(0, 4)}, by the damage FEMA recorded under its inspection guidelines.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Disasters declared</th><th class="n">Disasters</th><th class="n">Registrations</th><th class="n">Approved</th><th class="n">Avg. per approved</th><th class="n">Max grants</th></tr></thead>
      <tbody>
${periodRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Homeowner registrations by the year the disaster was declared. Dollars are as approved, not adjusted for
  inflation, so the averages are not comparable across rows as a trend. Disasters declared in ${LAST_DATE.slice(0, 4)} can still
  be open.</p>

  <h2>By disaster type</h2>
  <h3>Wildfire stands apart.</h3>

  <p>Hurricanes account for ${pct(HURR.a.reg / N.reg, 0)} of all homeowner registrations. Wildfire is the outlier. In
  wildfire disasters, FEMA-recorded damage averaged ${usd(FIRE.dmgPerDamaged)} per damaged home, against ${usd(NM.dmgPerDamaged)}
  across all disasters, because a burned house is often a total loss. Yet only ${pct(FIRE.apprShare)} of wildfire registrations
  were approved for any aid, and repair money came to ${Math.round(FIRE.repairPerDollar * 100)} cents per dollar of recorded damage.
  The January 2025 wildfires in Los Angeles County alone drew ${num(LA_FIRE.a.reg)} homeowner registrations, and ${pct(LA_FIRE.apprShare, 0)}
  were approved.</p>

  <p>The insurance rule above is the likeliest reason, though the data can&rsquo;t show it directly: a homeowner
  whose fire loss is covered by insurance is not eligible for FEMA repair money for the same damage.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Incident type</th><th class="n">Registrations</th><th class="n">Approved</th><th class="n">Recorded damage per damaged home</th><th class="n">Avg. per approved</th><th class="n">Repair per $1 of damage</th></tr></thead>
      <tbody>
${typeRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Incident type as FEMA declared it. Types with fewer than ${num(MIN_TYPE)} homeowner registrations are grouped as
  &ldquo;Other types&rdquo;. &ldquo;Fire&rdquo; is FEMA&rsquo;s incident type; every fire disaster in the data is a wildfire declaration.</p>

  <h2>The largest disasters</h2>
  <h3>Approval rates swing widely, even between big hurricanes.</h3>

  <p>Hurricane Irma in Florida drew more homeowner registrations than any other disaster in the data,
  ${num(IRMA.a.reg)}, and ${pct(IRMA.apprShare, 0)} were approved. For Hurricane Katrina in Louisiana, FEMA approved
  ${Math.round(KATRINA_LA.repairPerDollar * 100)} cents of repair money for every dollar of damage it recorded, the lowest
  among these disasters.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>Disaster</th><th class="n">Registrations</th><th class="n">Approved</th><th class="n">Avg. per approved</th><th class="n">Repair per $1 of damage</th></tr></thead>
      <tbody>
${disasterRows}
      </tbody>
    </table>
  </div>
  <p class="cap">The ${TOP_DIS} disasters with the most homeowner registrations. One declaration covers one state, so a storm that
  crossed several states appears once per state. Every disaster is in the disaster CSV.</p>

  <h2>By state</h2>
  <h3>Florida and Texas hold the most registrations.</h3>

  <p>Florida has the most homeowner registrations in the data, ${num(st('FL').a.reg)}, and Texas is next with ${num(st('TX').a.reg)}.
  Harris County, Texas has more than any other county, ${num(HARRIS.c.reg)} across ${HARRIS.c.dis.size} disasters.</p>

  <div class="scroll tall">
    <table>
      <thead><tr><th>State or territory</th><th class="n">Registrations</th><th class="n">Approved</th><th class="n">Avg. per approved</th><th class="n">Max grants</th><th class="bar"></th></tr></thead>
      <tbody>
${stateRows}
      </tbody>
    </table>
  </div>
  <p class="cap">States and territories with at least ${num(MIN_STATE)} homeowner registrations, by registrations. The bar is the
  approved share. The rest are in the county CSV.</p>

  <h2>What this means if you&rsquo;re buying</h2>
  <h3>Count on your own coverage first.</h3>

  <p>FEMA aid only starts with a federal disaster declaration that includes individual assistance for the
  county, and even then it is designed to come after insurance and to stop at a livable home. A buyer
  weighing a house in an area with a disaster history has three practical questions to answer before
  closing:</p>
  <ul>
    <li><strong>What does the area face?</strong> Look up the flood zone and the county&rsquo;s disaster
    history. Here is <a href="/guides/flood-zone-by-address/">how to check the flood zone for an address</a>, and
    the lookup above shows past FEMA aid in the county.</li>
    <li><strong>What would your own policy pay?</strong> Ask for the policy wording on the hazards the area
    has, not only the price. About a quarter of flood insurance claims were on properties rated outside
    the high-risk flood zone, as our study <a href="/research/outside-the-zone/">Outside the Zone</a> found.</li>
    <li><strong>What would you cover yourself?</strong> Deductibles and limits decide how much of a repair
    lands on you. The average FEMA grant on this page is a useful reality check against that number.</li>
  </ul>

  <h2>Method</h2>
  <h3>How the figures were built.</h3>

  <p>The data is FEMA&rsquo;s OpenFEMA dataset &ldquo;Individuals and Households Program &ndash; Housing Assistance
  Program Data &ndash; Owners&rdquo; (version 2), pulled in full through the public API on ${FETCHED}: ${num(ALL_ROWS.length)}
  rows, one for each disaster, state, county, city and ZIP code with homeowner registrations, from DR-1439 on. Each
  row counts valid registrations, inspections, homes by FEMA-recorded damage, approvals, and approved dollars for
  repair or replacement, rent and other needs. We joined each disaster number to FEMA&rsquo;s Disaster Declarations
  Summaries for its date, incident type and title.</p>

  <p>${MISSING.size} disaster numbers in the owners data have no record in the declarations data, so they can&rsquo;t be
  dated or typed. Their ${num(MISS.reg)} registrations, ${pct(MISS.reg / (N.reg + MISS.reg))} of the total, are left out of every figure.</p>

  <p>&ldquo;Registrations&rdquo; are FEMA&rsquo;s count of valid homeowner registrations; a household that applied in two
  disasters counts twice. &ldquo;Approved&rdquo; means approved for any program aid. &ldquo;Average per approved&rdquo;
  divides all approved program dollars by approved registrations. &ldquo;Repair per $1 of damage&rdquo; divides approved
  repair and replacement dollars by FEMA-recorded damage. FEMA also publishes counts of owners by approved amount
  ($1 to $10,000, and so on); we don&rsquo;t use them, because in many rows they don&rsquo;t agree with the dollar totals
  in the same row.</p>

  <h2>Limitations</h2>
  <h3>What this does not show.</h3>

  <p><strong>Recorded damage is FEMA&rsquo;s, not a contractor&rsquo;s.</strong> FEMA describes the damage field as FEMA
  Verified Loss for the home and personal property, recorded at the latest inspection under FEMA&rsquo;s guidelines.
  It is tied to what FEMA can pay for, so it is not an estimate of the cost to rebuild, and the true gap between
  loss and aid is wider than these ratios suggest.</p>

  <p><strong>No insurance field.</strong> The data doesn&rsquo;t say who was insured, who was paid by insurance, or
  who got help from other sources, such as disaster loans. A low approval share can reflect insured owners as much
  as denied ones.</p>

  <p><strong>FEMA&rsquo;s own caveats.</strong> FEMA notes that the county is self-reported, that the financial figures
  come from its case-management system rather than official financial systems and &ldquo;may differ slightly from
  official publication,&rdquo; and that the data is not intended for official federal financial reporting. Dollars
  are as approved, not as paid, and not adjusted for inflation. Recent disasters may still be open.</p>

  <h2>Questions this data answers</h2>
  <div class="faq">
${FAQ_HTML}
  </div>

  <div class="cite">
    <b>Cite this</b>
    Before Regret, &ldquo;${STUDY_NAME}: FEMA homeowner aid against FEMA-recorded damage, ${FIRST_DATE.slice(0, 4)}&ndash;${LAST_DATE.slice(0, 4)}.&rdquo;
    ${PUBLISHED}. Analysis of FEMA OpenFEMA Housing Assistance Program Data (Owners) v2, refreshed ${FETCHED}, for
    ${num(N.dis.size)} major disasters and ${num(counties.length)} counties.<br>
    <a href="${STUDY_URL}">${STUDY_URL}</a><br>
    Data: <a href="https://www.beforeregret.com/research/data/fema-aid-gap-by-county.csv">every county (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/fema-aid-gap-by-disaster.csv">every disaster by state (CSV)</a> &middot;
    <a href="https://www.beforeregret.com/research/data/fema-aid-gap-figures.json">figures (JSON)</a>.
    Questions and corrections: hello@beforeregret.com
  </div>

  <div class="cite">
    <b>Embed the county lookup</b>
    Free to use, no tracking, no attribution required beyond the credit line it carries.
    <pre class="snippet">&lt;iframe src="${STUDY_URL}embed/"
        width="100%" height="480" style="border:1px solid #ded9cf"
        title="FEMA homeowner aid by county"
        loading="lazy"&gt;&lt;/iframe&gt;</pre>
    It posts its own height to the parent page as <code>beforeRegretEmbedHeight</code>.
  </div>

  <div class="cite">
    <b>For newsrooms, researchers and recovery groups</b>
    Published under a Creative Commons Attribution 4.0 licence: republish the figures, redraw the tables, or run
    your own cut without asking, with credit to Before Regret and a link to this page. FEMA&rsquo;s data is a US
    Government work; this study is not endorsed by FEMA. Happy to pull a specific county or disaster, or check a
    figure before it prints &mdash; hello@beforeregret.com.
  </div>

  <footer class="spine">
    Sources: FEMA, OpenFEMA Housing Assistance Program Data &ndash; Owners (v2) and Disaster Declarations Summaries (v2),
    retrieved ${FETCHED}; 44 CFR 206.113 and 206.117 (eCFR, read 2026-11-25); Federal Register notices 2026-22693 and
    2026-19854, maximum amount of assistance under the Individuals and Households Program.<br>
    Analysis by Before Regret. Published ${PUBLISHED}.<br>
    Related: <a href="/research/outside-the-zone/">Outside the Zone</a> &#183;
    <a href="/research/risk-without-cover/">Risk Without Cover</a> &#183;
    <a href="/research/built-to-code/">Built to Which Code?</a>
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
<title>FEMA homeowner aid by county &mdash; Before Regret</title>
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
  if (!doc.includes('fag-data')) throw new Error(`ABORT: ${name} lost the lookup data`);
}
if (!embed.includes('embed-credit')) throw new Error('ABORT: embed lost its credit line');
const visible = html.slice(0, html.indexOf('<script type="application/json"'));
for (const banned of [/most (?:insurers|carriers)/i, /\b(insurer|carrier)s? (?:will|won't|refuse|deny|drop)/i, /\b(unsafe|dangerous|death ?trap|deadly|devastat\w*|catastroph\w*)\b/i, /this (?:house|home) (?:was|is|has)/i]) {
  if (banned.test(visible)) throw new Error(`ABORT: unsupported or fear claim matched ${banned}`);
}
assertKeyFindingsNumbers(visible, 'build-fema-aid-gap-study');

const figAgg = (a: Agg) => ({
  homeownerRegistrations: a.reg, inspected: a.insp, inspectedWithDamage: damaged(a), inspectedNoDamage: a.noDmg, damageOver30000: a.d4,
  approved: a.appr, approvalShare: +(a.appr / a.reg).toFixed(4), ihpApprovedUsd: Math.round(a.ihp), repairReplaceUsd: Math.round(a.repair),
  rentalUsd: Math.round(a.rent), otherNeedsUsd: Math.round(a.ona), femaRecordedDamageUsd: Math.round(a.dmg$), maxGrants: a.max,
  avgPerApprovedUsd: Math.round(a.ihp / a.appr), repairPerDollarOfDamage: +(a.repair / a.dmg$).toFixed(4), disasters: a.dis.size,
});
const figures = {
  title: `${STUDY_NAME}: FEMA homeowner aid against FEMA-recorded damage`,
  generated: new Date().toISOString().slice(0, 10),
  fetchedAt: raw.fetchedAt,
  sources: raw.sources,
  declarationRange: { first: FIRST_DATE, last: LAST_DATE },
  ihpMaximum: { declaredOnOrAfter20261001: CAP_FY27, declaredOnOrAfter20251001: CAP_FY26, source: 'Federal Register 2026-22693 and 2026-19854' },
  scope: { rows: rows.length, disasters: N.dis.size, counties: counties.length, excludedDisasterNumbersWithoutDeclaration: [...MISSING], excludedRegistrations: MISS.reg },
  national: figAgg(N),
  periods: periods.map((p) => ({ declared: p.label, ...figAgg(p.a) })),
  incidentTypes: types.map((x) => ({ incidentType: x.t, ...figAgg(x.a) })),
  states: states.map((s) => ({ state: s.name, abbr: s.st, ...figAgg(s.a) })),
  topDisasters: disasters.slice(0, 25).map((x) => ({ disasterNumber: x.n, title: titleCase(x.d.title), state: x.d.state, declared: x.d.date, incidentType: x.d.incidentType, ...figAgg(x.a) })),
  topCounties: counties.slice(0, 25).map((x) => ({ county: x.label, ...figAgg(x.c) })),
  faq: FAQ,
};

fs.writeFileSync(OUT, html);
fs.writeFileSync(OUT_EMBED, embed);
fs.writeFileSync(OUT_CSV_COUNTY, countyCsv);
fs.writeFileSync(OUT_CSV_DISASTER, disasterCsv);
fs.writeFileSync(OUT_FIG, JSON.stringify(figures, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'docs', 'data', LOOKUP_FILE), JSON.stringify({ d: lkDis, c: lookupCounties }));
const kb = (f: string) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${(html.length / 1024).toFixed(1)} KB), embed (${(embed.length / 1024).toFixed(1)} KB), lookup ${kb(path.join('docs', 'data', LOOKUP_FILE))} KB`);
console.log(`county CSV ${counties.length} (${kb(OUT_CSV_COUNTY)} KB), disaster CSV ${disStateAgg.size} (${kb(OUT_CSV_DISASTER)} KB)`);
console.log(`  regs ${num(N.reg)} in ${N.dis.size} disasters ${years[0]}-${years.at(-1)}; approved ${pct(NM.apprShare)}; avg ${usd(NM.perAppr)}; max ${pct(NM.maxShare)}; >30k ${pct(NM.over30Share)}; repair/$ ${NM.repairPerDollar.toFixed(3)}; fire ${usd(FIRE.dmgPerDamaged)} ${pct(FIRE.apprShare)}; LA ${pct(LA_FIRE.apprShare)}; excluded ${num(MISS.reg)}`);
console.log(`  top counties: ${counties.slice(0, 5).map((x) => `${x.label} ${num(x.c.reg)}`).join('; ')}`);
