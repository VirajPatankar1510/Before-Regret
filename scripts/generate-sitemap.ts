import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateSitemapIndexXml, generateChildSitemapXml, generateRobotsTxt } from '../src/utils/sitemapGenerator';
import { withDb, isDbConfigured } from '../src/server/db.js';

const countLocs = (xml: string): number => (xml.match(/<loc>/g) ?? []).length;

// PREFLIGHT: refuse to generate anything if the database is configured but unreachable.
//
// This exists because of a real near-miss, not a hypothetical. generateChildSitemapXml swallows a
// failed DB read (`catch (err) { console.error(...) }` around the guides and counties queries) and
// returns a structurally valid but EMPTY <urlset> -- sensible degradation for the live Express
// route, which should serve something rather than 500, but catastrophic here where the result is
// written to disk and shipped. countRecentNewsArticles fails the same way, returning 0, which drops
// sitemap-news from the index and makes the cleanup loop below DELETE the existing file.
//
// Observed on a local build during a Neon DNS outage: sitemap-counties.xml went 100 -> 0 URLs,
// sitemap-guides.xml 146 -> 0, and sitemap-news.xml was deleted -- with the script reporting
// success. Publishing that would have withdrawn every content URL from the sitemap while Google was
// mid-validation on an indexing fix.
//
// Failing loudly here is strictly better than any partial result: a build that stops leaves the
// last-known-good sitemap in place, while a build that "succeeds" with an empty one actively
// retracts the site from search.
async function assertDatabaseReachable() {
  if (!isDbConfigured()) {
    console.warn('[sitemap] DATABASE_URL not configured -- generating static pages only. This is expected in a DB-less environment, but the guides/counties sitemaps will be empty.');
    return;
  }
  try {
    await withDb((sql) => sql`SELECT 1`);
  } catch (err) {
    console.error('\n[sitemap] ABORTING: DATABASE_URL is set but the database is unreachable.');
    console.error('[sitemap] Generating now would write EMPTY guides/counties sitemaps and delete sitemap-news.xml,');
    console.error('[sitemap] silently withdrawing every content URL from search. Existing files left untouched.');
    console.error('[sitemap] Underlying error:', err);
    process.exit(1);
  }
}

async function runSitemapGenerator() {
  console.log("Generating static sitemap.xml, child sitemaps, and robots.txt for www.beforeregret.com...");

  await assertDatabaseReachable();

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Vercel serves the static output of `public/` directly; the Express
  // routes in server.ts that call these same generators never run in
  // production there, so the build must bake their output to disk.
  const indexXml = await generateSitemapIndexXml();
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), indexXml, "utf8");

  const sitemapsDir = path.join(publicDir, "sitemaps");
  if (!fs.existsSync(sitemapsDir)) {
    fs.mkdirSync(sitemapsDir, { recursive: true });
  }

  const childNames = Array.from(indexXml.matchAll(/\/sitemaps\/([\w-]+\.xml)/g)).map(m => m[1]);

  // Generate and validate EVERYTHING before touching disk. Deliberately not interleaved with the
  // writes: a guard that fires halfway through leaves a directory that is part new and part old,
  // which is a worse state than either. Nothing below mutates the filesystem until every child has
  // been generated and checked.
  const generated: Array<{ name: string; xml: string }> = [];
  for (const name of childNames) {
    const xml = await generateChildSitemapXml(name);
    if (xml === null) continue; // legitimately absent (sitemap-news outside its freshness window)
    generated.push({ name, xml });
  }

  // REGRESSION GUARD, second layer behind the preflight above. The preflight catches an unreachable
  // database; this catches the case where the database answers fine but a sitemap still comes back
  // empty -- a renamed column, a changed status value, a WHERE clause that silently stops matching.
  // Comparing against what is already on disk is what makes it safe to run on a genuinely empty new
  // install (0 -> 0 is fine, and so is a first run with no previous file); only losing URLs that
  // previously existed is treated as a defect.
  for (const { name, xml } of generated) {
    const previousPath = path.join(sitemapsDir, name);
    const previousCount = fs.existsSync(previousPath) ? countLocs(fs.readFileSync(previousPath, 'utf8')) : 0;
    const nextCount = countLocs(xml);
    if (previousCount > 0 && nextCount === 0) {
      console.error(`\n[sitemap] ABORTING: ${name} would go from ${previousCount} URL(s) to 0.`);
      console.error('[sitemap] The database answered, so this is a query/schema problem rather than an outage.');
      console.error('[sitemap] Refusing to publish an empty sitemap. Existing files left untouched.');
      process.exit(1);
    }
    if (previousCount > 0 && nextCount < previousCount / 2) {
      console.warn(`[sitemap] WARNING: ${name} dropped from ${previousCount} to ${nextCount} URL(s) -- writing it, but check this is intended.`);
    }
  }

  // A file the index doesn't currently link to (e.g. sitemap-news.xml with nothing in its 48-hour
  // window -- see generateChildSitemapXml) must not survive from a previous build either, or a
  // stale copy stays reachable and crawlable on disk after the index has already stopped
  // referencing it. Safe to do now: the preflight proved the database is reachable, so an omitted
  // child reflects real data rather than a failed query.
  for (const existing of fs.existsSync(sitemapsDir) ? fs.readdirSync(sitemapsDir) : []) {
    if (!childNames.includes(existing)) {
      fs.unlinkSync(path.join(sitemapsDir, existing));
    }
  }
  for (const { name, xml } of generated) {
    fs.writeFileSync(path.join(sitemapsDir, name), xml, "utf8");
  }

  fs.writeFileSync(path.join(publicDir, "robots.txt"), generateRobotsTxt(), "utf8");

  console.log(`Sitemap index + ${childNames.length} child sitemap(s) + robots.txt written to: ${publicDir}`);
}

runSitemapGenerator().catch(err => {
  console.error("Failed to run build-time static sitemap/robots compiler:", err);
  process.exit(1);
});
