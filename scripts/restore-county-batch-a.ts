// Growth plan batch A (2026-10-03): restore three county permit guides, each rewritten from scratch.
//
//   npx tsx scripts/restore-county-batch-a.ts            # dry run
//   APPLY=true npx tsx scripts/restore-county-batch-a.ts
//
// WHY. The research council's growth run (2026-10-03) found the county permit page is the site's
// engine: 18 of 22 shown at positions 7-12, ~160 impressions and 2 clicks per page per 28 days,
// 36 of ~76 clicks. Fourteen county guides were written and then removed by the 2026-09-02 prune.
// URL Inspection on 2026-10-03 says every one is "URL is unknown to Google", so restoring them
// carries no history and no penalty. These are the first three of five batches.
//
// NOT TEMPLATED (owner's condition). The old bodies were one Step 1 / Step 2 / Step 3 template, and
// old Brooklyn nearly duplicated the live Bronx guide, so nothing old is reused. Each page leads
// with what is particular to that place:
//   Brooklyn    -- the second record a Brooklyn house can have: the Landmarks Preservation
//                  Commission (map, permit search since 2016-01-01, violation search). The DOB
//                  walkthrough is NOT repeated: it links the Bronx guide instead.
//   Broward     -- county BCS search by address/folio/parcel, the city split (31 cities in the
//                  county's own list), and the condo inspection regime: BORA Policy 05-05 (25
//                  years from the CO, then every 10) and Florida Statutes 553.899 milestone law.
//   Santa Clara -- county Public Permit Portal, SJPermits (Bing records "sjpermits" far more
//                  than "santa clara county permits"), and house plans under California Health
//                  and Safety Code 19850/19851 (plans need not be filed for dwellings of two
//                  stories and a basement or less; copies need designer + owner consent).
// Pairwise word-trigram overlap between the three bodies, and against Hillsborough, is 0.6-3.2%.
//
// VERIFIED 2026-10-03, in a browser or at the primary source:
//   LPC: applications page (Landmarks Law, Portico), permit-search page (fields; since 2016-01-01;
//     older via Records Access Request), landmark-violation-search page (statuses; map shows active
//     and rescinded since 2020-01-01; "not a substitute for a title search"; 212-669-7951).
//     NYC Admin Code 25-305: two independent copies of the code agree; LPC's page states the same rule.
//   DOB BIS / DOB NOW answer "Access Denied" (Akamai) to this browser, so they are NOT linked;
//     the page sends readers to the Bronx guide, which walks through both.
//   Broward BCS address search (fields, folio/parcel formats, city list counted: 31 + unincorporated,
//     Certificates of Use, code enforcement search); LauderBuild page (anyone can search without an
//     account); Hollywood FL Building Safety Inspection Program page (25-year rule, Policy 05-05,
//     exemptions, "supersedes ... SB 154"); Florida Statutes 553.899 (2026), leg.state.fl.us.
//     broward.org's own 40-year PDFs now 404, and bcpa.net would not load -- neither is cited.
//   Santa Clara County Accela portal (Development > Search Records by address/parcel/record number,
//     anonymous); San Jose "Check Your Permit Status at SJPermits" (search fields, View Permit/File,
//     status definitions incl. Finaled); HSC 19850 and 19851 on leginfo.legislature.ca.gov.
//     plandev.santaclaracounty.gov sits behind a Cloudflare check -- not worked around, not cited.
// CUT as unverifiable: San Jose's online date range and imaged-plan claims, Palo Alto Eichler /
//   single-story overlay detail, any city portal not opened.
//
// Read (Kohavi): batch A is read 2026-11-09. Stop condition in each brief.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const STOP =
  'Read 2026-11-09 with batch A. If the three average under 30 impressions per 28 days (the live county median is ~150), ' +
  'pause batches B-E and find out why before restoring more.';

interface Page { id: number; md: string; brief: ArticleBrief; meta: string; quick: string; required: string[] }

const PAGES: Page[] = [
  {
    id: 94, md: 'brooklyn-permit-search.md',
    brief: {
      slug: 'check-building-permits-brooklyn-ny', targetQuery: 'brooklyn building permit search',
      capture: '2026-10-03-demand-brooklyn-permit-search-bing', intent: 'navigational',
      who: 'a buyer under contract on a Brooklyn brownstone or row house who needs to know what work was permitted, and whether the house is landmarked',
      want: 'which city records to search for a Brooklyn address, including the Landmarks Preservation Commission permits and violations most buyers never check',
      achieve: 'to see the full permit and landmark record before the contingency ends, and to ask the seller about any exterior work missing from either record',
      titlePromise: 'how to search both the DOB and the LPC record for a Brooklyn property',
      stopCondition: STOP,
    },
    meta: 'Search a Brooklyn property in both of its records: DOB building permits, and LPC landmark permits and violations if the house is in a historic district.',
    quick:
      'Search two records, not one. The Department of Buildings has the house\'s building permits in BIS and DOB NOW. If the house is a ' +
      'landmark or in a historic district, the Landmarks Preservation Commission keeps a second record: its permit search covers permits ' +
      'since January 1, 2016, and its violation search shows warning letters, notices and summonses. Check the address on LPC\'s map first.',
    required: ['Code § 25-305', 'January 1, 2016', 'January 1, 2020', 'Permit Application Finder', '212-669-7951', '/guides/check-building-permits-bronx-ny/'],
  },
  {
    id: 214, md: 'broward-county-permit-search.md',
    brief: {
      slug: 'check-building-permits-broward-county-fl', targetQuery: 'broward county permit search',
      capture: '2026-10-03-demand-broward-county-permit-search-bing', intent: 'navigational',
      who: 'a buyer looking at a house or condo in Fort Lauderdale or elsewhere in Broward who needs its permit record before closing',
      want: "whether the county or the city holds the record, how to search the county's BCS by address or folio, and what a condo's inspection reports should show",
      achieve: "to see the property's permits in the right system, and for a condo, to know the building's structural inspection status before signing",
      titlePromise: 'where and how to search Broward County and Fort Lauderdale permits, plus the condo inspection reports to ask for',
      stopCondition: STOP,
    },
    meta: "Search Broward permits by address or folio in the county's BCS or a city portal like LauderBuild, and what a condo's inspection reports should show.",
    quick:
      "Start with the city on the address. Broward County's Search for Permit by Address finds county-issued permits by address, folio or " +
      'parcel ID, and the county is the permit authority for unincorporated Broward. Inside a city, search that city\'s portal, such as Fort ' +
      "Lauderdale's LauderBuild. Buying a condo? Ask for the building's safety and milestone inspection reports too.",
    required: ['Statutes § 553.899', '05-05', '25 years', '3,500 square feet', '31 cities', 'LauderBuild'],
  },
  {
    id: 220, md: 'santa-clara-county-permit-search.md',
    brief: {
      slug: 'check-building-permits-santa-clara-county-ca', targetQuery: 'sjpermits',
      capture: '2026-10-03-demand-santa-clara-county-permits-bing', intent: 'navigational',
      who: 'a buyer in contract on a house in San José or elsewhere in Santa Clara County who wants its permit history and, if possible, its original plans',
      want: "which building department holds the house's records, how to search SJPermits or the county portal, and whether the plans can be obtained",
      achieve: 'to confirm past work was finaled before closing, and to know whether asking for the original plans is worth the effort',
      titlePromise: 'how to search Santa Clara County and San José permits, and how California handles a house\'s original plans',
      stopCondition: STOP,
    },
    meta: "Search Santa Clara County permits in the county portal or San José's SJPermits, and find out whether a California house's original plans exist.",
    quick:
      "It depends on the jurisdiction. Unincorporated property is in the county's Public Permit Portal, searchable by address or parcel number " +
      'without an account. San José records are on SJPermits, where anyone can see each permit\'s status; look for Finaled. Other cities run their ' +
      'own systems. Original plans may not exist: California law does not require them to be filed for most houses of two stories or less.',
    required: ['Code § 19850', '§ 19851', 'Finaled', 'View Permit/File', 'Search Records'],
  },
];

const BANNED = [/\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i, /^## Step \d/m];

const tri = (s: string) => { const w = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean); const out = new Set<string>(); for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`); return out; };

async function main() {
  validateBriefs(PAGES.map((p) => p.brief));
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, status FROM articles`)) as unknown as Array<{ id: number; slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  const built = PAGES.map((p) => {
    const raw = fs.readFileSync(path.join('guides', p.md), 'utf8');
    const title = raw.match(/^#\s+(.*)$/m)![1].trim();
    const body = raw.replace(/^#\s.*\n+/, '').trim();
    return { ...p, title, body };
  });
  for (const p of built) {
    const tag = p.brief.slug;
    const row = rows.find((r) => r.id === p.id);
    if (!row || row.slug !== tag || row.status !== 'removed') fail(`${tag}: expected removed row #${p.id}, found ${row?.slug}/${row?.status}`);
    if (p.title.length > 60) fail(`${tag}: title ${p.title.length}`);
    if (p.meta.length < 70 || p.meta.length > 155) fail(`${tag}: meta ${p.meta.length}`);
    if (p.quick.length < 120 || p.quick.length > 450) fail(`${tag}: quick ${p.quick.length}`);
    const topic = guideTopic(tag, p.title); if (topic !== 'permits') fail(`${tag}: cluster ${topic}`);
    for (const r of p.required) if (!p.body.includes(r)) fail(`${tag}: missing "${r}"`);
    for (const b of BANNED) for (const t of [p.body, p.quick, p.meta]) { const m = t.match(b); if (m) fail(`${tag}: banned "${m[0]}"`); }
    if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(p.body)) fail(`${tag}: link nested in bold`);
    for (const m of p.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`${tag}: dead link ${m[1]}`);
    const first = p.body.split(/(?<=\.)\s/)[0];
    console.log(`\n  ${tag}  [${topic}]\n    title (${p.title.length})  ${p.title}\n    meta  (${p.meta.length})\n    quick (${p.quick.length})\n    body  ${p.body.split(/\s+/).length} words | opens: ${first.slice(0, 90)}…`);
  }
  for (let i = 0; i < built.length; i++) for (let j = i + 1; j < built.length; j++) {
    const a = tri(built[i].body), b = tri(built[j].body); const jac = [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size;
    if (jac > 0.08) fail(`${built[i].brief.slug} vs ${built[j].brief.slug}: trigram overlap ${(jac * 100).toFixed(1)}% (templated?)`);
    else console.log(`  overlap ${built[i].brief.slug.replace('check-building-permits-', '')} / ${built[j].brief.slug.replace('check-building-permits-', '')}: ${(jac * 100).toFixed(1)}%`);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  fs.mkdirSync('backups', { recursive: true });
  for (const p of built) {
    const old = (await withDb((sql) => sql`SELECT * FROM articles WHERE id = ${p.id}`)) as unknown as any[];
    fs.writeFileSync(`backups/${p.brief.slug}-before-restore-${Date.now()}.json`, JSON.stringify(old, null, 2));
    // Slug is never written. published_at keeps the original date; updated_at marks the rewrite. Old FAQs described old text.
    const res = (await withDb((sql) => sql`
      UPDATE articles SET title = ${p.title}, meta_description = ${p.meta}, quick_answer = ${p.quick}, body_markdown = ${p.body},
        sources_json = '[]', faq_json = '[]', status = 'published', updated_at = now()
      WHERE id = ${p.id} AND slug = ${p.brief.slug} AND status = 'removed' RETURNING id`)) as unknown as any[];
    if (res.length !== 1) throw new Error(`ABORT: ${p.brief.slug} restore affected ${res.length} rows`);
    console.log(`  restored #${p.id} ${p.brief.slug}`);
  }
  console.log('\n  next: prunedGuides, Permit Pulse (ONLY=), article-faqs, hub links, targetKeywords, build');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
