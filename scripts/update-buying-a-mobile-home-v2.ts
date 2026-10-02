// Mobile-home guide, revision 2: four additions from an outside review, each verified at a primary source.
//
//   npx tsx scripts/update-buying-a-mobile-home-v2.ts            # dry run
//   APPLY=true npx tsx scripts/update-buying-a-mobile-home-v2.ts
//
// Published earlier the same day (2026-10-02) and not yet indexed, so a content change now costs nothing
// in ranking. Slug, title, meta and quick_answer are untouched; only the body changes.
//
// TAKEN from the review, verified 2026-10-02:
//   - missing label/data plate: Fannie Mae Selling Guide B2-3-02 accepts an IBTS label verification
//     letter or a duplicate data plate (also from the IPIA or manufacturer); without either the loan is
//     not eligible for sale to Fannie Mae. Read on selling-guide.fanniemae.com.
//   - the "moved" rule: same section -- "must not have been previously installed or occupied at any
//     other site or location, except from the manufacturer or the dealer's lot as a new unit". It is a
//     Fannie Mae rule, NOT in 24 CFR 203.43f (read in full), so the page attributes it to Fannie Mae only.
//   - physical checks: 24 CFR 3285.6 (level: 1/4 inch between adjacent piers, doors/windows don't bind),
//     3285.804 (bottom board), 3285.801(e) (mate-line gasket). eCFR, read in full.
//   - polybutylene: a prose link to the existing guide; no claim about which years used it.
// LEFT OUT: the FHA engineer-certification requirement and its "$400-$600" cost (hud.gov returns a
//   Cloudflare block, so the handbook could not be read; the cost had no source at all); "HUD never
//   issues replacement plates" (HUD's own page unreadable -- the Fannie Mae rule says what matters);
//   "1978-1995 PB in manufactured homes" and "#1 point of water intrusion" (no source); an emoji callout
//   box (not the site's style). The permit-history link the review asked for was already there.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'buying-a-mobile-home-what-to-check';
const strip = (raw: string) => raw.replace(/^#\s.*\n+/, '').trim();
const OLD = strip(fs.readFileSync('guides/.buying-a-mobile-home.v1.md', 'utf8'));
const NEW = strip(fs.readFileSync('guides/buying-a-mobile-home.md', 'utf8'));
const REQUIRED = ['Selling Guide B2-3-02', 'IBTS', 'installed or occupied at any other site', '24 CFR 3285.6', '24 CFR 3285.804', '24 CFR 3285.801', '1/4 inch', '/guides/polybutylene-pipes-home-insurance/', 'ever been moved'];
const BANNED = [/\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline)/i, /\$\s?\d/, /#1\b|number one/i];

async function main() {
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  for (const r of REQUIRED) if (!NEW.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) { const m = NEW.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(NEW)) fail('link nested in bold');
  const heads = NEW.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  const row = (await withDb((sql) => sql`SELECT id, status, body_markdown FROM articles WHERE slug = ${SLUG}`) as unknown as any[])[0];
  if (!row || row.status !== 'published') fail('row missing or not published');
  else if (row.body_markdown !== OLD) fail('stored body changed since v1 -- re-read before editing');
  const published = new Set(((await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`)) as unknown as any[]).map((r) => r.slug));
  for (const m of NEW.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  console.log(`  body ${OLD.split(/\s+/).length} -> ${NEW.split(/\s+/).length} words; headings:\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.'); return; }
  // updated_at bumped: these are substantive additions a reader can see.
  const res = (await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${NEW}, updated_at = now()
    WHERE slug = ${SLUG} AND status = 'published' AND body_markdown = ${OLD} RETURNING id`) as unknown as any[]);
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  wrote #${res[0].id}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
