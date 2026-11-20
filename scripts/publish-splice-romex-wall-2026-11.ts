// Publish "Can You Splice Romex Inside a Wall?" (#1 of the 2026-11-20 shared-keywords review; title is ours).
// Written with write-article + answer-ready-writing. Awaiting owner "publish".
//
//   npx tsx scripts/publish-splice-romex-wall-2026-11.ts               # dry run (also prints the passage report)
//   APPLY=true npx tsx scripts/publish-splice-romex-wall-2026-11.ts
//
// Facts: data/fact-ledgers/splice-romex-in-wall.json (2021 IRC E3905.1 + E3905.1.1-.6, E3905.10, E3803.4, E3406.11,
// E3406.11.3, R105.2 on codes.iccsafe.org; TE instruction sheet 408-4504-1 Rev H, read from a distributor copy).
// NEC itself not read (NFPA free access needs an account), so nothing about NEC in-wall splice devices is on the page.
//
// Demand (first-party): topic-demand 2026-11-20 = tier 1 WEAK -- #289 splice-romex-knob-tube-wiring shown for "can you
// splice romex in a wall" (pos 10), "how to splice romex in a junction box", "splice romex"; 1 impression each, 0 clicks;
// Bing counts 0 (unknown). #289 is a Romex-to-knob-and-tube page; this page is NM to NM in a finished wall.
// OVERLAP: links #289 for K&T and #315 for hidden DIY work; neither is edited (owner rule 2026-11-19).
//
// DECISION MAP -- "My Romex is short inside the wall. Can I just splice it there?"
//   | sub-question                              | answered where                                        |
//   | can I splice inside a wall                | this page (E3905.1, E3905.10)                         |
//   | what makes the splice itself legal        | this page (E3406.11, E3406.11.3 6-inch free wire)     |
//   | do any exceptions let me skip the box     | this page (E3905.1.1-.6 table; E3803.4 buried)        |
//   | in-wall splice kits                       | this page (TE 408-4504-1 limits); NEC text SKIPPED    |
//   | what to do instead                        | this page (blank cover / outlet / new cable)          |
//   | splicing to knob and tube                 | #289 (link)                                           |
//   | buying a house with hidden splices        | this page + #315 (link)                               |
//   | permit                                    | this page (R105.2 item 5); local call                 |
//
// READ 2026-12-25 (5 weeks): seen / clicked / acted on Google and Bing; also #289's "splice romex" rows before vs after
// (if this page only takes #289's rows with no added clicks, report it; no edit to #289).
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
const CAPTURE = '2026-11-20-demand-splice-romex-in-wall-gsc';
const STOP = 'Read 2026-12-25: no Google or Bing impressions means no more electrical code-question pages until one is shown; if it only takes #289 splice rows with no added clicks, report the overlap to the owner (no edit to #289).';
const LIVE_SIBLINGS = ['splice-romex-knob-tube-wiring', 'pigtail-double-tapped-breaker', 'unpermitted-work-behind-the-wall',
  'what-is-knob-and-tube-wiring', 'two-prong-outlets-buying-house', 'aluminum-wiring-repair-cost-before-closing', 'amateur-workmanship-mean-home-inspection-report'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('electrical', { slug: 'splice-romex-in-wall', targetQuery: 'can you splice romex in a wall', intent: 'informational',
      who: 'a homeowner or new buyer mid-remodel whose Romex cable came up short inside a finished wall, or whose electrician proposed an in-wall splice',
      want: 'whether two lengths of NM cable may be joined inside a closed wall, and what the code accepts instead',
      achieve: 'to pick one of three compliant fixes (box with blank cover, outlet, new cable), check any in-wall kit against its maker limits and ask the building department before the wall is closed',
      titlePromise: 'whether a Romex splice can sit inside a wall under the 2021 IRC, and the fixes that comply' },
    { slug: 'splice-romex-in-wall', readerGoal: 'My Romex is short inside the wall. Can I just splice it there and close it up?',
      firstScreen: 'The quick answer: only in a box you can still reach (E3905.1 + E3905.10); none of the six exceptions is an in-wall kit; the building department decides on kits.',
      firstParty: [{ what: 'Our check of all six 2021 IRC exceptions to the box rule (E3905.1.1 to E3905.1.6) against an NM-to-NM splice in a closed wall, as a table labelled as our reading', source: LEDGER('splice-romex-in-wall') },
        { what: 'Our read of a splice-kit maker instruction sheet (TE 408-4504-1 Rev H) for its own limits, set against the IRC text', source: LEDGER('splice-romex-in-wall') }],
      evidenceOfWork: ['"How we checked this" names each IRC section and the TE sheet read 2026-11-20, and says the ICC bot check was cleared by the owner by hand', 'says we could not read the NEC itself and read TE\'s sheet from a distributor copy, and why'],
      beyondCommonFacts: ['a box behind drywall still fails, because E3905.10 requires the wiring to be reachable without removing any part of the building', 'the buried-splice exception (E3905.1.5 / E3803.4) is for cable in the ground, not in a wall cavity', 'TE\'s in-wall NM splicing device is not for NM cable made before 1990 and only for 14/12 AWG solid copper, installed by qualified personnel', 'E3406.11.3 needs 6 inches of free conductor in the box, 3 inches past a small opening, so a short cable is shorter than it looks'],
      reproducibilityCheck: 'Top results are Reddit, JustAnswer, Facebook and DIY forum threads with conflicting answers. None quotes E3905.1 and E3905.10 together, walks through the six exceptions, or reads a splice kit maker sheet for its 1990 and qualified-personnel limits.',
      discussion: 'needed', discussionReason: 'The reader weighs three fixes and an in-wall kit against wall work, the cable age and what the building department will accept.' }),
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
