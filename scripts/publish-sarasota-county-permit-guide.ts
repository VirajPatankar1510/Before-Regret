// Publish /guides/check-building-permits-sarasota-county-fl/ -- Sarasota County Permit Search: Accela Login and AMANDA Records.
// A NEW URL. Next on the growth desk's list (docs/desk/opportunities.md row 1) and in the owner's Florida brief (2026-11-17).
// Owner had "no preference" on creating an Accela account (2026-11-28), so no account was made: no record walk, like Hernando #384.
//
//   npx tsx scripts/publish-sarasota-county-permit-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-sarasota-county-permit-guide.ts  # owner's "publish" only
//   then: VERBOSE=1 ONLY=check-building-permits-sarasota-county-fl npx tsx scripts/inject-permit-pulse.ts (read, then APPLY)
//
// DEMAND: tier 2 (Bing "sarasota county permit search" 1,556 exact, "...portal" 324; relative only). Proven format (county permit).
//
// WHO / WANT / ACHIEVE: a buyer or owner with a Sarasota-area address who needs its permit history; wants to know which office
// holds it and how to search when the portal asks for a login; achieves the right office, the right system (Accela vs AMANDA)
// and a no-account route (email/phone) before the inspection period ends.
//
// DECISION MAP. Buyer's question: "Where do I find the permits for this Sarasota house?"
//   which office holds them?        -> jurisdiction table (county / Sarasota / Venice / North Port / Longboat Key unconfirmed)
//   how big is the county's share?  -> our Census split (scripts/build-sarasota-permit-era-shares.ts)
//   why does it ask me to log in?   -> Accela section (FAQ vs Online Permitting page disagreement; our no-account test)
//   where are older permits?        -> AMANDA section (closed before Aug 18, 2023)
//   why is recent work missing?     -> HB 803 $7,500 exemption section (553.79(1)(g))
//   no account / nothing found?     -> email/phone/offices; lien search via GIR; open permits -> #351 link
//   what is permitted now?          -> Permit Pulse block after publish
//
// READ 2027-01-04 (5 weeks): seen / chosen / acted.
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
const CAPTURE = '2026-11-28-demand-sarasota-county-permit-search';
const STOP = 'Read 2027-01-04: shown on Google or Bing for at least one Sarasota permit search; if not shown, hold Lee, Pasco and Duval until the Martin and Hernando reads.';
const LIVE_SIBLINGS = ['check-building-permits-hernando-county-fl', 'check-building-permits-brevard-county-fl', 'check-building-permits-collier-county-fl', 'check-building-permits-martin-county-fl', 'check-building-permits-pinellas-county-fl', 'resolve-open-building-permits-before-closing'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('permits', { slug: 'check-building-permits-sarasota-county-fl', targetQuery: 'sarasota county permit search', intent: 'navigational',
      who: 'a buyer or owner with a Sarasota-area address who needs the house\'s building permit history',
      want: 'to know which office holds the permits and how to search them when the county portal asks for a login',
      achieve: 'to reach the right office and system (Accela or AMANDA) or ask by email or phone before the inspection period ends',
      titlePromise: 'how to search Sarasota County permits, why Accela asks for a login, and where older AMANDA records are' },
    { slug: 'check-building-permits-sarasota-county-fl', readerGoal: 'I need the permit history for a house in Sarasota. Where do I search, and why does the county site want me to log in?',
      firstScreen: 'The opening paragraph with the Accela link and the FAQ line that an account is required, then the table of which office holds which addresses.',
      firstParty: [
        { what: 'Census B25034 split of Sarasota County housing outside the City of Sarasota, Venice and North Port (174,272 units, 65.4%; 59% built before 1990)', source: 'docs/data/sarasota-permit-era-shares.json' },
        { what: 'No-account test of the Accela Building search on 2026-11-28 (redirects to login) and the disagreement between the county FAQ and Online Permitting page', source: LEDGER('check-building-permits-sarasota-county-fl') },
      ],
      evidenceOfWork: ['"How we checked this" names the county and city pages read on 2026-11-28, our no-account portal test and our Census script', 'says what we could not check: no account made, AMANDA and three city portals did not load, Longboat Key behind a bot check, Bulletin 2026-0002 unread'],
      beyondCommonFacts: ['the AMANDA cut-off is the date a permit was CLOSED (before August 18, 2023), not issued', 'the county Online Permitting page does not mark Building as login-only but the portal and FAQ require a login', 'North Port uses a separate Accela agency (NORTHPORT) on the same Accela site', 'since July 1, 2026 work under $7,500 can be legally exempt from a permit but needs a written exemption request', 'about a third of county housing is in cities whose permits the county does not hold'],
      reproducibilityCheck: 'Top results are the county portal itself, title-company blogs and permit-expediter pages. None separates the county from the three cities with housing counts, notices the closed-date AMANDA cut-off, records what the Building search does without an account, or ties the 2026 $7,500 exemption to a missing permit.',
      discussion: 'not-needed', discussionReason: 'A navigational page: the reader needs the right office and route, not a weighing of options.' }),
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
    const era = JSON.parse(fs.readFileSync('docs/data/sarasota-permit-era-shares.json', 'utf8'));
    const o3 = era.outsideThreeCities;
    for (const [t, v] of [['266,492', era.countywide.housingUnits.toLocaleString('en-US')], ['174,272', o3.housingUnits.toLocaleString('en-US')], ['65.4%', o3.shareOfCountyPct + '%'], ['59%', o3.builtBefore1990Pct + '%'], ['3%', o3.built2020OrLaterPct + '%'], ['6,248', era.municipalities['Longboat Key town'].housingUnits.toLocaleString('en-US')]])
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
