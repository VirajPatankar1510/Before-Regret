// Publish "Oregon CCB License Lookup: What a Contractor's Record Shows" -- state 2 of the 50-state contractor-license
// set (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each
// page goes live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-oregon-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-oregon-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/oregon.json -- CCB License Search walked in a browser on 2026-11-13 (name
// search for one large firm, its summary and detail pages), the CCB's Consumer Protection, Consumer Tools, How To Get A
// License and Specialty Licenses pages, and the CCB endorsement chart. ORS chapter 701 on oregonlegislature.gov did not
// load (blockedSources); only ORS numbers the CCB itself cites (87.007, 701.310) are used.
// First-party: the portal observations (20 records for one name, one licence number on two rows with different
// statuses, five statuses, "See also" numbers, no saveable URLs, a commercial-only record with no residential bond)
// and our cropped screenshot of the 10-year history sections. No business, person, number or insurer named.
// Demand: tier 2 (topic-demand 2026-11-13: "oregon ccb", "oregon contractor license lookup" and variants in Bing).
//
// READ 5 weeks after it goes live (date set in the tracker on publish): shown on Google or Bing for at least one
// CCB / Oregon contractor license search. Re-check the portal and every CCB page by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'oregon-contractor-license-lookup';
const TITLE = "Oregon CCB License Lookup: What a Contractor's Record Shows";
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/oregon-ccb-record-history-sections.jpg';
// California (#350) is the only other state page live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one CCB or Oregon contractor license search. If the ' +
  'first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'oregon ccb license lookup',
  capture: '2026-11-13-demand-oregon-contractor-license-bing',
  intent: 'navigational',
  who: 'an Oregon homeowner or buyer holding a CCB number from a flyer or bid, about to hire for work on a house, and the contractor checking what clients see',
  want: 'to find the right CCB record among look-alike names and know whether this licence actually covers a job on a house',
  achieve: 'to confirm a residential endorsement and bond, read the ten-year history, and know how the bond pays out and what a buyer can claim before signing or closing',
  titlePromise: 'how to run the Oregon CCB lookup and read what the record shows',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have an Oregon contractor\'s name or CCB number. How do I check it, and does an active licence mean they can do my job?',
  firstScreen: 'The official CCB License Search link in the first line, then the CCB\'s own statement that the licence is not construction training.',
  firstParty: [
    { what: 'CCB License Search walked in a browser on 2026-11-13: a name search returning 20 mixed records, one licence number on two rows with different statuses, five statuses, See-also numbers, and the summary and detail pages of an active record', source: 'data/fact-ledgers/state-license/oregon.json' },
    { what: 'Our cropped screenshot of a real record summary\'s four 10-year history sections, with no business, number, people or insurers shown', source: 'public/images/oregon-ccb-record-history-sections.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken in the browser on the read date, cropped to remove names and numbers',
    'visible "How we checked this" naming the search run, the CCB pages and chart read, and the statute site that would not load',
  ],
  beyondCommonFacts: [
    'a fully licensed commercial-only firm showed None on the Residential bond row: no bond for a homeowner to claim',
    'a buyer cannot file a CCB complaint about the seller\'s contractor unless the sale documents assign it',
    'the bond pays only on a judgment, small claims caps at $10,000, no attorney fees, at least 60 days, claims in a 90-day window held together',
    'ORS 87.007 lien protection for homes with $50,000 of work within three months before the sale, and the compliance notice to ask for',
    'the Residential Specialty endorsement allows three or more trades only on contracts of $2,500 or less',
  ],
  reproducibilityCheck: 'Top results are the CCB lookup itself and short "check your contractor" pages. None shows how the name search mixes records, what the commercial-only bond line means for a homeowner, or the buyer-side complaint and lien rules.',
  discussion: 'needed',
  discussionReason: 'Active status is not the whole answer: the reader weighs endorsement, bond, the slow bond path and, as a buyer, what they can still claim.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'oregon.json'), 'utf8'));

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
  for (const sec of ['87.007', '701.310']) {
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
