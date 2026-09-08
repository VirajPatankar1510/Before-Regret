// Restores should-buy-house-s-already-had-foundation-repair, cut in the 2026-09-02 prune.
//
//   npx tsx scripts/restore-foundation-repair-guide.ts            # dry run
//   APPLY=true npx tsx scripts/restore-foundation-repair-guide.ts
//
// -------------------------------------------------------------------------------------------
// THE EVIDENCE IS THIN AND SHOULD BE SAID SO.
//
// The earlier restores were driven by measurement: pages Google still ranked page one for after
// they had been pulled. This one has none of that. Across 90 days, BOTH foundation guides have
// zero Google impressions and zero Bing impressions -- the removed one and the surviving
// when-foundation-crack-need-structural-engineer alike.
//
// That is weak evidence rather than evidence against. The page was live for 17 days on a domain
// three weeks old, which is not long enough for absence of impressions to mean anything, and the
// live sibling's identical silence shows the topic is unproven rather than the page being bad.
// Restoring on editorial judgement is defensible; presenting it as data-driven would not be.
//
// -------------------------------------------------------------------------------------------
// THE 410 IS NOT DRIVEN BY prunedGuides.ts.
//
// server.ts:1620 reads articles.status at request time and answers 410 on 'removed'. The slug list
// in src/data/prunedGuides.ts is documentation and audit input, so flipping the status is what
// actually restores the page. Verified: when-foundation-crack-need-structural-engineer and
// who-s-responsible-shared-well-shared-driveway both serve 200 today while still sitting in
// REMOVED_GUIDE_SLUGS.
//
// WHICH IS A LATENT BUG WORTH FIXING WHILE HERE. Seven slugs in that list are published. Two
// scripts -- fix-restored-guide-links.ts and fix-pruned-internal-links.ts -- build a "gone" set
// from it and would treat a link to any of those seven live pages as dead, and rewrite or strip it.
// Nothing has run them since the restores, so the damage is potential rather than done. This
// script removes all eight (the seven plus this one) so the list means what it says again.
//
// -------------------------------------------------------------------------------------------
// THREE DEFECTS ON THE PAGE ITSELF, fixed as part of bringing it back rather than after.
//
//   1. It had NO inbound and NO outbound internal links. Restored as-is it would be both an orphan
//      and a dead end, the two conditions earlier sessions spent scripts eliminating.
//   2. Its meta is 157 characters against a 155 budget.
//   3. A heading reads "Demystifying the ..." -- a flagged slop marker, and vaguer than what the
//      section actually delivers.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { REMOVED_GUIDE_SLUGS } from '../src/data/prunedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'should-buy-house-s-already-had-foundation-repair';
const SIBLING = 'when-foundation-crack-need-structural-engineer';
const PRUNED_FILE = path.join(process.cwd(), 'src', 'data', 'prunedGuides.ts');

const NEW_META =
  'Past foundation repair can be a smart buy or a costly mistake. How to verify the work, check whether the warranty transfers, and satisfy a lender.';

const HEADING_FROM = '## Demystifying the "Lifetime Warranty"';
const HEADING_TO = '## What a "Lifetime Warranty" Actually Covers';

// Outbound, so the restored page is not a dead end.
const OUTBOUND: Array<{ find: string; add: string }> = [
  {
    find: 'A home inspector can point out cracks in the drywall, sloping floors, or separation around window frames, but they cannot perform the mathematical calculations or deep structural analysis required to verify if a past repair is holding up.',
    add: ' Which cracks justify that escalation in the first place is a separate question, covered in our guide to [when a foundation crack needs a structural engineer](/guides/when-foundation-crack-need-structural-engineer/).',
  },
  {
    find: 'To clear the underwriting conditions, you will need to provide the lender with the past engineering reports, permits, and a certification from a licensed structural engineer stating that the foundation is currently stable and safe for occupancy.',
    add: ' Where a seller cannot produce the permit, the record is a public one — see our guide to [looking up building permits by address](/guides/look-up-building-permits-by-address/).',
  },
];

// Inbound, so it is not an orphan.
const INBOUND = {
  slug: SIBLING,
  find: 'Buying a home with an undiagnosed structural failure can quickly escalate into a financial disaster, with corrective repairs sometimes costing as much as a secondary down payment.',
  add: ' A house whose foundation has already been repaired poses the opposite question, and the answer turns on paperwork rather than on the crack: see [should you buy a house that has had foundation repair](/guides/should-buy-house-s-already-had-foundation-repair/).',
};

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const live = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));

  const row = byslug.get(SLUG);
  if (!row) throw new Error(`ABORT: ${SLUG} has no row at all`);
  if (row.status !== 'removed') throw new Error(`ABORT: ${SLUG} is '${row.status}', expected 'removed'`);
  if (!live.has(SIBLING)) throw new Error(`ABORT: sibling ${SIBLING} is not published`);
  if (!live.has('look-up-building-permits-by-address')) throw new Error('ABORT: permits hub is not published');

  // ---- edits to the restored page --------------------------------------------------------------
  let body: string = row.body_markdown;

  const hn = body.split(HEADING_FROM).length - 1;
  if (hn !== 1) throw new Error(`ABORT: heading matched ${hn} times, expected 1`);
  body = body.replace(HEADING_FROM, HEADING_TO);

  for (const o of OUTBOUND) {
    const n = body.split(o.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: outbound anchor matched ${n} times, expected 1:\n  ${o.find.slice(0, 70)}...`);
    body = body.replace(o.find, o.find + o.add);
  }

  if (NEW_META.length > 155) throw new Error(`ABORT: meta ${NEW_META.length} chars, over 155`);
  if (NEW_META.length < 70) throw new Error(`ABORT: meta only ${NEW_META.length} chars`);
  if (row.title.length > 60) throw new Error(`ABORT: title ${row.title.length} chars, over 60`);
  // The meta promises two specifics; both have to be in the article.
  for (const claim of ['transfer', 'lender']) {
    if (!body.toLowerCase().includes(claim)) throw new Error(`ABORT: meta promises "${claim}" and the body does not cover it`);
  }

  // ---- inbound edit ----------------------------------------------------------------------------
  const host = byslug.get(INBOUND.slug)!;
  const in_n = host.body_markdown.split(INBOUND.find).length - 1;
  if (in_n !== 1) throw new Error(`ABORT: inbound anchor matched ${in_n} times, expected 1`);
  if (host.body_markdown.includes(`/guides/${SLUG}/`)) throw new Error(`ABORT: ${INBOUND.slug} already links to ${SLUG}`);
  const hostBody = host.body_markdown.replace(INBOUND.find, INBOUND.find + INBOUND.add);

  // ---- link integrity, counting the restored page as live --------------------------------------
  const willBeLive = new Set([...live, SLUG]);
  let bad = 0;
  for (const [slug, text] of [[SLUG, body], [INBOUND.slug, hostBody]] as Array<[string, string]>) {
    for (const m of text.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g))
      if (!willBeLive.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${slug} -> ${m[1]}`); bad++; }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g])
      for (const m of text.matchAll(re)) { console.log(`  NESTED LINK: ${slug} -> ${m[0]}`); bad++; }
    if (/\]\(#/.test(text)) { console.log(`  IN-PAGE ANCHOR (no heading ids exist): ${slug}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  // ---- prunedGuides.ts: drop this slug and every stale one -------------------------------------
  const src = fs.readFileSync(PRUNED_FILE, 'utf8');
  const stale = REMOVED_GUIDE_SLUGS.filter((s) => live.has(s));
  const toDrop = [...new Set([...stale, SLUG])];
  let next = src;
  for (const s of toDrop) {
    const line = new RegExp(`^\\s*'${s.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')}',\\n`, 'm');
    if (!line.test(next)) throw new Error(`ABORT: could not find the list entry for ${s}`);
    next = next.replace(line, '');
  }
  const before = (src.match(/^\s*'[a-z0-9-]+',$/gm) || []).length;
  const after = (next.match(/^\s*'[a-z0-9-]+',$/gm) || []).length;
  if (before - after !== toDrop.length) throw new Error(`ABORT: removed ${before - after} entries, expected ${toDrop.length}`);

  // ---- report ----------------------------------------------------------------------------------
  console.log(`\n  RESTORE  /guides/${SLUG}/   (410 -> 200)`);
  console.log(`    title (${row.title.length})  ${row.title}`);
  console.log(`    meta  ${row.meta_description.length} -> ${NEW_META.length}`);
  console.log(`      -  ${row.meta_description}`);
  console.log(`      +  ${NEW_META}`);
  console.log(`    heading  ${HEADING_FROM.slice(3)}  ->  ${HEADING_TO.slice(3)}`);
  console.log(`    body  ${row.body_markdown.length} -> ${body.length} chars`);
  console.log(`    outbound now: ${[...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)/g)].map((m) => m[1]).join(', ')}`);
  console.log(`    inbound  now: ${INBOUND.slug}`);
  console.log(`\n  prunedGuides.ts: dropping ${toDrop.length} entries (${before} -> ${after})`);
  console.log(`    this restore : ${SLUG}`);
  console.log(`    already live : ${stale.join(', ')}`);
  console.log(`      (fix-restored-guide-links.ts and fix-pruned-internal-links.ts build their`);
  console.log(`       "gone" set from this list and would have stripped links to those seven)`);
  console.log(`\n  published library ${live.size} -> ${live.size + 1}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  fs.writeFileSync(PRUNED_FILE, next);
  console.log(`  wrote ${path.relative(process.cwd(), PRUNED_FILE)}`);
  await withDb((sql) => sql`UPDATE articles SET status = 'published', meta_description = ${NEW_META},
    body_markdown = ${body}, published_at = coalesce(published_at, now()), updated_at = now()
    WHERE slug = ${SLUG}`);
  console.log(`  restored ${SLUG}`);
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${hostBody}, updated_at = now()
    WHERE slug = ${INBOUND.slug}`);
  console.log(`  wrote ${INBOUND.slug}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
