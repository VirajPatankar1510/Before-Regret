// Harris County guide: retitle to the pattern Google shows, and repair the office it points to.
//
//   npx tsx scripts/harris-retitle-and-oce-fix.ts            # dry run
//   APPLY=true npx tsx scripts/harris-retitle-and-oce-fix.ts
//
// THE TITLE (a single-variable test, 2026-10-02). Every county permit guide is now shown by Google
// at average positions 7-12 -- except this one, indexed (crawled 2026-09-29) with ZERO impressions
// in 28 days. It is also the only one framed "...Permit History Before Buying"; the shown ones say
// "Permit Search" / "Permits:" plus the portal names, which is how a navigating searcher phrases it.
// So the title moves to that pattern and nothing else in the head changes: slug, meta and
// quick_answer are untouched. Read the result after ~5 weeks (the restored counties needed that).
//
// THE CORRECTION. The article's only portal link, eng.hctx.net/permits, now redirects to the home
// page of the renamed Office of the County Engineer -- not to anything about permits -- and the
// content audit could not see it because the redirect ends on a 200. Verified in a browser
// 2026-10-02: the permits page is oce.harriscountytx.gov/Services/Permits (OCE Permits Search Tool,
// "Check Project Status" in ePermits at epermits.harriscountytx.gov). "ePermits" is therefore
// confirmed as the county system's name and may go in the title. The City of Houston's own portal
// name ("iPermits" in the body) could NOT be verified -- houstonpermittingcenter.org answers with
// a Cloudflare challenge, which is not bypassed -- so it stays out of the title and is left as is.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ID = 78;
const SLUG = 'check-harris-county-permit-history-before-buying';
const OLD_TITLE = 'Harris County & Houston Permit History Before Buying';
const NEW_TITLE = 'Harris County Permit Search: ePermits & City of Houston';

const BODY_EDITS: Array<[string, string]> = [
  [
    'the Harris County Engineering Department (Permitting Division) oversees development.',
    'the Harris County Office of the County Engineer, through its Permits Division, oversees development.',
  ],
  [
    'submit a property search through the Harris County Engineering Department ePermits system.',
    "search the Office of the County Engineer's ePermits system.",
  ],
  [
    'Harris County Engineering handles permits for **unincorporated** parts of the county. Its permit pages are at [Harris County Engineering Department permits](https://www.eng.hctx.net/permits).',
    "Harris County's Office of the County Engineer handles permits for **unincorporated** parts of the county. Its [permits page](https://oce.harriscountytx.gov/Services/Permits) has the OCE Permits Search Tool and a Check Project Status lookup in ePermits.",
  ],
];
const FAQ_EDIT: [string, string] = [
  "Harris County Engineering Department's permitting division oversees development.",
  "Harris County Office of the County Engineer's Permits Division oversees development.",
];

async function main() {
  if (NEW_TITLE.length > 60) throw new Error(`title ${NEW_TITLE.length} chars`);
  const row = (await withDb((sql) => sql`SELECT id, slug, status, title, body_markdown, faq_json FROM articles WHERE id = ${ID}`) as unknown as any[])[0];
  if (!row || row.slug !== SLUG || row.status !== 'published') throw new Error('ABORT: row is not the published Harris guide');
  if (row.title !== OLD_TITLE) throw new Error(`ABORT: title changed since read: "${row.title}"`);

  let body: string = row.body_markdown;
  for (const [from, to] of BODY_EDITS) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`ABORT: body anchor matched ${n} times: "${from.slice(0, 60)}"`);
    body = body.replace(from, to);
  }
  if (body.includes('eng.hctx.net')) throw new Error('ABORT: old link survives');
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) throw new Error('ABORT: nested bold link');

  const faqText: string = typeof row.faq_json === 'string' ? row.faq_json : JSON.stringify(row.faq_json);
  const nf = faqText.split(FAQ_EDIT[0]).length - 1;
  if (nf !== 1) throw new Error(`ABORT: FAQ anchor matched ${nf} times`);
  const faqNew = faqText.replace(FAQ_EDIT[0], FAQ_EDIT[1]);
  JSON.parse(faqNew); // still valid JSON

  console.log(`  title  ${OLD_TITLE}\n      -> ${NEW_TITLE} (${NEW_TITLE.length})`);
  for (const [, to] of BODY_EDITS) console.log(`  body + ${to.slice(0, 110)}…`);
  console.log(`  faq  + ${FAQ_EDIT[1]}`);
  if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); return; }

  fs.mkdirSync('backups', { recursive: true });
  const bk = `backups/harris-before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(bk, JSON.stringify(row, null, 2));
  // updated_at IS bumped: a dead link and a renamed office are corrections a reader can see, so
  // "Updated" is true here (unlike the link-only edits in scripts/link-walk-away-guide.ts).
  const res = (await withDb((sql) => sql`
    UPDATE articles SET title = ${NEW_TITLE}, body_markdown = ${body}, faq_json = ${faqNew}, updated_at = now()
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' RETURNING id`) as unknown as any[]);
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  backup ${bk}\n  wrote #${ID}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
