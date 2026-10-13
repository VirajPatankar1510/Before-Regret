// Publish "Buying a House With an Unpermitted Deck? What to Check Before Closing" (owner request 2026-10-13,
// exact title, 70 characters: same "exact everywhere" treatment as the sewer belly guide).
//
//   npx tsx scripts/publish-unpermitted-deck-before-closing.ts            # dry run
//   APPLY=true npx tsx scripts/publish-unpermitted-deck-before-closing.ts
//
// Evidence: tier 1 weak ("unpermitted deck", 2 impressions, on legalize-unpermitted-deck); an experiment.
// Facts: data/fact-ledgers/buying-house-unpermitted-deck-before-closing.json, all IRC 2021 text read in the
// browser (R105.2 deck permit exemption, R312 guards, R507.3, R507.9.1.1, R507.9.1.3, R703.4).
// Differentiation: legalize-unpermitted-deck (#311) owns the process, ledger/flashing/footing depth and cost;
// unpermitted-deck-after-closing-who-pays (#326, experiment until 2026-11-13) owns disclosure law. Both are
// linked, not repeated or edited.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const OWNER_TITLE = 'Buying a House With an Unpermitted Deck? What to Check Before Closing';
const SIBLINGS = ['legalize-unpermitted-deck', 'unpermitted-deck-after-closing-who-pays', 'find-unpermitted-work-before-buying'];
const STOP =
  'Read 2026-11-24: shown on Google or Bing for at least one unpermitted-deck buying search, without taking ' +
  'impressions from legalize-unpermitted-deck or unpermitted-deck-after-closing-who-pays. If not, fold into #311 (owner OK first).';
const BRIEFS: ArticleBrief[] = [
  {
    slug: 'buying-house-unpermitted-deck-before-closing',
    targetQuery: 'unpermitted deck',
    capture: '2026-10-13-demand-unpermitted-deck-gsc',
    intent: 'informational',
    who: 'a buyer under contract who has just learned the deck on the house was never permitted',
    want: 'whether the deck needed a permit, whether it is safe, and what to check and ask before closing',
    achieve: 'to get the building department answer and a priced fix agreed as a credit, repair or holdback before closing',
    titlePromise: 'what to check before closing when buying a house with an unpermitted deck',
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
  const expectedTopic = guideTopic('legalize-unpermitted-deck', 'How to Legalize an Unpermitted Deck');

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
