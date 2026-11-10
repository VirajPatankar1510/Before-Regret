// #307 prove-roof-age-for-insurance: correct one clause that said Texas buyers have no statutory right on roof age.
// 28 TAC § 21.1006(b) bars declining to write a policy based on the age of the property or its components;
// (d) keeps declining on physical condition. Source quotes: data/fact-ledgers/home-insurance-roof-age-law-by-state.json f15/f16.
// Owner OK 2026-11-10 ("fix the Texas line"). Surgical: only the clause after the comma changes; slug/title/status untouched.
//
//   npx tsx scripts/fix-307-texas-line.ts            # dry run
//   APPLY=true npx tsx scripts/fix-307-texas-line.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ID = 307;
const SLUG = 'prove-roof-age-for-insurance';
const OLD = 'so in Texas, Oklahoma, Louisiana or Colorado you are dealing with carrier underwriting rules rather than a statutory right, and the answer varies by carrier rather than by law.';
const NEW = 'so outside Florida, the rules are usually narrower: Texas, for example, bars declining a policy over the age of the property or its components, but an insurer can still decline over condition.';

async function main() {
  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles WHERE id = ${ID}`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const r = rows[0];
  if (!r || r.slug !== SLUG || r.status !== 'published') throw new Error(`#${ID} is not the expected published guide`);
  const hits = r.body_markdown.split(OLD).length - 1;
  if (hits !== 1) throw new Error(`old clause found ${hits} times -- nothing written`);
  const after = r.body_markdown.replace(OLD, NEW);
  const i = after.indexOf(NEW);
  console.log(after.slice(after.lastIndexOf('\n', i) + 1, after.indexOf('\n', i)));
  if (!APPLY) { console.log('\nDRY RUN -- check passes.'); return; }
  const res = (await withDb((sql) => sql`UPDATE articles SET body_markdown = ${after} WHERE id = ${ID} AND body_markdown = ${r.body_markdown} RETURNING id`)) as unknown as Array<{ id: number }>;
  console.log(res.length === 1 ? `wrote #${ID}` : `SKIPPED #${ID}: body changed since check`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
