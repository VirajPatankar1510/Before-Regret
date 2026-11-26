// Publish /guides/mortgage-house-fuse-box/ -- can you get a mortgage (FHA, VA, conventional) on a house with a fuse box.
// A NEW URL: #76 covers fuse-box INSURANCE only; #338 is the same question for knob and tube; #50's mortgage section is FPE only.
//
//   npx tsx scripts/publish-mortgage-house-fuse-box.ts            # dry run
//   APPLY=true npx tsx scripts/publish-mortgage-house-fuse-box.ts
//
// WHY. Report-4 plan #9 (docs/plans/report-4-articles-2026-11.md), owner chose it first 2026-11-26.
// Demand is tier 3 for the exact question ("fuse box mortgage": 0 Bing, no GSC rows, capture 2026-11-26); the format
// evidence is the "will the defect stop the loan" click pattern (#338 1.11% CTR, #76 2.40%). EXPERIMENT, stop below.
//
// DECISION MAP. Reader's question: "Can I still get my mortgage if the house has a fuse box?"
//   do FHA / VA / Fannie ban fuse boxes?          -> section + table: none mentions fuses (our full-text search)
//   what can the appraiser flag?                  -> section: FHA amperage/panel-size line, VA exposed wires, Topic 44 waiver limit
//   what condition rating blocks a conventional?  -> section: Fannie C6 -> repair to C5
//   will I get insurance, and does the lender care -> section: Fannie B7-3-02 fire peril; B7-3-01 FAIR plan fallback; #76 for underwriting
//   who pays / how to finance a new panel         -> section: engine $1,500-$4,000; Limited 203(k) $75,000; Standard 203(k) 100 amp item
//   what do I do before the contingency ends      -> section: four-item list
//   USDA / Freddie Mac rules                      -> skipped: USDA 403, Freddie not read (said on the page)
//
// First-party: our full-text searches of HUD 4000.1 (fuse 0 / circuit breaker 0 / amperage on 2 of 1,871 pages),
// VA Ch. 12 and Fannie B4-1.3-06; our engine's panel cost. Facts: data/fact-ledgers/mortgage-house-fuse-box.json.
// READ 2026-12-31 at the earliest: seen / chosen / acted.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const OWNER_TITLE_OK = process.env.OWNER_TITLE_OK === 'true';
const SLUG = 'mortgage-house-fuse-box';
const TITLE = 'Can You Get a Mortgage on a House With a Fuse Box?';
const TOPIC = 'electrical';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'get-home-insurance-fuse-box',
  'mortgage-house-knob-and-tube-wiring',
  'federal-pacific-stab-lok-panel-inspectors-flag',
  'two-prong-outlets-buying-house',
  'pushmatic-panel-buying-house',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one fuse-box mortgage, FHA or lender search. ' +
  'If not, no more "will the defect stop the loan" pages for other defects.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'mortgage on a house with a fuse box',
  capture: '2026-11-26-demand-federal-pacific-insurance-bing',
  intent: 'informational',
  who: 'a US home buyer under contract or about to offer on an older house that still has a fuse box',
  want: 'to know whether an FHA, VA or conventional loan can close on the house, and what could stop it',
  achieve: 'to get the amperage recorded, an insurance quote that names the fuse box, and an electrician quote before the contingency ends',
  titlePromise: 'whether you can get a mortgage on a house with a fuse box',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Can I get a mortgage on a house with a fuse box, and what could stop the loan?',
  firstScreen: 'The quick answer (usually yes; no rulebook mentions fuses) and the three things that actually matter: the appraiser, the condition rating, the insurance policy.',
  firstParty: [
    { what: 'Our full-text search of HUD Handbook 4000.1 (1,871 pages, revised 08/13/2025) on 2026-11-26: "fuse" 0 hits, "circuit breaker" 0 hits, amperage only on PDF pages 556 and 854', source: 'data/fact-ledgers/mortgage-house-fuse-box.json' },
    { what: 'Our full-text search of VA Pamphlet 26-7 Chapter 12 and Fannie Mae B4-1.3-06: no fuse, breaker or amperage rule', source: 'data/fact-ledgers/mortgage-house-fuse-box.json' },
    { what: 'Our report engine panel replacement range $1,500 - $4,000', source: 'src/engine/inspectionPriorities.ts' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the three rulebooks, the date, the archive route around the hud.gov bot check, and what was not covered (USDA 403, Freddie Mac)',
    'a table of what each rulebook says about fuses and electrical, from our own searches',
  ],
  beyondCommonFacts: [
    'the FHA handbook mentions amperage on only two of 1,871 pages; the 60-amp FHA minimum repeated online is not in it',
    'Fannie Mae B7-3-01 accepts a state FAIR plan policy only when it is the only coverage obtainable at closing or renewal',
    'the Standard 203(k) consultant item 28 requires the greater of 100 amp or local code, so a Standard 203(k) means a service upgrade',
    'VA Topic 44 waivers should not cover safety items, so exposed wiring cannot be waived away',
  ],
  reproducibilityCheck: 'Top results are lender and agent blog posts that repeat a 60-amp FHA rule or say fuse boxes are banned. None searched the handbook, none cites the Fannie FAIR-plan fallback or the Standard 203(k) 100 amp work item.',
  discussion: 'needed',
  discussionReason: 'The answer differs by loan type (FHA, VA, conventional, 203(k)) and by whether insurance can be found, so the reader has to weigh which route applies.',
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
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  let titlePending = false;
  if (title.length > 60) {
    const canon = fs.readFileSync(path.join(process.cwd(), 'scripts', 'assert-canonical-urls.ts'), 'utf8');
    if (!canon.includes(`'/guides/${SLUG}/'`)) {
      titlePending = true;
      console.log(`  OWNER DECISION title is ${title.length} chars: confirm the owner's exact title (add to OWNER_LONG_TITLES) or pick the short one`);
    }
  }
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars (question title needs 120-450)`);
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  const firstPara = body.split(/\n\s*\n/)[0];
  void firstPara;
  for (const img of IMAGES)
    if (!body.includes(`](${img} `) || !fs.existsSync(path.join(process.cwd(), 'public', img))) fail(`screenshot ${img} missing from body or disk`);
  for (const r of ['4000.1', 'B4-1.3-06', 'B7-3-01', 'FAIR plan', '203(k)', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in the ledger (facts or our portal walk).
  const ledgerAll = JSON.stringify({ facts: ledger.facts, ourWork: ledger.ourWork });
  const ledgerQuotes = norm(ledger.facts.map((f: { quote: string }) => f.quote).join(' '));
  for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!ledgerQuotes.includes(norm(m[1]))) fail(`quoted text not found in a ledger quote: "${m[1]}"`);
  }
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?%?\d[\d,./-]*%?/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies|contractors) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens Property|Universal Property)\b/i,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/, /^#{2,3}\s+Step\s+\d/im,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    if (!published.has(sib)) { fail(`sibling ${sib} not published`); continue; }
    const ov = overlap(body, published.get(sib)!);
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}  [${TOPIC}]\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log(`\n  DRY RUN -- all checks pass${titlePending ? ' (title awaits the owner)' : ''}.\n`); return; }
  if (titlePending && !OWNER_TITLE_OK) { console.log('\n  title awaits the owner -- nothing written.'); process.exit(1); }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
