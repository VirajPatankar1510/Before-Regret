// Publish "Buying a Mobile Home: What to Check Before You Finance It".
//
//   npx tsx scripts/publish-buying-a-mobile-home.ts            # dry run
//   APPLY=true npx tsx scripts/publish-buying-a-mobile-home.ts
//
// A RESEARCH-COUNCIL DECISION (2026-10-02), executed through write-guide.
//   Segment (Moskowitz): manufactured/mobile-home buyers, a group the site had never served; two real
//     searches reached it anyway ("aluminum wiring insurance manufactured home" on Google; "gfi outlet
//     for mobile home ... pass inspection" on Bing, clicked).
//   Job (Christensen): can this home be financed and insured, and what do I check before offering.
//   Scent (Pirolli & Card): the measured Bing phrase is "mobile home insurance", mostly quote-shopping,
//     which this site cannot serve -- so the title promises the checks, not a quote.
//   Verification (Feynman): every rule is quoted from eCFR, read 2026-10-02 -- 24 CFR 3282.8 (the
//     June 15, 1976 line), 3280.11 (certification label), 3280.5 (data plate: date, label numbers,
//     roof/wind zones, coastal warning, shutters, accessory-structure loads), 203.43f (FHA
//     eligibility). hud.gov and the Texas insurance department could not be checked (Cloudflare /
//     page not found), so the page makes NO claim about what insurers do -- it tells the buyer what to
//     gather and to get a written answer from their own insurer.
//   Read (Deming): 2026-11-13. Stop condition below.
//   Exact wording: two gl=us results pages, opened in the in-app browser with the owner present, no
//     CAPTCHA (captures 2026-10-02-observed-*). "buying a mobile home" kept as the phrasing. The second
//     page ("mobile home financing requirements") listed "loans for mobile homes in parks" and "FHA
//     Title 1 manufactured home loan" -- which exposed a glance-test error in the draft: it implied FHA
//     cannot finance a park home. Title I can (24 CFR 201.21(e)(1), read on eCFR 2026-10-02), so the
//     FHA section now covers both programs and the quick answer says so.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'buying-a-mobile-home-what-to-check',
  targetQuery: 'buying a mobile home',
  capture: '2026-10-02-observed-buying-a-mobile-home',
  intent: 'informational',
  who: 'a buyer looking at a mobile or manufactured home for sale who has not yet made an offer and expects to need a loan and insurance',
  want: 'which plates, dates and paperwork decide whether this particular home can be financed and insured, and where to find them on a viewing',
  achieve: 'to find out before going under contract whether a loan and a policy are realistic for this home, instead of learning it after applying',
  titlePromise: 'the checks on a mobile home that decide financing and insurance, before you make an offer',
  stopCondition:
    'By 2026-11-13: shown on Google or Bing for at least one manufactured- or mobile-home search. If not, do not build a cluster -- ' +
    'fold the useful parts into get-home-insurance-aluminum-wiring and need-gfci-outlets-pass-home-inspection, and 301 this URL.',
};

const TITLE = 'Buying a Mobile Home: What to Check Before You Finance It';
const META = "Before you offer on a mobile home, find the HUD label and data plate, check the 1976 line, and read the federal FHA rules on land and foundation.";
const QUICK_ANSWER =
  'Start with the date and the plates. Homes produced on or after June 15, 1976 carry a federal certification label on each section and a data ' +
  'plate showing the build date and wind zone. An FHA mortgage on the home and land together needs that label, real-estate taxation and, ' +
  "for a newly placed home, a permanent foundation. A home on a rented park lot goes through FHA's separate Title I program instead.";
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'buying-a-mobile-home.md');

const REQUIRED = ['24 CFR 3282.8', '24 CFR 3280.11', '24 CFR 3280.5', '24 CFR 203.43f', '24 CFR 201.21', 'June 15, 1976', '1,500 feet', 'written answer'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline)/i,
];

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
  if (topic !== 'manufactured-housing') fail(`cluster "${topic}"`);
  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const t of [body, QUICK_ANSWER, META]) { const m = t.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  console.log(`\n  ${BRIEF.slug}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}\n    body  ${body.split(/\s+/).length} words`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body}, ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, targetKeywords, San Bernardino inbound link, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
