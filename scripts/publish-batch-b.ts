// Batch B of the county growth plan (2026-10-07), plus one new NYC-wide guide.
//
//   npx tsx scripts/publish-batch-b.ts            # dry run
//   APPLY=true npx tsx scripts/publish-batch-b.ts
//
// WHAT. Two county permit guides restored from the 2026-09-02 prune with bodies written from scratch
// (Manhattan #93, Sacramento #210), and one NEW guide: HPD Online. Palm Beach (#209) was planned for
// this batch and is HELD: ePZB's permit tracking is for permit holders and needs a permit number, and
// the property appraiser shows no permits, so no anonymous address search could be verified.
//
// WHY HPD ONLINE. Bing's own counts (2026-10-07-demand-manhattan-building-permit-search-bing) put
// "hpd online" and "hpd violations" far above any permit phrasing this site has measured. HPD covers
// all five boroughs, so it is its own page, linked from Manhattan; Manhattan only summarises it.
//
// NOT TEMPLATED. Each page leads with what is particular to it:
//   HPD Online  -- the second NYC record (maintenance, not construction); violation classes; AEP.
//   Manhattan   -- buyers buy into a building: DOB + HPD + LPC, with walkthroughs LINKED (Bronx,
//                  Brooklyn, HPD guide), not repeated.
//   Sacramento  -- the city/county split: the city portal is anonymous, the county's needs a login;
//                  Natomas AE (2008) -> A99 (2015) and the flood insurance that still applies.
//
// VERIFIED 2026-10-07, in the browser or at the primary source:
//   HPD Online (hpdonline.nyc.gov): address search; overview fields (complaints last 2 years,
//     violations A/B/C/I, litigation, harassment findings, vacate order, AEP, historically rent
//     regulated -> HCR, registration with managing agent, AKA addresses, block/lot, image cards).
//   nyc.gov HPD register-your-property: 3+ units incl. condos and co-ops; 1-2 family if not owner-
//     or family-occupied; annually May 21 - Sept 1; update on ownership/agent change.
//   nyc.gov HPD clear-violations: A non-hazardous 90 days; B hazardous 30; C immediately hazardous
//     24 hours (self-closing doors 14 days; heat/hot water no time); I = orders to repair/vacate.
//   nyc.gov HPD AEP page: designation on or about Jan 31; B and C counts + emergency repair charges;
//     correct within four months; fees up to $1,000 per unit.
//   City of Sacramento Public Permit Portal: anonymous; permit number / site address (street no. +
//     name) / parcel / contractor license; result columns; "100+" on a one-letter street name.
//   Sacramento County ACA (SACCO): Building search "requires registration and/or login".
//   cityofsacramento.gov Natomas page: AE Dec 2008 after USACE re-evaluation, de-facto moratorium;
//     A99 since June 16, 2015, interim, still high risk; federally backed mortgage still needs flood
//     insurance; Floodplain Information Line 916-808-5061.
//   LPC Admin Code § 25-305 and the BIS/DOB NOW walkthrough: verified for batch A (Brooklyn, Bronx).
// NOT verified, so not stated: DOB BIS/DOB NOW pages (Akamai "Access Denied" here; not linked), the
//   list of other cities' building departments in Sacramento County, county registration cost,
//   HPD violation clearing mechanics.
//
// Read 2026-11-11. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const STOP =
  'Read 2026-11-11. If the batch averages under 30 Google impressions per 28 days (live county median ~150), pause further batches ' +
  'and check indexing before restoring more.';

interface Page { id: number | null; md: string; brief: ArticleBrief; meta: string; quick: string; required: string[] }

const PAGES: Page[] = [
  {
    id: null, md: 'hpd-online-check-nyc-building-violations.md',
    brief: {
      slug: 'hpd-online-check-nyc-building-violations', targetQuery: 'hpd violations lookup',
      capture: '2026-10-07-demand-manhattan-building-permit-search-bing', intent: 'navigational',
      who: 'a buyer in contract on a New York City co-op or condo apartment who wants to know how the building has been maintained',
      want: "how to find the building on HPD Online and what its complaints, violation classes, litigation and enforcement flags mean",
      achieve: 'to spot open hazardous violations, a vacate order or an AEP designation and get answers from the managing agent before signing',
      titlePromise: "how to check a New York City building's HPD record before buying into it",
      stopCondition: STOP,
    },
    meta: "Check any NYC building on HPD Online by address: complaints, A, B and C violation classes, litigation, vacate orders and AEP, before you buy.",
    quick:
      'Type the address into HPD Online and open the building overview. It shows complaints over the last two years, housing code ' +
      'violations by class (A non-hazardous, B hazardous, C immediately hazardous), litigation, any vacate order and whether the building is ' +
      "in HPD's Alternative Enforcement Program. Every building of three or more units, co-ops and condos included, must register.",
    required: ['hpdonline.nyc.gov', '90 days', '30 days', '24 hours', 'May 21 and September 1', '$1,000 per unit', 'January 31',
      '/guides/check-building-permits-bronx-ny/', '/guides/check-building-permits-brooklyn-ny/'],
  },
  {
    id: 93, md: 'manhattan-permit-search.md',
    brief: {
      slug: 'check-building-permits-manhattan-ny', targetQuery: 'manhattan building permit search',
      capture: '2026-10-07-demand-manhattan-building-permit-search-bing', intent: 'navigational',
      who: 'a buyer in contract on a Manhattan co-op or condo apartment who needs the building and unit records before closing',
      want: 'which city records cover a Manhattan apartment building, and which of them to pull for the unit being bought',
      achieve: "to see the building's construction, maintenance and landmark records and raise open items with the managing agent before signing",
      titlePromise: 'which DOB, HPD and landmark records to check for a Manhattan apartment building',
      stopCondition: STOP,
    },
    meta: "Buying a Manhattan apartment? Check the building's DOB permits and certificate of occupancy, its HPD violations, and any landmark record.",
    quick:
      'Pull two records for the building, not one. The Department of Buildings has permits, the certificate of occupancy and DOB violations, ' +
      "in BIS and DOB NOW. HPD Online has the building's maintenance record: complaints, violations by hazard class, litigation and the " +
      'managing agent. If the building is landmarked, the Landmarks Preservation Commission keeps a third.',
    required: ['Code § 25-305', '/guides/check-building-permits-bronx-ny/', '/guides/check-building-permits-brooklyn-ny/',
      '/guides/hpd-online-check-nyc-building-violations/', 'certificate of occupancy'],
  },
  {
    id: 210, md: 'sacramento-permit-search.md',
    brief: {
      slug: 'check-building-permits-sacramento-county-ca', targetQuery: 'sacramento county building permits',
      capture: '2026-10-07-demand-sacramento-permit-search-bing', intent: 'navigational',
      who: 'a buyer under contract on a house in Sacramento or elsewhere in Sacramento County who wants its permit history before closing',
      want: 'whether the city or the county holds the permits for the address, and how to search each portal',
      achieve: 'to confirm past work was permitted and inspected, and for a Natomas house, to price the flood insurance it will still need',
      titlePromise: 'how to search Sacramento city and county building permits, and what the Natomas flood zone means',
      stopCondition: STOP,
    },
    meta: 'Search Sacramento permits by address in the city\'s open portal or the county\'s Accela login portal, and what Natomas\'s A99 zone means.',
    quick:
      'First find out which office holds the record. Inside city limits, the City of Sacramento\'s Public Permit Portal searches by address, ' +
      'parcel or permit number without an account. Unincorporated addresses are in the county\'s Accela portal, which asks you to register and ' +
      'log in. In Natomas, the A99 flood zone still means flood insurance for a federally backed mortgage.',
    required: ['42 U.S.C. § 4012a', 'June 16, 2015', 'December 2008', '916-808-5061', 'A99', '/guides/flood-zone-by-address/',
      '/guides/accela-citizen-access-permit-search/'],
  },
];
const BANNED = [/\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i, /^## Step \d/m,
  /\boption period\b/i, /\bcolour|labelled|recognise|licence\b/i];
const tri = (s: string) => { const w = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean); const out = new Set<string>(); for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`); return out; };

async function main() {
  validateBriefs(PAGES.map((p) => p.brief));
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, status, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; status: string; body_markdown: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  const willPublish = new Set(PAGES.map((p) => p.brief.slug));
  const built = PAGES.map((p) => {
    const raw = fs.readFileSync(path.join('guides', p.md), 'utf8');
    return { ...p, title: raw.match(/^#\s+(.*)$/m)![1].trim(), body: raw.replace(/^#\s.*\n+/, '').trim() };
  });
  for (const p of built) {
    const tag = p.brief.slug;
    if (p.id === null) { if (rows.some((r) => r.slug === tag)) fail(`${tag}: slug already exists`); }
    else { const row = rows.find((r) => r.id === p.id); if (!row || row.slug !== tag || row.status !== 'removed') fail(`${tag}: expected removed row #${p.id}, found ${row?.slug}/${row?.status}`); }
    if (p.title.length > 60) fail(`${tag}: title ${p.title.length}`);
    if (p.meta.length < 70 || p.meta.length > 155) fail(`${tag}: meta ${p.meta.length}`);
    if (p.quick.length < 120 || p.quick.length > 450) fail(`${tag}: quick ${p.quick.length}`);
    const topic = guideTopic(tag, p.title); if (topic !== 'permits') fail(`${tag}: cluster ${topic}`);
    for (const r of p.required) if (!p.body.includes(r)) fail(`${tag}: missing "${r}"`);
    for (const b of BANNED) for (const t of [p.body, p.quick, p.meta, p.title]) { const m = t.match(b); if (m) fail(`${tag}: banned "${m[0]}"`); }
    if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(p.body)) fail(`${tag}: link nested in bold`);
    const heads = p.body.match(/^#{2,3} .*/gm) ?? []; if (new Set(heads).size !== heads.length) fail(`${tag}: duplicate heading`);
    for (const m of p.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1]) && !willPublish.has(m[1])) fail(`${tag}: dead link ${m[1]}`);
    console.log(`\n  ${tag}  [${topic}]\n    title (${p.title.length})  ${p.title}\n    meta  (${p.meta.length})  ${p.meta}\n    quick (${p.quick.length})  ${p.quick}\n    body  ${p.body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  }
  // Against each other, and against the NYC guides they link to.
  const others = ['check-building-permits-bronx-ny', 'check-building-permits-brooklyn-ny', 'accela-citizen-access-permit-search', 'flood-zone-by-address'];
  const pool = [...built.map((b) => ({ slug: b.brief.slug, body: b.body })), ...others.map((s) => ({ slug: s, body: rows.find((r) => r.slug === s)?.body_markdown ?? '' }))];
  for (const a of built) for (const b of pool) {
    if (a.brief.slug >= b.slug && built.some((x) => x.brief.slug === b.slug)) continue;
    if (a.brief.slug === b.slug) continue;
    const ta = tri(a.body), tb = tri(b.body); const jac = [...ta].filter((x) => tb.has(x)).length / new Set([...ta, ...tb]).size;
    const line = `  overlap ${a.brief.slug.replace('check-building-permits-', '')} / ${b.slug.replace('check-building-permits-', '')}: ${(jac * 100).toFixed(1)}%`;
    if (jac > 0.08) fail(line + ' (templated?)'); else console.log(line);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  fs.mkdirSync('backups', { recursive: true });
  for (const p of built) {
    if (p.id === null) {
      await withDb((sql) => sql`
        INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
        VALUES (${p.brief.slug}, ${p.title}, ${p.meta}, ${p.quick}, ${p.body}, '[]', 'published', 'guide', 'standard', now())`);
      console.log(`  published new ${p.brief.slug}`);
      continue;
    }
    const old = (await withDb((sql) => sql`SELECT * FROM articles WHERE id = ${p.id}`)) as unknown as any[];
    fs.writeFileSync(`backups/${p.brief.slug}-before-restore-${Date.now()}.json`, JSON.stringify(old, null, 2));
    // Slug is never written. Old FAQs described old text, so they are cleared.
    const res = (await withDb((sql) => sql`
      UPDATE articles SET title = ${p.title}, meta_description = ${p.meta}, quick_answer = ${p.quick}, body_markdown = ${p.body},
        sources_json = '[]', faq_json = '[]', status = 'published', updated_at = now()
      WHERE id = ${p.id} AND slug = ${p.brief.slug} AND status = 'removed' RETURNING id`)) as unknown as any[];
    if (res.length !== 1) throw new Error(`ABORT: ${p.brief.slug} restore affected ${res.length} rows`);
    console.log(`  restored #${p.id} ${p.brief.slug}`);
  }
  console.log('\n  next: prunedGuides, Permit Pulse, article-faqs, hub links, build');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
