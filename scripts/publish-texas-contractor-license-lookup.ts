// Publish "TDLR License Search: Checking a Texas Contractor" -- state 4 of the 50-state contractor-license set
// (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each page goes
// live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-texas-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-texas-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/texas.json -- TDLR License Data Search walked in a browser on 2026-11-14
// (license-type list, a business-name wildcard search returning 8 records for one brand, one electrical contractor
// record with its Master line), TDLR's exemptions and Administrative Orders pages, the TSBPE search form, Occupations
// Code 1301.051/.052/.351, 1302.251, 1305.003/.151/.201 and Property Code 41.007 read on statutes.capitol.texas.gov,
// the Sunset Commission's TRCC record and Austin's contractor registration page.
// First-party: the portal observations and our cropped screenshot of the record's "Other Information" column with
// every identifying value blanked out before capture. No business, person or number named.
// Demand: tier 2 (topic-demand 2026-11-14: "tdlr license search", "texas contractor license lookup" in Bing).
//
// READ 5 weeks after it goes live (date in the tracker): shown on Google or Bing for at least one TDLR / Texas
// contractor license search. Re-check the portal and the cited sections by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'texas-contractor-license-lookup';
const TITLE = 'TDLR License Search: Checking a Texas Contractor';
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/texas-tdlr-electrical-contractor-record.jpg';
// California, Oregon and Washington are live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'oregon-contractor-license-lookup',
  'washington-contractor-license-lookup',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one TDLR or Texas contractor license search. ' +
  'If the first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'tdlr license search',
  capture: '2026-11-14-demand-texas-contractor-license-bing',
  intent: 'navigational',
  who: 'a Texas homeowner or buyer with an electrician, A/C or plumbing bid in hand, or a general contractor\'s name, wondering what the state can confirm before work starts on a house',
  want: 'to find the right state record fast and learn what Texas does not license at all',
  achieve: 'to check the trade license and the master behind it, find discipline in the orders search, and know where the city or the contract has to fill the gap',
  titlePromise: 'how to run the TDLR search, read a record, and where to look for what it leaves out',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I want to check a Texas contractor. Which state search do I use, what does the record show, and what if they are not licensed by anyone?',
  firstScreen: 'The TDLR search link in the first lines, plus the fact that Texas licenses trades but not general contractors, and that plumbers are on a different board.',
  firstParty: [
    { what: 'TDLR License Data Search walked in a browser on 2026-11-14: the license-type list, the "Active Licenses only" note, a name search showing its added wildcard and returning 8 records for one brand, and a full electrical contractor record with its Master line', source: 'data/fact-ledgers/state-license/texas.json' },
    { what: 'Our cropped screenshot of a real record\'s Other Information column, with names, numbers and phone blanked out before capture', source: 'public/images/texas-tdlr-electrical-contractor-record.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken in the browser on the read date, identifying values blanked out before capture',
    'visible "How we checked this" naming the search run, the code sections read, and that no plumbing search was run',
  ],
  beyondCommonFacts: [
    'the search shows active licenses only, so a lapsed or revoked license returns nothing rather than an expired status',
    'an electrical contractor license runs under a named master electrician whose own license can be checked (the Master line)',
    'discipline is in a separate Administrative Orders search covering the current and two past fiscal years (September to August)',
    'Property Code 41.007 still asks for a registration number from the commission abolished in 2009, only "if the contractor is required to register"',
    'the homeowner electrical exemption in 1305.003(a)(6) holds only where no city ordinance regulates the work',
  ],
  reproducibilityCheck: 'Top results are the TDLR search itself and generic "Texas has no GC license" posts. None explains the active-only results, the wildcard name match, the Master line, the three-year orders window, or the 41.007 clause that outlived its agency.',
  discussion: 'needed',
  discussionReason: 'With no general contractor license, the reader has to weigh which trades the state does check, what a missing result means, and where a city registration or the contract has to cover the rest.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'texas.json'), 'utf8'));

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
  for (const sec of ['1305.151', '1305.003', '1305.201', '1301.051', '1301.351', '1301.052', '41.007']) {
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
