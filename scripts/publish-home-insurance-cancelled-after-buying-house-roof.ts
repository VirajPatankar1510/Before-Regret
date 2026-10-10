// Publish "Can You Lose Home Insurance After Closing Over the Roof?" -- "Yes, but" strand, queue item 8.
// Process: .claude/skills/yes-but-guide/SKILL.md. Facts: data/fact-ledgers/home-insurance-cancelled-after-buying-house-roof.json.
//
//   npx tsx scripts/publish-home-insurance-cancelled-after-buying-house-roof.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-insurance-cancelled-after-buying-house-roof.ts
//
// Owner question 2026-10-10, with an outside brief treated as unverified data. Evidence: tier 3 for
// six phrasings (capture 2026-10-10-demand-homeowners-insurance-cancel-after-buying-*). Experiment.
//
// Verified 2026-10-10 at primary sources: Texas Insurance Code 551.104 / 551.105 / 551.002 (browser,
// statutes.capitol.texas.gov); Florida Statutes 627.4133(2)(b) and 627.7011(5) (flsenate.gov, 2026);
// 12 CFR 1024.37 (ecfr.gov, browser); TDI home insurance glossary (binder, cancellation).
// Cut (see ledger): NerdWallet $1,149 figure, Reddit anecdotes, any claim about how often insurers
// inspect after closing, NC/Maine statutes not read, NAIC guidance not re-read.
// Coverage: #312 owns aerial-image nonrenewals, #307 owns proving roof age -- both linked, not repeated.
// No insurer is named. Carrier generalisations banned below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'home-insurance-cancelled-after-buying-house-roof';

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'can homeowners insurance cancel after buying a house',
  capture: '2026-10-10-demand-homeowners-insurance-cancel-after-buying-bing',
  intent: 'informational',
  who: 'a buyer who has just closed, or is about to, and fears the new insurer will cancel the policy over an older roof',
  want: 'whether and when an insurer can cancel or refuse to renew over the roof, and what notice and reasons the law requires',
  achieve: 'to get the pending inspection, the roof date on file and any renewal conditions confirmed in writing before closing, and to know what to do if a notice arrives',
  titlePromise: 'whether you can lose home insurance after closing because of the roof',
  stopCondition:
    'Read 2026-11-14: shown on Google or Bing for at least one insurance-cancellation or roof-age-insurance search. ' +
    'If not, it counts against the strand; if it is shown only for aerial-imagery searches, check it is not taking them from home-insurance-aerial-photos-roof.',
};

const OVERLAP_WITH = ['home-insurance-aerial-photos-roof', 'prove-roof-age-for-insurance', 'how-to-tell-how-old-a-roof-is', 'get-home-insurance-flat-roof'];
const OVERLAP_MAX = 0.08;
const trigrams = (t: string) => { const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`)); };

async function main() {
  // 1. The strand's own gate first: ledger, shape, numbers, sections, wording.
  try { execFileSync('npx', ['tsx', 'scripts/assert-yes-but-guide.ts', SLUG], { stdio: 'inherit' }); }
  catch { console.log('\n  yes-but gate failed -- nothing written.'); process.exit(1); }

  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${SLUG}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => front[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))![1].trim();
  const META = field('meta'), QUICK = field('quick');
  const rest = raw.slice(front[0].length);
  const TITLE = rest.match(/^#\s+(.*)$/m)![1].trim();
  const body = rest.replace(/^#\s.*\n+/, '').trim();

  const topic = guideTopic(SLUG, TITLE);
  if (topic !== 'roofing-exterior') fail(`cluster "${topic}" (queue says roofing-exterior, with its roof-insurance siblings)`);
  // Legal-advice guard: the page describes the statutes; it never tells the reader they can sue or will win.
  for (const re of [/\bmost states\b/i, /\b(most|many|some) (insurers|carriers|companies) (will|usually|often|typically|cancel|inspect)/i, /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|CSAA|AAA|Citizens)\b/, /\bguarantee/i]) {
    if (re.test(body) || re.test(QUICK)) fail(`legal-advice or unverified generalisation: ${re}`);
  }
  // Intent rule (new pages only): the official statute text is linked in the first section.
  const firstSection = body.split(/\n## /)[0];
  for (const host of ['statutes.capitol.texas.gov', 'flsenate.gov']) if (!firstSection.includes(host)) fail(`first section does not link ${host}`);

  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  const mine = trigrams(body);
  for (const s of OVERLAP_WITH) {
    const theirs = trigrams(published.get(s) ?? ''); let shared = 0; mine.forEach((g) => { if (theirs.has(g)) shared++; });
    const ov = shared / mine.size; console.log(`    overlap with ${s}: ${(ov * 100).toFixed(1)}%`);
    if (ov > OVERLAP_MAX) fail(`overlap ${(ov * 100).toFixed(1)}% with ${s}`);
  }
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  console.log(`\n  ${SLUG}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK.length})  ${QUICK}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${TITLE}, ${META}, ${QUICK}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}\n  next: SKILL step 9 (quality gate, FAQs, inbound links, build, push, verify, IndexNow, queue + memory)\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
