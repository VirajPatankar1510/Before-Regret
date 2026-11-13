// Publish "Washington L&I Contractor Lookup: Registration, Bond, Claims" -- state 3 of the 50-state contractor-license
// set (plan: docs/plans/state-contractor-license-plan.md; flow: .claude/skills/state-license-guides/SKILL.md). Each
// page goes live on its own once the owner says "publish" (owner, 2026-11-13).
//
//   npx tsx scripts/publish-washington-contractor-license-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-washington-contractor-license-lookup.ts
//
// Facts: data/fact-ledgers/state-license/washington.json -- L&I Verify walked in a browser on 2026-11-13 (name search,
// one large general contractor's full record), RCW chapter 18.27 read on app.leg.wa.gov (18.27.040, .050, .080, .090,
// .114, .410) and L&I's register-as-a-contractor page.
// First-party: the portal observations (1018 results for a two-word name, the filters, a saveable detail URL, two bonds
// of different amounts on one record) and our cropped screenshot of the 6-year history lines. No business, person,
// number or insurer named.
// Demand: tier 2 (topic-demand 2026-11-13: "l&i contractor lookup", "washington contractor license lookup" in Bing).
//
// READ 5 weeks after it goes live (date in the tracker): shown on Google or Bing for at least one L&I / Washington
// contractor search. Re-check the portal and RCW 18.27 by 6 months after publishing.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'washington-contractor-license-lookup';
const TITLE = 'Washington L&I Contractor Lookup: Registration, Bond, Claims';
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/washington-lni-record-six-year-history.jpg';
// California (#350) is the only other state page live; the set checker compares all state drafts.
const SIBLINGS = [
  'cslb-license-check-california-contractor',
  'oregon-contractor-license-lookup',
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one L&I or Washington contractor license search. ' +
  'If the first state pages are not being indexed by then, report it before many more go live (plan section 9).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'l&i contractor lookup',
  capture: '2026-11-13-demand-washington-contractor-license-bing',
  intent: 'navigational',
  who: 'a Washington homeowner or buyer holding a registration number from a bid or a Notice to Customer, about to hire for work on a house, and the contractor checking what clients see',
  want: 'to find the right L&I record fast and know what a registration and bond really protect',
  achieve: 'to match the number, read six years of lawsuits and violations, and know how the bond and the new recovery program pay before signing',
  titlePromise: 'how to run the L&I lookup and what the registration, bond and claim lines mean',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have a Washington contractor\'s name or registration number. How do I check it with L&I, and what does registered actually protect?',
  firstScreen: 'The official Verify link and its four search types in the first lines, then the point that Washington registers contractors rather than testing them.',
  firstParty: [
    { what: 'L&I Verify walked in a browser on 2026-11-13: a two-word name search returning 1018 results, the filters, a saveable detail page, and a full record with two bonds of different amounts', source: 'data/fact-ledgers/state-license/washington.json' },
    { what: 'Our cropped screenshot of a real record\'s four 6-year history lines, with no business, number, people or insurers shown', source: 'public/images/washington-lni-record-six-year-history.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken in the browser on the read date, cropped to remove names and numbers',
    'visible "How we checked this" naming the search run, the six RCW sections read and what we did not cover',
  ],
  beyondCommonFacts: [
    'the bond pays workers before homeowners, but non-homeowners can take no more than half of it (RCW 18.27.040)',
    'the homeowner recovery program from July 2026: $25,000 per contractor per parcel, 90 days to apply, discretionary, waitlist (RCW 18.27.410)',
    'a smaller old bond on a record is explained by the 2024 change and grandfathering until renewal',
    'the owner exemption ends when the work is done to sell, and an owner holding under twelve months to sell is not exempt (flips)',
    'no Notice to Customer on a $1,000+ house job means the contractor cannot bring a lien claim (RCW 18.27.114)',
  ],
  reproducibilityCheck: 'Top results are L&I\'s Verify tool and generic hiring tips. None explains the bond payment order, the half-for-homeowners rule, the new recovery program limits, or why a record shows two bond amounts.',
  discussion: 'needed',
  discussionReason: 'Registered is not the whole answer: the reader weighs a shared bond, the payment order, the new program\'s limits and, as a buyer, whether a flipper should have registered.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', 'state-license', 'washington.json'), 'utf8'));

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
  for (const sec of ['18.27.040', '18.27.050', '18.27.080', '18.27.090', '18.27.114', '18.27.410']) {
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
