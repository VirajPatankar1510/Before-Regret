// Publish "Flood Zone by Address: Look It Up Before You Buy".
//
//   npx tsx scripts/publish-flood-zone-by-address.ts            # dry run
//   APPLY=true npx tsx scripts/publish-flood-zone-by-address.ts
//
// First of the new "look up a public record by address" guides in the 2026-10-07 council plan
// (owner: "work on something new"). Extends the job that carries the permit cluster to a new record.
//
// Evidence: 2026-10-07-demand-flood-zone-by-address-{gsc,bing}. Tier 2: Bing records "flood zone map
// by address", "fema flood zone map by address", "fema flood zone by address" and others; this site is
// shown for none of them (tier 1 empty). Relative counts only.
//
// Verification, read 2026-10-07:
//   - fema.gov/flood-maps/products-tools/know-your-risk/homeowners-renters: Map Service Center, "Type in
//     your address", "Click on the dynamic map button to view your FIRMette".
//   - fema.gov/glossary/flood-zones: SFHA = 1-percent-annual-chance flood; the A/V zone list; B or X
//     (shaded) moderate, between the base flood and the 0.2-percent flood; C or X (unshaded) minimal.
//   - law.cornell.edu 42 U.S.C. 4012a(b)(1)(A): regulated lenders; amount = lesser of outstanding
//     principal or maximum available coverage; for the term of the loan.
//   - fema.gov/flood-insurance/risk-rating: pricing "does not use flood zones to determine flood risk";
//     factors listed; flood map data still "informs ... the mandatory purchase requirement".
//   - fema.gov/flood-maps/change-your-flood-zone: LOMA / LOMR-F; owner may no longer be required to pay
//     flood insurance if granted.
//   - fema.gov/about/glossary/assignment: written assignment on transfer of title.
//   - FEMA/NFIP bulletins (floodsmart.gov): 30-day waiting period; no wait when bought in connection
//     with making a loan and paid at or before closing.
//   - Study figures: asserted below against docs/data/flood-outside-zone.json and flood-takeup.json.
// NOT verified, so not stated: msc.fema.gov itself refuses connections from this machine's network
//   (connection reset, 2026-10-07; fema.gov loads), so the portal screens were not seen directly -- the
//   steps are FEMA's own published instructions. No zone D claim, no elevation-certificate form
//   number, no state disclosure law, no premium figure, no insurer named.
// Read: 2026-11-11. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'flood-zone-by-address',
  targetQuery: 'flood zone by address',
  capture: '2026-10-07-demand-flood-zone-by-address-bing',
  intent: 'transactional',
  who: 'a buyer who has found a house they like and wants to know, before making an offer, whether it sits in a FEMA flood zone',
  want: 'the exact steps to look the address up on the official FEMA map and a plain reading of the zone code it shows',
  achieve: 'to know whether the lender will require flood insurance, get a real quote in time, and not mistake a low-risk zone for no risk',
  titlePromise: 'how to look up the FEMA flood zone for a house by its address before buying it',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-11): shown on Google or Bing for at least one flood-zone-by-address search. If not, ' +
    'stop the "records by address" line at this guide and fold its lookup section into the Outside the Zone study page.',
};

const TITLE = 'Flood Zone by Address: Look It Up Before You Buy';
const META = 'Look up a home\'s FEMA flood zone by address, read what the zone code means for your mortgage, and why zone X is not a no-flood guarantee.';
const QUICK_ANSWER =
  'Type the address into FEMA\'s Flood Map Service Center and open the dynamic map. Zones beginning with A or V are the high-risk ' +
  'Special Flood Hazard Area, where a federally regulated lender will require flood insurance. Zone X, B or C is moderate to minimal ' +
  'risk, not no risk: 26.6% of NFIP claims that record a zone were on policies rated outside the high-risk zone.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'flood-zone-by-address.md');

const REQUIRED = ['42 U.S.C. § 4012a', 'Risk Rating 2.0', 'Letter of Map Amendment', '30-day waiting period', 'FIRMette',
  '/research/outside-the-zone/', '/research/risk-without-cover/', '/guides/get-clue-report-before-buying-house/'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have)/i,
  /\bcolour|labelled|recognise|licence|neighbour\b/i, /deadly|alarming|death ?trap|ticking|nightmare/i,
  /option period/i,
];
const OVERLAP_WITH = ['get-clue-report-before-buying-house', 'homeowners-insurance-cover-failed-sump-pump', 'lead-service-line-lookup-by-address'];
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
  if (topic !== 'environmental') fail(`cluster "${topic}"`);

  // Every study figure is read from the study's own data, never retyped.
  const z = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'flood-outside-zone.json'), 'utf8'));
  const t = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'flood-takeup.json'), 'utf8'));
  const tx = (z.states as Array<{ st: string; share: number }>).find((s) => s.st === 'TX');
  const figures: Array<[string, string]> = [
    ['national share', `${z.national.shareCount}%`],
    ['paid outside', `$${(z.national.paidOutside / 1e9).toFixed(1)} billion`],
    ['take-up inside', `${z.policies.takeupInside}%`],
    ['take-up outside', `${z.policies.takeupOutside}%`],
    ['Texas share', `${tx?.share}%`],
    ['median county take-up', `${Math.round(t.medCounty)}%`],
  ];
  for (const [label, v] of figures) if (!body.includes(v)) fail(`${label} "${v}" not in body`);
  if (!QUICK_ANSWER.includes(`${z.national.shareCount}%`)) fail('quick answer share drifted');

  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const x of [body, QUICK_ANSWER, META, TITLE]) { const m = x.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  if (/^#{2,3}\s+Step\s+\d/im.test(body)) fail('templated "Step N" heading');
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  for (const m of body.matchAll(/\]\(\/research\/([a-z0-9-]+)\/\)/g)) {
    if (!fs.existsSync(path.join(process.cwd(), 'docs', `${m[1]}.html`))) fail(`dead research link ${m[1]}`);
  }
  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  const mine = trigrams(body);
  for (const s of OVERLAP_WITH) {
    const theirs = trigrams(published.get(s) ?? '');
    let shared = 0; mine.forEach((g) => { if (theirs.has(g)) shared++; });
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
