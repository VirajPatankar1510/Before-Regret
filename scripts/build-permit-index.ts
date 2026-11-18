// Builds src/data/permitRecords/permitIndex.json, the client-side copy of data/permit-records/ used by the
// guided research tool's permit question (docs/plans/permit-coverage-usa-2026-11.md).
//
// Only what the tool may show goes in: for verified / partially verified fields, the value, source, check date
// and limits. For every other status, the status alone. Never the "unverifiedClaim" / "claimSource" text (a
// re-verification queue, never shown), never test notes. Staleness (REVERIFY_AFTER_DAYS) is applied in the
// browser at run time with effectiveStatus(), so this output is deterministic and safe to commit.
//
//   npx tsx scripts/build-permit-index.ts          (also runs in `npm run build`)

import fs from 'fs';
import path from 'path';
import { JURISDICTION_FIELDS, STATE_FIELDS, type CountyArea, type Field, type StateSheet } from '../src/data/permitRecords/schema';

const ROOT = path.join(process.cwd(), 'data/permit-records');
const OUT = path.join(process.cwd(), 'src/data/permitRecords/permitIndex.json');

function slim(f: Field<unknown> | undefined, keepNote = false) {
  if (!f) return { status: 'not_researched' };
  if (f.status === 'verified' || f.status === 'partially_verified' || f.status === 'outdated') {
    const out: Record<string, unknown> = { status: f.status, value: f.value, sourceUrl: f.sourceUrl, checkedOn: f.checkedOn };
    if (f.status === 'partially_verified') out.limits = f.limits;
    if (f.status === 'outdated') out.reason = f.reason;
    // State sheets carry the law's citation in `note`; it is shown as the source line.
    if (keepNote && f.note) out.note = f.note;
    return out;
  }
  return { status: f.status };
}

const files: string[] = [];
for (const st of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, st);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) if (f.endsWith('.json') && !f.startsWith('_')) files.push(path.join(dir, f));
}

const counties = files.map((file) => {
  const d = JSON.parse(fs.readFileSync(file, 'utf8')) as CountyArea;
  return {
    state: d.state,
    countyFips: d.countyFips,
    county: d.county,
    guideSlug: d.guideSlug || null,
    coverage: slim(d.jurisdictionCoverage),
    jurisdictions: d.jurisdictions.map((j) => {
      const fields: Record<string, unknown> = {};
      for (const name of JURISDICTION_FIELDS) fields[name] = slim(j[name] as Field<unknown> | undefined);
      return { id: j.id, name: j.name, kind: j.kind, ...fields };
    }),
  };
});

// Layer 1 state sheets (data/permit-states/<st>.json), keyed by USPS code.
const STATE_ROOT = path.join(process.cwd(), 'data/permit-states');
const states: Record<string, Record<string, unknown>> = {};
if (fs.existsSync(STATE_ROOT)) {
  for (const f of fs.readdirSync(STATE_ROOT).sort()) {
    if (!f.endsWith('.json')) continue;
    const s = JSON.parse(fs.readFileSync(path.join(STATE_ROOT, f), 'utf8')) as StateSheet;
    const out: Record<string, unknown> = { state: s.state, stateName: s.stateName };
    for (const name of STATE_FIELDS) out[name] = slim(s[name] as Field<unknown>, true);
    states[s.state] = out;
  }
}

const json = JSON.stringify({ schemaVersion: 1, counties, states }, null, 1) + '\n';
fs.writeFileSync(OUT, json);
const n = counties.reduce((s, c) => s + c.jurisdictions.length, 0);
console.log(`[build-permit-index] ${counties.length} counties, ${n} jurisdictions, ${Object.keys(states).length} state sheets -> ${path.relative(process.cwd(), OUT)} (${(json.length / 1024).toFixed(1)} KB)`);
if (/unverifiedClaim|claimSource/.test(json)) {
  console.error('[build-permit-index] unverified claim text leaked into the index');
  process.exit(1);
}
