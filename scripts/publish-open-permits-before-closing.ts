// Publish "Resolving Open Building Permits Before Closing" -- the owner's title, word for word (2026-11-12).
// Scoped narrow by owner decision: how an open or expired permit gets closed, who answers for it after a sale, and what
// the 2021 ALTA homeowner's title policy covers. Unpermitted work stays with find-unpermitted-work-before-buying (#287)
// and the lookup with look-up-building-permits-by-address (#286); this page links to both and repeats neither.
//
//   npx tsx scripts/publish-open-permits-before-closing.ts            # dry run
//   APPLY=true npx tsx scripts/publish-open-permits-before-closing.ts
//
// Facts: data/fact-ledgers/resolve-open-building-permits-before-closing.json -- Fla. Stat. 553.79(16)-(17) (2026 text),
// City of Austin Modify a Permit, Portland BDS reactivation guide (rev. 2019-03-15), Wyckoff NJ assessor FAQ, ALTA
// Homeowner's Policy (07/01/2021) sample. First-party: the three-place comparison table, and our own GSC query
// ("how to check for open permits on a home in coral gables"). No insurer named.
// Demand: tier 1, weak (topic-demand 2026-11-12).
//
// READ 2026-12-17: shown on Google or Bing for at least one open/expired permit search. If not, write no more permit-
// process pages and offer (owner OK only) to fold the table into #286. Re-check the three places' rules by 2027-05-12.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'resolve-open-building-permits-before-closing';
const TITLE = 'Resolving Open Building Permits Before Closing';
const TOPIC = 'permits';
const SIBLINGS = [
  'find-unpermitted-work-before-buying',
  'look-up-building-permits-by-address',
  'buying-house-unpermitted-deck-before-closing',
  'legalize-unpermitted-deck',
  'check-code-violations-property-online',
  'check-building-permits-miami-dade-county-fl',
];
const STOP =
  'Read 2026-12-17: shown on Google or Bing for at least one open or expired permit search. If not, write no more ' +
  'permit-process pages and offer, with owner OK only, to fold the comparison table into look-up-building-permits-by-address.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'open permits on a home',
  capture: '2026-11-12-demand-open-permit-gsc',
  intent: 'informational',
  who: 'a buyer under contract whose permit search or title company turned up an open or expired building permit on the house',
  want: 'who has to close the permit, what happens if it is still open after closing, and whether title insurance helps',
  achieve: 'to make closing the permit the seller job in writing, know the local rule if it slips past closing, and disclose it to the title company',
  titlePromise: 'how to get an open building permit resolved before closing',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'The permit search found an open permit on the house I am buying. Who fixes it, and what if it is still open when I close?',
  firstScreen: 'Open versus unpermitted in two lines, links to the lookup and the unpermitted-work guide, then the status trap and who can act before closing.',
  firstParty: [
    { what: 'Comparison of how Florida (state law), Austin and Portland treat an open or expired permit after a sale: who answers for it, when it lapses, how it is revived, and what happens if it is too late', source: 'data/fact-ledgers/resolve-open-building-permits-before-closing.json' },
    { what: 'Our own Search Console query that reaches our Miami-Dade guide: how to check for open permits on a home in coral gables', source: 'data/keywords/2026-11-12-demand-open-permit-gsc.json' },
  ],
  evidenceOfWork: [
    'three-place table citing each source, checked against the ledger by this script',
    'visible "How we checked this" naming the statute, city pages, assessor FAQ and title policy read on the date, and what we could not confirm',
  ],
  beyondCommonFacts: [
    'Florida 553.79(17)(a): a buyer for value cannot be cited, fined or denied a permit solely for a prior owner unclosed permit, while Austin makes the current owner responsible',
    'Florida 553.79(16): any owner can close a permit with a new contractor who is not liable for the original defects; expired but substantially complete work closes under the original code; 6-year administrative close',
    'Portland: an expired permit can be revived only within 180 days, then it is void and must meet current code; Cancelled has also meant expired or void',
    'Austin reactivation must be signed by the owner as listed in the appraisal district registry, which is the seller before closing',
    'ALTA homeowner policy CR 18 covers forced fixes of work built without a permit, subject to an insurer-set deductible and cap, and excludes what you knew and did not disclose in writing; it does not name open permits',
  ],
  reproducibilityCheck: 'Top results are agent and attorney blogs saying the buyer inherits everything and title insurance never covers permits. None quotes the Florida purchaser protection, compares cities on revival windows, or reads the homeowner title policy covered risk and its exclusions.',
  discussion: 'needed',
  discussionReason: 'The answer changes by place (Florida protects the buyer, Austin does not) and the reader must weigh closing it now against relying on a narrow title coverage.',
};

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };
const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');

async function main() {
  validateBriefs(BRIEFS);
  validateEffortBrief(EFFORT);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };

  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${SLUG}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => (front[1].match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
  const rest = raw.slice(front[0].length);
  const title = rest.match(/^#\s+(.*)$/m)![1].trim();
  const body = rest.replace(/^#\s.*\n+/, '').trim();
  const meta = field('meta'), quick = field('quick');
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`), 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  // Owner rule 2026-10-09: a quick answer only on a question title. This title is not one.
  if (/\?|^(can|does|do|is|are|what|how|why|should|will)\b/i.test(title)) fail('title reads as a question; it would need a quick answer');
  if (quick) fail('quick answer present on a non-question title');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // Scope guard: this page links to the two pages that own the neighbouring topics and must not compete with them.
  for (const s of ['find-unpermitted-work-before-buying', 'look-up-building-permits-by-address']) if (!body.includes(`/guides/${s}/`)) fail(`must link ${s}`);
  const rows3 = body.split('\n').filter((l) => /^\| (Who answers|When a permit lapses|Reviving it|If it's too late|Sources) /.test(l)).length;
  if (rows3 !== 5) fail(`expected 5 table rows, found ${rows3}`);

  // Every section cited must be in the ledger; every long quotation must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['553.79']) {
    if (!all.includes(sec)) fail(`section ${sec} expected in the article`);
    if (!ledgerAll.includes(sec)) fail(`section ${sec} not in ledger`);
  }
  const ledgerQuotes = norm(ledger.facts.map((f: { quote: string }) => f.quote).join(' '));
  // The screenshot line is our own caption and alt text, not a quotation of a source.
  for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!ledgerQuotes.includes(norm(m[1]))) fail(`quoted text not found in a ledger quote: "${m[1]}"`);
  }
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies|contractors) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Chubb|Chicago Title|Fidelity|First American|Stewart|Old Republic|Ticor)\b/i,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    if (!published.has(sib)) { fail(`sibling ${sib} not published`); continue; }
    const ov = overlap(body, published.get(sib)!);
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    body  ${body.split(/\s+/).length} words; sections, quotes and numbers checked against the ledger`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, '', ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
