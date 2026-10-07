// Inbound links to /guides/flood-zone-by-address/ from sentences that ALREADY discuss flood maps
// (found by scripts/suggest-inbound-links.ts --all-clusters, 2026-10-07). No sentence is added or
// reworded: each edit only wraps existing words in a link. Anchors vary.
//
//   npx tsx scripts/link-flood-zone-guide.ts          # dry run
//   APPLY=true npx tsx scripts/link-flood-zone-guide.ts

import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/flood-zone-by-address/';
const EDITS: Array<{ slug: string; anchor: string }> = [
  { slug: 'get-clue-report-before-buying-house', anchor: 'official flood hazard maps' },
  { slug: 'check-building-permits-tarrant-county-tx', anchor: 'local floodplain regulations' },
  { slug: 'buying-a-mobile-home-what-to-check', anchor: '100-year flood elevation' },
];

async function main() {
  let bad = 0;
  const out: Array<{ slug: string; body: string }> = [];
  for (const e of EDITS) {
    const rows = (await withDb((sql) => sql`SELECT body_markdown FROM articles WHERE slug = ${e.slug} AND status = 'published'`)) as unknown as Array<{ body_markdown: string }>;
    const body = rows[0]?.body_markdown;
    if (!body) { console.log(`  FAIL ${e.slug}: not found`); bad++; continue; }
    if (body.includes(TARGET)) { console.log(`  skip ${e.slug}: already links`); continue; }
    const n = body.split(e.anchor).length - 1;
    if (n !== 1) { console.log(`  FAIL ${e.slug}: anchor appears ${n} times`); bad++; continue; }
    const i = body.indexOf(e.anchor);
    const before = body.slice(Math.max(0, i - 2), i), after = body.slice(i + e.anchor.length, i + e.anchor.length + 2);
    if (before.endsWith('**') || after.startsWith('**') || before.endsWith('[') || after.startsWith('](')) { console.log(`  FAIL ${e.slug}: anchor touches bold or a link`); bad++; continue; }
    const next = body.replace(e.anchor, `[${e.anchor}](${TARGET})`);
    if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(next)) { console.log(`  FAIL ${e.slug}: bold-nested link`); bad++; continue; }
    console.log(`  ${e.slug}: "${e.anchor}" -> ${TARGET}`);
    out.push({ slug: e.slug, body: next });
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN.'); return; }
  for (const o of out) await withDb((sql) => sql`UPDATE articles SET body_markdown = ${o.body}, updated_at = now() WHERE slug = ${o.slug} AND status = 'published'`);
  console.log(`\n  wrote ${out.length} link(s).`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
