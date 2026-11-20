// Publish "Can You Pigtail a Double-Tapped Breaker?" (owner topic 2026-11-20: "pigtail double tap breaker";
// title is ours). Written with write-article + answer-ready-writing. Awaiting owner "publish".
//
//   npx tsx scripts/publish-pigtail-double-tap-2026-11.ts               # dry run (also prints the passage report)
//   APPLY=true npx tsx scripts/publish-pigtail-double-tap-2026-11.ts
//
// Facts: data/fact-ledgers/pigtail-double-tapped-breaker.json (2021 IRC R105.2, E3406.10-.11, E3703.2-.4,
// E3705.5.3, E3706.4, E3907.1 on codes.iccsafe.org; Schneider FAQ FA97891; engine electrical_panel_brand +
// electrical_aluminum_wiring). NEC itself not read (NFPA free access needs an account).
//
// Demand (first-party): topic-demand 2026-11-20 = tier 1 WEAK -- #234 double-tapped-breaker-did-inspector-flag shown
// 27 impressions across 7 "double tap(ped) breaker" rows at positions 61-75, 0 clicks; Bing counts 0 (unknown).
// OVERLAP: #234 is a "what is it / why flagged" page with one pigtail bullet; this page is the fix decision (when a
// pigtail is and isn't right). It links to #234; #234 is not edited (owner rule 2026-11-19).
//
// DECISION MAP -- "My inspector flagged a double tap and the electrician wants to pigtail it. Is that right?"
//   | sub-question                              | answered where                                        |
//   | is a pigtail code-compliant               | this page (E3406.10, E3406.11, E3907.1.1 panel fill)  |
//   | wires of different sizes                  | this page (E3705.5.3)                                 |
//   | circuits that must stand alone            | this page (E3703.2-E3703.4)                           |
//   | two neutrals                              | this page (E3706.4)                                   |
//   | aluminum wire                             | this page (E3406.10, engine/CPSC 516) -> #368         |
//   | breaker already rated for two wires       | this page (Schneider QO FAQ); other brands SKIPPED    |
//   | panel is full                             | this page (engine panel cost); tandems -> #234        |
//   | permit                                    | this page (R105.2 items 3, 5)                         |
//   | what is a double tap                      | #234 (link)                                           |
//
// READ 2026-12-25 (5 weeks): seen / clicked / acted on Google and Bing; also #234's double-tap impressions before vs
// after (if this page only takes #234's rows with no added clicks, report it; no edit to #234).
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-20-demand-pigtail-double-tap-breaker-gsc';
const STOP = 'Read 2026-12-25: no Google or Bing impressions means no more electrical fix-decision pages until one is shown; if it only takes #234 double-tap rows with no added clicks, report the overlap to the owner (no edit to #234).';
const LIVE_SIBLINGS = ['double-tapped-breaker-did-inspector-flag', 'aluminum-wiring-repair-cost-before-closing', 'unpermitted-work-behind-the-wall',
  'amateur-workmanship-mean-home-inspection-report', '100-amp-service-enough-house-re-buying', 'two-prong-outlets-buying-house', 'pushmatic-panel-buying-house'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('electrical', { slug: 'pigtail-double-tapped-breaker', targetQuery: 'pigtail double tap breaker', intent: 'informational',
      who: 'a buyer or homeowner whose inspector flagged a double-tapped breaker and whose electrician has quoted a pigtail',
      want: 'whether a pigtail is a proper fix for their double tap, and the cases where it is the wrong one',
      achieve: 'to check wire sizes, shared circuits, neutrals and the breaker rating before accepting the repair, and get the fix written on the invoice',
      titlePromise: 'whether a pigtail fixes a double-tapped breaker under the code, and when it does not' },
    { slug: 'pigtail-double-tapped-breaker', readerGoal: 'My inspector flagged a double tap. The electrician wants to pigtail it. Is that the right fix?',
      firstScreen: 'The quick answer: usually yes (one wire on the terminal, joint in a listed splice), except mismatched wire sizes, circuits that must stand alone, and neutrals.',
      firstParty: [{ what: 'Engine electrical_panel_brand panel replacement cost and electrical_aluminum_wiring CPSC 516 note, read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Our reading of eight 2021 IRC electrical sections against a breaker maker\'s own two-wire rating, turned into the four cases a pigtail does not fix, with our reading of E3706.4 labelled as ours', source: LEDGER('pigtail-double-tapped-breaker') }],
      evidenceOfWork: ['"How we checked this" names each IRC section and the Schneider FAQ read 2026-11-20', 'says we could not read the NEC itself or any other brand\'s maker documents, and why'],
      beyondCommonFacts: ['the breaker must suit the smallest wire (14 AWG 15 A, 12 AWG 20 A, 10 AWG 30 A), so pigtailing mixed sizes does not fix it', 'bathroom, laundry and kitchen circuits that must stand alone cannot be joined by a pigtail', 'Square D QO 10-30 A breakers are rated for two copper wires, but not their GFI/AFI/CAFI/DF versions, so a swap to an AFCI breaker is when a pigtail becomes necessary', 'panel splices are limited to 40 percent conductor fill and 75 percent with splices'],
      reproducibilityCheck: 'Top results are forum threads and electrician blogs saying "just pigtail it". None ties the fix to the IRC sections, names the circuits that cannot share a breaker, or quotes a maker\'s own two-wire rating and its AFCI exclusion.',
      discussion: 'needed', discussionReason: 'The reader has to weigh which of the four exceptions apply to their panel before accepting the repair.' }),
];

const trigrams = (t: string) => { const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`)); };
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };
const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');

function readDraft(slug: string) {
  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${slug}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => (front[1].match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
  const rest = raw.slice(front[0].length);
  return { title: rest.match(/^#\s+(.*)$/m)![1].trim(), body: rest.replace(/^#\s.*\n+/, '').trim(), meta: field('meta'), quick: field('quick') };
}

function assertEngine() {
  const rule = (id: string) => { const r = PRIORITY_RULES.find((x) => x.id === id); if (!r) throw new Error(`ABORT: engine rule ${id} missing`); return r; };
  if (!String(rule('electrical_panel_brand').typicalRepairCost).includes('Panel replacement $1,500 – $4,000')) throw new Error('ABORT: panel replacement cost changed');
  if (!String(rule('electrical_aluminum_wiring').eraBasis).includes('recommends against pigtailing with ordinary twist-on connectors')) throw new Error('ABORT: aluminum CPSC note changed');
}

async function main() {
  validateBriefs(SPECS.map((s) => s.brief));
  for (const s of SPECS) validateEffortBrief(s.effort);
  const drafts = new Map(SPECS.map((s) => [s.brief.slug, readDraft(s.brief.slug)]));
  assertEngine();

  let bad = 0; const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  const batchSlugs = new Set(SPECS.map((s) => s.brief.slug));
  const canon = fs.readFileSync('scripts/assert-canonical-urls.ts', 'utf8');

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    const ledger = JSON.parse(fs.readFileSync(LEDGER(slug), 'utf8'));
    try { assertHumanDraft(slug, d.body, d.quick); } catch (e: any) { fail(`${slug}: ${String(e.message).slice(0, 200)}`); }
    if (rows.find((r) => r.slug === slug)) fail(`${slug}: slug already exists`);
    if (d.title.length > 60 && !canon.includes(`'/guides/${slug}/'`)) fail(`${slug}: title ${d.title.length} chars and not in OWNER_LONG_TITLES`);
    if (d.meta.length < 70 || d.meta.length > 155) fail(`${slug}: meta ${d.meta.length} chars`);
    const isQ = /\?/.test(d.title);
    if (isQ && (d.quick.length < 120 || d.quick.length > 450)) fail(`${slug}: quick answer ${d.quick.length} chars`);
    if (!isQ && d.quick) fail(`${slug}: quick answer on a non-question title`);
    if (guideTopic(slug, d.title) !== s.topic) fail(`${slug}: topic ${guideTopic(slug, d.title)}, expected ${s.topic}`);
    if (!/^## How we checked this/m.test(d.body)) fail(`${slug}: no How we checked this`);
    for (const m of d.body.matchAll(/!\[([^\]]*)\]\((\/images\/[^ )]+)/g)) {
      if (m[1].length < 80) fail(`${slug}: image alt text too short for ${m[2]}`);
      if (!fs.existsSync(path.join('public', m[2]))) fail(`${slug}: image file missing public${m[2]}`);
    }
    const all = `${d.title}\n${d.meta}\n${d.quick}\n${d.body}`;
    const ledgerAll = JSON.stringify(ledger.facts);
    // Ordered-list markers ("1. ") are not figures.
    for (const m of all.replace(/\]\([^)]*\)/g, ']').replace(/^\d+\.\s/gm, '').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,/-]+$/, '');
      if (!ledgerAll.includes(tok)) fail(`${slug}: number "${tok}" in no ledger entry`);
    }
    const quotes = norm(ledger.facts.map((f: any) => f.quote).join(' '));
    for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) { if (m[1].length >= 12 && !quotes.includes(norm(m[1]))) fail(`${slug}: quote not in ledger: "${m[1].slice(0, 70)}"`); }
    for (const re of [/\b(most|many|some) (insurers|carriers|lenders) (will|usually|often|typically|refuse|won't)/i, /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Chubb|Citizens Property|Lemonade|Hippo|Erie|Amica)\b/i, /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/])
      if (re.test(all)) fail(`${slug}: banned pattern ${re}`);
    for (const m of d.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1]) && !batchSlugs.has(m[1])) fail(`${slug}: dead link ${m[1]}`);
    for (const sib of [...LIVE_SIBLINGS, ...batchSlugs]) {
      if (sib === slug) continue;
      const other = drafts.get(sib)?.body ?? published.get(sib);
      if (!other) { fail(`${slug}: sibling ${sib} missing`); continue; }
      const ov = overlap(d.body, other);
      if (ov > 0.08) fail(`${slug}: overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
    }
    console.log(`  NEW ${slug}  [${s.topic}]\n    title (${d.title.length}) ${d.title}\n    meta  (${d.meta.length})  quick (${d.quick.length})  body ${d.body.split(/\s+/).length} words`);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  // answer-ready-writing part 2: passage report (zero flagged KEY paragraphs is the target; report only).
  for (const s of SPECS) console.log(execFileSync('npx', ['tsx', '.claude/skills/answer-ready-writing/scripts/check-passages.ts', s.brief.slug], { encoding: 'utf8' }));
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    await withDb((sql) => sql`
      INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
      VALUES (${slug}, ${d.title}, ${d.meta}, ${d.quick}, ${d.body}, '[]', 'published', 'guide', 'standard', now())`);
    console.log(`  wrote ${slug}`);
  }
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
