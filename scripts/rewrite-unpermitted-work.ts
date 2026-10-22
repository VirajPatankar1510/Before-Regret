// Rewrite guide #287 find-unpermitted-work-before-buying through the write-article skill (owner request 2026-10-22,
// the second page in the "old pages with potential" pass after #13).
// State before: Google "Discovered - currently not indexed" (P0 baseline 2026-10-21); Bing shows it for buyer
// questions about unpermitted work ("i bought a house with unpermitted work", "who is responsible if the city makes
// you take it down", "is a house worth less").
//
//   npx tsx scripts/rewrite-unpermitted-work.ts            # dry run
//   APPLY=true npx tsx scripts/rewrite-unpermitted-work.ts
//
// Slug and title are unchanged. Meta and body are replaced from guides/find-unpermitted-work-before-buying.md, and the
// quick answer is CLEARED: the title is not a question, and the owner's rule (2026-10-09) puts the box on question
// titles only. The UPDATE runs only if the stored body still hashes to what was read on 2026-10-22.
// First-party: our Bing query capture (data/keywords/2026-10-21-bing-queries.json) set the page order and the
// "Already closed?" section; the permit-exemption table and the Texas/Washington comparison are our own, built from
// the primary texts. Facts: data/fact-ledgers/find-unpermitted-work-before-buying.json. Cut: insurer behaviour (no
// source), title-insurance exclusion (blocked), California TDS (not in searchable statute), "appraisers exclude
// unpermitted square footage" (Fannie Mae says comment on value impact, not exclude).
// The existing faq_json (8 items) repeats cut claims -- replace it with the article-faqs skill (--force) after APPLY.
//
// READ 2026-11-26: Google has shown the URL at least once (it was "Discovered - currently not indexed"), and Bing
// impressions over 28 days are not below the pre-rewrite run rate. If Google still hasn't indexed it, request
// indexing again; the rewrite itself is not undone.
import 'dotenv/config';
import './lib/neon-curl.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'find-unpermitted-work-before-buying';
const ID = 287;
const TITLE = 'Buying a House With Unpermitted Work: What You Take On';
const BODY_SHA_BEFORE = 'ea8c1c70097eeb5b7e3c3c1f18ffd785f1f281b12ad3884c42bc3a09ddb57848';
const SIBLINGS = ['look-up-building-permits-by-address', 'legalize-unpermitted-deck', 'check-code-violations-property-online', 'unpermitted-work-behind-the-wall', 'buying-house-unpermitted-deck-before-closing', 'unpermitted-deck-after-closing-who-pays'];
const UNVERIFIED_MENTIONED = new Set<string>();

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'unpermitted work home buying risk',
  capture: '2026-10-21-bing-queries',
  intent: 'informational',
  who: 'a buyer under contract who has found, or suspects, an addition, conversion or remodel with no permit on file',
  want: 'to know whether it even needed a permit, what becomes their problem at closing, and how the loan and the seller disclosure come into it',
  achieve: 'to settle it before closing as a finaled permit, a priced credit, or a walk-away under the contingency',
  titlePromise: 'what a buyer takes on when a house has unpermitted work, and how to settle it before closing',
  stopCondition: 'Read 2026-11-26: Google shows the URL at least once; Bing impressions hold. Else request indexing again.',
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'The house has work with no permit on file. Is that my problem once I buy it, and what should I do before closing?',
  firstScreen: 'The opening tells the reader to check first whether the work needed a permit at all, then the model-code exemption table answers that on the first screen.',
  firstParty: [
    { what: 'The questions buyers ask Bing that bring them to this page (including after closing), which set the page order and the "Already closed?" section', source: 'data/keywords/2026-10-21-bing-queries.json' },
    { what: 'Our table sorting common unpermitted-work cases against the 2021 IRC R105.1/R105.2 text, and our Texas vs Washington disclosure comparison, read 2026-10-22', source: 'data/fact-ledgers/find-unpermitted-work-before-buying.json' },
  ],
  evidenceOfWork: [
    'permit-exemption table built from IRC 2021 R105.2, read line by line on the ICC code site',
    'two-state disclosure comparison table from the statute texts (TX 5.008, WA 64.06)',
    'visible "How we checked this" naming what we read, when, and what we could not verify (California form, title policy, insurers, FHA/VA)',
  ],
  beyondCommonFacts: [
    'Some work with no permit never needed one: IRC R105.2 exempts e.g. freestanding decks up to 200 sq ft and 30 inches high, fences to 7 ft, retaining walls to 4 ft, finish work',
    'The model code makes it unlawful to OCCUPY a building in violation (R113.1) and lets notices go to the person responsible for occupancy (R113.2), which is why it passes to the new owner',
    'R108.6 adds a fee on top of normal permit fees for work started without a permit; R105.5 voids a permit after 180 days between inspections, so an old open permit may need a new one',
    'Fannie Mae B4-1.3-05 requires the appraiser to comment on an unpermitted addition and its value impact, not to reject it',
    'Texas asks only what the seller is aware of and exempts 11 kinds of sale; Washington asks about final inspections and gives 3 business days to rescind',
  ],
  reproducibilityCheck: 'A summary of the top results says "unpermitted work transfers to you, insurers may deny, appraisers may not count it". It would not give the R105.2 exemption list, the occupancy wording in R113, the R108.6 fee and R105.5 expiry, what Fannie Mae actually requires, or a side-by-side of two states\' disclosure forms and exit windows.',
  discussion: 'needed',
  discussionReason: 'The reader weighs whether the work needed a permit, what the seller did or did not have to disclose by state, and which of three outcomes (seller legalizes, credit, walk) fits; the after-closing case needs its own short treatment.',
};

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };

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

  const rows = (await withDb((sql) => sql`SELECT id, slug, status, title, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; status: string; title: string; body_markdown: string }>;
  const cur = rows.find((r) => r.id === ID);
  if (!cur || cur.slug !== SLUG || cur.status !== 'published') fail('row 287 is not the published unpermitted-work guide');
  else {
    const sha = crypto.createHash('sha256').update(cur.body_markdown).digest('hex');
    if (sha !== BODY_SHA_BEFORE) fail(`stored body changed since it was read (sha ${sha.slice(0, 12)}) -- re-read before rewriting`);
    if (cur.title !== TITLE) fail(`stored title changed: ${cur.title}`);
  }
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title differs from the live title -- this rewrite keeps it');
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('quick answer must be empty: the title is not a question (owner rule 2026-10-09)');
  if (guideTopic(SLUG, title) !== 'permits') fail(`topic ${guideTopic(SLUG, title)}, expected permits`);
  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (/^(19|20)\d0s$/.test(tok) || UNVERIFIED_MENTIONED.has(tok)) continue;
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/, /\[(CPSC|ASHI)\]/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  const oldBody = cur?.body_markdown ?? '';
  console.log(`    vs the old body of #287: ${(overlap(body, oldBody) * 100).toFixed(1)}% (a rewrite, not a light edit)`);

  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words (was ${oldBody.split(/\s+/).length})`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  const res = await withDb((sql) => sql`
    UPDATE articles SET meta_description = ${meta}, quick_answer = '', body_markdown = ${body}, updated_at = now()
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' RETURNING id`);
  if ((res as unknown as unknown[]).length !== 1) throw new Error('UPDATE touched no row');
  console.log(`  rewrote #${ID} ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
