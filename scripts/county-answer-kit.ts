// Everything verified this project knows about one county, formatted to be pasted into an answer.
//
//   npx tsx scripts/county-answer-kit.ts --county Harris --state TX
//   npx tsx scripts/county-answer-kit.ts --county "Miami-Dade" --state FL
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS. Answering a real question in a forum is only worth doing if the answer carries
// something the thread does not already have. This project's advantage is per-county federal data
// nobody else has joined: flood claims paid OUTSIDE the mapped zone, NFIP take-up inside it,
// high-hazard dams and their condition, housing age, and FEMA's own hazard scores. The bottleneck
// was never finding a thread -- it was digging four CSVs and a database out to get one figure.
//
// It prints figures with their sources attached, and it prints what it does NOT know, because the
// fastest way to lose a forum is to be confidently wrong in it once.
//
// EVERY NUMBER IS READ AT RUN TIME. Nothing is typed into this file. If the study CSVs change, this
// changes with them.
//
// THE THIN-DATA GATES ARE THE POINT, not a formality. outside-the-zone's raw top rows are counties
// at 100% on 28 claims. Quoting that as "100% of claims here were outside the zone" is true and
// misleading, and it is the error that forced Risk Without Price to be rebuilt. Below MIN_CLAIMS
// the percentage is withheld and the raw count shown instead, so the honest version is the only
// version available.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from '../src/server/db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'dist', 'research', 'data');
const MIN_CLAIMS = 500;

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function readCsv(file: string): Array<Record<string, string>> {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) throw new Error(`ABORT: ${file} not found -- run \`npm run build\` first`);
  const lines = fs.readFileSync(p, 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const f = l.split(',');
    return Object.fromEntries(head.map((h, i) => [h, f[i]]));
  });
}

const money = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}bn` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}m` : `$${n.toLocaleString()}`;

async function main() {
  const county = arg('county');
  const state = (arg('state') ?? '').toUpperCase();
  if (!county || !state) throw new Error('ABORT: --county "Harris" --state TX');

  const match = (r: Record<string, string>) =>
    r.county?.toLowerCase() === county.toLowerCase() && r.state?.toUpperCase() === state;

  const zone = readCsv('outside-the-zone-by-county.csv').find(match);
  const takeup = readCsv('flood-takeup-by-county.csv').find(match);
  const dams = readCsv('high-hazard-dams-by-county.csv').find(match);

  let cd: any = null;
  const slug = `${county.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-county-${state.toLowerCase()}`;
  for (let a = 1; a <= 4 && !cd; a++) {
    try {
      const rows: any[] = (await withDb((sql) => sql`
        SELECT county_name, state_abbrev, population, radon_zone, fema_risk_rating,
               census_total_units, census_year_built_json, fema_hazards_json, noaa_event_counts_json
        FROM county_data WHERE data_complete AND (slug = ${slug} OR lower(county_name) = ${county.toLowerCase()} AND state_abbrev = ${state})
        LIMIT 1`)) as any;
      cd = rows[0] ?? 'none';
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  if (cd === 'none') cd = null;

  const have: string[] = [];
  const missing: string[] = [];

  console.log(`\n${'='.repeat(78)}\n  ${county} County, ${state}\n${'='.repeat(78)}`);

  if (zone) {
    const claims = Number(zone.classifiable_claims);
    const pct = Number(zone.pct_of_claims_paid_outside_mapped_zone);
    const paid = Number(zone.paid_on_out_of_zone_claims_usd);
    console.log(`\n  FLOOD CLAIMS OUTSIDE THE MAPPED HIGH-RISK ZONE`);
    if (claims >= MIN_CLAIMS) {
      console.log(`    ${pct}% of ${claims.toLocaleString()} classifiable paid claims, ${money(paid)} paid out`);
      have.push(`${pct}% of paid flood claims in ${county} County were on homes OUTSIDE the mapped high-risk zone (${claims.toLocaleString()} claims, ${money(paid)}). Source: FEMA NFIP redacted claims file, zone as rated at time of claim; analysis at beforeregret.com/research/outside-the-zone/`);
    } else {
      console.log(`    ${claims} classifiable claims only -- PERCENTAGE WITHHELD, sample too thin to quote`);
      console.log(`    (raw: ${money(paid)} paid on out-of-zone claims)`);
      missing.push(`a quotable out-of-zone percentage (only ${claims} claims; below the ${MIN_CLAIMS} floor)`);
    }
  } else missing.push('flood-claim data (county not in the study file)');

  if (takeup) {
    const rate = takeup.nfip_takeup_rate_inside_mapped_zone_pct;
    if (rate) {
      console.log(`\n  NFIP TAKE-UP INSIDE THE MAPPED ZONE`);
      console.log(`    ${rate}% -- ${Number(takeup.nfip_policies_in_force).toLocaleString()} policies against ${Number(takeup.homes_inside_mapped_zone).toLocaleString()} homes inside the zone`);
      have.push(`Only ${rate}% of homes inside the mapped flood zone in ${county} County carry NFIP cover (${Number(takeup.nfip_policies_in_force).toLocaleString()} policies, ${Number(takeup.homes_inside_mapped_zone).toLocaleString()} homes). Source: FEMA NFIP policy file; beforeregret.com/research/risk-without-cover/`);
    }
  } else missing.push('NFIP take-up (county not in the study file)');

  if (dams) {
    const n = Number(dams.high_hazard_dams), poor = Number(dams.condition_poor_or_unsatisfactory), noPlan = Number(dams.no_emergency_action_plan_on_file);
    console.log(`\n  HIGH-HAZARD DAMS`);
    console.log(`    ${n} high-hazard | ${poor} rated poor or unsatisfactory | ${noPlan} with no emergency action plan on file`);
    // "1 are rated poor" reads as carelessness, and carelessness is what a forum punishes first.
    const isAre = (k: number) => (k === 1 ? 'is' : 'are');
    const hasHave = (k: number) => (k === 1 ? 'has' : 'have');
    if (n > 0) have.push(`${county} County has ${n} dam${n === 1 ? '' : 's'} the US Army Corps classifies high-hazard-potential; ${poor} ${isAre(poor)} rated poor or unsatisfactory and ${noPlan} ${hasHave(noPlan)} no emergency action plan on file. Source: National Inventory of Dams; beforeregret.com/research/high-hazard-dams/`);
  } else missing.push('dam data (county not in the study file)');

  if (cd) {
    const b = JSON.parse(cd.census_year_built_json || '{}');
    const units = Number(cd.census_total_units) || 0;
    const pre = ['built1970to1979','built1960to1969','built1950to1959','built1940to1949','built1939OrEarlier']
      .reduce((s, k) => s + (Number(b[k]) || 0), 0);
    const haz = JSON.parse(cd.fema_hazards_json || '{}');
    const top = Object.entries(haz).filter(([, v]: any) => /Very High|Relatively High/.test(v?.rating ?? ''))
      .map(([k, v]: any) => `${k} ${v.rating}`);
    console.log(`\n  HOUSING AGE AND HAZARD PROFILE`);
    console.log(`    ${units.toLocaleString()} housing units, ${pre.toLocaleString()} (${(pre / units * 100).toFixed(1)}%) built before 1980`);
    console.log(`    FEMA overall risk: ${cd.fema_risk_rating} | EPA radon zone ${cd.radon_zone}`);
    if (top.length) console.log(`    hazards rated high or very high: ${top.join(', ')}`);
    have.push(`${(pre / units * 100).toFixed(1)}% of ${county} County's ${units.toLocaleString()} housing units predate 1980 (US Census), and FEMA rates the county ${cd.fema_risk_rating} overall on the National Risk Index.`);
  } else missing.push('county_data profile (not one of the 100 counties with a complete verified record)');

  console.log(`\n${'-'.repeat(78)}\n  PASTE-READY LINES (each carries its own source)\n${'-'.repeat(78)}`);
  have.forEach((h, i) => console.log(`\n  ${i + 1}. ${h}`));
  if (!have.length) console.log('\n  Nothing quotable for this county. Do not answer -- there is no advantage here.');

  console.log(`\n${'-'.repeat(78)}\n  WHAT WE DO NOT KNOW ABOUT THIS COUNTY\n${'-'.repeat(78)}`);
  missing.forEach((m) => console.log(`  - ${m}`));
  console.log(`  - anything about a specific address, this house, or what an insurer will do`);
  console.log(`\n  Say the source out loud and say you built it. An undisclosed plug is the one thing`);
  console.log(`  that gets a domain banned from the platform permanently.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
