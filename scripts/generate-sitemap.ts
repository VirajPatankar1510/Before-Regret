import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateSitemapIndexXml, generateChildSitemapXml, generateRobotsTxt } from '../src/utils/sitemapGenerator';

async function runSitemapGenerator() {
  console.log("Generating static sitemap.xml, child sitemaps, and robots.txt for www.beforeregret.com...");

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

  // A file the index doesn't currently link to (e.g. sitemap-news.xml with nothing in its 48-hour
  // window -- see generateChildSitemapXml) must not survive from a previous build either, or a
  // stale copy stays reachable and crawlable on disk after the index has already stopped
  // referencing it.
  const childNames = Array.from(indexXml.matchAll(/\/sitemaps\/([\w-]+\.xml)/g)).map(m => m[1]);
  for (const existing of fs.existsSync(sitemapsDir) ? fs.readdirSync(sitemapsDir) : []) {
    if (!childNames.includes(existing)) {
      fs.unlinkSync(path.join(sitemapsDir, existing));
    }
  }
  for (const name of childNames) {
    const xml = await generateChildSitemapXml(name);
    if (xml === null) continue;
    fs.writeFileSync(path.join(sitemapsDir, name), xml, "utf8");
  }

  fs.writeFileSync(path.join(publicDir, "robots.txt"), generateRobotsTxt(), "utf8");

  console.log(`Sitemap index + ${childNames.length} child sitemap(s) + robots.txt written to: ${publicDir}`);
}

runSitemapGenerator().catch(err => {
  console.error("Failed to run build-time static sitemap/robots compiler:", err);
  process.exit(1);
});
