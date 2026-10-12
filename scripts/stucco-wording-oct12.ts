// Put the searchers' own words into stucco pages A and C before Google first crawls them
// (owner go 2026-10-12). Same fix that moved the EIFS guide from position 41 to 16: the page said
// one word, searchers typed another.
//   A eifs-vs-stucco-how-to-tell: "how to identify synthetic stucco", "what is eifs" (capture 2026-10-12-demand-eifs-*)
//   C how-to-choose-eifs-stucco-inspector: "eifs testing", "moisture meter for stucco" (same capture)
// Both pages were "URL is unknown to Google" when this ran, so no ranking is disturbed. Slugs and
// titles do not change. Edits the markdown source and the database row together.
//
//   npx tsx scripts/stucco-wording-oct12.ts            # dry run
//   APPLY=true npx tsx scripts/stucco-wording-oct12.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
type Swap = [string, string];
const EDITS: Array<{ slug: string; meta?: string; swaps: Swap[] }> = [
  {
    slug: 'eifs-vs-stucco-how-to-tell',
    meta: 'EIFS (synthetic stucco) and traditional stucco can look identical. Five checks to make at a showing, what each tells you, and when to call a specialist.',
    swaps: [
      ['From the sidewalk, you usually can\'t. Either system', 'From the sidewalk, you usually can\'t identify synthetic stucco by sight. Either system'],
      ['## What\'s under each one', '## What EIFS (synthetic stucco) is, and what stucco is'],
    ],
  },
  {
    slug: 'how-to-choose-eifs-stucco-inspector',
    swaps: [
      ['## A scan is not a survey', '## Moisture meters: a scan is not a probe test'],
      ['A surface scan and a probe test answer different questions.', 'In EIFS testing, a surface scan and a probe test answer different questions.'],
    ],
  },
];

async function main() {
  for (const e of EDITS) {
    const file = path.join(process.cwd(), 'guides', `${e.slug}.md`);
    let md = fs.readFileSync(file, 'utf8');
    const [row] = (await withDb((sql) => sql`SELECT body_markdown, meta_description FROM articles WHERE slug = ${e.slug} AND status = 'published'`)) as unknown as Array<{ body_markdown: string; meta_description: string }>;
    if (!row) throw new Error(`ABORT: ${e.slug} not published`);
    let body = row.body_markdown;
    const before = body;
    for (const [from, to] of e.swaps) {
      for (const [label, text] of [['db', body], ['md', md]] as const) {
        const n = text.split(from).length - 1;
        if (n !== 1) throw new Error(`ABORT: ${e.slug} ${label}: "${from}" matched ${n} times`);
      }
      body = body.replace(from, to); md = md.replace(from, to);
      console.log(`  ${e.slug}\n    - ${from}\n    + ${to}`);
    }
    if (e.meta) {
      if (e.meta.length < 70 || e.meta.length > 155) throw new Error(`ABORT: meta ${e.meta.length} chars`);
      md = md.replace(/^meta: .*$/m, `meta: ${e.meta}`);
      console.log(`    meta (${e.meta.length}): ${e.meta}`);
    }
    if (!APPLY) continue;
    const meta = e.meta ?? row.meta_description;
    const n = await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, meta_description = ${meta}, updated_at = now()
      WHERE slug = ${e.slug} AND body_markdown = ${before} RETURNING id`);
    if ((n as unknown[]).length !== 1) throw new Error(`ABORT: ${e.slug} changed since read`);
    fs.writeFileSync(file, md);
    console.log(`    wrote ${e.slug}`);
  }
  if (!APPLY) console.log('\n  DRY RUN -- nothing written.\n');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
