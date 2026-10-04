// Publish "Accela Citizen Access: How to Search Permits by Address".
//
//   npx tsx scripts/publish-accela-citizen-access-permit-search.ts            # dry run
//   APPLY=true npx tsx scripts/publish-accela-citizen-access-permit-search.ts
//
// A RESEARCH-COUNCIL DECISION (2026-10-04), the adjacent bet in that plan.
//   Finding: county permit guides win on PERMIT-PORTAL NAME searches ("idis los angeles", "eps portal
//   miami dade", "citizen self service portal"), not on "permit search by address". Bing's own counts
//   (capture 2026-10-04-demand-accela-bing, relative only) rank platform phrasings -- "accela citizen
//   access", "city of tampa accela", "pasco county accela" -- far above generic ones. Tier 1: this
//   site already shows for "accela city of san diego" and several "citizen access" queries.
//   Job (Christensen): search this platform by address and read the result -- no single county page
//   does that job, so this is a new page, not a template of one.
//   Scent (Pirolli & Card): "accela login" searchers want to log in; the title promises searching by
//   address, which is what this page delivers.
//   Links (Page & Brin): seven published guides already name Accela; four are linked from here and
//   inbound anchors are added separately.
//
// Verification, all read 2026-10-04:
//   - City of Tampa portal (aca-prod.accela.com/TAMPA/): front-page text "many functions can be used
//     without a log-in"; Building > Search Applications opens "Search for Records"; search types
//     General Search / Search by Address / by Licensed Professional Information / by Record Information
//     / for Trade Name / by Contact; address boxes Street No., Street Name, Street Type, Direction,
//     Unit No., Unit Type, Parcel No.; License Type and State License Number fields; General Search
//     start/end defaulted to 10/04/2025-10/04/2026; Enforcement section for code violations.
//   - City of Fort Worth (aca-prod.accela.com/CFW/): "Online Permitting System"; same six search types;
//     default start 10/05/2021 (five years).
//   - Pasco County (aca-prod.accela.com/PASCO/): "PascoGateway permitting site".
//   - Fla. Stat. 119.07(1)(a), flsenate.gov 2025: quoted verbatim.
//   - Santa Clara, Broward/LauderBuild, San Bernardino EZ Online Permitting, Hillsborough/HillsGovHub
//     facts are as already published (and verified) in those county guides.
// NOT done: no search was submitted on any city portal, so no record-status vocabulary is asserted --
//   the page says statuses are set per agency. No count of agencies using Accela is claimed.
// Read: 2026-11-09. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'accela-citizen-access-permit-search',
  targetQuery: 'accela citizen access',
  capture: '2026-10-04-demand-accela-bing',
  intent: 'informational',
  who: 'a buyer whose agent said to check the permits, who has landed on a city portal at aca-prod.accela.com and found nothing',
  want: 'how to search that portal by address without an account, and why an older permit is not showing',
  achieve: 'to find the permits on file for the house, or know for sure which office or records request to try next',
  titlePromise: 'how to search any Accela Citizen Access portal by address and read the records it returns',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-09): at least 20 Google impressions for an Accela or citizen-access search. ' +
    'If not, do not write the eTRAKiT or Tyler EnerGov platform guides; fold the date-range tip into the county guides that use Accela.',
};

const TITLE = 'Accela Citizen Access: How to Search Permits by Address';
const META = 'Search an Accela Citizen Access permit portal by address without an account, widen the date range that hides older permits, and read the result.';
const QUICK_ANSWER =
  'Accela Citizen Access is the public permit portal cities and counties run on Accela software; its web address starts ' +
  'with aca-prod.accela.com. No account is needed: open the Building or Permits tab, choose its search, pick Search by Address ' +
  'and enter the street number and name. Move the start date back first: the form defaults to a window as short as 12 months.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'accela-citizen-access-permit-search.md');

const REQUIRED = ['aca-prod.accela.com', 'Search for Records', 'Search by Address', 'Parcel No.', '119.07(1)(a)', 'last 12 months',
  'last five years', 'PascoGateway', 'HillsGovHub', '/guides/look-up-building-permits-by-address/'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have)/i,
  /\bcolour|labelled|recognise|licence\b/i, /most people miss/i,
];
// Not a template of the county guides it links to: the closest one may share only a little phrasing.
const COUNTY_LINKED = ['check-building-permits-hillsborough-county-fl', 'check-building-permits-tarrant-county-tx',
  'check-building-permits-san-diego-county-ca', 'check-building-permits-santa-clara-county-ca'];
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
  if (topic !== 'permits') fail(`cluster "${topic}"`);
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
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, inbound links, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
