// Publish "Electrical Panel Brand: How to Tell FPE, Zinsco & Pushmatic".
//
//   npx tsx scripts/publish-identify-electrical-panel-brand.ts            # dry run
//   APPLY=true npx tsx scripts/publish-identify-electrical-panel-brand.ts
//
// Third of the four homepage-cutaway guides ("Which electrical panel is it?"), in the 2026-10-04
// research-council plan; electrical is the second-strongest cluster (115 impressions/page/28d). The
// library has brand pages (FPE, Zinsco) but nothing that tells a buyer how to identify the panel in
// front of them. The Challenger page was pruned 2026-09-02, yet Bing still shows this site for
// Challenger-panel searches; this page covers Challenger identification.
//
// Evidence: 2026-10-05-demand-federal-pacific-panel-{gsc,bing}. Tier 1 WEAK: zinsco panel (pos 5.3),
// several Challenger queries on Bing; Bing counts "zinsco electrical panel" well above the rest.
//
// Verification, all read 2026-10-05 in the browser at cpsc.gov (curl gets 403; no bot check bypassed):
//   - CPSC release 83-008 (1983, revised 2011): investigation closed; testing confirmed FPE breakers fail
//     certain UL calibration tests; closed "without making a determination as to the safety".
//   - CPSC recall 88-095: Challenger HAGF-15 / HAGF-20 GFCI breakers made 1988-02-22 to 1988-04-29; a part
//     may detach and stop the ground-fault feature; "normal circuit breaker functions are not affected".
//   - CPSC recall 88-091: I-T-E load centers; date code "marked on the top of the wiring diagram label
//     inside the door which is opened to reset the circuit breakers" (quoted).
//   - ASHI SoP 2026 section 8.1: inspect interior components of load centers; describe amperage and
//     voltage, location of main disconnect(s), type of overcurrent devices -- brand is not listed.
//   - Eras and replacement cost: PRIORITY_RULES electrical_panel_brand, asserted below.
// From secondary sources only, so kept to what is visible: Pushmatic push-button breakers; split-bus
//   "no single main". CUT: hazard claims about Pushmatic, the NEC "rule of six" section number, any
//   insurer claim, Zinsco/Sylvania ownership history.
// Read: 2026-11-09. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'identify-electrical-panel-brand',
  targetQuery: 'zinsco electrical panel',
  capture: '2026-10-05-demand-federal-pacific-panel-bing',
  intent: 'informational',
  who: 'a buyer at a showing of a 1960s or 1970s house, standing in front of the breaker panel with the door open',
  want: 'how to read the brand and model off the panel safely, and what names like Federal Pacific, Zinsco or Pushmatic mean',
  achieve: 'to get the panel identified in the inspection report and an answer from their own insurer before the inspection period ends',
  titlePromise: 'how to tell which brand of electrical panel a house has, from the label and the breakers',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-09): shown on Google or Bing for at least one panel-brand search. If not, ' +
    'fold the identification section into federal-pacific-stab-lok-panel-inspectors-flag and 301 this URL to it.',
};

const TITLE = 'Electrical Panel Brand: How to Tell FPE, Zinsco & Pushmatic';
const META = 'Find an electrical panel brand from the label inside the door and the breakers, what FPE, Zinsco, Challenger and Pushmatic mean, and what to ask.';
const QUICK_ANSWER =
  'Open the panel door, not the inner cover, and read the label printed inside it: the maker, the model and the rating. Photograph ' +
  'it with the breakers. Federal Pacific (Stab-Lok), Zinsco and Challenger are named on the label; Pushmatic breakers are push ' +
  'buttons, not toggles. Then ask your inspector to record the brand and model in writing: the ASHI inspection standard does not list it.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'identify-electrical-panel-brand.md');

const REQUIRED = ['83-008', 'HAGF-15', 'HAGF-20', 'February 22 and April 29, 1988', 'section 8.1', 'wiring diagram label inside the door',
  '/guides/federal-pacific-stab-lok-panel-inspectors-flag/', '/guides/will-zinsco-panel-fail-4-point-inspection/'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have)/i,
  /\bcolour|labelled|recognise|licence\b/i, /deadly|alarming|death ?trap|ticking/i,
];
const COUNTY_LINKED = ['federal-pacific-stab-lok-panel-inspectors-flag', 'will-zinsco-panel-fail-4-point-inspection', '100-amp-service-enough-house-re-buying', 'get-home-insurance-fuse-box'];
const OVERLAP_MAX = 0.08;

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const h1 = raw.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (h1 !== TITLE) fail(`markdown H1 "${h1}" does not match TITLE`);
  const body = raw.replace(/^#\s.*\n+/, '').trim();
  if (TITLE.length > 60) fail(`title ${TITLE.length}`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length}`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length}`);
  const topic = guideTopic(BRIEF.slug, TITLE);
  if (topic !== 'electrical') fail(`cluster "${topic}"`);
  // Replacement cost and era must be the engine's, which is what a report for this house says.
  const pr = PRIORITY_RULES.find((p) => p.id === 'electrical_panel_brand');
  const cost = pr?.typicalRepairCost?.replace(/^Panel replacement /, '') ?? '';
  if (!pr || !cost || !body.includes(cost)) fail(`panel replacement cost "${cost}" not in body`);
  if (pr?.minYear !== 1950 || pr?.maxYear !== 1989 || !body.includes('1950 through 1989')) fail('panel era drifted');
  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const t of [body, QUICK_ANSWER, META]) { const m = t.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  if (/^#{2,3}\s+Step\s+\d/im.test(body)) fail('templated "Step N" heading');
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  const mine = trigrams(body);
  for (const s of COUNTY_LINKED) {
    const theirs = trigrams(published.get(s) ?? '');
    let shared = 0; mine.forEach((t) => { if (theirs.has(t)) shared++; });
    const ov = shared / mine.size;
    console.log(`    overlap with ${s}: ${(ov * 100).toFixed(1)}%`);
    if (ov > OVERLAP_MAX) fail(`overlap ${(ov * 100).toFixed(1)}% with ${s}`);
  }
  console.log(`\n  ${BRIEF.slug}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body}, ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, inbound links, homepage cutaway link, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
