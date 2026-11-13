// Publish "Option Period Strategies: Negotiating Home Repairs" -- the owner's title, word for word (2026-11-13; the
// trailing period in the request dropped, as no title on the site ends in one).
// Scope: what to ask for and in what form (repair, credit, lower price), grounded in Fannie Mae's interested-party
// contribution limits and our engine's repair ranges. Walk-away mechanics stay with #171, seller back-out with #180.
//
//   npx tsx scripts/publish-option-period-repairs.ts            # dry run
//   APPLY=true npx tsx scripts/publish-option-period-repairs.ts
//
// Facts: data/fact-ledgers/option-period-negotiating-home-repairs.json -- Fannie Mae Selling Guide B3-4.1-02 (05/07/2025).
// First-party: engine repair ranges and "not in a general inspection" notes (read at run time below), and our cap
// arithmetic. TREC contract text not reachable (regional timeout, archive rate-limited): no Texas contract wording quoted.
// Demand: tier 2, thin (topic-demand 2026-11-13).
//
// READ 2026-12-18: shown on Google or Bing for at least one repair-negotiation / option-period / seller-credit search.
// If not, write no more negotiation pages. Re-check the Fannie Mae limits by 2027-05-13.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'option-period-negotiating-home-repairs';
const TITLE = 'Option Period Strategies: Negotiating Home Repairs';
const TOPIC = 'transaction';
const SIBLINGS = [
  'when-reasonable-walk-away-after-inspection',
  'seller-back-out-after-accepting-inspection-response',
  'negotiate-radon-mitigation-after-inspection',
  'dont-skip-the-home-inspection',
  'final-walkthrough-checklist-before-closing',
];
const STOP =
  'Read 2026-12-18: shown on Google or Bing for at least one repair-negotiation, option-period or seller-credit search. ' +
  'If not, write no more negotiation pages.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'repair request after inspection',
  capture: '2026-11-13-demand-option-period-bing',
  intent: 'informational',
  who: 'a buyer in the option period or inspection window holding a long inspection report and a deadline days away',
  want: 'which items to ask the seller for, and whether to ask for a repair, a credit or a lower price',
  achieve: 'to send a short written request in the form that actually reaches them, sized to what their loan allows as a credit',
  titlePromise: 'strategies for negotiating home repairs during the option period',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'My inspection report is long and my option period ends in days. What do I ask the seller for, and in what form?',
  firstScreen: 'Pick few items and the form of the ask; option period means your contract terms; link to the walk-away guide; book separate checks on day one.',
  firstParty: [
    { what: 'Our report engine: repair ranges for sewer, roof, HVAC and panel, and which checks a general inspection leaves out, read at run time', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'Our arithmetic putting the Fannie Mae seller-credit caps next to those ranges for a $300,000 example', source: 'data/fact-ledgers/option-period-negotiating-home-repairs.json' },
  ],
  evidenceOfWork: [
    'cap table and cost table checked against the ledger and the engine by this script',
    'visible "How we checked this" naming the guide version read, the engine, and the Texas contract we could not reach',
  ],
  beyondCommonFacts: [
    'a seller credit can only cover closing costs and prepaids, never more than the buyer closing costs (Fannie Mae B3-4.1-02)',
    'credit caps of 3%, 6% or 9% by loan-to-value, with excess deducted from the price',
    'a roof in our engine ($8,000 - $25,000+) can exceed the credit allowed on a $300,000 house with 5% down ($9,000)',
    'money given outside closing and off the settlement statement can make the loan ineligible',
  ],
  reproducibilityCheck: 'Top results say always take a credit. None puts the lender caps and the closing-cost ceiling next to real repair ranges to show when a credit runs out and a price cut works better.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh repair, credit and price cut, and the answer changes with loan type, down payment and repair size.',
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

  // Scope guard: walk-away and seller back-out live on their own pages.
  for (const s of ['when-reasonable-walk-away-after-inspection', 'seller-back-out-after-accepting-inspection-response']) if (!body.includes(`/guides/${s}/`)) fail(`must link ${s}`);
  // Engine figures must match the engine today.
  const rule = (id: string) => PRIORITY_RULES.find((r) => r.id === id)!;
  for (const [id, s] of [['sewer_cast_iron', 'Spot repair $1,500 – $5,000; full replacement $4,000 – $15,000+'], ['roof_age', '$8,000 – $25,000+'], ['hvac_age', '$6,000 – $15,000'], ['electrical_panel_brand', '$1,500 – $4,000']] as const) {
    if (!String(rule(id).typicalRepairCost).includes(s)) fail(`engine ${id} changed: ${rule(id).typicalRepairCost}`);
    if (!body.includes(s)) fail(`body missing engine figure ${s}`);
  }
  if (!/most general home inspections do not include it unless you ask/.test(String(rule('sewer_cast_iron').howToCheck))) fail('engine sewer wording changed');
  if (!/Most general home inspections do not include one unless you ask/.test(String(rule('termite_wdi_inspection').howToCheck))) fail('engine WDI wording changed');

  // Every section cited must be in the ledger; every long quotation must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['3-4.1-02']) {
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
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Chubb|Chicago Title|Fidelity|First American|Stewart|Old Republic|Ticor)\b/i,
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
