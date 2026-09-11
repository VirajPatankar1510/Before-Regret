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

  // -------------------------------------------------------------------------------------------
  // STRUCTURED DATA, checked here rather than in the pre-publish gate.
  //
  // The obvious place looked like the content gate, "assert the markdown contains JSON-LD". It does
  // not and never will: the markdown body holds prose, and every schema block is composed at
  // prerender time from database columns. Asserting it on the source would test the wrong artifact
  // and pass while the rendered page shipped bare. This runs over dist/, which is what Google and
  // every LLM retrieval engine actually fetch.
  //
  // Article + FAQPage + BreadcrumbList are required on a guide because all three already ship on
  // all of them -- so this is a regression gate, not a migration. A guide whose faq_json emptied
  // would silently lose its FAQPage and nothing else would notice.
  const REQUIRED_GUIDE_SCHEMA = ['Article', 'FAQPage', 'BreadcrumbList'];
  const guideDirs = fs.existsSync(path.join(DIST, 'guides'))
    ? fs.readdirSync(path.join(DIST, 'guides'), { withFileTypes: true }).filter((d) => d.isDirectory())
    : [];
  let schemaChecked = 0;
  for (const d of guideDirs) {
    const f = path.join(DIST, 'guides', d.name, 'index.html');
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    schemaChecked++;
    const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    if (!blocks.length) { bad.push(`guides/${d.name}  [schema]  no JSON-LD at all`); continue; }
    // Parse rather than regex the type names: a block that does not parse is invisible to every
    // consumer, and looks identical to a valid one under a substring match.
    const types = new Set<string>();
    for (const b of blocks) {
      try {
        const walk = (v: unknown): void => {
          if (Array.isArray(v)) v.forEach(walk);
          else if (v && typeof v === 'object') {
            const t = (v as Record<string, unknown>)['@type'];
            if (typeof t === 'string') types.add(t);
            Object.values(v as Record<string, unknown>).forEach(walk);
          }
        };
        walk(JSON.parse(b[1]));
      } catch (e) {
        bad.push(`guides/${d.name}  [schema]  JSON-LD does not parse: ${(e as Error).message.slice(0, 60)}`);
      }
    }
    for (const need of REQUIRED_GUIDE_SCHEMA) {
      if (!types.has(need)) bad.push(`guides/${d.name}  [schema]  missing ${need}`);
    }
  }

  console.log(`\n  canonical URLs`);
  console.log(`    scanned ${scanned} shipped file(s) in dist/`);
  console.log(`    schema checked on ${schemaChecked} guide page(s): ${REQUIRED_GUIDE_SCHEMA.join(' + ')}`);

  if (bad.length) {
    const slashCount = bad.filter((b) => !b.includes('[schema]')).length;
    const schemaCount = bad.length - slashCount;
    console.error(`\n  FAILED -- ${slashCount} bare URL(s), ${schemaCount} schema problem(s):`);
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
