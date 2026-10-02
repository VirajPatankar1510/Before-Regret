// One inbound link into the new manufactured-home guide, from the only guide that already discusses it.
//
//   npx tsx scripts/link-mobile-home-guide.ts            # dry run
//   APPLY=true npx tsx scripts/link-mobile-home-guide.ts
//
// suggest-inbound-links found no anchor inside the new manufactured-housing cluster (it has one
// member). The San Bernardino guide's "Manufactured Homes in Desert Communities" section already says
// the structure itself is "governed by federal regulations" -- exactly what the new guide explains
// (the label and data plate under 24 CFR Part 3280) -- so the existing words carry the link and no
// sentence is added. Link-only: updated_at is NOT bumped (same as scripts/link-walk-away-guide.ts).

import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ID = 215;
const SLUG = 'check-building-permits-san-bernardino-county-ca';
const TARGET = '/guides/buying-a-mobile-home-what-to-check/';
const FROM = 'the construction standards for the manufactured structure itself are governed by federal regulations [HUD].';
const TO = `the construction standards for the manufactured structure itself are governed by [federal regulations](${TARGET}) [HUD].`;

async function main() {
  const row = (await withDb((sql) => sql`SELECT id, slug, status, body_markdown FROM articles WHERE id = ${ID}`) as unknown as any[])[0];
  if (!row || row.slug !== SLUG || row.status !== 'published') throw new Error('ABORT: row is not the published San Bernardino guide');
  const body: string = row.body_markdown;
  if (body.includes(TARGET)) { console.log('already linked -- nothing to do'); return; }
  const n = body.split(FROM).length - 1;
  if (n !== 1) throw new Error(`ABORT: anchor sentence matched ${n} times`);
  const next = body.replace(FROM, TO);
  console.log(`  - ${FROM}\n  + ${TO}`);
  if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); return; }
  const res = (await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${next}
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' AND body_markdown = ${body} RETURNING id`) as unknown as any[]);
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  wrote #${ID}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
