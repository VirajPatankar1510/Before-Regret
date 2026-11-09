// Publish "Which Cities Require a Sewer Lateral Inspection at Sale?" -- T1 of docs/plans/report-4-articles-2026-11.md
// (an "AI gap" topic: published lists contradict each other; ours is built from each agency's own pages, dated).
//
//   npx tsx scripts/publish-sewer-lateral-inspection-at-sale.ts            # dry run
//   APPLY=true npx tsx scripts/publish-sewer-lateral-inspection-at-sale.ts
//
// Facts: data/fact-ledgers/sewer-lateral-inspection-at-sale-cities.json -- EBMUD pages + FAQ, Berkeley compliance guide
// (7/31/2024), San Mateo Municipal Code 7.38.432, South San Francisco fact sheet, Burlingame and Morgan Hill (Internet
// Archive copies of the official pages). First-party: the place-by-place comparison table. Costs from PRIORITY_RULES.
// Demand: Bing tier 2 "sewer lateral".
//
// READ 2026-12-14: shown on Google or Bing for at least one sewer-lateral search. RE-CHECK the rules every 6 months
// (next 2027-05-09); city rules change.
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
const SLUG = 'sewer-lateral-inspection-at-sale-cities';
const TITLE = 'Which Cities Require a Sewer Lateral Inspection at Sale?';
const TOPIC = 'plumbing';
const SIBLINGS = ['sewer-scope-before-buying-house', 'home-insurance-water-sewer-service-line', 'sewer-line-belly-found-inspection', 'why-cast-iron-pipes-corrode', 'final-walkthrough-checklist-before-closing'];
const STOP =
  'Read 2026-12-14: shown on Google or Bing for at least one sewer-lateral search. If not, offer the owner to fold the ' +
  'city table into the sewer scope guide. Re-check every rule by 2027-05-09.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'sewer lateral',
  capture: '2026-11-09-demand-roof-age-insurance-bing',
  intent: 'informational',
  who: 'a Bay Area seller, buyer or agent who has heard a sewer lateral certificate may be needed before closing',
  want: 'to know whether their city requires one at sale, what test counts, what exemptions apply and what happens if it is not done by closing',
  achieve: 'to book the right test early, check for an existing certificate, and write who pays and who holds the deposit into the contract',
  titlePromise: 'which cities require a sewer lateral inspection at sale',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Does my city require a sewer lateral inspection before I can sell or buy this house, and what exactly do I have to do?',
  firstScreen: 'Quick answer naming the verified places, then the note that online lists contradict each other (EBMUD) and the place-by-place table.',
  firstParty: [
    { what: 'Place-by-place table of point-of-sale sewer lateral rules built from each agency\'s own pages, dated 2026-11-09, with unverified places listed separately', source: 'data/fact-ledgers/sewer-lateral-inspection-at-sale-cities.json' },
    { what: 'Sewer scope and repair ranges from our report engine, checked at publish time', source: 'src/engine/inspectionPriorities.ts' },
  ],
  evidenceOfWork: [
    'table built from agency documents, with archive copies marked',
    'visible "How we checked this" naming each source, date and the cities we could not verify',
  ],
  beyondCommonFacts: [
    'EBMUD does require a certificate at sale (contradicting a widely shared post) and does not accept camera video in place of its witnessed pressure test',
    'Burlingame: buildings over 25 years old, city-witnessed test, video not accepted, certification 10 years / 25 after replacement',
    'South San Francisco reviews a CCTV video, valid 10 or 25 years, 180-day extension with a $10,500 deposit',
    'Morgan Hill lets repair duty pass to the buyer by notarized form; exemption window moves each year',
  ],
  reproducibilityCheck: 'Top results are realtor and contractor posts that contradict each other and cite no ordinances. None compares the agencies\' own rules side by side with test type, exemptions, validity and extension deposits, or marks which cities could not be verified.',
  discussion: 'needed',
  discussionReason: 'Buyer and seller must weigh which test their city accepts, whether an existing certificate covers the sale, and how to split the work and the deposit when it runs past closing.',
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
  if (!/^(No|Yes|Usually|Generally|It can|Not usually|Some do)\b/.test(quick)) fail('quick answer must open with a verdict');
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
