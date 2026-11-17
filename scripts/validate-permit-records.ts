// Validates data/permit-records/**/*.json against src/data/permitRecords/schema.ts and prints a
// field-by-status coverage table. Exits 1 on any problem.
//
//   npx tsx scripts/validate-permit-records.ts
//   npx tsx scripts/validate-permit-records.ts --queue   # also list what to research or re-check next
//
// Beyond the schema's structural rules, every evidence reference must RESOLVE:
//   ledger:<slug>#<id>   the fact exists, was read on or before checkedOn, and at least one cited
//                        fact's host matches the field's sourceUrl host
//   ledger:<slug>#portalWalk   the ledger's portal walk exists and its date equals checkedOn
//   test:<id>            the test exists in the same county file and its date equals checkedOn
//   script:<path>:<line> the line mentions verification and the script contains the checkedOn date
//   quote:<text>         at least 12 characters
// So a field cannot claim "verified" on the strength of a reference nobody can follow.
import fs from 'node:fs';
import path from 'node:path';
import {
  type CountyArea,
  type Field,
  type FieldStatus,
  FIELD_STATUSES,
  JURISDICTION_FIELDS,
  STATUS_LABEL,
  checkField,
  effectiveStatus,
  isServedElsewhere,
} from '../src/data/permitRecords/schema.js';

const ROOT = 'data/permit-records';
const today = new Date();
const problems: string[] = [];
const ledgerCache = new Map<string, any>();

function ledger(slug: string) {
  if (!ledgerCache.has(slug)) {
    const f = `data/fact-ledgers/${slug}.json`;
    ledgerCache.set(slug, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  }
  return ledgerCache.get(slug);
}
const host = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

function checkEvidence(where: string, f: Field<unknown>, area: CountyArea) {
  if (f.status === 'not_tested' || f.status === 'not_researched') return;
  const hosts = new Set<string>();
  let ledgerRefs = 0;
  for (const ref of f.evidence) {
    const [kind, ...rest] = ref.split(':');
    const body = rest.join(':');
    if (kind === 'ledger') {
      ledgerRefs++;
      const [slug, id] = body.split('#');
      const l = ledger(slug);
      if (!l) { problems.push(`${where}: ledger ${slug} not found`); continue; }
      if (id === 'portalWalk') {
        if (!l.portalWalk) problems.push(`${where}: ${slug} has no portalWalk`);
        else if (l.portalWalk.date !== f.checkedOn) problems.push(`${where}: portalWalk date ${l.portalWalk.date} != checkedOn ${f.checkedOn}`);
        hosts.add(host(f.sourceUrl)); // a walk is our own observation of the portal itself
        continue;
      }
      const fact = (l.facts ?? []).find((x: any) => x.id === id);
      if (!fact) { problems.push(`${where}: ${slug}#${id} not found`); continue; }
      if (fact.readOn && fact.readOn > f.checkedOn) problems.push(`${where}: ${slug}#${id} read ${fact.readOn}, after checkedOn ${f.checkedOn}`);
      for (const u of String(fact.url ?? '').split(/\s*;\s*/)) hosts.add(host(u));
    } else if (kind === 'test') {
      const t = area.tests.find((x) => x.id === body);
      if (!t) problems.push(`${where}: test ${body} not in this file`);
      else if (t.date !== f.checkedOn) problems.push(`${where}: test ${body} dated ${t.date} != checkedOn ${f.checkedOn}`);
      hosts.add(host(f.sourceUrl));
    } else if (kind === 'script') {
      const m = body.match(/^(.+):(\d+)$/);
      if (!m || !fs.existsSync(m[1])) { problems.push(`${where}: script ref ${body} not found`); continue; }
      const lines = fs.readFileSync(m[1], 'utf8').split('\n');
      const line = lines[Number(m[2]) - 1] ?? '';
      if (!/verif/i.test(line)) problems.push(`${where}: ${body} does not mention verification: "${line.trim().slice(0, 80)}"`);
      if (!lines.join('\n').includes(f.checkedOn)) problems.push(`${where}: ${m[1]} never mentions ${f.checkedOn}`);
      hosts.add(host(f.sourceUrl));
    } else if (kind === 'quote') {
      if (body.trim().length < 12) problems.push(`${where}: quote too short`);
      hosts.add(host(f.sourceUrl));
    } else problems.push(`${where}: unknown evidence kind "${kind}"`);
  }
  if (ledgerRefs && !hosts.has(host(f.sourceUrl))) problems.push(`${where}: sourceUrl host ${host(f.sourceUrl)} matches none of its ledger facts (${[...hosts].join(', ')})`);
}

const files: string[] = [];
(function walk(d: string) {
  if (!fs.existsSync(d)) return;
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.json')) files.push(p);
  }
})(ROOT);

const tally: Record<string, Record<FieldStatus, number>> = {};
const zero = () => Object.fromEntries(FIELD_STATUSES.map((s) => [s, 0])) as Record<FieldStatus, number>;
const perCounty: Array<{ file: string; jur: number; verified: number; total: number }> = [];
const ids = new Set<string>();

for (const file of files.sort()) {
  const a = JSON.parse(fs.readFileSync(file, 'utf8')) as CountyArea;
  const where = path.relative(ROOT, file);
  if (a.schemaVersion !== 1) problems.push(`${where}: schemaVersion must be 1`);
  if (!/^\d{5}$/.test(a.countyFips ?? '')) problems.push(`${where}: countyFips must be 5 digits`);
  if (!path.basename(file).startsWith(a.countyFips + '-')) problems.push(`${where}: file name must start with the county FIPS`);
  if (path.basename(path.dirname(file)) !== a.state?.toLowerCase()) problems.push(`${where}: folder must be the state code`);
  for (const t of a.tests ?? []) if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) problems.push(`${where}: test ${t.id} date`);
  problems.push(...checkField(where, 'jurisdictionCoverage', a.jurisdictionCoverage, today));
  if (a.jurisdictionCoverage) checkEvidence(`${where}.jurisdictionCoverage`, a.jurisdictionCoverage, a);
  const localIds = new Set(a.jurisdictions.map((j) => j.id));
  let v = 0, tot = 0;
  for (const j of a.jurisdictions) {
    if (ids.has(j.id)) problems.push(`${where}: duplicate jurisdiction id ${j.id}`);
    ids.add(j.id);
    const served = j.permitsIssuedBy ? isServedElsewhere(j) : false;
    for (const name of JURISDICTION_FIELDS) {
      const f = j[name] as Field<unknown>;
      if (served && name !== 'permitsIssuedBy') {
        if (f) problems.push(`${where}:${j.id}.${name}: must be omitted, permits are issued by ${j.permitsIssuedBy.value}`);
        continue;
      }
      // Issuer not researched yet: record only what is known; absent fields read as "not researched".
      if (!f && j.permitsIssuedBy?.status === 'not_researched') continue;
      problems.push(...checkField(`${where}:${j.id}`, name, f, today));
      if (!f) continue;
      checkEvidence(`${where}:${j.id}.${name}`, f, a);
      const s = effectiveStatus(f, today);
      (tally[name] ??= zero())[s]++;
      tot++;
      if (s === 'verified') v++;
    }
    const by = j.permitsIssuedBy;
    if (by && by.value !== null && !localIds.has(by.value as string)) problems.push(`${where}:${j.id}.permitsIssuedBy points at unknown id ${by.value}`);
  }
  perCounty.push({ file: where, jur: a.jurisdictions.length, verified: v, total: tot });
}

console.log(`${files.length} county files, ${ids.size} jurisdictions\n`);
const cols = FIELD_STATUSES.map((s) => STATUS_LABEL[s].padStart(19)).join('');
console.log('field'.padEnd(26) + cols);
for (const name of JURISDICTION_FIELDS) {
  const t = tally[name] ?? zero();
  console.log(name.padEnd(26) + FIELD_STATUSES.map((s) => String(t[s]).padStart(19)).join(''));
}
console.log('\ncounty file'.padEnd(36) + 'jurisdictions  verified fields');
for (const c of perCounty) console.log(c.file.padEnd(35) + String(c.jur).padStart(13) + `  ${c.verified}/${c.total}`);

if (process.argv.includes('--queue')) {
  console.log('\nRE-VERIFICATION QUEUE (internal; never shown to readers)');
  for (const file of files.sort()) {
    const a = JSON.parse(fs.readFileSync(file, 'utf8')) as CountyArea;
    const items: string[] = [];
    const add = (where: string, f: any) => {
      if (!f) return;
      const s = effectiveStatus(f, today);
      if (f.unverifiedClaim) items.push(`  [claim]   ${where}: ${f.unverifiedClaim} (${f.claimSource})`);
      else if (s === 'partially_verified') items.push(`  [partial] ${where}: ${f.limits}`);
      else if (s === 'outdated') items.push(`  [outdated] ${where}: checked ${f.checkedOn}`);
    };
    add('coverage', a.jurisdictionCoverage);
    for (const j of a.jurisdictions) for (const n of JURISDICTION_FIELDS) add(`${j.id}.${n}`, j[n]);
    if (items.length) console.log(`\n${path.relative(ROOT, file)}  (${a.guideSlug ?? 'no guide'})\n` + items.join('\n'));
  }
}

if (problems.length) {
  console.error(`\n${problems.length} PROBLEM(S):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log('\nok  every verified field resolves to a ledger fact, test, script note or quote');
