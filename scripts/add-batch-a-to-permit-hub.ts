// Add the batch A restores (Brooklyn, Broward, Santa Clara) to the permits hub's county list, the one
// place every county guide is linked from (look-up-building-permits-by-address). Appended after the
// last entry, as Hillsborough was. updated_at is not bumped: list lines are not a content update.
//   npx tsx scripts/add-batch-a-to-permit-hub.ts            # dry run
//   APPLY=true npx tsx scripts/add-batch-a-to-permit-hub.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const AFTER = '- [Hillsborough County, FL (Tampa)](/guides/check-building-permits-hillsborough-county-fl/)';
const LINES = [
  '- [Kings County, NY (Brooklyn)](/guides/check-building-permits-brooklyn-ny/)',
  '- [Broward County, FL (Fort Lauderdale)](/guides/check-building-permits-broward-county-fl/)',
  '- [Santa Clara County, CA (San José)](/guides/check-building-permits-santa-clara-county-ca/)',
];
const row = (await withDb((sql) => sql`SELECT body_markdown FROM articles WHERE slug = 'look-up-building-permits-by-address' AND status = 'published'`) as unknown as any[])[0];
const body: string = row.body_markdown;
if (body.split(AFTER).length - 1 !== 1) throw new Error('ABORT: anchor line not found exactly once');
for (const l of LINES) if (body.includes(l.match(/\(([^)]+)\)$/)![1])) throw new Error(`ABORT: already linked: ${l}`);
const next = body.replace(AFTER, `${AFTER}\n${LINES.join('\n')}`);
console.log(LINES.map((l) => `  + ${l}`).join('\n'));
if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); process.exit(0); }
const res = (await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next} WHERE slug = 'look-up-building-permits-by-address' AND status = 'published' AND body_markdown = ${body} RETURNING id`) as unknown as any[]);
if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
console.log('\n  wrote hub');
