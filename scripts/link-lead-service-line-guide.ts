// One inbound link into the lead service line guide, from the only guide that already discusses that pipe.
//
//   npx tsx scripts/link-lead-service-line-guide.ts            # dry run
//   APPLY=true npx tsx scripts/link-lead-service-line-guide.ts
//
// spot-polybutylene-pipes-before-buying-house (id 24) tells the reader to "Examine the water line where it
// enters the home" -- the exact pipe, and the exact check, the new guide covers (EPA's meter / entry-point
// steps plus the utility's record of the line's material). The existing words carry the link; no sentence
// is added. Link-only: updated_at is NOT bumped (same as scripts/link-mobile-home-guide.ts).

import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ID = 24;
const SLUG = 'spot-polybutylene-pipes-before-buying-house';
const TARGET = '/guides/lead-service-line-lookup-by-address/';
const FROM = 'Examine the water line where it enters the home from the ground outside or inside the water meter box near the street.';
const TO = `Examine the [water line where it enters the home](${TARGET}) from the ground outside or inside the water meter box near the street.`;

async function main() {
  const row = (await withDb((sql) => sql`SELECT id, slug, status, body_markdown FROM articles WHERE id = ${ID}`) as unknown as any[])[0];
  if (!row || row.slug !== SLUG || row.status !== 'published') throw new Error('ABORT: row is not the published polybutylene guide');
  const body: string = row.body_markdown;
  if (body.includes(TARGET)) { console.log('already linked -- nothing to do'); return; }
  const n = body.split(FROM).length - 1;
  if (n !== 1) throw new Error(`ABORT: anchor sentence matched ${n} times`);
  const next = body.replace(FROM, TO);
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(next)) throw new Error('ABORT: nested bold link');
  console.log(`  - ${FROM}\n  + ${TO}`);
  if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); return; }
  const res = (await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${next}
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' AND body_markdown = ${body} RETURNING id`) as unknown as any[]);
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  wrote #${ID}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
