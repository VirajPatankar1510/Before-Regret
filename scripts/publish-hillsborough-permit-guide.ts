// Restore /guides/check-building-permits-hillsborough-county-fl/ as "Hillsborough County Permit
// Search: HillsGovHub & Tampa".
//
// A RESTORE, NOT A NEW URL. The slug already existed: article #208, published 2026-08-16 as "Tampa &
// Hillsborough County Permit Records Search" and set to status 'removed' by the 2026-09-02 prune,
// so the URL has answered 410 since. It comes back at the same address with a rewritten,
// browser-verified body -- edited rather than re-published, the rule the September restores set --
// and its old FAQs are cleared, because they described the old text.
//
//   npx tsx scripts/publish-hillsborough-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-hillsborough-permit-guide.ts
//
// WHY THIS COUNTY (2026-10-02). Google now shows every county permit guide at average positions
// 7-12, including the five restored in September that had shown nothing at 17 days. The permit
// cluster is 38% of the site's impressions. Hillsborough is the first new county of a three-county
// test (Hillsborough, Kings NY, King WA), chosen because demand was already visible: two real
// Hillsborough permit questions reached this site through Bing with no page to answer them, and
// Bing's own counts (data/keywords/2026-10-01-demand-hillsborough-county-permit-bing.json) record
// "hillsborough county permit search" and "...permit portal" -- relative counts, not volumes.
//
// EVERY PORTAL FACT WAS VERIFIED IN A BROWSER ON 2026-10-02, on hcfl.gov, tampa.gov and both
// Accela sites: HillsGovHub's Check Permit Status needs no login and searches by street or parcel,
// with a Permits by Address report; the PGM Store holds older files, shares the public/public
// login, and does not contain HillsGovHub records; Tampa's Accela searches by street or parcel and
// offers a Comprehensive Permit Summary by Address; the county removes records exempt under Florida
// Statutes 119.071. Temple Terrace and Plant City are named but their portals are not, because
// neither site could be checked (403 / no permit links). The roof figure is read from
// PRIORITY_RULES at run time.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'check-building-permits-hillsborough-county-fl',
  targetQuery: 'hillsborough county permit search',
  capture: '2026-10-01-demand-hillsborough-county-permit-bing',
  intent: 'navigational',
  who: 'a buyer under contract on a house in Tampa or unincorporated Hillsborough County who needs its permit history before the inspection period ends',
  want: 'which of the two permit systems holds the record for this address, and how to search it without a permit number',
  achieve: 'to see what work on the house was permitted and finaled, and to know what an empty result does and does not mean, before deciding whether to proceed',
  titlePromise: 'where and how to search Hillsborough County and Tampa permits by address',
  stopCondition: 'Shown by Google within 45 days (by 2026-11-16) at a position comparable to the other county guides (7-12). If not, hold Kings and King County until it is.',
};

const TITLE = 'Hillsborough County Permit Search: HillsGovHub & Tampa';
const META = "Search Hillsborough County permits by address in HillsGovHub, the older PGM Store and Tampa's Accela portal, and what an empty result really means.";
const QUICK_ANSWER =
  'It depends on where the address is. Unincorporated Hillsborough County permits are in HillsGovHub, which searches by street address with no login, ' +
  "and older files sit in the county's separate PGM Store, so search both. Addresses inside Tampa city limits are in the city's Accela Citizen Access " +
  'portal. An empty search is not proof nothing was permitted: Florida law removes some records from public view.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'hillsborough-county-permit-search.md');

function fill(md: string): string {
  const roof = PRIORITY_RULES.find((r) => r.id === 'roof_age')?.typicalRepairCost;
  const m = roof?.match(/\$[\d,]+\s*–\s*\$[\d,]+\+?/);
  if (!m) throw new Error(`ABORT: no roof range in PRIORITY_RULES: "${roof}"`);
  const out = md.replace('{{ROOF_COST}}', m[0]);
  if (/\{\{[^}]+\}\}/.test(out)) throw new Error('ABORT: unresolved token');
  return out;
}

const REQUIRED = ['HillsGovHub', 'PGM Store', 'Accela Citizen Access', '§ 119.071', "Property Appraiser's property search", 'Permits by Address', 'Comprehensive Permit Summary by Address'];
const BANNED = [/\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i, /\bmost (counties|buyers|homes)\b/i];

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const h1 = raw.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (h1 !== TITLE) fail(`markdown H1 "${h1}" does not match TITLE`);
  const body = fill(raw.replace(/^#\s.*\n+/, '').trim());

  if (TITLE.length > 60) fail(`title ${TITLE.length} chars`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length} chars`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length} chars`);
  const topic = guideTopic(BRIEF.slug, TITLE);
  if (topic !== 'permits') fail(`cluster "${topic}", expected permits`);
  if (!/\$[\d,]{3,}/.test(body)) fail('no cost figure (reproducibility rule)');
  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const t of [body, QUICK_ANSWER, META]) { const m = t.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');

  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  const existing = rows.find((r) => r.slug === BRIEF.slug);
  if (!existing || existing.status !== 'removed') fail(`expected the removed row #208, found ${existing?.status ?? 'nothing'}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead guide link ${m[1]}`);

  console.log(`\n  ${BRIEF.slug}  [${topic}]`);
  console.log(`    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK_ANSWER.length})`);
  console.log(`    body  ${body.split(/\s+/).length} words; roof line: ${body.match(/full replacement is [^.]+/)?.[0]}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  const old = (await withDb((sql) => sql`SELECT * FROM articles WHERE id = 208`)) as unknown as any[];
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(`backups/hillsborough-208-before-restore-${Date.now()}.json`, JSON.stringify(old, null, 2));
  // Slug is never written. published_at keeps the original date; updated_at marks the rewrite.
  const res = (await withDb((sql) => sql`
    UPDATE articles SET title = ${TITLE}, meta_description = ${META}, quick_answer = ${QUICK_ANSWER},
      body_markdown = ${body}, sources_json = ${JSON.stringify(SOURCES)}, faq_json = '[]',
      status = 'published', updated_at = now()
    WHERE id = 208 AND slug = ${BRIEF.slug} AND status = 'removed' RETURNING id`)) as unknown as any[];
  if (res.length !== 1) throw new Error(`ABORT: restore affected ${res.length} rows`);
  console.log(`  wrote ${BRIEF.slug}\n  next: Permit Pulse block (ONLY=), article-faqs, permits hub link, targetKeywords, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
