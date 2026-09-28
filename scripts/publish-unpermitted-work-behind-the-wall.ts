// Publish "Unpermitted Work Behind the Wall: Spot It Before You Quote".
//
//   npx tsx scripts/publish-unpermitted-work-behind-the-wall.ts            # dry run
//   APPLY=true npx tsx scripts/publish-unpermitted-work-behind-the-wall.ts
//
// -----------------------------------------------------------------------------------------------
// WHO IT IS FOR. Contractors. The owner's call, 2026-09-28: trades buy the vendor ads and are the
// ones who cite the site (the first earned backlink was a Las Vegas plumber), so a guide written for
// the trade's own problem is on-audience. See memory beforeregret_contractors_are_audience.
//
// WHAT IT DELIBERATELY LEAVES OUT: every legal fact, consequence and implication -- no code
// sections, no liability, no reporting duties, no penalties. An earlier draft built on IRC chapter 1
// and California BPC 7110 was written, verified and then withdrawn on the owner's instruction. This
// one is craft only: what earlier DIY work looks like, how to read the house's record before
// quoting, how to price the unknown, and how to tell the homeowner. BANNED below keeps the legal
// vocabulary out, so a later edit cannot drift back into it.
//
// EVERY SIGN COMES FROM THE LIBRARY. The field signs are the ones two published guides already
// describe -- amateur-workmanship-mean-home-inspection-report and
// evidence-prior-repair-mean-home-inspection-report -- restated for the person holding the tools.
// The cost ranges are read from PRIORITY_RULES at run time, the same strings the property report
// prints, never retyped.
//
// THE EVIDENCE IS OBSERVED, NOT MEASURED. Paid volume data was retired 2026-09-27; first-party data
// found nothing for the contractor phrasings, so three US Google results pages (gl=us) were read on
// 2026-09-28 and recorded as data/keywords/2026-09-28-observed-what-happens-if-an-inspector-finds-unper.json.
// Observed evidence means this is an experiment, so the brief carries a stop condition.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'unpermitted-work-behind-the-wall',
  targetQuery: 'contractor found unpermitted work',
  capture: '2026-09-28-observed-what-happens-if-an-inspector-finds-unper',
  intent: 'informational',
  who: 'an electrician, plumber or remodeler walking a house to quote a job, who suspects a previous owner did their own work behind the walls',
  want: 'which visible signs mean there is DIY work hidden behind the drywall, and what to do when they open a wall and find it',
  achieve: 'to price the job so a hidden surprise does not wipe out the margin, and to tell the homeowner without losing the job',
  titlePromise: 'the signs of hidden DIY work a contractor can spot at the estimate, before the wall is opened',
  stopCondition:
    'By 2026-12-27 (90 days): shown by Google or Bing for at least one contractor-side query, OR cited by at least one trade site ' +
    '(scripts/backlink-watch.ts). If neither, fold the field-sign list into amateur-workmanship-mean-home-inspection-report and 301 this URL there.',
};

const TITLE = 'Unpermitted Work Behind the Wall: Spot It Before You Quote';
const META =
  'The signs of a previous owner\'s DIY wiring and plumbing you can see at the estimate, how to price the unknown, and how to tell the homeowner.';
const QUICK_ANSWER =
  'Generally, you can see it coming. Uncovered junction boxes, wire nuts on loose attic runs, push-fit couplers on old drain pipe and a ' +
  'finished basement with no permit on record all point to more of the same behind the drywall. Check the permit history before you ' +
  'quote, tell the homeowner up front that anything you find will be priced separately, and photograph it before you touch it.';
const SOURCES = ['CPSC'];
const SRC_MD = path.join(process.cwd(), 'guides', 'unpermitted-work-behind-the-wall.md');

// "Partial to whole-home rewire $8,000 – $30,000+" -> "partial to whole-home rewire at $8,000 – $30,000+"
function costPhrase(ruleId: string): { label: string; range: string } {
  const rule = PRIORITY_RULES.find((r) => r.id === ruleId);
  const text = rule?.typicalRepairCost;
  if (!text) throw new Error(`ABORT: PRIORITY_RULES has no typicalRepairCost for ${ruleId}`);
  const i = text.indexOf('$');
  if (i < 0) throw new Error(`ABORT: no $ figure in ${ruleId}: "${text}"`);
  const label = text.slice(0, i).trim();
  return { label: label.charAt(0).toLowerCase() + label.slice(1), range: text.slice(i).trim() };
}

function fill(md: string): string {
  const al = costPhrase('electrical_aluminum_wiring');
  const knt = costPhrase('knob_and_tube');
  const galv = costPhrase('galvanized_supply');
  const tokens: Record<string, string> = {
    AL_COST: al.range,
    KNT_COST_LOWER: `${knt.label} at ${knt.range}`,
    GALV_COST_LOWER: `${galv.label} at ${galv.range}`,
  };
  const out = md.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => tokens[k] ?? m);
  const left = out.match(/\{\{[^}]+\}\}/g);
  if (left) throw new Error(`ABORT: unresolved token(s) ${left.join(', ')}`);
  return out;
}

// The load-bearing pieces the body must keep.
const REQUIRED = ['[CPSC]', 'PB2110', 'dielectric union', '/guides/look-up-building-permits-by-address/', 'change order', 'Photograph'];
// Legal vocabulary is out by instruction; the rest are the site's content rules.
const BANNED = [
  /\b(liab\w*|lawsuit|sue|illegal|unlawful|violat\w*|penalt\w*|fine[sd]?\b|license (board|discipline)|IRC|NEC\b|building code|statute|legal)\b/i,
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\bmost (contractors|homeowners|houses)\b/i,
];

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };

  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const h1 = raw.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (h1 !== TITLE) fail(`markdown H1 "${h1}" does not match TITLE`);
  const body = fill(raw.replace(/^#\s.*\n+/, '').trim());

  if (TITLE.length > 60) fail(`title ${TITLE.length} chars, over 60`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length} chars, outside 70-155`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length} chars, outside 120-450`);
  if (!/^(Generally|No|Yes|It can)\b/.test(QUICK_ANSWER)) fail('quick_answer does not open with a verdict');
  const topic = guideTopic(`${BRIEF.slug} ${TITLE}`);
  if (topic !== 'permits') fail(`cluster resolved to "${topic}", expected permits`);
  if (!/\$[\d,]{3,}/.test(body)) fail('no cost figure in body (reproducibility rule)');

  for (const r of REQUIRED) if (!body.includes(r)) fail(`body is missing required "${r}"`);
  for (const b of BANNED) for (const [name, text] of [['body', body], ['quick_answer', QUICK_ANSWER], ['meta', META], ['title', TITLE]] as const) {
    const m = text.match(b);
    if (m) fail(`banned "${m[0]}" in ${name}`);
  }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  if (/```/.test(body)) fail('code fence in body');

  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail(`slug ${BRIEF.slug} already exists`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead guide link: ${m[1]}`);

  console.log(`\n  ${BRIEF.slug}  [${topic}]`);
  console.log(`    title (${TITLE.length})  ${TITLE}`);
  console.log(`    meta  (${META.length})  ${META}`);
  console.log(`    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}`);
  console.log(`    body  ${body.split(/\s+/).length} words, ${(body.match(/\]\(\/guides\//g) || []).length} guide links`);
  for (const line of body.split('\n').filter((l) => /\$\d/.test(l))) console.log(`    cost  ${line.slice(0, 260)}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass. Re-run with APPLY=true.\n'); return; }

  // Inserted as published. The build will not pass until the guide carries FAQs (FAQPage is required
  // guide schema): run the article-faqs skill next, then add the keyword to src/seo/targetKeywords.ts.
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown,
                          sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body},
            ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, then targetKeywords.ts, then npm run build\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
