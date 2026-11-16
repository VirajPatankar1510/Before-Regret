// Publish "New Mexico Contractor License Lookup and the $7,200 Limit" -- state 7 of the 50-state contractor-license set
// (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each page goes
// live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-new-mexico-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-new-mexico-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/new-mexico.json -- RLD's Verify a License page (CID checks go to PSI), the PSI
// search form read on 2026-11-16 (no search run: every search needs a CAPTCHA, which we do not solve), NMSA 1978
// 60-13-3 and 60-13-30 on NMOneSource, 14.6.2 / 14.6.3 / 14.6.6 NMAC on srca.nm.gov, CID's FAQ and Unlicensed Violations
// pages, and RLD's Enforcement Actions page.
// First-party: the form walk and its quirks, our screenshot of the blank form, and the observation that the department's
// Enforcement Actions page lists no Construction Industries link.
// Demand: tier 2 (topic-demand 2026-11-16: "new mexico contractor license lookup", "nm rld license lookup" in Bing).
//
// READ 5 weeks after it goes live (date in the tracker): shown on Google or Bing for at least one New Mexico contractor
// license search. Re-check the PSI page, the $7,200 limit and the FAQ answers by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'new-mexico-contractor-license-lookup';
const TITLE = 'New Mexico Contractor License Lookup and the $7,200 Limit';
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/new-mexico-license-search-form.jpg';
// California, Oregon, Washington, Texas, Tennessee and Virginia are live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'oregon-contractor-license-lookup',
  'washington-contractor-license-lookup',
  'texas-contractor-license-lookup',
  'tennessee-contractor-license-lookup',
  'virginia-contractor-license-lookup',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one New Mexico contractor license search. ' +
  'If the first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'new mexico contractor license lookup',
  capture: '2026-11-16-demand-new-mexico-contractor-license-bing',
  intent: 'navigational',
  who: 'a New Mexico homeowner or buyer about to hire a contractor or handyman, looking for the state license search, and the contractor checking what clients see',
  want: 'to reach the right search, find the business despite the form quirks, and know whether the license code covers this job',
  achieve: 'to read a classification code like GB-2, know when an unlicensed handyman is lawful under the $7,200 rule, and know which work an owner may do with a permit',
  titlePromise: 'where the New Mexico contractor license search is and what the $7,200 handyman limit allows',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Where do I check a New Mexico contractor license, and does the person I hire even need one?',
  firstScreen: 'The PSI search link in the first lines (the state sends you there), and the two checks: the classification code on the license, and the $7,200-a-year handyman limit.',
  firstParty: [
    { what: 'The PSI search walked on 2026-11-16: two search modes, a company-type list mixing contractor, LP gas and manufactured-housing types, the first-word business-name rule, the 3-character minimum and a CAPTCHA on every search (so no record was read)', source: 'data/fact-ledgers/state-license/new-mexico.json' },
    { what: 'Our screenshot of the blank search form, cropped above the CAPTCHA', source: 'public/images/new-mexico-license-search-form.jpg' },
    { what: 'Observation that the department Enforcement Actions page links three divisions and not Construction Industries', source: 'data/fact-ledgers/state-license/new-mexico.json' },
  ],
  evidenceOfWork: [
    'screenshot taken on the read date with no names in it',
    'visible "How we checked this" naming the form walk, the statute and rule sections read, and three things we could not confirm, including why no record was read',
  ],
  beyondCommonFacts: [
    'the $7,200 handyman limit is a yearly total across all jobs, never covers wiring, plumbing or gas, and needs an annual declaration and no advertising (60-13-3 D(14), 14.6.2.8 NMAC)',
    'the code scheme (field letter, type letter, trade number) and that a license only authorizes its own classification (14.6.6.8, 14.6.3 NMAC)',
    'homeowners may wire their own house only after passing a CID exam at 75%, may plumb with an isometric drawing, but may not run ductwork or swap a water heater',
    'an unlicensed contractor cannot sue for payment or file a mechanic lien (60-13-30)',
    'the $10,000 bond only cures division-certified code violations, with a two-year claim window from final inspection or certificate of occupancy',
  ],
  reproducibilityCheck: 'Top results are the RLD and PSI pages and lead-gen posts listing license types. None reads the PSI form and its quirks, ties the $7,200 handyman conditions to what a homeowner should ask, lists CID\'s own homeowner rulings next to the license code scheme, or explains how narrow the $10,000 bond is.',
  discussion: 'needed',
  discussionReason: 'The reader must decide whether a job needs a licensed contractor, can go to a handyman, or can be done themselves with a permit, and the answer changes by trade.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'new-mexico.json'), 'utf8'));

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

  // The official tool must be linked in the first paragraph (owner rule for new navigational guides).
  const firstPara = body.split(/\n\s*\n/)[0];
  if (!firstPara.includes(ledger.officialLookupUrl)) fail('official lookup not linked in the first paragraph');
  if (!body.includes(`](${IMAGE} `) || !fs.existsSync(path.join(process.cwd(), 'public', IMAGE))) fail('screenshot missing from body or disk');

  // Every section cited must be in the ledger; every long quotation must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['60-13-3', '60-13-30', '60-13-52', '14.6.2.8', '14.6.6.8', '14.6.3', '14.5.2.18']) {
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
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Safety National|Chubb|Home Depot)\b/i,
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
