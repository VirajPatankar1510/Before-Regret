// Add the batch B restores (Manhattan, Sacramento) to the permits hub's county list, the one
// place every county guide is linked from (look-up-building-permits-by-address). Appended after the
// last entry, as batch A was. updated_at is not bumped: list lines are not a content update.
//   npx tsx scripts/add-batch-b-to-permit-hub.ts            # dry run
//   APPLY=true npx tsx scripts/add-batch-b-to-permit-hub.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const AFTER = '- [Santa Clara County, CA (San José)](/guides/check-building-permits-santa-clara-county-ca/)';
const LINES = [
  '- [New York County, NY (Manhattan)](/guides/check-building-permits-manhattan-ny/)',
  '- [Sacramento County, CA](/guides/check-building-permits-sacramento-county-ca/)',
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
