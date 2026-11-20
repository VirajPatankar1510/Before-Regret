// Brevard County, FL: year-built shares for the part of the county whose permits Brevard County itself holds.
// First-party computation for the Brevard County permit guide (check-building-permits-brevard-county-fl).
//
//   npx tsx scripts/build-brevard-permit-era-shares.ts      -> docs/data/brevard-permit-era-shares.json
//
// Why a separate split: the county's BASS search page (read 2026-11-20) says each municipality "maintain[s] their own
// records" and the county database covers "unincorporated Brevard County and the Town of Grant Valkaria". A countywide
// Census figure mixes in Palm Bay, Melbourne, Titusville and the other cities, whose permits the county does not hold.
//
// Method: ACS 5-year table B25034. Level 070 (place/remainder within county subdivision) lists every place inside the
// county; a name ending in " city", " town" or " village" is an incorporated municipality, anything else (a CDP such as
// Merritt Island or Viera East, or a CCD remainder) is unincorporated. The municipalities' counts come from level 160 and
// are subtracted from the county row (050). County-served = unincorporated + Grant-Valkaria town. Subtracting ACS
// estimates widens their margins of error, so the shares
// are estimates, rounded to one decimal, and the page calls them estimates.
//
// The record-system cut-offs come from the county's own pages (read 2026-11-20): Legacy Permit Search "building permits
// from 1990 to 2002"; BASS "permits 2003 to present". Census decade bands do not split at 2003, so 2000-2009 is
// reported as its own band ("legacy or BASS, by permit date"), never divided by guesswork. Year built is not permit year.
//
// curl rather than fetch(): Node's fetch hangs on api.census.gov in this environment (see fetch-oldest-housing-data.ts).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KEY = (process.env.CENSUS_API_KEY || '').replace(/^["']|["']$/g, '');
if (!KEY) throw new Error('ABORT: CENSUS_API_KEY is not set');
const VINTAGE = 2024; // same vintage as docs/data/oldest-housing-raw.json (ACS 2020-2024)

const get = (url: string) => {
  const body = execFileSync('curl', ['-s', '-L', '--max-time', '120', url], { maxBuffer: 64 * 1024 * 1024 }).toString();
  if (!body.trim().startsWith('[') && !body.trim().startsWith('{')) throw new Error(`ABORT: Census API did not return JSON: ${body.slice(0, 200)}`);
  return JSON.parse(body);
};

const meta = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5/groups/B25034.json`).variables as Record<string, { label: string }>;
const want: Record<string, string> = {
  total: 'Estimate!!Total:',
  b2020: 'Estimate!!Total:!!Built 2020 or later',
  b2010: 'Estimate!!Total:!!Built 2010 to 2019',
  b2000: 'Estimate!!Total:!!Built 2000 to 2009',
  b1990: 'Estimate!!Total:!!Built 1990 to 1999',
  b1980: 'Estimate!!Total:!!Built 1980 to 1989',
  b1970: 'Estimate!!Total:!!Built 1970 to 1979',
  b1960: 'Estimate!!Total:!!Built 1960 to 1969',
  b1950: 'Estimate!!Total:!!Built 1950 to 1959',
  b1940: 'Estimate!!Total:!!Built 1940 to 1949',
  b1939: 'Estimate!!Total:!!Built 1939 or earlier',
};
const varFor: Record<string, string> = {};
for (const [k, label] of Object.entries(want)) {
  const hit = Object.entries(meta).find(([v, m]) => v.endsWith('E') && m.label === label);
  if (!hit) throw new Error(`ABORT: B25034 ${VINTAGE} has no variable labelled "${label}"`);
  varFor[k] = hit[0];
}

const q = (s: string) => encodeURIComponent(s);
// ACS 5-year serves B25034 as null at level 070, so 070 is used only to LIST the places inside Brevard (names + place
// codes); the year-built counts for each incorporated municipality come from level 160 (place). Unincorporated is then
// the countywide row minus the municipalities. Assumption, checked by name on 2026-11-20: every Brevard municipality lies
// wholly inside Brevard County (the API reports CCD parts only, never a county part, for these places).
const subs = (get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME&for=${q('county subdivision:*')}&in=${q('state:12 county:009')}&key=${KEY}`) as string[][])
  .slice(1).map((r) => r[r.length - 1]);
if (subs.length < 5) throw new Error(`ABORT: only ${subs.length} county subdivisions found`);
const places = new Map<string, string>(); // place code -> place name
for (const cs of subs) {
  const part = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME`
    + `&for=${q('place/remainder (or part):*')}&in=${q(`state:12 county:009 county subdivision:${cs}`)}&key=${KEY}`) as string[][];
  // Every CCD remainder shares place code 99999, so key remainders by subdivision to keep each one in the list.
  for (const r of part.slice(1)) {
    const code = r[r.length - 1];
    places.set(code === '99999' ? `99999-${cs}` : code, r[0].split(',')[0].replace(/ \(part\)$/, '').trim());
  }
}
const incorporated = [...places].filter(([, n]) => / (city|town|village)$/.test(n));
const unincorporatedNames = [...places].filter(([, n]) => !/ (city|town|village)$/.test(n)).map(([, n]) => n);
if (incorporated.length < 10) throw new Error(`ABORT: only ${incorporated.length} municipalities found`);

const placeRows = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${Object.values(varFor).join(',')}&for=${q('place:' + incorporated.map(([c]) => c).join(','))}&in=${q('state:12')}&key=${KEY}`) as string[][];
const head = placeRows[0];
const val = (r: string[], k: string) => { const v = Number(r[head.indexOf(varFor[k])]); if (!Number.isFinite(v)) throw new Error(`ABORT: ${r[0]} ${k} not a number`); return v; };
const countyRow = (get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${Object.values(varFor).join(',')}&for=${q('county:009')}&in=${q('state:12')}&key=${KEY}`) as string[][]);
const ch = countyRow[0];

type Bands = Record<keyof typeof want, number>;
const zero = (): Bands => Object.fromEntries(Object.keys(want).map((k) => [k, 0])) as Bands;
const groups = { cities: zero(), grantValkaria: zero(), unincorporated: zero() };
const cityNames = new Set<string>();
for (const r of placeRows.slice(1)) {
  const name = r[0].split(',')[0].trim();
  const isGV = /^Grant-Valkaria town$/.test(name);
  if (!isGV) cityNames.add(name);
  const g = isGV ? groups.grantValkaria : groups.cities;
  for (const k of Object.keys(want)) g[k as keyof Bands] += val(r, k);
}
if (!groups.grantValkaria.total) throw new Error('ABORT: Grant-Valkaria town not found among the places');
for (const k of Object.keys(want)) {
  const c = Number(countyRow[1][ch.indexOf(varFor[k])]);
  groups.unincorporated[k as keyof Bands] = c - groups.cities[k as keyof Bands] - groups.grantValkaria[k as keyof Bands];
  if (groups.unincorporated[k as keyof Bands] < 0) throw new Error(`ABORT: negative unincorporated ${k}`);
}

for (const [name, g] of Object.entries(groups)) {
  const decades = g.b2020 + g.b2010 + g.b2000 + g.b1990 + g.b1980 + g.b1970 + g.b1960 + g.b1950 + g.b1940 + g.b1939;
  if (decades !== g.total) throw new Error(`ABORT: ${name} decade bands (${decades}) do not sum to total (${g.total})`);
}

// Cross-check against the countywide row already in docs/data/florida-permit-era-shares.json.
const county = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'florida-permit-era-shares.json'), 'utf8')).counties.Brevard;
const sumAll = groups.cities.total + groups.grantValkaria.total + groups.unincorporated.total;
if (sumAll !== county.housingUnits) throw new Error(`ABORT: parts sum to ${sumAll}, countywide file says ${county.housingUnits}`);

const served = zero();
for (const k of Object.keys(want)) served[k as keyof Bands] = groups.unincorporated[k as keyof Bands] + groups.grantValkaria[k as keyof Bands];
const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;
const shares = (g: Bands) => ({
  housingUnits: g.total,
  builtBefore1990Pct: pct(g.b1939 + g.b1940 + g.b1950 + g.b1960 + g.b1970 + g.b1980, g.total),
  built1990sPct: pct(g.b1990, g.total),
  built2000sPct: pct(g.b2000, g.total),
  built2010OrLaterPct: pct(g.b2010 + g.b2020, g.total),
});

const out = {
  generatedAt: new Date().toISOString(),
  source: `U.S. Census Bureau, American Community Survey ${VINTAGE - 4}-${VINTAGE} 5-year estimates, table B25034 (Year Structure Built): county (050) minus incorporated places (160); place list from level 070`,
  note: 'Estimates. County-served = unincorporated Brevard (CDPs + remainder) + Grant-Valkaria town. Year built is not permit year.',
  countyServed: shares(served),
  cities: shares(groups.cities),
  countywide: shares(Object.fromEntries(Object.keys(want).map((k) => [k, served[k as keyof Bands] + groups.cities[k as keyof Bands]])) as Bands),
  countyServedShareOfAllUnitsPct: pct(served.total, sumAll),
  incorporatedPlacesExcluded: [...cityNames].sort(),
  unincorporatedPlaces: [...unincorporatedNames].sort(),
};
const dest = path.join(process.cwd(), 'docs', 'data', 'brevard-permit-era-shares.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
console.log(`wrote ${path.relative(process.cwd(), dest)}`);
