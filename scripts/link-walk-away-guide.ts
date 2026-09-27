// Link four guides that already talk about walking away from a purchase to the guide that answers
// exactly that question.
//
//   npx tsx scripts/link-walk-away-guide.ts            # dry run, asserts every match
//   APPLY=true npx tsx scripts/link-walk-away-guide.ts
//
// WHY THIS PAGE, chosen 2026-09-27 from the 28-day page and query data:
// when-reasonable-walk-away-after-inspection is shown for real searches ("when to walk away after
// home inspection", "when to walk away from a house after inspection") at positions 46-60 and
// received ZERO in-prose links -- while nineteen published guides discuss walking away from a
// transaction in their own words. The library already makes the argument; it never pointed at the
// page that finishes it. scripts/suggest-inbound-links.ts missed all nineteen because it keyed on
// the one distinctive word in the slug, "reasonable".
//
// WHY THESE FOUR AND NOT NINETEEN. Over-linking one target from every page is a footprint, and the
// sources are not equal: a link from a page Google shows carries more than one from a page it
// never serves. So the four are the highest-impression sources whose sentence is about the BUYER
// walking away, each with different anchor wording. Deliberately not used:
//   why-cast-iron-pipes-corrode (379 impr)   carries a live test (zero-click-meta-test.json lists it
//                                            as excluded for that reason); editing it spoils a readout
//   the five other experiment pages          same reason
//   seller-back-out-after-accepting...       its sentences are about the SELLER walking away
//   more county permit guides                one (Maricopa) is enough; the same sentence shape on
//                                            four of them would be the footprint
//
// WHY updated_at IS NOT TOUCHED. Every other bulk-link script here bumps it. But GuidePageView shows
// a visible "Updated <date>" whenever updated_at differs from the publish day, and it feeds the
// Article schema's dateModified. Wrapping existing words in a link changes no content a reader can
// see, so announcing an update would be a freshness claim the page cannot back.
//
// No link inside bold, in either direction: parseInline does not recurse, so either form ships as
// literal markdown. Checked below.

import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = 'when-reasonable-walk-away-after-inspection';
const HREF = `/guides/${TARGET}/`;

interface Edit { slug: string; find: string; replace: string }

const EDITS: Edit[] = [
  {
    slug: '100-amp-service-enough-house-re-buying', // 178 impr/28d
    find: 'is not necessarily a reason to walk away from a transaction, but',
    replace: `is not necessarily [a reason to walk away](${HREF}) from a transaction, but`,
  },
  {
    slug: 'check-building-permits-maricopa-county-az', // 92 impr/28d
    find: 'does not automatically require walking away from a transaction, but',
    replace: `does not automatically require [walking away from a transaction](${HREF}), but`,
  },
  {
    slug: 'home-inspection-include-septic-system', // 47 impr/28d
    find: 'or walk away from the transaction with your earnest money deposit intact.',
    replace: `or [walk away from the transaction with your earnest money deposit intact](${HREF}).`,
  },
  {
    slug: 'should-buy-house-s-already-had-foundation-repair', // 23 impr/28d
    find: 'Many buyers immediately walk away from a listing when the seller discloses past foundation repairs.',
    replace: `Many buyers immediately [walk away from a listing](${HREF}) when the seller discloses past foundation repairs.`,
  },
];

async function main() {
  const slugs = EDITS.map((e) => e.slug);
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${[...slugs, TARGET]}) AND status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (!bodies.has(TARGET)) throw new Error(`ABORT: target ${TARGET} is not published`);
  // The septic anchor promises earnest money; only point it here if the target actually covers it.
  if (!/earnest money/i.test(bodies.get(TARGET)!)) throw new Error('ABORT: target does not discuss earnest money');

  const live = new Set(
    ((await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`)) as unknown as Array<{ slug: string }>).map((p) => p.slug),
  );

  let bad = 0;
  for (const e of EDITS) {
    const body = bodies.get(e.slug);
    if (!body) throw new Error(`ABORT: source ${e.slug} is not published`);
    if (body.includes(HREF)) throw new Error(`ABORT: ${e.slug} already links to the target`);
    const n = body.split(e.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor in ${e.slug} matched ${n} times, expected exactly 1`);
    const next = body.replace(e.find, e.replace);
    for (const m of next.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${e.slug} -> ${m[1]}`); bad++; }
    }
    for (const m of next.matchAll(/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/g)) {
      console.log(`  NESTED LINK/BOLD: ${e.slug} -> ${m[0]}`); bad++;
    }
    bodies.set(e.slug, next);
    console.log(`  ok  ${e.slug}\n      - ${e.find}\n      + ${e.replace}\n`);
  }
  if (bad) throw new Error(`ABORT: ${bad} problem(s) found`);
  console.log(`${EDITS.length} links into ${TARGET}; all anchors unique, no dead links, none nested in bold.`);
  if (!APPLY) { console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true.'); return; }

  for (const e of EDITS) {
    const res = (await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${bodies.get(e.slug)!}
      WHERE slug = ${e.slug} AND status = 'published' RETURNING slug
    `)) as unknown as Array<{ slug: string }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${e.slug} affected ${res.length} rows`);
    console.log(`  wrote ${e.slug}`);
  }
  console.log('\nApplied. updated_at left unchanged on purpose -- see header.');
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
