// Link the two guides whose prose already describes hidden DIY work to the contractor guide that
// covers spotting it: unpermitted-work-behind-the-wall (published 2026-09-28).
//
//   npx tsx scripts/link-unpermitted-behind-wall.ts            # dry run
//   APPLY=true npx tsx scripts/link-unpermitted-behind-wall.ts
//
// suggest-inbound-links.ts found nothing -- every word of the new title is common in the library --
// so the anchors were found by searching the bodies for sentences about DIY work concealed behind
// walls. Two qualified. Others were rejected: the polybutylene and double-tapped sentences are about
// a different subject, and the county permit sentences are about records, not spotting the work.
// Neither source page is in a running experiment. updated_at is left alone: wrapping existing words
// in a link is not a content update (see scripts/link-walk-away-guide.ts for the reasoning).

import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = 'unpermitted-work-behind-the-wall';
const HREF = `/guides/${TARGET}/`;

const EDITS = [
  {
    slug: 'amateur-workmanship-mean-home-inspection-report',
    find: 'concealed electrical runs behind newly finished basement walls may pose similar or greater risks.',
    replace: `[concealed electrical runs behind newly finished basement walls](${HREF}) may pose similar or greater risks.`,
  },
  {
    slug: 'find-unpermitted-work-before-buying',
    find: 'is a common sign of DIY electrical work.',
    replace: `is [a common sign of DIY electrical work](${HREF}).`,
  },
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${[...EDITS.map((e) => e.slug), TARGET]}) AND status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (!bodies.has(TARGET)) throw new Error(`ABORT: target ${TARGET} is not published`);
  for (const e of EDITS) {
    const body = bodies.get(e.slug);
    if (!body) throw new Error(`ABORT: source ${e.slug} is not published`);
    if (body.includes(HREF)) throw new Error(`ABORT: ${e.slug} already links to the target`);
    const n = body.split(e.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor in ${e.slug} matched ${n} times, expected exactly 1`);
    const next = body.replace(e.find, e.replace);
    if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(next)) throw new Error(`ABORT: nested bold link in ${e.slug}`);
    bodies.set(e.slug, next);
    console.log(`  ok  ${e.slug}\n      + ${e.replace}\n`);
  }
  if (!APPLY) { console.log('DRY RUN -- nothing written. Re-run with APPLY=true.'); return; }
  for (const e of EDITS) {
    const res = (await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${bodies.get(e.slug)!} WHERE slug = ${e.slug} AND status = 'published' RETURNING slug
    `)) as unknown as Array<{ slug: string }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${e.slug} affected ${res.length} rows`);
    console.log(`  wrote ${e.slug}`);
  }
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
