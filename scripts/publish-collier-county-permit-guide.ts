// Publish /guides/check-building-permits-collier-county-fl/ -- the Collier pilot of the Florida permit cluster
// (docs/plans/florida-permit-cluster-2026-11.md). A NEW URL: no Collier guide ever existed, removed or live.
//
//   npx tsx scripts/publish-collier-county-permit-guide.ts            # dry run
//   APPLY=true OWNER_TITLE_OK=true npx tsx scripts/publish-collier-county-permit-guide.ts
//
// Owner's proposed title was 65 chars ("... & Pre-1989 Records"); offered both, the owner left it to us on 2026-11-17
// ("do whatever you think is the right thing"), so it ships at 57 chars with every portal name kept.
//
// WHY COLLIER. Bing's own counts (capture 2026-11-17-demand-collier-county-permit-search-bing, relative only) record
// "collier county permit search" and "collier county building permits"; the site has no Collier page.
//
// NOT TEMPLATED. It leads with what is particular to Collier and what we found:
//   - three record systems by date (CityView 2011-, CDPlus 1989-2011, Property Appraiser pre-1989), mapped to our Census
//     year-built shares (docs/data/florida-permit-era-shares.json: 81.9% of homes built before 2010);
//   - CDPlus tested on the county Government Center: street suffix returns 0, the 200-row cap stopped 3301 at 2004,
//     2011 permits in CDPlus, permit-number formats by era, a SUSPEND permit never inspected;
//   - the county's closed-status list vs CDPlus's VOID/SUSPEND; its own "not current" warning;
//   - HB 803 (ch. 2026-63): s. 553.79(1)(g) under-$7,500 exemption needs a written request; (1)(c) 1-year expiry;
//   - the $25 code lien search does NOT report open permits.
// CityView, the Naples and Marco Island portals are region-blocked from our location -- recorded, not worked around.
//
// Facts: data/fact-ledgers/check-building-permits-collier-county-fl.json (24 facts + portal walk, read 2026-11-17).
// READ 5 weeks after going live: shown on Google or Bing for a Collier permit search.
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
const SLUG = 'check-building-permits-collier-county-fl';
const TITLE = 'Collier County Permit Search: CityView, CDPlus & Pre-1989';
const TOPIC = 'permits';
const IMAGES = ['/images/collier-cdplus-search-3299-tamiami.webp', '/images/collier-cdplus-permit-2011061518-suspend.webp'];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
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
  'Read 5 weeks after going live: shown on Google or Bing for at least one Collier permit, CityView or CDPlus search. ' +
  'If not shown while the other county guides are, hold Sarasota, Manatee and Brevard and find out why first.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'collier county permit search',
  capture: '2026-11-17-demand-collier-county-permit-search-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a house in unincorporated Collier County, checking its permit history before the inspection period ends',
  want: 'to find every permit on the address, including the ones older than the current CityView portal holds',
  achieve: 'to know which of the three county record systems to search for the house, how to read an open-looking status, and what to ask the seller before closing',
  titlePromise: 'where Collier County keeps permits from each era and how to search CityView, CDPlus and the pre-1989 list',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Collier County. Where are its permits, and am I seeing all of them?',
  firstScreen: 'The county permit-history page linked in the first paragraph, the three date ranges, and the point that the current portal alone misses the permit that built most houses.',
  firstParty: [
    { what: 'External CD-Plus Search tested on 2026-11-17 at county-owned 3299/3301 Tamiami Trl E: street suffix variants return 0, bare name returns 5; 3301 hits the 200 cap at 2004; status counts COED 148 / VOID 31 / SUSPEND 21; permit-number formats by era; permit 2011061518 (SUSPEND = cancelled/closed per Bulletin 14, though it reads as never inspected)', source: 'data/fact-ledgers/check-building-permits-collier-county-fl.json' },
    { what: 'Screenshot of our CDPlus results list for 3299 TAMIAMI on public county property', source: 'public/images/collier-cdplus-search-3299-tamiami.webp' },
    { what: 'Screenshot of permit 2011061518 detail, contractor and contact rows cropped out', source: 'public/images/collier-cdplus-permit-2011061518-suspend.webp' },
    { what: 'Census B25034 year-built shares mapped onto the three record systems (81.9% of Collier homes built before 2010)', source: 'docs/data/florida-permit-era-shares.json' },
  ],
  evidenceOfWork: [
    'screenshots of our own CDPlus searches on county property, dated, no personal names',
    'visible "How we checked this" naming the searches, the county, city and state pages read, and four things we could not check (blocked portals, PDFs, the appraiser terms)',
  ],
  beyondCommonFacts: [
    'CDPlus returns nothing when the street suffix is typed; only the bare street name works',
    'the 200-row cap silently cut a busy address off at 2004 although CDPlus runs to 2011',
    'Bulletin 14 (amended 2023) defines CDPlus SUSPEND as cancelled and closed, though the county web page omits it from its closed list; VOID sounds final but requires action',
    'from 2026-07-01 s. 553.79(1)(g) exempts some work under $7,500 but requires a written exemption request with the contract -- the paper trail to ask for',
    'the county $25 lien search states it does not report open permits',
  ],
  reproducibilityCheck: 'Top results are the county portal pages and generic permit-search posts. None tests CDPlus (suffix trap, 200 cap), maps Census year-built shares onto the three record eras, reads a SUSPEND record, or connects the 2026 HB 803 exemption and expiry to how a buyer reads a permit list.',
  discussion: 'needed',
  discussionReason: 'A buyer must judge an incomplete or open-looking record across three systems, decide whether a missing permit is a problem under the new exemption, and weigh liens against open permits.',
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
  for (const r of ['CDPlus', 'CityView', 'Property Appraiser', 'SUSPEND', 'Bulletin 14', '553.79(1)(g)', 'not report', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in the ledger (facts or our portal walk).
  const ledgerAll = JSON.stringify({ facts: ledger.facts, portalWalk: ledger.portalWalk });
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
    /SAFE TECH|CINDY/i, // the contractor and contact person were cropped out of the screenshot; keep them out of the text too
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
  console.log(`  wrote ${SLUG}\n  next: Permit Pulse block (ONLY=), article-faqs, build, permits hub line (owner OK), IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
