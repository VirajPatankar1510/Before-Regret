// Publish "Can You Make a Seller Pay for an Unpermitted Deck?" -- third guide of the "Yes, but" strand.
// Process: .claude/skills/yes-but-guide/SKILL.md. Facts: data/fact-ledgers/unpermitted-deck-after-closing-who-pays.json.
//
//   npx tsx scripts/publish-unpermitted-deck-after-closing-who-pays.ts            # dry run
//   APPLY=true npx tsx scripts/publish-unpermitted-deck-after-closing-who-pays.ts
//
// Evidence: tier 3 -- no first-party signal for any after-closing / seller-disclosure phrasing (capture
// 2026-10-09-demand-unpermitted-deck-after-closing-*). Published as a stated experiment.
//
// Coverage check 2026-10-09: legalize-unpermitted-deck (after-the-fact permit), find-unpermitted-work-
// before-buying (discovery and negotiation BEFORE closing) and unpermitted-work-behind-the-wall
// (contractor-facing) all exist; none answers whether the seller can be made to pay after closing.
//
// Verified 2026-10-09 at the legislatures' own sites:
//   Texas Property Code Section 5.008 (statutes.capitol.texas.gov, in the browser): who must disclose,
//   item 9's permit line, "not a warranty", the (e) exemptions, (f) timing and the seven-day termination.
//   Washington RCW 64.06.010 / .020 / .030 / .050 / .070 (app.leg.wa.gov): exemptions, the form's
//   permits and final-inspections questions with Don't know, not a warranty, five-business-day
//   delivery, three-business-day rescission, no liability without actual knowledge, no new remedy.
// Cut (see ledger): California (leginfo down for maintenance, 503/403), as-is clauses, limitation
//   periods, "most states require disclosure", code enforcement following the property.
// No legal-advice framing: the page says what the two statutes say and sends the reader to an attorney.
// Read: about 5 weeks after publishing. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'unpermitted-deck-after-closing-who-pays';

const BRIEF: ArticleBrief = {
  slug: SLUG,
  targetQuery: 'unpermitted deck after closing seller',
  capture: '2026-10-09-demand-unpermitted-deck-after-closing-bing',
  intent: 'informational',
  who: 'a buyer who has already closed and just learned the deck has no permit, or the contractor that new owner called to fix it',
  want: 'whether the seller can be made to pay, what the seller was required to disclose, and what decides it',
  achieve: 'to gather the disclosure form, the permit record and dated evidence, and take them to a real-estate attorney before repairing or removing the deck',
  titlePromise: 'whether a seller can be made to pay for an unpermitted deck found after closing',
  stopCondition:
    'About 5 weeks after publishing: shown on Google or Bing for at least one unpermitted-work or seller-disclosure search. ' +
    'If not, it counts against the strand stop condition and no further disclosure-law pages are written.',
};

const OVERLAP_WITH = ['legalize-unpermitted-deck', 'find-unpermitted-work-before-buying', 'unpermitted-work-behind-the-wall', 'look-up-building-permits-by-address'];
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
  if (topic !== 'permits') fail(`cluster "${topic}" (queue says permits)`);
  // Legal-advice guard: the page describes the statutes; it never tells the reader they can sue or will win.
  for (const re of [/\byou can sue\b/i, /\byou will win\b/i, /\bentitled to (?:damages|compensation)\b/i, /\bmost states\b/i]) {
    if (re.test(body) || re.test(QUICK)) fail(`legal-advice or unverified generalisation: ${re}`);
  }
  // Intent rule (new pages only): the official statute text is linked in the first section.
  const firstSection = body.split(/\n## /)[0];
  for (const host of ['statutes.capitol.texas.gov', 'app.leg.wa.gov']) if (!firstSection.includes(host)) fail(`first section does not link ${host}`);

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
