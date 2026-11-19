// Passage survival check (report-only). Does each prose paragraph still make sense when an AI answer
// lifts it out of the page on its own?
//
//   npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts <slug>              # reads guides/<slug>.md
//   npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts guides/<slug>.md
//   ... --max-fail N   exit 1 when more than N key paragraphs fail (key = the first paragraph under each H2,
//                       plus the opening paragraph); default: report only, always exit 0
//
// Why: Google's AI features doc says AI Overviews and AI Mode may use "query fan-out" -- several related
// searches -- and link supporting pages for parts of the answer. The video this skill came from (Neil Patel,
// 2026-11-19) argues the useful unit is a passage, not the page. That is practitioner advice, not a Google
// formula, so this script REPORTS; it never blocks a publish on its own and it never edits anything.
//
// It flags three things, all mechanical:
//   1. a paragraph that opens on a word pointing backwards (It, This, That, These, They, Also, But, So...);
//   2. a back-reference phrase (above, below, as mentioned, the same form, that line...);
//   3. no topic noun: none of the slug's content words appears in the paragraph.
// A flag is a prompt to reread, not proof of a defect. Some openers are fine in context; the writer decides.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const maxIdx = args.indexOf('--max-fail');
const maxFail = maxIdx >= 0 ? Number(args[maxIdx + 1]) : Infinity;
if (!target) { console.error('usage: check-passages.ts <slug | path/to/draft.md> [--max-fail N]'); process.exit(2); }

const file = target.endsWith('.md') ? target : path.join('guides', `${target}.md`);
const slug = path.basename(file, '.md');
let raw = fs.readFileSync(file, 'utf8');
raw = raw.replace(/^---\n[\s\S]*?\n---\n/, '');

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'it', 'be', 'do', 'does', 'what', 'when',
  'how', 'why', 'can', 'should', 'your', 'you', 'my', 'i', 'house', 'home', 'buying', 'buy', 'before', 'after', 'check', 'need', 'mean', 'means', 'have']);
const topic = slug.split('-').filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/s$/, ''));

const OPENER = /^(it|it's|its|this|that|these|those|they|they're|their|them|here|also|and|but|so|then|both|either|neither|such|which|the same|the other|another|one more)\b/i;
const BACKREF = /\b(above|below|as mentioned|mentioned earlier|earlier on|as we said|the same (form|section|page|rule|line|code)|that (line|form|section|rule|word)|this (line|form|section|rule)|the former|the latter|read that)\b/i;

type P = { line: number; text: string; key: boolean; section: string };
const paras: P[] = [];
let section = '(opening)'; let firstUnder = true; let buf: string[] = []; let start = 0;
const lines = raw.split('\n');
const flush = () => {
  if (!buf.length) return;
  const text = buf.join(' ').trim(); buf = [];
  if (!text || /^(\||!\[|```|- |\* |\d+\.\s|>)/.test(text)) return;     // tables, images, code, lists, quotes are not prose
  paras.push({ line: start + 1, text, key: firstUnder, section }); firstUnder = false;
};
lines.forEach((l, i) => {
  if (/^#{1,6}\s/.test(l)) { flush(); if (/^##\s/.test(l)) { section = l.replace(/^#+\s*/, ''); firstUnder = true; } return; }
  if (!l.trim()) { flush(); return; }
  if (!buf.length) start = i;
  buf.push(l.trim());
});
flush();

const strip = (s: string) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '');
let keyFails = 0; let fails = 0;
const rows = paras.filter((p) => !/^how we checked/i.test(p.section)).map((p) => {
  const t = strip(p.text); const low = t.toLowerCase();
  const flags: string[] = [];
  if (OPENER.test(t)) flags.push(`opens on "${t.split(/\s+/)[0]}"`);
  const b = t.match(BACKREF); if (b) flags.push(`back-reference "${b[0]}"`);
  if (topic.length && !topic.some((w) => low.includes(w))) flags.push(`no topic noun (${topic.join('/')})`);
  if (flags.length) { fails++; if (p.key) keyFails++; }
  return { ...p, t, flags };
});

console.log(`\n  ${slug}: ${rows.length} prose paragraphs, ${rows.length - fails} pass, ${fails} flagged (${keyFails} of them key paragraphs)\n`);
for (const r of rows) if (r.flags.length) console.log(`  ${r.key ? 'KEY ' : '    '}L${String(r.line).padEnd(4)} ${r.flags.join('; ')}\n         "${r.t.slice(0, 110)}${r.t.length > 110 ? '…' : ''}"`);
console.log('\n  A flag is a prompt to reread the paragraph on its own, not proof it is wrong.\n');
if (keyFails > maxFail) process.exit(1);
