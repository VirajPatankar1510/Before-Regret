// Publish /guides/4-point-inspection-florida/ -- what a Florida 4-point inspection checks, decoded from the form itself.
// A NEW URL: no guide owns "4 point inspection"; #23 (Zinsco), #76 (fuse box) and #373 (Pushmatic) each have one
// section on the panel lines only. Owner picked this over the Accela status page on 2026-11-26.
//
//   npx tsx scripts/publish-4-point-inspection-florida.ts            # dry run
//   APPLY=true npx tsx scripts/publish-4-point-inspection-florida.ts
//
// DEMAND. Tier 2 (Bing market counts 2026-11-26, relative only): "4 point inspection" 465 exact, "4 point inspection
// florida" 68; no rows for this site. Insurance-question pages are a proven format, but a FORM DECODER is not, so this
// is an EXPERIMENT. READ 2026-12-31: shown on Google or Bing for any "4 point inspection" search. If not, no more
// form-decoder pages (wind mitigation form, roof inspection form) until the next scorecard.
//
// DECISION MAP. Reader's question: "The insurer wants a 4-point inspection on the house I'm buying. What will it check,
// and what could stop my policy?"
//   who requires it, and does my house need one?   -> section: Citizens >20 years (linked); our Census 67.7% / 85.8%, median 1988
//   what exactly is on the form?                   -> section + table: four systems, the line to watch in each
//   what does a flagged item cost to fix?          -> table column: our engine's ranges
//   what photos are needed?                        -> section: the 6 required photos
//   will an old roof sink it?                      -> section: Fla. Stat. 627.7011(5) + Citizens 25/50-year roof rule
//   what happens if something is Unsatisfactory?   -> section: agent may not submit; form is not a warranty
//   who can sign it / re-sign after a repair?      -> section: licensed pros; trade pros only their section
//   what do I do before my inspection period ends? -> list
//   cost of a 4-point, how long it's valid, other insurers' age rules -> skipped: no primary source (said on the page)
//
// First-party: our line-by-line read and counts of Insp4pt 03 25; scripts/build-florida-4-point-housing-age.ts
// (docs/data/florida-4-point-housing-age.json); our engine's repair ranges. Facts: data/fact-ledgers/4-point-inspection-florida.json.
// Citizens is named only in sentences that link Citizens' own page, as assert-article-quality.ts rule 1 requires.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const OWNER_TITLE_OK = process.env.OWNER_TITLE_OK === 'true';
const SLUG = '4-point-inspection-florida';
const TITLE = 'Will Your House Pass a 4-Point Inspection in Florida?';
const TOPIC = 'insurance';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'will-zinsco-panel-fail-4-point-inspection',
  'get-home-insurance-fuse-box',
  'pushmatic-panel-buying-house',
  'home-insurance-roof-age-law-by-state',
  'home-inspection-checklist-cost',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one "4 point inspection" search. ' +
  'If not, no more form-decoder pages (wind mitigation, roof inspection form) until the next scorecard.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: '4 point inspection florida',
  capture: '2026-11-26-demand-4-point-inspection-bing',
  intent: 'informational',
  who: 'a buyer under contract on a Florida house more than 20 years old whose insurance agent has asked for a 4-point inspection',
  want: 'to know what the inspector will record on the form and which answers can stop the insurance policy',
  achieve: 'to order the 4-point with the general inspection, read the flagged lines, and price any fix before the inspection period ends',
  titlePromise: 'whether a house will pass a Florida 4-point inspection, and what it checks',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Will the house I am buying pass a Florida 4-point inspection, and what on it could stop my insurance?',
  firstScreen: 'The quick answer (it passes when all four systems work as intended with no visible hazard; what the inspector records) and the first section on who requires it.',
  firstParty: [
    { what: 'Our line-by-line read of Citizens Sample Form Insp4pt 03 25 on 2026-11-26, with our counts: 12 named electrical hazards, 10 plumbing fixtures, 8 roof damage signs, 6 required photos', source: 'data/fact-ledgers/4-point-inspection-florida.json' },
    { what: 'Our Census ACS 2020-2024 pull for Florida: 67.7% of homes built 1999 or earlier, 85.8% by 2009, median 1988', source: 'docs/data/florida-4-point-housing-age.json' },
    { what: 'Our report engine repair ranges for each 4-point system (panel, aluminum wiring, knob and tube, repipe, HVAC, water heater, roof)', source: 'src/engine/inspectionPriorities.ts' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the form version, the Citizens page, the statute, our Census script and what was not found',
    'a section-by-section table of the form with the line to watch and our engine ranges',
  ],
  beyondCommonFacts: [
    'page 4 of Insp4pt 03 25 says the form itself is not required but any report must match its level of detail',
    'a trade professional may sign only the section for their trade, so an electrician can re-document only the electrical section',
    'the roof section remaining-useful-life box is the number Fla. Stat. 627.7011(5) tests at 5 years for roofs 15+ years old',
    'with photos of every slope, the 4-point roof section can replace the separate Citizens Roof Inspection Form',
  ],
  reproducibilityCheck: 'Top results are inspector and agent pages that list the four systems and say older homes need one. None counts the form lines, ties the remaining-useful-life box to 627.7011(5), states who may sign which section, or gives Florida housing ages.',
  discussion: 'needed',
  discussionReason: 'The reader has to weigh which flagged line matters for their house and whether to fix it, ask for a credit or shop the policy, and the roof answer changes with age and material.',
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
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  let titlePending = false;
  if (title.length > 60) {
    const canon = fs.readFileSync(path.join(process.cwd(), 'scripts', 'assert-canonical-urls.ts'), 'utf8');
    if (!canon.includes(`'/guides/${SLUG}/'`)) {
      titlePending = true;
      console.log(`  OWNER DECISION title is ${title.length} chars: confirm the owner's exact title (add to OWNER_LONG_TITLES) or pick the short one`);
    }
  }
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars (question title needs 120-450)`);
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  const firstPara = body.split(/\n\s*\n/)[0];
  void firstPara;
  for (const img of IMAGES)
    if (!body.includes(`](${img} `) || !fs.existsSync(path.join(process.cwd(), 'public', img))) fail(`screenshot ${img} missing from body or disk`);
  for (const r of ['Insp4pt 03 25', '627.7011', 'Unsatisfactory', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in the ledger (facts or our portal walk).
  const ledgerAll = JSON.stringify({ facts: ledger.facts, ourWork: ledger.ourWork });
  const ledgerQuotes = norm(ledger.facts.map((f: { quote: string }) => f.quote).join(' '));
  for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!ledgerQuotes.includes(norm(m[1]))) fail(`quoted text not found in a ledger quote: "${m[1]}"`);
  }
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?%?\d[\d,./-]*%?/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies|contractors) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Universal Property)\b/i,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/, /^#{2,3}\s+Step\s+\d/im,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  // Citizens may be named only where the same sentence links Citizens' own page (gate rule 1's sourced-claim exception).
  for (const sent of body.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/))
    if (/Citizens Property/i.test(sent) && !/\]\(https:\/\/www\.citizensfla\.com\//.test(sent)) fail(`Citizens Property named without its source link: ${sent.slice(0, 120)}`);
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    if (!published.has(sib)) { fail(`sibling ${sib} not published`); continue; }
    const ov = overlap(body, published.get(sib)!);
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}  [${TOPIC}]\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log(`\n  DRY RUN -- all checks pass${titlePending ? ' (title awaits the owner)' : ''}.\n`); return; }
  if (titlePending && !OWNER_TITLE_OK) { console.log('\n  title awaits the owner -- nothing written.'); process.exit(1); }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
