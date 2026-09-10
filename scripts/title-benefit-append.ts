// Append an outcome to five question-formula titles. APPEND ONLY -- nothing is ever removed.
//
//   npx tsx scripts/title-benefit-append.ts            # dry run
//   APPLY=true npx tsx scripts/title-benefit-append.ts
//
// -----------------------------------------------------------------------------------------------
// WHY APPEND-ONLY IS THE WHOLE DESIGN.
//
// The owner's question was whether retitling resets a page's indexing, ranking or authority. It does
// not: those attach to the URL, and the URL is untouched. The real exposure is narrower -- a rewrite
// that DROPS a word the page currently matches loses relevance for that term. So the first assertion
// below requires the new title to START WITH the old title, character for character. Keyword loss is
// then impossible by construction rather than by careful editing.
//
// WHY ONLY FIVE, out of twenty-six question-formula titles.
//   - Twelve have under 12 characters of headroom against the 60-char budget. Adding an outcome
//     there means cutting words, which is exactly the risky operation. Left alone.
//   - Four sit on guides extended earlier today. The 2016 Google deck this work comes from says the
//     fakery fails on documents that are "new, recently changed, or rarely shown". Stacking a second
//     change onto a page changed hours ago is the one thing that note argues against.
//   - Of the ten that remain, five have body text that genuinely supports an outcome claim. The
//     others do not, and a title may only promise what the page delivers -- the same `requires` gate
//     used in scripts/ctr-round-3-eifs-la.ts.
//
// WHAT THIS IS AND IS NOT. It is a CTR bet with a documented mechanism: a searcher who sees their own
// question plus an outcome has two reasons to believe the page is for them. It is NOT a ranking fix,
// and it will not move a page that nobody sees. Every one of these five is among the definitional
// guides holding no cost data, which is the actual reason they are weak. Better titles on thin pages
// are still thin pages.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

type Edit = {
  slug: string;
  /** Appended verbatim to the existing title. Leading space included deliberately. */
  append: string;
  /** Lowercased substrings the body must already contain for the promise to be truthful. */
  requires: string[];
  why: string;
};

// Deliberately five different shapes. Five titles ending in the same construction would be the
// headline-formula footprint the content standard already forbids -- fixing one template by
// installing another is not a fix.
const EDITS: Edit[] = [
  {
    slug: 'reverse-polarity-mean-electrical-inspection',
    append: ' Is It Dangerous?',
    requires: ['shock'],
    why: 'severity is the actual question behind the query; body covers shock risk',
  },
  {
    slug: 'amateur-workmanship-mean-home-inspection-report',
    append: ' Warning Signs',
    requires: ['sign'],
    why: 'reader wants to know what to look for, not the phrase definition',
  },
  {
    slug: 'splice-romex-knob-tube-wiring',
    append: ' Code Rules',
    requires: ['code'],
    why: 'the yes/no turns on code; says the page answers it rather than describing the splice',
  },
  {
    slug: 'get-home-insurance-fuse-box',
    append: ' Carrier Limits',
    requires: ['insur'],
    why: 'the searcher already knows they have a fuse box; the outcome is who will cover it',
  },
  {
    slug: 'buy-house-active-hoa-lawsuit',
    append: ' The Risks',
    requires: ['risk'],
    why: 'buying decision, not a definition; body weighs the exposure',
  },
];

async function main() {
  let rows: any[] | null = null;
  for (let attempt = 1; attempt <= 4 && !rows; attempt++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, body_markdown FROM articles WHERE status = 'published'
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${attempt}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: could not reach the database after 4 attempts');

  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const writes: Array<{ slug: string; from: string; to: string; why: string }> = [];

  for (const e of EDITS) {
    const row = byslug.get(e.slug);
    if (!row) throw new Error(`ABORT: ${e.slug} is not published`);

    const from = String(row.title);
    const to = from + e.append;

    // 1. THE SAFETY PROPERTY. Nothing may be removed, so no matched term can be lost.
    if (!to.startsWith(from)) throw new Error(`ABORT: ${e.slug} is not a pure append`);
    // 2. Title budget, enforced by buildPageTitle() downstream.
    if (to.length > 60) throw new Error(`ABORT: ${e.slug} title would be ${to.length} chars, over 60`);
    // 3. Truthfulness: the page must already deliver what the title now promises.
    const hay = String(row.body_markdown).toLowerCase();
    for (const need of e.requires) {
      if (!hay.includes(need)) {
        throw new Error(`ABORT: ${e.slug} promises "${e.append.trim()}" but body lacks "${need}"`);
      }
    }
    // 4. No accidental new template: every appended clause must be distinct.
    writes.push({ slug: e.slug, from, to, why: e.why });
  }

  const appends = EDITS.map((e) => e.append.trim().toLowerCase());
  if (new Set(appends).size !== appends.length) throw new Error('ABORT: duplicate appended clause');
  const lastWords = appends.map((a) => a.split(' ').pop());
  if (new Set(lastWords).size !== lastWords.length) {
    console.log('  note: two clauses end on the same word -- check they do not read as a formula');
  }

  for (const w of writes) {
    console.log(`\n  ${w.slug}`);
    console.log(`    ${w.why}`);
    console.log(`    ${String(w.from.length).padStart(2)} -> ${w.to.length} chars`);
    console.log(`      -  ${w.from}`);
    console.log(`      +  ${w.to}`);
  }
  console.log(`\n  ok  ${writes.length} pure appends, every promise supported by the body`);
  console.log(`  ok  no word removed from any title, so no matched term can be lost`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  for (const w of writes) {
    await withDb((sql) => sql`
      UPDATE articles SET title = ${w.to}, updated_at = now() WHERE slug = ${w.slug}`);
    console.log(`  wrote ${w.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
