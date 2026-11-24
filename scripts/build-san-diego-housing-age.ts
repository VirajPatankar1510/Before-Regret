// City of San Diego, CA: year-built shares for homes inside city limits, whose permits the Development Services Department (DSD) holds.
// First-party computation for the San Diego permit guide (city-of-san-diego-permit-search).
//
//   npx tsx scripts/build-san-diego-housing-age.ts      -> docs/data/san-diego-housing-age.json
//
// Method: ACS 5-year 2020-2024, table B25034 (year structure built) and B25035 (median year built) for San Diego
// city, California (place 06:66000), plus San Diego County (06:073) for comparison. Year built is not permit year.
// Bins: _005 = 1990-1999, _006 = 1980-1989 (labels printed at run time to confirm).
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
const [h, cityRow] = get(`${base}&for=place:66000&in=state:06`);
const [, countyRow] = get(`${base}&for=county:073&in=state:06`);
const row = (r: string[]) => Object.fromEntries(h.map((k, i) => [k, r[i]]));
const n = (x: string) => Number(x);
const shares = (c: Record<string, string>) => {
  const total = n(c.B25034_001E);
  const p = (x: number) => Math.round((x / total) * 1000) / 10;
  const pre1940 = n(c.B25034_011E), y1940s = n(c.B25034_010E), y1950s = n(c.B25034_009E), y1960s = n(c.B25034_008E), y1970s = n(c.B25034_007E);
  return {
    name: c.NAME,
    housingUnits: total,
    medianYearBuilt: n(c.B25035_001E),
    builtBefore1940Pct: p(pre1940),
    builtBefore1950Pct: p(pre1940 + y1940s),
    builtBefore1960Pct: p(pre1940 + y1940s + y1950s),
    builtBefore1980Pct: p(pre1940 + y1940s + y1950s + y1960s + y1970s),
    // DSD keeps no records before 1955 and has online permit data only from 2003; ACS bins are by decade, so these are lower bounds.
    builtBefore2000Pct: p(pre1940 + y1940s + y1950s + y1960s + y1970s + n(c.B25034_006E) + n(c.B25034_005E)),
    builtBefore2000Units: pre1940 + y1940s + y1950s + y1960s + y1970s + n(c.B25034_006E) + n(c.B25034_005E),
    builtBefore1950Units: pre1940 + y1940s,
  };
};
const city = row(cityRow), county = row(countyRow);
const out = {
  source: `ACS ${VINTAGE - 4}-${VINTAGE} 5-year, tables B25034 and B25035, api.census.gov, built by scripts/build-san-diego-housing-age.ts`,
  builtOn: new Date().toISOString().slice(0, 10),
  city: shares(city),
  county: shares(county),
  raw: { city, county },
};
const file = path.join(process.cwd(), 'docs', 'data', 'san-diego-housing-age.json');
fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ ...out, raw: undefined }, null, 2));
