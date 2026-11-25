// Publish /guides/fema-flood-zone-letters-meaning/ -- what each FEMA flood zone letter means for a home buyer.
// A NEW URL. The closest published page, /guides/flood-zone-by-address/ (#?), groups the letters into three rows and
// is about LOOKING UP an address; this page owns "what does zone D / B / AE mean" and is never edited into it.
//
//   npx tsx scripts/publish-fema-flood-zone-letters-meaning.ts            # dry run
//   APPLY=true npx tsx scripts/publish-fema-flood-zone-letters-meaning.ts
//
// WHY. Owner's GSC regex export 2026-11-25 (last 16 months, all on /guides/flood-zone-by-address/): fema flood zone d
// (3 impr, pos 93.67), fema flood zone b (1, 86), what is a fema flood zone (1, 93), fema flood zones (1, 100),
// flood zone fema (1, 37), fema flood rating (1, 45). Owner chose the page 2026-11-25. Definitional format, tiny
// demand: an EXPERIMENT (the Sep 2026 definitional cluster collapse is the warning), stop condition below.
//
// DECISION MAP. Reader's question: "The listing / lender says flood zone AE (or X, or D). What does that mean for me?"
//   what does each letter mean?                -> section: letter table from 44 CFR 64.3 + A / V / B-C-X / D sections
//   how often do claims come from each letter? -> section: our OpenFEMA NfipClaims v3 pull by rated zone (first-party)
//   will the lender require flood insurance?   -> short section: 4012a + 64.3(b) list; detail lives on flood-zone-by-address
//   must the lender warn me before I sign?     -> section: 4104a written notice before the purchase agreement
//   does the zone set the price?               -> short section: Risk Rating 2.0 quote; quote for the address
//   can I keep the seller's policy/discount?   -> section line: FEMA assignment quote
//   can I renovate / add on?                   -> section: 50% substantial improvement, 60.3(c)(2), AO depth, V pilings, floodway
//   how do I find the zone for an address?     -> link out to /guides/flood-zone-by-address/ (not repeated)
//   what is in shaded X exactly (subtypes)?    -> skipped: NFHL service unreachable from our network
//
// Facts: data/fact-ledgers/fema-flood-zone-letters-meaning.json. Claims: docs/data/flood-zone-letter-claims.json
// (scripts/fetch-flood-zone-letter-claims.ts).
// READ 2026-12-30 at the earliest: seen / chosen / acted.
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
const SLUG = 'fema-flood-zone-letters-meaning';
const TITLE = 'What Do FEMA Flood Zone Letters Mean? AE, X, D and More';
const TOPIC = 'environmental';
const IMAGES: string[] = [];
const LEDGER = path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`);
const SIBLINGS = [
  'flood-zone-by-address',
  'hurricane-flood-insurance-gulf-coast-homebuyers',
  'hurricane-home-checklist-flood-insurance',
];
const STOP =
  'Read 5 weeks after going live: shown on Google for at least one zone-letter query ("fema flood zone d", "zone b", ' +
  '"what is a fema flood zone", "ae", "x") at a better position than the site had (86-100). If not, no more definitional ' +
  'flood pages; stay with by-address and permit pages.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'fema flood zone d',
  capture: '2026-11-25-gsc-regex-fema-export',
  intent: 'informational',
  who: 'a US home buyer whose listing, lender or flood map shows a zone letter such as AE, X or D and who does not know what it means',
  want: 'to know what the letter means, whether the lender will require flood insurance, and whether it limits renovating',
  achieve: 'to ask the lender, seller and insurer the right questions before signing, and plan any renovation around the floodplain rules',
  titlePromise: 'what each FEMA flood zone letter means, including AE, X and D',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'What does the flood zone letter on this house mean for me as a buyer?',
  firstScreen: 'The quick answer (A and V = high risk and lender-required insurance; B/C/X outside; D = never studied; the letter no longer sets the price) and the letter-by-letter table.',
  firstParty: [
    { what: 'Our count of all FEMA NFIP flood insurance claims by the zone each was rated in (OpenFEMA NfipClaims v3, every record pulled 2026-11-25), including Zone D and the old B and C zones', source: 'docs/data/flood-zone-letter-claims.json' },
    { what: 'The script that pulls and aggregates the claims, so anyone can re-run the count', source: 'scripts/fetch-flood-zone-letter-claims.ts' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the regulations and statutes read on 2026-11-25, our claims pull, and the NFHL service that did not answer',
    'claims table computed from docs/data/flood-zone-letter-claims.json',
  ],
  beyondCommonFacts: [
    '44 CFR 64.3(b) puts A99 and AR (levee zones) on the mandatory-purchase list, and leaves D off it',
    '42 U.S.C. 4104a: the lender must warn the buyer in writing a reasonable period before the purchase agreement is signed',
    'substantial improvement (50% of market value) in AE/AH triggers elevating the lowest floor including basement (44 CFR 60.3(c)(2)); AO uses the depth number or two feet',
    'a seller can assign an NFIP policy and its discount to the buyer at closing (FEMA pricing page)',
    'our claim counts per zone letter, which no zone explainer publishes',
  ],
  reproducibilityCheck: 'Top results for zone letters are FEMA glossary pages and insurer or agent explainers listing definitions. None counts claims by zone letter from FEMA\'s own claims records, and none ties each letter to the 4104a notice, the A99/AR mandatory-purchase listing, or the renovation elevation rules a buyer hits after closing.',
  discussion: 'needed',
  discussionReason: 'The letter means different things for the loan, the price and future renovation, and the reader has to weigh which one matters for this house (Zone D in particular needs judgement, not a definition).',
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
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars (question title needs 120-450)`);
  if (guideTopic(SLUG, title) !== TOPIC) fail(`topic ${guideTopic(SLUG, title)}, expected ${TOPIC}`);

  const firstPara = body.split(/\n\s*\n/)[0];
  void firstPara;
  for (const img of IMAGES)
    if (!body.includes(`](${img} `) || !fs.existsSync(path.join(process.cwd(), 'public', img))) fail(`screenshot ${img} missing from body or disk`);
  if (/__[A-Z_]+__/.test(body)) fail('draft still has a placeholder');
  for (const r of ['64.3', '4012a', '4104a', '60.3', 'Zone D', 'How we checked this', '](/guides/flood-zone-by-address/)'])
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
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: article-faqs, build, IndexNow (no Permit Pulse block: not a permit page)`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
