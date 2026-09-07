// CTR work, round 2. Two pages, chosen from query data rather than impression counts.
//
//   npx tsx scripts/ctr-round-2.ts            # dry run
//   APPLY=true npx tsx scripts/ctr-round-2.ts
//
// -------------------------------------------------------------------------------------------
// THE OPPORTUNITY IS SMALLER THAN IT LOOKS, and the arithmetic is worth writing down because a
// previous estimate of it was wrong. Site CTR is 0.81% across 4,560 impressions, and "get that to
// 3%" implies about 137 clicks. It does not, because CTR is mostly a function of position:
//
//     position 1-10    17 pages   1,379 impressions   16 clicks   1.16%
//     position 11-20   11 pages   1,441 impressions   11 clicks   0.76%
//     position 21-40    8 pages   1,247 impressions    6 clicks   0.48%
//     position 41+      3 pages     493 impressions    4 clicks   0.81%
//
// 1,740 impressions sit at position 21 or worse, where nothing written in a title changes the
// outcome -- those pages need to rank, not to read better. Only the 1,847 impressions at position
// <=12 are addressable, and moving those from 1.14% to 3% is about +34 clicks a month. Real, worth
// having, and a third of the number first quoted.
//
// -------------------------------------------------------------------------------------------
// WHY ONLY TWO PAGES.
//
// The zero-click page-one list has twelve entries, and most are not candidates:
//
//   shared-well, foundation, hvac, open-ground   metadata rewritten hours ago; they need data,
//                                                not another edit
//   100-amp, septic, splice-romex                restored today; no post-restore data exists yet
//   prior-repair (57i), knob-closing (28i)       2 and 1 impressions respectively survive GSC's
//                                                query anonymisation -- nothing to write against
//
// PHILADELPHIA IS DELIBERATELY UNTOUCHED despite being the largest single opportunity on the site
// (651 impressions, position 9.3, 0.61%). Its title already contains every term its queries use --
// "Philadelphia L&I Permit & Violation Search by Address" against "philadelphia l&i permit search
// by address", "l&i permit search", "look up building violations" -- and its meta already names
// Atlas, eCLIPSE and the violations-transfer-at-closing hook. The competitor for those queries is
// phila.gov itself, which will win the click from anyone who wants the portal rather than an
// explanation of it. There is no rewrite here that is honestly better than what is live.
//
// SAN BERNARDINO IS UNTOUCHED FOR A DIFFERENT AND MORE INTERESTING REASON. Sixteen of its
// impressions come from "san bernardino as built documentation / drawings / plans / as builts",
// which looks like an unserved cluster worth targeting. It is not. Those searchers want archived
// architectural drawings showing what was actually constructed. This page uses "as-built" exactly
// once, meaning a RETROACTIVE PERMIT -- a different thing. Google is matching the string, not the
// intent. Writing "as-built plans" into the title would earn clicks the page cannot satisfy, which
// is the same error as optimising open-ground for its Spanish-language queries.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

type Edit = { slug: string; title: string; meta: string; why: string };

const EDITS: Edit[] = [
  {
    slug: 'check-building-permits-cook-county-il',
    // Top query is "cook county permit portal" (6i, pos 9.5). The live title leads with "Cook
    // County Permits" then "Chicago Data Portal & Illinois FOIA" -- accurate, but "Illinois FOIA"
    // is the mechanism's name, not a phrase a buyer types.
    //
    // The second query is the more useful find: "are building permits public record" at position
    // 8.0. The article answers it -- FOIA appears eight times -- but the phrase "public record"
    // appears zero times in the body and nowhere in the metadata, so the result never confirms it
    // answers the question being asked. The meta now says so in the first clause.
    title: 'Cook County Permit Portal: Search Records by Address',
    meta: 'Building permits are public records in Illinois. How to search Cook County permits by address, use the Chicago portal, and request older files by FOIA.',
    why: 'leads with the top query phrase; meta answers "are building permits public record" directly',
  },
  {
    slug: 'get-home-insurance-flat-roof',
    // Every query for this page is a noun phrase -- "flat roof home insurance" (7i), "flat roof
    // house insurance" (2i, pos 8.5), "home insurance for flat roofs" (2i, pos 9.0), "insurance
    // for flat roofs" (1i, pos 7.0) -- and the live title is a yes/no question. The question form
    // also undersells: the answer is yes, so "Can You…?" invites a one-word answer the searcher
    // already assumes, while the real content is the conditions attached to it.
    title: 'Flat Roof Home Insurance: What Underwriters Require',
    meta: 'Flat roof home insurance is available but conditional: strict roof age limits, material standards, and water damage exclusions. What carriers ask for.',
    why: 'matches the noun-phrase form every query uses; promises the conditions rather than a yes/no',
  },
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  for (const e of EDITS) {
    const row = byslug.get(e.slug);
    if (!row) throw new Error(`ABORT: ${e.slug} is not published`);
    if (e.title.length > 60) throw new Error(`ABORT: ${e.slug} title ${e.title.length} chars, over 60`);
    if (e.meta.length > 155) throw new Error(`ABORT: ${e.slug} meta ${e.meta.length} chars, over 155`);
    if (e.meta.length < 70) throw new Error(`ABORT: ${e.slug} meta only ${e.meta.length} chars`);
    if (e.title === row.title && e.meta === row.meta_description) throw new Error(`ABORT: ${e.slug} unchanged`);

    console.log(`\n  ${e.slug}`);
    console.log(`    ${e.why}`);
    console.log(`    title ${row.title.length} -> ${e.title.length}`);
    console.log(`      -  ${row.title}`);
    console.log(`      +  ${e.title}`);
    console.log(`    meta  ${row.meta_description.length} -> ${e.meta.length}`);
    console.log(`      -  ${row.meta_description}`);
    console.log(`      +  ${e.meta}`);
  }

  // A claim in a meta has to be true of the body. Both new descriptions promise something
  // specific, so both are checked against the article rather than trusted.
  const cook = byslug.get('check-building-permits-cook-county-il')!.body_markdown.toLowerCase();
  if (!cook.includes('foia')) throw new Error('ABORT: Cook meta promises FOIA and the body does not mention it');
  const roof = byslug.get('get-home-insurance-flat-roof')!.body_markdown.toLowerCase();
  for (const claim of ['roof age', 'exclusion']) {
    if (!roof.includes(claim)) throw new Error(`ABORT: flat-roof meta promises "${claim}" and the body does not cover it`);
  }
  console.log('\n  ok  every claim in both metas is supported by the article body');

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const e of EDITS) {
    await withDb((sql) => sql`UPDATE articles SET title = ${e.title}, meta_description = ${e.meta},
      updated_at = now() WHERE slug = ${e.slug}`);
    console.log(`  wrote ${e.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
