// Florida: how many homes are old enough for Citizens Property Insurance Corporation's 4-point rule
// ("properties more than 20 years old", citizensfla.com/inspections, read 2026-11-26).
// First-party computation for the 4-point guide (4-point-inspection-florida).
//
//   npx tsx scripts/build-florida-4-point-housing-age.ts      -> docs/data/florida-4-point-housing-age.json
//
// Method: ACS 5-year 2020-2024, table B25034 (year structure built) and B25035 (median year built) for
// Florida (state 12). ACS groups the 2000s into one 2000-2009 bin, and a home built in 2005 turns 21 in
// 2026, so the share "more than 20 years old" can't be read off exactly. We report a floor (built 1999
// or earlier: certainly over 20) and a ceiling (built 2009 or earlier) and say so on the page.
// Year built is self-reported on the survey and counts housing units, not insurable buildings.
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
const [h, r] = get(`https://api.census.gov/data/${VINTAGE}/acs/acs5?get=NAME,${V.join(',')}&key=${KEY}&for=state:12`);
const c = Object.fromEntries(h.map((k, i) => [k, r[i]]));
const n = (k: string) => Number(c[k]);
const total = n('B25034_001E');
const pct = (x: number) => Math.round((x / total) * 1000) / 10;
// _002 2020 or later, _003 2010-2019, _004 2000-2009, _005 1990-1999 ... _011 1939 or earlier
const builtBy1999 = ['B25034_005E', 'B25034_006E', 'B25034_007E', 'B25034_008E', 'B25034_009E', 'B25034_010E', 'B25034_011E'].reduce((s, k) => s + n(k), 0);
const built2000s = n('B25034_004E');
const out = {
  source: `ACS ${VINTAGE - 4}-${VINTAGE} 5-year, tables B25034 and B25035, api.census.gov, built by scripts/build-florida-4-point-housing-age.ts`,
  builtOn: new Date().toISOString().slice(0, 10),
  name: c.NAME,
  housingUnits: total,
  medianYearBuilt: n('B25035_001E'),
  builtBy1999: builtBy1999,
  builtBy1999Pct: pct(builtBy1999),
  built2000to2009: built2000s,
  builtBy2009Pct: pct(builtBy1999 + built2000s),
  raw: c,
};
const file = path.join(process.cwd(), 'docs', 'data', 'florida-4-point-housing-age.json');
fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ ...out, raw: undefined }, null, 2));
