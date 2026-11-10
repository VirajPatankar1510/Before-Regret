// Publish "Can Your Insurer Drop You Over Roof Age? The Rules by State" -- T3 of docs/plans/report-4-articles-2026-11.md
// (an "AI gap" topic: posts disagree on which states limit roof-age nonrenewals; 2026 headlines said Texas "just banned" it).
//
//   npx tsx scripts/publish-home-insurance-roof-age-law.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-insurance-roof-age-law.ts
//
// Facts: data/fact-ledgers/home-insurance-roof-age-law-by-state.json -- Fla. Stat. 627.7011(5)-(6); Va. Code 38.2-2114(K)
// (2026 Acts ch. 657, eff. 2027-01-01); Cal. Ins. Code 676.14 / 676.11 (SB 1301, 2026 ch. 693, operative 2028-01-01);
// 28 TAC 21.1006 + TDI proposal and release of 2026-09-29; 24-A M.R.S. 3057; Minn. Stat. 72A.20 subd. 13 and 65A.29.
// First-party: the six-state comparison, and our engine's roof_age rule (read at run time below). No insurer is named.
// Demand: tier 3 (topic-demand 2026-11-10 found no first-party signal), so this is an experiment.
//
// READ 2026-12-16: shown on Google or Bing for at least one roof-age insurance search. If not, offer to fold the table
// into prove-roof-age-for-insurance (#307). Check whether Texas adopted the 21.1006 amendments by the same date, and
// re-check every state by 2027-05-10 (Virginia takes effect 2027-01-01).
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
const SLUG = 'home-insurance-roof-age-law-by-state';
const TITLE = 'Can Your Insurer Drop You Over Roof Age? The Rules by State';
const TOPIC = 'roofing-exterior';
const SIBLINGS = [
  'prove-roof-age-for-insurance',
  'home-insurance-cancelled-after-buying-house-roof',
  'home-insurance-nonrenewal-roof-photo',
  'how-to-tell-how-old-a-roof-is',
  'home-insurance-aerial-photos-roof',
  'get-home-insurance-flat-roof',
];
const STOP =
  'Read 2026-12-16: shown on Google or Bing for at least one roof-age insurance search. If not, offer to fold the ' +
  'state table into prove-roof-age-for-insurance. Check Texas adoption of the 21.1006 changes then; re-check every state by 2027-05-10.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'roof age insurance',
  capture: '2026-11-10-demand-roof-age-insurance-bing',
  intent: 'informational',
  who: 'a homeowner or buyer whose insurer has flagged an older roof, or who is buying a house with one, in a state that may limit roof-age nonrenewals',
  want: 'whether their state law stops an insurer refusing or not renewing over roof age, and what route exists for an older roof',
  achieve: 'to collect the right roof-age proof, book an inspection that the law recognises, and use the state notice or review rights before coverage lapses',
  titlePromise: 'whether an insurer can drop you over roof age, with the rules by state',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'My insurer says my roof is too old. Is that allowed in my state, and what can I do about it?',
  firstScreen: 'Quick answer naming the states and the 15-year / 5-year rule, then the six-state table with citations and start dates.',
  firstParty: [
    { what: 'Six-state comparison of roof-age and home-age insurance laws built from each statute or rule, read 2026-11-10, incl. where Florida and Virginia differ despite the same numbers', source: 'data/fact-ledgers/home-insurance-roof-age-law-by-state.json' },
    { what: 'Our report engine\'s roof_age rule (houses 12+ years old; full replacement cost range), read at run time', source: 'src/engine/inspectionPriorities.ts' },
  ],
  evidenceOfWork: [
    'table citing each state section and start date, checked against the ledger by this script',
    'visible "How we checked this" naming each source, the browser read of the California pages, and what we could not confirm',
  ],
  beyondCommonFacts: [
    'Texas: the 2026 proposal says it does not change the rule\'s meaning; the age prohibition already existed; siding added',
    'Virginia protects roofs under 15 on age but older roofs on condition and replacement, unlike Florida; asphalt shingle only; names the purchaser',
    'Florida requires the inspector to be approved by the insurer; Virginia\'s definition does not',
    'Both count age from the first partial replacement when staged work completed the roof; Virginia lists receipts, permits and inspector reports as sufficiently determinative',
    'California\'s inspection rule starts 2028-01-01 and still lets the insurer consider roof age',
  ],
  reproducibilityCheck: 'Top results are Florida-only explainers and news on Texas that call it a new ban. None puts the six laws side by side with their citations, start dates and the wording differences between Florida and Virginia.',
  discussion: 'needed',
  discussionReason: 'The reader has to weigh which rule applies (age vs condition, roof under or over 15, which roof material), and what the laws still allow (condition, price, other lawful reasons).',
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

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (!title.includes('?')) fail('quick answer needs a question title');
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (!/^(No|Yes|Usually|Generally|It can|Not usually|It depends)\b/.test(quick)) fail('quick answer must open with a verdict');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // The engine claims must match the engine as it is today, not as it was when the draft was written.
  const roof = PRIORITY_RULES.find((r) => r.id === 'roof_age');
  if (!roof) fail('engine rule roof_age missing');
  else {
    const now = new Date().getFullYear();
    if (now - (roof.maxYear as number) !== 12) fail(`roof_age now applies at ${now - (roof.maxYear as number)} years, draft says 12`);
    if (roof.typicalRepairCost !== 'Full replacement $8,000 – $25,000+') fail(`roof_age cost changed: ${roof.typicalRepairCost}`);
    if (!/age and remaining life of the roof in writing/.test(roof.title)) fail('roof_age title changed');
  }

  // Every section cited must be in the ledger; every quotation must be a ledger quote.
  const ledgerAll = JSON.stringify(ledger.facts);
  for (const sec of ['627.7011', '38.2-2114', '676.14', '21.1006', '3057', '72A.20', '65A.29']) {
    if (!all.includes(sec)) fail(`section ${sec} expected in the article`);
    if (!ledgerAll.includes(sec)) fail(`section ${sec} not in ledger`);
  }
  const ledgerQuotes = norm(ledger.facts.map((f: { quote: string }) => f.quote).join(' '));
  // Pair quotation marks first, then skip short ones ("solely"): matching only long spans misaligns the pairs.
  for (const m of all.matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!ledgerQuotes.includes(norm(m[1]))) fail(`quoted text not found in a ledger quote: "${m[1]}"`);
  }
  const stateRows = body.split('\n').filter((l) => /^\| \*\*(Florida|Virginia|California|Texas|Maine|Minnesota)\*\*/.test(l)).length;
  if (stateRows !== 6) fail(`expected 6 state rows, found ${stateRows}`);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First|Universal|Chubb|Erie|American Family)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    if (!published.has(sib)) { fail(`sibling ${sib} not published`); continue; }
    const ov = overlap(body, published.get(sib)!);
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words, ${stateRows} state rows; sections, quotes, numbers and engine figures checked`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
