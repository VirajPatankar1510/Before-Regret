// Writes src/data/homeStats.json: the handful of research figures the homepage shows.
//
//   npx tsx scripts/build-home-stats.ts      (also runs at the start of `npm run build`)
//
// The figure files under docs/data/ are 60-220 KB each -- far too big to ship to every homepage
// visitor -- and the homepage must never carry a hand-typed number that can drift from the study
// it cites (Permit Pulse is rebuilt monthly). So the few headline values are read from the real
// figure files here, asserted, and written to one small JSON the homepage imports.

import fs from 'node:fs';
import path from 'node:path';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const D = path.join(process.cwd(), 'docs', 'data');
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));

const zone = read('flood-outside-zone.json');
const dams = read('dams-high-hazard.json');
const pulse = read('permit-pulse-figures.json');

const num = (v: unknown, name: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`ABORT: ${name} is not a number`);
  return v;
};

const monthYear = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// The home-age timeline's year ranges, copied from the report engine so the homepage never ships
// the engine (it pulls county tables the homepage has no use for) and never retypes a range.
const ERA_IDS = ['knob_and_tube', 'galvanized_supply', 'sewer_cast_iron', 'lead_paint_disclosure', 'asbestos_materials',
  'electrical_panel_brand', 'electrical_aluminum_wiring', 'polybutylene_supply', 'eifs_stucco'];
const eraRules = ERA_IDS.map((id) => {
  const r = PRIORITY_RULES.find((p) => p.id === id);
  if (!r) throw new Error(`ABORT: era rule ${id} missing from PRIORITY_RULES`);
  return { id, title: r.title, minYear: num(r.minYear, `${id}.minYear`), maxYear: num(r.maxYear, `${id}.maxYear`) };
});

const stats = {
  generatedAt: new Date().toISOString(),
  eraRules,
  outsideZone: {
    sharePct: num(zone.national.shareCount, 'outsideZone.shareCount'),
    claims: num(zone.national.classifiable, 'outsideZone.classifiable'),
    paidOutsideBillions: Math.round(num(zone.national.paidOutside, 'outsideZone.paidOutside') / 1e8) / 10,
    href: '/research/outside-the-zone/',
    source: 'FEMA NFIP claims',
  },
  dams: {
    high: num(dams.national.high, 'dams.high'),
    pctPoor: num(dams.national.pctHighBad, 'dams.pctHighBad'),
    href: '/research/high-hazard-dams/',
    source: 'US Army Corps of Engineers, National Inventory of Dams',
  },
  permits: {
    singleFamilyPct: num(pulse.national.singleFamily.changePct, 'permits.singleFamily.changePct'),
    countiesFell: num(pulse.findings.countiesHousesFell, 'permits.countiesHousesFell'),
    counties: num(pulse.findings.eligibleCounties, 'permits.eligibleCounties'),
    through: monthYear(pulse.period.yearToDateThrough),
    href: '/research/permit-pulse/',
    source: 'US Census Bureau, Building Permits Survey',
  },
};

const out = path.join(process.cwd(), 'src', 'data', 'homeStats.json');
fs.writeFileSync(out, JSON.stringify(stats, null, 2) + '\n');
console.log(`[build-home-stats] wrote ${path.relative(process.cwd(), out)}: outside-zone ${stats.outsideZone.sharePct}%, dams ${stats.dams.high}, single-family ${stats.permits.singleFamilyPct}%`);
