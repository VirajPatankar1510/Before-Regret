// Rewrite guide #24 spot-polybutylene-pipes-before-buying-house through the write-article skill (owner request
// 2026-10-14: "find an old guide that was good but got few impressions" -> "pass this through /write-article").
// State before: Google "URL is unknown to Google" (0 impressions in 90 days); Bing 63 impressions, 3 clicks.
//
//   npx tsx scripts/rewrite-spot-polybutylene-pipes.ts            # dry run
//   APPLY=true npx tsx scripts/rewrite-spot-polybutylene-pipes.ts
//
// Slug and title are unchanged (Bing already shows the page under this title). Meta, quick answer and body are
// replaced from guides/spot-polybutylene-pipes-before-buying-house.md. The UPDATE runs only if the stored body still
// hashes to what was read on 2026-10-14, so a rewrite can never land on content that changed since.
// First-party: docs/data/polybutylene-era-figures.json (scripts/build-polybutylene-era-figures.ts, Census B25034).
// Facts: data/fact-ledgers/spot-polybutylene-pipes-before-buying-house.json. Cut: Cox v. Shell (bot check),
// PB2110 (no primary source), the named state insurer, "Big Blue".
// Existing faq_json cites "Big Blue" and other cut claims -- replace it with the article-faqs skill (--force) after APPLY.
//
// READ 2026-11-18: Google has shown the URL at least once (it was unknown before), and Bing impressions over 28 days
// are not below the pre-rewrite run rate. If Google still has never crawled it, request indexing again and check
// internal links; the rewrite itself is not undone.
import 'dotenv/config';
import './lib/neon-curl.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'spot-polybutylene-pipes-before-buying-house';
const ID = 24;
const TITLE = 'How to Spot Polybutylene Pipes Before Buying a House';
const BODY_SHA_BEFORE = 'bd63a3385da86c489e18f371488c51d77c05c113df40019002d62001cc6e9ebb';
const SIBLINGS = ['polybutylene-pipes-home-insurance', 'identify-water-pipes-pex-copper-galvanized', 'lead-service-line-lookup-by-address'];
// Numbers the body names only to say we could NOT verify them ("How we checked this").
const UNVERIFIED_MENTIONED = new Set(['2110']);

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'how to tell if you have polybutylene pipes',
  capture: '2026-10-01-bing-queries',
  intent: 'informational',
  who: 'a buyer under contract on a house built between the late 1970s and mid-1990s who wants to know if it has polybutylene',
  want: 'where to look and what polybutylene looks like, and whether copper under the sinks means the house is clear',
  achieve: 'to settle the pipe question, with a plumber if needed, before the inspection or option period ends',
  titlePromise: 'how to spot polybutylene pipes in a house before buying it',
  stopCondition: 'Read 2026-11-18: Google shows the URL at least once; Bing impressions hold. Else request indexing again and add internal links.',
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Does this house have polybutylene, and how do I find out before my inspection deadline?',
  firstScreen: 'The quick answer names the four places to look and why copper under the sink is not proof; the first paragraph gives the 1978-1996 window from our engine.',
  firstParty: [
    { what: 'County and national counts of homes built inside the polybutylene window, computed from Census B25034 by our script', source: 'docs/data/polybutylene-era-figures.json' },
    { what: 'The engine window (1978-1996), where-to-look note and repipe range our free report gives buyers', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'Our diagram comparing polybutylene and PEX with the three places supply pipe shows', source: 'public/images/polybutylene-vs-pex-pipe-identification.webp' },
  ],
  evidenceOfWork: [
    'table computed from docs/data/polybutylene-era-figures.json, labelled with its Census source',
    'visible "How we checked this" section naming what we read, ran and could not verify',
    'diagram public/images/polybutylene-vs-pex-pipe-identification.webp',
    'script scripts/build-polybutylene-era-figures.ts committed with the data',
  ],
  beyondCommonFacts: [
    'Texas inspector rules require reporting only the "visible material used for water supply lines" (22 TAC 535.231), which is the stub-out trap in regulatory form',
    'The 2021 IRC water distribution table P2906.5 no longer lists polybutylene, so repairs are made in another material',
    'Seven of the ten counties with the highest 1980s housing share (50,000+ homes) are in Florida; 12.9% of US homes date from the 1980s',
    'Failures were reported in the acetal fittings as well as the pipe (Jana Laboratories / UIC paper), so the insert fittings are worth a look',
    'The widely repeated PB2110 stamp has no primary source we could find, and the page says so',
  ],
  reproducibilityCheck: 'A summary of the top results would give colours, the stub-out warning and the class action. It would not give county counts from Census B25034, the Texas "visible material" rule, the IRC table check, or an honest list of what could not be verified.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh what a clean visual check does and does not prove (stub-outs, visual-only inspections) and when a plumber visit is worth paying for. The insure-or-repipe trade-off is left to polybutylene-pipes-home-insurance.',
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

  const rows = (await withDb((sql) => sql`SELECT id, slug, status, title, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; status: string; title: string; body_markdown: string }>;
  const cur = rows.find((r) => r.id === ID);
  if (!cur || cur.slug !== SLUG || cur.status !== 'published') fail('row 24 is not the published polybutylene guide');
  else {
    const sha = crypto.createHash('sha256').update(cur.body_markdown).digest('hex');
    if (sha !== BODY_SHA_BEFORE) fail(`stored body changed since it was read (sha ${sha.slice(0, 12)}) -- re-read before rewriting`);
    if (cur.title !== TITLE) fail(`stored title changed: ${cur.title}`);
  }
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title differs from the live title -- this rewrite keeps it');
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (guideTopic(SLUG, title) !== 'plumbing') fail(`topic ${guideTopic(SLUG, title)}, expected plumbing`);
  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (/^(19|20)\d0s$/.test(tok) || UNVERIFIED_MENTIONED.has(tok)) continue;
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/, /\[(CPSC|ASHI)\]/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  const oldBody = cur?.body_markdown ?? '';
  console.log(`    vs the old body of #24: ${(overlap(body, oldBody) * 100).toFixed(1)}% (a rewrite, not a light edit)`);

  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words (was ${oldBody.split(/\s+/).length})`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  const res = await withDb((sql) => sql`
    UPDATE articles SET meta_description = ${meta}, quick_answer = ${quick}, body_markdown = ${body}, updated_at = now()
    WHERE id = ${ID} AND slug = ${SLUG} AND status = 'published' RETURNING id`);
  if ((res as unknown as unknown[]).length !== 1) throw new Error('UPDATE touched no row');
  console.log(`  rewrote #${ID} ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
