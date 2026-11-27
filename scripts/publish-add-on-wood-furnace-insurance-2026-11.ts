// Publish /guides/add-on-wood-furnace-insurance-requirements/ -- Add-On Wood Furnace Insurance Requirements: What to Show.
// A NEW URL. Prepared by the growth agent 2026-11-24; NOT applied. #325 (home-insurance-with-wood-stove) is not edited.
//
//   npx tsx scripts/publish-add-on-wood-furnace-insurance-2026-11.ts            # dry run
//   APPLY=true npx tsx scripts/publish-add-on-wood-furnace-insurance-2026-11.ts  # owner's "publish" only
//
// WHY. Tier 1 first-party demand: our own Search Console shows the site for "add on wood furnace insurance requirements"
// (capture 2026-11-24-gsc-queries: 34 impressions, position 31.2; 49 at 34.2 on 2026-11-23). No page owns the job: #325 is
// about freestanding stoves and never mentions add-on furnaces. Insurance-question format (median ~57 Google impr/28d).
//
// WHO / WANT / ACHIEVE: a buyer (or new owner) of a house with a wood furnace tied into the existing furnace's ducts, about to
// ask for a homeowners quote; wants to know what the insurer will ask to see; achieves a quote in writing before the
// inspection period ends, with photos of the nameplate and EPA label, the permit record and a chimney report in hand.
//
// DECISION MAP (answer-ready-writing). Buyer's question: "Can I insure this house with the add-on wood furnace, and what do I show?"
//   what will they ask for?              -> table up top (mark, EPA label, permit, chimney, manual)
//   is the furnace listed, for what?     -> UL 391 section (scope 1.1 names add-ons) + IRC M1303.1 nameplate
//   is it to code?                       -> IRC M1402.1 gap -> M1301.1 -> IMC 918.1; M1302.1, M1402.2
//   how old / is it legal to run?        -> 40 CFR 60 subpart QQQQ label + limits + 60.5480
//   is my model certified?               -> our EPA database search (6 current / 27 incl. previous)
//   what if it fails?                    -> written quote; price talk / listed replacement / removal under permit
//   wood stove instead of furnace        -> #325 (linked in prose, not repeated)
//
// FIRST-PARTY: our EPA database counts (2026-11-24) and the IRC-vs-IMC side-by-side reading; chimney price from our engine.
//
// READ 2026-12-29 (5 weeks): seen / chosen / acted.
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
const CAPTURE = '2026-11-24-gsc-queries';
const STOP = 'Read 2026-12-29: shown on Google or Bing for at least one add-on or wood furnace insurance search; if not shown, write no more heating-appliance insurance pages until one is.';
const LIVE_SIBLINGS = ['home-insurance-with-wood-stove', 'hvac-techs-wish-buyers-knew-about-system-age', 'get-home-insurance-fuse-box'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('hvac', { slug: 'add-on-wood-furnace-insurance-requirements', targetQuery: 'add on wood furnace insurance requirements', intent: 'informational',
      who: 'a buyer or new owner of a house where a wood furnace feeds heat into the ductwork of the existing oil, gas or electric furnace, about to ask for a homeowners quote',
      want: 'to know what an insurer can ask to see about the add-on wood furnace and where to find each item on the furnace or in public records',
      achieve: 'to get a written quote on the house as it is before the inspection period ends, with nameplate and EPA label photos, the permit record and a chimney report in hand',
      titlePromise: 'the list of things to show an insurer for an add-on wood furnace, and where each one is found' },
    { slug: 'add-on-wood-furnace-insurance-requirements', readerGoal: 'The house has a wood furnace hooked into the regular furnace. Will that cause an insurance problem, and what do I show them?',
      firstScreen: 'A one-paragraph answer (no public rulebook; what is asked is checkable) and then the five-row table of what to show and where to find it.',
      firstParty: [
        { what: 'EPA certified wood heater database searched 2026-11-24: 6 forced-air furnace entries among 41 current central heaters; 27 among 192 with previously certified models, 18 not marked 2020 compliant', source: LEDGER('add-on-wood-furnace-insurance-requirements') },
        { what: 'Side-by-side reading of 2021 IRC M1402.1 (no solid-fuel furnace standard) against 2021 IMC 918.1 (UL 391) via IRC M1301.1', source: LEDGER('add-on-wood-furnace-insurance-requirements') },
        { what: 'Level 2 chimney inspection price from our report engine, read at run time', source: 'src/engine/inspectionPriorities.ts' },
      ],
      evidenceOfWork: ['"How we checked this" names the eCFR, ICC and UL pages read on 2026-11-24 and our two EPA database searches', 'says what we could not check: UL 391, NFPA 211 and NFPA 90B full text, insurer filings for furnaces, local code editions'],
      beyondCommonFacts: ['UL 391 scope 1.1 names supplementary furnaces that interconnect with other-fuel forced-air furnaces, so add-ons have their own listing', 'the 2021 IRC central furnace section has no wood line; M1301.1 hands it to IMC 918.1, which names UL 391', 'EPA labels apply only to furnaces made on or after May 15, 2015, so an older furnace without one is not a red flag by itself', 'EPA lists only 6 currently certified forced-air furnace entries'],
      reproducibilityCheck: 'Top results are maker sales pages, forum threads and agency blog posts that say to call your agent. None quotes the UL 391 scope, notices the IRC M1402.1 gap and the route to IMC 918.1, explains the 2015 cut-off for the EPA label, or counts the certified furnaces on EPA\'s list.',
      discussion: 'needed', discussionReason: 'The reader weighs an unlisted or unlabeled furnace against a price talk, a listed replacement or removal, and the answer changes with the furnace\'s age and the local code edition.' }),
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
    const engine = PRIORITY_RULES.find((r: any) => r.id === 'chimney_level2')!;
    for (const t of ['$250 – $600']) if (!String(engine.costToCheck).includes(t)) fail(`${slug}: engine no longer says "${t}"`); else if (!d.body.includes(t)) fail(`${slug}: body lacks engine figure "${t}"`);
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
