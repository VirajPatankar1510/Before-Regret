// Content gate. Run BEFORE any script writes an article to the database.
//
//   npx tsx scripts/assert-article-quality.ts
//   npx tsx scripts/assert-article-quality.ts --seed     # re-baseline the grandfather list
//
// -----------------------------------------------------------------------------------------------
// WHY THIS IS NOT IN THE BUILD CHAIN.
//
// Every other assertion in this project runs inside `npm run build`. This one deliberately does
// not, because it reads the database, and this project has a documented history of Neon DNS
// failures (ENOTFOUND api.c-*.aws.neon.tech). A DB call inside the Vercel build turns an
// intermittent network fault into a failed deploy of the whole site. So this is a PRE-PUBLISH gate:
// publishing scripts call it before APPLY, and it can be run by hand any time.
//
// -----------------------------------------------------------------------------------------------
// THE RATCHET, which is the only reason this is enforceable at all.
//
// 45 of 57 published guides contain no cost figure and no numbered standard. A hard gate on that
// would fail immediately and be deleted within the week. So failures that already exist are
// GRANDFATHERED in data/quality-grandfathered.json, and the list may only shrink: a guide not on it
// must pass. New content is held to the standard without demanding a 45-guide backfill first.
//
// Rule 1 is not grandfathered and never will be. Nothing currently violates it, so strictness is
// free, and it is the one rule where a single violation is materially harmful rather than merely
// weak.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRANDFATHER = path.join(ROOT, 'data', 'quality-grandfathered.json');
const SEED = process.argv.includes('--seed');

// -------------------------------------------------------------------------------------------
// RULE 1: never assert a named carrier's underwriting position. HARD FAIL, no exceptions.
//
// Bing query data shows 29% of searches carry insurance intent and many NAME a carrier: "will
// liberty insurance insure a 1932 house that has some knob and tube wiring", "is branch circuit
// aluminum wiring ok for state farm home insurance". The temptation is to answer directly.
//
// We hold no carrier underwriting data. Those guidelines are mostly non-public, vary by state and
// by year, and change without notice. "State Farm will not insure aluminum wiring" is therefore an
// invented factual claim about a named company, on a YMYL topic, from a domain with no authority --
// wrong for the reader, and a liability besides. The honest article explains the peril, what
// underwriting generally weighs, and how to get a written answer from YOUR OWN carrier.
//
// Write "your carrier", "some carriers", "many insurers". Never a carrier name beside an
// underwriting verb.
// Split into two tiers, because several carrier names are ordinary English words and a guard that
// cries wolf gets deleted. The first run flagged "…permitted to pay for the wood-destroying insect
// inspection fee nationwide" -- the adverb, not the insurer.
//
// UNAMBIGUOUS: the string is never anything but a company. Matched case-insensitively.
const CARRIERS = [
  'state farm', 'allstate', 'geico', 'liberty mutual', 'lemonade insurance', 'usaa',
  'farmers insurance', 'erie insurance', 'amica', 'chubb', 'auto club', 'security first',
  'citizens property', 'branch insurance', 'state auto', 'safeco', 'the hartford',
];
// AMBIGUOUS: ordinary words that are also carriers. Require BOTH the capitalised proper-noun form
// AND an insurance word nearby, so the adverb and the adjective pass through untouched.
const AMBIGUOUS = ['Nationwide', 'Travelers', 'Progressive', 'Hippo', 'Encompass', 'Foremost'];
const INSURANCE_CONTEXT = /\b(insur\w*|carrier|policy|policies|underwrit\w*|premium|deductible)\b/i;
const UNDERWRITING = /\b(insure[sd]?|insuring|cover(s|ed|age)?|underwrit\w*|declin\w*|den(y|ies|ied)|refus\w*|accept\w*|exclude[sd]?|cancel\w*|non-?renew\w*|require[sd]?|allow\w*|writes?)\b/i;
/** Characters either side of the carrier name to consider "adjacent". */
const WINDOW = 100;

type Row = { slug: string; title: string; quick_answer: string | null; body_markdown: string };

function carrierClaims(r: Row): string[] {
  const body = r.body_markdown ?? '';
  const lo = body.toLowerCase();
  const hits: string[] = [];

  for (const c of CARRIERS) {
    let i = lo.indexOf(c);
    while (i >= 0) {
      const win = body.slice(Math.max(0, i - WINDOW), i + c.length + WINDOW);
      if (UNDERWRITING.test(win)) {
        hits.push(`"${c}" near an underwriting verb: ...${win.replace(/\s+/g, ' ').slice(0, 130)}...`);
        break;
      }
      i = lo.indexOf(c, i + 1);
    }
  }

  // Ambiguous names need the capitalised form AND insurance context AND an underwriting verb.
  // All three, because any two of them still match ordinary prose about costs or nationwide rules.
  for (const c of AMBIGUOUS) {
    const re = new RegExp(`\\b${c}\\b`, 'g');
    for (const m of body.matchAll(re)) {
      const win = body.slice(Math.max(0, m.index! - WINDOW), m.index! + c.length + WINDOW);
      if (INSURANCE_CONTEXT.test(win) && UNDERWRITING.test(win)) {
        hits.push(`"${c}" (carrier reading) near an underwriting verb: ...${win.replace(/\s+/g, ' ').slice(0, 130)}...`);
        break;
      }
    }
  }
  return hits;
}

/** RULE 2: the reproducibility test. A guide must hold at least one thing a general model cannot
 *  produce -- a real cost figure, or a standard cited by name AND number. Without either, the page
 *  is a definition, and a definition earns no click: an AI Overview capture on 2026-09-10 showed
 *  Google reproducing one of these guides in full and citing nobody. Grandfathered. */
const COST = /\$[\d,]{3,}/;
const NUMBERED_STANDARD = /\b(NFPA|NEC|IRC|IBC|ASTM|ASCE|ANSI|UL)\s*[\d][\d.\-]*/i;

/** RULE 3: quick_answer is the TL;DR above the fold. All 57 guides have one; keep it that way. */
const QA_MIN = 120;

async function main() {
  let rows: Row[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, quick_answer, body_markdown FROM articles WHERE status = 'published'
      `)) as unknown as Row[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 60)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');

  const failsRule2 = (r: Row) => !COST.test(r.body_markdown) && !NUMBERED_STANDARD.test(r.body_markdown);

  if (SEED) {
    const list = rows.filter(failsRule2).map((r) => r.slug).sort();
    fs.mkdirSync(path.dirname(GRANDFATHER), { recursive: true });
    fs.writeFileSync(GRANDFATHER, `${JSON.stringify({
      note: 'Guides that predate the reproducibility rule. This list may only SHRINK. ' +
            'Removing a slug means the guide now carries a cost figure or a numbered standard.',
      seeded_at: new Date().toISOString().slice(0, 10),
      slugs: list,
    }, null, 2)}\n`);
    console.log(`  seeded ${list.length} grandfathered slug(s) -> data/quality-grandfathered.json`);
    return;
  }

  if (!fs.existsSync(GRANDFATHER)) {
    throw new Error(`ABORT: ${path.relative(ROOT, GRANDFATHER)} missing. Run with --seed once.`);
  }
  const gf: string[] = JSON.parse(fs.readFileSync(GRANDFATHER, 'utf8')).slugs;
  const grandfathered = new Set(gf);

  const hard: string[] = [];
  const warn: string[] = [];

  for (const r of rows) {
    for (const h of carrierClaims(r)) hard.push(`[carrier] ${r.slug}: ${h}`);

    if (!r.quick_answer || !r.quick_answer.trim()) hard.push(`[tldr] ${r.slug}: no quick_answer`);
    else if (r.quick_answer.trim().length < QA_MIN) {
      hard.push(`[tldr] ${r.slug}: quick_answer ${r.quick_answer.trim().length} chars, under ${QA_MIN}`);
    }

    if (failsRule2(r)) {
      if (grandfathered.has(r.slug)) warn.push(`[reproducible] ${r.slug} (grandfathered)`);
      else hard.push(`[reproducible] ${r.slug}: no cost figure and no numbered standard`);
    }
  }

  // A grandfathered slug that now passes should be removed from the list -- the ratchet only
  // tightens if someone is told when it can.
  const fixed = gf.filter((s) => { const r = rows!.find((x) => x.slug === s); return r && !failsRule2(r); });
  const gone = gf.filter((s) => !rows!.some((x) => x.slug === s));

  console.log(`\n  article quality`);
  console.log(`    ${rows.length} published, ${grandfathered.size} grandfathered on the reproducibility rule`);
  console.log(`    ${warn.length} still thin (grandfathered, not failing the gate)`);
  if (fixed.length) {
    console.log(`\n    ${fixed.length} grandfathered guide(s) NOW PASS -- remove them from the list to lock the gain:`);
    for (const s of fixed) console.log(`      ${s}`);
  }
  if (gone.length) console.log(`    ${gone.length} grandfathered slug(s) no longer published (safe to drop)`);

  if (hard.length) {
    console.error(`\n  FAILED -- ${hard.length} violation(s):`);
    for (const h of hard.slice(0, 30)) console.error(`    - ${h}`);
    if (hard.length > 30) console.error(`    ... and ${hard.length - 30} more`);
    console.error(
      `\n  [carrier]      never state a named insurer's underwriting position; we hold no such data.\n` +
      `                 Write "your carrier" / "some carriers" and tell the reader how to get it in writing.\n` +
      `  [reproducible] a new guide needs a real cost figure or a standard cited by name AND number.\n` +
      `  [tldr]         every guide needs a quick_answer of ${QA_MIN}+ characters.\n`
    );
    process.exit(1);
  }
  console.log(`    ok  no carrier underwriting claims, every guide has a TL;DR, no new thin guides`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
