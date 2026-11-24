// Publish /guides/city-of-south-pasadena-permit-records/ -- City of South Pasadena, CA permit records (no online search).
// A NEW URL: no South Pasadena page has ever existed; the Los Angeles County guide (#222) names Pasadena only in passing.
//
//   npx tsx scripts/publish-city-of-south-pasadena-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-city-of-south-pasadena-permit-guide.ts
//
// WHY SOUTH PASADENA. Owner-directed 2026-11-24 ("don't wait for the Phoenix read. do it now"), after a Report Ad prospect
// (The Electric Connection) named 91030. Demand is tier 3: topic-demand.ts found no GSC or Bing signal (captures
// 2026-11-24-demand-south-pasadena-permit-*). So this is a stated EXPERIMENT with a stop condition, not a proven-demand page.
// It is not a promise of traffic to any advertiser.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Was the work on this South Pasadena house permitted and finished?"
//   is there an online search?                 -> no: OpenGov is for applying; its records page renders no box; FAQ link 404
//   who do I ask, and for what?                -> Permit Technician (626) 403-7224 / permittech@; every permit + final date
//   can I get the plans?                       -> HSC 19851: view at the counter; copies need signer + owner (seller) permission
//   which listed upgrades should have permits? -> the city's own FAQ table (roof, water heater, AC, insulation, windows)
//   anything special about old houses here?    -> 33% pre-1940 (Census) + Cultural Heritage Inventory + design approval
//
// NOT TEMPLATED: unlike Phoenix (two searches, a status trap) this page is about a city with NO public search, a plan-copy law,
// and a second approval record for historic houses. First-party: scripts/build-south-pasadena-housing-age.ts and the
// 2026-11-24 portal walk (ledger observations).
//
// Facts: data/fact-ledgers/city-of-south-pasadena-permit-records.json (11 facts + walk, read 2026-11-24).
// READ 2026-12-29 at the earliest (5 weeks after going live; move it if published later): seen / chosen / acted.
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
const SLUG = 'city-of-south-pasadena-permit-records';
const TITLE = 'City of South Pasadena Permit Records: How to Get Them';
const TOPIC = 'permits';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'city-of-phoenix-permit-search',
  'check-building-permits-los-angeles-county-ca',
  'knob-and-tube-wiring-insulation',
  'resolve-open-building-permits-before-closing',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one South Pasadena permit or building-records query. ' +
  'If not shown, no more pages for cities with no demand signal, whatever an advertiser asks for.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'south pasadena building permit records',
  capture: '2026-11-24-demand-south-pasadena-permit-bing',
  intent: 'navigational',
  who: 'a buyer under contract on an older house inside South Pasadena, CA city limits, checking its permit history during the inspection period',
  want: 'to find out how to get the house permit history when the city has no online search, and whether they can see or copy the plans',
  achieve: 'to ask the Building Division for every permit and final inspection early, and know which listed upgrades should have permits',
  titlePromise: 'how to get a City of South Pasadena house permit records when no online search exists',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in South Pasadena. How do I see its permit history, and was the seller work permitted?',
  firstScreen: 'The plain statement that no online search exists, the Building Division link, the Permit Technician phone and email, and what to ask for.',
  firstParty: [
    { what: 'Census B25034/B25035 for South Pasadena city: 10,817 homes, 33% built before 1940 vs 14.3% county, median 1953 vs 1965', source: 'docs/data/south-pasadena-housing-age.json' },
    { what: 'Walk of the OpenGov portal and city FAQ on City Hall: search returns services only, public records page renders no search box, FAQ active-permit link returns 404, FAQ research question unanswered', source: 'data/fact-ledgers/city-of-south-pasadena-permit-records.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the pages read and portals used on 2026-11-24 with no account, the City Hall test address and the Census tables',
    'says plainly what was not confirmed: whether old permits are in the new portal, request turnaround, and whether the records center needs an account',
  ],
  beyondCommonFacts: [
    'the OpenGov public records search page exists but rendered no search box and made no search request on 2026-11-24',
    'Health and Safety Code 19851 lets anyone view the official plans at the counter, but copies need the signing professional and the current owner, so the buyer should ask the seller during escrow',
    'the city FAQ link for checking permits returns 404 and its research question has no answer',
    'a listed historic house can need both a building permit and a design approval for exterior work',
  ],
  reproducibilityCheck: 'Top results are the city portal announcement, permit expediters and generic LA County pages. None says the public search is not working, that the FAQ link is dead, that plan copies need the seller signature under HSC 19851, or ties the city permit table to what a buyer sees in a listing.',
  discussion: 'not-needed',
  discussionReason: 'A navigational how-to-get-records page: the reader needs the route and what to ask for, not a weighing of trade-offs.',
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
  for (const r of ['(626) 403-7224', 'permittech@southpasadenaca.gov', '19851', 'Cultural Heritage Inventory', '10,817', 'How we checked this'])
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
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow (no Permit Pulse block: Pulse is county-level)`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
