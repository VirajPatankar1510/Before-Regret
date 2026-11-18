// Fails if the guided research tool's Stage 3 questions (src/components/research/missions.ts) state a number that
// isn't in a quote of one of the ledger facts that question cites, or cite a fact that doesn't exist.
//
//   npx tsx scripts/assert-research-missions.ts
import fs from 'node:fs';
import { MISSIONS } from '../src/components/research/missions';

const problems: string[] = [];
const ledgers = new Map<string, any>();
function fact(ref: string): { quote: string; readOn: string } | null {
  const m = ref.match(/^ledger:([^#]+)#(.+)$/);
  if (!m) { problems.push(`bad ref ${ref}`); return null; }
  if (!ledgers.has(m[1])) {
    const f = `data/fact-ledgers/${m[1]}.json`;
    ledgers.set(m[1], fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  }
  const l = ledgers.get(m[1]);
  const x = l?.facts?.find((y: any) => y.id === m[2]);
  if (!x) problems.push(`${ref}: not found`);
  return x ?? null;
}

for (const def of Object.values(MISSIONS)) {
  const quotes = def.facts.map(fact).filter(Boolean).map((f) => f!.quote).join(' \n ');
  const texts = [
    def.h1, def.intro,
    ...def.steps.flatMap((s) => [s.title, s.body]),
    ...def.record.flatMap((q) => [q.label, ...q.choices.flatMap((c) => [c.label, c.meaning.text, c.meaning.seller || '', c.meaning.verify || '', c.meaning.found, c.meaning.next])]),
  ];
  for (const t of texts) {
    for (const n of t.match(/\d[\d,]*/g) || []) {
      if (!quotes.includes(n)) problems.push(`${def.id}: "${n}" is not in any cited quote ("${t.slice(0, 70)}...")`);
    }
  }
  for (const s of def.steps) if (s.source && !/^https:\/\//.test(s.source.url)) problems.push(`${def.id}: source without https URL`);
}

if (problems.length) {
  console.error(`${problems.length} PROBLEM(S):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`ok  ${Object.keys(MISSIONS).length} questions: every number traces to a quoted, cited fact`);
