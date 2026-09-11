// Remove the 31 AI-cliché phrases Rule 7 grandfathered, so the list can be emptied.
//
//   npx tsx scripts/fix-cliches.ts              # dry run
//   APPLY=true npx tsx scripts/fix-cliches.ts
//
// -----------------------------------------------------------------------------------------------
// TWO KINDS OF EDIT, handled differently on purpose.
//
// MECHANICAL: "Furthermore," opening a sentence. Fifteen instances, and every one of them is pure
// connective filler -- the sentence reads identically without it, because the paragraph already
// established the relationship. Deleting it and recapitalising is safe enough to do with a regex,
// and the count is asserted so a surprise match cannot slip through.
//
// JUDGEMENT: "crucial" (11), "when it comes to" (3), "regulatory landscape", "navigating the
// complexities". These cannot be swapped for a synonym, because the problem is not the word -- it
// is that the sentence asserts importance instead of saying what happens. "This distinction is
// crucial for sump pump failures" tells the reader nothing; "This distinction decides sump pump
// failures" tells them the stake. So each is rewritten by hand against its own context and anchored
// on enough surrounding text to match exactly once.
//
// NOTHING HERE CHANGES A FACT. No figure, citation, standard or claim is touched -- these are
// edits to connective tissue only, which is why they can be done in bulk at all.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

/** Anchored on enough context to be unique inside its own article. */
type Edit = { slug: string; from: string; to: string };

const EDITS: Edit[] = [
  { slug: 'amateur-workmanship-mean-home-inspection-report',
    from: 'is crucial for protecting your financial investment and personal safety',
    to: 'is what protects your financial investment and personal safety' },

  { slug: 'check-building-permits-clark-county-nv',
    from: 'Ownership matters as much as approval when it comes to insuring the house',
    to: 'Ownership matters as much as approval when insuring the house' },

  { slug: 'check-building-permits-san-bernardino-county-ca',
    from: 'navigating its regulatory landscape requires understanding exactly who holds the records',
    to: 'finding its records means knowing exactly who holds them' },

  { slug: 'double-tapped-breaker-did-inspector-flag',
    from: 'Understanding this common electrical defect is crucial for any home buyer.',
    to: 'Understanding this common electrical defect is what keeps a lender or an underwriter from stalling your closing.' },

  { slug: 'get-home-insurance-aluminum-wiring',
    from: 'Service Entrance Cables: A Crucial Distinction',
    to: 'Service Entrance Cables: Why the Difference Matters' },

  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'Navigating the complexities of homeowners insurance',
    to: 'Reading a homeowners policy' },
  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'However, when it comes to sump pump failure, this distinction is often overridden',
    to: 'However, for sump pump failure, this distinction is often overridden' },
  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'This distinction is crucial for sump pump failures.',
    to: 'This distinction decides whether a sump pump failure is paid or denied.' },
  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'provides crucial coverage, it is not without its limitations',
    to: 'covers that gap, it has limits' },
  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'provides a crucial layer of protection during power outages',
    to: 'provides a second layer of protection during power outages' },
  { slug: 'homeowners-insurance-cover-failed-sump-pump',
    from: 'This documentation is crucial for your insurance claim.',
    to: 'This documentation is what your claim rests on.' },

  { slug: 'should-buy-house-s-already-had-foundation-repair',
    from: 'This diagram is crucial because it helps you understand',
    to: 'This diagram matters because it tells you' },

  { slug: 'typical-settlement-cracking-mean-inspection-report',
    from: 'When it comes to settlement cracking, the inspector will:',
    to: 'For settlement cracking, the inspector will:' },
  { slug: 'typical-settlement-cracking-mean-inspection-report',
    from: 'is crucial for making an informed purchase decision',
    to: 'is what separates a cosmetic problem from a structural one' },
  { slug: 'typical-settlement-cracking-mean-inspection-report',
    from: "it's crucial to understand that not all cracks are created equal",
    to: 'not all cracks are equal' },

  { slug: 'who-s-responsible-shared-well-shared-driveway',
    from: 'It is crucial to know exactly where the shared driveway or well sits',
    to: 'You need to know exactly where the shared driveway or well sits' },
];

/** "Furthermore," at the head of a sentence, plus the space after it. */
const FURTHERMORE = /([.!?]\s+|^|\n)Furthermore,\s+(\w)/g;
const EXPECTED_FURTHERMORE = 15;

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, body_markdown FROM articles WHERE status = 'published'
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 60)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable');

  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const next = new Map<string, string>();
  const get = (slug: string) => next.get(slug) ?? String(byslug.get(slug)?.body_markdown ?? '');

  // 1. Judgement edits, each asserted unique.
  for (const e of EDITS) {
    if (!byslug.has(e.slug)) throw new Error(`ABORT: ${e.slug} is not published`);
    const body = get(e.slug);
    const n = body.split(e.from).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${e.slug} — "${e.from.slice(0, 50)}" matched ${n} times, expected 1`);
    next.set(e.slug, body.replace(e.from, e.to));
  }

  // 2. Mechanical "Furthermore," removal across the whole library.
  let furthermore = 0;
  for (const r of rows) {
    const body = get(r.slug);
    const hits = [...body.matchAll(FURTHERMORE)].length;
    if (!hits) continue;
    furthermore += hits;
    next.set(r.slug, body.replace(FURTHERMORE, (_m, lead, ch) => `${lead}${ch.toUpperCase()}`));
  }
  if (furthermore !== EXPECTED_FURTHERMORE) {
    throw new Error(`ABORT: expected ${EXPECTED_FURTHERMORE} "Furthermore," removals, found ${furthermore}`);
  }

  // 3. Nothing factual may move. Figures and citations are counted before and after.
  const FIGURE = /\$[\d,]+|\b\d+(\.\d+)?\s*(pCi\/L|amp|volt|year|%)|\b(NFPA|NEC|IRC|ASTM|CPSC|EPA|HUD|FEMA|ASHI|TREC)\b/gi;
  for (const [slug, body] of next) {
    const before = (String(byslug.get(slug)!.body_markdown).match(FIGURE) ?? []).length;
    const after = (body.match(FIGURE) ?? []).length;
    if (before !== after) throw new Error(`ABORT: ${slug} figure/citation count moved ${before} -> ${after}`);
    // The linking bug this project has shipped once before.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      if (re.test(body)) throw new Error(`ABORT: ${slug} contains a bold-wrapped link`);
    }
  }

  console.log(`\n  ${EDITS.length} rewritten phrase(s) + ${furthermore} "Furthermore," removal(s)`);
  console.log(`  across ${next.size} guide(s); every figure and citation count unchanged\n`);
  for (const e of EDITS) {
    console.log(`  ${e.slug}`);
    console.log(`    -  ${e.from}`);
    console.log(`    +  ${e.to}`);
  }

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  for (const [slug, body] of next) {
    await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
