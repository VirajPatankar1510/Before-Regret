// Publish /guides/galvanized-pipe-replacement-before-closing/ -- Galvanized Pipe Replacement Before Closing: Do You Need It?
// A NEW URL. Owner asked for bottom-of-funnel "repair-decision pages ... only if it doesn't hurt our current ranking,
// indexing, authority" (2026-11-27). Safety screen that day: 46/46 guides published 16 Oct-19 Nov indexed; old-guide
// impressions rose 2,374 -> 4,974/wk while ~50 pages were added; no existing page earns impressions for galvanized
// replacement (our galvanized impressions are all PEX/copper connection searches on #324). Existing pages NOT edited.
//
//   npx tsx scripts/publish-galvanized-pipe-replacement-2026-11.ts            # dry run
//   APPLY=true npx tsx scripts/publish-galvanized-pipe-replacement-2026-11.ts  # owner's "publish" only
//
// EXPERIMENT (tier 3 demand: no GSC or Bing signal for the phrasings tried 2026-11-27; repair-decision format not yet
// proven -- #357, #368, #378 reads fall 2026-12-19..25). Owner told before drafting.
//
// WHO / WANT / ACHIEVE: a buyer whose inspection found galvanized supply pipe; wants to know if it must be replaced and
// how to decide; achieves a flow check, the right questions for the insurer and seller, and a written repipe quote
// before contingencies end.
//
// DECISION MAP. Buyer's question: "The house has galvanized pipes. Do I need to replace them before closing?"
//   does code force removal?               -> section 1 (IRC R102.7, R102.7.1, Table P2906.4/.5)
//   is it actually failing?                -> flow-check section (Table P2903.1 + our one-gallon timings)
//   will insurance ask?                    -> 4-point form section (Citizens Insp4pt 03 25) + link #393
//   was it partly repiped / permitted?     -> same section (R105.2) + link #324 for joints (not repeated)
//   is the street line lead-related?       -> service-line section (40 CFR 141.2) + link #317 (not repeated)
//   what does it cost / how to negotiate?  -> pricing section (engine) + link #352 for credit limits
//   how to identify the pipe               -> #320 exists; skipped here
//   how common is it?                      -> our ACS count (scripts/build-galvanized-era-housing.ts)
//
// FIRST-PARTY: ACS B25034 count of galvanized-era housing (our script); one-gallon timings from the code table; engine price.
//
// READ 2027-01-01 (5 weeks): seen / chosen / acted.
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
const CAPTURE = '2026-11-27-demand-galvanized-pipe-replacement';
const STOP = 'Read 2027-01-01: shown on Google or Bing for at least one galvanized replacement or repipe search; if not shown, write no more repair-decision pages without tier 1 or tier 2 demand.';
const LIVE_SIBLINGS = ['connect-pex-copper-to-galvanized-pipe', 'identify-water-pipes-pex-copper-galvanized', 'lead-service-line-lookup-by-address', '4-point-inspection-florida', 'cast-iron-pipe-repair-options'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('plumbing', { slug: 'galvanized-pipe-replacement-before-closing', targetQuery: 'galvanized pipe replacement before closing', intent: 'informational',
      who: 'a buyer whose home inspection found galvanized steel water supply pipe in a house built before 1970',
      want: 'to know whether the galvanized pipe has to be replaced before closing and how to decide',
      achieve: 'to time the water flow, know what the insurer and seller will ask, and get a written repipe quote before the contingencies end',
      titlePromise: 'whether galvanized pipe must be replaced before closing, and how to decide if it should be' },
    { slug: 'galvanized-pipe-replacement-before-closing', readerGoal: 'The inspector says the house has galvanized pipes. Do I have to replace them before I close, and is it worth it?',
      firstScreen: 'A quick answer (no code forces removal; condition, insurer and price decide), then the opening paragraph with our engine repipe price.',
      firstParty: [
        { what: 'Count of US housing units built through 1969 (51.0M of 143.8M, 35.5%; 279 of 1,773 counties at half or more) from Census ACS B25034', source: 'docs/data/galvanized-era-housing.json' },
        { what: 'One-gallon timings (34, 15, 12 seconds) computed from 2021 IRC Table P2903.1 design flows', source: LEDGER('galvanized-pipe-replacement-before-closing') },
        { what: 'Whole-home repipe price and 1969 cut-off from our report engine, read at run time', source: 'src/engine/inspectionPriorities.ts' },
      ],
      evidenceOfWork: ['"How we checked this" names the ICC chapters, eCFR section and Citizens form read on 2026-11-27, our arithmetic and our Census script', 'says what we could not check: lead pick-up inside galvanized pipe, lender rules, local code editions'],
      beyondCommonFacts: ['IRC R102.7 lets existing plumbing stay and Table P2906.5 still lists galvanized steel (ASTM A53), so no model code forces removal', 'a static gauge reading cannot show a narrowed pipe; timing flow against Table P2903.1 can', 'the Citizens 4-point form records original vs partially vs completely re-piped with the year', 'the federal galvanized-requiring-replacement label covers only the service line to the building inlet, not pipe inside the house'],
      reproducibilityCheck: 'Top results are plumber sales pages saying to repipe and forum threads. None cites R102.7 or Table P2906.5, turns the code flow table into a timed test a buyer can run, reads the 4-point form\'s re-piped boxes, separates the 40 CFR 141.2 service-line label from interior pipe, or counts galvanized-era housing.',
      discussion: 'needed', discussionReason: 'The reader weighs repipe now, a credit, or keeping the pipe, and the answer changes with flow, insurer and whether the house was partly repiped.' }),
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
    const engine = PRIORITY_RULES.find((r: any) => r.id === 'galvanized_supply')!;
    for (const t of ['$4,000 – $15,000']) if (!String(engine.typicalRepairCost).includes(t)) fail(`${slug}: engine no longer says "${t}"`); else if (!d.body.includes(t)) fail(`${slug}: body lacks engine figure "${t}"`);
    if (engine.maxYear !== 1969) fail(`${slug}: engine galvanized_supply maxYear is ${engine.maxYear}, body says 1969`);
    // Our ACS figures must match the committed dataset the build script wrote.
    const era = JSON.parse(fs.readFileSync('docs/data/galvanized-era-housing.json', 'utf8'));
    for (const [t, v] of [['51.0 million', (era.national.builtThrough1969 / 1e6).toFixed(1) + ' million'], ['143.8 million', (era.national.housingUnits / 1e6).toFixed(1) + ' million'], ['35.5%', (era.national.share * 100).toFixed(1) + '%'], ['279 of the 1,773', `${era.countiesWithMinUnits.halfOrMoreBuiltThrough1969} of the ${era.countiesWithMinUnits.counties.toLocaleString('en-US')}`], ['81.9%', (era.topByShare[0].share * 100).toFixed(1) + '%']])
      if (t !== v) fail(`${slug}: dataset says ${v}, body expects ${t}`); else if (!d.body.includes(t)) fail(`${slug}: body lacks "${t}"`);
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
