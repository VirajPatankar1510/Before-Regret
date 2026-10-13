// One-line correction on guide #24 (owner OK 2026-10-14): "How we checked this" said ASTM marks D3309-96a as
// "historical". True of the 1996 edition's page only; the last edition, D3309-96a(2002), is "Withdrawn, No
// replacement" (2010). Asserts the exact stored sentence before writing. Dry run unless APPLY=true.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const OLD = "ASTM's listing for D3309-96a, which ASTM now marks as a historical standard.";
const NEW = "[ASTM's listing for D3309-96a(2002)](https://store.astm.org/d3309-96ar02.html), which says the standard was withdrawn in 2010 with no replacement.";

const [row] = (await withDb((sql) => sql`SELECT body_markdown FROM articles WHERE id = 24 AND slug = 'spot-polybutylene-pipes-before-buying-house' AND status = 'published'`)) as unknown as Array<{ body_markdown: string }>;
if (!row) throw new Error('ABORT: row 24 not found');
const n = row.body_markdown.split(OLD).length - 1;
if (n !== 1) throw new Error(`ABORT: expected the old sentence once, found ${n}`);
const body = row.body_markdown.replace(OLD, NEW);
console.log(body.slice(body.indexOf('- **What we read.**'), body.indexOf('- **What we left out.**')));
if (process.env.APPLY !== 'true') { console.log('DRY RUN'); process.exit(0); }
await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = 24`);
console.log('updated #24');
