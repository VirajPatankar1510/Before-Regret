// Publish /guides/check-building-permits-martin-county-fl/ -- Martin County, FL permit search (Florida permit cluster).
// A NEW URL: no Martin County guide ever existed, removed or live.
//
//   npx tsx scripts/publish-martin-county-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-martin-county-permit-guide.ts
//
// WHY MARTIN. Topic chosen from the owner's OpenSEO export serp-martin-county-permit-2026-11-20.csv (owner rule 2026-11-20:
// OpenSEO chooses topics; none of its figures go on the page or in a capture). First-party demand: Bing's own counts
// (capture 2026-11-20-demand-martin-county-permit-bing, relative only) record "martin county permit search" and
// "martin county building department"; the site has no Martin page.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Am I seeing every permit on this Martin County house?"
//   is the house in the county's permit area (5 towns)?           -> section "Is the house in Martin County's permit area?"
//   how do I search Accela by address, and is the result complete? -> section "Searching Martin County's Accela by address"
//   are older permits online?                                      -> section "How far back ..." (24 pre-1990 records; Census table)
//   what does a status mean / is DONE really done?                 -> section "What a Martin County permit status doesn't tell you"
//   could recent work legally have no permit?                      -> section "Since July 2026 ..." (HB 803, county page)
//   what about liens and open permits?                             -> section "Martin County liens ..." + link to #resolve-open
//   generic Accela screens                                         -> answered on accela-citizen-access-permit-search (linked)
//   permits inside Stuart / Sewall's Point / Indiantown / Jupiter Island -> skipped: their sites are blocked from here
//
// NOT TEMPLATED (outline differs from Collier). First-party: Accela tested 2026-11-20 on the county Administrative Center:
// one building = 12 address entries, only 1 holds the full list, 8 empty; 24 records countywide before 1990, 81 in 1990,
// 100+ cap from 1991; a DONE record carrying a 2018 Hold condition; 132 Building record types, none an exemption; Census
// B25034 year-built shares (docs/data/florida-permit-era-shares.json: 61.3% built before 1990).
//
// Facts: data/fact-ledgers/check-building-permits-martin-county-fl.json (20 facts + portal walk, read 2026-11-20).
// READ 2026-12-25 (5 weeks after going live): seen / chosen / acted per answer-ready-writing part 3.
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
const SLUG = 'check-building-permits-martin-county-fl';
const TITLE = 'Martin County, FL Building Permits: Search Accela by Address';
const TOPIC = 'permits';
const IMAGES = [
  '/images/martin-accela-12-address-entries.webp',
  '/images/martin-accela-records-2401-monterey.webp',
  '/images/martin-accela-before-1990-count.webp',
  '/images/martin-accela-done-record-hold.webp',
];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-collier-county-fl',
  'check-building-permits-pinellas-county-fl',
  'check-building-permits-hillsborough-county-fl',
  'check-building-permits-broward-county-fl',
  'check-building-permits-miami-dade-county-fl',
  'accela-citizen-access-permit-search',
  'resolve-open-building-permits-before-closing',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
];
const STOP =
  'Read 2026-12-25 (5 weeks after going live): shown on Google or Bing for at least one Martin County permit, Accela or ' +
  'building department search. If not shown while Collier and Pinellas are, stop adding Florida counties and find out why first.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'martin county permit search',
  capture: '2026-11-20-demand-martin-county-permit-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a house in Martin County, Florida, checking its permit history before the inspection period ends',
  want: 'to find every permit filed on the address in the county Accela portal, and the older ones the portal does not hold',
  achieve: 'to know whether the county or a town holds the records, open every address entry, read past a DONE status, and know what to request or ask the seller',
  titlePromise: 'how to search Martin County building permits in Accela by address without missing records',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Martin County. How do I search its permits, and did the search show me all of them?',
  firstScreen: 'The county permit-status page linked in the first paragraph, the no-login route to the Building search, and the three traps we found.',
  firstParty: [
    { what: 'Accela address search tested 2026-11-20 at the county Administrative Center, 2401 SE Monterey Rd: 12 address entries for one building; 1 entry lists all 4 records, 1 lists 3, 2 open the 2010 roof, 8 return No records found', source: 'data/fact-ledgers/check-building-permits-martin-county-fl.json' },
    { what: 'Countywide date searches: 24 records before 1990, 81 in 1990, the 100+ cap from 1991; the date box defaults to 01/01/1990', source: 'public/images/martin-accela-before-1990-count.webp' },
    { what: 'Record BRR2010040187: status DONE yet carrying a CITY-STU - STUART PROPERTY Hold condition applied 2018', source: 'public/images/martin-accela-done-record-hold.webp' },
    { what: 'Census B25034 year-built shares for Martin County mapped onto the 1990 cut-off (61.3% built before 1990)', source: 'docs/data/florida-permit-era-shares.json' },
  ],
  evidenceOfWork: [
    'four screenshots of our own Accela searches on county property, dated, no personal names',
    'visible "How we checked this" naming the searches, the county, appraiser and town pages read, and four things we could not check',
  ],
  beyondCommonFacts: [
    'one building is stored as 12 address entries and only one of them shows every record; 8 are empty',
    'the online record nearly stops before 1990 (24 records countywide) while 61.3% of the county homes predate it',
    'a record reading DONE can carry an applied Hold condition visible only inside the record',
    'Martin lists roofing and windows and doors as structural work that still needs a permit under HB 803, and exempt work is approved but never inspected',
    'none of the 132 Building record types is an exemption, so approved exemptions may never appear in a search',
  ],
  reproducibilityCheck: 'Top results are the Accela portal and martin.fl.us sign-in pages. None tests the address search, counts records by era, maps Census year-built shares onto the 1990 cut-off, shows a DONE record with a hold, or connects the county HB 803 page to what a buyer can find in a search.',
  discussion: 'needed',
  discussionReason: 'A buyer must judge whether an empty or partial search means anything, whether a closed-looking record is really closed, and whether missing recent permits are legitimate under the 2026 exemption.',
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
  for (const r of ['Accela', 'No records found', 'Property Appraiser', 'Ocean Breeze', 'CITY-STU', 'Conditions tab', '553.79(1)(g)', 'Orange Data', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in the ledger (facts or our portal walk).
  const ledgerAll = JSON.stringify({ facts: ledger.facts, portalWalk: ledger.portalWalk });
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
    /OCEAN GATE|LUKAS|Pam Orr|LIFESTAR/i, // contractor, contact and staff names seen on records/pages stay off the page
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
  console.log(`  wrote ${SLUG}\n  next: Permit Pulse block (ONLY=), article-faqs, build, IndexNow; Florida hub line awaits owner OK`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
