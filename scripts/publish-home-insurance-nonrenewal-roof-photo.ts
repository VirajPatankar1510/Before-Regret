// Publish "Home Insurance Nonrenewal After a Roof Photo? What Homeowners Can Do" (owner request 2026-10-13, exact
// 68-character title). Owner chose a NEW homeowner page over merging into #312 (home-insurance-aerial-photos-roof,
// buyer audience, title test until 2026-11-11); after that read, #312 should get a buyer-focused title.
//
//   npx tsx scripts/publish-home-insurance-nonrenewal-roof-photo.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-insurance-nonrenewal-roof-photo.ts
//
// Facts: data/fact-ledgers/home-insurance-nonrenewal-roof-photo.json -- Texas Ins. Code 551.002/551.105,
// Florida 627.4133/627.7011, 12 CFR 1024.37 (re-used from the #329 ledger), PA Notice 2024-06 (54 Pa.B. 2908,
// pacodeandbulletin.gov), Maine Bureau of Insurance hearing FAQ, NAIC complaint page. No insurer is named.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const OWNER_TITLE = 'Home Insurance Nonrenewal After a Roof Photo? What Homeowners Can Do';
const SIBLINGS = ['home-insurance-aerial-photos-roof', 'home-insurance-cancelled-after-buying-house-roof', 'prove-roof-age-for-insurance'];
const STOP =
  'Read 2026-11-24: shown on Google or Bing for at least one roof-photo or aerial-imagery nonrenewal search. If it ' +
  'is shown only for searches #312 already earned, fold it into #312 (owner OK first).';
const BRIEFS: ArticleBrief[] = [
  {
    slug: 'home-insurance-nonrenewal-roof-photo',
    targetQuery: 'aerial imagery insurance',
    capture: '2026-10-13-demand-aerial-imagery-insurance-gsc',
    intent: 'informational',
    who: 'a homeowner whose insurer has sent a nonrenewal notice based on an aerial or drone photo of the roof',
    want: 'what they can do between the notice and the renewal date to contest it or keep coverage',
    achieve: 'to get the reason and image in writing, answer it with their own evidence, appeal or complain, and avoid a lapse',
    titlePromise: 'what homeowners can do after a home insurance nonrenewal based on a roof photo',
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
  const eifs = { costToCheck: '', typicalRepairCost: '' };
  const expectedTopic = guideTopic('home-insurance-aerial-photos-roof', 'Roof Flagged by Aerial Photos? How to Appeal a Nonrenewal');

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
    // Owner 2026-10-13 chose this exact 85-character title for page and Google alike ("Exact everywhere"),
    // knowing Google truncates it; assert-canonical-urls.ts carries the same one-page exception.
    if (p.title !== OWNER_TITLE) fail(`${p.slug}: title is not the owner's exact title`);
    if (p.meta.length < 70 || p.meta.length > 155) fail(`${p.slug}: meta ${p.meta.length} chars`);
    if (isQuestionTitle(p.title) && (p.quick.length < 120 || p.quick.length > 450)) fail(`${p.slug}: quick answer ${p.quick.length} chars`);
    if (!isQuestionTitle(p.title) && p.quick) fail(`${p.slug}: non-question title carries a quick answer`);
    const topic = guideTopic(p.slug, p.title);
    if (topic !== expectedTopic) fail(`${p.slug}: topic "${topic}", expected ${expectedTopic} like its sibling deck guides`);
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
