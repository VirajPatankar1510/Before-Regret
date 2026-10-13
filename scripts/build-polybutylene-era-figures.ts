// First-party figures for /guides/spot-polybutylene-pipes-before-buying-house/ (rewrite 2026-10-14):
// how much of today's US housing was built inside the window our report engine flags for polybutylene.
//
//   npx tsx scripts/build-polybutylene-era-figures.ts   # -> docs/data/polybutylene-era-figures.json
//
// Input is the Census file the "Before 1940" study already fetched (ACS 5-year 2020-2024, table B25034,
// docs/data/oldest-housing-raw.json). The engine window (PRIORITY_RULES polybutylene_supply) is read at
// run time, never retyped. Census bins are decades, so the window can only be bracketed:
//   - LOWER BOUND: homes built 1980-1989, a decade that sits wholly inside the window;
//   - UPPER BOUND: 1970-1999, the three decades the window touches.
// Year built is not pipe material. A 1985 house may have copper, or may have been repiped. These are
// counts of houses worth ASKING about, never of houses with polybutylene. Puerto Rico is excluded, as
// in the oldest-housing study.
import fs from 'node:fs';
import path from 'node:path';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const RAW = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-raw.json');
const OUT = path.join(process.cwd(), 'docs', 'data', 'polybutylene-era-figures.json');
const MIN_UNITS_FOR_SHARE = 50_000;

const rule = PRIORITY_RULES.find((r) => r.id === 'polybutylene_supply');
if (!rule || rule.minYear == null || rule.maxYear == null) throw new Error('polybutylene_supply rule or its years missing');

type Est = Record<string, number>;
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8')) as {
  source: string; vintage: string; api: string; fetchedAt: string;
  counties: Array<{ geoid: string; name: string; est: Est }>;
};
const states = raw.counties.filter((c) => !c.geoid.startsWith('72'));

let total = 0, b80 = 0, b70to99 = 0;
const rows = states.map((c) => {
  const e = c.est;
  const eighties = e.built1980to1989;
  const window3 = e.built1970to1979 + e.built1980to1989 + e.built1990to1999;
  total += e.total; b80 += eighties; b70to99 += window3;
  return { geoid: c.geoid, name: c.name, total: e.total, built1980s: eighties, share1980s: e.total ? eighties / e.total : 0 };
});

const pct = (x: number) => Math.round(x * 1000) / 10;
const byCount = [...rows].sort((a, b) => b.built1980s - a.built1980s).slice(0, 10);
const byShare = rows.filter((r) => r.total >= MIN_UNITS_FOR_SHARE).sort((a, b) => b.share1980s - a.share1980s).slice(0, 10);

const out = {
  generatedBy: 'scripts/build-polybutylene-era-figures.ts',
  input: 'docs/data/oldest-housing-raw.json',
  source: raw.source, vintage: raw.vintage, api: raw.api, fetchedAt: raw.fetchedAt,
  engineWindow: { rule: rule.id, minYear: rule.minYear, maxYear: rule.maxYear, typicalRepairCost: rule.typicalRepairCost },
  scope: `${states.length} counties and county equivalents in the 50 states and DC (Puerto Rico excluded)`,
  national: {
    totalUnits: total,
    built1980s: b80,
    share1980sPct: pct(b80 / total),
    built1970to1999: b70to99,
    share1970to1999Pct: pct(b70to99 / total),
  },
  topCountiesByCount1980s: byCount.map((r) => ({ name: r.name, built1980s: r.built1980s, share1980sPct: pct(r.share1980s) })),
  topCountiesByShare1980s: {
    minUnits: MIN_UNITS_FOR_SHARE,
    rows: byShare.map((r) => ({ name: r.name, total: r.total, built1980s: r.built1980s, share1980sPct: pct(r.share1980s) })),
  },
  caveat: 'Census year built is self-reported and says nothing about pipe material. Counts are homes worth asking about, not homes with polybutylene.',
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
