// First-party figures for /guides/buying-1970s-house-problems-inspection/ (owner title, 2026-11-17).
//
//   npx tsx scripts/build-1970s-housing-figures.ts   # -> docs/data/1970s-housing-figures.json
//
// Two things, both reproducible from files already in the repo:
//
//  1. HOW MUCH 1970s HOUSING THERE IS. Input is the Census file the "Before 1940" study fetched (ACS 5-year
//     2020-2024, table B25034, docs/data/oldest-housing-raw.json). Census bins are decades, and 1970-1979 is one
//     bin, so the counts here are exact for the decade the page is about (no bracketing needed). Puerto Rico is
//     excluded, as in the oldest-housing study. County shares are only ranked for counties with 50,000+ units,
//     because a 1,200-unit county's share swings on a few dozen homes and its margin of error.
//
//  2. WHICH OF OUR REPORT CHECKS FIRE FOR EACH YEAR OF THE DECADE. Read from PRIORITY_RULES at run time, never
//     retyped. Only rules with no county or state restriction are used, so the split is what a report shows
//     anywhere in the country; county-gated rules (expansive soil, termites, landslides) add to it locally.
//
// Year built is not equipment. A 1972 house may have been rewired or repiped. These are counts of houses worth
// ASKING about, never of houses that have any of these materials.
import fs from 'node:fs';
import path from 'node:path';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const RAW = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-raw.json');
const OUT = path.join(process.cwd(), 'docs', 'data', '1970s-housing-figures.json');
const MIN_UNITS_FOR_SHARE = 50_000;

type Est = Record<string, number>;
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8')) as {
  source: string; vintage: string; api: string; fetchedAt: string;
  counties: Array<{ geoid: string; name: string; est: Est }>;
};
const counties = raw.counties.filter((c) => !c.geoid.startsWith('72'));
const DECADES = ['built2020OrLater', 'built2010to2019', 'built2000to2009', 'built1990to1999', 'built1980to1989',
  'built1970to1979', 'built1960to1969', 'built1950to1959', 'built1940to1949', 'built1939OrEarlier'];

let total = 0, b70 = 0, seventiesIsLargestBin = 0;
const byState = new Map<string, { name: string; total: number; b70: number }>();
for (const c of counties) {
  const e = c.est;
  total += e.total; b70 += e.built1970to1979;
  const largest = DECADES.reduce((a, b) => (e[b] > e[a] ? b : a));
  if (largest === 'built1970to1979' && e.total > 0) seventiesIsLargestBin++;
  const st = c.name.split(', ').pop()!;
  const s = byState.get(st) ?? { name: st, total: 0, b70: 0 };
  s.total += e.total; s.b70 += e.built1970to1979;
  byState.set(st, s);
}
const pct = (n: number, d: number) => Math.round((n / d) * 1000) / 10;

const states = [...byState.values()].map((s) => ({ ...s, sharePct: pct(s.b70, s.total) }));
const topStatesByShare = [...states].sort((a, b) => b.sharePct - a.sharePct).slice(0, 10);
const topStatesByCount = [...states].sort((a, b) => b.b70 - a.b70).slice(0, 5)
  .map((s) => ({ name: s.name, built1970s: s.b70, sharePct: s.sharePct }));
const topCountiesByShare = counties.filter((c) => c.est.total >= MIN_UNITS_FOR_SHARE)
  .map((c) => ({ name: c.name, total: c.est.total, built1970s: c.est.built1970to1979, sharePct: pct(c.est.built1970to1979, c.est.total) }))
  .sort((a, b) => b.sharePct - a.sharePct).slice(0, 10);

// The engine split, year by year, nationally applicable rules only.
const national = PRIORITY_RULES.filter((r) => !r.counties && !r.states);
const byYear: Record<number, string[]> = {};
for (let y = 1970; y <= 1979; y++) {
  byYear[y] = national.filter((r) => y >= r.minYear && y <= r.maxYear).map((r) => r.id);
}
const all = new Set(Object.values(byYear).flat());
const changing = [...all].filter((id) => !Object.values(byYear).every((ids) => ids.includes(id)));
const changingRules = changing.map((id) => {
  const r = PRIORITY_RULES.find((x) => x.id === id)!;
  return { id, title: r.title, minYear: r.minYear, maxYear: r.maxYear, costToCheck: r.costToCheck, typicalRepairCost: r.typicalRepairCost };
});
const constantRules = [...all].filter((id) => !changing.includes(id)).map((id) => {
  const r = PRIORITY_RULES.find((x) => x.id === id)!;
  return { id, title: r.title, costToCheck: r.costToCheck, typicalRepairCost: r.typicalRepairCost };
});
// Contiguous year bands with the same set of changing rules.
const bands: Array<{ from: number; to: number; rules: string[] }> = [];
for (let y = 1970; y <= 1979; y++) {
  const key = byYear[y].filter((id) => changing.includes(id));
  const last = bands[bands.length - 1];
  if (last && last.rules.join() === key.join()) last.to = y;
  else bands.push({ from: y, to: y, rules: key });
}

const out = {
  generatedBy: 'scripts/build-1970s-housing-figures.ts',
  input: 'docs/data/oldest-housing-raw.json',
  source: raw.source, vintage: raw.vintage, api: raw.api, fetchedAt: raw.fetchedAt,
  scope: `${counties.length} counties and county equivalents in the 50 states and DC (Puerto Rico excluded)`,
  national: { totalUnits: total, built1970s: b70, share1970sPct: pct(b70, total), countiesWhere1970sIsLargestDecade: seventiesIsLargestBin },
  topStatesByShare, topStatesByCount,
  minUnitsForCountyShare: MIN_UNITS_FOR_SHARE, topCountiesByShare,
  engine: { file: 'src/engine/inspectionPriorities.ts', note: 'nationally applicable rules only (no counties/states field)', bands, changingRules, constantRules },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
