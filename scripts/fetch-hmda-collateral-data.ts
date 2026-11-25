// Streams the 2024 HMDA nationwide file of home-purchase applications that reached a decision
// (originated, approved but not accepted, denied) from the FFIEC HMDA Data Browser and aggregates it,
// for the study on mortgages denied because of the property (denial reason 4, "collateral").
//
//   npx tsx scripts/fetch-hmda-collateral-data.ts    # -> docs/data/hmda-collateral-raw.json (gitignored)
//
// The CSV (several GB uncompressed) is never written to disk: curl streams it into this process, which
// keeps only counts. Public data, no key: https://ffiec.cfpb.gov/data-browser/
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, execFileSync } from 'node:child_process';

const YEAR = 2024;
const OUT = path.join(process.cwd(), 'docs', 'data', 'hmda-collateral-raw.json');
const API = 'https://ffiec.cfpb.gov/v2/data-browser-api/view';
const QUERY = `years=${YEAR}&actions_taken=1,2,3&loan_purposes=1`;

// The data browser answers a CSV request with a one-line pointer to the file on its file host.
const pointer = execFileSync('curl', ['-s', '--max-time', '120', '--compressed', `${API}/nationwide/csv?${QUERY}`], { maxBuffer: 1024 * 1024 }).toString();
const FILE = pointer.match(/https:\/\/files\.ffiec\.cfpb\.gov\/[^"]+\.csv/)?.[0];
if (!FILE) throw new Error(`ABORT: no file pointer: ${pointer.slice(0, 200)}`);
const agg = JSON.parse(execFileSync('curl', ['-s', '--max-time', '120', `${API}/nationwide/aggregations?${QUERY}`]).toString());
const EXPECTED = (agg.aggregations as Array<{ count: number }>).reduce((a, r) => a + r.count, 0);

// Per key: [applications, denied, collateral (any of the 4 reasons), collateral as first reason,
//           then denials mentioning reason 1..9 (index 4..12), then denials whose lender was exempt from
//           reporting reasons (code 1111, index 13)]
const N = 14;
const data = new Map<string, number[]>();
const ageBucket = (v: string) => { const n = Number(v); if (v === '' || v === 'NA' || !Number.isFinite(n)) return 'na'; return n < 20 ? '<20' : n < 40 ? '20-39' : n < 60 ? '40-59' : '60+'; };
const unitsBucket = (v: string) => (v === '1' ? '1' : ['2', '3', '4'].includes(v) ? '2-4' : '5+');

let header: string[] = [], ix: Record<string, number> = {}, rows = 0, badCols = 0;
const proc = spawn('curl', ['-s', '-L', '--fail', FILE]);
const rl = readline.createInterface({ input: proc.stdout, crlfDelay: Infinity });
for await (const line of rl) {
  if (!header.length) { header = line.split(','); ix = Object.fromEntries(header.map((h, i) => [h, i])); continue; }
  if (!line) continue;
  const c = line.split(',');
  if (c.length !== header.length) { badCols++; continue; }
  rows++;
  const action = c[ix['action_taken']];
  const key = [c[ix['state_code']], c[ix['county_code']], c[ix['loan_type']], c[ix['construction_method']], c[ix['lien_status']],
    c[ix['occupancy_type']], unitsBucket(c[ix['total_units']]), ageBucket(c[ix['tract_median_age_of_housing_units']])].join('|');
  let v = data.get(key); if (!v) { v = new Array(N).fill(0); data.set(key, v); }
  v[0]++;
  if (action === '3') {
    v[1]++;
    const reasons = [1, 2, 3, 4].map((i) => c[ix[`denial_reason-${i}`]]).filter((r) => r && r !== 'NA');
    if (reasons.includes('1111')) v[13]++;
    if (reasons.includes('4')) v[2]++;
    if (reasons[0] === '4') v[3]++;
    for (const r of new Set(reasons)) { const k = Number(r); if (k >= 1 && k <= 9) v[3 + k]++; }
  }
  if (rows % 250_000 === 0) process.stdout.write(`\rrows ${rows}`);
}
process.stdout.write('\n');
const code = await new Promise<number>((res) => proc.on('close', res));
if (code !== 0) throw new Error(`ABORT: curl exited ${code}`);
console.log(`rows ${rows}, expected ${EXPECTED}, malformed ${badCols}, keys ${data.size}`);
if (rows + badCols !== EXPECTED) throw new Error(`ABORT: streamed ${rows + badCols} rows, the API counts ${EXPECTED}`);
if (badCols / rows > 0.001) throw new Error(`ABORT: ${badCols} malformed rows`);

fs.writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString(), year: YEAR, source: FILE, query: `${API}/nationwide/csv?${QUERY}`,
  expected: EXPECTED, rows, malformed: badCols,
  keyFields: ['state_code', 'county_code', 'loan_type', 'construction_method', 'lien_status', 'occupancy_type', 'units', 'tract_median_housing_age'],
  valueFields: ['applications', 'denied', 'collateral_any', 'collateral_first', 'r1_dti', 'r2_employment', 'r3_credit_history', 'r4_collateral', 'r5_cash', 'r6_unverifiable', 'r7_incomplete', 'r8_mortgage_insurance', 'r9_other', 'denied_reason_exempt'],
  data: Object.fromEntries(data),
}));
console.log(`Wrote ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
