// Inbound links for accela-citizen-access-permit-search (2026-10-04). Each anchor is a phrase the county
// guide ALREADY uses about Accela, so no sentence is invented to carry a link. Anchors vary per page.
//   npx tsx scripts/link-accela-guide.ts          # dry run
//   APPLY=true npx tsx scripts/link-accela-guide.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const URL = '/guides/accela-citizen-access-permit-search/';
const EDITS: Array<[string, string, string]> = [
  ['check-building-permits-san-bernardino-county-ca', 'powered by the Accela Citizen Access platform', 'powered by the [Accela Citizen Access platform](URL)'],
  ['check-building-permits-tarrant-county-tx', 'Fort Worth uses an online platform powered by Accela,', 'Fort Worth uses an online platform [powered by Accela](URL),'],
  ['check-building-permits-riverside-county-ca', 'often operate on platforms like Accela or custom municipal databases', 'often operate on [platforms like Accela](URL) or custom municipal databases'],
  ['check-building-permits-san-diego-county-ca', 'often powered by Accela or EnerGov software platforms', 'often powered by [Accela](URL) or EnerGov software platforms'],
  ['check-building-permits-hillsborough-county-fl', "through the city's Accela Citizen Access portal.", "through the city's [Accela Citizen Access](URL) portal."],
];

(async () => {
  let bad = 0;
  for (const [slug, from, toRaw] of EDITS) {
    const to = toRaw.replace('URL', URL);
    const [row] = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = ${slug} AND status = 'published'`)) as any[];
    if (!row) { console.log(`  FAIL ${slug}: not found`); bad++; continue; }
    const n = row.body_markdown.split(from).length - 1;
    const already = row.body_markdown.includes(URL);
    const i = row.body_markdown.indexOf(from);
    const insideLink = i >= 0 && /\[[^\]]*$/.test(row.body_markdown.slice(Math.max(0, i - 120), i));
    if (n !== 1 || already || insideLink) { console.log(`  FAIL ${slug}: matches=${n} alreadyLinked=${already} insideLink=${insideLink}`); bad++; continue; }
    const next = row.body_markdown.replace(from, to);
    if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(next)) { console.log(`  FAIL ${slug}: nested bold`); bad++; continue; }
    console.log(`  ok  ${slug}: ...${to}...`);
    if (process.env.APPLY === 'true') {
      await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE id = ${row.id} AND body_markdown = ${row.body_markdown}`);
    }
  }
  console.log(bad ? `\n  ${bad} problem(s)` : process.env.APPLY === 'true' ? '\n  written' : '\n  DRY RUN');
  if (bad) process.exit(1);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
