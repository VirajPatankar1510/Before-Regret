// Publish /guides/before-regret-home-report-checks-by-year-built/ -- what a Before Regret report checks, by build year.
// A NEW URL. Owner-directed 2026-11-24 ("Brand in title + how-it-works page") after topic-demand.ts showed zero Google
// impressions for "before regret" in 16 months. A brand page: the name in the title and H1, a prose link to the homepage,
// and a first-party table read straight from the report engine. Tier 3 demand: an experiment with a stop condition.
//
//   npx tsx scripts/build-report-checks-table.ts                                  # regenerate the engine table first
//   npx tsx scripts/publish-before-regret-report-checks-guide.ts                  # dry run
//   APPLY=true npx tsx scripts/publish-before-regret-report-checks-guide.ts
//
// DECISION MAP. Reader's question: "What is Before Regret and what does its report actually check?"
//   what do I type / what is looked up?   -> address (live Census geocoder + tract), property type, year built (unverified)
//   what are the checks?                  -> the 20 PRIORITY_RULES with build-year window, region, cost to check
//   why is my list long or short?         -> window overlap: 1955 and 1968 get 12 items in Cook County, 2015 gets 4
//   where does location matter?           -> 13 expansive-clay counties, 19 termite states, 15 landslide states
//   what isn't it?                        -> not a finding about the house; records list = not checked; seller answers unchecked
//
// Facts: data/fact-ledgers/before-regret-home-report-checks-by-year-built.json. Engine table: docs/data/report-checks-by-year.json.
// If PRIORITY_RULES changes, the published table goes stale: re-run the build script and tell the owner.
// READ 2026-12-29 at the earliest: any Google impression for a query containing "before regret" (homepage or this page),
// and this page's own impressions.
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
const SLUG = 'before-regret-home-report-checks-by-year-built';
const TITLE = 'Before Regret Home Report: What It Checks by Year Built';
const TOPIC = 'house-age';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'when-was-my-house-built-by-address',
  'sewer-scope-before-buying-house',
  'is-knob-and-tube-wiring-still-live',
  'spot-polybutylene-pipes-before-buying-house',
  'look-up-building-permits-by-address',
];
const STOP =
  'Read 5 weeks after going live: at least one Google impression for a query containing "before regret" on the homepage or ' +
  'this page, or this page shown for any query. If neither, brand pages are not the lever; put the effort into brand mentions.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'before regret home report',
  capture: '2026-11-24-demand-before-regret-gsc',
  intent: 'informational',
  who: 'a US home buyer who has heard of Before Regret or landed on a report and wants to know what it checks before trusting it',
  want: 'to see exactly which checks a report shows for a house of a given build year and place, and what the report does not know',
  achieve: 'to run a report with the right year built and use its lists as a checklist for the inspector, the seller and the records offices',
  titlePromise: 'what a Before Regret home report checks, laid out by the year the house was built',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'What is Before Regret, and what will its report check for the house I am looking at?',
  firstScreen: 'One paragraph saying what Before Regret is, the four lists a report gives, that nothing is a finding about the house, and that the inspection list is 20 fixed rules by build year and place.',
  firstParty: [
    { what: 'The 20 report rules with build-year windows, regions and cost to check, generated from PRIORITY_RULES by script (no retyping)', source: 'docs/data/report-checks-by-year.json' },
    { what: 'Engine run for Cook County IL at seven build years (1925: 11 items, 1955 and 1968: 12, 2015: 4) and a live report on South Pasadena City Hall entered as built 1925 (12 / 6 / 5)', source: 'data/fact-ledgers/before-regret-home-report-checks-by-year-built.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the script that read the engine, the Cook County runs and the live City Hall report on 2026-11-24',
    'says what it does not cover: the 13 county list and the total number of seller questions',
  ],
  beyondCommonFacts: [
    'the exact build-year window of every check (knob-and-tube up to 1955, aluminum wiring 1965 to 1973, polybutylene 1978 to 1996, stucco type 1990 to 2005)',
    'houses from the 1950s and 1960s get the longest list because the windows overlap there; a 2015 house gets 4 items',
    'location swaps rules: 13 expansive-clay counties, 19 termite states, 15 landslide states',
    'the year built is not verified and decides most of the list',
  ],
  reproducibilityCheck: 'Nobody else can publish this: the table is our own report engine, generated from its source, and the counts come from running it. Generic home inspection checklists do not tie items to build-year windows.',
  discussion: 'not-needed',
  discussionReason: 'An explainer of a tool: the reader needs to know what it checks and what it does not, not a weighing of trade-offs.',
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
  if (/\?|^(can|does|do|is|are|what|how|why|should|will)\b/i.test(title)) fail('title reads as a question; it would need a quick answer');
  if (quick) fail('quick answer present on a non-question title');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  const firstPara = body.split(/\n\s*\n/)[0];
  if (!firstPara.includes(ledger.officialLookupUrl)) fail('official permit page not linked in the first paragraph');
  for (const img of IMAGES)
    if (!body.includes(`](${img} `) || !fs.existsSync(path.join(process.cwd(), 'public', img))) fail(`screenshot ${img} missing from body or disk`);
  for (const r of ['[Before Regret](/)', 'No AI writes a Before Regret report', '| 1968 | 12 | 4 |', 'How we checked this'])
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
    VALUES (${SLUG}, ${title}, ${meta}, '', ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow (no Permit Pulse block)`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
