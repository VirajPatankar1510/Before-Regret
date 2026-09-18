// Permit Pulse -- the monthly refresh layer under the county permit cluster.
//
//   npx tsx scripts/build-permit-pulse.ts            # fetch latest, write derived data
//   npx tsx scripts/build-permit-pulse.ts --dry      # compute and report, write nothing
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS, and why it is different from the seven studies that came before it.
//
// Those are one-shot: computed once from a historical file and then frozen. This one re-runs. The
// Census Building Permits Survey publishes county-level residential permits every month (revised
// figures on the 17th workday), covering all ~3,020 counties. That makes it the only dataset this
// project holds where "what does it say THIS month" is a different answer from last month -- which
// is the entire point. A page nobody needs to re-crawl is a page nobody re-crawls.
//
// It is also pointed at the cluster that already earns. Six county permit guides sit at Google
// positions 8.7 to 12.3; this is a monthly, county-level, national dataset about building permits.
//
// -----------------------------------------------------------------------------------------------
// THE FINDING THIS FILE EXISTS TO PROTECT.
//
// Nationally, year-to-date January-July, permits are FLAT: 852,234 -> 852,819, +0.1%. Underneath
// that: houses (1-unit) -3.2%, apartments (5+ unit) +8.1%. The flat headline is two opposite
// movements cancelling.
//
// It is worse per county. Queens NY total permits +377% -- single-family went 24 units to 27.
// King County WA total +87% -- single-family FELL 2.7%. Los Angeles +55% -- single-family +0.9%.
// In each case one or two large apartment buildings moved the county total, and a homebuyer
// reading "permits up 377%" would conclude something about the house market that is simply untrue.
//
// So SPLIT_REQUIRED below is a hard gate, not a preference: no county total may be emitted without
// its single-family figure beside it. A true number that produces a false belief is the failure
// mode this project has already been burned by, and it is cheaper to make it unrepresentable.
//
// -----------------------------------------------------------------------------------------------
// IMPUTATION is the other trap. Census imputes permit counts for non-responding permit offices,
// and the file carries both a total and a "rep" (reported) figure per size class. 739 counties are
// 100% imputed -- Census modelled every unit and no office reported anything. Georgia is the worst
// offender: Catoosa, Fannin, Haralson, Long, Lowndes and Monroe counties all report 0% with
// hundreds of units on file. Those counties get suppressed rather than published, because
// "Lowndes County issued 487 permits" sourced from a model is a property-level claim from cohort
// data, which the hard stops forbid.
//
// Always key on FIPS. Harris County is 48201 in Texas (16,432 units, 99% reported) and 13145 in
// Georgia (106 units, 0% reported). A name join silently picks the wrong one.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS_DATA = path.join(ROOT, 'docs', 'data');
const FIG = path.join(DOCS_DATA, 'permit-pulse-figures.json');
const CSV = path.join(DOCS_DATA, 'permit-pulse-by-county.csv');
const DRY = process.argv.includes('--dry');

/** A county needs this many units before a percentage means anything. 1,013 counties have 1-24. */
const MIN_UNITS = 100;
/** ...and this share of them actually reported by a permit office rather than modelled. */
const MIN_REPORTED = 0.8;
/** No total may ship without its single-family split. See the header. */
const SPLIT_REQUIRED = true;

const BASE = 'https://www2.census.gov/econ/bps/County';
const SIZES = ['1-unit', '2-units', '3-4 units', '5+ units'] as const;

interface County {
  fips: string; name: string; st: string;
  units: number[];   // per size class
  bldgs: number[];
  value: number[];
  rep: number;       // reported units, all classes
}

/** co2607y.txt = year-to-date through 2026-07. `y` is YTD; `c` is the single month. */
const fileFor = (yy: number, mm: number) => `co${String(yy).padStart(2, '0')}${String(mm).padStart(2, '0')}y.txt`;

async function fetchBps(yy: number, mm: number): Promise<string | null> {
  const url = `${BASE}/${fileFor(yy, mm)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  // A 200 that is actually Census's HTML error page would parse to zero counties and silently
  // produce an empty study. Cheaper to catch it here.
  if (!/^Survey,FIPS/.test(text)) throw new Error(`ABORT: ${url} returned 200 but is not a BPS file`);
  return text;
}

/** Walk back from today to the newest month Census has actually posted. */
async function latest(): Promise<{ yy: number; mm: number; text: string }> {
  const now = new Date();
  for (let back = 1; back <= 8; back++) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const yy = d.getFullYear() % 100;
    const mm = d.getMonth() + 1;
    const text = await fetchBps(yy, mm);
    if (text) return { yy, mm, text };
  }
  throw new Error('ABORT: no BPS county file found in the last 8 months -- has the URL scheme changed?');
}

function parse(text: string): Map<string, County> {
  const out = new Map<string, County>();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines.slice(2)) {
    const c = line.split(',');
    if (c.length < 30 || !/^\d+$/.test(c[1].trim())) continue;
    const st = c[1].trim().padStart(2, '0');
    const fips = st + c[2].trim().padStart(3, '0');
    const num = (i: number) => Number(c[i].trim()) || 0;
    out.set(fips, {
      fips, st, name: c[5].trim(),
      bldgs: [0, 1, 2, 3].map((i) => num(6 + 3 * i)),
      units: [0, 1, 2, 3].map((i) => num(7 + 3 * i)),
      value: [0, 1, 2, 3].map((i) => num(8 + 3 * i)),
      rep: [0, 1, 2, 3].reduce((s, i) => s + num(19 + 3 * i), 0),
    });
  }
  if (out.size < 2500) throw new Error(`ABORT: parsed only ${out.size} counties, expected ~3,020`);
  return out;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const sf = (c: County) => c.units[0];
const mf = (c: County) => c.units[1] + c.units[2] + c.units[3];
const all = (c: County) => sum(c.units);
const pct = (a: number, b: number) => (a ? Number((((b - a) / a) * 100).toFixed(1)) : null);

async function main() {
  const cur = await latest();
  const prior = await fetchBps(cur.yy - 1, cur.mm);
  if (!prior) throw new Error(`ABORT: no prior-year file ${fileFor(cur.yy - 1, cur.mm)} for a like-for-like comparison`);

  const B = parse(cur.text);
  const A = parse(prior);
  const period = `20${String(cur.yy).padStart(2, '0')}-${String(cur.mm).padStart(2, '0')}`;
  const priorPeriod = `20${String(cur.yy - 1).padStart(2, '0')}-${String(cur.mm).padStart(2, '0')}`;
  console.log(`BPS year-to-date through ${period}, against ${priorPeriod}`);
  console.log(`  counties: ${B.size.toLocaleString()} current, ${A.size.toLocaleString()} prior`);

  // ---- national ------------------------------------------------------------------------------
  const natBy = (f: (c: County) => number, m: Map<string, County>) =>
    [...m.values()].reduce((s, c) => s + f(c), 0);
  const national = {
    all: { prior: natBy(all, A), current: natBy(all, B), changePct: 0 as number | null },
    singleFamily: { prior: natBy(sf, A), current: natBy(sf, B), changePct: 0 as number | null },
    multifamily: { prior: natBy(mf, A), current: natBy(mf, B), changePct: 0 as number | null },
    bySize: SIZES.map((label, i) => {
      const p = natBy((c) => c.units[i], A);
      const q = natBy((c) => c.units[i], B);
      return { label, prior: p, current: q, changePct: pct(p, q) };
    }),
  };
  for (const k of ['all', 'singleFamily', 'multifamily'] as const) {
    national[k].changePct = pct(national[k].prior, national[k].current);
  }

  console.log(`\n  NATIONAL  all ${national.all.prior.toLocaleString()} -> ${national.all.current.toLocaleString()}  (${national.all.changePct}%)`);
  console.log(`            houses ${national.singleFamily.changePct}%   apartments+ ${national.multifamily.changePct}%`);

  // The study's whole claim. If a future month stops showing it, the page must not keep asserting it.
  const divergence =
    national.singleFamily.changePct !== null && national.multifamily.changePct !== null
      ? Number((national.multifamily.changePct - national.singleFamily.changePct).toFixed(1))
      : null;

  // ---- counties ------------------------------------------------------------------------------
  const counties: any[] = [];
  let suppressedThin = 0, suppressedImputed = 0;
  for (const [fips, b] of B) {
    const a = A.get(fips);
    const units = all(b);
    const repShare = units ? b.rep / units : 0;
    if (units < MIN_UNITS || !a || all(a) < MIN_UNITS) { suppressedThin++; continue; }
    if (repShare < MIN_REPORTED) { suppressedImputed++; continue; }
    const row = {
      fips, county: b.name, state: b.st,
      unitsPrior: all(a), unitsCurrent: units, unitsChangePct: pct(all(a), units),
      sfPrior: sf(a), sfCurrent: sf(b), sfChangePct: pct(sf(a), sf(b)),
      mfPrior: mf(a), mfCurrent: mf(b), mfChangePct: pct(mf(a), mf(b)),
      reportedShare: Number((repShare * 100).toFixed(1)),
      // The tell: total rose while houses fell. A "permits are up" headline here is misleading.
      headlineMisleading: all(b) > all(a) && sf(b) < sf(a),
    };
    if (SPLIT_REQUIRED && (row.sfCurrent === undefined || row.sfPrior === undefined)) {
      throw new Error(`ABORT: ${fips} would ship a total with no single-family split`);
    }
    counties.push(row);
  }
  counties.sort((x, y) => y.unitsCurrent - x.unitsCurrent);

  const sfFell = counties.filter((c) => c.sfChangePct !== null && c.sfChangePct < 0).length;
  const totalUp = counties.filter((c) => c.unitsChangePct !== null && c.unitsChangePct > 0).length;
  const misleading = counties.filter((c) => c.headlineMisleading).length;

  console.log(`\n  GATES  min ${MIN_UNITS} units, min ${MIN_REPORTED * 100}% office-reported`);
  console.log(`    eligible counties     : ${counties.length.toLocaleString()}`);
  console.log(`    suppressed, too thin  : ${suppressedThin.toLocaleString()}`);
  console.log(`    suppressed, imputed   : ${suppressedImputed.toLocaleString()}`);
  console.log(`\n  FINDINGS`);
  console.log(`    counties where houses fell            : ${sfFell} of ${counties.length}  (${((100 * sfFell) / counties.length).toFixed(0)}%)`);
  console.log(`    counties where TOTAL rose but houses fell: ${misleading} of ${totalUp} 'up' counties`);

  if (divergence !== null && divergence < 3) {
    console.warn(`\n  NOTE: houses/apartments divergence is only ${divergence}pp this month.`);
    console.warn(`  The study's headline claim is weak here -- re-read the page before republishing.`);
  }

  const figures = {
    generatedAt: new Date().toISOString(),
    source: 'US Census Bureau, Building Permits Survey, county files',
    sourceUrls: [`${BASE}/${fileFor(cur.yy, cur.mm)}`, `${BASE}/${fileFor(cur.yy - 1, cur.mm)}`],
    period: { yearToDateThrough: period, comparedWith: priorPeriod },
    countiesInFile: B.size,
    gates: { minUnits: MIN_UNITS, minReportedShare: MIN_REPORTED, eligible: counties.length, suppressedThin, suppressedImputed },
    national,
    divergencePp: divergence,
    findings: { countiesHousesFell: sfFell, eligibleCounties: counties.length, countiesTotalUp: totalUp, countiesTotalUpHousesFell: misleading },
    counties,
  };

  if (DRY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  fs.mkdirSync(DOCS_DATA, { recursive: true });
  fs.writeFileSync(FIG, `${JSON.stringify(figures, null, 2)}\n`);
  const head = 'fips,county,state,units_prior,units_current,units_change_pct,sf_prior,sf_current,sf_change_pct,mf_prior,mf_current,mf_change_pct,reported_share_pct,headline_misleading';
  const body = counties.map((c) => [c.fips, `"${c.county}"`, c.state, c.unitsPrior, c.unitsCurrent, c.unitsChangePct, c.sfPrior, c.sfCurrent, c.sfChangePct, c.mfPrior, c.mfCurrent, c.mfChangePct, c.reportedShare, c.headlineMisleading].join(','));
  fs.writeFileSync(CSV, `${[head, ...body].join('\n')}\n`);
  console.log(`\n  wrote ${path.relative(ROOT, FIG)}`);
  console.log(`  wrote ${path.relative(ROOT, CSV)}  (${counties.length} counties)\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
