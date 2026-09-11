// Find existing sentences that could honestly link to a given guide.
//
//   npx tsx scripts/suggest-inbound-links.ts orangeburg-pipe-collapse
//   npx tsx scripts/suggest-inbound-links.ts <slug> --all-clusters
//
// -----------------------------------------------------------------------------------------------
// WHY THIS SUGGESTS AND DOES NOT WRITE.
//
// The request behind it was to auto-inject a contextual link into older indexed guides whenever a
// new one publishes, so Googlebot discovers it faster. The indexing logic is sound -- internal
// links are the main way a crawler reaches a new page on a domain with almost no backlinks, and
// they are how authority moves here at all.
//
// But an injector has to put the link SOMEWHERE, and when no sentence in the older guide happens to
// discuss the new subject, the only way to place one is to write a sentence that does. That is
// manufacturing relevance, and §3 of the content standard forbids it in as many words: "Only link
// where the prose ALREADY discusses the target. Never insert a claim to justify a link." Three
// guides were deliberately left unlinked under that rule rather than have a sentence invented for
// them. At scale, inserted anchors are also exactly the footprint that got 100 pages pruned from
// this library in September.
//
// So this does the expensive half -- finding real anchors in prose that already exists -- and stops
// there. A human approves each one, and an existing bulk-edit script writes it with the usual
// assert-exactly-once guards. Same indexing benefit, no invented prose.
//
// WHAT IT WILL NOT FIND, and this is the point rather than a limitation: if a new guide has no
// honest anchor anywhere in its cluster, the correct output is nothing. That is a signal the guide
// is disconnected from the library, which is Rule 6's concern, not a problem to paper over.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const TARGET = process.argv[2];
const ALL_CLUSTERS = process.argv.includes('--all-clusters');

/** Words too common to indicate the sentence is really about the target. */
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'is', 'are', 'was', 'were', 'be',
  'what', 'does', 'do', 'can', 'you', 'your', 'it', 'its', 'that', 'this', 'with', 'from', 'by',
  'home', 'house', 'inspection', 'inspector', 'report', 'buying', 'buyer', 'mean', 'means',
  'before', 'after', 'when', 'why', 'how', 'should', 'will', 'need', 'get', 'have', 'has',
]);

function terms(slug: string, title: string): string[] {
  return [...new Set(`${slug.replace(/-/g, ' ')} ${title}`.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? [])]
    .filter((w) => !STOP.has(w));
}

/** Split on sentence ends, keeping it crude on purpose -- a human reads every hit anyway. */
function sentences(body: string): string[] {
  return body
    .split('\n')
    .filter((l) => !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('>'))
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 400);
}

async function main() {
  if (!TARGET) {
    console.error('Usage: npx tsx scripts/suggest-inbound-links.ts <slug> [--all-clusters]');
    process.exit(1);
  }

  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, body_markdown FROM articles WHERE status = 'published'
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 60)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable');

  const target = rows.find((r) => r.slug === TARGET);
  if (!target) throw new Error(`ABORT: ${TARGET} is not a published guide`);

  const topic = guideTopic(target.slug, target.title);
  const key = terms(target.slug, target.title);

  // DISTINCTIVENESS BY DOCUMENT FREQUENCY, not by word length. The first version treated any word
  // of six characters as distinctive and duly matched "collapse" against a septic guide's sentence
  // about a structurally compromised tank lid -- a sentence with nothing to do with Orangeburg pipe.
  // "Collapse" and "pipe" are domain-generic here; "orangeburg" is not, and the difference is how
  // many guides contain them. A term appearing in more than a quarter of the library carries no
  // signal about what a sentence is actually about.
  //
  // The ceiling started at 25% and was still too loose: "collapse" sits in 9 of 57 guides, cleared
  // it, and matched a septic sentence anyway. 10% is where the corpus separates -- "orangeburg" is
  // in 2 guides, "collapse" in 9, "pipe" in 22. Anything above roughly a tenth of the library is
  // subject vocabulary, not a subject.
  const DF_CEILING = Math.max(2, Math.ceil(rows.length * 0.10));
  const df = (w: string) => rows!.filter((r) => `${r.slug} ${r.title} ${r.body_markdown}`.toLowerCase().includes(w)).length;
  const scored = key.map((w) => ({ w, df: df(w) })).sort((a, b) => a.df - b.df);
  const strong = scored.filter((x) => x.df <= DF_CEILING).map((x) => x.w);

  console.log(`\n  target   /guides/${TARGET}/`);
  console.log(`  topic    ${topic ?? '(none)'}`);
  console.log(`  terms    ${scored.map((x) => `${x.w}(${x.df})`).join(', ')}`);
  console.log(`  distinctive (in <= ${DF_CEILING} of ${rows.length} guides): ${strong.join(', ') || 'NONE'}\n`);
  if (!strong.length) {
    console.log(`  Every term in this title appears across the library, so no sentence can be judged`);
    console.log(`  to be about THIS guide rather than the subject generally. Linking on those terms`);
    console.log(`  would be linking on coincidence. Give the guide a more distinctive subject, or`);
    console.log(`  place its links by hand.\n`);
    return;
  }

  const pool = rows.filter((r) => r.slug !== TARGET && (ALL_CLUSTERS || guideTopic(r.slug, r.title) === topic));
  const already = pool.filter((r) => String(r.body_markdown).includes(`/guides/${TARGET}/`));
  console.log(`  ${pool.length} guide(s) in scope, ${already.length} already link here\n`);

  let found = 0;
  for (const r of pool) {
    if (String(r.body_markdown).includes(`/guides/${TARGET}/`)) continue;
    const hits: Array<{ s: string; matched: string[] }> = [];
    for (const s of sentences(String(r.body_markdown))) {
      const lo = s.toLowerCase();
      // Require a DISTINCTIVE term, not just two generic ones. A sentence mentioning "pipe" is not
      // about Orangeburg pipe; a sentence mentioning "orangeburg" is.
      const matched = strong.filter((w) => lo.includes(w));
      if (matched.length) hits.push({ s, matched });
    }
    if (!hits.length) continue;
    found += hits.length;
    console.log(`  ${r.slug}`);
    for (const h of hits.slice(0, 3)) {
      console.log(`    [${h.matched.join(' + ')}]`);
      console.log(`    ${h.s.length > 200 ? `${h.s.slice(0, 200)}…` : h.s}`);
    }
    if (hits.length > 3) console.log(`    … and ${hits.length - 3} more sentence(s)`);
    console.log('');
  }

  if (!found) {
    console.log(`  NO HONEST ANCHOR FOUND${ALL_CLUSTERS ? '' : ' in this cluster — retry with --all-clusters'}.`);
    console.log(`  If nothing turns up there either, that is a finding: this guide is disconnected`);
    console.log(`  from the library. Write the connection into a guide that should have it, or`);
    console.log(`  reconsider whether the guide belongs. Do NOT insert a sentence to carry a link.\n`);
    return;
  }

  console.log(`  ${found} candidate sentence(s). Each one ALREADY discusses the target — no prose`);
  console.log(`  needs inventing. Pick the anchors, vary the wording between them (identical anchors`);
  console.log(`  repeated into one page are a footprint), then write them with a bulk-edit script`);
  console.log(`  that asserts each anchor matches exactly once and refuses bold-wrapped links.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
