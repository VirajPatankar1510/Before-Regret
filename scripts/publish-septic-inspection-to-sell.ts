// Publish "Do You Need a Septic Inspection to Sell? State Rules" -- T2 of docs/plans/report-4-articles-2026-11.md
// (an "AI gap" topic: online lists of state septic-at-sale rules contradict each other; EPA says only "many states").
//
//   npx tsx scripts/publish-septic-inspection-to-sell.ts            # dry run
//   APPLY=true npx tsx scripts/publish-septic-inspection-to-sell.ts
//
// Facts: data/fact-ledgers/septic-inspection-to-sell-state-rules.json -- 310 CMR 15.301/15.305 (MA), Iowa Code
// 455B.172(11), Ariz. Admin. Code R18-9-A316, 30-A M.R.S. 4216 (ME), R.I. Gen. Laws 23-19.15-12, Minn. Stat. 115.55
// subd. 6. Delaware and New Hampshire listed as reported, not verified. First-party: the state-by-state table.
// Demand: Bing tier 2 "septic inspection".
//
// READ 2026-12-15: shown on Google or Bing for at least one septic-inspection-at-sale search. Re-check every state's
// rule by 2027-05-10, and add states as their texts become readable.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'septic-inspection-to-sell-state-rules';
const TITLE = 'Do You Need a Septic Inspection to Sell? State Rules';
const TOPIC = 'plumbing';
const SIBLINGS = ['city-utilities-vs-septic-water-sewer-costs', 'home-inspection-include-septic-system', 'sewer-lateral-inspection-at-sale-cities', 'dont-skip-the-home-inspection', 'final-walkthrough-checklist-before-closing'];
const STOP =
  'Read 2026-12-15: shown on Google or Bing for at least one septic-inspection-at-sale search. If not, offer to fold the ' +
  'state table into the septic inspection guide. Re-check every state rule by 2027-05-10.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'septic inspection',
  capture: '2026-11-09-demand-roof-age-insurance-bing',
  intent: 'informational',
  who: 'a seller or buyer of a house on septic who needs to know whether their state requires an inspection or disclosure at sale',
  want: 'the actual state rule: what is required, who must arrange it, the deadlines, and what happens if the system fails',
  achieve: 'to book the right inspection on time, ask for old reports that still count, and know who pays if the system fails',
  titlePromise: 'whether you need a septic inspection to sell, with the rules by state',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am selling or buying a house on septic. Does my state require an inspection, and who has to do it?',
  firstScreen: 'Quick answer naming the verified states and their rule type, then the note that online lists disagree and the state-by-state table.',
  firstParty: [
    { what: 'State-by-state table of septic-at-sale rules built from each state\'s own statute or regulation, dated 2026-11-10, with blocked states listed as reported', source: 'data/fact-ledgers/septic-inspection-to-sell-state-rules.json' },
  ],
  evidenceOfWork: [
    'table citing each state section, checked against the ledger by this script',
    'visible "How we checked this" naming each source, how blocked texts were read, and what we are not claiming',
  ],
  beyondCommonFacts: [
    'Iowa: the county recorder will not record the deed without the inspector\'s report or a buyer commitment',
    'Maine puts the shoreland inspection on the buyer; 9 months if weather prevents it; repair within one year',
    'Massachusetts accepts a 3-year-old report only with yearly pumping records; failing systems upgrade within two years',
    'Minnesota requires disclosure, not inspection, and makes a knowing non-discloser liable for compliance costs',
  ],
  reproducibilityCheck: 'Top results are blog lists that contradict each other and rarely cite a section. None quotes each state\'s rule with who arranges it, the deadline and the failure consequence, or marks which states could not be verified.',
  discussion: 'needed',
  discussionReason: 'Buyer and seller must work out which side the rule falls on, whether an old report counts, and who pays for a failing system, which differs by state.',
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
  if (!title.includes('?')) fail('quick answer needs a question title');
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (!/^(No|Yes|Usually|Generally|It can|Not usually|It depends)\b/.test(quick)) fail('quick answer must open with a verdict');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // Every statute section cited must be in the ledger, and every TDI table quote must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['310 CMR 15.301', '15.305', '455B.172', 'R18-9-A316', '4216', '23-19.15-12', '115.55']) {
    if (!body.includes(sec)) fail(`section ${sec} expected in body`);
    if (!ledgerAll.includes(sec)) fail(`section ${sec} not in ledger`);
  }
  for (const m of body.matchAll(/"([^"]{12,})"/g)) {
    const norm = (x: string) => x.toLowerCase().replace(/[\u2018\u2019]/g, "'");
    if (!norm(ledgerAll).includes(norm(m[1]))) fail(`quoted text not found in ledger: "${m[1]}"`);
  }
  const costRows = body.split('\n').filter((l) => /^\| \*\*(Massachusetts|Iowa|Arizona|Maine|Rhode Island|Minnesota)/.test(l)).length;
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words, ${costRows} state rows; statute sections and quotes checked against the ledger`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
