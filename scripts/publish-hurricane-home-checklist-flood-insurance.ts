// Publish "Hurricane Isaias Home Checklist: 10 Things to Check" (owner request, 2026-10-09).
//
//   npx tsx scripts/publish-hurricane-home-checklist-flood-insurance.ts            # dry run
//   APPLY=true npx tsx scripts/publish-hurricane-home-checklist-flood-insurance.ts
//
// Companion to hurricane-flood-insurance-gulf-coast-homebuyers (#327, buyers). This one is for people
// in a house as the storm arrives. SAFETY FIRST is enforced below: the quick answer and the opening
// must tell anyone under an evacuation order to leave, and every safety instruction is a quoted
// official source (Ready.gov, last updated 09/24/2026; Florida Division of Emergency Management;
// Mississippi Insurance Department). Nothing is advice of our own beyond "only if it is safe".
//
// The owner's brief cited "Florida Department of Health's October 9 guidance" (a week of supplies,
// evacuation zone, documents). NOT VERIFIED: floridahealth.gov returned a Cloudflare block (not worked
// around), and the only "Isaias" DOH item search found was from the 2020 storm of the same name. So the
// page attributes nothing to DOH. The owner's meta said "12" details for a 10-item list; fixed to 10.
// Slug carries no storm name, so the page can be de-dated later without moving the URL.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'hurricane-home-checklist-flood-insurance';

// Every fact the page states, with the source's own words. Every number in the article must appear
// in one of these quotes (checked below), so a figure typed from memory stops the publish.
const FACTS: Array<{ claim: string; quote: string; url: string; method: string }> = [
  { claim: 'Isaias advisory', method: 'NHC text product (curl of index-at.xml)', url: 'https://www.nhc.noaa.gov/text/refresh/MIATCPAT4+shtml/091453.shtml',
    quote: 'Hurricane Isaias Advisory Number 12 ... 1000 AM CDT Fri Oct 09 2026 ...CENTER OF ISAIAS EXPECTED TO REACH THE WESTERN FLORIDA PANHANDLE COAST THIS EVENING... MAXIMUM SUSTAINED WINDS...120 MPH ... A Storm Surge Warning is in effect for... * Mouth of the Mississippi River to the Suwannee River A Hurricane Warning is in effect for... * Ocean Springs, MS to the Bay/Gulf County Line, FL. Update 720 AM CDT: ISAIAS BECOMES A MAJOR HURRICANE' },
  { claim: 'GAO report, date and number', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'FLOOD INSURANCE: Congressional Action Could Help Increase Coverage for At-Risk Properties GAO-27-108012. Published: Oct 01, 2026. Letter October 1, 2026' },
  { claim: 'GAO: maps miss rainfall; 13 million', method: 'curl of files.gao.gov', url: 'https://files.gao.gov/reports/GAO-27-108012/index.html',
    quote: 'FEMA maps likely do not designate some high-risk properties as being in an SFHA because the maps account for coastal and riverine flood risk but generally do not consider heavy rainfall flood risk. ... the FEMA maps used to determine the requirement do not capture all flood risks, especially heavy rainfall. GAO\'s analysis of First Street data indicates that about 13 million high-risk properties are outside FEMA SFHAs.' },
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
    quote: 'dwelling limit $300,000: 2 percent = $6,000; 10 percent = $30,000. dwelling limit $250,000: 2 percent = $5,000' },
  { claim: 'Mississippi deductible advice', method: 'curl of mid.ms.gov consumer hurricane checklist', url: 'https://www.mid.ms.gov/mississippi-insurance-department/consumers/consumer-hurricane-checklist/',
    quote: 'You should check the deductible amount contained in your policy. Several large insurers writing coverage on the Gulf Coast have implemented deductibles as high as two percent of the value of the covered dwelling for perils such as wind and hurricane.' },
  { claim: 'Report flood item and seller question', method: 'server.ts f_flood; src/engine/sellerQuestions.ts flood_history_seller', url: '/',
    quote: "status: 'NOT YET VERIFIED' ... Look up the official flood zone yourself at the FEMA Flood Map Service Center ... Has the property ever flooded, or had a water-damage insurance claim filed?" },
  { claim: 'Ready.gov hurricane guidance', method: 'curl of ready.gov/hurricanes (Last Updated: 09/24/2026)', url: 'https://www.ready.gov/hurricanes',
    quote: 'If you live in a mandatory evacuation zone and local officials tell you to evacuate, do so immediately. ... Follow the instructions from local emergency managers ... Make sure your insurance policies and personal documents, such as ID, are up to date. Make copies and keep them in a secure password-protected digital space. Strengthen your Home De-clutter drains and gutters, bring in outside furniture and consider hurricane shutters. ... Do not touch electrical equipment if it is wet or if you are standing in water. If it is safe to do so, turn off electricity at the main breaker or fuse box to prevent electric shock. Do not wade in flood water, which can contain dangerous pathogens that cause illnesses. This water also can contain debris, chemicals, waste and wildlife. Underground or downed power lines can electrically charge the water. ... People with asthma and other lung conditions and/or immune suppression should not enter buildings with indoor water leaks or mold growth that can be seen or smelled ... Document any property damage with photographs. Contact your insurance company for assistance.' },
  { claim: 'Florida evacuation zones', method: 'curl of floridadisaster.org', url: 'https://www.floridadisaster.org/knowyourzone/',
    quote: 'Every year it is important for residents to know if they live an evacuation zone, a low-lying, flood prone area, a mobile home or an unsafe structure during hurricane season. These areas and buildings are most likely to be evacuated and knowing these zones helps Floridians prepare to evacuate and better understand orders from local officials. ... View Active Evacuation Orders at FloridaDisaster.org/Evacuation-Orders Find Your Evacuation Zone at FloridaDisaster.org/Know' },
  { claim: 'Mississippi checklist: inventory, photos, records, ALE, wind vs flood, after the storm', method: 'curl of mid.ms.gov', url: 'https://www.mid.ms.gov/mississippi-insurance-department/consumers/consumer-hurricane-checklist/',
    quote: 'Record and update an inventory of all personal belongings. Make photos, and, if possible, a videotape showing your possessions. Record insurance policy information. ... Having a well-documented inventory will help you get an accurate insurance settlement ... Find out whether your policy will pay for "additional living expenses" ... policies do not cover flood damage caused by rising water ... Standard homeowners policies usually cover windstorm damage directly caused by wind or hail. ... Report any damage to your home or property to your insurance agent as soon as possible. Keep track of the special reference number for your claim' },
];

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'hurricane home checklist',
  capture: '2026-10-09-demand-outside-flood-zone-flood-bing',
  intent: 'informational',
  who: 'a Gulf Coast homeowner or renter in the Isaias warning area who is not under an evacuation order and has a few hours before conditions worsen',
  want: 'the property and insurance checks that standard storm-prep lists leave out, without being told to stay put for them',
  achieve: 'to leave or ride out the storm with photos, deductibles, flood coverage and records in hand, and to know what not to touch afterwards',
  titlePromise: 'ten home, flood-risk and insurance checks to make before and after Hurricane Isaias, with official guidance first',
  stopCondition:
    'Read 2026-11-13: shown on Google or Bing for at least one hurricane-checklist or storm-insurance search. ' +
    'After landfall, de-date the opening within days; if never shown by the read date, retitle as a general hurricane home checklist (slug unchanged).',
};

const OVERLAP_WITH = ['hurricane-flood-insurance-gulf-coast-homebuyers', 'flood-zone-by-address', 'homeowners-insurance-cover-failed-sump-pump', 'prove-roof-age-for-insurance'];
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
  // Safety first: the quick answer and the opening must send anyone under an order to evacuate.
  if (!/evacuate, Ready\.gov says to do so immediately/.test(QUICK)) fail('quick answer lost the evacuate-first line');
  if (!body.includes('nhc.noaa.gov')) fail('NHC not linked');
  if (!/do so immediately/.test(opening) || !/stop reading and follow your local officials/.test(opening)) fail('opening lost the evacuate-first instruction');
  for (const s of ['only if it is safe', 'if it is safe to do so']) if (!body.toLowerCase().includes(s)) fail(`missing safety qualifier: ${s}`);
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
