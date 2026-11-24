// Publish /guides/city-of-san-diego-permit-search/ -- City of San Diego, CA permit search by era (OpenDSD, Accela, paper, pre-1955).
// A NEW URL: no City of San Diego page has existed; the county guide (#91) covers the city in one generic paragraph.
//
//   npx tsx scripts/publish-city-of-san-diego-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-city-of-san-diego-permit-guide.ts
//
// WHY SAN DIEGO. Tier 1 demand from our own Search Console: "city san diego permit search" (15 impr, pos 25.7) and
// "city of san diego permit search" (6, pos 26.3), shown today through #91, which can't answer them. Proven format
// (county/city permit guides, owner rule 2026-11-17).
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Was the work on this City of San Diego house permitted and finished?"
//   is the address even in the city?        -> DSD: no jurisdiction outside city limits; city = 45.5% of county homes (Census)
//   which system holds which years?          -> OpenDSD 2003+, Accela for no-plan MEP + rooftop solar after Jan 16 2018, paper 1955-2002, nothing pre-1955
//   how do I search without a wrong match?   -> OpenDSD road picker (C ST vs W C ST); Accela street name is a prefix (59 results at 202 "C")
//   how do I read a record?                  -> issue date + complete date on the detail page; inspections list can be empty
//   older houses?                            -> self-service stations, no appointment, $0.25/page; pre-1955 -> County Assessor
//   plans?                                   -> appointment to view; HSC 19851 copies need signer + owner (seller) permission
//
// NOT TEMPLATED: Phoenix = two searches and a status trap; South Pasadena = no search at all; this page is an era map
// of four record layers. First-party: scripts/build-san-diego-housing-age.ts and the 2026-11-24 OpenDSD/Accela walk.
//
// Facts: data/fact-ledgers/city-of-san-diego-permit-search.json (11 facts + walk, read 2026-11-24).
// READ 2026-12-29 at the earliest (5 weeks after going live; move it if published later): seen / chosen / acted,
// and whether #91 loses the "city of san diego permit search" queries to this page or both get shown.
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
const SLUG = 'city-of-san-diego-permit-search';
const TITLE = 'City of San Diego Permit Search: OpenDSD, Accela, Paper';
const TOPIC = 'permits';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-san-diego-county-ca',
  'city-of-phoenix-permit-search',
  'city-of-south-pasadena-permit-records',
  'accela-citizen-access-permit-search',
  'resolve-open-building-permits-before-closing',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
];
const STOP =
  'Read 5 weeks after going live: shown on Google for "city of san diego permit search" or "city san diego permit search", ' +
  'at a better position than #91 had (25.7 / 26.3). If not shown, no more city-level pages inside counties we already cover.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'city of san diego permit search',
  capture: 'gsc-2026-11-24-city-san-diego-permit-search',
  intent: 'navigational',
  who: 'a buyer under contract on a house inside City of San Diego limits, checking its permit history during the inspection period',
  want: 'to know which city system holds the permits for each era of the house and how to search it without a wrong match',
  achieve: 'to pull every permit from OpenDSD, Accela and the paper records, spot an issued permit with no complete date, and ask the seller about it',
  titlePromise: 'how to run a City of San Diego permit search across OpenDSD, Accela and the paper records',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in San Diego. Where do I search its permits, and what about the years before the online records?',
  firstScreen: 'The era answer in one paragraph (online from 2003, paper 1955 to 2002, nothing before 1955) with the DSD records link, then the which-system-holds-which-years table.',
  firstParty: [
    { what: 'Census B25034/B25035 for San Diego city: 568,668 homes = 45.5% of the county; 80.5% built before 2000; 9.9% before 1950; median 1979', source: 'docs/data/san-diego-housing-age.json' },
    { what: 'Walk of OpenDSD and Accela on City Hall (202 C St): OpenDSD road picker offered C ST and W C ST; Accela prefix match returned 59 records incl. Coast Bl and Coolwater Dr; oldest OpenDSD record 2003, oldest Accela 2019; one project in both', source: 'data/fact-ledgers/city-of-san-diego-permit-search.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the three city pages read, both portals searched with no account on 2026-11-24, the City Hall test address, the OpenDSD outage that morning and the Census tables',
    'says plainly what was not confirmed: the OpenDSD-to-Accela cutover date, what Created means, request turnaround, and Permit Finder',
  ],
  beyondCommonFacts: [
    'no-plan electrical, plumbing and mechanical permits and rooftop solar after January 16, 2018 are in Accela, not OpenDSD, so a clean OpenDSD history can miss a recent water heater or panel',
    'Accela treats the street name as a prefix (202 "C" also matched Coast Bl and Coolwater Dr), while OpenDSD makes you pick the exact road',
    'DSD keeps nothing before 1955 and sends callers to the County Assessor; permits 1955 to 2002 are paper, self-service, no appointment, $0.25 a page',
    'Health and Safety Code 19851: plans can be viewed at DSD by appointment, but copies need the signing professional and the current owner, so the buyer asks the seller during escrow',
  ],
  reproducibilityCheck: 'Top results are the DSD pages themselves, Accela help and generic permit-expediter posts. None lays the four record layers out by year, flags the 2018 Accela carve-out for no-plan permits, shows the Accela prefix trap, or gives the city share of county homes.',
  discussion: 'not-needed',
  discussionReason: 'A navigational search page: the reader needs the right system for each era and how to search it, not a weighing of trade-offs.',
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
  for (const r of ['OpenDSD', 'Accela', 'January 16, 2018', '619-236-3771', '19851', '45.5%', '568,668', 'How we checked this'])
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
