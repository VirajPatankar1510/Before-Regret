// Removes a dead in-page anchor from the polybutylene guide.
//
//   npx tsx scripts/fix-polybutylene-anchor.ts            # dry run
//   APPLY=true npx tsx scripts/fix-polybutylene-anchor.ts
//
// polybutylene-insurance-section.ts linked to "#the-stub-out-trap-why-visual-inspections-can-deceive"
// on the assumption that headings carry slugified ids. They do not: renderArticleMarkdown.tsx emits
// <h2 class="..."> with no id, so the href resolved to nothing. It was also the only in-page anchor
// in the whole library, which is the tell that the pattern does not exist here.
//
// The script that introduced it asserted the heading TEXT was present and stopped there. The check
// it needed was on the rendered output, not the markdown -- an assertion about the source cannot
// see a renderer that drops the attribute the link depends on.
//
// Fixed by naming the section in prose instead. Adding id generation to the renderer would work and
// would be a bigger change than this page justifies: it touches every article, and the renderer has
// a deliberate twin in prerender-guides.tsx that would have to agree with it.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'spot-polybutylene-pipes-before-buying-house';

const FROM = 'This is where the [stub-out problem](#the-stub-out-trap-why-visual-inspections-can-deceive) becomes an insurance problem:';
const TO = 'This is where the stub-out problem described above becomes an insurance problem:';

async function main() {
  const [row] = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ${SLUG} AND status = 'published'
  `)) as unknown as Array<any>;
  if (!row) throw new Error(`ABORT: ${SLUG} is not published`);

  const n = row.body_markdown.split(FROM).length - 1;
  if (n !== 1) throw new Error(`ABORT: target matched ${n} times, expected 1`);
  const body = row.body_markdown.replace(FROM, TO);

  // The claim "described above" has to be true: the stub-out heading must precede this sentence.
  const stubAt = body.indexOf('## The "Stub-Out" Trap');
  const refAt = body.indexOf(TO);
  if (stubAt < 0) throw new Error('ABORT: the stub-out section is gone');
  if (stubAt > refAt) throw new Error('ABORT: the stub-out section now sits AFTER the reference to it');

  if (/\]\(#/.test(body)) throw new Error('ABORT: an in-page anchor survives');

  console.log(`  ${SLUG}  ${row.body_markdown.length} -> ${body.length} chars`);
  console.log(`    -  ${FROM}`);
  console.log(`    +  ${TO}`);
  console.log(`    ok  stub-out section at char ${stubAt} precedes the reference at ${refAt}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`  wrote ${SLUG}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
