// Display test for the Plumber trade in Report Ads -- runs ONLY against a Neon branch, never production.
//
//   1. Create a branch in the Neon console and put its connection string in .env.local as DATABASE_URL.
//   2. npx tsx scripts/test-plumber-report-ad-display.ts
//
// What it does, all on the branch:
//   - seeds one clearly labelled TEST order + three TEST Plumber purchases (no PayPal, no money);
//   - starts this app locally on port 3005 against the branch, with GEMINI_API_KEY blanked so every
//     report takes the deterministic fallback path (no AI cost; vendor attachment is identical on both
//     paths -- see server.ts, the two buildInspectionPrioritiesForReport call sites);
//   - requests reports for one address at three build years and checks where the plumber appears:
//       1955 -> beside galvanized_supply (houses 1800-1969)
//       1985 -> beside polybutylene_supply (houses 1978-1996)
//       2005 -> nowhere (no plumbing item applies), which is the honest limit to tell plumbers.
//   - leaves the server running (Ctrl+C to stop) so the report can be opened in a browser.
//
// GUARD: refuses to run if .env.local is missing, or if its DATABASE_URL points at the same Neon
// endpoint as .env (production). A test vendor in production would appear in real customers' reports.

import fs from 'node:fs';
import { spawn } from 'node:child_process';

const parse = (f: string) => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n')
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
if (!fs.existsSync('.env.local')) throw new Error('ABORT: no .env.local -- create a Neon branch and put its DATABASE_URL there first');
const prod = parse('.env').DATABASE_URL, branch = parse('.env.local').DATABASE_URL;
const endpoint = (u?: string) => (u ?? '').match(/@([^./?]+)/)?.[1];
if (!branch) throw new Error('ABORT: .env.local has no DATABASE_URL');
if (!endpoint(branch) || endpoint(branch) === endpoint(prod)) throw new Error('ABORT: .env.local points at the production endpoint -- refusing');
process.env.DATABASE_URL = branch;
console.log(`  branch endpoint ${endpoint(branch)} (production is ${endpoint(prod)}) -- OK, not production`);

await import('./lib/neon-curl.js');
const { withDb } = await import('../src/server/db.js');

const TEST_NAME = 'TEST - Display Check Plumbing';
const ZIPS = ['89104', '89121', '89123']; // Las Vegas
const ADDRESS = { address: '1300 S 9th St', city: 'Las Vegas', state: 'NV', zipCode: '89104', county: 'Clark' };
const PORT = 3005;

// --- seed (idempotent: clears any earlier TEST rows on the branch first) ---
await withDb((sql) => sql`DELETE FROM zip_ad_purchases WHERE business_name = ${TEST_NAME}`);
await withDb((sql) => sql`DELETE FROM zip_ad_orders WHERE business_name = ${TEST_NAME}`);
const [order] = (await withDb((sql) => sql`
  INSERT INTO zip_ad_orders (paypal_order_id, business_name, trade_category, zip_code, phone, website, contact_email, amount_usd, status, zip_codes_json, licence_number)
  VALUES (${'TEST-DISPLAY-' + Date.now()}, ${TEST_NAME}, 'Plumber', ${ZIPS[0]}, '(702) 555-0100', 'https://example.com', 'test@example.com', 29, 'test', ${JSON.stringify(ZIPS)}, 'TEST-0000')
  RETURNING id`)) as unknown as Array<{ id: number }>;
for (const z of ZIPS) {
  await withDb((sql) => sql`
    INSERT INTO zip_ad_purchases (order_id, zip_code, trade_category, business_name, phone, website, paid_through, licence_number)
    VALUES (${order.id}, ${z}, 'Plumber', ${TEST_NAME}, '(702) 555-0100', 'https://example.com', now() + interval '1 day', 'TEST-0000')`);
}
console.log(`  seeded order #${order.id} + ${ZIPS.length} Plumber purchases (${ZIPS.join(', ')}) on the branch`);

// --- start the app against the branch, no Gemini ---
const server = spawn('npx', ['tsx', 'server.ts'], {
  env: { ...process.env, DATABASE_URL: branch, GEMINI_API_KEY: '', PORT: String(PORT), PAYPAL_MODE: 'sandbox' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', (d) => { const s = String(d); if (/error/i.test(s)) process.stderr.write(`  [server] ${s}`); });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://localhost:${PORT}/robots.txt`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}

let bad = 0;
for (const [year, expectItem] of [[1955, 'galvanized_supply'], [1985, 'polybutylene_supply'], [2005, null]] as const) {
  const res = await fetch(`http://localhost:${PORT}/api/property/generate-report`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ADDRESS, yearBuilt: year, propertyType: 'Single Family', declaredPropertyType: 'single_family', attestedAccurate: true }),
  });
  const body: any = await res.json().catch(() => ({}));
  const report = body.report ?? body;
  if (!res.ok || !report?.inspectionPriorities) { console.log(`  ${year}: request failed (${res.status}) ${JSON.stringify(body).slice(0, 300)}`); bad++; continue; }
  const hits = (report.inspectionPriorities.priorities ?? []).filter((p: any) => (p.sponsoredVendors ?? []).some((v: any) => v.businessName === TEST_NAME)).map((p: any) => p.id);
  const elsewhere = JSON.stringify({ ...report, inspectionPriorities: undefined }).includes(TEST_NAME);
  const ok = expectItem ? hits.length === 1 && hits[0] === expectItem && !elsewhere : hits.length === 0 && !elsewhere;
  if (!ok) bad++;
  console.log(`  ${year}: plumber shown beside [${hits.join(', ') || 'nothing'}]${elsewhere ? ' + elsewhere' : ''}  expected ${expectItem ?? 'nothing'}  ${ok ? 'PASS' : 'FAIL'}  report ${report.id ?? '?'}`);
}
console.log(bad ? `\n  ${bad} check(s) failed.` : '\n  All display checks passed.');
console.log(`  Server still running at http://localhost:${PORT} against the BRANCH -- Ctrl+C to stop.`);
