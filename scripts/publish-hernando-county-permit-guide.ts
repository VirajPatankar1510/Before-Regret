// Publish /guides/check-building-permits-hernando-county-fl/ -- Hernando County, FL permit search (Florida permit cluster).
// A NEW URL: no Hernando County guide ever existed, removed or live.
//
//   npx tsx scripts/publish-hernando-county-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-hernando-county-permit-guide.ts
//
// WHY HERNANDO. Topic chosen from the owner's OpenSEO export serp-hernando-county-building-department-2026-11-20.csv (topic
// only; no OpenSEO figure on the page or in a capture). First-party demand: Bing's own counts (capture
// 2026-11-20-demand-hernando-county-permit-bing, relative only) record "hernando county building department", "hernando county
// permit search" and "hernando county permit portal"; the site has no Hernando page. Tampa (the other export) is covered by #208.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Where are this Hernando house's permits, and is an empty result a problem?"
//   which system holds the records (Tyler vs legacy, 3/3/26)?  -> "Which Hernando County system holds a house's permits" + Census table
//   inside Brooksville?                                         -> one paragraph: ask the city (site blocked, nothing claimed)
//   could recent work legally have no permit?                   -> "Work that can legally leave no Hernando County permit" (Aug 6 list, $7500 notice, successors line)
//   who is on the hook for unpermitted work; does title catch it? -> "When a Hernando County permit was never pulled" (FAQ) + #find-unpermitted link
//   what does reviving an open/expired permit cost?             -> "What reviving an old Hernando County permit costs" (Res. 2026-037) + #resolve-open link
//   what the county is permitting now                           -> Permit Pulse block injected after publish (inject-permit-pulse.ts, ONLY=)
//   what a portal search looks like                             -> skipped: both portals blocked from here (owner chose to write without a walk, 2026-11-20)
//
// NOT TEMPLATED (outline differs from Martin and Collier). First-party: Census B25034 shares (90.4% built before 2010) mapped onto
// the 3/3/26 system split; the $261.03 renewal worked example from the schedule. Two county PDFs downloaded with the owner's OK.
//
// Facts: data/fact-ledgers/check-building-permits-hernando-county-fl.json (13 facts, read 2026-11-20).
// READ 2026-12-25 (5 weeks after going live): seen / chosen / acted per answer-ready-writing part 3.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const OWNER_TITLE_OK = process.env.OWNER_TITLE_OK === 'true';
const SLUG = 'check-building-permits-hernando-county-fl';
const TITLE = 'Hernando County Building Department: Permit Search';
const TOPIC = 'permits';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-martin-county-fl',
  'check-building-permits-collier-county-fl',
  'check-building-permits-pinellas-county-fl',
  'check-building-permits-hillsborough-county-fl',
  'check-building-permits-broward-county-fl',
  'check-building-permits-miami-dade-county-fl',
  'accela-citizen-access-permit-search',
  'resolve-open-building-permits-before-closing',
  'look-up-building-permits-by-address',
  'find-unpermitted-work-before-buying',
];
const STOP =
  'Read 2026-12-25 (5 weeks after going live): shown on Google or Bing for at least one Hernando County permit, portal or ' +
  'building department search. If not shown while Collier and Pinellas are, stop adding Florida counties without a portal walk.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'hernando county building department',
  capture: '2026-11-20-demand-hernando-county-permit-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a resale house in Hernando County, Florida, checking its permit history during the inspection period',
  want: 'to know which of the two county permit systems holds the house records and whether missing permits for recent work are a problem',
  achieve: 'to search the right system by date, tell legal exemptions from unpermitted work, and price reviving an expired permit before closing',
  titlePromise: 'where to search Hernando County building permits and how to read an empty or partial result',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Hernando County. Where do I look up its permits, and what does it mean if I find none?',
  firstScreen: 'The Building Division page linked in the first paragraph, the 3/3/26 split between the Tyler portal and the legacy tool, and the phone number.',
  firstParty: [
    { what: 'Census B25034 year-built shares for Hernando County (92,535 homes; median 1991; 90.4% built before 2010) mapped onto the 3/3/26 system split', source: 'docs/data/florida-permit-era-shares.json' },
    { what: 'Worked example from Resolution 2026-037: expired permit with 3 inspections left = $261.03 in renewal fees', source: 'data/fact-ledgers/check-building-permits-hernando-county-fl.json' },
    { what: 'Table we built from the August 6, 2026 exemption list sorting common buyer-visible work into permit / no permit', source: 'data/fact-ledgers/check-building-permits-hernando-county-fl.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the county pages and the two PDFs read on 2026-11-20 and the arithmetic',
    'says plainly that neither portal nor the City of Brooksville site loaded, so no address search was run',
  ],
  beyondCommonFacts: [
    'permits submitted before 3/3/26 sit in a legacy tool that is review, status and inspection scheduling only',
    'the exemption form says the county has no legal duty to successors or assigns for exempt work, and exemptions do not apply in a Special Flood Hazard Area',
    'the county FAQ says the current owner must permit earlier unpermitted work and title searches catch only reported violations',
    'the technology fee went from $15.00 to $93.00 on March 3, 2026 to pay for the new software; renewing an expired permit is $118.65 plus $47.46 per inspection',
  ],
  reproducibilityCheck: 'Top results are the county fee schedule, a news story about the permitting backlog, contractor-bond and licensing ads and permit-service blogs. None maps the housing stock onto the 3/3/26 legacy split, sorts the 2026 exemption list into what a buyer will see, quotes the successors line, or prices reviving an expired permit.',
  discussion: 'needed',
  discussionReason: 'A buyer must judge whether an empty search means unpermitted work, a legal exemption or simply the wrong system, and weigh what reviving a permit costs.',
};

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };
const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');

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
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  let titlePending = false;
  if (title.length > 60) {
    const canon = fs.readFileSync(path.join(process.cwd(), 'scripts', 'assert-canonical-urls.ts'), 'utf8');
    if (!canon.includes(`'/guides/${SLUG}/'`)) {
      titlePending = true;
      console.log(`  OWNER DECISION title is ${title.length} chars: confirm the owner's exact title (add to OWNER_LONG_TITLES) or pick the short one`);
    }
  }
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (/\?|^(can|does|do|is|are|what|how|why|should|will)\b/i.test(title)) fail('title reads as a question; it would need a quick answer');
  if (quick) fail('quick answer present on a non-question title');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  const firstPara = body.split(/\n\s*\n/)[0];
  if (!firstPara.includes(ledger.officialLookupUrl)) fail('official permit page not linked in the first paragraph');
  for (const img of IMAGES)
    if (!body.includes(`](${img} `) || !fs.existsSync(path.join(process.cwd(), 'public', img))) fail(`screenshot ${img} missing from body or disk`);
  for (const r of ['Tyler', 'Legacy Permit Application Status Tool', '3/3/26', '$7500', 'successors or assigns', '$118.65', '$261.03', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in the ledger (facts or our portal walk).
  const ledgerAll = JSON.stringify({ facts: ledger.facts, ourWork: ledger.ourWork });
  const ledgerQuotes = norm(ledger.facts.map((f: { quote: string }) => f.quote).join(' '));
  for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!ledgerQuotes.includes(norm(m[1]))) fail(`quoted text not found in a ledger quote: "${m[1]}"`);
  }
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?%?\d[\d,./-]*%?/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies|contractors) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens Property|Universal Property)\b/i,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/, /^#{2,3}\s+Step\s+\d/im,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    if (!published.has(sib)) { fail(`sibling ${sib} not published`); continue; }
    const ov = overlap(body, published.get(sib)!);
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}  [${TOPIC}]\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log(`\n  DRY RUN -- all checks pass${titlePending ? ' (title awaits the owner)' : ''}.\n`); return; }
  if (titlePending && !OWNER_TITLE_OK) { console.log('\n  title awaits the owner -- nothing written.'); process.exit(1); }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, '', ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: Permit Pulse block (ONLY=), article-faqs, build, IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
