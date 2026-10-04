// Inbound link for how-to-tell-how-old-a-roof-is (2026-10-04). suggest-inbound-links found no
// distinctive title terms, so the anchor was placed by hand: the permit hub's only sentence about a
// roof's age already says "how old the roof is", which is exactly what the new guide answers.
//   npx tsx scripts/link-roof-age-guide.ts          # dry run
//   APPLY=true npx tsx scripts/link-roof-age-guide.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const SLUG = 'look-up-building-permits-by-address';
const FROM = 'carriers now routinely ask buyers to prove how old the roof is, and';
const TO = 'carriers now routinely ask buyers to prove [how old the roof is](/guides/how-to-tell-how-old-a-roof-is/), and';

(async () => {
  const [row] = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = ${SLUG} AND status = 'published'`)) as any[];
  if (!row) throw new Error('hub not found');
  const n = row.body_markdown.split(FROM).length - 1;
  if (n !== 1) throw new Error(`anchor matched ${n} times, expected exactly 1 -- nothing written`);
  const next = row.body_markdown.replace(FROM, TO);
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(next)) throw new Error('link nested in bold');
  console.log(`  ${SLUG}: ...${TO}...`);
  if (process.env.APPLY !== 'true') { console.log('  DRY RUN'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE id = ${row.id} AND body_markdown = ${row.body_markdown}`);
  console.log('  written');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
