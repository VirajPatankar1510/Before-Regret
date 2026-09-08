// Builds the derived dataset behind the "raise or remove" study.
//
//   npx tsx scripts/analyse-raise-or-remove.ts
//
// Emits docs/data/raise-or-remove-{states,zips}.csv and raise-or-remove-figures.json. Every number
// quoted in the published study comes out of this file, so a journalist checking one lands on the
// same arithmetic rather than on a figure retyped into prose.
//
// -------------------------------------------------------------------------------------------
// THE SOURCE
//
// FEMA Hazard Mitigation Assistance -- Mitigated Properties. 99,927 records covering 222,860
// properties, fiscal years 1989 to 2025, 2,259 counties and 11,536 ZIP codes, with $13.5bn in
// recorded payments. It is the national register of every property FEMA has paid to demolish, buy,
// raise, floodproof or retrofit. A US Government work, downloadable in bulk with no API key.
//
// It is almost unused in property journalism. Buyouts themselves are not virgin territory -- NRDC
// and Climate Central have both published on FEMA acquisitions -- but the cuts here are new: the
// decision by FOUNDATION TYPE, and the split between states that use elevation at all and states
// that do not.
//
// -------------------------------------------------------------------------------------------
// THE UNIT OF ANALYSIS, and why it is narrower than the file
//
// Restricted to SINGLE-FAMILY properties where the action was either Acquisition/Demolition or
// Elevation -- 32,779 of the 99,927 rows. Everything else is a different decision with a different
// logic: safe rooms and wind retrofits are not a choice between saving and removing a house,
// seismic retrofit is a different hazard entirely, and non-residential structures are not the
// subject. Including them would inflate n and blur the question.
//
// -------------------------------------------------------------------------------------------
// THE CONFOUND, tested rather than assumed
//
// Nationally, homes with basements are demolished 93.4% of the time against 46.3% for homes on
// piers, which reads as a clean engineering gradient. It is not, on its own: Louisiana has
// pier-founded housing AND raises houses, Iowa has basements AND demolishes them, so state could
// explain the whole effect.
//
// Testing it within states splits the country in two. Five states do essentially all the elevating
// in America; in those, foundation moves the outcome by 48.9 points, from 17.8% demolished on
// piers to 66.7% on a basement. In the twenty that do not, the spread is 22.7 points against a
// base rate of 90.7% -- everything goes regardless. The gradient is real and it is conditional,
// which is a better finding than the one it replaced, and it is why the foundation breakdown is
// computed WITHIN each regime rather than nationally.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SRC = 'https://www.fema.gov/api/open/v4/HazardMitigationAssistanceMitigatedProperties.csv';
const CACHE = path.join('/tmp', 'br-hma', 'mitigated-properties.csv');
const OUT_DIR = path.join(process.cwd(), 'docs', 'data');

// Retained. Everything else in the file answers a different question -- a safe room is not a
// choice between keeping and removing a house.
const KEEP = new Set(['Acquisition/Demolition', 'Elevation']);
const DEMOLISH = 'Acquisition/Demolition';

// A state is treated as "uses elevation" when it demolishes fewer than 60% of the time.
//
// THE FIRST VERSION OF THIS USED 85% AND THE ROBUSTNESS CHECK BELOW REJECTED IT -- two states
// moved when the line shifted five points, meaning the split was partly an artefact of where the
// line was drawn. Looking at the actual distribution shows why: the states run 22.6, 33.3, 40.5,
// 41.4, 51.2 and then jump to 71.5, with nothing in between. The real structural break is that
// 20-point empty band, not a round number. At 60% the cutoff sits inside it, and moving it
// anywhere from 55% to 70% leaves every state in the same group.
const REGIME_CUTOFF = 0.60;
const MIN_STATE_N = 300;

function download(): string {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  if (!fs.existsSync(CACHE)) {
    // curl, not fetch: undici cannot reliably reach several federal hosts from this environment.
    // Same fault documented in src/server/countyDataFetcher.ts and the Gazetteer download.
    const r = spawnSync('curl', ['-4', '-sSL', '--max-time', '600', '-o', CACHE, SRC], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`download failed: ${r.stderr}`);
  }
  return fs.readFileSync(CACHE, 'utf8');
}

// The file contains quoted fields with embedded commas, so a split(',') will silently misalign
// columns. This is a minimal RFC4180 reader rather than a dependency.
function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); cell = ''; rows.push(row); row = []; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length === head.length)
    .map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const pct = (n: number, d: number) => (d ? n / d : 0);

function main() {
  const all = parseCsv(download());
  if (all.length < 90000) throw new Error(`ABORT: only ${all.length} rows parsed, expected ~99,927`);

  const rows = all.filter((r) => KEEP.has(r.propertyAction) && r.structureType === 'Single Family');
  if (rows.length < 30000) throw new Error(`ABORT: ${rows.length} single-family flood decisions, expected ~32,779`);

  const demolished = (rs: Array<Record<string, string>>) => rs.filter((r) => r.propertyAction === DEMOLISH).length;
  const share = (rs: Array<Record<string, string>>) => pct(demolished(rs), rs.length);

  // ---- states and regimes -------------------------------------------------------------------
  const byState = new Map<string, Array<Record<string, string>>>();
  for (const r of rows) {
    if (!r.state) continue;
    if (!byState.has(r.state)) byState.set(r.state, []);
    byState.get(r.state)!.push(r);
  }
  const states = [...byState.entries()]
    .filter(([, rs]) => rs.length >= MIN_STATE_N)
    .map(([name, rs]) => ({ state: name, n: rs.length, demolishedShare: share(rs) }))
    .sort((a, b) => a.demolishedShare - b.demolishedShare);

  const elevating = states.filter((s) => s.demolishedShare < REGIME_CUTOFF).map((s) => s.state);
  const removing = states.filter((s) => s.demolishedShare >= REGIME_CUTOFF).map((s) => s.state);

  // The threshold must not be doing the work. If shifting it 5 points either way reshuffles the
  // groups, the "two regimes" claim is an artefact of where the line was drawn.
  for (const alt of [0.55, 0.70]) {
    const a = new Set(states.filter((s) => s.demolishedShare < alt).map((s) => s.state));
    const moved = elevating.filter((s) => !a.has(s)).length + removing.filter((s) => a.has(s)).length;
    if (moved > 0) throw new Error(`ABORT: cutoff ${alt} moves ${moved} states; the split is not robust`);
  }

  const FOUNDATIONS = ['Elevated on Piers, Piles, Posts or Columns', 'Slab on Grade', 'Crawl Space', 'Basement'];
  const foundationTable = (group: string[]) => {
    const sub = rows.filter((r) => group.includes(r.state));
    return {
      states: group.length,
      decisions: sub.length,
      demolishedShare: share(sub),
      byFoundation: FOUNDATIONS.map((f) => {
        const g = sub.filter((r) => r.foundationType === f);
        return { foundation: f, n: g.length, demolishedShare: share(g) };
      }).filter((x) => x.n >= 100),
    };
  };
  const A = foundationTable(elevating);
  const B = foundationTable(removing);
  const spread = (t: typeof A) => Math.max(...t.byFoundation.map((x) => x.demolishedShare))
    - Math.min(...t.byFoundation.map((x) => x.demolishedShare));

  // The whole argument. If the conditional effect ever disappears, the study is wrong and this
  // build should stop rather than publish a claim the data no longer supports.
  if (spread(A) < 0.35) throw new Error(`ABORT: foundation spread in elevating states is only ${(spread(A) * 100).toFixed(1)} points`);
  if (spread(B) > 0.30) throw new Error(`ABORT: foundation spread in removing states is ${(spread(B) * 100).toFixed(1)} points; the contrast has gone`);
  if (spread(A) - spread(B) < 0.20) throw new Error('ABORT: the two regimes no longer differ enough to be called two regimes');

  // ---- year series --------------------------------------------------------------------------
  const years = [...new Set(rows.map((r) => r.programFy))].filter((y) => /^\d{4}$/.test(y)).sort();
  const byYear = years.map((y) => {
    const g = rows.filter((r) => r.programFy === y);
    return { year: Number(y), n: g.length, demolishedShare: share(g) };
  }).filter((x) => x.n >= 50);

  // ---- ZIP lookup ---------------------------------------------------------------------------
  const byZip = new Map<string, Array<Record<string, string>>>();
  for (const r of rows) {
    const z = (r.zip || '').padStart(5, '0').slice(0, 5);
    if (!/^\d{5}$/.test(z)) continue;
    if (!byZip.has(z)) byZip.set(z, []);
    byZip.get(z)!.push(r);
  }
  const zips = [...byZip.entries()].filter(([, rs]) => rs.length >= 5).map(([zip, rs]) => ({
    zip,
    state: rs[0].state,
    county: rs[0].county,
    n: rs.length,
    demolished: demolished(rs),
    raised: rs.length - demolished(rs),
    firstYear: Math.min(...rs.map((r) => Number(r.programFy)).filter(Number.isFinite)),
    lastYear: Math.max(...rs.map((r) => Number(r.programFy)).filter(Number.isFinite)),
  })).sort((a, b) => b.n - a.n);

  const blankFoundation = rows.filter((r) => !r.foundationType || r.foundationType === 'Other (Specify in Comments)').length;
  const withAmount = rows.filter((r) => r.actualAmountPaid).length;

  const figures = {
    generated: new Date().toISOString().slice(0, 10),
    source: {
      dataset: 'FEMA Hazard Mitigation Assistance - Mitigated Properties',
      url: SRC,
      totalRecords: all.length,
      fiscalYears: [Math.min(...years.map(Number)), Math.max(...years.map(Number))],
    },
    scope: {
      note: 'Single-family properties where the action was Acquisition/Demolition or Elevation.',
      decisions: rows.length,
      demolished: demolished(rows),
      raised: rows.length - demolished(rows),
      demolishedShare: share(rows),
      ratio: demolished(rows) / (rows.length - demolished(rows)),
      counties: new Set(rows.map((r) => `${r.state}|${r.county}`)).size,
      zips: byZip.size,
    },
    regimes: { cutoff: REGIME_CUTOFF, minStateN: MIN_STATE_N, elevating: A, removing: B,
      foundationSpreadElevating: spread(A), foundationSpreadRemoving: spread(B) },
    states,
    byYear,
    dataQuality: {
      foundationBlankOrOther: blankFoundation,
      foundationBlankShare: pct(blankFoundation, rows.length),
      rowsWithAmountPaid: withAmount,
      amountPaidShare: pct(withAmount, rows.length),
    },
    zipCount: zips.length,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'raise-or-remove-figures.json'), `${JSON.stringify(figures, null, 1)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, 'raise-or-remove-zips.json'), `${JSON.stringify(zips)}\n`);

  const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const stateCsv = ['state,decisions,demolished,raised,demolished_share',
    ...states.map((s) => {
      const rs = byState.get(s.state)!;
      return [esc(s.state), rs.length, demolished(rs), rs.length - demolished(rs), s.demolishedShare.toFixed(4)].join(',');
    })].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'raise-or-remove-states.csv'), `${stateCsv}\n`);

  const zipCsv = ['zip,state,county,decisions,demolished,raised,first_fy,last_fy',
    ...zips.map((z) => [z.zip, esc(z.state), esc(z.county), z.n, z.demolished, z.raised, z.firstYear, z.lastYear].join(','))].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'raise-or-remove-zips.csv'), `${zipCsv}\n`);

  console.log(`parsed ${all.length.toLocaleString()} records; ${rows.length.toLocaleString()} single-family flood decisions`);
  console.log(`  demolished ${(share(rows) * 100).toFixed(1)}%  ratio ${figures.scope.ratio.toFixed(2)}:1`);
  console.log(`  elevating states: ${A.states}, ${A.decisions.toLocaleString()} decisions, ${(A.demolishedShare * 100).toFixed(1)}% demolished, foundation spread ${(spread(A) * 100).toFixed(1)}pts`);
  console.log(`  removing  states: ${B.states}, ${B.decisions.toLocaleString()} decisions, ${(B.demolishedShare * 100).toFixed(1)}% demolished, foundation spread ${(spread(B) * 100).toFixed(1)}pts`);
  console.log(`  ZIPs with >=5 decisions: ${zips.length.toLocaleString()}`);
  console.log('wrote docs/data/raise-or-remove-{figures.json,zips.json,states.csv,zips.csv}');
}

main();
