// Publish two new electrical guides (owner, 2026-11-19: "yes start with both", then "go with pushmatic").
// They replace the dropped "how to fix an open ground" idea, which would have competed with #235. Owner rule the
// same day: grow by ADDING pages; these link out to existing guides and no existing guide is edited.
//
//   npx tsx scripts/publish-electrical-new-pages-2026-11.ts               # dry run
//   APPLY=true npx tsx scripts/publish-electrical-new-pages-2026-11.ts
//
// Pages (facts: data/fact-ledgers/<slug>.json):
//   - two-prong-outlets-buying-house   IRC 2021 E4002.2 (ICC, browser); Florida sample 4-point form Insp4pt 03 25 read
//                                      line by line; CPSC recall 97-066; engine knob_and_tube; our Bing query
//   - pushmatic-panel-buying-house     our CPSC recall-API query (0 records, Challenger control); UBIP listing;
//                                      4-point form panel lines; engine electrical_panel_brand; our Bing query
//
// Demand (data/keywords/2026-11-10-bing-queries.json): one Bing query each, a thin first-party sample -- relative
// only, never a volume. Both pages are experiments.
//
// READ 2026-12-24 (5 weeks): Google and Bing impressions per page. Stop condition below.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-10-bing-queries';
const STOP = 'Read 2026-12-24: a page with no Google or Bing impressions by then gets no more electrical siblings in its line; if the two-prong page is shown only for #235 open-ground queries, report the overlap to the owner instead of adding pages.';
const LIVE_SIBLINGS = ['open-ground-mean-electrical-inspection', 'need-gfci-outlets-pass-home-inspection', 'knob-tube-wiring-have-be-replaced-before-closing',
  'what-is-knob-and-tube-wiring', 'knob-and-tube-removal-cost-permits', 'reverse-polarity-mean-electrical-inspection', 'identify-electrical-panel-brand',
  'federal-pacific-stab-lok-panel-inspectors-flag', 'will-zinsco-panel-fail-4-point-inspection', 'option-period-negotiating-home-repairs'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('electrical', { slug: 'two-prong-outlets-buying-house', targetQuery: "what's the difference between an open ground and using a 2 to 3 prong adapter", intent: 'informational',
      who: 'a buyer touring or under contract on an older house where most outlets have two slots and the seller has adapters plugged in',
      want: 'what two-prong outlets say about the wiring and whether they will cause trouble with the inspection or insurance',
      achieve: 'to find out what is behind the wall, read the 4-point form wording, and get an electrician quote before the contingency ends',
      titlePromise: 'what two-prong outlets mean in a house you are buying and what to check before closing' },
    { slug: 'two-prong-outlets-buying-house', readerGoal: 'The house we want has two-prong outlets everywhere. Is that a problem and what do I check?',
      firstScreen: 'The point that the outlet is cheap and the wiring behind it is the question, then the code line that makes two-slot outlets an older installation.',
      firstParty: [{ what: 'Florida sample 4-point inspection form Insp4pt 03 25 read line by line for its grounding and wiring-type boxes', source: LEDGER('two-prong-outlets-buying-house') },
        { what: 'Engine knob_and_tube rule (year window, no ground conductor, rewire cost) read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Our own Bing query asking the open-ground vs adapter difference, labelled as ours', source: 'data/keywords/2026-11-10-bing-queries.json' }],
      evidenceOfWork: ['"How we checked this" naming IRC 2021 E4002.2, the 4-point form and CPSC recall 97-066, read 2026-11-19', 'says plainly what we could not verify: the NEC replacement section number and the first-required year'],
      beyondCommonFacts: ['the adapter\'s own printed warning and package say it is for a two-slot GROUNDED outlet, so on an ungrounded box the third prong connects to nothing', 'the 4-point form has an Improper grounding hazard box and a separate Cloth (Knob & Tube) wiring box, and says underwriting relies on it', 'a 1997 CPSC recall covered about 60,000 adapter packs falsely marked UL listed'],
      reproducibilityCheck: 'Top results explain grounding in general and list fixes. None reads the adapter\'s printed warning, walks the 4-point form boxes a buyer will be judged on, or ties the outlets to the engine\'s knob-and-tube window and rewire cost.',
      discussion: 'needed', discussionReason: 'Two very different houses sit behind the same outlet (grounded box vs no ground at all); the buyer has to weigh which one and what the form says.' }),
  S('electrical', { slug: 'pushmatic-panel-buying-house', targetQuery: 'how to identify pushmatic panel model number', intent: 'informational',
      who: 'a buyer whose inspector noted a Pushmatic, Bulldog or I-T-E panel with push-button breakers in the house they are under contract on',
      want: 'whether a Pushmatic panel is a real problem or just an old brand, and what to do about it before the deadline',
      achieve: 'to get the insurer\'s answer in writing and an electrician\'s price, then decide between keeping it, a credit or a replacement',
      titlePromise: 'whether a Pushmatic panel is a problem when buying a house and what decides it' },
    { slug: 'pushmatic-panel-buying-house', readerGoal: 'The inspector says the house has a Pushmatic panel. Is that bad and what do I do?',
      firstScreen: 'The quick answer: no CPSC recall on record, parts still sold, so age, condition and the insurer\'s written answer decide it.',
      firstParty: [{ what: 'Our own query of CPSC\'s public recall API for Pushmatic (0 records by product name and by title) with Challenger as a working control', source: LEDGER('pushmatic-panel-buying-house') },
        { what: 'Engine electrical_panel_brand rule (1950-1989, replacement cost) read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Florida sample 4-point form panel lines read line by line', source: LEDGER('pushmatic-panel-buying-house') }],
      evidenceOfWork: ['"How we checked this" naming the CPSC query and its control, the form and the supplier listing, 2026-11-19', 'names the blocked insurer help page and the redirecting manufacturer site'],
      beyondCommonFacts: ['a recall search that returns nothing is checked against a control brand that returns its 1988 program', 'replacement breakers are sold as classified for Pushmatic and Bulldog load centers, so no-parts is not a reason by itself', 'the 4-point form records panel age and year last updated, not only the brand'],
      reproducibilityCheck: 'Top results repeat inspector-blog claims about stiff breakers and carrier refusals. None runs the recall search with a control, reads the 4-point panel lines, or prices the replacement from a working engine.',
      discussion: 'needed', discussionReason: 'Keep, credit or replace depends on age, condition and one insurer\'s answer; the reader weighs those.' }),
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
  const need = (id: string, field: 'costToCheck' | 'typicalRepairCost' | 'description', s: string) => {
    if (!String((rule(id) as any)[field] ?? '').includes(s)) throw new Error(`ABORT: engine ${id}.${field} no longer contains "${s}" -- update the pages that quote it`);
  };
  need('knob_and_tube', 'typicalRepairCost', '$8,000 – $30,000+');
  need('electrical_panel_brand', 'typicalRepairCost', '$1,500 – $4,000');
  const kt = rule('knob_and_tube'), panel = rule('electrical_panel_brand');
  if (!JSON.stringify(kt).includes('no ground conductor')) throw new Error('ABORT: knob_and_tube no longer says "no ground conductor"');
  if (kt.maxYear !== 1955) throw new Error('ABORT: knob_and_tube window changed');
  if (panel.minYear !== 1950 || panel.maxYear !== 1989) throw new Error('ABORT: panel window changed');
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
