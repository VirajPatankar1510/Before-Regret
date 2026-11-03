// Publish "Final Walkthrough Checklist: What to Do Before Closing" -- #3 of docs/plans/report-4-articles-2026-11.md
// (owner's exact title).
//
//   npx tsx scripts/publish-final-walkthrough-checklist.ts            # dry run
//   APPLY=true npx tsx scripts/publish-final-walkthrough-checklist.ts
//
// Facts: data/fact-ledgers/final-walkthrough-checklist-before-closing.json -- CFPB "Close the deal", TREC No. 20-19
// (05-04-2026) read line by line via the Internet Archive, 12 CFR 1026.19(f).
// First-party: the contract-to-checklist table (our reading of the state form) and the finding that the form has no
// walk-through clause. Demand: tier 3 -> experiment from the owner's list.
//
// READ 2026-12-08: shown on Google or Bing for at least one final-walk-through search. If not, offer the owner to fold
// the contract table into an existing transaction guide (owner OK first).
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'final-walkthrough-checklist-before-closing';
const TITLE = 'Final Walkthrough Checklist: What to Do Before Closing';
const TOPIC = 'transaction';
const SIBLINGS = ['when-reasonable-walk-away-after-inspection', 'seller-back-out-after-accepting-inspection-response', 'dont-skip-the-home-inspection', 'buying-house-unpermitted-deck-before-closing', 'open-ground-mean-electrical-inspection'];
const STOP =
  'Read 2026-12-08: shown on Google or Bing for at least one final-walk-through search. ' +
  'If not, offer the owner to fold the contract table into an existing transaction guide.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'final walkthrough checklist',
  capture: '2026-11-03-demand-final-walkthrough-checklist-bing',
  intent: 'informational',
  who: 'a buyer a day or two from closing who has a final walk-through booked and an inspection repair list',
  want: 'a checklist tied to what the contract actually promises, and what to do if something is wrong',
  achieve: 'to confirm repairs with receipts, fixtures, utilities and device access, and settle any problem in writing before signing',
  titlePromise: 'a final walkthrough checklist and what to do before closing',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'My walk-through is tomorrow. What exactly should I check, and what if something is not right?',
  firstScreen: 'CFPB advice in one line, then that the Texas state contract has no walk-through clause and what it promises instead, leading straight into the contract-matched checklist table.',
  firstParty: [
    { what: 'Texas state-promulgated resale contract TREC No. 20-19 (05-04-2026) read line by line and mapped to each walk-through check', source: 'data/fact-ledgers/final-walkthrough-checklist-before-closing.json' },
    { what: 'Our finding that the 12-page form contains no walk-through clause; access comes from paragraph 7A', source: 'data/fact-ledgers/final-walkthrough-checklist-before-closing.json' },
  ],
  evidenceOfWork: [
    'contract-to-checklist table citing TREC paragraphs, checked against the ledger by this script',
    'visible "How we checked this" naming the form edition, how it was read and what was left out',
  ],
  beyondCommonFacts: [
    'TREC 20-19 7F: seller must give documentation of scope of work and payment, and buyer may extend closing up to 5 days for unfinished repairs',
    'TREC 20-19 10B: seller must hand over smart-device codes and apps and remove access from their own devices',
    'TREC 20-19 14: casualty loss options -- terminate, extend up to 15 days, or take insurance proceeds plus deductible credit',
    '12 CFR 1026.19(f)(2): a corrected Closing Disclosure restarts the three-day wait only for APR, loan product or prepayment penalty changes',
  ],
  reproducibilityCheck: 'Top results are generic room-by-room lists. None ties each check to a real contract paragraph, notes the standard form has no walk-through clause, lists the repair-documentation, smart-device and casualty-loss terms, or explains when a walk-through credit restarts the Closing Disclosure clock.',
  discussion: 'needed',
  discussionReason: 'The reader must decide what to do if something is wrong: extend, take a credit, or walk away, and how each interacts with the contract and the lender timeline.',
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

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('non-question title carries a quick answer');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // Every TREC paragraph the table cites must say, in the ledger, what the table says it does.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const para of ['7A', '7F', '10A', '2B', '2C', '2D', '10B', '14', '15']) {
    if (!new RegExp(`paragraph ${para}\\b|Paragraph ${para}\\b|${para}[: ]`).test(ledgerAll)) fail(`TREC paragraph ${para} cited in the article but not in the ledger`);
    if (!body.includes(`aragraph ${para}`)) fail(`ledger paragraph ${para} not cited in body`);
  }
  if (/walk-?through/i.test(JSON.stringify(ledger.facts.find((f: { id: string }) => f.id === 'f2')?.quote))) fail('f2 quote should show the contract has no walk-through clause');
  const costRows = body.split('\n').filter((l) => /^\| .*Paragraph/.test(l)).length;
  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick: none (non-question title)\n    body  ${body.split(/\s+/).length} words, ${costRows} contract rows, TREC paragraphs checked against the ledger`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
