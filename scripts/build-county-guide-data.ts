// P4 option A of docs/plans/growth-execution-plan-2026-10.md (owner chose A, 2026-10-21): a county data section on
// the 21 existing county permit guides, built only from datasets we already published as studies. No new URLs.
// Rules from docs/research/pseo-good-vs-bad-2026-10.md: no generated prose, every figure carries its source and
// vintage, and a module is shown only where we know what a missing value MEANS.
//
//   npx tsx scripts/build-county-guide-data.ts            # prints the table + every join check, writes nothing
//   WRITE=true npx tsx scripts/build-county-guide-data.ts # writes src/data/countyGuideData.json
//
// Join keys. Housing age and permits are keyed by FIPS. The flood, take-up and dams files are keyed by county NAME
// + state (their builders aren't in the repo), so each of those joins is checked here: a county that doesn't match
// is reported as either a KNOWN absence (meaning documented in the study's Method section) or a FAILURE, which
// stops the script. Meanings, read 2026-10-21 from each study page in docs/:
//   flood-outside-zone  listed only with >= 25 classifiable NFIP claims (outside-the-zone.html, "County thresholds")
//   flood-takeup        2,304 counties; FEMA's file has no row at all for e.g. the NYC boroughs, Tarrant, Philadelphia,
//                       and the study gives no reason -> absent = unknown -> module hidden (null)
//   dams-high-hazard    lists only counties with >= 1 high-hazard dam (min 'high' in file = 1) -> absent = none recorded
//   permit-pulse        only the 567 counties passing the study's gates -> absent = not reported
// Premiums (county-premiums.json) are deliberately left out: ACS 2019-2023, which the study itself says predates the
// 2023-25 premium surge. A stale insurance figure on a buyer's page would mislead.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const D = (f: string) => path.join(ROOT, 'docs', 'data', f);

// Guide slug -> county FIPS. FIPS from src/data/coveredCounties.ts (verified there against Census
// national_county2020.txt). NYC boroughs are their counties: Manhattan = New York County, Brooklyn = Kings.
const GUIDES: Array<{ slug: string; fips: string }> = [
  { slug: 'check-building-permits-tarrant-county-tx', fips: '48439' },
  { slug: 'check-building-permits-dallas-county-tx', fips: '48113' },
  { slug: 'check-building-permits-los-angeles-county-ca', fips: '06037' },
  { slug: 'check-building-permits-orange-county-ca', fips: '06059' },
  { slug: 'check-building-permits-santa-clara-county-ca', fips: '06085' },
  { slug: 'check-building-permits-riverside-county-ca', fips: '06065' },
  { slug: 'check-building-permits-san-bernardino-county-ca', fips: '06071' },
  { slug: 'check-building-permits-sacramento-county-ca', fips: '06067' },
  { slug: 'check-building-permits-san-diego-county-ca', fips: '06073' },
  { slug: 'check-building-permits-broward-county-fl', fips: '12011' },
  { slug: 'check-building-permits-hillsborough-county-fl', fips: '12057' },
  { slug: 'check-building-permits-miami-dade-county-fl', fips: '12086' },
  { slug: 'check-building-permits-middlesex-county-ma', fips: '25017' },
  { slug: 'check-building-permits-bronx-ny', fips: '36005' },
  { slug: 'check-building-permits-queens-ny', fips: '36081' },
  { slug: 'check-building-permits-brooklyn-ny', fips: '36047' },
  { slug: 'check-building-permits-manhattan-ny', fips: '36061' },
  { slug: 'check-building-permits-philadelphia-county-pa', fips: '42101' },
  { slug: 'check-building-permits-cook-county-il', fips: '17031' },
  { slug: 'check-building-permits-clark-county-nv', fips: '32003' },
  { slug: 'check-building-permits-maricopa-county-az', fips: '04013' },
];

const STATE_ABBR: Record<string, string> = {
  Arizona: 'AZ', California: 'CA', Florida: 'FL', Illinois: 'IL', Massachusetts: 'MA', Nevada: 'NV', 'New York': 'NY',
  Pennsylvania: 'PA', Texas: 'TX',
};
const norm = (n: string) => n.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(county|parish|borough)\b/g, '').replace(/[^a-z]/g, '');

function parseCsv(file: string): Array<Record<string, string>> {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const split = (l: string) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')).slice(0, -1);
  const head = split(lines[0]);
  return lines.slice(1).map((l) => { const v = split(l); return Object.fromEntries(head.map((h, i) => [h, v[i]])); });
}

const housing = parseCsv(D('oldest-housing-by-county.csv'));
const housingByFips = new Map(housing.map((r) => [r.geoid, r]));
const medians = housing.map((r) => Number(r.median_year_built)).filter(Number.isFinite).sort((a, b) => a - b);
const oldestFigures = JSON.parse(fs.readFileSync(D('oldest-housing-figures.json'), 'utf8'));
const permit = JSON.parse(fs.readFileSync(D('permit-pulse-figures.json'), 'utf8'));
const permitByFips = new Map((permit.counties as any[]).map((c) => [c.fips, c]));
const flood = JSON.parse(fs.readFileSync(D('flood-outside-zone.json'), 'utf8'));
const takeup = JSON.parse(fs.readFileSync(D('flood-takeup.json'), 'utf8'));
const dams = JSON.parse(fs.readFileSync(D('dams-high-hazard.json'), 'utf8'));

// Name-keyed row lookup with a loud check: exactly one row may match the county name + state.
function byName(rows: any[][], county: string, st: string, label: string, problems: string[]): any[] | null {
  const hits = rows.filter((r) => r[1] === st && norm(String(r[0])) === norm(county));
  if (hits.length > 1) problems.push(`${label}: ${hits.length} rows match ${county}, ${st}`);
  // Guard against a silent miss caused by naming (e.g. "New York" vs "Manhattan"): any row in the state whose name
  // contains the county's first word is surfaced for a human to look at.
  if (hits.length === 0) {
    const near = rows.filter((r) => r[1] === st && norm(String(r[0])).includes(norm(county).slice(0, 5)));
    if (near.length) problems.push(`${label}: no exact row for ${county}, ${st}, but near names exist: ${near.map((r) => r[0]).join(' / ')}`);
  }
  return hits[0] ?? null;
}

const problems: string[] = [];
const out: Record<string, any> = {};
for (const g of GUIDES) {
  const h = housingByFips.get(g.fips);
  if (!h) { problems.push(`${g.slug}: FIPS ${g.fips} not in oldest-housing-by-county.csv`); continue; }
  const countyName = h.county.replace(/ County$/, '');
  const st = STATE_ABBR[h.state];
  if (!st) { problems.push(`${g.slug}: no state abbreviation for ${h.state}`); continue; }
  const units = Number(h.housing_units);
  const decades = ([
    ['Before 1940', 'built_1939_or_earlier'], ['1940s', 'built_1940to_1949'], ['1950s', 'built_1950to_1959'],
    ['1960s', 'built_1960to_1969'], ['1970s', 'built_1970to_1979'], ['1980s', 'built_1980to_1989'],
    ['1990s', 'built_1990to_1999'], ['2000s', 'built_2000to_2009'], ['2010s', 'built_2010to_2019'], ['2020 or later', 'built_2020or_later'],
  ] as const).map(([label, col]) => ({ label, homes: Number(h[col]), share: Math.round((Number(h[col]) / units) * 1000) / 10 }));
  const decadeSum = decades.reduce((s, d) => s + d.homes, 0);
  if (decadeSum !== units) problems.push(`${g.slug}: decade buckets sum to ${decadeSum}, housing_units is ${units}`);
  const median = Number(h.median_year_built);
  const olderThanPct = Math.round((medians.filter((m) => m > median).length / medians.length) * 100);

  const p = permitByFips.get(g.fips);
  const f = byName(flood.counties, countyName, st, `${g.slug} flood-outside`, problems);
  const t = byName(takeup.counties, countyName, st, `${g.slug} takeup`, problems);
  const dm = byName(dams.counties, countyName, st, `${g.slug} dams`, problems);

  out[g.slug] = {
    fips: g.fips, county: h.county, state: h.state, stateAbbrev: st,
    housing: {
      source: 'U.S. Census Bureau, American Community Survey 5-year estimates, table B25034', vintage: oldestFigures.vintage,
      study: '/research/oldest-housing/', housingUnits: units, medianYearBuilt: median,
      medianInOpenBracket: h.median_in_1939_or_earlier_bracket === 'yes',
      sharePre1940: Math.round(Number(h.share_built_before_1940) * 1000) / 10,
      sharePre1960: Math.round(Number(h.share_built_before_1960) * 1000) / 10,
      // Share of US counties whose median home is NEWER than this county's (ties excluded).
      olderThanPctOfCounties: olderThanPct,
      national: { sharePre1940: Math.round(oldestFigures.national.shareBefore1940 * 1000) / 10, sharePre1960: Math.round(oldestFigures.national.shareBefore1960 * 1000) / 10 },
      decades,
    },
    permits: p ? {
      source: 'U.S. Census Bureau, Building Permits Survey (county, year to date)', study: '/research/permit-pulse/',
      // A percentage on a tiny base misleads (Bronx single-family 2 -> 7 is "+250%"), so the single-family change
      // is kept only when the prior-year base is at least 50 units; counts are always shown alongside.
      period: permit.period, unitsChangePct: p.unitsChangePct,
      singleFamilyChangePct: p.sfPrior >= 50 ? p.sfChangePct : null, singleFamilyCurrent: p.sfCurrent, singleFamilyPrior: p.sfPrior,
      multifamilyCurrent: p.mfCurrent, multifamilyPrior: p.mfPrior,
      unitsCurrent: p.unitsCurrent, unitsPrior: p.unitsPrior,
      national: { unitsChangePct: permit.national.all.changePct, singleFamilyChangePct: permit.national.singleFamily.changePct },
    } : { absent: 'This county did not pass the Permit Pulse data gates (minimum units and reporting share), so it is not reported.' },
    floodOutsideZone: f ? {
      source: 'FEMA OpenFEMA, FIMA NFIP Redacted Claims', claimsThrough: flood.claimsThrough, study: '/research/outside-the-zone/',
      classifiableClaims: f[2], shareOutsideZone: f[3], paidOutside: f[4], national: { shareOutsideZone: flood.national.shareCount },
    } : { absent: 'Fewer than 25 classifiable NFIP claims, the study\'s floor for reporting a county.' },
    floodTakeup: t ? {
      source: 'FEMA OpenFEMA, NFIP Residential Penetration Rates', asOf: '2026-08-03', study: '/research/risk-without-cover/',
      takeupPct: t[2], policies: t[3], floodZoneHomes: t[4], national: { takeupPct: takeup.natAgg },
    } : null, // Absent rows have no documented reason (FEMA's file simply has no row), so the module is hidden, not explained.
    dams: dm ? {
      source: 'U.S. Army Corps of Engineers, National Inventory of Dams', updated: dams.nidUpdated, study: '/research/high-hazard-dams/',
      highHazard: dm[2], highHazardPoorOrUnsatisfactory: dm[3], highHazardNoEmergencyPlan: dm[4],
    } : { highHazard: 0, note: 'The inventory records no high-hazard dam in this county. A dam in a neighbouring county can still affect it.', updated: dams.nidUpdated, study: '/research/high-hazard-dams/' },
  };
}

// Readable check table.
console.log('slug'.padEnd(48), 'median', 'pre40%', 'olderThan%', 'permitsΔ%', 'floodOut%', 'takeup%', 'dams');
for (const [slug, c] of Object.entries(out)) {
  console.log(slug.replace('check-building-permits-', '').padEnd(48), String(c.housing.medianYearBuilt).padEnd(6), String(c.housing.sharePre1940).padEnd(6),
    String(c.housing.olderThanPctOfCounties).padEnd(10), String(c.permits.unitsChangePct ?? '-').padEnd(9),
    String(c.floodOutsideZone.shareOutsideZone ?? '-').padEnd(9), String(c.floodTakeup?.takeupPct ?? '-').padEnd(7), c.dams.highHazard);
}
if (problems.length) {
  console.log(`\n${problems.length} join problem(s):\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(out).length} guides joined; no ambiguous or near-miss names.`);
if (process.env.WRITE === 'true') {
  const file = path.join(ROOT, 'src', 'data', 'countyGuideData.json');
  fs.writeFileSync(file, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), script: 'scripts/build-county-guide-data.ts', counties: out }) + '\n');
  console.log(`wrote ${path.relative(ROOT, file)} (${fs.statSync(file).size} bytes)`);
}
