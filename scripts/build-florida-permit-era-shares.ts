// Share of each Florida pilot county's housing units by the record system that would hold the permit that BUILT them.
// First-party computation for the Florida permit cluster (docs/plans/florida-permit-cluster-2026-11.md).
//
//   npx tsx scripts/build-florida-permit-era-shares.ts      -> docs/data/florida-permit-era-shares.json
//
// Input: docs/data/oldest-housing-by-county.csv (Census ACS 5-year table B25034, vintage in oldest-housing-raw.json).
// Census reports year built in decade bands, so the era cut-offs are only as sharp as the bands:
//   - Collier's systems (county page read 2026-11-17): Property Appraiser before 1989, CDPlus 1989-2011, CityView 2011-present.
//     "built before 2010" is the clean statement: those houses' construction permits predate CityView's 2011 start.
//     The 1980s band straddles the 1989 switch and is reported on its own, never split by guesswork.
//   - Martin's Accela portal (searched 2026-11-20): 24 records dated before 1990, 81 dated 1990, and the 100+ display cap
//     reached for 1991 and every later year checked. "Built before 1990" lines up exactly with the Census band edge.
// Year built is when the structure was built, not when its permit was issued; a house finished in early 2011 may carry a
// 2010 permit. The page says "built", never "permitted".
import fs from 'node:fs';
import path from 'node:path';

const COUNTIES: Record<string, string> = { '12021': 'Collier', '12115': 'Sarasota', '12081': 'Manatee', '12009': 'Brevard', '12085': 'Martin' };
const csvPath = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-by-county.csv');
const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'oldest-housing-raw.json'), 'utf8'));

const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
const head = lines[0].split(',');
const col = (row: string[], k: string) => Number(row[head.indexOf(k)]);
const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;

const out: Record<string, unknown> = {
  generatedAt: new Date().toISOString(),
  source: raw.source,
  vintage: raw.vintage,
  input: 'docs/data/oldest-housing-by-county.csv',
  note: 'Shares of all housing units by decade built (Census bands). Year built is not permit year.',
  counties: {} as Record<string, unknown>,
};

for (const line of lines.slice(1)) {
  // county names are quoted and contain no commas in this file; split is safe (checked: 4 pilot rows parse to head.length)
  const row = line.split(',');
  const fips = row[0];
  if (!COUNTIES[fips]) continue;
  if (row.length !== head.length) throw new Error(`row for ${fips} has ${row.length} fields, expected ${head.length}`);
  const units = col(row, 'housing_units');
  const pre1980 = ['built_1939_or_earlier', 'built_1940to_1949', 'built_1950to_1959', 'built_1960to_1969', 'built_1970to_1979']
    .reduce((s, k) => s + col(row, k), 0);
  const b1980s = col(row, 'built_1980to_1989');
  const b1990to2009 = col(row, 'built_1990to_1999') + col(row, 'built_2000to_2009');
  const b2010on = col(row, 'built_2010to_2019') + col(row, 'built_2020or_later');
  if (pre1980 + b1980s + b1990to2009 + b2010on !== units) throw new Error(`${fips}: bands do not sum to housing_units`);
  (out.counties as Record<string, unknown>)[COUNTIES[fips]] = {
    fips, housingUnits: units, medianYearBuilt: col(row, 'median_year_built'),
    builtBefore1980Pct: pct(pre1980, units),
    built1980sPct: pct(b1980s, units),
    builtBefore1990Pct: pct(pre1980 + b1980s, units),
    built1990to2009Pct: pct(b1990to2009, units),
    built2010OrLaterPct: pct(b2010on, units),
    builtBefore2010Pct: pct(units - b2010on, units),
  };
}

const dest = path.join(process.cwd(), 'docs', 'data', 'florida-permit-era-shares.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.counties, null, 2));
console.log(`wrote ${path.relative(process.cwd(), dest)}`);
