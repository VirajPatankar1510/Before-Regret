// Publish /guides/check-building-permits-brevard-county-fl/ -- Brevard County, FL permit search (Florida permit cluster pilot).
// A NEW URL: no Brevard County guide ever existed, removed or live; no published article mentions Brevard.
//
//   npx tsx scripts/publish-brevard-county-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-brevard-county-permit-guide.ts
//
// WHY BREVARD. Topic from the owner's keyword-gap export (topic only; no OpenSEO figure on the page or in a capture), and one
// of the four Florida cluster pilots (Collier, Sarasota, Manatee, Brevard). First-party demand: Bing's own counts (capture
// 2026-11-20-demand-brevard-county-permit-bing, relative only) record "brevard county permit search" and "brevard county
// building permits"; the site has no Brevard page and no Brevard impressions.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Where are this Brevard house's permits, and why might I not find them?"
//   which tool covers which years (BASS 2003+, legacy 1990-2002, none before)? -> "Brevard County's three permit eras" + Census table
//   does the county even hold this house's permits (16 cities keep their own)? -> "Does Brevard County hold this house's permits?"
//   how do I search BASS without missing records?                            -> account number, cleared dates (100+ cap), less-is-best
//   what does a 1990s record tell me?                                        -> legacy record fields: every trade named with licence
//   what about before 1990?                                                  -> public records request; empty != unpermitted (+ link)
//   what the county is permitting now                                        -> Permit Pulse block injected after publish (ONLY=)
//
// NOT TEMPLATED (outline differs from Martin, Collier and Hernando). First-party: Census B25034 split to the county-served area
// (county row minus the 15 incorporated cities: 114,752 homes, 51.6% built before 1990) by scripts/build-brevard-permit-era-shares.ts;
// a BASS walk on the county's own headquarters address showing the 100+ display cap hiding 2003-2016 records, the WY/WAY
// spelling split, and a 2004 record's six inspections; the legacy record's per-trade licence fields. Screenshot in public/images.
//
// Facts: data/fact-ledgers/check-building-permits-brevard-county-fl.json (10 facts, read 2026-11-20).
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
const SLUG = 'check-building-permits-brevard-county-fl';
const TITLE = "Brevard County Permit Search: Find a House's Permits";
const TOPIC = 'permits';
const IMAGES = ['/images/brevard-bass-permit-search-2003-records.webp'];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-hernando-county-fl',
  'check-building-permits-martin-county-fl',
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
  'Read 2026-12-25 (5 weeks after going live): shown on Google or Bing for at least one Brevard County permit search, BASS or ' +
  'building permits query. If not shown while Collier and Pinellas are, stop adding Florida counties until the Hernando and Brevard reads.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'brevard county permit search',
  capture: '2026-11-20-demand-brevard-county-permit-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a resale house in Brevard County, Florida, checking its permit history during the inspection period',
  want: 'to know whether the county or a city holds the permits, which of the county tools covers which years, and why records might be missing',
  achieve: 'to search the right jurisdiction and tool without the default date window or display cap hiding records, and know what to ask for before 1990',
  titlePromise: 'where to search a Brevard County house permits and how to avoid missing records',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Brevard County. Where are its permits, and why might the search come back short?',
  firstScreen: 'The county Search Permits page linked in the first paragraph, the 2003 BASS / 1990-2002 legacy split, the permits phone line, and that cities keep their own permits.',
  firstParty: [
    { what: 'Census B25034 split to the county-served area (county minus 15 incorporated cities): 114,752 homes, 38.3% of Brevard, 51.6% built before 1990, mapped onto the three record eras', source: 'docs/data/brevard-permit-era-shares.json' },
    { what: 'BASS walk on the county headquarters address: 11/16/2021 default start date, 100+ cap hiding 2003-2016 records, WY/WAY spellings, a 2004 record with six inspections', source: 'data/fact-ledgers/check-building-permits-brevard-county-fl.json' },
    { what: 'Our screenshot of the 2003-2005 BASS records the first search did not list', source: 'public/images/brevard-bass-permit-search-2003-records.webp' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the six county pages read and both tools searched on 2026-11-20, and the Census method',
    'says plainly that no private house was searched, that a legacy house result could not be shown, and what stays open (pre-1990 records, Grant-Valkaria)',
  ],
  beyondCommonFacts: [
    'the BASS start date arrives pre-filled about five years back, and a busy address shows only 100 records, so older permits stay hidden until the dates are narrowed',
    'older BASS records spell the street WY where newer ones say WAY, which is why the county says not to pick a street type',
    'permit addresses use postal cities: the county headquarters in unincorporated Viera is listed as MELBOURNE FL 32940',
    'a legacy 1990-2002 record names the drywall, electrical, HVAC, plumbing, roofing and septic contractors with licence numbers',
  ],
  reproducibilityCheck: 'Top results are the county permit pages, BASS itself, permit-expediter and contractor-licensing ads and city building departments. None tells a buyer that the default date window and the 100+ cap hide older permits, that postal cities mislead on jurisdiction, or what share of county-permitted homes predate the online records.',
  discussion: 'not-needed',
  discussionReason: 'A navigational lookup page: the reader needs the right tool and search habits, not a weighing of trade-offs.',
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
  for (const r of ['BASS', 'Legacy Permit Search', '2003', '1990 to 2002', 'Grant Valkaria', 'Taxing District', '114,752', '100+', 'How we checked this'])
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
  console.log(`  wrote ${SLUG}\n  next: Permit Pulse block (ONLY=), article-faqs, build, IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
