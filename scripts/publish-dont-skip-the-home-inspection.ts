// Publish "Don't Skip the Home Inspection: Buyers' Biggest Regret" -- #1 of docs/plans/report-4-articles-2026-11.md
// (owner, 2026-11-02: write the outside report's titles word for word).
//
//   npx tsx scripts/publish-dont-skip-the-home-inspection.ts            # dry run
//   APPLY=true npx tsx scripts/publish-dont-skip-the-home-inspection.ts
//
// Facts: data/fact-ledgers/dont-skip-the-home-inspection.json -- Realtor.com's Feb 2025 regret survey (8% wish they had
// inspected; 16% more maintenance than expected), HUD-92564-CN, ASHI Standard of Practice (2014), 40 CFR 745.110.
// First-party: the two cost tables, taken from the report engine's PRIORITY_RULES and checked against it here.
// Demand: tier 3 (no Google or Bing signal for skip/waive phrasings) -> experiment from the owner's list.
//
// READ 2026-12-07: shown on Google or Bing for at least one search about skipping, waiving or needing a home
// inspection. If not, offer the owner to fold the "what a standard inspection doesn't do" section into an existing
// inspection guide (owner OK first).
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
const SLUG = 'dont-skip-the-home-inspection';
const TITLE = "Don't Skip the Home Inspection: Buyers' Biggest Regret";
const TOPIC = 'transaction';
const SIBLINGS = ['home-inspection-include-septic-system', 'standard-home-inspection-include-termites', 'when-reasonable-walk-away-after-inspection', 'sewer-scope-before-buying-house', 'when-was-my-house-built-by-address'];
const STOP =
  'Read 2026-12-07: shown on Google or Bing for at least one search about skipping, waiving or needing a home inspection. ' +
  'If not, offer the owner to fold the standard-inspection-limits section into an existing inspection guide.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'skip home inspection',
  capture: '2026-11-02-demand-skip-home-inspection-bing',
  intent: 'informational',
  who: 'a buyer under offer pressure who is tempted to skip the inspection or waive the contingency to win the house',
  want: 'an honest answer on whether buyers regret skipping it, what the appraisal does not cover, and what an inspection itself leaves out',
  achieve: 'to keep an inspection in the deal, or at least inspect without the contingency, and book the right add-on checks',
  titlePromise: 'why skipping the home inspection is a regret buyers report, and what to do instead',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Everyone says get an inspection, but I might lose the house. Do people actually regret skipping it?',
  firstScreen: 'The opening gives the real survey numbers (8% wish they had inspected, 12% of Gen Z; 16% more maintenance than expected) and why the common regrets are what an inspection previews.',
  firstParty: [
    { what: 'Two cost tables (add-on check cost vs repair range; major-system replacement ranges) taken from our report engine and asserted against it at publish time', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'Our demand capture showing no first-party signal for skip/waive phrasings, so the page is run as an experiment', source: 'data/keywords/2026-11-02-demand-skip-home-inspection-bing.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the survey, HUD form, ASHI standard and rule read, and the statistics we left out',
    'ledger data/fact-ledgers/dont-skip-the-home-inspection.json',
    'cost tables checked against PRIORITY_RULES by this script',
  ],
  beyondCommonFacts: [
    'Realtor.com Feb 2025: 8% of recent buyers wish they had inspected (12% Gen Z), while the top regret, 16%, is more maintenance than anticipated',
    'HUD-92564-CN: FHA does not perform inspections and cannot lend money for repairs or buy the home back',
    'ASHI SOP 6.2.B: the inspector is not even required to determine whether water and sewage are public or private',
    'Waiving the contingency is not the same as not inspecting; 40 CFR 745.110 lead inspection right is waivable only in writing',
  ],
  reproducibilityCheck: 'Top results say "never skip it" with untraceable statistics. They do not give the survey\'s real rank for this regret, quote HUD\'s form, list the ASHI section-by-section exclusions, separate waiving the contingency from not inspecting, or price the add-ons from a report engine.',
  discussion: 'needed',
  discussionReason: 'The reader is weighing winning the house against the risk: waiving the contingency vs not inspecting, and which add-on checks are worth paying for on a given house.',
};

const ENGINE_COSTS: Array<[string, 'costToCheck' | 'typicalRepairCost', string]> = [
  ['sewer_cast_iron', 'costToCheck', '$300 – $500'],
  ['sewer_cast_iron', 'typicalRepairCost', 'spot repair $1,500 – $5,000; full replacement $4,000 – $15,000+'],
  ['termite_wdi_inspection', 'costToCheck', '$75 – $150'],
  ['termite_wdi_inspection', 'typicalRepairCost', 'treatment $1,200 – $5,000'],
  ['termite_wdi_inspection', 'typicalRepairCost', '$1,000 – $9,000+'],
  ['radon_test', 'costToCheck', '$150 – $300'],
  ['radon_test', 'typicalRepairCost', 'mitigation system $800 – $2,500'],
  ['chimney_level2', 'costToCheck', '$250 – $600'],
  ['chimney_level2', 'typicalRepairCost', 'flue liner replacement $1,500 – $5,000'],
  ['eifs_stucco', 'costToCheck', '$400 – $800'],
  ['eifs_stucco', 'typicalRepairCost', 'extensive sheathing replacement can exceed $10,000'],
  ['roof_age', 'typicalRepairCost', '$8,000 – $25,000+'],
  ['hvac_age', 'typicalRepairCost', '$6,000 – $15,000'],
  ['hvac_age', 'typicalRepairCost', '$1,200 – $3,000'],
  ['electrical_panel_brand', 'typicalRepairCost', '$1,500 – $4,000'],
  ['galvanized_supply', 'typicalRepairCost', 'whole-home repipe $4,000 – $15,000'],
  ['polybutylene_supply', 'typicalRepairCost', 'whole-home repipe $4,000 – $15,000'],
];

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };

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
  // The new transaction alternative must not catch any existing guide.
  const moved = rows.filter((r) => r.status === 'published' && r.slug !== SLUG && /skip[- ](the[- ])?home[- ]inspection/.test(`${r.slug} ${r.title.toLowerCase()}`));
  if (moved.length) fail(`new transaction pattern catches existing guides: ${moved.map((r) => r.slug).join(', ')}`);
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('non-question title carries a quick answer');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // Every cost in the tables must be the engine's own string for that rule.
  const lowerBody = body.toLowerCase();
  for (const [id, field, s] of ENGINE_COSTS) {
    const r = PRIORITY_RULES.find((x) => x.id === id);
    const engineText = String(r?.[field] ?? '').toLowerCase();
    if (!engineText.includes(s.toLowerCase())) fail(`engine ${id}.${field} no longer says "${s}"`);
    if (!lowerBody.includes(s.toLowerCase())) fail(`article is missing engine figure "${s}" (${id})`);
  }
  const costRows = body.split('\n').filter((l) => /^\| .*\$\d/.test(l)).length;

  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick: none (non-question title)\n    body  ${body.split(/\s+/).length} words, ${costRows} cost rows, ${ENGINE_COSTS.length} engine figures checked`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
