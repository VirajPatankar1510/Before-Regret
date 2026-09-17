// Add the five batch-1 county guides to the permits hub's county list.
//
//   npx tsx scripts/hub-link-batch1-counties.ts            # dry run
//   APPLY=true npx tsx scripts/hub-link-batch1-counties.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS IS AN HONEST LINK, when the last batch's were not.
//
// scripts/suggest-inbound-links.ts found NO honest anchor for the five convertible guides restored
// on 2026-09-16, and nothing was inserted: its candidates were homonyms -- "reasonable" in a
// sentence about GFCI outlets, "reset" in one about detach-and-reset solar panels. §3 forbids
// inventing a sentence to carry a link, and finding nothing is a result.
//
// This is the opposite case and needs no suggester. look-up-building-permits-by-address already
// carries a "## Permit Records by County" list with eleven entries; its purpose IS to list
// counties. The five restored yesterday are simply missing from it -- including Orange County CA,
// the largest of the twenty removed at 3,183,647 people. Finishing a list is not manufacturing an
// anchor.
//
// WHAT THIS DOES NOT DO, stated because it would be easy to imply otherwise: it will not get these
// pages indexed. That was tested and settled this week -- Google crawled this very hub on
// 2026-09-15, saw its link to the Harris County guide, and left Harris "unknown to Google" anyway.
// Internal links here are hygiene and crawl-path, not an indexing lever. Request Indexing is.
//
// Appended rather than sorted in: the existing eleven are not in alphabetical or population order,
// and reordering live entries to satisfy a tidiness instinct risks a diff nobody asked for.
//
// "(Anaheim)" on Orange County is disambiguation, not decoration -- Orange County FL (Orlando) is
// also in the removed set and is a candidate for a later batch, so the two need to be tellable
// apart before the second one lands. Same reason the list already says "(Houston)", "(Phoenix)"
// and "(Las Vegas)".
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

/** The line the new entries go after -- the current last item in the county list. */
const ANCHOR = '- [Clark County, NV (Las Vegas)](/guides/check-building-permits-clark-county-nv/)';

const ADD: Array<{ label: string; slug: string }> = [
  { label: 'Orange County, CA (Anaheim)', slug: 'check-building-permits-orange-county-ca' },
  { label: 'Dallas County, TX', slug: 'check-building-permits-dallas-county-tx' },
  { label: 'Riverside County, CA', slug: 'check-building-permits-riverside-county-ca' },
  { label: 'Queens, NY', slug: 'check-building-permits-queens-ny' },
  { label: 'Tarrant County, TX (Fort Worth)', slug: 'check-building-permits-tarrant-county-tx' },
];

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, body_markdown, status FROM articles WHERE status = 'published'
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');

  const hub = rows.find((r) => r.slug === HUB);
  if (!hub) throw new Error(`ABORT: ${HUB} is not published`);
  const published = new Set(rows.map((r) => r.slug));

  let body = String(hub.body_markdown);
  const before = (body.match(/\/guides\/check-(building-permits|harris)/g) ?? []).length;

  // Every target must be live, and must not already be linked from here.
  for (const e of ADD) {
    if (!published.has(e.slug)) throw new Error(`ABORT: ${e.slug} is not published — linking it would be a dead link`);
    if (body.includes(`/guides/${e.slug}/`)) throw new Error(`ABORT: hub already links ${e.slug}`);
  }

  const n = body.split(ANCHOR).length - 1;
  if (n !== 1) throw new Error(`ABORT: anchor line matched ${n} times, expected 1 — the hub changed`);

  const block = ADD.map((e) => `- [${e.label}](/guides/${e.slug}/)`).join('\n');
  body = body.replace(ANCHOR, `${ANCHOR}\n${block}`);

  // --- checks -------------------------------------------------------------------------------
  const after = (body.match(/\/guides\/check-(building-permits|harris)/g) ?? []).length;
  if (after !== before + ADD.length) throw new Error(`ABORT: county links ${before} -> ${after}, expected ${before + ADD.length}`);
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
  }
  // No dead internal links anywhere on the hub after the edit.
  for (const m of new Set((body.match(/\/guides\/([a-z0-9-]+)/g) ?? []))) {
    const t = m.replace('/guides/', '');
    if (t !== HUB && !published.has(t)) throw new Error(`ABORT: hub links a non-published guide: ${t}`);
  }
  // Duplicate list entries would be a footprint, not a link.
  const labels = [...body.matchAll(/^- \[([^\]]+)\]\(\/guides\/check-/gm)].map((m) => m[1]);
  if (new Set(labels).size !== labels.length) throw new Error('ABORT: duplicate county label in the list');

  console.log(`\n  ${HUB}`);
  console.log(`    county links ${before} -> ${after}`);
  console.log(`    body ${String(hub.body_markdown).length} -> ${body.length} chars`);
  console.log(`\n  added:`);
  for (const e of ADD) console.log(`    - ${e.label}  ->  /guides/${e.slug}/`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${HUB}`);
  console.log(`\n  wrote ${HUB}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
