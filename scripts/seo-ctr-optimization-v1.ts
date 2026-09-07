// CTR optimisation for four guides with impressions and no clicks.
//
//   npx tsx scripts/seo-ctr-optimization-v1.ts            # dry run
//   APPLY=true npx tsx scripts/seo-ctr-optimization-v1.ts
//
// -------------------------------------------------------------------------------------------
// FOUR DEVIATIONS FROM THE BRIEF, each forced by how this project is actually built.
//
// 1. THERE IS NO FRONTMATTER, AND NO next-seo. This is a Vite/React app, not Next.js, and guide
//    content lives in the Neon `articles` table -- title, meta_description and body_markdown
//    columns. There are no .md or .mdx files to edit, so the "update the frontmatter" instruction
//    becomes a database write, which is what this script does.
//
// 2. THE SEO TITLE AND THE H1 ARE THE SAME FIELD. prerender-guides.tsx renders
//    <h1>{article.title}</h1> and buildPageTitle() derives <title> from the same column, so a page
//    cannot carry one string in the tab and a different one on the page without a schema change.
//    The brief specifies different values for pages 1 and 2.
//
//    Resolved in favour of the brief's H1 wording, and that happens to be the correct call anyway:
//    the SEO-title variants are 66 and 65 characters against a 60-character budget that
//    src/utils/pageTitle.ts enforces, so "(Risks & Fixes)" and "(Legal & Costs)" are exactly the
//    text Google would truncate. The H1 variants are 50 and 49.
//
// 3. ONE META EXCEEDS THE BUDGET. The foundation-crack description is 166 characters against 155.
//    Trimmed, keeping the brief's hook ("Not all cracks are structural") and its call to act
//    before the contingency is waived.
//
// 4. PAGE 3'S TITLE IS ALREADY THE BRIEF'S TITLE, character for character. No change is made to
//    it rather than writing the same string back and reporting it as work.
//
// -------------------------------------------------------------------------------------------
// TWO THINGS FOUND IN THE PAGES THAT THE BRIEF COULD NOT HAVE KNOWN.
//
// THE HVAC GUIDE HAS NO H2 AT ALL. Its seven sections are all ###, so the document goes H1 -> H3
// and skips a level, alone among the guides in this library. The brief asks for one H2; this
// promotes all seven to H2, which is both the fix for the skipped level and what every sibling
// guide already does. The first section is renamed to the brief's wording.
//
// THE OPEN-GROUND H2 IS SPLIT ACROSS TWO SECTIONS. "How Home Inspectors Detect Open Grounds"
// covers the outlet tester and its light patterns; "Code-Compliant Solutions for Open Grounds"
// covers the NEC repair options. The brief's single "How to Spot and Fix an Open Ground Outlet"
// would sit above the detection section and promise repair content that is in the next one. Both
// headings are rewritten into the brief's search-aligned "spot"/"fix" language instead, each
// staying true to the section beneath it.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

type Edit = {
  slug: string;
  title?: string;
  meta?: string;
  headings?: Array<[string, string]>;
  promoteH3?: boolean;
  note?: string;
};

const EDITS: Edit[] = [
  {
    slug: 'open-ground-mean-electrical-inspection',
    // "Home Inspection" rather than "Electrical Inspection": it is the phrase buyers search.
    // Curly quotes kept, matching the site's existing typography on this title.
    title: 'What Does “Open Ground” Mean on a Home Inspection?',
    meta: 'An open ground outlet is a silent electrical shock hazard. Learn what open ground means on a home inspection, how to fix it, and the true cost of repairs.',
    headings: [
      ['## How Home Inspectors Detect Open Grounds', '## How to Spot an Open Ground Outlet'],
      ['## Code-Compliant Solutions for Open Grounds', '## How to Fix an Open Ground Outlet: Code-Compliant Options'],
    ],
  },
  {
    slug: 'who-s-responsible-shared-well-shared-driveway',
    title: 'Who is Responsible for a Shared Well or Driveway?',
    meta: "Don't buy into a neighbor nightmare. Learn who is legally responsible for a shared well or driveway, maintenance agreements, and how to protect yourself.",
    headings: [
      ['## The Legal Foundation: Easements and Covenants', '## The Legal Risks of Shared Property and Shared Utility Wells'],
    ],
  },
  {
    slug: 'when-foundation-crack-need-structural-engineer',
    // Title deliberately absent: the live title is already the brief's title exactly.
    // 166 -> 149, keeping the hook and the contingency deadline.
    meta: 'Not all cracks are structural. Learn the warning signs of foundation settling that need a structural engineer before you waive your contingency.',
    headings: [
      ['## Physical Characteristics That Require an Engineer', '## Warning Signs a Foundation Crack is Structural (and Costly)'],
    ],
    note: 'title unchanged -- already matches the brief character for character',
  },
  {
    slug: 'hvac-techs-wish-buyers-knew-about-system-age',
    title: 'HVAC Age & Lifespan: What AC Techs Wish Homebuyers Knew',
    meta: 'How long does an air conditioner or furnace really last? Learn how to calculate HVAC age and the hidden failure signs home inspectors routinely miss.',
    promoteH3: true,
    headings: [
      ["## Beyond the Manufacturer's Date: Understanding True System Age", '## How to Determine HVAC Age and Remaining Useful Life'],
    ],
  },
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const writes: Array<{ slug: string; title: string; meta: string; body: string }> = [];

  for (const e of EDITS) {
    const row = byslug.get(e.slug);
    if (!row) throw new Error(`ABORT: ${e.slug} is not published`);

    let body: string = row.body_markdown;

    // Promote before renaming, so the rename targets the ## form.
    if (e.promoteH3) {
      const before = (body.match(/^### /gm) || []).length;
      if (before === 0) throw new Error(`ABORT: ${e.slug} has no ### headings to promote`);
      if ((body.match(/^## /gm) || []).length !== 0) throw new Error(`ABORT: ${e.slug} already has H2s`);
      body = body.replace(/^### /gm, '## ');
      console.log(`  ok  ${e.slug}: promoted ${before} H3 -> H2 (document had no H2 level at all)`);
    }

    for (const [from, to] of e.headings ?? []) {
      const n = body.split(from).length - 1;
      if (n !== 1) throw new Error(`ABORT: ${e.slug} heading "${from}" matched ${n} times, expected 1`);
      body = body.replace(from, to);
      console.log(`  ok  ${e.slug}: ${from.replace('## ', '')}\n            -> ${to.replace('## ', '')}`);
    }

    const title = e.title ?? row.title;
    const meta = e.meta ?? row.meta_description;

    if (title.length > 60) throw new Error(`ABORT: ${e.slug} title is ${title.length} chars, over 60`);
    if (meta.length > 155) throw new Error(`ABORT: ${e.slug} meta is ${meta.length} chars, over 155`);
    if (meta.length < 70) throw new Error(`ABORT: ${e.slug} meta is only ${meta.length} chars`);

    writes.push({ slug: e.slug, title, meta, body });
  }

  // ---- library-wide assertions, so this pass cannot break what earlier ones established -------
  const live = new Set(rows.map((r) => r.slug));
  const STUDIES = new Set(['risk-without-price', 'risk-without-cover', 'outside-the-zone',
    'high-hazard-dams', 'allegheny-storm-premium', 'north-texas-roof-age']);
  let bad = 0;
  for (const w of writes) {
    for (const m of w.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${w.slug} -> ${m[1]}`); bad++; }
    }
    for (const m of w.body.matchAll(/\]\(\/research\/([a-z0-9-]+)\/?\)/g)) {
      if (!STUDIES.has(m[1])) { console.log(`  DEAD STUDY LINK: ${w.slug} -> ${m[1]}`); bad++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these ship as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of w.body.matchAll(re)) { console.log(`  NESTED: ${w.slug} -> ${m[0]}`); bad++; }
    }
    if (!/^## /m.test(w.body)) { console.log(`  NO H2: ${w.slug}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  console.log('\n  ---- diff ----');
  for (const w of writes) {
    const row = byslug.get(w.slug)!;
    console.log(`\n  ${w.slug}`);
    if (row.title !== w.title) console.log(`    title ${row.title.length} -> ${w.title.length}\n      -  ${row.title}\n      +  ${w.title}`);
    else console.log(`    title unchanged (${w.title.length}): ${w.title}`);
    if (row.meta_description !== w.meta) console.log(`    meta  ${row.meta_description.length} -> ${w.meta.length}\n      -  ${row.meta_description}\n      +  ${w.meta}`);
    if (row.body_markdown !== w.body) console.log(`    body  ${row.body_markdown.length} -> ${w.body.length} chars, H2s now ${(w.body.match(/^## /gm) || []).length}`);
  }

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const w of writes) {
    await withDb((sql) => sql`UPDATE articles SET title = ${w.title}, meta_description = ${w.meta},
      body_markdown = ${w.body}, updated_at = now() WHERE slug = ${w.slug}`);
    console.log(`  wrote ${w.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
