// Publish "Can You Get Home Insurance With a Wood Stove?" -- second guide of the "Yes, but" strand.
// Process: .claude/skills/yes-but-guide/SKILL.md. Facts: data/fact-ledgers/home-insurance-with-wood-stove.json.
//
//   npx tsx scripts/publish-home-insurance-with-wood-stove.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-insurance-with-wood-stove.ts
//
// Evidence: tier 3 -- no first-party signal for any wood-stove-insurance phrasing (capture
// 2026-10-08-demand-wood-stove-insurance-*). Published as a stated experiment, as the Romex page was.
//
// Verified 2026-10-08 by reading the documents themselves (PDF text extracted, not search snippets):
//   NAIC 2022 consumer guide (wood furnace or wood stove among premium characteristics); Maine Bureau
//   of Insurance consumer guide (wood-burning appliance); an insurer's eligibility guidelines filed with
//   Maine (items U and W, insurer NOT named per the carrier rule); Maine State Fire Marshal stove
//   standards, Sept 2008 (from NFPA 211; check with fire dept/building inspector; ask your insurer).
//   Engine: PRIORITY_RULES chimney_level2 ($250 - $600, NFPA 211 Level 2 at transfer), asserted below.
// Cut (see ledger): a search-snippet claim about lower premiums, Michigan's guide (403), any
//   "most/many insurers" statement, EPA certification as an insurance factor.
// PACE: the skill says never two of this strand on one day; the owner overrode it on 2026-10-08 ("publish now").
// Read: about 5 weeks after publishing. Stop condition below.

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
const SLUG = 'home-insurance-with-wood-stove';

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'wood stove home insurance',
  capture: '2026-10-08-demand-wood-stove-insurance-bing',
  intent: 'informational',
  who: 'a buyer under contract on a house with a wood or pellet stove, or an owner planning to add one, who needs to know whether it will change their insurance',
  want: 'whether a home with a wood stove can be insured, what insurers look at, and what to ask the seller and their own carrier',
  achieve: 'to get a written insurance answer for this house, with the stove described accurately, before removing contingencies',
  titlePromise: 'whether a house with a wood stove can get home insurance, and what decides it',
  stopCondition:
    'About 5 weeks after publishing: shown on Google or Bing for at least one wood-stove or solid-fuel insurance search. ' +
    'If not, stop and fold the insurance section into the strand review rather than writing more insurance-by-appliance pages.',
};

const OVERLAP_WITH = ['get-home-insurance-fuse-box', 'get-home-insurance-aluminum-wiring', 'homeowners-insurance-cover-failed-sump-pump', 'get-insurance-house-trampoline-unfenced-pool'];
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
  if (topic !== 'insurance') fail(`cluster "${topic}" (queue says insurance)`);
  const rule = PRIORITY_RULES.find((p) => p.id === 'chimney_level2')!;
  const cost = rule.costToCheck.replace(/ for a Level 2 inspection.*$/, '');
  if (!body.includes(cost)) fail(`engine Level 2 cost "${cost}" not in body`);
  if (!/NFPA 211/.test(rule.eraBasis) || !body.includes('NFPA 211')) fail('NFPA 211 basis drifted from the engine');
  if (/QUANTUM/i.test(body)) fail('insurer named or identifiable from the filing');

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
