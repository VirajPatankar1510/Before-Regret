// Publish "CSLB License Check: How to Read a Contractor's Record" -- the first contractor-licence lookup guide, a line
// the owner chose on 2026-11-10 to reach people about to hire a pro (the buyer side of Find a Pro) and contractors
// themselves, without outreach. One state at a time, each individually researched (never a template set:
// docs/research/pseo-good-vs-bad-2026-10.md).
//
//   npx tsx scripts/publish-cslb-license-check.ts            # dry run
//   APPLY=true npx tsx scripts/publish-cslb-license-check.ts
//
// Facts: data/fact-ledgers/cslb-license-check-california-contractor.json -- CSLB Check A License walked in a browser on
// 2026-11-10 (name and number search, one active corporate record, complaint definitions), Cal. Bus. & Prof. Code
// §§ 7030.5, 7031, 7048 (as amended eff. 2026-01-01), 7057, 7071.5, 7071.6, 7124.6, 7153, 7159.5, and CSLB's consumer page.
// First-party: the portal observations (name search is a prefix list mixing DBA/previous names and several licences
// per name; record links can't be opened directly) and our cropped screenshot. No business, person or insurer named.
// Demand: tier 2 (topic-demand 2026-11-10: "cslb check license" and variants in Bing counts; nothing first-party yet).
//
// READ 2026-12-15: shown on Google or Bing for at least one CSLB / California contractor license search, and the
// findapro_invite_slot clicks from this page (scripts/cta-click-report.ts). If not shown, don't start the next state
// (Arizona ROC) until it is; if shown, continue the line at 1-2 states a week. Re-check every statute and the portal by
// 2027-05-10.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'cslb-license-check-california-contractor';
const TITLE = "CSLB License Check: How to Read a Contractor's Record";
const TOPIC = 'contractor-licensing';
const IMAGE = '/images/cslb-license-record-status-section.webp';
// No other contractor-licensing guide exists yet; compare against the nearest pages instead.
const SIBLINGS = [
  'find-unpermitted-work-before-buying',
  'unpermitted-work-behind-the-wall',
  'how-to-choose-eifs-stucco-inspector',
  'amateur-workmanship-mean-home-inspection-report',
  'legalize-unpermitted-deck',
];
const STOP =
  'Read 2026-12-15: shown on Google or Bing for at least one CSLB or California contractor license search. If not, pause ' +
  'the state line (no Arizona page) until it is; if shown, continue at 1-2 states a week.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'cslb license check',
  capture: '2026-11-10-demand-ca-contractor-license-lookup-bing',
  intent: 'navigational',
  who: 'a California homeowner or buyer about to sign with a contractor, holding a name or license number from a bid, and the contractor checking what clients see',
  want: 'to find the right CSLB record quickly and know whether it means the contractor can legally do this job',
  achieve: 'to match the number to the contract, confirm the classification, bond and workers comp, and know what an empty complaint section does not prove before paying a deposit',
  titlePromise: 'how to run the CSLB license check and read every part of the record',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have a contractor\'s name or license number. How do I check it, and is an active license enough?',
  firstScreen: 'The official Check A License link in the first line, then why to search by number and the quirks of the name search.',
  firstParty: [
    { what: 'CSLB Check A License walked in a browser on 2026-11-10: name search behaviour (prefix list, DBA and previous names, several licences under one name), record links that cannot be opened directly, and each section of an active record', source: 'data/fact-ledgers/cslb-license-check-california-contractor.json' },
    { what: 'Our cropped screenshot of a real record\'s status and additional-status section, with no business, people or insurers shown', source: 'public/images/cslb-license-record-status-section.webp' },
  ],
  evidenceOfWork: [
    'screenshot taken in the browser on the read date, cropped to remove names',
    'visible "How we checked this" naming the searches run, the nine statute sections and what we could not confirm',
  ],
  beyondCommonFacts: [
    'the name search returns the same legal name on two licence numbers with different statuses, so a name match can be the wrong record',
    'the $25,000 bond: homeowners on a home improvement job can claim it in full, others share a $7,500 cap (7071.6, 7071.5)',
    'C-8, C-20, C-22, C-39 and D-49 contractors must carry workers comp even with no employees',
    'complaint disclosure windows by type (7124.6), and CSLB\'s own page saying one year for admonishments where the statute says one or two',
    'the 2026 small-job exception requires no permit and fails if the person advertises or has a helper (7048)',
    'a blanket performance and payment bond on the record exempts the contractor from the down-payment cap (7159.5(a)(8))',
  ],
  reproducibilityCheck: 'Top results are CSLB\'s own lookup and short "verify your contractor" lists. None shows how the name search misleads, what each section of the record means in law, or what the complaint link leaves out.',
  discussion: 'needed',
  discussionReason: 'An active status is not the whole answer: the reader has to weigh classification, bond limits, workers comp and what an empty complaint section does not prove.',
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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`), 'utf8'));

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
  if (!firstPara.includes('https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx')) fail('official lookup not linked in the first paragraph');
  if (!body.includes(`](${IMAGE} `) || !fs.existsSync(path.join(process.cwd(), 'public', IMAGE))) fail('screenshot missing from body or disk');

  // Every section cited must be in the ledger; every long quotation must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['7030.5', '7031', '7048', '7057', '7071.5', '7071.6', '7071.17', '7124.6', '7153', '7159.5']) {
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
