// Publish /guides/check-building-permits-pinellas-county-fl/ -- "Pinellas County Permit Search: Access Portal & Storm Records".
// A NEW URL (no Pinellas guide ever existed, removed or live). First page of the 2026-11-17 county permit batch: the owner
// agreed to scale only formats proven page after page, and county/city permit guides passed (29/29 older than 5 weeks shown,
// median 61 Google impressions / 28 days). See memory feedback_scale_only_proven_formats.
//
//   npx tsx scripts/publish-pinellas-county-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-pinellas-county-permit-guide.ts
//
// WHY PINELLAS. Bing's own counts (capture 2026-11-16-demand-austin-permit-search-bing, relative only) record
// "pinellas county permit search"; its Accela portal opened to us. Raleigh had the strongest demand but both Raleigh and Wake
// County EnerGov portals (tylerhost.net) answered 403 Forbidden to our browser on 2026-11-16 -- held, not worked around.
//
// NOT TEMPLATED. It leads with what we found on this portal and nowhere else:
//   - one address (county-owned 12520 Ulmerton Rd) returned 8 address entries; the first held 22 records back to 12/28/2020
//     only, while the 5 permits from 2007-2019 (numbers PER-H-...) sat under two other entries, and one entry was empty;
//   - the county permits only unincorporated Pinellas + six towns; mailing cities mislead (Tierra Verde reads St Petersburg);
//     Belleair Bluffs moved to SAFEbuilt on 2025-08-15 with open permits staying with the county;
//   - the post-Helene/Milton record set: 49% rule, damage map, pcpao FEMA/WLM letter, Storm Damage Reassessment records,
//     Nonconversion Acknowledgment on the deed, CBRA non-renewal;
//   - condo milestone records searchable anonymously (BMS-, Good Standing / Phase I Required).
// The general Accela method (date window, address boxes) is NOT repeated: it links the Accela guide; the Florida milestone
// law is linked to Broward rather than restated. Overlap with every sibling is checked below (<= 8%).
//
// Facts: data/fact-ledgers/check-building-permits-pinellas-county-fl.json (23 facts, all read 2026-11-16).
// READ 5 weeks after going live (date in memory): shown on Google or Bing for a Pinellas permit search.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'check-building-permits-pinellas-county-fl';
const TITLE = 'Pinellas County Permit Search: Access Portal & Storm Records';
const TOPIC = 'permits';
const IMAGE = '/images/pinellas-permit-search-eight-address-entries.jpg';
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'check-building-permits-hillsborough-county-fl',
  'check-building-permits-broward-county-fl',
  'check-building-permits-miami-dade-county-fl',
  'accela-citizen-access-permit-search',
  'resolve-open-building-permits-before-closing',
  'flood-zone-by-address',
  'look-up-building-permits-by-address',
];
const STOP =
  'Read 5 weeks after going live: shown on Google or Bing for at least one Pinellas permit or Access Portal search. ' +
  'If not shown while the other county guides are, hold the rest of the batch and find out why before writing more.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'pinellas county permit search',
  capture: '2026-11-16-demand-austin-permit-search-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a house or condo in unincorporated Pinellas or a town the county permits for, checking its permit and storm history before the inspection period ends',
  want: 'to search the Pinellas County Access Portal by address and be sure the search shows every permit, including the older ones',
  achieve: 'to see the full permit, inspection and post-hurricane damage record for the address, and to know which questions to put to the seller before closing',
  titlePromise: 'how to search Pinellas County permits by address and find the storm damage records that go with them',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I am buying a house in Pinellas. How do I look up its permits, and am I seeing all of them?',
  firstScreen: 'The Access Portal link in the first paragraph, the warning that the county covers only part of the county, and the finding that one address came back 8 times with the older permits under other entries.',
  firstParty: [
    { what: 'Access Portal walked on 2026-11-16 at county-owned 12520 Ulmerton Rd: 8 address entries opened one by one (22/18/19/15/0 records; two entries with only the 5 PER-H permits 2007-2019, none of which appear under the first entry, whose oldest record is 12/28/2020); the 2007 deck permit inspection history read anonymously; a Milestone Inspection Record search (BMS- numbers, Good Standing / Phase I Required, Tierra Verde buildings with St Petersburg addresses)', source: 'data/fact-ledgers/check-building-permits-pinellas-county-fl.json' },
    { what: 'Our screenshot of the address search returning 8 identical-looking entries, on public county property', source: 'public/images/pinellas-permit-search-eight-address-entries.jpg' },
  ],
  evidenceOfWork: [
    'screenshot taken on the read date of a search on county-owned property, no personal names',
    'visible "How we checked this" naming the searches run, the pinellas.gov pages and the PDF read, and four things we could not confirm',
  ],
  beyondCommonFacts: [
    'the first address entry stops at late 2020; permits from 2007-2019 numbered PER-H sit under separate entries',
    'the county permits only unincorporated Pinellas plus Belleair Beach, Belleair Shore, Indian Rocks Beach, Kenneth City, Safety Harbor and Oldsmar; Belleair Bluffs moved to SAFEbuilt on 2025-08-15',
    'Pinellas uses a 49% substantial damage threshold and says Helene and Milton permits are not exempt; pcpao.gov FEMA/WLM letter shows the repair budget',
    'since 2019-01-01 a Nonconversion Acknowledgment is recorded on the deed for new or substantially improved buildings in the flood zone',
    'condo milestone records are searchable without an account, and a parking level under living space counts as a story',
  ],
  reproducibilityCheck: 'Top results are the county portal itself, its help pages and generic "how to check permits" posts. None reports that one address returns several entries with the pre-2020 PER-H permits split off, ties the permit search to the post-Helene 49% records and the FEMA/WLM letter, or shows that milestone records are searchable by buyers.',
  discussion: 'needed',
  discussionReason: 'A buyer must judge an incomplete-looking permit list, decide what a storm damage determination means for a flood-zone house, and weigh open permits and liens before closing.',
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
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  // Owner rule 2026-10-09: a quick answer only on a question title. This title is not one.
  if (/\?|^(can|does|do|is|are|what|how|why|should|will)\b/i.test(title)) fail('title reads as a question; it would need a quick answer');
  if (quick) fail('quick answer present on a non-question title');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // Owner rule for new navigational guides: the browser-verified official portal is linked in the first paragraph.
  const firstPara = body.split(/\n\s*\n/)[0];
  if (!firstPara.includes(ledger.officialLookupUrl)) fail('official portal not linked in the first paragraph');
  if (!body.includes(`](${IMAGE} `) || !fs.existsSync(path.join(process.cwd(), 'public', IMAGE))) fail('screenshot missing from body or disk');
  for (const r of ['PER-H', '49%', 'FEMA/WLM Letter', 'Milestone Inspection Record', 'SAFEbuilt', 'Nonconversion Acknowledgment', 'How we checked this'])
    if (!body.includes(r)) fail(`missing "${r}"`);

  // Every long quotation must be a ledger quote; every number must be in a ledger entry.
  const ledgerAll = JSON.stringify(ledger.facts);
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
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, '', ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: Permit Pulse block (ONLY=), article-faqs, build, permits hub line (owner OK), IndexNow`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
