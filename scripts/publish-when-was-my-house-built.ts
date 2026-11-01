// Publish "When Was My House Built? How to Find Out by Address" (owner, 2026-11-01: "write the next article").
//
//   npx tsx scripts/publish-when-was-my-house-built.ts            # dry run
//   APPLY=true npx tsx scripts/publish-when-was-my-house-built.ts
//
// Facts: data/fact-ledgers/when-was-my-house-built-by-address.json -- 40 CFR 745.103/.107/.110, the EPA/HUD 1996
// interpretive guidance (Q6: the permit date decides "constructed prior to 1978"), Sarasota and Gunnison assessor
// definitions, Census ACS subject definitions. First-party: our screenshot of a county-owned Sarasota parcel record,
// our tally of Census B25034 across 3,144 counties, and the era table, which this script checks against the report
// engine's PRIORITY_RULES at run time so the page can never drift from the report.
// Demand: tier 2 -- Bing records "when was my house built" and "... by address"; this site was shown for neither.
// A new subject for the "records by address" job -> experiment.
//
// READ 2026-12-06: shown on Google or Bing for at least one "when was my house built" / "year built" search. If
// not, stop the house-age line and offer the owner to fold the 1978 section into the oldest-housing study page.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES, CURRENT_YEAR } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'when-was-my-house-built-by-address';
const TITLE = 'When Was My House Built? How to Find Out by Address';
const TOPIC = 'house-age';
const SIBLINGS = ['look-up-building-permits-by-address', 'us-housing-age-ranking-oldest-vs-newest-counties', 'how-to-tell-how-old-a-roof-is', 'lead-service-line-lookup-by-address', 'find-unpermitted-work-before-buying'];
const STOP =
  'Read 2026-12-06: shown on Google or Bing for at least one "when was my house built" or "year built" search. ' +
  'If not, stop the house-age line and offer the owner to fold the 1978 section into the oldest-housing study.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'when was my house built',
  capture: '2026-11-01-demand-when-was-my-house-built-bing',
  intent: 'navigational',
  who: 'a buyer or new owner who has an address and wants the year the house was built, and whether that year is right',
  want: 'the record that holds the year, how to read it without confusing it with an effective year, and which date wins when records disagree',
  achieve: 'to know the real construction year, and so which era checks and which federal lead-paint paperwork apply to the house',
  titlePromise: 'how to find a house\'s year built from its address',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I have the address. When was this house built, and can I trust the year the record shows?',
  firstScreen: 'The quick answer names the record (county assessor parcel record), warns off Effective Year Built, and flags the 1978 permit-date rule; the opening says why the year matters.',
  firstParty: [
    { what: 'Screenshot of a county-owned Sarasota parcel record showing six buildings with separate Year Built and Eff Yr Built (1926 vs 2001)', source: 'public/images/assessor-year-built-vs-effective-year-built.webp' },
    { what: 'Our tally of Census B25034 across 3,144 counties: 49.7% of US housing units built before 1980, 14.2% in the 1970s', source: 'docs/data/oldest-housing-raw.json' },
    { what: 'Era table generated from our report engine rules and checked against them at run time', source: 'src/engine/inspectionPriorities.ts' },
  ],
  evidenceOfWork: [
    'screenshot public/images/assessor-year-built-vs-effective-year-built.webp',
    'visible "How we checked this" naming what we read, did and left out on 1 November 2026',
    'ledger data/fact-ledgers/when-was-my-house-built-by-address.json',
  ],
  beyondCommonFacts: [
    'EPA/HUD 1996 guidance Q6: "constructed prior to 1978" means a construction permit obtained before January 1, 1978, so a record showing 1978 does not settle the lead disclosure',
    'Sarasota defines year built as completion; Gunnison as the year the construction permit was initiated -- the same house can carry different years',
    'One parcel can list several buildings, each with its own year built (our Sarasota observation: six)',
    'Effective year built is an appraisal of condition, not construction (Sarasota, Gunnison definitions)',
    '40 CFR 745.110 gives a 10-day lead inspection period, changeable or waivable only in writing',
  ],
  reproducibilityCheck: 'Top results say "check the county assessor or Zillow". They do not show a real record with several buildings, contrast two counties\' definitions, connect the definitions to the EPA/HUD permit-date test for 1978, or map the year to era checks from a report engine.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh records that disagree (completion year, permit year, effective year) and decide which governs, which changes the federal lead-paint obligations around 1978.',
};

// The era table must match the engine exactly: one row per rule, label derived from its window.
const TABLE_RULES: Array<[string, string]> = [
  ['lead_paint_disclosure', 'federal lead-paint disclosure'],
  ['knob_and_tube', 'knob-and-tube'],
  ['electrical_aluminum_wiring', 'aluminum branch-circuit wiring'],
  ['electrical_panel_brand', 'panel\'s brand'],
  ['sewer_cast_iron', 'cast iron sewer'],
  ['galvanized_supply', 'galvanized steel supply'],
  ['polybutylene_supply', 'polybutylene supply'],
  ['asbestos_materials', 'asbestos'],
  ['eifs_stucco', 'EIFS'],
  ['roof_age', 'roof, HVAC and water heater'],
  ['hvac_age', 'roof, HVAC and water heater'],
];
function windowLabel(id: string): string {
  const r = PRIORITY_RULES.find((x) => x.id === id);
  if (!r) throw new Error(`engine has no rule ${id}`);
  if (r.maxYear === CURRENT_YEAR - 12) return '12 or more years ago';
  if (id === 'lead_paint_disclosure') return `before ${r.maxYear + 1}`;
  if (r.minYear === 1800) return `${r.maxYear} or earlier`;
  return `${r.minYear}–${r.maxYear}`;
}

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };

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
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`), 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  const moved = rows.filter((r) => r.status === 'published' && r.slug !== SLUG && guideTopic(r.slug, r.title) === TOPIC);
  if (moved.length) fail(`${TOPIC} bucket reclassifies existing guides: ${moved.map((r) => r.slug).join(', ')}`);
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (!title.endsWith('?') && !/\?/.test(title)) fail('quick answer on a non-question title');
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);
  if (!fs.existsSync(path.join(process.cwd(), 'public', 'images', 'assessor-year-built-vs-effective-year-built.webp'))) fail('screenshot missing');

  // Era table vs engine.
  const tableRows = body.split('\n').filter((l) => /^\| (before|\d)/.test(l));
  for (const [id, needle] of TABLE_RULES) {
    const label = windowLabel(id);
    const row = tableRows.find((l) => l.includes(needle));
    if (!row) { fail(`no table row for ${id} ("${needle}")`); continue; }
    if (!row.startsWith(`| ${label} |`)) fail(`row for ${id} says "${row.split('|')[1].trim()}", engine says "${label}"`);
  }
  if (tableRows.length !== new Set(TABLE_RULES.map(([, n]) => n)).size) fail(`table has ${tableRows.length} rows, expected ${new Set(TABLE_RULES.map(([, n]) => n)).size}`);

  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words, ${tableRows.length} era rows checked against the engine`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
