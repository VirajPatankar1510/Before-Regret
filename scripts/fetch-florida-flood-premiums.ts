// Pulls every Florida NFIP policy in force on SNAPSHOT from OpenFEMA NfipPolicies v3 and aggregates what
// single-family owners pay against FEMA's full-risk premium, by ZIP, county, build era, foundation and zone.
//
//   npx tsx scripts/fetch-florida-flood-premiums.ts   # -> docs/data/florida-flood-premiums.json (+ -by-zip.csv)
//
// Only aggregates are written (no policy-level rows). Public API, no key; curl rather than fetch() like
// the other fetch scripts.
//
// Field meanings are FEMA's own (OpenFemaDataSetFields, NfipPolicies v3, read 2026-11-27):
//   totalInsurancePremiumOfThePolicy  "Total Insurance Premium of the Policy in whole dollars"
//   fullRiskPremium                   "The chargeable premium for a property based on its determined flood risk
//                                      and the full cost to pay anticipated losses and expenses"
//   policyCost                        premium + reserve fund assessment + federal policy fee + HFIAA surcharge
// We compare premium with full-risk premium (both exclude the fees), and report policyCost as "what the
// owner pays in total".
//
// The 18% figure: 42 U.S.C. 4015(e)(1), "may not be increased by more than 18 percent each year", with the
// exceptions listed there. Years-to-full-risk is therefore a MINIMUM (increases may be smaller), and assumes
// the full-risk premium itself stays where it is.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SNAPSHOT = '2026-09-01';
const MIN_N = 30; // a ZIP/county/group figure is published only with at least this many policies
const API = 'https://www.fema.gov/api/open/v3/NfipPolicies';
const PAGE = 10_000;
const SELECT = [
  'id', 'policyCost', 'fullRiskPremium', 'totalInsurancePremiumOfThePolicy', 'occupancyType', 'foundationType',
  'originalConstructionDate', 'ratedFloodZone', 'primaryResidenceIndicator', 'reportedZipCode', 'censusGeoid',
  'policyCount', 'totalBuildingInsuranceCoverage', 'mandatoryPurchaseFlag', 'policyEffectiveDate', 'crsClassCode',
].join(',');
const FILTER = `propertyState eq 'FL' and policyEffectiveDate le '${SNAPSHOT}' and policyTerminationDate gt '${SNAPSHOT}'`;
const OUT_JSON = path.join(process.cwd(), 'docs', 'data', 'florida-flood-premiums.json');
const OUT_CSV = path.join(process.cwd(), 'docs', 'data', 'florida-flood-premiums-by-zip.csv');

const enc = (s: string) => encodeURIComponent(s).replace(/'/g, '%27');
const get = (url: string) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const body = execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '300', url], { maxBuffer: 512 * 1024 * 1024 }).toString();
      if (!/^[\[{]/.test(body.trim())) throw new Error(`not JSON: ${body.slice(0, 120)}`);
      return JSON.parse(body);
    } catch (e) {
      if (attempt >= 4) throw new Error(`ABORT after ${attempt} tries: ${url}: ${(e as Error).message}`);
      execFileSync('perl', ['-e', `sleep ${attempt * 10}`]);
    }
  }
};

type Row = { cost: number; prem: number; full: number; zip: string; county: string; era: string; fdn: string; zone: string; primary: boolean; cov: number; mand: boolean; crs: string };
const eraOf = (d: string | null) => {
  const y = d ? Number(d.slice(0, 4)) : NaN;
  if (!Number.isFinite(y) || y < 1800 || y > 2027) return 'unknown';
  if (y < 1975) return 'before 1975';
  if (y < 1995) return '1975-1994';
  if (y < 2002) return '1995-2001';
  return '2002 or later';
};
// foundationType codes, FEMA field definition: 1 slab, 2 basement, 3 crawlspace, 4-6 elevated variants.
const fdnOf = (f: string | null) => (f === '1' ? 'slab' : f === '2' ? 'basement' : f === '3' ? 'crawlspace' : f === '4' || f === '5' || f === '6' ? 'elevated' : 'unknown');
// ratedFloodZone: A* and V* are the Special Flood Hazard Area (FEMA field definition).
const zoneOf = (z: string | null) => { const c = (z ?? '').trim().toUpperCase(); return c.startsWith('V') ? 'V (coastal high hazard)' : c.startsWith('A') ? 'A (high risk)' : c ? 'outside high-risk zone' : 'unknown'; };

// County names from the Census API, read BEFORE the long pull so a failure here costs nothing.
const KEY = process.env.CENSUS_API_KEY;
if (!KEY) throw new Error('ABORT: CENSUS_API_KEY not set (run with the .env loaded)');
const census = get(`https://api.census.gov/data/2023/acs/acs5?get=NAME&for=county:*&in=state:12&key=${KEY}`) as unknown as string[][];
const countyName: Record<string, string> = Object.fromEntries(census.slice(1).map(([n, s, c]) => [s + c, n.replace(/, Florida$/, '')]));
if (Object.keys(countyName).length !== 67) throw new Error(`ABORT: expected 67 Florida counties, got ${Object.keys(countyName).length}`);

const count = get(`${API}?$top=1&$count=true&$select=id&$filter=${enc(FILTER)}`).metadata.count as number;
// No $orderby: ordering this filtered set by id makes the API time out (503 after 60s, 2026-11-27). Rows are
// de-duplicated by id and the unique count must match $count, which catches an unstable page order.
const ids = new Set<string>();
const rows: Row[] = [];
let seen = 0, dupes = 0, notSfr = 0, multi = 0, nonPositive = 0;
const nonPositiveWhy: Record<string, number> = {};
for (let skip = 0; ; skip += PAGE) {
  const page = get(`${API}?$select=${SELECT}&$filter=${enc(FILTER)}&$top=${PAGE}&$skip=${skip}`).NfipPolicies as Array<Record<string, any>>;
  for (const r of page) {
    if (ids.has(r.id)) { dupes++; continue; }
    ids.add(r.id);
    // occupancyType 1 / 11 = single-family (FEMA definition); one insured unit only.
    if (!(r.occupancyType === 1 || r.occupancyType === 11)) { notSfr++; continue; }
    if (r.policyCount !== 1) { multi++; continue; }
    const prem = Number(r.totalInsurancePremiumOfThePolicy), full = Number(r.fullRiskPremium), cost = Number(r.policyCost);
    if (!(prem > 0 && full > 0 && cost > 0)) {
      nonPositive++;
      const why = [prem > 0 ? '' : 'premium', full > 0 ? '' : 'fullRisk', cost > 0 ? '' : 'cost'].filter(Boolean).join('+');
      nonPositiveWhy[why] = (nonPositiveWhy[why] ?? 0) + 1;
      continue;
    }
    const geo = String(r.censusGeoid ?? '');
    rows.push({
      cost, prem, full,
      zip: String(r.reportedZipCode ?? '').slice(0, 5),
      county: geo.length >= 5 && geo.startsWith('12') ? geo.slice(0, 5) : '',
      era: eraOf(r.originalConstructionDate), fdn: fdnOf(r.foundationType), zone: zoneOf(r.ratedFloodZone),
      primary: r.primaryResidenceIndicator === true, cov: Number(r.totalBuildingInsuranceCoverage) || 0, mand: r.mandatoryPurchaseFlag === true, crs: r.crsClassCode == null ? 'none' : String(r.crsClassCode),
    });
  }
  seen += page.length;
  process.stdout.write(`\rNfipPolicies FL: ${seen}/${count}`);
  if (page.length < PAGE) break;
}
process.stdout.write('\n');
console.log(`served ${seen}, unique ${ids.size}, dupes ${dupes}, $count ${count}; kept ${rows.length} single-family; dropped notSfr ${notSfr}, multi-unit ${multi}, non-positive ${nonPositive}`);
if (Math.abs(ids.size - count) > count * 0.001) throw new Error(`ABORT: ${ids.size} unique policies vs $count ${count}`);


const median = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const yearsAt18 = (prem: number, full: number) => (full <= prem ? 0 : Math.ceil(Math.log(full / prem) / Math.log(1.18)));
const summarise = (g: Row[]) => {
  const below = g.filter((r) => r.full > r.prem);
  return {
    policies: g.length,
    medianPolicyCost: median(g.map((r) => r.cost)),
    medianPremium: median(g.map((r) => r.prem)),
    medianFullRisk: median(g.map((r) => r.full)),
    shareBelowFullRisk: +(100 * below.length / g.length).toFixed(1),
    medianGapBelow: median(below.map((r) => r.full - r.prem)),
    medianYearsToFullAt18: median(below.map((r) => yearsAt18(r.prem, r.full))),
    shareTenPlusYears: +(100 * below.filter((r) => yearsAt18(r.prem, r.full) >= 10).length / g.length).toFixed(1),
    shareHighRiskZone: +(100 * g.filter((r) => r.zone.startsWith('A') || r.zone.startsWith('V')).length / g.length).toFixed(1),
    shareLenderRequired: +(100 * g.filter((r) => r.mand).length / g.length).toFixed(1),
    medianBuildingCoverage: median(g.map((r) => r.cov)),
    medianFullToPremiumRatio: median(g.map((r) => Math.round((r.full / r.prem) * 1000))) ?? null, // x1000
    yearsAt18Buckets: (() => { const b: Record<string, number> = { atOrAboveFull: 0, '1-3': 0, '4-6': 0, '7-9': 0, '10+': 0 }; for (const r of g) { const y = yearsAt18(r.prem, r.full); b[y === 0 ? 'atOrAboveFull' : y <= 3 ? '1-3' : y <= 6 ? '4-6' : y <= 9 ? '7-9' : '10+']++; } return b; })(),
  };
};
const groupBy = (key: (r: Row) => string) => {
  const m = new Map<string, Row[]>();
  for (const r of rows) { const k = key(r); if (!k) continue; (m.get(k) ?? m.set(k, []).get(k)!).push(r); }
  return m;
};
const table = (m: Map<string, Row[]>) => Object.fromEntries([...m].filter(([, g]) => g.length >= MIN_N).sort((a, b) => b[1].length - a[1].length).map(([k, g]) => [k, summarise(g)]));

const byZipRaw = groupBy((r) => (/^\d{5}$/.test(r.zip) ? r.zip : ''));
const zipCounty = new Map<string, string>();
for (const [z, g] of byZipRaw) {
  const tally = new Map<string, number>();
  for (const r of g) if (r.county) tally.set(r.county, (tally.get(r.county) ?? 0) + 1);
  const top = [...tally].sort((a, b) => b[1] - a[1])[0];
  if (top) zipCounty.set(z, top[0]);
}
const byZip = table(byZipRaw);
const byCounty = Object.fromEntries(Object.entries(table(groupBy((r) => r.county))).map(([f, s]) => [f, { name: countyName[f] ?? f, ...s }]));
const out = {
  title: 'What Florida single-family homes pay for NFIP flood insurance, against FEMA’s full-risk premium',
  generated: new Date().toISOString().slice(0, 10),
  snapshot: SNAPSHOT,
  source: `${API} ($filter=${FILTER})`,
  scope: 'Policies in force on the snapshot date; occupancyType 1 or 11 (single family); policyCount 1; premium, full-risk premium and policy cost all above zero.',
  minPoliciesPerFigure: MIN_N,
  counts: { served: seen, unique: ids.size, apiCount: count, duplicatesSkipped: dupes, kept: rows.length, droppedNotSingleFamily: notSfr, droppedMultiUnit: multi, droppedNonPositive: nonPositive, nonPositiveWhy },
  florida: summarise(rows),
  byEra: table(groupBy((r) => r.era)),
  byFoundation: table(groupBy((r) => r.fdn)),
  byZone: table(groupBy((r) => r.zone)),
  byCrsClass: table(groupBy((r) => r.crs)),
  byPrimary: table(groupBy((r) => (r.primary ? 'primary residence' : 'not primary residence'))),
  byCounty,
  zipsPublished: Object.keys(byZip).length,
  zipsSuppressed: [...byZipRaw].filter(([, g]) => g.length < MIN_N).length,
  byZip: Object.fromEntries(Object.entries(byZip).map(([z, s]) => [z, { county: countyName[zipCounty.get(z) ?? ''] ?? '', ...s }])),
};
fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1));
const cols = ['zip', 'county', 'policies', 'medianPolicyCost', 'medianPremium', 'medianFullRisk', 'shareBelowFullRisk', 'medianGapBelow', 'medianYearsToFullAt18', 'shareTenPlusYears', 'shareHighRiskZone', 'shareLenderRequired', 'medianBuildingCoverage'];
const csv = [cols.join(',')].concat(Object.entries(out.byZip).map(([z, s]: [string, any]) => [z, `"${s.county}"`, ...cols.slice(2).map((c) => s[c] ?? '')].join(','))).join('\n') + '\n';
fs.writeFileSync(OUT_CSV, csv);
console.log(`Wrote ${OUT_JSON} and ${OUT_CSV}: ${out.zipsPublished} ZIPs published, ${out.zipsSuppressed} suppressed (<${MIN_N})`);
console.log('Florida:', JSON.stringify(out.florida));
