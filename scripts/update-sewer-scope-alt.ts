// Guide #339 sewer-scope-before-buying-house: swap the diagram's alt text after the diagram was revised to the
// owner's spec (2026-10-18). The row was inserted before the revision; this is the only change. Exact-match guard.
//   npx tsx scripts/update-sewer-scope-alt.ts   (APPLY=true to write)
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import { withDb } from '../src/server/db.js';
const [OLD, NEW] = fs.readFileSync(process.argv[2], 'utf8').split('\n@@@\n');
const [row] = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = 'sewer-scope-before-buying-house'`)) as unknown as Array<{ id: number; body_markdown: string }>;
const n = row.body_markdown.split(OLD).length - 1;
if (n !== 1) throw new Error(`ABORT: old alt found ${n} times`);
const md = fs.readFileSync('guides/sewer-scope-before-buying-house.md', 'utf8');
const next = row.body_markdown.replace(OLD, NEW);
if (!md.includes(next.slice(0, 400))) console.log('  note: compare with the .md draft');
console.log(`  #${row.id}: alt text swapped (${OLD.length} -> ${NEW.length} chars)`);
if (process.env.APPLY === 'true') {
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE id = ${row.id}`);
  console.log('  wrote');
}
