// Cross-page checker for the 50-state contractor-license set (.claude/skills/state-license-guides/SKILL.md).
// Owner, 2026-11-13: every page more than 60% different from every other, real facts only, no duplication.
//
//   npx tsx scripts/check-state-license-set.ts            # checks all drafts in guides/ plus California (#350)
//
// What it enforces, per page and across the set:
//   1. Pairwise overlap, after each page's own state name and abbreviation are replaced with a token (the "swap test"):
//      share of page A's word-trigrams also found in page B. FAIL at >= 40% (the owner's 60% rule), WARN at >= 15%
//      (target: close to entirely unique). Plan: docs/plans/state-contractor-license-plan.md.
//   5. Voice: generic and question headings, the plan's AI-tone word list, and the site draft gate (assertHumanDraft).
//   2. No sentence of 8+ words appears on two state pages.
//   3. No H2 heading (state name tokenised) is used on more than 10 pages.
//   4. Ledger discipline: a ledger exists; at least 10 state-specific facts; every number on the page appears in the
//      ledger; every quotation of 12+ characters is inside a ledger quote; the official lookup URL is in the first
//      paragraph; the slug matches the contractor-licensing topic bucket.
// Exit code 1 on any FAIL. Reads files only; touches no database.
import fs from 'node:fs';
import path from 'node:path';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { assertHumanDraft } from '../src/seo/effortBrief.js';

const ROOT = process.cwd();
const LEDGER_DIR = path.join(ROOT, 'data', 'fact-ledgers', 'state-license');
const CA = { slug: 'cslb-license-check-california-contractor', state: 'California', abbrev: 'CA' };

type Page = { slug: string; state: string; abbrev: string; title: string; body: string; ledger: any | null; file: string };

function readGuide(slug: string): { title: string; body: string } | null {
  const f = path.join(ROOT, 'guides', `${slug}.md`);
  if (!fs.existsSync(f)) return null;
  const raw = fs.readFileSync(f, 'utf8');
  const front = raw.match(/^---\n[\s\S]*?\n---\n/);
  const rest = front ? raw.slice(front[0].length) : raw;
  const title = (rest.match(/^#\s+(.*)$/m)?.[1] ?? '').trim();
  return { title, body: rest.replace(/^#\s.*\n+/, '').trim() };
}

const pages: Page[] = [];
for (const f of fs.readdirSync(LEDGER_DIR).filter((x) => x.endsWith('.json') && !x.startsWith('_'))) {
  const ledger = JSON.parse(fs.readFileSync(path.join(LEDGER_DIR, f), 'utf8'));
  const g = readGuide(ledger.slug);
  if (!g) { console.log(`  note: ${ledger.slug} has a ledger but no draft yet`); continue; }
  pages.push({ slug: ledger.slug, state: ledger.state, abbrev: ledger.stateAbbrev, title: g.title, body: g.body, ledger, file: f });
}
const ca = readGuide(CA.slug);
if (ca) pages.push({ ...CA, title: ca.title, body: ca.body, ledger: null, file: '(published #350, own ledger)' });

let fails = 0, warns = 0;
const fail = (m: string) => { console.log(`  FAIL ${m}`); fails++; };
const warn = (m: string) => { console.log(`  warn ${m}`); warns++; };

const tokenise = (p: Page, text: string) => {
  let t = text.toLowerCase();
  for (const s of [p.state, p.abbrev].filter(Boolean)) t = t.split(s.toLowerCase()).join('STATE');
  return t;
};
const words = (t: string) => t.replace(/\]\([^)]*\)/g, ']').replace(/[^a-z0-9$%\s]/gi, ' ').split(/\s+/).filter(Boolean);
const trigrams = (t: string) => { const w = words(t); return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`)); };
const sentences = (t: string) => t.replace(/\]\([^)]*\)/g, ']').split(/(?<=[.!?])\s+|\n+/).map((s) => s.replace(/[*_#>|`-]/g, ' ').replace(/\s+/g, ' ').trim()).filter((s) => s.split(' ').length >= 8);
const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');

console.log(`\n  state license set: ${pages.length} page(s)\n`);

// 1. pairwise overlap
const tri = pages.map((p) => trigrams(tokenise(p, p.body)));
let worst = 0;
for (let i = 0; i < pages.length; i++) {
  let maxI = 0, maxWith = '';
  for (let j = 0; j < pages.length; j++) {
    if (i === j) continue;
    let n = 0; tri[i].forEach((g) => { if (tri[j].has(g)) n++; });
    const ov = tri[i].size ? n / tri[i].size : 0;
    if (ov > maxI) { maxI = ov; maxWith = pages[j].slug; }
  }
  worst = Math.max(worst, maxI);
  const label = `${pages[i].slug}: max overlap ${(maxI * 100).toFixed(1)}%${maxWith ? ` (with ${maxWith})` : ''}`;
  if (maxI >= 0.40) fail(label); else if (maxI >= 0.15) warn(label); else console.log(`  ok   ${label}`);
}

// 2. shared sentences
const seen = new Map<string, string>();
for (const p of pages) {
  for (const s of sentences(tokenise(p, p.body))) {
    const k = s.toLowerCase();
    const other = seen.get(k);
    if (other && other !== p.slug) fail(`shared sentence on ${p.slug} and ${other}: "${s.slice(0, 90)}…"`);
    else seen.set(k, p.slug);
  }
}

// 3. headings
const headCount = new Map<string, number>();
for (const p of pages) for (const h of new Set(tokenise(p, p.body).split('\n').filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, '').trim()))) headCount.set(h, (headCount.get(h) ?? 0) + 1);
for (const [h, n] of headCount) if (n > 10) fail(`heading "${h}" is used on ${n} pages (max 10)`);
const GENERIC_HEADINGS = /^(overview|introduction|conclusion|summary|final thoughts|what you need to know|key takeaways|faqs?|frequently asked questions)$/i;
for (const p of pages) for (const l of p.body.split('\n').filter((x) => /^#{2,3}\s/.test(x))) {
  const h = l.replace(/^#{2,3}\s+/, '').trim();
  if (GENERIC_HEADINGS.test(h)) fail(`${p.slug}: generic heading "${h}"`);
  if (/\?\s*$/.test(h) && p.ledger) fail(`${p.slug}: question heading "${h}" (plan §7)`);
}

// AI tone (plan §7): the site's draft gate plus the plan's list.
const AI_TONE = /\b(navigate|navigating|comprehensive|ensure|ensures|seamless|seamlessly|robust|leverage|empower|crucial|vital|pivotal|essential to|delve|dive into|unlock|landscape|realm|embark|tailored|streamline|in today's|it's important to note|it is important to note|it's worth noting|in summary|in conclusion|whether you're|look no further|peace of mind|plays a key role|a variety of|furthermore|moreover|when it comes to|rest assured|game-changer|hassle-free)\b/i;
for (const p of pages) {
  if (!p.ledger) continue;
  const m = p.body.match(AI_TONE);
  if (m) fail(`${p.slug}: AI-tone word "${m[0]}" (plan §7)`);
  try { assertHumanDraft(p.slug, p.body, ''); } catch (e: any) { fail(`${p.slug}: draft gate: ${String(e.message || e).slice(0, 160)}`); }
}

// 4. ledger discipline (state pages only; California has its own published ledger and checks)
for (const p of pages) {
  if (!p.ledger) continue;
  const L = p.ledger;
  const facts = (L.facts ?? []).filter((f: any) => f.topic && f.topic !== 'read-date');
  if (facts.length < 10) fail(`${p.slug}: ${facts.length} state-specific facts (need 10; else HUB-ONLY)`);
  for (const f of facts) if (!/^https:\/\//.test(f.url ?? '') || !f.quote || !f.readOn) fail(`${p.slug}: fact ${f.id} missing url, quote or readOn`);
  const ledgerAll = JSON.stringify(L);
  const all = `${p.title}\n${p.body}`;
  for (const m of all.replace(/\]\([^)]*\)/g, ']').replace(/!\[[^\]]*\]/g, '').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerAll.includes(tok)) fail(`${p.slug}: number "${tok}" is in no ledger entry`);
  }
  const quotes = norm((L.facts ?? []).map((f: any) => f.quote).join(' '));
  for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) {
    if (m[1].length < 12) continue;
    if (!quotes.includes(norm(m[1]))) fail(`${p.slug}: quote not in ledger: "${m[1].slice(0, 80)}"`);
  }
  const firstPara = p.body.split(/\n\s*\n/)[0];
  if (!L.officialLookupUrl || !firstPara.includes(L.officialLookupUrl)) fail(`${p.slug}: official lookup URL not in the first paragraph`);
  if (guideTopic(p.slug, p.title) !== 'contractor-licensing') fail(`${p.slug}: topic is ${guideTopic(p.slug, p.title)}, expected contractor-licensing`);
  if (!/§\s*\d|Rule\s+\d|Code\s+§?\s*\d|\b(ORS|RCW|NRS|RSA|ILCS|K\.S\.A\.)\s+\d/.test(p.body)) fail(`${p.slug}: no state law cited by number`);
  if (!/^## How we checked this/m.test(p.body)) fail(`${p.slug}: no "How we checked this" section`);
}

console.log(`\n  worst pairwise overlap ${(worst * 100).toFixed(1)}% · ${fails} fail(s), ${warns} warning(s)`);
if (fails) process.exit(1);
