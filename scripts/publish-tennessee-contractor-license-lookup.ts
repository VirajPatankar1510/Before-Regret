// Publish "Tennessee Contractor License Lookup: Check the Dollar Limit" -- state 5 of the 50-state contractor-license
// set (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each page
// goes live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-tennessee-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-tennessee-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/tennessee.json -- Verify Public Search walked on 2026-11-14 (board + type filter
// alone: 62,695 records incl. expired; an organization-name search for a large homebuilder: 4 results across two boards;
// one record's Modifiers box), and the Board for Licensing Contractors' own pages (license types, monetary limit, home
// improvement counties, LLE/LLP, complaints, discipline reports) plus its help-center articles (owner-builder, warranty
// and Rule 0680-01-.27, qualifying agents). The statute is on LexisNexis only, so only board-cited section numbers are used.
// First-party: the portal observations and our screenshot of the Modifiers box (no name, number or address in it).
// Demand: tier 2 (topic-demand 2026-11-14: "tennessee contractor license lookup", "tn contractor license lookup" in Bing).
//
// READ 5 weeks after it goes live (date in the tracker): shown on Google or Bing for at least one Tennessee contractor
// license search. Re-check the portal, the nine-county list and the July 2026 bond option by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'tennessee-contractor-license-lookup';
const TITLE = 'Tennessee Contractor License Lookup: Check the Dollar Limit';
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/tennessee-license-record-monetary-limit.jpg';
// California, Oregon, Washington and Texas are live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'oregon-contractor-license-lookup',
  'washington-contractor-license-lookup',
  'texas-contractor-license-lookup',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one Tennessee contractor license search. ' +
  'If the first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'tennessee contractor license lookup',
  capture: '2026-11-14-demand-tennessee-contractor-license-bing',
  intent: 'navigational',
  who: 'a Tennessee homeowner or buyer holding a builder or remodeler bid, wanting to confirm the license before signing, and the contractor checking what clients see',
  want: 'to find the record fast and know whether this license is big enough, and the right kind, for this job',
  achieve: 'to read the classification and monetary limit against the bid, know when no state license applies, and know what the board can and cannot do after a problem',
  titlePromise: 'how to run the Tennessee lookup and read the dollar limit on a contractor license',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have a Tennessee contractor\'s name. How do I check the license, and is it good for a job this size?',
  firstScreen: 'The Verify Public Search link in the first lines, and the point that every Tennessee license carries a monetary limit per job that the bid must fit under.',
  firstParty: [
    { what: 'Verify Public Search walked on 2026-11-14: 62,695 contractor records for a board + type filter (expired ones included, back to 1998), a name search for a large homebuilder returning 4 results across two boards, and one full record with its Modifiers box', source: 'data/fact-ledgers/state-license/tennessee.json' },
    { what: 'Our screenshot of a real record\'s Modifiers box: per-classification limits and the aggregate monetary limit, with no name, number or address in the crop', source: 'public/images/tennessee-license-record-monetary-limit.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken on the read date, cropped to the one box with no identifying values',
    'visible "How we checked this" naming both searches, the board pages read, and what we could not read (LexisNexis, the discipline PDF)',
  ],
  beyondCommonFacts: [
    'the monetary limit is 10 times the lesser of working capital or net worth; unlimited needs $300,000 of each; 10% tolerance except BC-A/r',
    'a home improvement license ($3,000 to $24,999) applies only in nine named counties',
    'LLE/LLP licenses apply only where a city uses the state Division of Fire Prevention',
    'a qualifying agent can serve a second company only as its majority owner, and is checked in a separate dashboard',
    'the board cannot order refunds or repairs, but Rule 0680-01-.27 makes ignoring a warranty misconduct',
  ],
  reproducibilityCheck: 'Top results are the board pages and generic "you need a license over $25,000" posts. None reads a real record\'s Modifiers box, explains how the limit is set, notes that expired records stay in results, or ties the nine-county rule and the LLE/LLP city condition together.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh job size against the license limit and type, and where they live decides whether any state license applies to a smaller job.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'tennessee.json'), 'utf8'));

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
  for (const sec of ['62-6-501', '62-6-103', '0680-1-.22', '0680-01-.27']) {
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
