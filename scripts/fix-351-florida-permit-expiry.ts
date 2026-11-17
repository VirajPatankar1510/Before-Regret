// Correct #351 resolve-open-building-permits-before-closing: its comparison table says Florida's lapse rule is
// "Not set in § 553.79". The 2026 Florida Statutes s. 553.79(1)(c) (from HB 803, ch. 2026-63) now sets it for a
// single-family dwelling: "expires 1 year after the issuance of the permit or on the effective date of the next edition
// of the Florida Building Code, whichever is later. However, this paragraph does not prevent a local government from
// extending a building permit beyond the expiration date." Read 2026-11-17 on leg.state.fl.us (Online Sunshine).
// Surgical: two table cells; slug, title, meta untouched. Writes only if the stored body still matches.
//
//   NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts" npx tsx scripts/fix-351-florida-permit-expiry.ts             # dry run
//   APPLY=true NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts" npx tsx scripts/fix-351-florida-permit-expiry.ts  # write
// Live page: needs a rebuild + deploy afterwards (git commit --allow-empty if nothing else changed).
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const APPLY = process.env.APPLY === 'true';
const sql = neon(process.env.DATABASE_URL!);
const EDITS: Array<[string, string]> = [
  ['| When a permit lapses | Not set in § 553.79 |',
   '| When a permit lapses | For a single-family home, 1 year after it was issued or when the next edition of the Florida Building Code takes effect, whichever is later; the local government can extend it |'],
  ['| Sources | Fla. Stat. § 553.79(16)–(17) |', '| Sources | Fla. Stat. § 553.79(1)(c), (16)–(17) |'],
];

const [row] = await sql`SELECT id, slug, body_markdown FROM articles WHERE id = 351 AND slug = 'resolve-open-building-permits-before-closing'`;
if (!row) throw new Error('row not found');
let body: string = row.body_markdown;
for (const [from, to] of EDITS) {
  const n = body.split(from).length - 1;
  if (n !== 1) throw new Error(`expected exactly 1 match, found ${n}: ${from}`);
  body = body.replace(from, to);
}
for (const l of body.split('\n')) if (/When a permit lapses|^\| Sources/.test(l)) console.log('  ' + l);
if (!APPLY) { console.log('DRY RUN -- nothing written'); process.exit(0); }
const res = await sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = 351 AND body_markdown = ${row.body_markdown} RETURNING id`;
if (res.length !== 1) throw new Error('body changed underneath us; nothing written');
console.log('wrote #351');
