// The anti-hallucination gate for the "Yes, but" guide strand. Process: .claude/skills/yes-but-guide/SKILL.md.
//
//   npx tsx scripts/assert-yes-but-guide.ts <slug>
//
// Reads three files and fails (exit 1) on anything that should not ship:
//   guides/<slug>.md                    the draft: a front block (meta:, quick:), then "# Title", then the body
//   data/fact-ledgers/<slug>.json       every fact the draft states, each with a quote, URL, date and method
//   data/content-queue/yes-but-guides.json   the queue entry the draft belongs to
//
// WHY IT EXISTS. On 2026-10-08 the owner asked for a flow so these articles are written without
// hallucinating or forgetting steps. The failure this site has already shipped more than once is a
// confident figure or code section with no source behind it. So the rule here is mechanical: every
// number and every code-section reference in the title, meta, quick answer and body must appear in
// the ledger's own claims or quotes. If it is not in the ledger, it is not on the page.
//
// It does NOT replace the publish script's checks (dead links, overlap with live guides, the DB) or
// scripts/assert-article-quality.ts. It runs first, offline, on the draft.

import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('usage: npx tsx scripts/assert-yes-but-guide.ts <slug>'); process.exit(2); }
const ROOT = process.cwd();
let bad = 0;
const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
const ok = (m: string) => console.log(`  ok   ${m}`);

// ---- load -------------------------------------------------------------------------------------
const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'content-queue', 'yes-but-guides.json'), 'utf8'));
const item = (queue.items as any[]).find((i) => i.proposedSlug === slug);
if (!item) fail(`"${slug}" is not in data/content-queue/yes-but-guides.json -- add it to the queue first, or use the queued slug`);

const ledgerPath = path.join(ROOT, 'data', 'fact-ledgers', `${slug}.json`);
if (!fs.existsSync(ledgerPath)) { console.log(`  FAIL no ledger at data/fact-ledgers/${slug}.json -- verify facts BEFORE drafting`); process.exit(1); }
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));

const mdPath = path.join(ROOT, 'guides', `${slug}.md`);
if (!fs.existsSync(mdPath)) { console.log(`  FAIL no draft at guides/${slug}.md`); process.exit(1); }
const raw = fs.readFileSync(mdPath, 'utf8');
const front = raw.match(/^---\n([\s\S]*?)\n---\n/);
const field = (k: string) => front?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim() ?? '';
const meta = field('meta'), quick = field('quick');
const afterFront = front ? raw.slice(front[0].length) : raw;
const title = afterFront.match(/^#\s+(.*)$/m)?.[1]?.trim() ?? '';
const body = afterFront.replace(/^#\s.*\n+/, '').trim();

// ---- 1. the ledger is real ----------------------------------------------------------------------
const facts: any[] = Array.isArray(ledger.facts) ? ledger.facts : [];
if (facts.length < 3) fail(`ledger has ${facts.length} facts; a guide needs at least 3 verified ones`);
if (!ledger.verdictConfirmed || /</.test(ledger.verdictConfirmed)) fail('ledger.verdictConfirmed is empty or still the template');
const today = new Date().toISOString().slice(0, 10);
for (const f of facts) {
  const tag = f.id || '(no id)';
  if (!/^https:\/\//.test(f.url || '')) fail(`fact ${tag}: url must be https`);
  if (!f.quote || f.quote.length < 15 || /</.test(f.quote)) fail(`fact ${tag}: quote missing or too short -- quote the source's own words`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.readOn || '') || f.readOn > today) fail(`fact ${tag}: readOn must be an ISO date, not in the future`);
  if (!['browser', 'webfetch', 'pdf', 'engine'].includes(f.method)) fail(`fact ${tag}: method must be browser|webfetch|pdf|engine`);
}
if (!bad) ok(`ledger: ${facts.length} facts, ${(ledger.cut || []).length} cut, verdict "${ledger.verdictConfirmed.slice(0, 70)}..."`);
const ledgerText = facts.map((f) => `${f.claim} ${f.quote}`).join(' ');

// ---- 2. shape: a "Can you" question with a conditional verdict ---------------------------------
if (!/^Can You\b/.test(title)) fail(`title must open "Can You ..." (got "${title}")`);
if (!title.includes('?')) fail('title must carry the question mark');
if (title.length > 60) fail(`title ${title.length} chars (max 60)`);
if (/^Does a (standard )?home inspection/i.test(title)) fail('inspection-scope titles are the zero-click shape; not this strand');
if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars (70-155)`);
if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars (120-450)`);
const firstTwo = quick.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
if (!/^(Yes|No|Generally|Usually|Often|Sometimes|In most cases|Only)\b/.test(quick)) fail('quick answer must open with the verdict (Yes / No / Generally / Usually ...)');
if (!/\b(but|unless|only if|except|as long as|provided|however)\b/i.test(firstTwo))
  fail('quick answer has no condition in its first two sentences -- a flat verdict is answered on the results page and earns no click');
else ok(`shape: "${title}" / quick opens "${quick.slice(0, 60)}..."`);

// ---- 3. no number or code section without a ledger fact -----------------------------------------
const pageText = [title, meta, quick, body].join('\n')
  .replace(/\]\([^)]*\)/g, ']')       // link targets are URLs, not claims
  .replace(/https?:\/\/\S+/g, ' ');
const numbers = [...new Set(pageText.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [])];
const missingNums = numbers.filter((n) => !ledgerText.includes(n));
if (missingNums.length) fail(`numbers stated with no ledger fact: ${missingNums.join(', ')}`);
else ok(`numbers: all ${numbers.length} traced to the ledger`);
const sectionRe = /\b(?:NEC|NFPA|IRC|IPC|IBC|UPC|UL|ASTM|CFR|U\.S\.C\.|CPSC|Sections?)\b[\s§]*((?:[A-Z]{0,2}\d+[\d.]*(?:\([A-Za-z0-9]+\))*))|\(([A-Z]\d{3,}[\d.]*)\)/g;
const sections = [...new Set([...pageText.matchAll(sectionRe)].map((m) => m[1] || m[2]).filter(Boolean))];
const missingSec = sections.filter((s) => !ledgerText.includes(s));
if (missingSec.length) fail(`code sections cited with no ledger fact: ${missingSec.join(', ')}`);
else ok(`code sections: ${sections.length ? sections.join(', ') : 'none cited'} -- all in the ledger`);
if (!sections.length && !/\$\d/.test(body)) fail('no numbered code section and no cost figure -- the reproducibility rule needs one (from the ledger)');

// ---- 4. wording rules ----------------------------------------------------------------------------
const BANNED: Array<[RegExp, string]> = [
  [/\b(most|many|some) (insurers|carriers|lenders) (will |won't |refuse|require|decline|have|charge)/i, 'carrier generalisation -- write "your carrier may" and how to get a written answer'],
  [/\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers Insurance|Nationwide|Travelers|American Family|Chubb|Erie Insurance|GEICO|Citizens Property)\b/i, 'named insurer'],
  [/\b(delve|furthermore|crucial|regulatory landscape|when it comes to|in today's|navigate the)\b/i, 'AI-cliche'],
  [/read on|we'll explain below|keep reading/i, 'engagement bait'],
  [/deadly|alarming|death ?trap|ticking time bomb|nightmare|horror/i, 'fear wording (owner: "gross")'],
  [/\boption period\b/i, 'Texas-only contract term in a national guide -- say "inspection deadline"'],
  [/\b(colour|labelled|recognise|licence|neighbour)\b/i, 'British spelling'],
  [/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/, 'link nested in bold (renders as literal markdown)'],
  [/^#{2,3}\s+Step\s+\d/im, 'templated "Step N" heading'],
];
let wordingBad = 0;
for (const [re, why] of BANNED) for (const t of [title, meta, quick, body]) { const m = t.match(re); if (m) { fail(`${why}: "${m[0]}"`); wordingBad++; break; } }
if (!wordingBad) ok('wording: no banned phrasing');
const heads = body.match(/^#{2,3} .*/gm) ?? [];
if (new Set(heads).size !== heads.length) fail('duplicate heading');
const words = body.split(/\s+/).length;
if (words < 500 || words > 1600) fail(`body ${words} words (500-1600; vary length between guides, never pad)`);
for (const l of (item?.linksExpected ?? []) as string[]) if (!body.includes(l)) console.log(`  note expected link not used: ${l} (fine if the prose has no honest place for it)`);

console.log(`\n  ${slug}: ${bad ? `${bad} problem(s) -- not ready` : 'gate passed -- next: publish script dry run, then show the owner'}`);
process.exit(bad ? 1 : 0);
