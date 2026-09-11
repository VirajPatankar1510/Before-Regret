// Build guard: the site must never emit a guide URL without its trailing slash.
//
//   npx tsx scripts/assert-canonical-urls.ts      # runs at the end of the build, over dist/
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS, given nothing is currently broken.
//
// Search Console reports three guide URLs twice, once with the trailing slash and once without,
// splitting their impressions between two entries at different positions:
//
//   /guides/look-up-building-permits-by-address/   186 impressions, position 13.5
//   /guides/look-up-building-permits-by-address    182 impressions, position 39.9
//
// That looks like a site defect and is not one. Every prescribed fix is already in place: the bare
// URL returns 308 Permanent Redirect, both forms carry a canonical pointing at the slash form, the
// sitemaps contain zero bare guide URLs, there are no bare internal links in markup or markdown,
// and JSON-LD @id and og:url both carry the slash. Google discovered the bare form independently
// and is mid-consolidation -- the demoted position on the duplicate is what consolidation looks
// like. It resolves itself, and no code change accelerates it.
//
// So this asserts the state rather than changing it. The failure mode it guards against is real and
// cheap to hit: one `href="/guides/foo"` in a new component, or one `](/guides/foo)` in an article
// body, and the site starts publishing the duplicate itself -- at which point Google is no longer
// consolidating a URL it guessed, it is indexing one we linked. That would be a genuine defect and
// it would be invisible in review, because the page still renders correctly either way.
//
// It runs over dist/ because that is what actually ships. Checking src/ would miss anything a
// prerenderer composes at build time.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/** Sourcemaps embed original sources and are never crawled; a hit there is noise, not a defect. */
const SKIP = /\.(map|woff2?|png|jpe?g|webp|svg|ico|avif)$/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (!SKIP.test(e.name)) out.push(p);
  }
  return out;
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error('ABORT: dist/ does not exist -- run the build first');

  // A guide URL that ends at the slug, with no trailing slash. Both the absolute form and the
  // root-relative form, since sitemaps use one and markup uses the other.
  const PATTERNS: Array<[string, RegExp]> = [
    ['absolute', /https:\/\/www\.beforeregret\.com\/guides\/[a-z0-9-]+(?![a-z0-9/-])/g],
    ['href',     /href="\/guides\/[a-z0-9-]+"/g],
    ['markdown', /\]\(\/guides\/[a-z0-9-]+\)/g],
  ];

  const bad: string[] = [];
  let scanned = 0;

  for (const file of walk(DIST)) {
    let text: string;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    scanned++;
    for (const [kind, re] of PATTERNS) {
      for (const m of text.matchAll(re)) {
        bad.push(`${path.relative(ROOT, file)}  [${kind}]  ${m[0].slice(0, 90)}`);
      }
    }
  }

  console.log(`\n  canonical URLs`);
  console.log(`    scanned ${scanned} shipped file(s) in dist/`);

  if (bad.length) {
    console.error(`\n  FAILED -- ${bad.length} guide URL(s) emitted WITHOUT a trailing slash:`);
    for (const b of bad.slice(0, 25)) console.error(`    - ${b}`);
    if (bad.length > 25) console.error(`    ... and ${bad.length - 25} more`);
    console.error(
      `\n  Every guide URL must end in "/". A bare one splits the page's ranking signals across\n` +
      `  two URLs in Search Console, and unlike the ones Google guessed, a bare URL we publish\n` +
      `  ourselves will keep being recrawled and re-indexed.\n`
    );
    process.exit(1);
  }
  console.log(`    ok  every emitted guide URL carries its trailing slash`);
}

main();
