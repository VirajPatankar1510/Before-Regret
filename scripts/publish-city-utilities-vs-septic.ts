// Publish "City Utilities vs Septic: Don't Be Surprised by Water & Sewer Costs" -- #2 of
// docs/plans/report-4-articles-2026-11.md (owner's exact title, 67 chars, kept by the owner 2026-11-02; allowlisted in
// scripts/assert-canonical-urls.ts OWNER_LONG_TITLES).
//
//   npx tsx scripts/publish-city-utilities-vs-septic.ts            # dry run
//   APPLY=true npx tsx scripts/publish-city-utilities-vs-septic.ts
//
// Facts: data/fact-ledgers/city-utilities-vs-septic-water-sewer-costs.json -- Census working paper FY 2023-30 (Florida
// residents often misreport septic as sewer), EPA septic pages, ASHI SOP 6.2, Florida Statutes 381.00655.
// First-party: our tally of the Florida Water Management Inventory (scripts/fetch-flwmi-wastewater-stats.ts ->
// docs/data/flwmi-wastewater-stats.json), checked against the article here, and one public parcel lookup.
// Demand: tier 3 -> experiment from the owner's list.
//
// READ 2026-12-08: shown on Google or Bing for at least one septic-vs-sewer search. If not, offer the owner to fold
// the Florida inventory section into the septic inspection guide (#197; owner OK first).
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'city-utilities-vs-septic-water-sewer-costs';
const TITLE = "City Utilities vs Septic: Don't Be Surprised by Water & Sewer Costs";
const TOPIC = 'plumbing';
const SIBLINGS = ['home-inspection-include-septic-system', 'dont-skip-the-home-inspection', 'sewer-scope-before-buying-house', 'lead-service-line-lookup-by-address', 'when-was-my-house-built-by-address'];
const STOP =
  'Read 2026-12-08: shown on Google or Bing for at least one septic-vs-sewer search. ' +
  'If not, offer the owner to fold the Florida inventory section into the septic inspection guide.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'septic or city sewer',
  capture: '2026-11-03-demand-septic-or-city-sewer-bing',
  intent: 'informational',
  who: 'a buyer looking at a house where the listing does not clearly say whether it is on city sewer and water or septic and a well',
  want: 'a reliable way to find out before making an offer, and what each setup costs to own',
  achieve: 'to confirm the setup from bills, records and the yard, and ask the seller the right cost questions in writing',
  titlePromise: 'how to tell city utilities from septic and what the water and sewer costs are',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Is this house on city sewer or septic, how do I know for sure, and what will it cost me?',
  firstScreen: 'The opening gives the Census finding that many residents misreport septic as sewer, then the first section lists checks to do before the offer, starting with the utility bill.',
  firstParty: [
    { what: 'Our tally of 7,269,907 built residential parcels in the Florida Water Management Inventory by wastewater label and certainty', source: 'docs/data/flwmi-wastewater-stats.json' },
    { what: 'The script that produced the tally from the public map service, requesting totals only', source: 'scripts/fetch-flwmi-wastewater-stats.ts' },
  ],
  evidenceOfWork: [
    'table computed from docs/data/flwmi-wastewater-stats.json and checked by this script',
    'visible "How we checked this" naming each source, the lookup and what was left out',
    'ledger data/fact-ledgers/city-utilities-vs-septic-water-sewer-costs.json',
  ],
  beyondCommonFacts: [
    'Census working paper FY 2023-30: among Florida homes recorded as septic, 46.0% to 59.6% of residents reported public sewer',
    'Only 46.5% of Florida septic labels are known; 56.1% of labels were last updated in 2016 or earlier (our tally)',
    'ASHI SOP 6.2.B: the inspector is not required to determine whether water and sewage are public or private',
    'Florida Statutes 381.00655: connect within 365 days of notice; installments over up to 2 years',
  ],
  reproducibilityCheck: 'Top results list generic signs of a septic tank. None counts Florida\'s statewide inventory, cites the Census study showing residents get it wrong, notes the inspection standard does not cover it, or explains the Florida forced-connection rule.',
  discussion: 'needed',
  discussionReason: 'The reader weighs conflicting signals (seller, listing, records, bill) and the different cost profiles of sewer and septic, including a possible future connection charge.',
};

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
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60 && title.length !== 67) fail(`title ${title.length} chars (owner kept 67)`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('non-question title carries a quick answer');
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  // The FLWMI table and derived shares must match our committed tally exactly.
  const stats = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'data', 'flwmi-wastewater-stats.json'), 'utf8'));
  const w = stats.wastewater as Record<string, number>, tot = stats.builtResidentialParcels as number;
  const share = (n: number) => `${(Math.round((1000 * n) / tot) / 10).toFixed(1)}%`;
  const fmt = (n: number) => n.toLocaleString('en-US');
  const expectRows: Array<[string, number]> = [
    ['Known central sewer', w.KnownSewer], ['Likely or somewhat likely central sewer', w.LikelySewer + w.SWLSewer],
    ['Known onsite septic', w.KnownSeptic], ['Likely or somewhat likely onsite septic', w.LikelySeptic + w.SWLSeptic], ['Unknown, no data', w.UNK],
  ];
  for (const [label, n] of expectRows) {
    const row = `| ${label} | ${fmt(n)} | ${share(n)} |`;
    if (!body.includes(row)) fail(`table row does not match the tally: ${row}`);
  }
  for (const v of [fmt(tot), `${stats.derived.septicSharePct}%`, `${stats.derived.septicKnownSharePct}%`]) if (!body.includes(v)) fail(`body is missing tally figure ${v}`);
  const costRows = expectRows.length;
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick: none (non-question title)\n    body  ${body.split(/\s+/).length} words, ${costRows} inventory rows checked against docs/data/flwmi-wastewater-stats.json`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
