// Off-platform data backup for the Neon database.
//
//   npx tsx scripts/backup-db.ts                    # writes ./backups/<timestamp>/
//   npx tsx scripts/backup-db.ts --out /some/dir    # writes somewhere else (e.g. iCloud/Dropbox)
//
// WHY THIS EXISTS, and why it is data-only rather than a pg_dump.
//
// The git repo is not a backup of this site. The code is in git; the CONTENT is not. Every
// published article, every hand-written faq_json entry, and all 100 counties of FEMA/NOAA/Census
// data live only in the hosted Neon instance. Losing that database would leave a working
// application serving an empty site, and the FAQ work in particular is unrecoverable -- it was
// written by hand, article by article, and never existed anywhere else.
//
// A data-only backup is genuinely sufficient here rather than a compromise, because the SCHEMA is
// already in git: ensureArticlesSchema() in src/server/db.ts creates all 16 tables with
// CREATE TABLE IF NOT EXISTS on startup, and that list was verified to match the live database
// exactly. So a restore is: point the app at an empty database, let it build the schema, then
// replay these rows. Nothing about the structure needs capturing.
//
// pg_dump would be the conventional tool and is NOT used deliberately: it is not installed on this
// machine, there is no Homebrew or Docker to install it with, and Neon runs PostgreSQL 18.4 -- so
// it would need v18+ client tooling, meaning a system-level install for a database that is a few
// megabytes and whose schema is already version-controlled. If pg_dump is ever available, it is
// strictly better (constraints, sequences, exact types) and this script should give way to it.
//
// OUTPUT: one directory per run, containing one .jsonl per table (one JSON object per row, so a
// single corrupted line cannot destroy the rest of the file) plus manifest.json recording row
// counts, column lists and the server version. Row counts are re-verified against the database
// after writing -- a backup that silently captured zero rows is worse than no backup, because it
// looks like protection.
//
// SENSITIVE: these files contain real user data (transactions, terms_acceptances,
// generated_reports, Clerk user ids on the ad-order tables). ./backups/ is gitignored. If you copy
// a backup somewhere else, treat it with the same care as the database itself.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { withDb, isDbConfigured } from '../src/server/db.js';

/** The Neon driver returns rows as a bare array for tagged templates but an object with .rows for
 *  sql.query(). Normalising both here rather than assuming one shape -- guessing wrong produced a
 *  count of "1" for every table on the first attempt at this, which looked plausible enough to
 *  nearly ship. */
function rowsOf(result: unknown): any[] {
  if (Array.isArray(result)) return result;
  const r = result as { rows?: any[] };
  return Array.isArray(r?.rows) ? r.rows : [];
}

/** JSON.stringify cannot serialise a bigint and throws. Postgres int8 columns can arrive as one,
 *  so they are written as strings rather than silently losing the row -- and rather than coercing
 *  to Number, which would quietly corrupt anything past 2^53. */
function replacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') return value.toString();
  return value;
}

async function main() {
  if (!isDbConfigured()) {
    console.error('[backup] DATABASE_URL is not set -- nothing to back up.');
    process.exit(1);
  }

  const outIdx = process.argv.indexOf('--out');
  const baseDir = outIdx !== -1 && process.argv[outIdx + 1]
    ? path.resolve(process.argv[outIdx + 1])
    : path.join(process.cwd(), 'backups');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const outDir = path.join(baseDir, `beforeregret_${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const version = rowsOf(await withDb((sql) => sql`SELECT version() AS v`))[0]?.v ?? 'unknown';

  // Discovered from the database rather than hardcoded, so a table added later is picked up
  // automatically instead of being silently missed by a stale list.
  const tables = rowsOf(await withDb((sql) => sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)).map((r) => r.table_name as string);

  console.log(`[backup] ${tables.length} tables -> ${outDir}`);

  const manifest: any = { createdAt: new Date().toISOString(), serverVersion: version, tables: {} };
  let grandTotal = 0;
  const problems: string[] = [];

  for (const table of tables) {
    // Table names come from information_schema, not user input, and are double-quoted -- but they
    // still cannot be parameterised, so they are interpolated deliberately and only from that source.
    const rows = rowsOf(await withDb((sql) => sql.query(`SELECT * FROM "${table}"`)));
    const file = path.join(outDir, `${table}.jsonl`);
    fs.writeFileSync(file, rows.map((r) => JSON.stringify(r, replacer)).join('\n') + (rows.length ? '\n' : ''), 'utf8');

    // Independent re-count straight from the database. If this disagrees with what was written,
    // the dump is not trustworthy and the run is marked failed rather than reported as success.
    const verify = rowsOf(await withDb((sql) => sql.query(`SELECT COUNT(*)::int AS n FROM "${table}"`)))[0]?.n;
    const columns = rows.length ? Object.keys(rows[0]) : [];
    manifest.tables[table] = { rows: rows.length, verifiedCount: verify, columns, bytes: fs.statSync(file).size };
    grandTotal += rows.length;

    const ok = verify === rows.length;
    if (!ok) problems.push(`${table}: wrote ${rows.length} but database reports ${verify}`);
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${table.padEnd(32)} ${String(rows.length).padStart(6)} rows  ${(fs.statSync(file).size / 1024).toFixed(1)} kB`);
  }

  manifest.totalRows = grandTotal;
  manifest.ok = problems.length === 0;
  manifest.problems = problems;
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n[backup] ${grandTotal} rows across ${tables.length} tables`);
  if (problems.length) {
    console.error('[backup] FAILED -- counts did not verify:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(`[backup] verified. Written to ${outDir}`);

  // --prune N keeps only the N newest backups in the destination. Deliberately runs ONLY after the
  // verification above passed: deleting good history immediately after a bad run is the one way a
  // retention policy can turn a failure into data loss. Directory names are ISO-ish timestamps, so
  // a lexical sort is chronological.
  const pruneIdx = process.argv.indexOf('--prune');
  const keep = pruneIdx !== -1 ? parseInt(process.argv[pruneIdx + 1] ?? '', 10) : NaN;
  if (Number.isFinite(keep) && keep > 0) {
    const existing = fs.readdirSync(baseDir)
      .filter((d) => d.startsWith('beforeregret_') && fs.statSync(path.join(baseDir, d)).isDirectory())
      .sort();
    const doomed = existing.slice(0, Math.max(0, existing.length - keep));
    for (const d of doomed) {
      fs.rmSync(path.join(baseDir, d), { recursive: true, force: true });
      console.log(`[backup] pruned old backup: ${d}`);
    }
    console.log(`[backup] retention: keeping newest ${keep}, ${existing.length - doomed.length} held`);
  }

  console.log('[backup] NOTE: contains real user data. Keep it as protected as the database itself.');
}

main().catch((e) => { console.error('[backup] FAILED:', e); process.exit(1); });
