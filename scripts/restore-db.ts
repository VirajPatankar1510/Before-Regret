// Restores a backup produced by scripts/backup-db.ts.
//
//   npx tsx scripts/restore-db.ts backups/beforeregret_2026-08-19_18-52-14            # DRY RUN
//   npx tsx scripts/restore-db.ts backups/beforeregret_... --confirm                  # actually write
//   npx tsx scripts/restore-db.ts backups/beforeregret_... --confirm --force          # allow non-empty tables
//
// DRY RUN IS THE DEFAULT, and --confirm is required to write anything. That asymmetry is
// deliberate: this script's failure mode is overwriting a live database with stale rows, which is
// strictly worse than the disaster it exists to recover from. A restore is run once, under stress,
// usually by someone who has already lost something -- so it refuses by default and reports what it
// WOULD do instead.
//
// SCHEMA IS NOT RESTORED, because it does not need to be: ensureArticlesSchema() in
// src/server/db.ts creates every table on startup (see the long note in backup-db.ts). The intended
// recovery is: provision an empty database, point DATABASE_URL at it, start the app once so the
// schema is built, then run this to replay the rows.
//
// TWO THINGS A NAIVE RESTORE GETS WRONG, both handled below:
//
//  1. Non-empty targets. Inserting into a table that already has rows either duplicates data or
//     collides on the primary key. This refuses unless --force is passed explicitly.
//  2. Sequences. Rows are restored WITH their original ids, which leaves each table's identity
//     sequence still sitting at its initial value -- so the very next insert the app makes collides
//     with a restored row and fails. Every sequence is advanced past the restored maximum at the
//     end. Skipping this produces a database that looks perfectly restored and then breaks on the
//     first write.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { withDb, isDbConfigured } from '../src/server/db.js';

function rowsOf(result: unknown): any[] {
  if (Array.isArray(result)) return result;
  const r = result as { rows?: any[] };
  return Array.isArray(r?.rows) ? r.rows : [];
}

async function main() {
  const dir = process.argv[2];
  const confirm = process.argv.includes('--confirm');
  const force = process.argv.includes('--force');

  if (!dir) {
    console.error('Usage: npx tsx scripts/restore-db.ts <backup-dir> [--confirm] [--force]');
    process.exit(1);
  }
  if (!isDbConfigured()) {
    console.error('[restore] DATABASE_URL is not set.');
    process.exit(1);
  }

  const backupDir = path.resolve(dir);
  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`[restore] No manifest.json in ${backupDir} -- not a backup produced by backup-db.ts.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.ok === false) {
    console.error('[restore] This backup was recorded as FAILED verification. Refusing to restore from it.');
    process.exit(1);
  }

  // Surfaced up front because a restore is usually run in a hurry: it is worth seeing, before
  // anything is written, that this is the backup you meant and not one from months ago.
  console.log(`[restore] backup taken : ${manifest.createdAt}`);
  console.log(`[restore] rows in backup: ${manifest.totalRows}`);
  console.log(`[restore] target        : ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@').slice(0, 90)}`);
  console.log(`[restore] mode          : ${confirm ? (force ? 'WRITE (--force: will insert into non-empty tables)' : 'WRITE') : 'DRY RUN (nothing will be written)'}\n`);

  const tables = Object.keys(manifest.tables);
  let blocked = 0;

  for (const table of tables) {
    const file = path.join(backupDir, `${table}.jsonl`);
    const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
    const rows = raw ? raw.split('\n').map((l) => JSON.parse(l)) : [];
    const existing = rowsOf(await withDb((sql) => sql.query(`SELECT COUNT(*)::int AS n FROM "${table}"`)))[0]?.n ?? 0;

    if (rows.length === 0) {
      console.log(`  skip  ${table.padEnd(32)} (backup has no rows)`);
      continue;
    }
    if (existing > 0 && !force) {
      console.log(`  BLOCK ${table.padEnd(32)} target already has ${existing} rows -- pass --force to insert anyway`);
      blocked++;
      continue;
    }
    if (!confirm) {
      console.log(`  would ${table.padEnd(32)} insert ${rows.length} rows (target currently has ${existing})`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(', ');
    let inserted = 0;
    for (const row of rows) {
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map((c) => {
        const v = row[c];
        // jsonb/json columns arrive from the driver already parsed into objects; they have to go
        // back as serialised text or the driver will reject them as invalid input.
        return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
      });
      await withDb((sql) => sql.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      ));
      inserted++;
    }
    console.log(`  ok    ${table.padEnd(32)} inserted ${inserted} rows`);
  }

  if (confirm) {
    // See note 2 at the top -- without this the restore looks clean and then fails on first write.
    console.log('\n[restore] advancing identity sequences past restored ids...');
    for (const table of tables) {
      try {
        await withDb((sql) => sql.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)
          WHERE pg_get_serial_sequence('"${table}"', 'id') IS NOT NULL
        `));
      } catch {
        // Tables without an integer id column simply have no sequence to advance.
      }
    }
    console.log('[restore] done.');
  } else {
    console.log(`\n[restore] DRY RUN complete -- nothing was written.${blocked ? ` ${blocked} table(s) would be blocked as non-empty.` : ''}`);
    console.log('[restore] Re-run with --confirm to apply.');
  }
}

main().catch((e) => { console.error('[restore] FAILED:', e); process.exit(1); });
