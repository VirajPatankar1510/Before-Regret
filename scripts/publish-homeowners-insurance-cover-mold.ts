// Publish "Does Homeowners Insurance Cover Mold?" -- #6 of docs/plans/report-4-articles-2026-11.md (our title).
//
//   npx tsx scripts/publish-homeowners-insurance-cover-mold.ts            # dry run
//   APPLY=true npx tsx scripts/publish-homeowners-insurance-cover-mold.ts
//
// Facts: data/fact-ledgers/homeowners-insurance-cover-mold.json -- TDI consumer page (4/24/2025), NAIC consumer guide
// (2022), Texas Occupations Code 1958.154/.155, Texas Insurance Code 544.301/.303, EPA mold guide (2026-02-18).
// First-party: the cause-of-water table built from the regulator's guidance and the Texas certificate checklist for
// buyers. Demand: Bing AI opportunity export (six mold-coverage queries) + topic-demand tier 2.
//
// READ 2026-12-14: shown on Google or Bing for at least one mold-insurance search, or cited for a mold-coverage
// query in the 2026-12-04 Topic Portfolio re-export. If neither, offer the owner to fold the Texas certificate section
// into the mold inspection guide (#99; owner OK first).
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'homeowners-insurance-cover-mold';
const TITLE = 'Does Homeowners Insurance Cover Mold?';
const TOPIC = 'environmental';
const SIBLINGS = ['home-inspection-check-mold-behind-walls', 'home-insurance-water-sewer-service-line', 'homeowners-insurance-cover-failed-sump-pump', 'fall-home-maintenance-checklist-new-homeowners', 'get-clue-report-before-buying-house'];
const STOP =
  'Read 2026-12-14: shown on Google or Bing for at least one mold-insurance search, or cited for a mold-coverage query in the ' +
  '2026-12-04 Topic Portfolio re-export. If neither, offer to fold the Texas certificate section into the mold inspection guide.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'does homeowners insurance cover mold',
  capture: '2026-11-09-demand-homeowners-insurance-mold-bing',
  intent: 'informational',
  who: 'a homeowner who just found mold after a leak, or a buyer looking at a house that had mold, wondering whether insurance covers it',
  want: 'to know which causes of mold a policy usually covers, what to do quickly, and what paperwork protects them as a buyer',
  achieve: 'to file or not file with realistic expectations, dry and document fast, and ask a seller for remediation certificates',
  titlePromise: 'whether homeowners insurance covers mold',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I found mold. Will my homeowners insurance pay for it, and if I am buying a house that had mold, what do I ask for?',
  firstScreen: 'Quick answer (it can, depending on the water source) then the cause-of-water table from the Texas regulator.',
  firstParty: [
    { what: 'Cause-of-water coverage table organised from the Texas Department of Insurance guidance', source: 'data/fact-ledgers/homeowners-insurance-cover-mold.json' },
    { what: 'Buyer checklist built from reading Texas Occupations Code 1958.154/.155 and Insurance Code 544.303 together', source: 'data/fact-ledgers/homeowners-insurance-cover-mold.json' },
    { what: 'Bing AI Performance opportunity list showing mold-coverage queries where we are not cited', source: 'data/keywords/2026-11-04-bing-ai-opportunity-queries.json' },
  ],
  evidenceOfWork: [
    'statute sections and quoted regulator wording checked against the ledger by this script',
    'visible "How we checked this" naming each source and date and what was left out',
  ],
  beyondCommonFacts: [
    'Texas Occupations Code 1958.154(b): a seller must give the buyer every mold remediation certificate from the five years before the sale',
    'Texas Insurance Code 544.303: insurers may not base underwriting on past mold damage when a certificate shows the cause was fixed, with the wind pool, FAIR Plan and surplus lines excluded',
    'Texas 1958.155 bars one license holder from both assessing and remediating the same project',
    'TDI: hidden water damage usually must be reported within days of first seeing it; mold can start within a day',
  ],
  reproducibilityCheck: 'Top results say "it depends on the cause". None quotes a regulator\'s cause-by-cause guidance, the Texas seller duty to hand over five years of remediation certificates, the insurance rule tied to that certificate, or the assessor/remediator conflict rule.',
  discussion: 'needed',
  discussionReason: 'The reader weighs whether a given mold loss is likely covered (cause, speed, add-ons), and as a buyer what paperwork to demand and how it affects future insurability.',
};

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

  // Every statute section cited must be in the ledger, and every TDI table quote must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['1958.154', '1958.155', '544.303', '544.301']) {
    if (!body.includes(sec)) fail(`section ${sec} expected in body`);
    if (!ledgerAll.includes(sec)) fail(`section ${sec} not in ledger`);
  }
  for (const m of body.matchAll(/"([^"]{12,})"/g)) {
    const norm = (x: string) => x.toLowerCase().replace(/[\u2018\u2019]/g, "'");
    if (!norm(ledgerAll).includes(norm(m[1]))) fail(`quoted text not found in ledger: "${m[1]}"`);
  }
  const costRows = body.split('\n').filter((l) => /^\| (Sudden|A gradual|A flood|Cleanup)/.test(l)).length;
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words, ${costRows} cause rows; statute sections and quotes checked against the ledger`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
