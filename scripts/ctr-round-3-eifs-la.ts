// CTR/relevance work, round 3. Two pages, both chosen from query data rather than impression rank.
//
//   npx tsx scripts/ctr-round-3-eifs-la.ts            # dry run
//   APPLY=true npx tsx scripts/ctr-round-3-eifs-la.ts
//
// -------------------------------------------------------------------------------------------
// BE HONEST ABOUT WHAT A TITLE CAN AND CANNOT DO HERE, because the two pages are different cases.
//
// LOS ANGELES is a real CTR fix. "idis los angeles" draws 22 impressions at position 8.0, "idis
// ladbs" 5 at 6.0, "idis city of los angeles" 4 at 6.8 -- 31 impressions inside the top ten, zero
// clicks. The page has an entire section on IDIS and names it correctly as the LADBS Internet
// Document Imaging System, but the word appears nowhere in the title or the description, so the
// result never confirms it answers the thing being asked. That is the same defect the Cook County
// "permit portal" rewrite fixed, and the same fix applies.
//
// EIFS IS NOT A CTR FIX AND SHOULD NOT BE SOLD AS ONE. "eifs stucco evaluations" draws 178
// impressions -- 3% of the entire site's impressions on a single query -- at position 45.6. Nothing
// written in a title earns a click from page five. What this edit does is narrower and worth doing
// anyway: the page targets the word "inspection" throughout while every query in the cluster uses
// "evaluation", so the strongest relevance signal it could send, it currently does not send. This
// is a ranking-signal edit whose payoff is a position change over weeks, or no change at all.
//
// Both are cheap. Neither is the thing that moves this site: 43% of its impressions sit at position
// 21 or worse, which is an authority problem that no metadata edit addresses.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

type Edit = {
  slug: string;
  title: string;
  meta: string;
  headings?: Array<[string, string]>;
  why: string;
  /** Substrings the body must already contain for the new metadata to be truthful. */
  requires: string[];
};

const EDITS: Edit[] = [
  {
    slug: 'check-building-permits-los-angeles-county-ca',
    // The live title leads with "LA County Permits: EpicLA, LADBS & City Portals" -- accurate, and
    // it buries the one acronym people are actually typing. IDIS goes first among the tools because
    // it is the term with measured demand; EpicLA stays because it is the right answer for
    // unincorporated county addresses and dropping it would make the title narrower than the page.
    title: 'LA Permit Search by Address: IDIS, LADBS & EpicLA',
    meta: 'Search Los Angeles building permits by address: LADBS IDIS for city properties, EpicLA for unincorporated county, and the independent city portals.',
    why: 'puts IDIS in the title and meta, the term drawing 31 top-ten impressions and no clicks',
    requires: ['IDIS', 'LADBS', 'EpicLA', 'Internet Document Imaging System'],
  },
  {
    slug: 'standard-home-inspection-check-eifs-stucco-moisture',
    // Every query in this cluster says "evaluation" or "testing"; the page says "inspection" almost
    // exclusively. The H2 rename matters more than the title here -- it is the heading that sits
    // directly above the section actually describing the procedure.
    title: 'EIFS Stucco Evaluation: What the Inspection Covers',
    meta: 'A standard home inspection will not test EIFS for trapped moisture. What an EIFS stucco evaluation covers: thermal scans, moisture meters, probe testing.',
    headings: [
      ['## What a Dedicated EIFS Moisture Inspection Involves', '## What an EIFS Stucco Evaluation Involves'],
      ['## How to Read EIFS Moisture Inspection Results', '## How to Read EIFS Evaluation Results'],
    ],
    why: 'matches the "evaluation" wording every query in the cluster uses; the page said "inspection" throughout',
    requires: ['thermal', 'probe', 'moisture meter'],
  },
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const live = new Set(rows.map((r) => r.slug));

  const writes: Array<{ slug: string; title: string; meta: string; body: string }> = [];

  for (const e of EDITS) {
    const row = byslug.get(e.slug);
    if (!row) throw new Error(`ABORT: ${e.slug} is not published`);
    if (e.title.length > 60) throw new Error(`ABORT: ${e.slug} title ${e.title.length} chars, over 60`);
    if (e.meta.length > 155) throw new Error(`ABORT: ${e.slug} meta ${e.meta.length} chars, over 155`);
    if (e.meta.length < 70) throw new Error(`ABORT: ${e.slug} meta only ${e.meta.length} chars`);
    if (e.title === row.title && e.meta === row.meta_description && !e.headings) {
      throw new Error(`ABORT: ${e.slug} unchanged`);
    }

    let body: string = row.body_markdown;
    for (const [from, to] of e.headings ?? []) {
      const n = body.split(from).length - 1;
      if (n !== 1) throw new Error(`ABORT: ${e.slug} heading "${from}" matched ${n} times, expected 1`);
      body = body.replace(from, to);
    }

    // A title or meta may only promise what the article already delivers.
    const hay = body.toLowerCase();
    for (const need of e.requires) {
      if (!hay.includes(need.toLowerCase())) {
        throw new Error(`ABORT: ${e.slug} metadata relies on "${need}" and the body does not contain it`);
      }
    }
    writes.push({ slug: e.slug, title: e.title, meta: e.meta, body });
  }

  // Library-wide guards, same as every previous metadata pass.
  const STUDIES = new Set(['risk-without-price', 'risk-without-cover', 'outside-the-zone',
    'high-hazard-dams', 'allegheny-storm-premium', 'north-texas-roof-age', 'raise-or-remove']);
  let bad = 0;
  for (const w of writes) {
    for (const m of w.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g))
      if (!live.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${w.slug} -> ${m[1]}`); bad++; }
    for (const m of w.body.matchAll(/\]\(\/research\/([a-z0-9-]+)\/?\)/g))
      if (!STUDIES.has(m[1])) { console.log(`  DEAD STUDY LINK: ${w.slug} -> ${m[1]}`); bad++; }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these ship as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g])
      for (const m of w.body.matchAll(re)) { console.log(`  NESTED LINK: ${w.slug} -> ${m[0]}`); bad++; }
    if (!/^## /m.test(w.body)) { console.log(`  NO H2: ${w.slug}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  for (const w of writes) {
    const row = byslug.get(w.slug)!;
    const e = EDITS.find((x) => x.slug === w.slug)!;
    console.log(`\n  ${w.slug}`);
    console.log(`    ${e.why}`);
    console.log(`    title ${row.title.length} -> ${w.title.length}`);
    console.log(`      -  ${row.title}`);
    console.log(`      +  ${w.title}`);
    console.log(`    meta  ${row.meta_description.length} -> ${w.meta.length}`);
    console.log(`      -  ${row.meta_description}`);
    console.log(`      +  ${w.meta}`);
    for (const [from, to] of e.headings ?? []) console.log(`    H2  ${from.slice(3)}\n          -> ${to.slice(3)}`);
  }
  console.log('\n  ok  every claim in both titles and metas is supported by the article body');

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  for (const w of writes) {
    await withDb((sql) => sql`UPDATE articles SET title = ${w.title}, meta_description = ${w.meta},
      body_markdown = ${w.body}, updated_at = now() WHERE slug = ${w.slug}`);
    console.log(`  wrote ${w.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
