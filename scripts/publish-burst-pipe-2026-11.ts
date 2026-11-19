// Publish report-4 plan item #7: "Burst Pipe? What to Do Right Now, and What Insurance Covers" (title is ours,
// owner OK 2026-11-02/04; plan order: #7 was "next"). First article written with the answer-ready-writing skill
// (owner, 2026-11-19: "use answer-ready-writing to write the next article").
//
//   npx tsx scripts/publish-burst-pipe-2026-11.ts               # dry run (also prints the passage report)
//   APPLY=true npx tsx scripts/publish-burst-pipe-2026-11.ts
//
// Facts: data/fact-ledgers/burst-pipe-what-to-do-insurance.json (Charlotte Water, Ready.gov, EPA, DC DISB, NAIC,
// Massachusetts DOI, 44 CFR 61 App. A(1) via LII, engine galvanized_supply / polybutylene_supply).
//
// Demand: Bing AI Topic Portfolio 2026-11-04 lists 4 burst-pipe / water-damage queries where AI answers cite other
// sites; topic-demand 2026-11-19 = tier 2 (Bing records "burst pipe"; nothing via this site). Relative only.
//
// DECISION MAP (answer-ready-writing, part 1) -- the buyer's question: "A pipe burst. What now, will insurance pay?"
//   | sub-question                                   | answered where                                   |
//   | how do I stop the water                        | this page (Charlotte Water)                      |
//   | is it safe with the power on                   | this page (Ready.gov)                            |
//   | how fast before mold                           | this page (EPA 24-48 h); coverage -> #346        |
//   | will homeowners insurance pay                  | this page (DC DISB, NAIC, Massachusetts DOI)     |
//   | the house was empty / heat off                 | this page (DC vacancy line); away-checklist #366 |
//   | is it a flood                                  | this page (44 CFR 61 App. A(1))                  |
//   | what to ask the insurer                        | this page (4 questions)                          |
//   | is the rest of the plumbing the same           | this page (engine); ID -> #320, PB -> #24/#313   |
//   | the pipe between street and house              | #345 (link)                                      |
//   | photos, receipts, the claim itself             | #366 (link; Connecticut steps live there)        |
//   | does the policy pay for the pipe / the wall    | SKIPPED: ISO form blocked; asked as questions 1-2|
//
// READ 2026-12-24 (5 weeks): seen / clicked / acted (answer-ready-writing, part 3) on Google and Bing; also the
// 2026-12-04 Bing Topic Portfolio re-export -- are the 4 queries still "cite others, not us"?
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
const CAPTURE = '2026-11-19-demand-burst-pipe-bing';
const STOP = 'Read 2026-12-24: no Google or Bing impressions by then means no more insurance-coverage pages in the plumbing line until the Bing Topic Portfolio shows us cited; if it is shown only for #366 or #346 queries, report the overlap to the owner.';
const LIVE_SIBLINGS = ['leaving-home-thanksgiving-checklist', 'homeowners-insurance-cover-mold', 'home-insurance-water-sewer-service-line',
  'homeowners-insurance-cover-failed-sump-pump', 'fall-home-maintenance-checklist-new-homeowners', 'identify-water-pipes-pex-copper-galvanized',
  'spot-polybutylene-pipes-before-buying-house', 'polybutylene-pipes-home-insurance'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('plumbing', { slug: 'burst-pipe-what-to-do-insurance', targetQuery: 'burst pipe', intent: 'informational',
      who: 'a homeowner, often a recent buyer, standing in a wet room after a supply pipe has just split, phone in hand',
      want: 'how to stop the water and keep safe right now, then whether homeowners insurance will pay',
      achieve: 'to close the main valve within minutes, start drying inside the mold window and ask the insurer the right questions in writing',
      titlePromise: 'what to do in the first minutes after a pipe bursts and what homeowners insurance covers' },
    { slug: 'burst-pipe-what-to-do-insurance', readerGoal: 'A pipe just burst. How do I stop it, and will my insurance pay?',
      firstScreen: 'The quick answer: close the main valve, keep clear of wet electrics, regulators\' sudden-and-accidental line with the heat condition, not a flood, dry within 24-48 hours.',
      firstParty: [{ what: 'Engine galvanized_supply (to 1969) and polybutylene_supply (1978-1996) windows and repipe cost, read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Our reading, side by side, of four regulators and the federal flood policy definition, with the blocked policy form named', source: LEDGER('burst-pipe-what-to-do-insurance') }],
      evidenceOfWork: ['"How we checked this" naming every page read on 2026-11-19 and the eCFR outage', 'says plainly the standard policy form was blocked and turns that gap into two questions for the insurer'],
      beyondCommonFacts: ['where the main valve sits by house type (basement: front wall toward the street; slab: by the water heater or garage) and gate vs ball valve closing', 'the federal flood policy needs two or more acres or two or more properties, so a burst pipe is never a flood claim', 'DC\'s regulator: an unheated vacant property should have the water shut off and drained', 'Massachusetts: 48.6% of 2024 homeowners claims were non-flood water and freezing'],
      reproducibilityCheck: 'Top results are plumber and insurer blogs repeating "shut off the water, call your insurer". None reads the flood policy definition, ties coverage to regulators\' own wording, places the valve by house type from a utility, or connects the burst to the house\'s pipe era from a working engine.',
      discussion: 'needed', discussionReason: 'Coverage turns on conditions (heat, occupancy, sudden vs not) the reader has to weigh against their own situation.' }),
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
  for (const id of ['galvanized_supply', 'polybutylene_supply']) if (!String(rule(id).typicalRepairCost).includes('$4,000 – $15,000')) throw new Error(`ABORT: ${id} repipe cost changed`);
  const g = rule('galvanized_supply'), p = rule('polybutylene_supply');
  if (g.maxYear !== 1969 || p.minYear !== 1978 || p.maxYear !== 1996) throw new Error('ABORT: pipe year windows changed');
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
