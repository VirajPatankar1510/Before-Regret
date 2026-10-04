// Publish "PEX, Copper or Galvanized? How to Tell a House's Water Pipes".
//
//   npx tsx scripts/publish-identify-water-pipes-pex-copper-galvanized.ts            # dry run
//   APPLY=true npx tsx scripts/publish-identify-water-pipes-pex-copper-galvanized.ts
//
// Second of the four homepage-cutaway guides ("What are the water pipes made of?"), also in the
// 2026-10-04 research-council plan. The library had narrow pages (polybutylene, lead service line,
// Orangeburg, cast iron) but nothing that tells a buyer how to identify the SUPPLY pipe in front of
// them; galvanized had no page at all. This page links to those, not repeats them.
//
// Evidence: 2026-10-04-demand-pex-pipe-{gsc,bing}. Tier 2: Bing records the phrasings, "pex pipe" far
// ahead of "cpvc pipe", "copper pipes", "galvanized pipes" (relative only); none reach this site yet.
//
// Verification, all read 2026-10-04/05:
//   - Copper: Cerro Flow Products data sheet -- Types K (heavy), L (medium), M (light) to ASTM B88; color
//     code green/blue/red; "Color marking is not applicable to tube furnished in annealed straight
//     lengths or coils". (copper.org pages 403/404 -- not cited.)
//   - PEX: Apollo PEX-B page -- cross-linked high density polyethylene; red/white/blue "for easy
//     identification of hot, cold and main water lines"; meets ASTM F876/F877. IAPMO listing (SharkBite
//     PDF): tubing marked with maker, "ASTM F876 and ASTM F877 PEX", pressure rating, size, date code.
//   - CPVC: FlowGuard Gold -- conforms to ASTM D2846 (hot- and cold-water distribution); CPVC beige or tan,
//     PVC typically white; solvent cement (ASTM F493 listed).
//   - Galvanized / polybutylene descriptions, eras and repipe cost: PRIORITY_RULES, asserted below.
//   - Metal scratch/magnet test, 40 CFR 141.2 label, 42 U.S.C. 300g-6: as verified for the lead guide.
//   - ASHI SoP 2026 section 7.1(B)(1): describe predominant type and material of interior water service
//     and distribution systems.
// CUT: PEX/CPVC introduction dates, PB2110 marking (left to the polybutylene guide), any insurer claim.
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
  slug: 'identify-water-pipes-pex-copper-galvanized',
  targetQuery: 'pex pipe',
  capture: '2026-10-04-demand-pex-pipe-bing',
  intent: 'informational',
  who: 'a buyer on a second showing of a house built before the 1990s who wants to know what the water supply pipes are before making an offer',
  want: 'where to look and a quick way to tell PEX, CPVC, copper, galvanized, polybutylene and lead apart',
  achieve: 'to know whether a repipe belongs in the offer price, and what to have the inspector confirm in writing',
  titlePromise: 'a quick way to identify the water supply pipe material in a house you are touring',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-09): shown on Google or Bing for at least one pipe-material search. If not, ' +
    'fold the identification table into spot-polybutylene-pipes-before-buying-house and 301 this URL to it.',
};

const TITLE = "PEX, Copper or Galvanized? How to Tell a House's Water Pipes";
const META = "Tell PEX, CPVC, copper, galvanized, polybutylene and lead supply pipes apart on a viewing, with a magnet and a coin, and know which mean a repipe.";
const QUICK_ANSWER =
  'Look above the water heater, under the sinks and at the main shut-off. Plastic printed "PEX" is PEX; beige or tan rigid ' +
  'plastic is CPVC; flexible gray plastic may be polybutylene. For metal, scratch gently: orange is copper; gray and magnetic ' +
  'is galvanized steel; gray, soft and not magnetic may be lead. Galvanized and polybutylene are the ones that usually mean a repipe.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'identify-water-pipes-pex-copper-galvanized.md');

const REQUIRED = ['ASTM B88', 'ASTM F876', 'ASTM D2846', '42 U.S.C. 300g-6', '40 CFR 141.2', 'section 7.1',
  '/guides/lead-service-line-lookup-by-address/', '/guides/spot-polybutylene-pipes-before-buying-house/'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have)/i,
  /\bcolour|labelled|recognise|licence\b/i, /poison|toxic|deadly|alarming|danger(ous)?\b/i,
];
const COUNTY_LINKED = ['spot-polybutylene-pipes-before-buying-house', 'lead-service-line-lookup-by-address', 'polybutylene-pipes-home-insurance', 'why-cast-iron-pipes-corrode'];
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
  if (topic !== 'plumbing') fail(`cluster "${topic}"`);
  // Repipe cost and eras must be the engine's, which is what a report for this house says.
  for (const id of ['galvanized_supply', 'polybutylene_supply']) {
    const r = PRIORITY_RULES.find((p) => p.id === id);
    const cost = r?.typicalRepairCost?.replace(/^Whole-home repipe /, '') ?? '';
    if (!r || !body.includes(cost)) fail(`${id} repipe cost "${cost}" not in body`);
  }
  if (PRIORITY_RULES.find((p) => p.id === 'galvanized_supply')?.maxYear !== 1969 || !body.includes('through 1969')) fail('galvanized era drifted');
  const pbr = PRIORITY_RULES.find((p) => p.id === 'polybutylene_supply');
  if (pbr?.minYear !== 1978 || pbr?.maxYear !== 1996 || !body.includes('1978 through 1996')) fail('polybutylene era drifted');
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
