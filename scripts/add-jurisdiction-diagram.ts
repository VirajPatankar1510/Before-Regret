// Puts the county-vs-city jurisdiction diagram on the permit hub guide.
//
//   npx tsx scripts/add-jurisdiction-diagram.ts            # dry run
//   APPLY=true npx tsx scripts/add-jurisdiction-diagram.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS GUIDE AND WHY THIS SUBJECT. The permits cluster is 20 guides and ~59% of this site's
// impressions, and not one of them carried a diagram. The subject picked itself: whether an address
// sits in an incorporated city or on unincorporated county land decides which authority holds its
// permit records, it is genuinely hard to hold in prose, and it is the confusion that forced two
// quick answers to be rewritten today. look-up-building-permits-by-address is the mechanism page
// for the whole cluster -- its first heading is literally "Finding the Right Local Authority" --
// so the diagram belongs there rather than on any one county's page.
//
// THE GOLDEN RULE, satisfied before drawing anything: nothing is trapped in the image. The guide's
// prose already carries "unincorporated" 4x, "incorporated" 5x, "municipal" 13x and "jurisdiction"
// 15x, and the SVG's own <title> and <desc> repeat the whole mechanism as text. A crawler that
// never renders the image loses nothing.
//
// SIDE EFFECT WORTH KNOWING. src/utils/articleImage.ts makes the FIRST block-level markdown image
// the article's schema image. This guide currently declares hero-bg.jpg -- the homepage background
// -- which is what that file describes as wasting the field entirely. After this it declares a
// diagram that actually represents the article.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { extractFirstArticleImage } from '../src/utils/articleImage.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'look-up-building-permits-by-address';
const SVG = '/images/county-vs-city-permit-jurisdiction.svg';
const ANCHOR = '## Finding the Right Local Authority';

const ALT =
  'Diagram of one US county containing two incorporated cities surrounded by unincorporated land. ' +
  'The county building department holds permit records for the unincorporated area; each city holds ' +
  'the records for addresses inside its own limits, so searching the county portal for an address ' +
  'inside a city returns nothing even when permits exist.';

async function main() {
  const svgPath = path.join(process.cwd(), 'public', SVG);
  if (!fs.existsSync(svgPath)) throw new Error(`ABORT: ${SVG} not in public/`);
  const svg = fs.readFileSync(svgPath, 'utf8');
  // The image must not be the only place this information lives.
  for (const required of ['<title', '<desc', 'Unincorporated', 'incorporated']) {
    if (!svg.includes(required)) throw new Error(`ABORT: the SVG is missing ${required}`);
  }

  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ${SLUG} AND status='published'`)) as unknown as any[];
  if (!rows.length) throw new Error(`ABORT: ${SLUG} is not published`);
  const body = String(rows[0].body_markdown);

  if (body.includes(SVG)) throw new Error('ABORT: the diagram is already on this page');
  if (!body.includes(ANCHOR)) throw new Error(`ABORT: anchor "${ANCHOR}" not found`);

  // Every label the image shows must already be findable as text on the page.
  for (const label of ['unincorporated', 'incorporated']) {
    if (!new RegExp(`\\b${label}`, 'i').test(body)) {
      throw new Error(`ABORT: the image shows "${label}" but the prose never uses the word`);
    }
  }

  // Block image: its own line, blank line either side, directly under the heading it illustrates.
  const next = body.replace(ANCHOR, `${ANCHOR}\n\n![${ALT}](${SVG})`);

  const before = extractFirstArticleImage(body);
  const after = extractFirstArticleImage(next);
  if (!after) throw new Error('ABORT: the inserted image is not recognised as a block image');

  console.log(`  ${SLUG}`);
  console.log(`    inserted under : ${ANCHOR}`);
  console.log(`    alt text       : ${ALT.length} chars`);
  console.log(`    schema image   : ${before ?? '(none -- falls back to hero-bg.jpg)'}`);
  console.log(`                  -> ${after}`);
  console.log(`    body           : ${body.split(/\s+/).length} -> ${next.split(/\s+/).length} words`);
  console.log(`    svg            : ${(svg.length / 1024).toFixed(1)} KB`);
  console.log(`\n  quick_answer, title, meta, slug, canonical: unchanged`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  written. Run \`npm run build\` or it is not live.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
