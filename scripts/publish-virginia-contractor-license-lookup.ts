// Publish "DPOR License Lookup: Check a Virginia Contractor's Class" -- state 6 of the 50-state contractor-license set
// (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each page goes
// live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-virginia-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-virginia-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/virginia.json -- the DPOR License Lookup walked on 2026-11-16 (a name search for
// a large homebuilder: 2 contractor records; one Class A record's License Details and Complaints tabs and their help text;
// a search for "Master Electrician" returning Tradesman records), Va. Code 54.1-1100 / 1101 / 1115 and 18VAC50-22-260 on
// law.lis.virginia.gov, and DPOR's Board for Contractors, Recovery Fund and consumer-guide pages.
// First-party: the portal observations (no status line, no bond field, complaint-tab rules vs the 5 old closed cases still
// listed) and our screenshot of the record with the name, DBA, number and address rows cut out.
// Demand: tier 2 (topic-demand 2026-11-15: "dpor license lookup" dominant, "virginia contractor license lookup" in Bing).
//
// READ 5 weeks after it goes live (date in the tracker): shown on Google or Bing for at least one Virginia contractor or
// DPOR license search. Re-check the portal, the class thresholds and the Recovery Fund caps by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'virginia-contractor-license-lookup';
const TITLE = "DPOR License Lookup: Check a Virginia Contractor's Class";
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/virginia-license-record-class-specialties.jpg';
// California, Oregon, Washington, Texas and Tennessee are live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'oregon-contractor-license-lookup',
  'washington-contractor-license-lookup',
  'texas-contractor-license-lookup',
  'tennessee-contractor-license-lookup',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one Virginia contractor or DPOR license search. ' +
  'If the first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'dpor license lookup',
  capture: '2026-11-15-demand-virginia-contractor-license-bing',
  intent: 'navigational',
  who: 'a Virginia homeowner or buyer holding a contractor bid who searches DPOR to check the license before signing, and the contractor checking what clients see',
  want: 'to open the right record quickly and know whether the Class A, B or C letter and the specialty fit this job',
  achieve: 'to match the class to the contract price, read the Complaints tab for what it really shows, check the required contract terms, and know where the Recovery Fund stops',
  titlePromise: 'how to use the DPOR lookup and read a Virginia contractor license class against a bid',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have a Virginia contractor\'s name. How do I look them up on DPOR, and is their license big enough for my job?',
  firstScreen: 'The DPOR License Lookup link in the first lines, the point that the Rank letter (Class A, B or C) caps the contract size, and the table of the three classes right below.',
  firstParty: [
    { what: 'DPOR License Lookup walked on 2026-11-16: a homebuilder name search (2 records), one Class A record read field by field (no status line, no bond field), its Complaints tab rules, 5 closed No Disciplinary Action cases from 2009-2017 still listed despite the three-year purge note, and a Master Electrician search returning Tradesman records', source: 'data/fact-ledgers/state-license/virginia.json' },
    { what: 'Our screenshot of the record: Description, Firm Type, Rank, Specialties and dates, with the name, DBA, license number and address rows cut out', source: 'public/images/virginia-license-record-class-specialties.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken on the read date, cropped to rows with no identifying values',
    'visible "How we checked this" naming both searches, the statute and regulation sections read, the DPOR pages read, and three things we could not confirm',
  ],
  beyondCommonFacts: [
    'the wrong class for the job value is itself a Class 1 misdemeanor under 54.1-1115 A, the same as no license',
    'an unlicensed contractor cannot enforce the contract unless both substantial good-faith performance and no actual knowledge; a lapsed renewal presumes knowledge (54.1-1115 C)',
    'the Recovery Fund covers only licensed contractors, needs a Virginia judgment for improper or dishonest conduct, bond first, 12 months, $30,000 per claim',
    'open complaints only appear after probable cause and adjudication (54.1-108); no-discipline closures are purged after three years, yet the record we opened still listed five from 2009-2017',
    'an owner-builder must get a certificate of occupancy before selling unless the buyer signs a written acknowledgment (54.1-1101 B)',
  ],
  reproducibilityCheck: 'Top results are DPOR itself and generic "check the license" posts. None reads a real record and notes it has no status line or bond field, explains what the Complaints tab leaves out, ties the class letter to the 54.1-1115 penalty and the 54.1-1115 C enforceability rule, or gives buyers the owner-builder certificate-of-occupancy acknowledgment.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh the contract price against the class letter and specialty, and decide how much an empty complaint history and the narrow Recovery Fund really protect them.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'virginia.json'), 'utf8'));

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
  for (const sec of ['54.1-1100', '54.1-1101', '54.1-1115', '54.1-108', '18VAC50-22-260']) {
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
