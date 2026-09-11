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
import { guideTopic } from '../src/utils/relatedGuides.js';

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

/** RULE 6: every guide must land in a topic cluster, and a cluster wants 3+ members. GRANDFATHERED.
 *
 *  This is §2 of the content standard, and it was the last rule with no enforcement at all. It
 *  matters because Related Guides is the ONLY mechanism moving authority between pages on a domain
 *  with almost no backlinks: a guide matching no topic receives no internal links and gives none,
 *  so a crawler can reach it only from the sitemap.
 *
 *  Two tiers. Matching NO topic is a hard fail for new content -- it means the slug and title share
 *  no vocabulary with any bucket in GUIDE_TOPIC_PATTERNS, which is usually a sign the guide is off
 *  the site's subject entirely. Being the SOLE member of a topic is a warning rather than a failure:
 *  somebody has to write the first one, and refusing to let a cluster start would freeze the library
 *  in its current shape.
 *
 *  The run also prints thin clusters, because "which topic needs another guide" is the question this
 *  data actually answers, and a guard that only says no is worth less than one that says where. */
const CLUSTER_WANTS = 3;

/** RULE 7: AI-cliché vocabulary. HARD FAIL, and deliberately NOT a flat banned-word list.
 *
 *  Measuring a naive list against the published library first was what saved it. "Seamless" appears
 *  twice and both are literal -- synthetic stucco "engineered to look seamless", and a "new, seamless
 *  HDPE pipe" pulled through a bore. "Leverage" appears ten times, every one the NOUN, contractual
 *  leverage under an inspection contingency, which is a term of art in this subject. Banning either
 *  outright would have produced exactly the false positives that get a guard commented out.
 *
 *  So the metaphorical uses are banned and the literal ones are left alone: "regulatory landscape"
 *  but not landscaping, "leveraging" the verb but not negotiating leverage, "seamless experience"
 *  but not seamless cladding. Words with no legitimate use in a home-inspection guide are banned
 *  outright. Currently 11 "crucial" and 3 "when it comes to" exist and will need editing out. */
const CLICHES: Array<[string, RegExp]> = [
  ['no legitimate use here', /\b(delve[sd]?|delving|tapestry|demystif\w+|myriad|plethora|realm of|pivotal|in conclusion|moreover|furthermore|a testament to|navigating the complexities|it'?s worth noting|embark on)\b/i],
  ['metaphorical landscape', /\b(regulatory|current|evolving|changing|competitive|digital|modern)\s+landscape\b|\blandscape\s+of\s+(?!architecture|design)/i],
  ['leverage as a verb', /\b(to|can|will|should|must|help[s]?\s+you)\s+leverage\b|\bleveraging\b/i],
  ['seamless as a metaphor', /\bseamless(ly)?\s+(experience|integration|process|transition|journey)\b/i],
  ['filler', /\b(it is important to note|when it comes to|needless to say|at the end of the day|in today'?s world)\b/i],
  ['empty intensifier', /\bcrucial\b/i],
];

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

/** RULE 3: quick_answer is the TL;DR above the fold. All 57 guides have one; keep it that way.
 *
 *  A CEILING AS WELL AS A FLOOR, added 2026-09-11 after measuring the device split. 63.3% of this
 *  site's Google clicks come from mobile, on 37.3% of the impressions -- mobile converts three times
 *  better than desktop, so the phone is the real reader. quick_answer is the block that reader sees
 *  before scrolling, and at 643 characters it is a wall of text on a 375px screen. Current spread:
 *  min 281, median 426, max 643, with 21 guides over 450. Ceiling is grandfathered. */
const QA_MIN = 120;
const QA_MAX = 450;

/** RULE 4: no engagement-bait. HARD FAIL -- zero guides violate it today, so strictness is free.
 *
 *  §7 is built on a 2016 Google deck saying a POSITIVE reaction is the signal. Withholding the
 *  answer to force a scroll produces the opposite reaction, and it is the obvious way to misread
 *  "optimise for user signals" into padding for dwell time. The TL;DR must answer the question, not
 *  advertise that an answer exists further down. */
const TEASER = /\b(read on|keep reading|we'?ll (explain|show|cover|dive)|find out below|see below|more on (that|this) below|in this (guide|article|post),? we|let'?s (dive|explore|take a look)|stay tuned|you might be surprised|the answer may surprise)\b/i;

/** RULE 5: a title may not be a bare definition echo. GRANDFATHERED.
 *
 *  NARROW ON PURPOSE. An earlier draft flagged any question-formula title and caught "How to
 *  Legalize an Unpermitted Deck" -- which plainly promises an outcome. A guard with false positives
 *  gets deleted, so this matches only "What Is X?" and "What Does X Mean?" with nothing after them:
 *  titles that restate the query and promise nothing. "How to…" promises an outcome by
 *  construction, and "Can You…?" promises a yes or no, which is also an outcome. */
/*  THIRD attempt at this pattern, and the failures are worth recording because each was the same
 *  mistake getting narrower. v1 flagged every question title, catching "How to Legalize an
 *  Unpermitted Deck". v2 flagged every "What Is…?" ending in a question mark, catching "What Is
 *  Orangeburg Pipe AND WHY DOES IT COLLAPSE?" -- a title with a perfectly good second clause. A
 *  definition echo is a "What is X" title with NOTHING ELSE IN IT, so the test is now the absence
 *  of a second clause, not the presence of an opening. */
function isDefinitionEcho(title: string): boolean {
  const t = title.trim();
  if (!/^(what is|what are|what does)\b/i.test(t)) return false;
  // A QUESTION MARK IS ALSO A CLAUSE SEPARATOR. v3 missed this and flagged "What Does 'Amateur
  // Workmanship' Mean? Warning Signs" -- a title that had an outcome appended to it hours earlier.
  const afterQ = t.includes('?') ? t.slice(t.indexOf('?') + 1).trim() : '';
  if (afterQ.split(/\s+/).filter(Boolean).length >= 2) return false;
  // Any of these introduces a second clause, which is where the outcome lives.
  if (/[:–—]|\s-\s/.test(t)) return false;
  if (/\b(and|or|but)\b/i.test(t)) return false;
  // A second interrogative beyond the opening one ("…and why", "…, who").
  if (/\b(why|who|how|when|which)\b/i.test(t.replace(/^what\s+(is|are|does)\b/i, ''))) return false;
  return true;
}

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
  const failsRule5 = (r: Row) => isDefinitionEcho(String(r.title));

  if (SEED) {
    const thin = rows.filter(failsRule2).map((r) => r.slug).sort();
    const echo = rows.filter(failsRule5).map((r) => r.slug).sort();
    const noTopic = rows.filter((r) => !guideTopic(r.slug, r.title)).map((r) => r.slug).sort();
    const longQa = rows.filter((r) => (r.quick_answer ?? '').trim().length > QA_MAX).map((r) => r.slug).sort();
    const cliche = rows.filter((r) => CLICHES.some(([, re]) => re.test(r.body_markdown))).map((r) => r.slug).sort();
    fs.mkdirSync(path.dirname(GRANDFATHER), { recursive: true });
    fs.writeFileSync(GRANDFATHER, `${JSON.stringify({
      note: 'Guides that predate these rules. BOTH lists may only SHRINK. Removing a slug from ' +
            '"slugs" means the guide now carries a cost figure or a numbered standard; removing ' +
            'one from "definitionEchoTitles" means its title now promises an outcome.',
      seeded_at: new Date().toISOString().slice(0, 10),
      slugs: thin,
      definitionEchoTitles: echo,
      noTopicMatch: noTopic,
      longTldr: longQa,
      cliches: cliche,
    }, null, 2)}\n`);
    console.log(`  seeded ${thin.length} thin + ${echo.length} definition-echo + ${noTopic.length} no-topic -> data/quality-grandfathered.json`);
    return;
  }

  if (!fs.existsSync(GRANDFATHER)) {
    throw new Error(`ABORT: ${path.relative(ROOT, GRANDFATHER)} missing. Run with --seed once.`);
  }
  const gfFile = JSON.parse(fs.readFileSync(GRANDFATHER, 'utf8'));
  const gf: string[] = gfFile.slugs ?? [];
  const gfTitles: string[] = gfFile.definitionEchoTitles ?? [];
  const grandfathered = new Set(gf);
  const grandfatheredTitles = new Set(gfTitles);
  const grandfatheredCluster = new Set<string>(gfFile.noTopicMatch ?? []);
  const grandfatheredTldr = new Set<string>(gfFile.longTldr ?? []);
  const grandfatheredCliche = new Set<string>(gfFile.cliches ?? []);

  const hard: string[] = [];
  const warn: string[] = [];

  for (const r of rows) {
    for (const h of carrierClaims(r)) hard.push(`[carrier] ${r.slug}: ${h}`);

    if (!r.quick_answer || !r.quick_answer.trim()) hard.push(`[tldr] ${r.slug}: no quick_answer`);
    else if (r.quick_answer.trim().length < QA_MIN) {
      hard.push(`[tldr] ${r.slug}: quick_answer ${r.quick_answer.trim().length} chars, under ${QA_MIN}`);
    } else if (r.quick_answer.trim().length > QA_MAX) {
      const msg = `[tldr] ${r.slug}: quick_answer ${r.quick_answer.trim().length} chars, over ${QA_MAX} — a wall of text on a phone`;
      if (grandfatheredTldr.has(r.slug)) warn.push(`${msg} (grandfathered)`);
      else hard.push(msg);
    }

    // Rule 7: AI-cliché vocabulary. Grandfathered per SLUG rather than per phrase: these are
    // cheap word-level edits, so the list should empty fast, and a per-phrase list would grow
    // stale the moment anyone rewrote a sentence.
    for (const [label, re] of CLICHES) {
      const m = r.body_markdown.match(re);
      if (!m) continue;
      const msg = `[cliche] ${r.slug}: "${m[0].trim()}" (${label})`;
      if (grandfatheredCliche.has(r.slug)) warn.push(`${msg} (grandfathered)`);
      else hard.push(msg);
    }

    if (failsRule2(r)) {
      if (grandfathered.has(r.slug)) warn.push(`[reproducible] ${r.slug} (grandfathered)`);
      else hard.push(`[reproducible] ${r.slug}: no cost figure and no numbered standard`);
    }

    // Engagement-bait: check the TL;DR and the article's opening, which is where a teaser lives.
    const opening = `${r.quick_answer ?? ''}\n${String(r.body_markdown).slice(0, 700)}`;
    const tease = opening.match(TEASER);
    if (tease) hard.push(`[bait] ${r.slug}: "${tease[0]}" — answer the question, do not advertise it`);

    if (failsRule5(r)) {
      if (grandfatheredTitles.has(r.slug)) warn.push(`[title] ${r.slug} (grandfathered)`);
      else hard.push(`[title] ${r.slug}: "${r.title}" is a bare definition echo, promises no outcome`);
    }
  }

  // --- Rule 6: clusters ---------------------------------------------------------------------
  const topics = new Map<string, string[]>();
  for (const r of rows) {
    const t = guideTopic(r.slug, r.title);
    const key = t ?? '(none)';
    if (!topics.has(key)) topics.set(key, []);
    topics.get(key)!.push(r.slug);
  }
  for (const slug of topics.get('(none)') ?? []) {
    if (grandfatheredCluster.has(slug)) warn.push(`[cluster] ${slug} matches no topic (grandfathered)`);
    else hard.push(`[cluster] ${slug}: matches no topic in GUIDE_TOPIC_PATTERNS — it will receive no Related Guides links`);
  }
  const singletons = [...topics].filter(([t, s]) => t !== '(none)' && s.length === 1);
  const thin = [...topics].filter(([t, s]) => t !== '(none)' && s.length > 1 && s.length < CLUSTER_WANTS);
  for (const [t, s] of singletons) warn.push(`[cluster] "${t}" has one member (${s[0]}) — a cluster wants ${CLUSTER_WANTS}+`);

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

  if (thin.length) {
    console.log(`\n    clusters under ${CLUSTER_WANTS} members -- the next guide is worth most here:`);
    for (const [t, s] of thin.sort((a, b) => a[1].length - b[1].length)) {
      console.log(`      ${t} (${s.length})`);
    }
  }

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
