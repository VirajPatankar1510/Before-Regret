// Two bridge links into the EIFS evaluation guide (#31), from the two EIFS pages that did not link to it yet.
// Owner OK 2026-11-10 ("add the two links"), after the topical-bridges analysis: the other EIFS pages already link to #31.
// Each anchor is a phrase the page already uses about the evaluation; no prose is added.
//
//   npx tsx scripts/add-eifs-evaluation-bridge-links.ts            # dry run
//   APPLY=true npx tsx scripts/add-eifs-evaluation-bridge-links.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/standard-home-inspection-check-eifs-stucco-moisture/';
const EDITS: Array<{ id: number; slug: string; anchor: string }> = [
  { id: 333, slug: 'stucco-repair-before-buying-house', anchor: 'specialist moisture survey' },
  { id: 334, slug: 'dryvit-house-what-it-means-buyer', anchor: 'earlier moisture report' },
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
