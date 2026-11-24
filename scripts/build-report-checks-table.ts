// What a Before Regret report's "Inspect" list contains, by the year the house was built, read straight from the
// report engine (src/engine/inspectionPriorities.ts PRIORITY_RULES) -- never retyped by hand.
// First-party data for the guide before-regret-home-report-checks-by-year-built.
//
//   npx tsx scripts/build-report-checks-table.ts   -> docs/data/report-checks-by-year.json (+ prints markdown rows)
//
// Re-run and re-check the guide whenever PRIORITY_RULES changes: a rule's year window or cost moving makes the
// published table wrong.
import fs from 'node:fs';
import path from 'node:path';
import { PRIORITY_RULES, CURRENT_YEAR, EXPANSIVE_SOIL_REGIONS, TERMITE_PROBABILITY_STATES, getInspectionPriorities } from '../src/engine/inspectionPriorities.js';

const years = (min: number, max: number) => {
  if (min <= 1800 && max >= CURRENT_YEAR) return 'Any year';
  if (min <= 1800) return max === CURRENT_YEAR - 12 ? `${max} or earlier (12+ years old)` : `${max} or earlier`;
  if (max >= CURRENT_YEAR) return `${min} or later`;
  return `${min} to ${max}`;
};
const where = (r: (typeof PRIORITY_RULES)[number]) => {
  if (r.counties) return `Only in ${r.counties.length} counties with documented expansive clay soil`;
  if (r.states) return `Only in ${r.states.length} states (${r.states.join(', ')})`;
  if (r.id === 'foundation_type_general') return 'Everywhere except the expansive-clay counties';
  if (r.id === 'pest_inspection_general') return `Everywhere except the ${Object.keys(TERMITE_PROBABILITY_STATES).length} termite-probability states`;
  return 'Everywhere in the US';
};
const rows = PRIORITY_RULES.map((r) => ({
  id: r.id,
  check: r.title,
  priority: r.priority,
  builtYears: years(r.minYear, r.maxYear),
  where: where(r),
  costToCheck: r.costToCheck.split(' — ')[0].split('. ')[0],
  insuranceFlag: Boolean(r.insuranceRedFlag),
}));
// Worked examples: how many Inspect items a house of each sample year gets, in a county with no regional gating.
const sample = [1925, 1955, 1968, 1985, 2000, 2015, 2024].map((y) => {
  const r = getInspectionPriorities(y, 'Cook County', 'IL');
  return { yearBuilt: y, items: r?.priorities.length ?? 0, high: r?.priorities.filter((p) => p.priority === 'high').length ?? 0 };
});
const out = {
  source: 'src/engine/inspectionPriorities.ts PRIORITY_RULES, built by scripts/build-report-checks-table.ts',
  builtOn: new Date().toISOString().slice(0, 10),
  currentYear: CURRENT_YEAR,
  ruleCount: PRIORITY_RULES.length,
  expansiveSoilCounties: Object.keys(EXPANSIVE_SOIL_REGIONS).length,
  termiteStates: Object.keys(TERMITE_PROBABILITY_STATES),
  rows,
  sampleCookCountyIL: sample,
};
fs.writeFileSync(path.join(process.cwd(), 'docs', 'data', 'report-checks-by-year.json'), `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ ...out, rows: undefined }, null, 2));
for (const r of rows) console.log(`| ${r.check} | ${r.builtYears} | ${r.where} | ${r.costToCheck} |${r.priority}${r.insuranceFlag ? ' INS' : ''}`);
