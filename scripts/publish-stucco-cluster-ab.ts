// Publish stucco cluster pages A and B (marketing/cluster-plan.md, owner go 2026-10-12):
//   A  eifs-vs-stucco-how-to-tell   "EIFS vs Stucco: How to Tell Which Your House Has"
//   B  buy-house-with-eifs-stucco   "Should You Buy a House With EIFS? What to Check First"
//
//   npx tsx scripts/publish-stucco-cluster-ab.ts            # dry run
//   APPLY=true npx tsx scripts/publish-stucco-cluster-ab.ts
//
// One script for both because they link to each other: published one at a time, the first would
// carry a dead link. Facts: data/fact-ledgers/<slug>.json, verified 2026-10-12 at the 2021 IRC
// (codes.iccsafe.org, browser), 22 Tex. Admin. Code § 535.227 (law.cornell.edu), Erickson / Lerch
// Bates on telling EIFS from stucco, and PRIORITY_RULES id eifs_stucco (read here, never retyped).
// Evidence: tier 1, capture 2026-10-12-demand-eifs-gsc ("should i buy a house with eifs stucco"
// at position 3.3 on the anchor; "how to identify synthetic stucco"). Anchor and both pages sit in
// the new `stucco` topic bucket, which is the sponsored cluster.
//
// Who / want / achieve are in the briefs below. No insurer is named; the pages tell the buyer to ask
// their own insurer, and leave lender and insurer behaviour to the anchor's hedged section.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const ANCHOR = 'standard-home-inspection-check-eifs-stucco-moisture';
const STOP =
  'Read 2026-11-20: each page shown on Google or Bing for at least one EIFS or stucco search, and the anchor keeps its ' +
  '"eifs stucco evaluations" impressions. A page not shown by then is folded into the anchor (owner OK first).';

const BRIEFS: ArticleBrief[] = [
  {
    slug: 'eifs-vs-stucco-how-to-tell',
    targetQuery: 'how to identify synthetic stucco',
    capture: '2026-10-12-demand-eifs-gsc',
    intent: 'informational',
    who: 'a buyer touring a house listed as stucco who suspects the walls might be synthetic EIFS',
    want: 'quick hands-on checks that tell EIFS from traditional stucco, and how far each one can be trusted',
    achieve: 'to know whether to book an EIFS moisture survey before making or keeping an offer',
    titlePromise: 'how to tell whether your house has EIFS or traditional stucco',
    stopCondition: STOP,
  },
  {
    slug: 'buy-house-with-eifs-stucco',
    targetQuery: 'should i buy a house with eifs stucco',
    capture: '2026-10-12-demand-eifs-gsc',
    intent: 'informational',
    who: 'a buyer under contract on a 1990s or 2000s house with EIFS who must decide before the inspection period ends',
    want: 'whether an EIFS house is a reasonable buy and what to check, in what order',
    achieve: 'to get a moisture survey and the seller paperwork in time to proceed, renegotiate or walk away',
    titlePromise: 'whether to buy a house with EIFS, and what to check first',
    stopCondition: STOP,
  },
];

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => {
  const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size;
};
const isQuestionTitle = (t: string) =>
  /\?/.test(t) || /^(can|could|does|do|did|is|are|was|should|will|would|what|when|where|which|who|why|how)\b/i.test(t.trim());

async function main() {
  validateBriefs(BRIEFS);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };

  const eifs = PRIORITY_RULES.find((r) => r.id === 'eifs_stucco');
  if (!eifs) throw new Error('PRIORITY_RULES has no eifs_stucco rule');
  const repair = (eifs.typicalRepairCost ?? '').replace(/^Varies widely; extensive /, '').trim(); // "sheathing replacement can exceed $10,000"

  const pages = BRIEFS.map((b) => {
    const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${b.slug}.md`), 'utf8');
    const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
    const field = (k: string) => (front[1].match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
    const rest = raw.slice(front[0].length);
    const title = rest.match(/^#\s+(.*)$/m)![1].trim();
    const body = rest.replace(/^#\s.*\n+/, '').trim();
    const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${b.slug}.json`), 'utf8'));
    return { slug: b.slug, title, meta: field('meta'), quick: field('quick'), body, ledger };
  });
  const batch = new Set(pages.map((p) => p.slug));

  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));

  for (const p of pages) {
    const all = `${p.meta}\n${p.quick}\n${p.body}`;
    if (rows.some((r) => r.slug === p.slug)) fail(`${p.slug}: slug already exists`);
    if (p.title.length > 60) fail(`${p.slug}: title ${p.title.length} chars`);
    if (p.meta.length < 70 || p.meta.length > 155) fail(`${p.slug}: meta ${p.meta.length} chars`);
    if (isQuestionTitle(p.title)) {
      if (p.quick.length < 120 || p.quick.length > 450) fail(`${p.slug}: question title needs a quick answer of 120-450 chars (has ${p.quick.length})`);
    } else if (p.quick) fail(`${p.slug}: not a question title, so no quick answer (owner rule 2026-10-09)`);
    const topic = guideTopic(p.slug, p.title);
    if (topic !== 'stucco') fail(`${p.slug}: topic "${topic}", expected stucco`);

    // The engine's survey figure, verbatim -- a retyped number drifts from the report.
    if (!p.body.includes(eifs.costToCheck)) fail(`${p.slug}: body does not quote the engine survey figure "${eifs.costToCheck}"`);
    if (p.slug === 'buy-house-with-eifs-stucco' && !p.body.includes(repair)) fail(`${p.slug}: body does not carry the engine repair wording "${repair}"`);

    // Every number on the page must be in the ledger (claims or quotes) or be the engine text.
    const ledgerText = JSON.stringify(p.ledger.facts) + eifs.costToCheck + (eifs.typicalRepairCost ?? '');
    for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./]*/g)) {
      const tok = m[0].replace(/[.,]+$/, '');
      if (/^(19|20)\d0s$/.test(tok)) continue;
      if (!ledgerText.includes(tok)) fail(`${p.slug}: number "${tok}" is in no ledger entry`);
    }
    // Wording the site does not allow.
    for (const re of [
      /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
      /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens)\b/,
      /\bguarantee/i, /\bread on\b/i, /\bdelve|furthermore|crucial|when it comes to\b/i,
      /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
    ]) if (re.test(all)) fail(`${p.slug}: banned pattern ${re}`);
    for (const m of p.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) {
      if (!published.has(m[1]) && !batch.has(m[1])) fail(`${p.slug}: dead link ${m[1]}`);
    }
    const ov = overlap(p.body, published.get(ANCHOR) ?? '');
    console.log(`    ${p.slug}: overlap with anchor ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`${p.slug}: overlap ${(ov * 100).toFixed(1)}% with the anchor`);
  }
  const ab = overlap(pages[0].body, pages[1].body);
  console.log(`    A vs B overlap ${(ab * 100).toFixed(1)}%`);
  if (ab > 0.08) fail(`A and B overlap ${(ab * 100).toFixed(1)}%`);
  const heads = pages.flatMap((p) => p.body.match(/^#{2,3} .*/gm) ?? []);
  if (new Set(heads).size !== heads.length) fail('duplicate heading across the batch');

  for (const p of pages) {
    console.log(`\n  ${p.slug}\n    title (${p.title.length})  ${p.title}\n    meta  (${p.meta.length})  ${p.meta}\n    quick (${p.quick.length})  ${p.quick || '(none: not a question title)'}\n    body  ${p.body.split(/\s+/).length} words\n    ${(p.body.match(/^#{2,3} .*/gm) ?? []).join('\n    ')}`);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  for (const p of pages) {
    await withDb((sql) => sql`
      INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
      VALUES (${p.slug}, ${p.title}, ${p.meta}, ${p.quick}, ${p.body}, '[]', 'published', 'guide', 'standard', now())`);
    console.log(`  wrote ${p.slug}`);
  }
  console.log('\n  next: quality gate, build, push, verify live, IndexNow, FAQs, inbound links\n');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
