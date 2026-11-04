// Publish "Does Home Insurance Cover Your Water or Sewer Line?" -- #5 of docs/plans/report-4-articles-2026-11.md
// (our title; first article with Bing AI-opportunity evidence).
//
//   npx tsx scripts/publish-home-insurance-water-sewer-service-line.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-insurance-water-sewer-service-line.ts
//
// Facts: data/fact-ledgers/home-insurance-water-sewer-service-line.json -- NAIC consumer guide (2022), Philadelphia
// Water Department responsibility diagram (03/2026), San Diego lateral fact sheet, Torrance and Orem pages, one
// insurer's published endorsement FAQ (not named). First-party: the four-city ownership comparison and the sewer
// cost table from PRIORITY_RULES (checked here). Demand: Bing AI opportunity export + topic-demand tier 2.
//
// READ 2026-12-09: shown on Google or Bing for at least one service-line / water-line / sewer-line insurance search,
// and check the 2026-12-04 Topic Portfolio re-export for "service line coverage". If neither, offer the owner to fold
// the city table into the sewer scope guide (owner OK first).
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
const SLUG = 'home-insurance-water-sewer-service-line';
const TITLE = 'Does Home Insurance Cover Your Water or Sewer Line?';
const TOPIC = 'plumbing';
const SIBLINGS = ['sewer-scope-before-buying-house', 'sewer-line-belly-found-inspection', 'city-utilities-vs-septic-water-sewer-costs', 'lead-service-line-lookup-by-address', 'homeowners-insurance-cover-failed-sump-pump'];
const STOP =
  'Read 2026-12-09: shown on Google or Bing for at least one service-line or sewer-line insurance search, or cited for ' +
  '"service line coverage" in the 2026-12-04 Topic Portfolio re-export. If neither, offer to fold the city table into the sewer scope guide.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'service line coverage',
  capture: '2026-11-04-demand-service-line-coverage-bing',
  intent: 'informational',
  who: 'a homeowner or buyer facing a cracked or root-filled sewer or water line in the yard who wants to know if insurance pays',
  want: 'to know who owns that pipe, whether a standard policy covers it, and what a service line add-on actually includes',
  achieve: 'to check their city rule, read an endorsement form for the right exclusions, and price the repair before it happens',
  titlePromise: 'whether home insurance covers the water or sewer line',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'My sewer line under the yard is broken. Will my homeowners insurance pay, and if not, what does?',
  firstScreen: 'Quick answer (usually not; NAIC: not a maintenance contract; an add-on exists) then the ownership question with a four-city comparison table.',
  firstParty: [
    { what: 'Comparison of who owns the water and sewer line in Philadelphia, San Diego, Torrance and Orem, from each utility\'s own page', source: 'data/fact-ledgers/home-insurance-water-sewer-service-line.json' },
    { what: 'Sewer scope and repair cost ranges from our report engine, checked against it at publish time', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'Bing AI Performance opportunity list showing service line coverage as a query where we are not cited', source: 'data/keywords/2026-11-04-bing-ai-opportunity-queries.json' },
  ],
  evidenceOfWork: [
    'four-city table built from the utilities\' own documents',
    'cost table checked against PRIORITY_RULES by this script',
    'visible "How we checked this" naming each source, what blocked us and what we did not generalise',
  ],
  beyondCommonFacts: [
    'Philadelphia: owners are responsible from the ferrule on the main to the house, and defective lines get a Notice of Defect',
    'San Diego fixes a street-side lateral break at no charge only after a plumber report, and bills the owner if roots or grease caused it',
    'One endorsement FAQ excludes blockage ("no direct damage") and foundation shifting, though it covers wear and tear and roots',
    'NAIC: a policy is not a maintenance contract; sewer backup endorsements are a different coverage from the line itself',
  ],
  reproducibilityCheck: 'Top results are insurer pages saying an add-on exists. None compares city ownership rules from the utilities\' own documents, separates backup coverage from line coverage with the regulator\'s wording, lists a real endorsement\'s blockage and foundation exclusions, or prices the repair from a report engine.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh whether an add-on is worth buying given their city rule, the line\'s age and the exclusions, against paying for a scope and repair directly.',
};

const ENGINE_COSTS: Array<[string, 'costToCheck' | 'typicalRepairCost', string]> = [
  ['sewer_cast_iron', 'costToCheck', '$300 – $500'],
  ['sewer_cast_iron', 'typicalRepairCost', '$1,500 – $5,000'],
  ['sewer_cast_iron', 'typicalRepairCost', '$4,000 – $15,000+'],
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
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (!title.includes('?')) fail('quick answer needs a question title');
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (!/^(No|Yes|Usually|Generally|It can|Not usually)\b/.test(quick)) fail('quick answer must open with a verdict');
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words, ${costRows} cost rows, ${ENGINE_COSTS.length} engine figures checked`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
