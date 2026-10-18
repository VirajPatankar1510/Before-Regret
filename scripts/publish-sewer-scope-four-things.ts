// Publish "4 Things a Sewer Scope Can Reveal Before You Buy a House" (owner request 2026-10-18, exact title) with the
// cutaway diagram of four conditions (render-guide-diagrams.py sewer_scope_four), CC BY like the rest.
//
//   npx tsx scripts/publish-sewer-scope-four-things.ts            # dry run
//   APPLY=true npx tsx scripts/publish-sewer-scope-four-things.ts
//
// Facts: data/fact-ledgers/sewer-scope-before-buying-house.json -- WERF 2006 lateral report (camera strengths,
// limits, access, cleaning, defect codes), San Mateo lateral form, PRIORITY_RULES sewer_cast_iron.
// Demand: tier 1 WEAK (one Bing query) + Bing relative counts for "sewer scope" -> an experiment.
//
// READ 2026-11-22: shown on Google or Bing for at least one sewer-scope search, or its image shown in Google
// Images. If neither, fold its "can't establish / follow-up" material into #335 and #300 (owner OK first).
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'sewer-scope-before-buying-house';
const OWNER_TITLE = '4 Things a Sewer Scope Can Reveal Before You Buy a House';
const IMAGE = '/images/sewer-scope-four-findings-cutaway.webp';
const LABELS = ['tree roots', 'joint', 'crack', 'broken section', 'belly', 'water', 'corrosion', 'scale', 'buildup', 'camera',
  'debris', 'cleaning', 're-scope', 'cleanout'];
const SIBLINGS = ['sewer-line-belly-found-inspection', 'why-cast-iron-pipes-corrode', 'orangeburg-pipe-collapse', 'home-inspection-include-septic-system'];
const STOP =
  'Read 2026-11-22: shown on Google or Bing for at least one sewer-scope search, or the diagram shown in Google Images. ' +
  'If neither, fold the material into #335 and #300 (owner OK first).';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'sewer scope',
  capture: '2026-10-18-demand-sewer-scope-bing',
  intent: 'informational',
  who: 'a buyer with an inspection period running who is deciding whether to book a sewer scope or has just got one back',
  want: 'what the camera can actually show, what it cannot prove, and what each kind of finding should lead to',
  achieve: 'to turn a scope result into a priced repair question for the seller, or a second look, before the deadline',
  titlePromise: 'four things a sewer scope can reveal before buying a house',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'What will a sewer scope tell me about this house, what can it miss, and what do I do with each finding?',
  firstScreen: 'The opening says what a scope is, that it is booked separately, the through-1973 trigger and the $300-$500 cost from our engine, then that the page shows where the video stops.',
  firstParty: [
    { what: 'A drawn cutaway of four conditions along one lateral, built from the report descriptions, CC BY', source: 'public/images/sewer-scope-four-findings-cutaway.webp' },
    { what: 'Scope trigger year, scope cost and repair ranges from our report engine', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'Bing evidence that buyers ask whether a scope is worth it', source: 'data/keywords/2026-10-18-demand-sewer-scope-bing.json' },
  ],
  evidenceOfWork: [
    'diagram public/images/sewer-scope-four-findings-cutaway.webp drawn in scripts/render-guide-diagrams.py',
    'visible "How we checked this" section naming the report, the city form and the 2005 code list caveat',
    'ledger data/fact-ledgers/sewer-scope-before-buying-house.json quoting each limit',
  ],
  beyondCommonFacts: [
    'Fine cracks may not show on camera but leak when groundwater rises (WERF 2006)',
    'A camera finds active leaks and only possibly old ones; a pressure test finds both',
    'One Oregon city found cleaning necessary in about 90% of laterals before a camera could inspect them',
    'Severely corroded pipe can be narrowed so far that normal cleaning will not let the camera pass',
    'Defect codes score a fine root at a joint 1 and a root ball 4; soil-visible breaks and collapses 5',
    'San Mateo grades sags 3, 4 or 5 by severity on its lateral form',
  ],
  reproducibilityCheck: 'Top results list roots, cracks, bellies and corrosion as things a scope finds. They do not pair each with what the camera cannot establish, cite the research on missed fine cracks and leak detection, give the cleaning and access limits with numbers, or show the defect scores.',
  discussion: 'needed',
  discussionReason: 'Each finding leads to a different next step (cleaning and re-scope, a repair quote, a second test method, a repair method that suits a sag), and the reader has to weigh which applies before the inspection deadline.',
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

  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== OWNER_TITLE) fail('title is not the owner\'s exact title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('non-question title carries a quick answer');
  if (guideTopic(SLUG, title) !== 'plumbing') fail(`topic ${guideTopic(SLUG, title)}, expected plumbing`);
  if (!body.includes(`](${IMAGE})`)) fail('diagram not in the body');
  if (!fs.existsSync(path.join(process.cwd(), 'public', IMAGE))) fail('diagram not rendered');
  const missing = LABELS.filter((l) => !new RegExp(l.replace(/[-\s]/g, '[-\\s]'), 'i').test(body.replace(/!\[[^\]]*\]\([^)]*\)/g, '')));
  if (missing.length) fail(`diagram draws ${missing.join(', ')} but the prose never says it`);
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick: none (non-question title)\n    body  ${body.split(/\s+/).length} words`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
