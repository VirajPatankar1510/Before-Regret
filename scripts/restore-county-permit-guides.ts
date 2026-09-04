// Batch 1 of the county permit-guide restore, 2026-09-04.
//
//   npx tsx scripts/restore-county-permit-guides.ts           # dry run
//   APPLY=true npx tsx scripts/restore-county-permit-guides.ts
//
// WHY. scripts/keyword-opportunities.ts showed that the queries this site is closest to winning
// are county permit lookups -- "l&i permit search" at 6.3, "look up building violations" at 6.0,
// "permit history by address" at 5.0, "cook county permit portal" at 9.6, "san bernardino permit
// lookup" at 8.0. Every one of the six surviving county permit guides ranks page one for its own
// county. The 2026-09-02 prune cut twenty-five more of them, including the largest markets in the
// country. That is the same misreading as get-home-insurance-fuse-box, at twenty-five times the
// scale: pages judged on "zero impressions" before Google had begun showing them.
//
// FIVE, NOT TWENTY-FIVE. The prune existed for a real reason -- 155 guides published in 19 days on
// a domain with no inbound links is the scaled-content shape Google's site-level systems suppress.
// Restoring the whole set at once risks re-triggering exactly that. Five, then measure, then more.
//
// NOT A STATUS FLIP. Restoring these as they stand would republish the same pages that were cut,
// which is the thing to avoid. What was actually wrong with them was not the prose -- an identical-
// sentence check across five of them found 2 shared sentences out of 43-65 each, and both are a
// deliberate cross-link block, not boilerplate. The real defect is that they contain NO links to
// the portals they spend the whole article describing. A permit guide that says "navigate to the
// Maricopa County Assessor parcel viewer" without linking it is asking the reader to do the one
// job the guide exists to do for them.
//
// SO EVERY LINK BELOW WAS VERIFIED, TWICE, AND SOME ARE DELIBERATELY ABSENT. Government portals
// sit behind WAFs and Angular front ends that make them hard to check from a script, and this
// machine's own network proved unreliable during the work. Only URLs that returned 200 on two
// separate runs are linked. Los Angeles gets NO link block: dpw.lacounty.gov failed twice,
// ladbs.org returns 403 to everything automated, and epicla.lacounty.gov answered 200 once and
// failed once. Its body already names EPIC-LA and LADBS correctly, so it restores unchanged rather
// than carrying a link nobody confirmed. A dead link in a permit guide is worse than no link.
//
// Links point at county landing pages rather than deep portal URLs on purpose: Accela instance
// URLs move, the county's own permit page does not, and it always points at whatever the current
// tool is.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

// Anchor present in all five: the shared cross-link block that closes every county guide. The new
// section goes immediately before it, so it lands after the county-specific body and before the
// "here is how to do this anywhere else" hand-off.
const ANCHOR = '## Looking Up Permits Elsewhere';

interface Restore { slug: string; note: string; insert?: string; }

const RESTORES: Restore[] = [
  {
    slug: 'check-building-permits-los-angeles-county-ca',
    note: 'Restored unchanged. No link block: no LA County permit URL could be verified twice from here (dpw.lacounty.gov failed, ladbs.org 403s automated requests, EPIC-LA answered 200 once and failed once). The body already names EPIC-LA and LADBS correctly.',
  },
  {
    slug: 'check-harris-county-permit-history-before-buying',
    note: 'Adds the verified Harris County Engineering permits page. Houston has its own permitting centre for addresses inside the city; named but not linked, since houstonpermittingcenter.org returns 403 to automated requests.',
    insert: `## Where to Search Harris County Permits

Harris County Engineering handles permits for **unincorporated** parts of the county. Its permit pages are at [Harris County Engineering Department permits](https://www.eng.hctx.net/permits).

An address inside Houston city limits is not a county record. Those permits are held by the Houston Permitting Center, a separate office with its own database — so confirm which of the two governs the property before concluding that a permit does not exist.

`,
  },
  {
    slug: 'check-building-permits-maricopa-county-az',
    note: 'Adds the verified Permit Center page AND the June 2024 system split, which the guide predates. A buyer researching an older Phoenix-area house has to search two systems, and nothing in the article said so.',
    insert: `## Where to Search Maricopa County Permits

For **unincorporated** Maricopa County, start at the [Maricopa County Permit Center](https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center).

One detail catches people out on older houses: the county replaced its permitting system in June 2024. The Permit Center holds records from May 2009 onward. Closed permits, planning cases and violations from 1999 through June 2024 live in a separate Permit Viewer, reachable from the same Planning and Development pages. A property altered in, say, 2006 and again in 2021 may therefore have half its history in each. Finding nothing in one system is not evidence that no permit was pulled.

`,
  },
  {
    slug: 'check-building-permits-san-diego-county-ca',
    note: 'Adds both verified portals -- the county Accela instance and the City of San Diego system -- since the county/city split is the whole difficulty this guide describes.',
    insert: `## Where to Search San Diego Permits

For **unincorporated** San Diego County, use the county's [Accela Citizen Access portal](https://publicservices.sandiegocounty.gov/CitizenAccess).

For an address inside the City of San Diego, the records are in a different system entirely: [OpenDSD](https://opendsd.sandiego.gov), run by the city's Development Services Department. The other incorporated cities in the county — Chula Vista, Oceanside, Escondido, Carlsbad and the rest — each keep their own, so the parcel's jurisdiction decides which one to search.

`,
  },
  {
    slug: 'check-building-permits-clark-county-nv',
    note: "Adds the county's own verified records-research page. Citizen Access itself is named but not linked: its host resolves in DNS but would not complete a connection from this machine on repeated attempts, so it could not be confirmed either way.",
    insert: `## Where to Search Clark County Permits

Clark County's [online records research page](https://www.clarkcountynv.gov/government/departments/public_works_department/development/online-records-research) is the county's own index of what is searchable and where, and it is the durable starting point — the underlying portal addresses have changed more than once.

From there, unincorporated township records (Paradise, Spring Valley, Enterprise, Sunrise Manor, Winchester) run through the county's Citizen Access system. An address inside the City of Las Vegas, North Las Vegas or Henderson is held by that city instead, not by the county.

`,
  },
];

async function main() {
  const slugs = RESTORES.map((r) => r.slug);
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, body_markdown FROM articles WHERE slug = ANY(${slugs})
  `)) as unknown as Array<{ slug: string; status: string; title: string; body_markdown: string }>;

  if (rows.length !== slugs.length) throw new Error(`ABORT: wanted ${slugs.length} rows, got ${rows.length}`);
  for (const r of rows) {
    if (r.status !== 'removed') throw new Error(`ABORT: ${r.slug} is '${r.status}', expected 'removed'`);
    if (!r.body_markdown || r.body_markdown.length < 3000) throw new Error(`ABORT: ${r.slug} body looks truncated (${r.body_markdown?.length})`);
  }

  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));

  console.log(`${RESTORES.length} guide(s) to restore\n`);
  for (const r of RESTORES) {
    const body = bodies.get(r.slug)!;
    console.log(`  ${r.slug}`);
    console.log(`     ${r.note}`);
    if (!r.insert) { console.log('     (body unchanged)\n'); continue; }
    const n = body.split(ANCHOR).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor "${ANCHOR}" appears ${n} times in ${r.slug}, expected 1`);
    bodies.set(r.slug, body.replace(ANCHOR, r.insert + ANCHOR));
    console.log(`     + ${r.insert.split('\n')[0]}\n`);
  }

  // --- assertions -------------------------------------------------------------------------
  // renderArticleMarkdown's parseInline does not recurse: **[text](url)** and [**text**](url) both
  // render as literal markdown on the live page. This shipped once; never again from a script here.
  let nested = 0;
  for (const [slug, body] of bodies) {
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of body.matchAll(re)) { console.log(`  NESTED LINK/BOLD: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (nested) throw new Error(`ABORT: ${nested} nested link/bold construct(s)`);

  // No internal link may point at a guide that is not published (counting these five as published).
  const live = new Set((await withDb((sql) => sql`
    SELECT slug FROM articles WHERE status = 'published'
  `) as unknown as Array<{ slug: string }>).map((r) => r.slug));
  for (const s of slugs) live.add(s);
  let dead = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD INTERNAL LINK: ${slug} -> ${m[1]}`); dead++; }
    }
  }
  if (dead) throw new Error(`ABORT: ${dead} dead internal link(s)`);

  console.log('assertions passed: no nested link/bold, no dead internal links\n');

  if (!APPLY) { console.log('DRY RUN -- nothing written. Re-run with APPLY=true.'); return; }

  for (const r of RESTORES) {
    const res = (await withDb((sql) => sql`
      UPDATE articles
      SET body_markdown = ${bodies.get(r.slug)!}, status = 'published', updated_at = now()
      WHERE slug = ${r.slug} AND status = 'removed'
      RETURNING slug, status, length(body_markdown) AS len
    `)) as unknown as Array<{ slug: string; status: string; len: number }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${r.slug} affected ${res.length} rows`);
    console.log(`  restored ${res[0].slug} (${res[0].len} chars, ${res[0].status})`);
  }

  const total = (await withDb((sql) => sql`SELECT count(*)::int AS n FROM articles WHERE status='published'`)) as unknown as Array<{ n: number }>;
  console.log(`\npublished guides now: ${total[0].n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
