// Publish /guides/home-inspection-checklist-cost/ -- Home Inspection: Checklist, Cost and What Inspectors Skip.
// A NEW URL. Distinct from #342 dont-skip-the-home-inspection (regret survey, appraisal vs inspection, ASHI SOP
// exclusions, add-on cost table); #342 explicitly left out the base fee, state standards and licensing, which this page covers.
//
//   npx tsx scripts/publish-home-inspection-checklist-cost-2026-11.ts            # dry run
//   APPLY=true npx tsx scripts/publish-home-inspection-checklist-cost-2026-11.ts
//
// WHY. Owner request 2026-11-20 (keyword "home inspection" + phrases chosen from OpenSEO keyword-overview links; topic only,
// no OpenSEO figure on the page). First-party demand: Bing's own counts (capture 2026-11-20-demand-home-inspection-bing,
// relative only) record "home inspection", "home inspection checklist" and "home inspection cost".
//
// DECISION MAP (answer-ready-writing). Buyer's question: "What am I paying for, what will it miss, and who should I hire?"
//   what is a home inspection, legally?          -> intro (FL 468.8311 / TX 535.227 definitions)
//   what will the inspector check?               -> "A home inspection checklist built from the Texas rules" (table)
//   where can the inspector stop / skip?         -> "Where a home inspection can stop short" (departure rule, equipment)
//   what won't it tell me (age, code, cost)?     -> "What a home inspection won't tell you" (+ ASHI disagreement, our engine)
//   how much should it cost?                     -> section; ASHI 2021 $300-$600, FL contingent-fee ban; add-ons -> #342
//   how do I check the inspector?                -> section; FL licence law + our DBPR search (209 records, discipline)
//   is it the same as an insurance inspection?   -> "Home inspection for insurance is a different job" (FL 627.711)
//   termites / asbestos / GFCI / 4-point         -> answered on #181, #28, #266, #23 (linked, not repeated)
//   other states' standards                      -> skipped: not read
//
// FIRST-PARTY: DBPR licence search walked 2026-11-20 (209 Home Inspector records with Martin selected; Special Qualification
// has no hurricane-mitigation flag); our count of the Texas GFCI (11) and arc-fault (13) lists; our report engine's roof_age /
// hvac_age wording ("Included in a general inspection") compared against the Texas rule, read at run time.
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
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-20-demand-home-inspection-bing';
const STOP = 'Read 2026-12-25: shown on Google or Bing for at least one home inspection cost, checklist or general home inspection search; if not shown, write no more broad head-term guides until one is, and check whether #342 lost impressions to it.';
const LIVE_SIBLINGS = ['dont-skip-the-home-inspection', 'need-gfci-outlets-pass-home-inspection', 'standard-home-inspection-include-termites', 'standard-home-inspection-check-asbestos', 'will-zinsco-panel-fail-4-point-inspection', 'when-reasonable-walk-away-after-inspection', 'water-heater-age-serial-number', 'how-to-tell-how-old-a-roof-is'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('transaction', { slug: 'home-inspection-checklist-cost', targetQuery: 'home inspection', intent: 'informational',
      who: 'a buyer with a house under contract who is about to book a home inspection and pay for it within the option or contingency period',
      want: 'to know what the inspector must check, where the inspector may stop, what a fair fee is and how to vet the inspector',
      achieve: 'to book the right inspector with the right add-ons, read the report against the state minimum, and know when insurance needs a separate form',
      titlePromise: 'a home inspection checklist from state rules, what an inspection costs, and what inspectors are allowed to skip' },
    { slug: 'home-inspection-checklist-cost', readerGoal: 'I am booking a home inspection. What will it actually cover, what should it cost, and who should I hire?',
      firstScreen: 'The two legal definitions (Florida and Texas) and where an inspection stops, then the checklist table.',
      firstParty: [
        { what: 'Florida DBPR licence search walked on 2026-11-20: 209 Home Inspector records with Martin County selected; the Special Qualification filter has no hurricane-mitigation flag; screenshot cropped of names', source: LEDGER('home-inspection-checklist-cost') },
        { what: 'Our count of the Texas GFCI (11) and arc-fault (13) location lists in 22 TAC 535.229', source: LEDGER('home-inspection-checklist-cost') },
        { what: 'Our report engine roof_age and hvac_age wording compared against the Texas rule, read at run time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Checklist table we built from 22 TAC 535.228-535.231 pairing each required item with the threshold where the inspector may stop', source: LEDGER('home-inspection-checklist-cost') },
      ],
      evidenceOfWork: ['"How we checked this" names each Texas section read (in full or in part), each Florida statute, the ASHI article and the DBPR search, dated 2026-11-20', 'screenshot of the DBPR results header, cropped to show no names or addresses', 'says what we could not check: TREC lookup, the members-only ASHI article, any government fee survey, other states'],
      beyondCommonFacts: ['Texas crawl space (18 inches headroom, 24 by 18 opening) and attic (22 by 30 opening, 30 inches headroom) entry thresholds', 'Texas departure rule: notice at the earliest practical opportunity, and advance notice for routinely skipped items', 'Florida bars an inspection fee contingent on the report or the close of escrow, and bars repairs on homes the inspector reported on', 'Florida 627.711 needs 3 hours of hurricane mitigation training for a home inspector to sign the wind mitigation form, and the DBPR search shows no field for it', 'ASHI 2021 says inspectors look for code violations and estimate appliance age; Texas does not require either'],
      reproducibilityCheck: 'Top results are inspector-company and franchise pages, lead-generation cost pages and national checklists. None pairs the Texas minimums with the thresholds where an inspector may stop, quotes the Florida contingent-fee ban, or notes that the Florida licence search has no hurricane-mitigation flag.',
      discussion: 'needed', discussionReason: 'The reader weighs a trade-association fee range against sources that disagree about scope (ASHI vs the Texas rule, our own report vs the Texas rule) to decide what to ask for when booking.' }),
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
    for (const id of ['roof_age', 'hvac_age']) {
      const r = PRIORITY_RULES.find((x: any) => x.id === id)!;
      if (!r.costToCheck.startsWith('Included in a general inspection')) fail(`${slug}: engine ${id} no longer says "Included in a general inspection" -- the comparison paragraph is stale`);
    }
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
