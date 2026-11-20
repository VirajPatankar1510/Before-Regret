// Publish /guides/water-heater-age-serial-number/ -- How Old Is My Water Heater? Read the Serial Number by Brand.
// A NEW URL. The removed #280 (old-too-old-water-heater-re-inheriting) stays removed; this page is about reading the date.
//
//   npx tsx scripts/publish-water-heater-age-2026-11.ts            # dry run
//   APPLY=true npx tsx scripts/publish-water-heater-age-2026-11.ts
//
// WHY. Topic chosen from the owner's OpenSEO export serp-age-of-a-o-smith-water-heater-2026-11-20.csv (topic only; no
// OpenSEO figure on the page). First-party demand: Bing's own counts (capture 2026-11-20-demand-water-heater-age-bing,
// relative only) record "water heater age" and "bradford white water heater age".
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Is this house's water heater near the end, and should I ask for a credit?"
//   where is the date?                        -> intro (rating label / nameplate / rating plate)
//   how do I read it on my brand?             -> A.O. Smith / Rheem-Ruud / Bradford White sections + our same-digits table
//   what if it won't decode / other brand?    -> "When a water heater's serial won't decode" (maker lookups, permit record)
//   how old is too old?                       -> section; A.O. Smith 8-12 vs DOE ~15 (engine), discussion
//   what will replacing it cost?              -> engine hvac_age cost, read at run time
//   what do I ask the inspector / seller?     -> data plate date in writing (engine); credit -> #352 link
//   TPR valve, expansion tank                 -> answered on #56 and #377 (linked, not repeated)
//   brands beyond the three                   -> skipped: no primary source read
//
// FIRST-PARTY: Rheem's month-vs-week conflict resolved from bulletin 1207 (plant-letter format from April 2, 2012);
// Bradford White's two official charts list different year pairs (A = 1984/2004 vs 2004/2024) -- reconciled with the
// 7-vs-8-digit rule; the same digits 0912 read three ways; Ruud's calculator does not decode a published example.
// Two PDFs (A.O. Smith 2024 guide, Rheem bulletin 1207) downloaded with the owner's OK on 2026-11-20.
//
// READ 2026-12-25 (5 weeks): seen / chosen / acted.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-20-demand-water-heater-age-bing';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
const STOP = 'Read 2026-12-25: shown on Google or Bing for at least one water heater age or serial number search; if not shown, no more appliance-age pages until one is, and check whether the A.O. Smith wording draws impressions at all.';
const LIVE_SIBLINGS = ['water-heater-expansion-tank-required', 'tpr-valve-inspectors-always-check', 'option-period-negotiating-home-repairs', 'look-up-building-permits-by-address'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('plumbing', { slug: 'water-heater-age-serial-number', targetQuery: 'water heater age', intent: 'informational',
      who: 'a buyer in the inspection period standing at the water heater of a house under contract, holding a phone photo of the rating label',
      want: 'to turn the serial number on that label into a manufacture date for the brand in front of them',
      achieve: 'to know the heater age, judge it against the makers and DOE ranges and the replacement cost, and get it written into the inspection report or a credit request',
      titlePromise: 'how to read a water heater manufacture date from the serial number for A.O. Smith, Rheem/Ruud and Bradford White' },
    { slug: 'water-heater-age-serial-number', readerGoal: 'How old is the water heater in this house? The label just has a long serial number.',
      firstScreen: 'The quick answer with the three brand rules, then where the label is and why the brand decides the reading.',
      firstParty: [
        { what: 'Rheem month-vs-week conflict resolved from Rheem bulletin 1207: plant-letter format from April 2, 2012, read as week then year', source: LEDGER('water-heater-age-serial-number') },
        { what: 'Bradford White two official charts compared (pro page A = 1984 or 2004; consumer page A = 2004 or 2024) and reconciled with the 7-vs-8-digit rule', source: LEDGER('water-heater-age-serial-number') },
        { what: 'Our table reading the same digits 0912 under each published rule: week 12 of 2009, week 9 of 2012, September 2012', source: LEDGER('water-heater-age-serial-number') },
        { what: 'Ruud age calculator tested with Rheem published example serial 1209D01234: not found', source: LEDGER('water-heater-age-serial-number') },
        { what: 'Replacement cost and DOE lifespan from our report engine, read at run time', source: 'src/engine/inspectionPriorities.ts' },
      ],
      evidenceOfWork: ['"How we checked this" names every maker page and PDF read on 2026-11-20 and the Ruud calculator test', 'says what we could not check: other brands, real serials, which Bradford White year beyond the digit rule'],
      beyondCommonFacts: ['Rheem changed format on April 2, 2012: a serial starting with a plant letter reads week then year, an all-digit one month then year', 'Bradford White pro and consumer charts disagree, so a year letter can mean three years; eight digits after the letters means December 2007 or later', 'A.O. Smith publishes its year-then-week rule only in its contractor service guide', 'the same digits read as three different dates across brands'],
      reproducibilityCheck: 'Top results are A.O. Smith marketing pages, a parts catalogue PDF, JustAnswer, a local plumber and Facebook posts. None reconciles Rheem month vs week through bulletin 1207, notices that the two Bradford White charts list different year pairs, or shows one set of digits read three ways.',
      discussion: 'needed', discussionReason: 'The reader weighs a decoded age against two disagreeing lifespan figures, the heater condition and a replacement cost to decide whether to ask for a credit.' }),
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

async function main() {
  validateBriefs(SPECS.map((s) => s.brief));
  for (const s of SPECS) validateEffortBrief(s.effort);
  const drafts = new Map(SPECS.map((s) => [s.brief.slug, readDraft(s.brief.slug)]));

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
    const ledgerAll = JSON.stringify({ facts: ledger.facts, ourWork: ledger.ourWork });
    const engine = PRIORITY_RULES.find((r: any) => r.id === 'hvac_age')!;
    for (const t of ['$1,200 – $3,000', 'about 15 years']) if (!(engine.typicalRepairCost + engine.eraBasis).includes(t)) fail(`${slug}: engine no longer says "${t}"`); else if (!d.body.includes(t)) fail(`${slug}: body lacks engine figure "${t}"`);
    // Ordered-list markers ("1. ") are not figures.
    for (const m of all.replace(/\]\([^)]*\)/g, ']').replace(/^\d+\.\s/gm, '').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,/-]+$/, '');
      if (!ledgerAll.includes(tok)) fail(`${slug}: number "${tok}" in no ledger entry`);
    }
    const quotes = norm(ledger.facts.map((f: any) => f.quote).join(' '));
    for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) { if (m[1].length >= 12 && !quotes.includes(norm(m[1]))) fail(`${slug}: quote not in ledger: "${m[1].slice(0, 70)}"`); }
    for (const re of [/\b(most|many|some) (insurers|carriers|lenders) (will|usually|often|typically|refuse|won't)/i, /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Chubb|Citizens Property|Lemonade|Hippo|Erie|Amica)\b/i, /\b(always lasts|will fail|guaranteed to)\b/i, /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/])
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
