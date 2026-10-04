// Publish "How to Tell How Old a Roof Is Before You Make an Offer".
//
//   npx tsx scripts/publish-how-to-tell-how-old-a-roof-is.ts            # dry run
//   APPLY=true npx tsx scripts/publish-how-to-tell-how-old-a-roof-is.ts
//
// THE OWNER'S REQUEST (2026-10-04): a page for each question in the homepage's "What a Listing Won't
// Tell You" cutaway. Checked first: five of the nine already have a guide doing exactly that job
// (sunlight tool, lead line, cast iron, foundation crack, permit lookup) and keep linking to it.
// Four do not; this is the first of the four (roof, pipes, panel, walls), published one at a time.
//
// NOT A DUPLICATE OF prove-roof-age-for-insurance. That guide is the paperwork route for proving an
// age to a carrier. This one is the buyer reading a roof on a showing -- material, layers, wear,
// attic, old listing photos -- plus what an inspector is and is not required to tell them. It links
// to that guide for the documents instead of repeating them.
//
// Evidence: 2026-10-04-demand-roof-age-{gsc,bing}. Tier 1 WEAK (Bing shows this site for five
// roof-age queries, 6 impressions); Bing market counts 0 = unknown. So this is an experiment.
//
// Verification, all read 2026-10-04:
//   - ASHI Standard of Practice (2026, homeinspector.org PDF): 6.1(B) describe type and material of
//     roofing; 6.3 not required to walk on roofs; 15.2(A)(2) not required to determine "the age,
//     life expectancy or remaining useful life of systems and components".
//   - IRC R908.3.1.1 and the Oklahoma (OUBCC) amendment, as quoted in the City of Norman, OK roofing
//     handout (normanok.gov PDF): no recover over two or more applications of any covering; OK adds no
//     additional asphalt layer over asphalt. Same handout: Norman requires no permit for roofing work.
//     codes.iccsafe.org itself answered 403 and was not worked around.
//   - Fla. Stat. 627.7011(5)(b)-(e), flsenate.gov 2025: under-15 rule, 15+ inspection and 5-year
//     useful-life rule, roof age = last date 100% of the surface was built or replaced, from 2022-07-01.
//   - Costs and service life read from PRIORITY_RULES roof_age, not retyped elsewhere.
// CUT as unverifiable: the Texas seller-disclosure roof line (statutes site renders by JavaScript,
//   TREC refused the connection), a dating rule for shingle styles, "Google Earth history" steps.
// Read: 2026-11-08. Stop condition below.

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
  slug: 'how-to-tell-how-old-a-roof-is',
  targetQuery: 'roof age',
  capture: '2026-10-04-demand-roof-age-bing',
  intent: 'informational',
  who: 'a buyer on a second showing of an older house whose listing says "newer roof" with nothing to back it up',
  want: 'clues they can check themselves on the visit, and which records actually put a date on the roof',
  achieve: 'to know before the inspection period ends whether the roof is near replacement, and price the offer accordingly',
  titlePromise: 'a way to judge a roof\'s age on a showing and confirm it with records before making an offer',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-08): shown on Google or Bing for at least one roof-age search. If not, fold ' +
    'the showing checklist into prove-roof-age-for-insurance and 301 this URL to it.',
};

const TITLE = 'How to Tell How Old a Roof Is Before You Make an Offer';
const META = "Judge a roof's age on a showing from its material, layers, wear and attic, then confirm it with the permit, the invoice and your inspector.";
const QUICK_ANSWER =
  'Check three things. On the showing: what the roof is made of, how many layers show at the edge, and wear such as loose ' +
  'granules, curled shingles or attic stains. On paper: a re-roofing permit where one was required, the contractor invoice ' +
  'and the warranty. Then ask your inspector for a remaining-life estimate; the ASHI standard does not require one, so ask.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'how-to-tell-how-old-a-roof-is.md');

const REQUIRED = ['R908.3.1.1', 'section 15.2', 'section 6.3', '627.7011(5)', '15 years', '5 years', 'Norman, Oklahoma',
  '/guides/prove-roof-age-for-insurance/', '/guides/look-up-building-permits-by-address/'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have)/i,
  /\bcolour\b/i,
];

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const h1 = raw.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (h1 !== TITLE) fail(`markdown H1 "${h1}" does not match TITLE`);
  const body = raw.replace(/^#\s.*\n+/, '').trim();
  // The cost and service-life figures must match the engine, which is what a report for this house says.
  const roof = PRIORITY_RULES.find((r) => r.id === 'roof_age');
  if (!roof) fail('roof_age rule missing');
  const cost = roof?.typicalRepairCost?.replace(/^Full replacement /, '') ?? '';
  if (!cost || !body.includes(cost)) fail(`engine replacement cost "${cost}" not in body`);
  if (!roof?.eraBasis.includes('15 to 25 years') || !body.includes('15 to 25 years')) fail('service life drifted from engine');
  if (TITLE.length > 60) fail(`title ${TITLE.length}`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length}`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length}`);
  const topic = guideTopic(BRIEF.slug, TITLE);
  if (topic !== 'roofing-exterior') fail(`cluster "${topic}"`);
  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const t of [body, QUICK_ANSWER, META]) { const m = t.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  console.log(`\n  ${BRIEF.slug}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body}, ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, inbound links, homepage cutaway link, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
