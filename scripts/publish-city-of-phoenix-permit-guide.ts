// Publish /guides/city-of-phoenix-permit-search/ -- City of Phoenix, AZ permit search (PDD Online + SHAPE PHX).
// A NEW URL: no Phoenix city page has ever existed; the Maricopa County guide (#82) names Phoenix in one bullet only.
//
//   npx tsx scripts/publish-city-of-phoenix-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-city-of-phoenix-permit-guide.ts
//
// WHY PHOENIX. Growth agent hunt 2026-11-23 (docs/desk/2026-11-23.md). Permit guides are a format that passed the scale gate
// (feedback_scale_only_proven_formats). Census rule: Phoenix is an active place, so a city page. First-party demand: Bing's own
// counts (capture 2026-11-23-demand-phoenix-permit-search-bing, relative only) record "city of phoenix permit search"; this site
// has no Phoenix impressions. Phoenix passed all four portal tests in data/permit-portal-recognition/2026-11-tests.json.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Were this Phoenix house's permits finished and passed?"
//   which of the two city tools holds which years?      -> "Which search holds which work" (June 6, 2022 / April 27, 2026)
//   is the house in the city at all?                    -> Census share + Maricopa guide link
//   does EXPR mean the work failed?                     -> OE-94023192: EXPR status, final electrical PASS (screenshot)
//   how do I search without missing records?            -> dates don't limit address search, Show temps, 200 matched 2002, wildcard
//   what can't the record tell me?                      -> unpermitted work + open permits links, Records contact
//
// NOT TEMPLATED (outline differs from the Florida county pages): two-system split by date, a status-vs-inspection finding, search
// habits measured on City Hall's address. First-party: scripts/build-phoenix-permit-era-shares.ts (ACS B25034/B25035) and the
// 2026-11-23 walk of both portals. Screenshot in public/images (names removed).
//
// CORRECTION FOUND: data/permit-portal-recognition/2026-11-tests.json says the Phoenix start date "defaults to the last 30 days;
// widen it before searching". On 2026-11-23 the default dates did NOT limit an address search (915 items either way).
//
// Facts: data/fact-ledgers/city-of-phoenix-permit-search.json (6 facts + walk, read 2026-11-23).
// READ 2026-12-28 at the earliest (5 weeks after going live; move it if published later): seen / chosen / acted.
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
const SLUG = 'city-of-phoenix-permit-search';
const TITLE = 'City of Phoenix Permit Search: PDD Online and SHAPE PHX';
const TOPIC = 'permits';
const IMAGES = ['/images/phoenix-pdd-expired-permit-passed-final.webp'];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-maricopa-county-az',
  'accela-citizen-access-permit-search',
  'check-building-permits-brevard-county-fl',
  'check-building-permits-tarrant-county-tx',
  'check-building-permits-clark-county-nv',
  'resolve-open-building-permits-before-closing',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one Phoenix permit search, PDD Online or SHAPE PHX query. ' +
  'If not shown while the county permit guides are, do not add more city-level permit pages until the next scorecard.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'city of phoenix permit search',
  capture: '2026-11-23-demand-phoenix-permit-search-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a resale house inside Phoenix city limits, checking its permit history during the inspection period',
  want: 'to know which of the two city searches holds which years, and whether a permit marked EXPR means the work never passed',
  achieve: 'to search both city tools without missing records and confirm a passed final inspection on the work that matters',
  titlePromise: 'where to search a City of Phoenix house permits across PDD Online and SHAPE PHX',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Phoenix. Where are its permits, and did the work actually pass inspection?',
  firstScreen: 'The PDD Online search linked in the first paragraph, the June 6, 2022 SHAPE PHX split, and the warning that the status column misleads.',
  firstParty: [
    { what: 'Census B25034/B25035 for Phoenix city: 653,065 homes, 34.7% of Maricopa County housing, median built 1985, 72.2% built before 2000', source: 'docs/data/phoenix-permit-era-shares.json' },
    { what: 'Walk of PDD Online and SHAPE PHX on City Hall: 915 vs 647 records, default dates not limiting address search, 200 matching 2002, an EXPR permit whose final electrical passed', source: 'data/fact-ledgers/city-of-phoenix-permit-search.json' },
    { what: 'Our screenshot of OE-94023192 inspection history, names removed', source: 'public/images/phoenix-pdd-expired-permit-passed-final.webp' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming both searches run on 2026-11-23 with no account, the City Hall test address, and the Census tables',
    'says plainly what was not confirmed: no status legend found, and the oldest record at one address is not a system start date',
  ],
  beyondCommonFacts: [
    'a permit marked EXPR can still show a passed final inspection in its history, and another EXPR permit can show no history at all',
    'the pre-filled 30-day date boxes in PDD Online do not limit an address search; they belong to the solar and green section',
    'the SHAPE PHX number box matched 2002 when 200 was typed, so results include other houses',
    'SHAPE PHX holds records from June 6, 2022 plus some carried-over 2019-2020 records, and new single-family permits from April 27, 2026',
  ],
  reproducibilityCheck: 'Top results are the two city portals, the PDD contact pages, permit expediters and county pages. None tells a buyer that EXPR can sit on a permit whose final passed, that the default dates do not limit an address search, or that the two systems overlap in years.',
  discussion: 'not-needed',
  discussionReason: 'A navigational lookup page: the reader needs the right tools and search habits, not a weighing of trade-offs.',
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
  for (const r of ['PDD Online', 'SHAPE PHX', 'June 6, 2022', 'April 27, 2026', 'EXPR', 'Inspection History', '653,065', 'How we checked this'])
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
