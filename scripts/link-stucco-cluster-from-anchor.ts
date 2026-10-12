// Link the EIFS evaluation guide (the stucco cluster's anchor, 620 Google impressions in 28 days)
// to the three new stucco guides. Owner OK 2026-10-12 ("add the links").
//
//   npx tsx scripts/link-stucco-cluster-from-anchor.ts            # dry run
//   APPLY=true npx tsx scripts/link-stucco-cluster-from-anchor.ts
//
// Each link sits on words the anchor ALREADY uses about the target (suggest-inbound-links.ts found
// no other guide discussing these subjects). Anchor texts are all different. Nothing else in the row
// changes: no slug, title, meta or status write. Every target must be published before this runs.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ANCHOR = 'standard-home-inspection-check-eifs-stucco-moisture';

// [the unique sentence fragment it must find, the words inside it to link, the target slug]
const LINKS: Array<[string, string, string]> = [
  ['differs fundamentally from traditional hard-coat stucco, which', 'traditional hard-coat stucco', 'eifs-vs-stucco-how-to-tell'],
  ['If you are considering a home clad in synthetic stucco, do not', 'considering a home clad in synthetic stucco', 'buy-house-with-eifs-stucco'],
  ['Contact a certified EIFS moisture inspector—typically', 'certified EIFS moisture inspector', 'how-to-choose-eifs-stucco-inspector'],
];

async function main() {
  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles WHERE status = 'published'`)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bySlug = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  let body = bySlug.get(ANCHOR);
  if (!body) throw new Error(`ABORT: ${ANCHOR} is not published`);
  const before = body;
  for (const [fragment, words, target] of LINKS) {
    if (!bySlug.has(target)) {
      if (APPLY) throw new Error(`ABORT: ${target} is not published`);
      console.log(`  (dry run: ${target} is not published yet; it must be before APPLY)`);
    }
    if (body.includes(`/guides/${target}/`)) throw new Error(`ABORT: anchor already links ${target}`);
    const count = body.split(fragment).length - 1;
    if (count !== 1) throw new Error(`ABORT: fragment matched ${count} times: "${fragment}"`);
    if (!fragment.includes(words)) throw new Error(`ABORT: "${words}" is not inside its fragment`);
    const linked = fragment.replace(words, `[${words}](/guides/${target}/)`);
    body = body.replace(fragment, linked);
    console.log(`  + ${target}\n      ${linked}`);
  }
  if (/\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/.test(body)) throw new Error('ABORT: a link would sit inside bold');
  if (body.length - before.length !== LINKS.reduce((n, [, w, t]) => n + `[](/guides/${t}/)`.length, 0)) {
    throw new Error('ABORT: the body changed by more than the link markup');
  }
  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  const updated = await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${body}, updated_at = now()
    WHERE slug = ${ANCHOR} AND body_markdown = ${before} RETURNING id`);
  if ((updated as unknown[]).length !== 1) throw new Error('ABORT: the anchor changed since it was read; nothing written');
  console.log(`\n  wrote 3 links into ${ANCHOR}\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
