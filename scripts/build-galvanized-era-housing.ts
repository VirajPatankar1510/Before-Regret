// Galvanized-era housing: how many US housing units were built through 1969, the last year our report engine's
// galvanized_supply rule covers (src/engine/inspectionPriorities.ts). Reads our committed Census ACS 2020-2024 5-year
// table B25034 county file (docs/data/oldest-housing-by-county.csv, built by scripts/fetch-oldest-housing-data.ts)
// and writes docs/data/galvanized-era-housing.json. No network.
//
//   npx tsx scripts/build-galvanized-era-housing.ts
//
// LIMITS (go on the page): housing units include apartments and mobile homes, not only single-family houses; a unit
// built before 1970 may have been repiped long ago. This is the size of the era, not a count of galvanized pipe.
import fs from 'node:fs';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const rule = PRIORITY_RULES.find((r: any) => r.id === 'galvanized_supply')!;
if (rule.maxYear !== 1969) throw new Error(`ABORT: engine galvanized_supply maxYear is ${rule.maxYear}, bins below assume 1969`);
const PRE = ['built_1939_or_earlier', 'built_1940to_1949', 'built_1950to_1959', 'built_1960to_1969'];
const MIN_UNITS = 10_000; // same floor as the Before 1940 study's share rankings

const [head, ...lines] = fs.readFileSync('docs/data/oldest-housing-by-county.csv', 'utf8').trim().split('\n');
const cols = head.split(',');
const rows = lines.map((l) => { const v = l.split(','); return Object.fromEntries(cols.map((c, i) => [c, v[i]])); });
const units = (r: any) => Number(r.housing_units);
const pre = (r: any) => PRE.reduce((a, k) => a + Number(r[k]), 0);

const total = rows.reduce((a, r) => a + units(r), 0);
const pre1970 = rows.reduce((a, r) => a + pre(r), 0);
const big = rows.filter((r) => units(r) >= MIN_UNITS).map((r) => ({ county: r.county, state: r.state, units: units(r), pre1970: pre(r), share: pre(r) / units(r) }));
big.sort((a, b) => b.share - a.share);
const halfOrMore = big.filter((r) => r.share >= 0.5).length;

if (rows.length !== 3144) throw new Error(`ABORT: expected 3144 counties, got ${rows.length}`);
const out = {
  title: 'US housing units built through 1969 (the galvanized_supply era in our report engine)',
  source: 'U.S. Census Bureau, American Community Survey 2020-2024 5-year estimates, table B25034 (Year Structure Built), via docs/data/oldest-housing-by-county.csv',
  generated: new Date().toISOString().slice(0, 10),
  engineRule: { id: rule.id, minYear: rule.minYear, maxYear: rule.maxYear },
  national: { counties: rows.length, housingUnits: total, builtThrough1969: pre1970, share: Math.round((pre1970 / total) * 1000) / 1000 },
  countiesWithMinUnits: { minUnits: MIN_UNITS, counties: big.length, halfOrMoreBuiltThrough1969: halfOrMore },
  topByShare: big.slice(0, 10).map((r) => ({ ...r, share: Math.round(r.share * 1000) / 1000 })),
};
fs.writeFileSync('docs/data/galvanized-era-housing.json', JSON.stringify(out, null, 1));
console.log(`${(pre1970 / 1e6).toFixed(1)}M of ${(total / 1e6).toFixed(1)}M units (${(out.national.share * 100).toFixed(1)}%) built through 1969; ${halfOrMore} of ${big.length} counties with ${MIN_UNITS}+ units at half or more`);
for (const r of out.topByShare.slice(0, 5)) console.log(`  ${r.county}, ${r.state}: ${(r.share * 100).toFixed(1)}%`);
