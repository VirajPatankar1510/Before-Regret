// Publish /guides/are-building-permits-public-record/ -- are building permits public record, and what can't you get.
// A NEW URL: no published guide owns the question (title search 2026-11-24 found none).
//
//   npx tsx scripts/publish-are-building-permits-public-record.ts            # dry run
//   APPLY=true npx tsx scripts/publish-are-building-permits-public-record.ts
//
// WHY. Owner's GSC question export 2026-11-24 (data/keywords/2026-11-24-gsc-question-queries-export.json):
// "are building permits public record" (10 impr, pos 17.1), "are permits public record" (10, 26.4), plus site plans,
// certificate of occupancy, permit applications and inspections "public record" variants. Owner chose it 2026-11-24.
// Format: a question guide in the permits cluster, not a county page -- treat as an EXPERIMENT with the stop below.
//
// DECISION MAP. Reader's question: "Are building permits public, and can I see (or copy) what I need?"
//   are permits public by law?               -> section: CA Gov 7922.525, FL 119.01 (any person); 10-day CA determination 7922.535
//   can I search without asking?             -> section: our table, 9 of 10 offices searchable with no account (Nov 2026)
//   can I look up a neighbor?                -> section line: same search, any address (own page later: owner list #3)
//   certificates of occupancy / inspections? -> section: Dallas CO in permit list; inspection logs sometimes empty
//   permit applications?                     -> section: Phoenix unissued toggle, San Diego cancelled/abandoned rows
//   plans and site plans?                    -> section: CA HSC 19851 copy permission; FL 119.071(3)(b) is agency-owned only
//   older permits?                           -> section: paper; San Diego pre-2003, $0.25/page, nothing pre-1955
//   Texas law                                -> skipped: statute site rendered no text
//
// First-party: the 10-office table from our own walks (ledgers of #386, #387, #388 and the county guides).
// Facts: data/fact-ledgers/are-building-permits-public-record.json.
// READ 2026-12-29 at the earliest: seen / chosen / acted.
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
const SLUG = 'are-building-permits-public-record';
const TITLE = 'Are Building Permits Public Record? What You Can See';
const TOPIC = 'permits';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'look-up-building-permits-by-address',
  'city-of-south-pasadena-permit-records',
  'city-of-san-diego-permit-search',
  'city-of-phoenix-permit-search',
  'find-unpermitted-work-before-buying',
  'resolve-open-building-permits-before-closing',
];
const STOP =
  'Read 5 weeks after going live: shown on Google for at least one "public record" permit, plans or certificate-of-occupancy ' +
  'query at a better position than the site had (17.1 / 26.4). If not, no more general permit-question pages; stay with city pages.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'are building permits public record',
  capture: '2026-11-24-gsc-question-queries-export',
  intent: 'informational',
  who: 'a US home buyer, owner or neighbor who wants to see the permits for an address and is not sure they are allowed to',
  want: 'to know whether permits, certificates of occupancy, inspections and plans are public, and how to get each one',
  achieve: 'to search the permit office by address, request older paper records, and ask the seller to sign for plan copies where needed',
  titlePromise: 'whether building permits are public record and what you can see and copy',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Are building permits public record, and can I see the permits, inspections and plans for this address?',
  firstScreen: 'The quick answer (generally yes, 9 of 10 offices searchable with no account, plans the exception) and what a permit record actually shows.',
  firstParty: [
    { what: 'Our table of 10 permit offices searched with no account between 2026-11-16 and 2026-11-24 on public buildings: 9 searchable by address, South Pasadena not; oldest online record 1980 (Austin) to 2015 (Tampa)', source: 'data/fact-ledgers/are-building-permits-public-record.json' },
    { what: 'Observed details: Dallas certificate of occupancy in the permit list; Phoenix and San Diego permits with empty inspection lists; Phoenix unissued-permit toggle', source: 'data/fact-ledgers/are-building-permits-public-record.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the statutes read on 2026-11-24, the dates of our own searches and that Texas was skipped',
    'every table row links to the guide where that search is written up',
  ],
  beyondCommonFacts: [
    'California Gov Code 7922.535 gives 10 days to decide and estimate, not to deliver; extension up to 14 days',
    'California HSC 19851 lets anyone view plans but copying needs the signer and owner permission; Florida 119.071(3)(b) plans exemption covers agency-owned structures only',
    'online permit records at the offices we searched began between 1980 and 2015; San Diego holds nothing before 1955',
    'a permit with a recorded completion can still show an empty inspection list',
  ],
  reproducibilityCheck: 'Top results are generic "yes, permits are public" posts and permit expediters. None has a dated table of offices searched with no account, the 10-day CA determination nuance, or the contrast between the CA plan-copy rule and the narrow Florida exemption.',
  discussion: 'needed',
  discussionReason: 'The answer changes by state and by record type (permit, inspection, certificate, plans, old paper), so the reader has to weigh which route applies to them.',
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
  for (const r of ['7922.525', '7922.535', '119.01', '19851', '| City of South Pasadena, CA | No public search |', 'How we checked this'])
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
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow (no Permit Pulse block: not a county page: Pulse is county-level)`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
