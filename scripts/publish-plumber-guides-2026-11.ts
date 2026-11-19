// Publish two plumber-facing guides (owner, 2026-11-19: "if we were to create articles that plumbers in USA would
// read, what would it be?" -> "write both using answer-ready-writing"). Titles are ours; awaiting owner "publish".
//   A. "Does a Water Heater Need an Expansion Tank?"      water-heater-expansion-tank-required
//   B. "Cast Iron Pipe Repair: Descale, Line or Replace?" cast-iron-pipe-repair-options
//
//   npx tsx scripts/publish-plumber-guides-2026-11.ts               # dry run (also prints the passage report)
//   APPLY=true npx tsx scripts/publish-plumber-guides-2026-11.ts
//
// Facts: data/fact-ledgers/<slug>.json (2021 IRC ch. 1, 29, 30 and 2021 IPC ch. 6, 7 on codes.iccsafe.org;
// Kingsport TN + Enterprise OR thermal expansion notices; Amtrol Therm-X-Trol I&O 9017-091; engine hvac_age +
// sewer_cast_iron). UPC (epubs.iapmo.org) blocked by a robot check -- named on both pages, not worked around.
//
// Demand (first-party, relative only): topic-demand 2026-11-19 -- Bing records "water heater expansion tank" (605
// exact) and "expansion tank for water heater" (456); nothing via this site. Cast iron: GSC shows #300 for
// repair/cost queries ("cast iron sewer stack is rusting through ... what will this cost" 61 impr, "descaling cast
// iron sewer pipe cost" 31, "cast iron pipe repair" 23, "cast iron sewer pipe repair" 11), 0 clicks.
// RISK (B): those queries currently reach #300. B is the method decision (#300 covers signs/causes and links out
// only by #300's own text); if B takes #300's repair impressions without adding clicks, report it, don't edit #300.
//
// DECISION MAP A -- "My plumber says the new water heater needs an expansion tank. Does it?"
//   | sub-question                              | answered where                                        |
//   | does code require one                     | this page (IRC P2903.4-.4.2, IPC 607.3: "a device")    |
//   | is my house a closed system               | this page (meter check valve x2 utilities, PRV, BFP)  |
//   | what happens without control              | this page (Kingsport list); the T&P valve -> #56      |
//   | is a tank the only option                 | this page (Kingsport: relief valve, ball-cock, tank)  |
//   | where it goes, how it is set              | this page (Amtrol: cold supply, vertical, precharge)  |
//   | maintenance                               | this page (Amtrol yearly check)                       |
//   | what it costs                             | heater from engine hvac_age; tank SKIPPED (no figure) |
//   | Uniform Plumbing Code                     | SKIPPED (robot check), named on the page              |
// DECISION MAP B -- "My cast iron drain is corroded. Descale, line, spot-repair or replace?"
//   | the four options                          | this page (table)                                     |
//   | is descaling enough                       | this page (P3011.3: prep step + video)                |
//   | can it be lined                           | this page (P3011.2 4"+, P3011.5 defects, IPC 717.2)   |
//   | permits and videos                        | this page (R105.2, P3011.4/.8, P3010.7)               |
//   | spot-repair joints                        | this page (P3003.4.3, P3003.13, P3003.13.4)           |
//   | costs                                     | engine sewer_cast_iron; descale/lining SKIPPED        |
//   | is my pipe bad / signs                    | #300 (link)                                           |
//   | a sag in the line                         | #335 (link)                                           |
//   | booking the camera                        | #339 (link)                                           |
//
// READ 2026-12-25 (5 weeks): seen / clicked / acted per page on Google and Bing (answer-ready-writing part 3);
// for B also #300's repair-query impressions before vs after; and backlink-watch for any plumber citing either.
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
const CAPTURE = '2026-11-19-demand-cast-iron-pipe-lining-bing';
const STOP = 'Read 2026-12-25: no Google or Bing impressions on either page means no more plumber-facing code guides until one is shown; if the cast iron page only takes #300 repair-query impressions with no added clicks, report the overlap to the owner (no edit to #300).';
const LIVE_SIBLINGS = ['why-cast-iron-pipes-corrode', 'sewer-line-belly-found-inspection', 'sewer-scope-before-buying-house',
  'tpr-valve-inspectors-always-check', 'orangeburg-pipe-collapse', 'burst-pipe-what-to-do-insurance',
  'identify-water-pipes-pex-copper-galvanized', 'sewer-lateral-inspection-at-sale-cities', 'home-insurance-water-sewer-service-line'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('plumbing', { slug: 'water-heater-expansion-tank-required', targetQuery: 'water heater expansion tank', intent: 'informational',
      who: 'a homeowner whose plumber has just quoted an expansion tank with a new water heater and said code requires it',
      want: 'whether the code really requires a tank in their house, and what the tank does',
      achieve: 'to check whether their supply is closed (meter check valve, PRV, backflow preventer), accept or question the tank, and ask for the precharge to be set',
      titlePromise: 'when a water heater needs an expansion tank under the plumbing code, and how one should be set' },
    { slug: 'water-heater-expansion-tank-required', readerGoal: 'My plumber says the new water heater needs an expansion tank. Is that true for my house?',
      firstScreen: 'The quick answer: only on a closed system (check valve, backflow preventer, PRV); the code asks for a device, not a tank; a utility meter check valve can close a house without any plumbing change.',
      firstParty: [{ what: 'Engine hvac_age water heater replacement cost, read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Our side-by-side reading of IRC P2903.4 and IPC 607.3 against two utilities\' meter check-valve notices and a tank maker\'s instructions, with the conflict between them resolved and named', source: LEDGER('water-heater-expansion-tank-required') }],
      evidenceOfWork: ['"How we checked this" names each code section, both utility notices and the Amtrol instructions, read 2026-11-19/20', 'says where Enterprise OR contradicts the IPC and Amtrol and which we followed, and that the UPC was blocked'],
      beyondCommonFacts: ['the code requirement is "a device for controlling pressure", so a tank is one of three listed options', 'a utility fitting a dual check valve at the meter closes the house with no change inside it (Kingsport 2026 notice; Enterprise OR last ten years)', 'the IRC PRV trigger is limited to water services up to 2 inches', 'T&P pressure side is normally 125 or 150 psi against the IRC 80 psi cap, so it is not pressure control'],
      reproducibilityCheck: 'Top results are plumber and retailer blogs saying "most codes require one". None quotes the IRC and IPC side by side, shows the code asks for a device rather than a tank, or uses a utility\'s own notice to show how a meter swap closes the system.',
      discussion: 'needed', discussionReason: 'The answer depends on the house: what sits on the supply, which device suits it, and how the local code was adopted.' }),
  S('plumbing', { slug: 'cast-iron-pipe-repair-options', targetQuery: 'cast iron pipe repair', intent: 'informational',
      who: 'a homeowner or buyer holding a plumber\'s quote for corroded cast iron drain pipe, choosing between descaling, lining and replacement',
      want: 'which repair method their pipe qualifies for, what the code requires for each, and what each costs',
      achieve: 'to ask for the pipe diameter and the post-cleaning video, rule lining in or out, and compare a spot repair with full replacement',
      titlePromise: 'how to choose between descaling, lining and replacing cast iron drain pipe under the code' },
    { slug: 'cast-iron-pipe-repair-options', readerGoal: 'My cast iron drain is corroded. Should I descale it, line it or replace it?',
      firstScreen: 'The quick answer: the cleaned-pipe video decides; descaling is the step before lining; lining is 4 inches and up and barred on defects; engine spot repair and replacement costs.',
      firstParty: [{ what: 'Engine sewer_cast_iron house-age window, camera scope, spot repair and full replacement costs, read at publish time', source: 'src/engine/inspectionPriorities.ts' },
        { what: 'Our reading of the 2021 IRC relining, pipe-bursting, joint and permit-exemption sections as one decision table, with the cells we have no figure for left empty', source: LEDGER('cast-iron-pipe-repair-options') }],
      evidenceOfWork: ['"How we checked this" names each IRC/IPC section read 2026-11-19/20', 'says plainly we have no descaling or lining price and did not read inside the paywalled ASTM standards'],
      beyondCommonFacts: ['the IRC and IPC limit relining to gravity drain pipe 4 inches and larger', 'relining is barred where the video shows backslope, complete wall loss or separations; those sections must be dug out', 'replacing a defective concealed drain pipe is new work needing a permit under R105.2, while stopping a leak is exempt', 'a lined pipe should come with two videos and a finaled permit (P3011.4, P3011.8)', 'pipe bursting is limited to 6 inches and smaller, HDPE to ASTM F714'],
      reproducibilityCheck: 'Top results are lining-company and plumber pages selling one method. None reads the IRC relining section, so none says lining stops at 4 inches, is barred on defects, or needs the official to review video before the permit.',
      discussion: 'needed', discussionReason: 'The reader weighs methods against their pipe\'s size and condition and a spot repair against a whole run.' }),
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
  const c = rule('sewer_cast_iron');
  if (c.maxYear !== 1973) throw new Error('ABORT: sewer_cast_iron maxYear changed');
  if (!String(c.costToCheck).includes('$300 – $500')) throw new Error('ABORT: sewer_cast_iron scope cost changed');
  if (!String(c.typicalRepairCost).includes('Spot repair $1,500 – $5,000') || !String(c.typicalRepairCost).includes('full replacement $4,000 – $15,000+')) throw new Error('ABORT: sewer_cast_iron repair cost changed');
  if (!String(rule('hvac_age').typicalRepairCost).includes('water heater replacement $1,200 – $3,000')) throw new Error('ABORT: hvac_age water heater cost changed');
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
