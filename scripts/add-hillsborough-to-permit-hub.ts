// Add the restored Hillsborough guide to the permits hub's county list, the one place every county
// guide is linked from (look-up-building-permits-by-address). Appended after the last entry, as the
// five September restores were. updated_at is not bumped: one list line is not a content update.
//   npx tsx scripts/add-hillsborough-to-permit-hub.ts            # dry run
//   APPLY=true npx tsx scripts/add-hillsborough-to-permit-hub.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
const APPLY = process.env.APPLY === 'true';
const AFTER = '- [Tarrant County, TX (Fort Worth)](/guides/check-building-permits-tarrant-county-tx/)';
const LINE = '- [Hillsborough County, FL (Tampa)](/guides/check-building-permits-hillsborough-county-fl/)';
const row = (await withDb((sql) => sql`SELECT body_markdown FROM articles WHERE slug = 'look-up-building-permits-by-address' AND status = 'published'`) as unknown as any[])[0];
const body: string = row.body_markdown;
if (body.includes('check-building-permits-hillsborough-county-fl')) { console.log('already linked'); process.exit(0); }
if (body.split(AFTER).length !== 2) throw new Error('ABORT: anchor line not found exactly once');
const next = body.replace(AFTER, `${AFTER}\n${LINE}`);
console.log(`  + ${LINE}`);
if (!APPLY) { console.log('DRY RUN'); process.exit(0); }
const res = (await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next} WHERE slug = 'look-up-building-permits-by-address' AND status = 'published' RETURNING id`) as unknown as any[]);
if (res.length !== 1) throw new Error('ABORT: update affected ' + res.length);
console.log('  wrote hub');
