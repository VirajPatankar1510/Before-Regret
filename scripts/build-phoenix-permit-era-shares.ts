// City of Phoenix, AZ: year-built shares for homes inside the city, whose permits the City of Phoenix holds.
// First-party computation for the Phoenix permit guide (city-of-phoenix-permit-search).
//
//   npx tsx scripts/build-phoenix-permit-era-shares.ts      -> docs/data/phoenix-permit-era-shares.json
//
// Method: ACS 5-year 2020-2024, table B25034 (year structure built) and B25035 (median year built) for Phoenix city,
// Arizona (place 04:55000), plus Maricopa County (04:013) for the city's share of the county's housing units.
// The two record systems come from the city's own pages (read 2026-11-23): SHAPE PHX "limited to Shape PHX records
// entered as of June 6, 2022"; older records in PDD Online. Census bands do not split at 2022, so no share is assigned
// to a system; the page reports decade bands only. Year built is not permit year.
//
// curl rather than fetch(): Node's fetch hangs on api.census.gov in this environment (see fetch-oldest-housing-data.ts).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KEY = (process.env.CENSUS_API_KEY || '').replace(/^["']|["']$/g, '');
if (!KEY) throw new Error('ABORT: CENSUS_API_KEY is not set');
const VINTAGE = 2024;
const get = (url: string) => {
  const body = execFileSync('curl', ['-s', '-L', '--max-time', '120', url], { maxBuffer: 16 * 1024 * 1024 }).toString();
  if (!body.trim().startsWith('[')) throw new Error(`ABORT: Census API did not return JSON: ${body.slice(0, 200)}`);
  return JSON.parse(body) as string[][];
};
const V = ['B25034_001E', 'B25034_002E', 'B25034_003E', 'B25034_004E', 'B25034_005E', 'B25034_006E', 'B25034_007E', 'B25034_008E', 'B25034_009E', 'B25034_010E', 'B25034_011E', 'B25035_001E'];
const meta = JSON.parse(execFileSync('curl', ['-s', '-L', '--max-time', '120', `https://api.census.gov/data/${VINTAGE}/acs/acs5/variables.json`], { maxBuffer: 64 * 1024 * 1024 }).toString()).variables;
for (const v of V) console.log(`  ${v}  ${meta[v]?.label}`);
const base = `https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${V.join(',')}&key=${KEY}`;
const [h1, city] = get(`${base}&for=place:55000&in=state:04`);
const [, county] = get(`${base}&for=county:013&in=state:04`);
const row = (r: string[]) => Object.fromEntries(h1.map((k, i) => [k, r[i]]));
const c = row(city), k = row(county);
const n = (x: string) => Number(x);
const total = n(c.B25034_001E);
const pct = (x: number) => Math.round((x / total) * 1000) / 10;
const b2020 = n(c.B25034_002E), b2010 = n(c.B25034_003E), b2000 = n(c.B25034_004E), b1990 = n(c.B25034_005E), b1980 = n(c.B25034_006E);
const before1980 = ['B25034_007E', 'B25034_008E', 'B25034_009E', 'B25034_010E', 'B25034_011E'].reduce((s, v) => s + n(c[v]), 0);
const out = {
  source: `ACS ${VINTAGE - 4}-${VINTAGE} 5-year, tables B25034 and B25035, api.census.gov, built by scripts/build-phoenix-permit-era-shares.ts`,
  builtOn: new Date().toISOString().slice(0, 10),
  place: c.NAME,
  county: k.NAME,
  cityHousingUnits: total,
  countyHousingUnits: n(k.B25034_001E),
  cityShareOfCountyUnits: Math.round((total / n(k.B25034_001E)) * 1000) / 10,
  medianYearBuilt: n(c.B25035_001E),
  builtBefore1980Pct: pct(before1980),
  built1980sPct: pct(b1980),
  built1990sPct: pct(b1990),
  built2000sPct: pct(b2000),
  built2010sPct: pct(b2010),
  built2020OrLaterPct: pct(b2020),
  builtBefore2000Pct: pct(before1980 + b1980 + b1990),
  raw: c,
};
const file = path.join(process.cwd(), 'docs', 'data', 'phoenix-permit-era-shares.json');
fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ ...out, raw: undefined }, null, 2));
