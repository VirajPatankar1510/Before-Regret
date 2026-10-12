// Publish stucco cluster pages 5 and 6 (owner go 2026-10-13: "repair + Dryvit, go with your picks"):
//   stucco-repair-before-buying-house   "Stucco Repair on a House You're Buying: Patch or Red Flag?"
//   dryvit-house-what-it-means-buyer    "Listing Says Dryvit? What It Means for a Buyer"
//
//   npx tsx scripts/publish-stucco-cluster-de.ts            # dry run
//   APPLY=true npx tsx scripts/publish-stucco-cluster-de.ts
//
// Evidence (Bing related searches, 90 days, relative only, captures 2026-10-12-demand-stucco-*):
// "stucco repair" 1,042, "stucco repair near me" 419, "stucco patch" 228; "dryvit" 1,974,
// "dryvit systems" 404, "dryvit eifs" 286, "dryvit stucco" 272. Exact buyer phrasings are tier 3, so
// both pages are experiments with the stop condition below.
// Facts: data/fact-ledgers/<slug>.json. NPS Preservation Brief 22 (Grimmer), text extracted from the
// nps.gov PDF; dryvit.com home, EIFS and stucco-assembly pages (browser); IRC 2021 R703.9; engine.
//
// BRAND RULE for the Dryvit page (owner discussion 2026-10-13): no logo, a no-affiliation line,
// every claim about Dryvit quoted from Dryvit's own site, moisture risk attributed to barrier EIFS
// in general, no brand comparisons. Enforced below: no failure words within 120 characters of
// "Dryvit".
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SIBLINGS = [
  'standard-home-inspection-check-eifs-stucco-moisture', 'eifs-vs-stucco-how-to-tell',
  'buy-house-with-eifs-stucco', 'how-to-choose-eifs-stucco-inspector',
];
const STOP =
  'Read 2026-11-24: shown on Google or Bing for at least one stucco repair or Dryvit search. If not shown by then, ' +
  'fold into the closest stucco guide (owner OK first).';
const BRIEFS: ArticleBrief[] = [
  {
    slug: 'stucco-repair-before-buying-house',
    targetQuery: 'stucco repair',
    capture: '2026-10-12-demand-stucco-remediation-bing',
    intent: 'informational',
    who: 'a buyer who has spotted fresh patches or repairs on the stucco of a house they want to buy',
    want: 'whether a stucco patch is routine upkeep or a sign of water damage, and what to ask about it',
    achieve: 'to get the cause and the repair history in writing, and a specialist survey booked if the patch warrants it',
    titlePromise: 'whether stucco repairs on a house you are buying are a harmless patch or a red flag',
    stopCondition: STOP,
  },
  {
    slug: 'dryvit-house-what-it-means-buyer',
    targetQuery: 'dryvit house',
    capture: '2026-10-12-demand-eifs-bing',
    intent: 'informational',
    who: 'a buyer who saw the word Dryvit on a listing, disclosure or inspection report for a house they want',
    want: 'what the Dryvit name tells them about the walls, and what it leaves unanswered',
    achieve: 'to confirm the wall type and system and get a moisture survey booked before the inspection period ends',
    titlePromise: 'what it means for a buyer when a listing says the house has Dryvit',
    stopCondition: STOP,
  },
];

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };
const isQuestionTitle = (t: string) => /\?/.test(t) || /^(can|could|does|do|did|is|are|was|should|will|would|what|when|where|which|who|why|how)\b/i.test(t.trim());

async function main() {
  validateBriefs(BRIEFS);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const eifs = PRIORITY_RULES.find((r) => r.id === 'eifs_stucco')!;

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
    const all = `${p.title}\n${p.meta}\n${p.quick}\n${p.body}`;
    if (rows.some((r) => r.slug === p.slug)) fail(`${p.slug}: slug already exists`);
    if (p.title.length > 60) fail(`${p.slug}: title ${p.title.length} chars`);
    if (p.meta.length < 70 || p.meta.length > 155) fail(`${p.slug}: meta ${p.meta.length} chars`);
    if (isQuestionTitle(p.title) && (p.quick.length < 120 || p.quick.length > 450)) fail(`${p.slug}: quick answer ${p.quick.length} chars`);
    if (!isQuestionTitle(p.title) && p.quick) fail(`${p.slug}: non-question title carries a quick answer`);
    const topic = guideTopic(p.slug, p.title);
    if (topic !== 'stucco') fail(`${p.slug}: topic "${topic}", expected stucco`);
    if (!p.body.includes(eifs.costToCheck)) fail(`${p.slug}: engine survey figure not quoted verbatim`);
    const ledgerText = JSON.stringify(p.ledger.facts) + eifs.costToCheck + (eifs.typicalRepairCost ?? '');
    for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,]+$/, '');
      if (/^(19|20)\d0s$/.test(tok)) continue;
      if (!ledgerText.includes(tok)) fail(`${p.slug}: number "${tok}" is in no ledger entry`);
    }
    for (const re of [
      /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
      /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens)\b/,
      /\bguarantee/i, /\bread on\b/i, /\bdelve|furthermore|crucial|when it comes to\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
    ]) if (re.test(all)) fail(`${p.slug}: banned pattern ${re}`);
    // Brand rule: no failure wording within 120 characters of the brand name.
    for (const m of all.matchAll(/dryvit/gi)) {
      const win = all.slice(Math.max(0, m.index! - 120), m.index! + 120);
      const hit = win.match(/\b(problems?|defects?|defective|fail(s|ed|ure|ures)?|lawsuits?|litigation|leaks?|leaky|rot(ten|ting)?|faulty|class action)\b/i);
      if (hit) fail(`${p.slug}: "${hit[0]}" within 120 chars of "Dryvit": …${win.replace(/\n/g, ' ')}…`);
    }
    if (p.slug.startsWith('dryvit') && !/isn't affiliated with Dryvit/.test(p.body)) fail(`${p.slug}: missing the no-affiliation line`);
    for (const m of p.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1]) && !batch.has(m[1])) fail(`${p.slug}: dead link ${m[1]}`);
    for (const sib of [...SIBLINGS, ...pages.filter((q) => q.slug !== p.slug).map((q) => q.slug)]) {
      const other = published.get(sib) ?? pages.find((q) => q.slug === sib)?.body ?? '';
      const ov = overlap(p.body, other);
      console.log(`    ${p.slug} vs ${sib}: ${(ov * 100).toFixed(1)}%`);
      if (ov > 0.08) fail(`${p.slug}: overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
    }
  }
  const heads = pages.flatMap((p) => p.body.match(/^#{2,3} .*/gm) ?? []);
  if (new Set(heads).size !== heads.length) fail('duplicate heading across the batch');
  for (const p of pages) console.log(`\n  ${p.slug}\n    title (${p.title.length})  ${p.title}\n    meta  (${p.meta.length})  ${p.meta}\n    quick (${p.quick.length})  ${p.quick}\n    body  ${p.body.split(/\s+/).length} words`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  for (const p of pages) {
    await withDb((sql) => sql`
      INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
      VALUES (${p.slug}, ${p.title}, ${p.meta}, ${p.quick}, ${p.body}, '[]', 'published', 'guide', 'standard', now())`);
    console.log(`  wrote ${p.slug}`);
  }
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
