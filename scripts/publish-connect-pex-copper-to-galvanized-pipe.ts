// Publish "Can You Connect PEX or Copper to Galvanized Pipe?" -- first guide of the "Yes, but" strand.
// Process: .claude/skills/yes-but-guide/SKILL.md. Facts: data/fact-ledgers/connect-pex-copper-to-galvanized-pipe.json.
//
//   npx tsx scripts/publish-connect-pex-copper-to-galvanized-pipe.ts            # dry run
//   APPLY=true npx tsx scripts/publish-connect-pex-copper-to-galvanized-pipe.ts
//
// Queue items 3 (PEX to galvanized) and 4 (copper to galvanized) merged into one guide, 2026-10-08:
// one code section answers both. Items 1, 2 and 6 were found already covered by live guides and
// were not written (see the queue's decision notes).
//
// Evidence: tier 2 -- Bing records "dielectric union" (capture 2026-10-08-demand-pex-to-galvanized-bing,
// relative only). The exact PEX/copper phrasings show nothing, so this is also an experiment.
//
// Verified 2026-10-08 in the browser at codes.iccsafe.org (WebFetch gets 403; no bot check involved):
//   IRC 2021 P2906.18, P2906.18.1 (copper alloy or dielectric fitting), P2906.18.3 (approved adapter fitting).
// Engine: PRIORITY_RULES galvanized_supply (through 1969; corrodes from inside; repipe $4,000 - $15,000),
//   asserted below so the guide cannot drift from the report.
// Cut (see the ledger): galvanic-corrosion mechanism, ASSE 1079, which states use the UPC, labor costs,
//   and a pipe-appearance sentence with no ledger fact.
// Read: 2026-11-12. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'connect-pex-copper-to-galvanized-pipe';

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'dielectric union',
  capture: '2026-10-08-demand-pex-to-galvanized-bing',
  intent: 'informational',
  who: 'a buyer who has spotted PEX or copper spliced into old galvanized supply pipe under a sink, or a plumber or DIYer about to make that join',
  want: 'whether the join is allowed, which fitting the plumbing code requires for it, and what it means for the galvanized pipe left in the house',
  achieve: 'to recognize a proper transition at the joint, and to price a repipe before the contingency ends instead of mistaking a patched house for a repiped one',
  titlePromise: 'whether PEX or copper can be connected to galvanized pipe, and the fitting the code requires',
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-12): shown on Google or Bing for at least one galvanized-transition or dielectric-union search. ' +
    'If not, fold the code table into identify-water-pipes-pex-copper-galvanized and 301 this URL to it.',
};

const OVERLAP_WITH = ['identify-water-pipes-pex-copper-galvanized', 'find-unpermitted-work-before-buying', 'unpermitted-work-behind-the-wall', 'amateur-workmanship-mean-home-inspection-report'];
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
  if (topic !== 'plumbing') fail(`cluster "${topic}" (queue says plumbing)`);
  const rule = PRIORITY_RULES.find((p) => p.id === 'galvanized_supply')!;
  const cost = rule.typicalRepairCost!.replace(/^Whole-home repipe /, '');
  if (!body.includes(cost)) fail(`engine repipe cost "${cost}" not in body`);
  if (rule.maxYear !== 1969 || !body.includes('through 1969')) fail('galvanized era drifted from the engine');

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
