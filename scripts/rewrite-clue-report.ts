// Rewrite guide #13 get-clue-report-before-buying-house through the write-article skill (owner request 2026-10-19:
// "check the old pages that haven't been indexed or have very less impressions but have huge potential ... run it
// through our new /write-article").
// State before: Google "Discovered - currently not indexed", 0 impressions in 90 days; Bing 131 impressions, 4 clicks.
//
//   npx tsx scripts/rewrite-clue-report.ts            # dry run
//   APPLY=true npx tsx scripts/rewrite-clue-report.ts
//
// Slug and title are unchanged (Bing shows the page under this title, and #286, #313, #322 and #327 link to it).
// Meta, quick answer and body are replaced from guides/get-clue-report-before-buying-house.md. The UPDATE runs only
// if the stored body still hashes to what was read on 2026-10-19.
// First-party: our Bing query capture (data/keywords/2026-10-17-bing-queries.json) shaped the order of the page; the
// lookback table is our side-by-side of four official pages. Facts: data/fact-ledgers/get-clue-report-before-buying-house.json.
// Cut from the old page: "insurer details" and "claim status" fields, the NAR contingency-clause claim, the "agent can
// run the address through underwriting databases" claim, and the fear opening.
// The existing faq_json repeats cut claims (open claims, insurer details) -- replace it with the article-faqs skill
// (--force) after APPLY.
//
// READ 2026-11-23: Google has shown the URL at least once (it was "Discovered - currently not indexed"), and Bing
// impressions over 28 days are not below the pre-rewrite run rate. If Google still hasn't indexed it, request indexing
// again; the rewrite itself is not undone.
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
const SLUG = 'get-clue-report-before-buying-house';
const ID = 13;
const TITLE = 'Can You Get a CLUE Report Before Buying a House?';
const BODY_SHA_BEFORE = '3bb06e1eae6932351079d89f6aa97a97dc8c2dad62694d4690a66c81495b9b6e';
const SIBLINGS = ['polybutylene-pipes-home-insurance', 'flood-zone-by-address', 'hurricane-flood-insurance-gulf-coast-homebuyers', 'look-up-building-permits-by-address'];
const UNVERIFIED_MENTIONED = new Set<string>();

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'how to get a clue report for a home',
  capture: '2026-10-17-bing-queries',
  intent: 'informational',
  who: 'a buyer under contract, or about to offer, who wants to see the house\'s insurance claims history before closing',
  want: 'whether they can pull the CLUE report themselves, and if not, exactly what to ask the seller for and where the seller gets it',
  achieve: 'to have the claims history in hand, and a written insurance quote, before the inspection or insurance contingency ends',
  titlePromise: 'whether a buyer can get a CLUE report before buying, and how to get it through the seller',
  stopCondition: 'Read 2026-11-23: Google shows the URL at least once; Bing impressions hold. Else request indexing again.',
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'How do I get the CLUE report on a house I\'m buying, when it isn\'t mine yet?',
  firstScreen: 'The quick answer says no, names who can (owner, insurer, lender), and tells the reader to ask the seller for both the C.L.U.E. and the A-PLUS report; the first section gives the wording to send and the two places the seller orders them.',
  firstParty: [
    { what: 'The Bing searches that bring people to this page (how to get / order / for a property), which set the page order', source: 'data/keywords/2026-10-17-bing-queries.json' },
    { what: 'Our side-by-side of what four official pages say about the claims lookback (CFPB x2, Connecticut, Utah), read 2026-10-19', source: 'data/fact-ledgers/get-clue-report-before-buying-house.json' },
  ],
  evidenceOfWork: [
    'lookback table built from four official pages, labelled as ours',
    'visible "How we checked this" section naming what we read, when, and what we could not verify (flood claims, two blocked state pages, conflicting phone numbers)',
    'a request the reader can send the seller, with the two reporting companies from the CFPB listing',
  ],
  beyondCommonFacts: [
    'A second claims database, Verisk A-PLUS Property, is on the CFPB list and is also free once a year; most buyer guides only name C.L.U.E.',
    'The free copy is a legal right: 15 U.S.C. 1681a(x)(5) names insurance-claims files, and 1681j(a)(1)(A) requires a free disclosure once in any 12-month period',
    'Connecticut says no law specifically governs use of a prior owner\'s loss history, and a company may use it if it can show a relationship to future loss',
    'Official pages disagree on the lookback: seven years (CFPB, Connecticut) versus five (Utah)',
    'A claim filed and paid nothing may appear; an inquiry about coverage should not (Connecticut)',
  ],
  reproducibilityCheck: 'A summary of the top results gives "ask the seller, seven years, LexisNexis". It would not give the A-PLUS second report, the FCRA sections that make the copy free, the regulator line on prior-owner history, the 5-versus-7-year disagreement, or the dispute timing from two states.',
  discussion: 'needed',
  discussionReason: 'The reader weighs sources that disagree (lookback), what a clean report does and does not prove, and what to do when the seller refuses; how the seller\'s claims may count against the buyer needs explaining with its state-level caveat.',
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
  if (!cur || cur.slug !== SLUG || cur.status !== 'published') fail('row 13 is not the published CLUE guide');
  else {
    const sha = crypto.createHash('sha256').update(cur.body_markdown).digest('hex');
    if (sha !== BODY_SHA_BEFORE) fail(`stored body changed since it was read (sha ${sha.slice(0, 12)}) -- re-read before rewriting`);
    if (cur.title !== TITLE) fail(`stored title changed: ${cur.title}`);
  }
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title differs from the live title -- this rewrite keeps it');
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (guideTopic(SLUG, title) !== 'insurance') fail(`topic ${guideTopic(SLUG, title)}, expected insurance`);
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
  console.log(`    vs the old body of #13: ${(overlap(body, oldBody) * 100).toFixed(1)}% (a rewrite, not a light edit)`);

  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words (was ${oldBody.split(/\s+/).length})`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  const res = await withDb((sql) => sql`
    UPDATE articles SET meta_description = ${meta}, quick_answer = ${quick}, body_markdown = ${body}, updated_at = now()
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' RETURNING id`);
  if ((res as unknown as unknown[]).length !== 1) throw new Error('UPDATE touched no row');
  console.log(`  rewrote #${ID} ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
