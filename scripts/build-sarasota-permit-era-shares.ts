// Sarasota County, FL: how many homes fall under the county's own Building Division, and when they were built.
// First-party computation for the Sarasota County permit guide (check-building-permits-sarasota-county-fl).
//
//   npx tsx scripts/build-sarasota-permit-era-shares.ts      -> docs/data/sarasota-permit-era-shares.json
//
// Why a split: the City of Sarasota, Venice and North Port run their own building departments and permit searches
// (each city's own page, read 2026-11-28), so a countywide Census figure mixes in homes whose permits the county does
// not hold. The Town of Longboat Key's site was behind a Cloudflare bot check, so its office was not confirmed: the
// page uses outsideThreeCities and names Longboat Key's part separately.
//
// Method: ACS 5-year table B25034 (Year Structure Built). The countywide row (050) minus the four municipalities, each
// taken at geography 155 (place / county part) so only the part inside Sarasota County is subtracted. That matters for
// Longboat Key, which also lies partly in Manatee County. Subtracting ACS estimates widens their margins of error, so the
// shares are estimates, rounded to one decimal. Year built is not permit year.
//
// Record-system cut-off from the county's own Accela FAQ (read 2026-11-28): permits closed before August 18, 2023 are in
// the older AMANDA system. Census bands do not split at 2023; "built 2020 or later" is reported on its own.
//
// curl rather than fetch(): Node's fetch hangs on api.census.gov in this environment (see fetch-oldest-housing-data.ts).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KEY = (process.env.CENSUS_API_KEY || '').replace(/^["']|["']$/g, '');
if (!KEY) throw new Error('ABORT: CENSUS_API_KEY is not set');
const VINTAGE = 2024; // same vintage as docs/data/oldest-housing-raw.json (ACS 2020-2024)
const COUNTY = '115';
const MUNIS: Record<string, string> = { '64175': 'Sarasota city', '73900': 'Venice city', '49675': 'North Port city', '41150': 'Longboat Key town' };

const get = (url: string) => {
  const body = execFileSync('curl', ['-s', '-L', '--max-time', '120', url], { maxBuffer: 64 * 1024 * 1024 }).toString();
  if (!/^[[{]/.test(body.trim())) throw new Error(`ABORT: Census API did not return JSON: ${body.slice(0, 200)}`);
  return JSON.parse(body);
};
const meta = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5/groups/B25034.json`).variables as Record<string, { label: string }>;
const want: Record<string, string> = {
  total: 'Estimate!!Total:', b2020: 'Estimate!!Total:!!Built 2020 or later', b2010: 'Estimate!!Total:!!Built 2010 to 2019',
  b2000: 'Estimate!!Total:!!Built 2000 to 2009', b1990: 'Estimate!!Total:!!Built 1990 to 1999', b1980: 'Estimate!!Total:!!Built 1980 to 1989',
  b1970: 'Estimate!!Total:!!Built 1970 to 1979', b1960: 'Estimate!!Total:!!Built 1960 to 1969', b1950: 'Estimate!!Total:!!Built 1950 to 1959',
  b1940: 'Estimate!!Total:!!Built 1940 to 1949', b1939: 'Estimate!!Total:!!Built 1939 or earlier',
};
const varFor: Record<string, string> = {};
for (const [k, label] of Object.entries(want)) {
  const hit = Object.entries(meta).find(([v, m]) => v.endsWith('E') && m.label === label);
  if (!hit) throw new Error(`ABORT: B25034 ${VINTAGE} has no variable labelled "${label}"`);
  varFor[k] = hit[0];
}
type Bands = Record<string, number>;
const q = encodeURIComponent;
const VARS = Object.values(varFor).join(',');
const toBands = (head: string[], row: string[]): Bands => Object.fromEntries(Object.entries(varFor).map(([k, v]) => {
  const n = Number(row[head.indexOf(v)]); if (!Number.isFinite(n)) throw new Error(`ABORT: ${row[0]} ${k} not a number`); return [k, n];
}));

const cRows = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${VARS}&for=${q('county:' + COUNTY)}&in=${q('state:12')}&key=${KEY}`) as string[][];
const county = toBands(cRows[0], cRows[1]);
const munis: Record<string, Bands> = {};
for (const [code, name] of Object.entries(MUNIS)) {
  const rows = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${VARS}&for=${q('county (or part):' + COUNTY)}&in=${q('state:12 place:' + code)}&key=${KEY}`) as string[][];
  if (rows.length !== 2 || !rows[1][0].startsWith(`Sarasota County (part), ${name}`)) throw new Error(`ABORT: unexpected 155 row for ${name}: ${JSON.stringify(rows[1]).slice(0, 120)}`);
  munis[name] = toBands(rows[0], rows[1]);
}
const served: Bands = {};
for (const k of Object.keys(want)) {
  served[k] = county[k] - Object.values(munis).reduce((a, m) => a + m[k], 0);
  if (served[k] < 0) throw new Error(`ABORT: negative county-served ${k}`);
}
for (const [n, g] of Object.entries({ county, served, ...munis })) {
  const s = ['b2020', 'b2010', 'b2000', 'b1990', 'b1980', 'b1970', 'b1960', 'b1950', 'b1940', 'b1939'].reduce((a, k) => a + g[k], 0);
  if (s !== g.total) throw new Error(`ABORT: ${n} bands ${s} != total ${g.total}`);
}
const prior = JSON.parse(fs.readFileSync('docs/data/florida-permit-era-shares.json', 'utf8')).counties.Sarasota;
if (prior.housingUnits !== county.total) throw new Error(`ABORT: county total ${county.total} != florida-permit-era-shares ${prior.housingUnits}`);

// Longboat Key's own site was behind a Cloudflare bot check on 2026-11-28, so where its permits are kept was not
// confirmed. outsideThreeCities = county minus Sarasota, Venice and North Port only (their own permit pages were read).
const outside3: Bands = {};
for (const k of Object.keys(want)) outside3[k] = served[k] + munis['Longboat Key town'][k];
const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;
const shares = (g: Bands) => ({
  housingUnits: g.total,
  builtBefore1990Pct: pct(g.b1939 + g.b1940 + g.b1950 + g.b1960 + g.b1970 + g.b1980, g.total),
  built1990to2019Pct: pct(g.b1990 + g.b2000 + g.b2010, g.total),
  built2020OrLaterPct: pct(g.b2020, g.total),
});
const out = {
  generatedAt: new Date().toISOString(),
  source: `U.S. Census Bureau, American Community Survey ${VINTAGE - 4}-${VINTAGE} 5-year estimates, table B25034: county (050) minus each municipality's Sarasota County part (155)`,
  note: 'Estimates. County-served = Sarasota County outside Sarasota, Venice, North Port and Longboat Key (Sarasota County part). Year built is not permit year.',
  countyServed: shares(served),
  countyServedShareOfAllUnitsPct: pct(served.total, county.total),
  outsideThreeCities: { ...shares(outside3), shareOfCountyPct: pct(outside3.total, county.total) },
  countywide: shares(county),
  municipalities: Object.fromEntries(Object.entries(munis).map(([n, g]) => [n, { housingUnits: g.total, shareOfCountyPct: pct(g.total, county.total) }])),
};
fs.writeFileSync(path.join('docs', 'data', 'sarasota-permit-era-shares.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
