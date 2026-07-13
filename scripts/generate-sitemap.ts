import fs from 'fs';
import path from 'path';

async function runSitemapGenerator() {
  console.log("Generating high-performance SEO static sitemap.xml for www.beforeregret.com...");
  const origin = "https://beforeregret.com";
  
  const staticUrls = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "search", changefreq: "daily", priority: "0.9" },
    { path: "how-it-works", changefreq: "weekly", priority: "0.8" },
    { path: "become-expert", changefreq: "weekly", priority: "0.8" },
  ];

  const popularCities = ["bengaluru", "mumbai", "gurugram", "hyderabad", "delhi-ncr"];
  const popularLocalities = [
    "indiranagar", "hsr-layout", "koramangala", "bandra-west", "dlf-phase-3", "gachibowli"
  ];

  const urlTags: string[] = [];

  // 1. Core pages
  for (const item of staticUrls) {
    urlTags.push(`  <url>
    <loc>${origin}/${item.path}</loc>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`);
  }

  // 2. City Pages
  for (const city of popularCities) {
    urlTags.push(`  <url>
    <loc>${origin}/city/${city}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
  }

  // 3. Locality Pages
  for (const locality of popularLocalities) {
    urlTags.push(`  <url>
    <loc>${origin}/locality/${locality}</loc>
    <changefreq>daily</changefreq>
    <priority>0.80</priority>
  </url>`);
  }

  // Construct XML sitemap
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags.join("\n")}
</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const targetPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(targetPath, sitemapXml, "utf8");
  console.log(`Sitemap compiled successfully and written to: ${targetPath}`);
}

runSitemapGenerator().catch(err => {
  console.error("Failed to run build-time static sitemap compiler:", err);
  process.exit(1);
});
