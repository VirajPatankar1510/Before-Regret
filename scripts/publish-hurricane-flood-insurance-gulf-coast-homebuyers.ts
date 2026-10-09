// Publish "Hurricane Isaias: Flood Risk and Insurance for Gulf Buyers" (owner request, 2026-10-09).
//
//   npx tsx scripts/publish-hurricane-flood-insurance-gulf-coast-homebuyers.ts            # dry run
//   APPLY=true npx tsx scripts/publish-hurricane-flood-insurance-gulf-coast-homebuyers.ts
//
// A news-hooked evergreen guide. The SLUG carries no storm name on purpose: a slug never changes,
// and the title and opening can be updated once Isaias has passed without moving the URL.
//
// Evidence: tier 3 -- no first-party signal for any of six candidate phrasings (capture
// 2026-10-09-demand-outside-flood-zone-flood-*). Published as an experiment; stop condition below.
//
// The outside brief that suggested this article (pasted by the owner) was treated as unverified.
// Everything stated was read at its primary source on 2026-10-09 -- see FACTS. Cut: Florida CFO's
// disaster checklist (PDF would not download; site refused the browser), FloodSmart pages (Cloudflare
// bot check -- not worked around), Tennessee assessment glossary (403), "many states require flood
// disclosure" (not verified), any claim that a percentage deductible is typical.
//
// Overlap, checked: flood-zone-by-address (#322) owns "how to look up a zone" and "outside the zone
// still floods"; this page answers those in two paragraphs and LINKS to it, and spends its length on
// what no page covered -- insurance during a live storm, wind vs flood, hurricane deductibles.
//
// Carrier rule: no insurer is named beside an underwriting verb. TWIA is named only inside the Texas
// Department of Insurance's own quoted sentence, and as an example of a wind policy.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'hurricane-flood-insurance-gulf-coast-homebuyers';

// Every fact the page states, with the source's own words. Every number in the article must appear
// in one of these quotes (checked below), so a figure typed from memory stops the publish.
const FACTS: Array<{ claim: string; quote: string; url: string; method: string }> = [
  { claim: 'Isaias advisory', method: 'NHC text product (curl of index-at.xml)', url: 'https://www.nhc.noaa.gov/text/refresh/MIATCPAT4+shtml/091453.shtml',
    quote: 'Hurricane Isaias Advisory Number 12 ... 1000 AM CDT Fri Oct 09 2026 ...CENTER OF ISAIAS EXPECTED TO REACH THE WESTERN FLORIDA PANHANDLE COAST THIS EVENING... MAXIMUM SUSTAINED WINDS...120 MPH ... A Storm Surge Warning is in effect for... * Mouth of the Mississippi River to the Suwannee River A Hurricane Warning is in effect for... * Ocean Springs, MS to the Bay/Gulf County Line, FL. Update 720 AM CDT: ISAIAS BECOMES A MAJOR HURRICANE' },
  { claim: 'GAO report, date and number', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'FLOOD INSURANCE: Congressional Action Could Help Increase Coverage for At-Risk Properties GAO-27-108012. Published: Oct 01, 2026. Letter October 1, 2026' },
  { claim: 'GAO: maps miss rainfall; 13 million', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'the FEMA maps used to determine the requirement do not capture all flood risks, especially heavy rainfall. GAO\'s analysis of First Street data indicates that about 13 million high-risk properties are outside FEMA SFHAs.' },
  { claim: 'GAO: high risk = First Street 4-10', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'Table 1: Properties by First Street Flood Risk Category and SFHA Status ... 4–10 (high risk) ... First Street classifies flood risk using a flood score ranging from 1 (minimal) to 10 (extreme)' },
  { claim: 'GAO: 86 percent; private 14 percent in 2025; mandatory purchase', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'As of April 2026, 86 percent of high-risk properties did not have National Flood Insurance Program (NFIP) coverage. ... private policies accounted for 14 percent of all policies in 2025. Federal law requires property owners with federally backed mortgages to purchase flood insurance if their property is in a special flood hazard area (SFHA)' },
  { claim: 'GAO: misperception that homeowners covers flood', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'Consumer misperceptions also can discourage flood insurance purchase. Consumers may ... believe that homeowners insurance covers flood damage when most policies specifically exclude it.' },
  { claim: 'Outside the Zone 26.6%', method: 'site study figures file', url: '/research/outside-the-zone/',
    quote: 'docs/data/flood-outside-zone.json national.shareCount 26.6 (claims classifiable by zone, policy rated outside the high-risk zone)' },
  { claim: 'FEMA: homeowners does not cover flood; 30-day wait and exceptions', method: 'browser, fema.gov/flood-insurance', url: 'https://www.fema.gov/flood-insurance',
    quote: 'Floods can happen anywhere. Most homeowners insurance does not cover flood damage. Flood insurance is a separate policy ... Plan ahead as there is typically a 30-day waiting period for an NFIP policy to go into effect, unless the coverage is mandated it is purchased as required by a government backed lender or is related to a community flood map change.' },
  { claim: 'TDI: moratorium; 30 days unless new home', method: 'curl of tdi.texas.gov, blog dated September 5, 2025', url: 'https://www.tdi.texas.gov/blog/when-storm-enters-gulf-its-too-late-to-ask-do-i-have-enough-insurance.html',
    quote: 'Once a named storm enters the gulf, most insurance companies, including the Texas Windstorm Insurance Association (TWIA), stop selling new policies or making changes to existing ones. ... unless you\'re buying coverage for a new home, these policies don\'t go into effect until 30 days after you buy them.' },
  { claim: 'Florida Statutes 627.701 deductible offers and bold notice', method: 'curl of flsenate.gov, 2026 statutes', url: 'https://www.flsenate.gov/Laws/Statutes/2026/627.701',
    quote: '627.701 (3)(a) prior to issuing a personal lines residential property insurance policy, the insurer must offer alternative deductible amounts applicable to hurricane losses equal to $500, 2 percent, 5 percent, and 10 percent of the policy dwelling limits ... (4)(a) Any policy that contains a separate hurricane deductible must on its face include in boldfaced type ... "THIS POLICY CONTAINS A SEPARATE DEDUCTIBLE FOR HURRICANE LOSSES, WHICH MAY RESULT IN HIGH OUT-OF-POCKET EXPENSES TO YOU."' },
  { claim: 'Worked example (arithmetic on the statute percentages)', method: 'computed', url: '',
    quote: 'dwelling limit $300,000: 2 percent = $6,000; 10 percent = $30,000' },
  { claim: 'Mississippi deductible advice', method: 'curl of mid.ms.gov consumer hurricane checklist', url: 'https://www.mid.ms.gov/mississippi-insurance-department/consumers/consumer-hurricane-checklist/',
    quote: 'You should check the deductible amount contained in your policy. Several large insurers writing coverage on the Gulf Coast have implemented deductibles as high as two percent of the value of the covered dwelling for perils such as wind and hurricane.' },
  { claim: 'Report flood item and seller question', method: 'server.ts f_flood; src/engine/sellerQuestions.ts flood_history_seller', url: '/',
    quote: "status: 'NOT YET VERIFIED' ... Look up the official flood zone yourself at the FEMA Flood Map Service Center ... Has the property ever flooded, or had a water-damage insurance claim filed?" },
];

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'does homeowners insurance cover hurricane flooding',
  capture: '2026-10-09-demand-outside-flood-zone-flood-bing',
  intent: 'informational',
  who: 'a buyer under contract on a Gulf Coast house in the week a hurricane is in the Gulf, who has not yet bound insurance',
  want: 'whether the flood zone and a homeowners policy protect them, and what a storm does to buying insurance before closing',
  achieve: 'to get homeowners, wind and flood coverage quoted and bound in writing, with the hurricane deductible in dollars, before the inspection deadline',
  titlePromise: 'what Gulf Coast buyers should know about flood risk and insurance while Hurricane Isaias is in the Gulf',
  stopCondition:
    'Read 2026-11-13: shown on Google or Bing for at least one flood-insurance, hurricane-deductible or flood-zone search. ' +
    'If not, retitle without the storm name (slug unchanged) and fold nothing; if it is shown only for flood-zone searches, check it is not taking them from flood-zone-by-address.',
};

const OVERLAP_WITH = ['flood-zone-by-address', 'homeowners-insurance-cover-failed-sump-pump', 'get-clue-report-before-buying-house', 'get-home-insurance-flat-roof'];
const OVERLAP_MAX = 0.08;
const trigrams = (t: string) => { const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`)); };

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${SLUG}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => front[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))![1].trim();
  const META = field('meta'), QUICK = field('quick');
  const rest = raw.slice(front[0].length);
  const TITLE = rest.match(/^#\s+(.*)$/m)![1].trim();
  const body = rest.replace(/^#\s.*\n+/, '').trim();

  if (TITLE.length > 60) fail(`title ${TITLE.length} chars`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length} chars`);
  if (QUICK.length < 120 || QUICK.length > 450) fail(`quick ${QUICK.length} chars`);
  const topic = guideTopic(SLUG, TITLE);
  if (topic !== 'insurance') fail(`cluster "${topic}" (expected insurance)`);

  // Every number on the page must appear in a FACTS quote.
  const factText = FACTS.map((f) => f.quote).join(' ');
  const pageText = `${TITLE} ${META} ${QUICK} ${body}`.replace(/\]\([^)]*\)/g, ']');
  // Trailing commas are punctuation ("October 9, 2026"), not part of the number.
  const nums = [...new Set((pageText.match(/\$?\d[\d,]*(?:\.\d+)?/g) || []).map((n) => n.replace(/,+$/, '')))];
  const missing = nums.filter((n) => !factText.includes(n.replace(/^\$/, '')) && !factText.includes(n));
  if (missing.length) fail(`numbers with no FACTS quote: ${missing.join(', ')}`);
  else console.log(`  ok   numbers: all ${nums.length} traced to FACTS`);

  // Carrier and tone rules.
  const banned: Array<[RegExp, string]> = [
    [/\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers Insurance|Nationwide|Travelers|Citizens Property|Universal Property|Heritage|Florida Peninsula)\b/i, 'named insurer'],
    [/\b(most|many|some) (insurers|carriers|lenders) (will|won't|refuse|require|decline|charge)/i, 'carrier generalisation outside a quoted regulator'],
    [/deadly|devastat|catastroph|nightmare|terrif|horror|panic/i, 'fear wording (owner: no fear-bait)'],
    [/\b(delve|furthermore|crucial|regulatory landscape|when it comes to|navigate the)\b/i, 'AI cliche'],
    [/read on|keep reading|we'll explain below/i, 'engagement bait'],
    [/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/, 'link nested in bold'],
  ];
  for (const [re, why] of banned) { const m = `${TITLE} ${META} ${QUICK} ${body}`.match(re); if (m) fail(`${why}: "${m[0]}"`); }
  // Intent: the official sources are linked in the opening, before the first heading.
  const opening = body.split(/\n## /)[0];
  for (const host of ['nhc.noaa.gov']) if (!opening.includes(host)) fail(`opening does not link ${host}`);
  if (!body.includes('gao.gov/products/gao-27-108012')) fail('GAO report not linked');
  if (!/Statutes § 627\.701/.test(body)) fail('Florida statute citation missing (reproducibility)');

  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const m of body.matchAll(/\]\(\/research\/([a-z0-9-]+)\/\)/g)) if (!fs.existsSync(path.join(process.cwd(), 'docs', `${m[1]}.html`))) fail(`dead research link ${m[1]}`);
  const mine = trigrams(body);
  for (const s of OVERLAP_WITH) {
    const theirs = trigrams(published.get(s) ?? ''); let shared = 0; mine.forEach((g) => { if (theirs.has(g)) shared++; });
    const ov = shared / mine.size; console.log(`    overlap with ${s}: ${(ov * 100).toFixed(1)}%`);
    if (ov > OVERLAP_MAX) fail(`overlap ${(ov * 100).toFixed(1)}% with ${s}`);
  }
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  console.log(`\n  ${SLUG}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK.length})  ${QUICK}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${TITLE}, ${META}, ${QUICK}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: quality gate, FAQs, inbound links, build, push, verify, IndexNow, memory\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
