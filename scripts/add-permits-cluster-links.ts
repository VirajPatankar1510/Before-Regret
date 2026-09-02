// Adds in-body contextual links across the eight permits guides. Third of three cluster passes;
// see scripts/add-electrical-cluster-links.ts for the measurement all three respond to.
//
//   npx tsx scripts/add-permits-cluster-links.ts            # dry run, asserts every match
//   APPLY=true npx tsx scripts/add-permits-cluster-links.ts
//
// THIS CLUSTER WAS ALREADY THE BEST LINKED AND STILL HAD A HOLE. It is a clean hub and spoke: all
// seven other guides link to look-up-building-permits-by-address, and the hub links back to the
// six county guides. But find-unpermitted-work-before-buying -- a guide that earns clicks -- had
// ZERO inbound links from anywhere in the cluster, despite every one of the other seven discussing
// unpermitted work at length (7 to 16 mentions each). The topic was everywhere; the link was
// nowhere.
//
// So this pass is deliberately one-directional: seven links into the page that had none. No
// county-to-county links, because a reader searching Bronx permits has no use for Cook County, and
// the hub already connects them.
//
// Anchors are varied by article rather than templated -- "likely done without a permit",
// "renovated without the necessary permits", "Uncovering unpermitted work" -- because seven
// identical anchors into one page is a footprint, and because each article's own phrasing is the
// one its reader just read.
//
// NO LINK INSIDE BOLD, in either direction: parseInline emits **...** contents as a plain string
// instead of recursing, so the markdown would reach readers literally. Guarded below.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = 'find-unpermitted-work-before-buying';
const L = `/guides/${TARGET}/`;

interface Edit { slug: string; find: string; replace: string; }

const EDITS: Edit[] = [
  {
    // The hub's own worked example of spotting unpermitted work -- the single most on-point
    // sentence in the cluster for this destination.
    slug: 'look-up-building-permits-by-address',
    find: 'but the home now features a newly added second-story master suite, the major structural work was likely done without a permit.',
    replace: `but the home now features a newly added second-story master suite, the major structural work was [likely done without a permit](${L}).`,
  },
  {
    slug: 'check-building-permits-middlesex-county-ma',
    find: 'If your research reveals that a portion of the home was renovated without the necessary permits, you have options before closing,',
    replace: `If your research reveals that a portion of the home was [renovated without the necessary permits](${L}), you have options before closing,`,
  },
  {
    slug: 'check-building-permits-san-bernardino-county-ca',
    find: 'as bringing unpermitted work up to code is often significantly more expensive than standard renovations.',
    replace: `as bringing [unpermitted work](${L}) up to code is often significantly more expensive than standard renovations.`,
  },
  {
    slug: 'check-building-permits-cook-county-il',
    find: 'helps identify whether a building has outstanding notices for unpermitted work, hazardous wiring, or illegal conversions.',
    replace: `helps identify whether a building has outstanding notices for [unpermitted work](${L}), hazardous wiring, or illegal conversions.`,
  },
  {
    slug: 'check-building-permits-miami-dade-county-fl',
    find: 'Have a licensed general contractor or structural engineer evaluate any unpermitted work.',
    replace: `Have a licensed general contractor or structural engineer evaluate any [unpermitted work](${L}).`,
  },
  {
    slug: 'check-building-permits-bronx-ny',
    find: 'Unpermitted work or unassigned sign-offs stay attached to the property tax lot,',
    replace: `[Unpermitted work](${L}) or unassigned sign-offs stay attached to the property tax lot,`,
  },
  {
    slug: 'check-building-permits-philadelphia-county-pa',
    find: 'Uncovering unpermitted work or unresolved municipal violations after closing on a Philadelphia property',
    replace: `[Uncovering unpermitted work](${L}) or unresolved municipal violations after closing on a Philadelphia property`,
  },
];

async function main() {
  const slugs = [...new Set(EDITS.map((e) => e.slug))];
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${slugs}) AND status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (bodies.size !== slugs.length) throw new Error(`ABORT: expected ${slugs.length} articles, found ${bodies.size}`);

  const live = new Set(
    ((await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`)) as unknown as Array<{ slug: string }>)
      .map((p) => p.slug)
  );
  if (!live.has(TARGET)) throw new Error(`ABORT: ${TARGET} is not a published guide`);

  for (const e of EDITS) {
    const body = bodies.get(e.slug)!;
    const n = body.split(e.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor in ${e.slug} matched ${n} times, expected exactly 1`);
    bodies.set(e.slug, body.replace(e.find, e.replace));
    console.log(`  ok  ${e.slug} -> ${TARGET}`);
  }

  let bad = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    for (const m of body.matchAll(/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/g)) {
      console.log(`  NESTED LINK/BOLD (renders as literal markdown): ${slug} -> ${m[0]}`); bad++;
    }
  }
  if (bad) throw new Error(`ABORT: ${bad} problem(s) found`);
  console.log(`\n${EDITS.length} links into ${TARGET}; all targets published, none nested in bold.`);

  if (!APPLY) { console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true.'); return; }

  for (const [slug, body] of bodies) {
    const res = (await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now()
      WHERE slug = ${slug} AND status = 'published' RETURNING slug
    `)) as unknown as Array<{ slug: string }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${slug} affected ${res.length} rows`);
    console.log(`  wrote ${slug}`);
  }
  console.log('\nApplied.');
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
