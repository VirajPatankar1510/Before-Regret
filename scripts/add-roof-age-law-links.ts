// Links from #307 and #329 into the roof-age law guide (#349), which compares the state laws both pages mention.
// Owner OK 2026-11-10 ("yes, add the links to #307 and #329"). Links only: #307's Texas sentence is NOT changed here.
// Each anchor is a phrase the page already uses about state roof rules; no prose is added.
//
//   npx tsx scripts/add-roof-age-law-links.ts            # dry run
//   APPLY=true npx tsx scripts/add-roof-age-law-links.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/home-insurance-roof-age-law-by-state/';
const EDITS: Array<{ id: number; slug: string; anchor: string }> = [
  { id: 307, slug: 'prove-roof-age-for-insurance', anchor: 'equivalent provision' },
  { id: 329, slug: 'home-insurance-cancelled-after-buying-house-roof', anchor: 'roof-specific rule' },
];

async function main() {
  let bad = 0;
  const updates: Array<{ id: number; before: string; after: string }> = [];
  for (const e of EDITS) {
    const rows = (await withDb((sql) => sql`SELECT id, slug, status, body_markdown FROM articles WHERE id = ${e.id}`)) as unknown as Array<{ id: number; slug: string; status: string; body_markdown: string }>;
    const r = rows[0];
    if (!r || r.slug !== e.slug || r.status !== 'published') { console.log(`FAIL #${e.id}: not the expected published guide`); bad++; continue; }
    const body = r.body_markdown;
    if (body.includes(TARGET)) { console.log(`FAIL #${e.id}: already links to the target`); bad++; continue; }
    const hits = body.split(e.anchor).length - 1;
    if (hits !== 1) { console.log(`FAIL #${e.id}: anchor "${e.anchor}" found ${hits} times`); bad++; continue; }
    const i = body.indexOf(e.anchor);
    const line = body.slice(body.lastIndexOf('\n', i) + 1, body.indexOf('\n', i) === -1 ? body.length : body.indexOf('\n', i));
    const before = body.slice(body.lastIndexOf('\n', i) + 1, i);
    if (line.startsWith('#')) { console.log(`FAIL #${e.id}: anchor sits in a heading`); bad++; continue; }
    if ((before.match(/\*\*/g) ?? []).length % 2 === 1) { console.log(`FAIL #${e.id}: anchor sits inside bold`); bad++; continue; }
    if (/\[[^\]]*$/.test(before)) { console.log(`FAIL #${e.id}: anchor sits inside an existing link`); bad++; continue; }
    const after = body.replace(e.anchor, `[${e.anchor}](${TARGET})`);
    console.log(`\n#${e.id} ${e.slug}\n  before: ${line}\n  after:  ${line.replace(e.anchor, `[${e.anchor}](${TARGET})`)}`);
    updates.push({ id: e.id, before: body, after });
  }
  if (bad) { console.log(`\n${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\nDRY RUN -- all checks pass.'); return; }
  for (const u of updates) {
    // Guarded: only writes if the body is still exactly what we checked. slug, title, status, updated_at untouched.
    const res = (await withDb((sql) => sql`UPDATE articles SET body_markdown = ${u.after} WHERE id = ${u.id} AND body_markdown = ${u.before} RETURNING id`)) as unknown as Array<{ id: number }>;
    console.log(res.length === 1 ? `  wrote #${u.id}` : `  SKIPPED #${u.id}: body changed since check`);
  }
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
