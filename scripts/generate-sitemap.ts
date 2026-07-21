import fs from 'fs';
import path from 'path';

async function runSitemapGenerator() {
  console.log("Generating high-performance SEO static sitemap.xml for www.beforeregret.com...");
  const origin = "https://beforeregret.com";
  
  const staticUrls = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "explore", changefreq: "daily", priority: "0.9" },
    { path: "stories", changefreq: "daily", priority: "0.9" },
    { path: "become-expert", changefreq: "weekly", priority: "0.8" },
    { path: "legal-disclaimer", changefreq: "monthly", priority: "0.6" },
    { path: "terms-and-conditions", changefreq: "monthly", priority: "0.6" },
    { path: "privacy-policy", changefreq: "monthly", priority: "0.6" },
    { path: "refund-policy", changefreq: "monthly", priority: "0.6" },
    { path: "shipping-policy", changefreq: "monthly", priority: "0.6" },
    { path: "contact-us", changefreq: "monthly", priority: "0.6" },
  ];

  const popularCities = ["mumbai", "bengaluru", "gurugram", "thane"];
  const popularLocalities = ["loc_bimbisar_nagar", "loc_prestige_shantiniketan", "loc_dlf_phase_5", "loc_lodha_amara", "loc_hsr_layout"];

  const regretStories = [
    "powai-mistake",
    "gated-confessions",
    "whitefield-iceberg",
    "hsr-no-oc-trap",
    "gurugram-top-floor-seepage",
    "pune-rwa-bachelor-ban"
  ];

  const expertProfiles = [
    "exp_priya",
    "exp_rahul",
    "exp_sneha",
    "exp_amit"
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

  // 2. City Hub Pages
  for (const city of popularCities) {
    urlTags.push(`  <url>
    <loc>${origin}/city/${city}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
  }

  // 3. Locality / Society Pages
  for (const locality of popularLocalities) {
    urlTags.push(`  <url>
    <loc>${origin}/locality/${locality}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
  }

  // 4. Regret Editorial Stories
  for (const story of regretStories) {
    urlTags.push(`  <url>
    <loc>${origin}/stories/${story}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>`);
  }

  // 5. Resident Expert Pages
  for (const expert of expertProfiles) {
    const residentId = expert.replace(/^exp_/, 'res_');
    urlTags.push(`  <url>
    <loc>${origin}/resident/${residentId}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>`);
    // Include their direct booking page as well
    urlTags.push(`  <url>
    <loc>${origin}/resident/${residentId}/ask</loc>
    <changefreq>weekly</changefreq>
    <priority>0.70</priority>
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
