// One-sentence corrections from the site audit of 2026-11-19, each approved by the owner the same day:
//   - #50: "Certain recalled panel brands" (F12). The panels were not recalled -- the CPSC closed its Federal
//     Pacific investigation in 1983 without a finding (guide #321) -- and the report engine's sentence, which
//     this one copied, was corrected in src/engine/inspectionPriorities.ts the same day.
//   - F10: stock phrasing the draft gate now rejects ("navigate the", "landscape", "not only ... but also",
//     "peace of mind", "comprehensive guide") on 8 guides that predate the gate. The owner chose to see every
//     before/after before these are written.
//
//   npx tsx scripts/fix-audit-sentences-2026-11.ts                 # dry run: every old/new pair
//   ONLY=50 APPLY=true npx tsx scripts/fix-audit-sentences-2026-11.ts   # write just #50
//   APPLY=true npx tsx scripts/fix-audit-sentences-2026-11.ts       # write all
//
// Writes body_markdown (and updated_at) only. Never the title, meta, slug or status. Each old sentence must
// appear exactly once in the stored body, or that article is skipped with an error and nothing is written to it.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;

const EDITS: { id: number; old: string; new: string }[] = [
  { id: 50,
    old: 'Certain recalled panel brands from this era — some insurance carriers decline to write policies on homes that still have them.',
    new: 'Certain panel brands from this era with documented breaker problems — some insurance carriers decline to write policies on homes that still have them.' },
  { id: 7,
    old: 'helps prospective buyers navigate the underwriting process without unpleasant surprises.',
    new: 'helps prospective buyers get through underwriting without unpleasant surprises.' },
  { id: 115,
    old: 'underscores the diverse housing landscapes across the US.',
    new: 'shows how widely the age of the housing stock varies across the US.' },
  { id: 115,
    old: 'For instance, Philadelphia County not only has 50.6% of its housing stock built before 1950 but also a substantial 84.2% built before 1980, indicating a continued pattern of older housing dominating the market.',
    new: 'For instance, Philadelphia County has 50.6% of its housing stock built before 1950 and 84.2% built before 1980, so older housing still dominates the market there.' },
  { id: 135,
    old: 'the loan is secured not only by the physical home, but also by the financial health and operational stability of the governing association.',
    new: 'the loan is secured by the physical home, but the lender is also relying on the financial health and operational stability of the governing association.' },
  { id: 171,
    old: 'compromises your safety and peace of mind,',
    new: 'compromises your safety or your confidence in the house,' },
  { id: 216,
    old: "Here is a comprehensive guide on how to research a property's permit history in Riverside County,",
    new: "This guide covers how to research a property's permit history in Riverside County," },
  { id: 221,
    old: 'Understanding how to navigate these municipal systems is essential to avoiding a costly mistake before you close escrow.',
    new: 'Knowing how these municipal systems work is how you avoid a costly mistake before you close escrow.' },
  { id: 266,
    old: 'can be wired to protect not only itself but also several standard outlets',
    new: 'can be wired to protect itself and several standard outlets' },
  { id: 284,
    old: 'buyers and sellers commonly navigate these findings in several ways:',
    new: 'buyers and sellers commonly handle these findings in several ways:' },
  { id: 284,
    old: 'the buyer can often assume the protection plan after closing, which provides significant peace of mind.',
    new: 'the buyer can often assume the protection plan after closing, so the coverage carries over.' },
];

const ids = [...new Set(EDITS.map((e) => e.id))].filter((id) => !ONLY || ONLY.includes(id));
for (const id of ids) {
  const rows: any = await withDb((sql: any) => sql`SELECT slug, status, body_markdown FROM articles WHERE id = ${id}`);
  if (!rows.length) { console.error(`#${id}: not found, skipped`); continue; }
  let body: string = rows[0].body_markdown;
  let ok = true;
  console.log(`\n#${id} ${rows[0].slug} (${rows[0].status})`);
  for (const e of EDITS.filter((x) => x.id === id)) {
    const n = body.split(e.old).length - 1;
    if (n !== 1) { console.error(`  ERROR: old text found ${n} times -- #${id} skipped:\n    ${e.old}`); ok = false; break; }
    body = body.replace(e.old, e.new);
    console.log(`  - ${e.old}\n  + ${e.new}`);
  }
  if (ok && APPLY) {
    await withDb((sql: any) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = ${id}`);
    console.log('  written');
  }
}
console.log(APPLY ? '\nDone. Guides are prerendered: rebuild and deploy to publish.' : '\nDRY RUN -- nothing written.');
