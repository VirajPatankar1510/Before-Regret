import fs from 'fs';
import path from 'path';
import { PRESEEDED_SITUATIONS } from '../src/data/mockData';

// Fetch helper using the Firestore REST API to read dynamic courtCases and questions
async function fetchAllDocumentsInCollection(collectionName: string): Promise<any[]> {
  const projectId = "universal-cogency-hnzsc";
  const databaseId = "ai-studio-8253964b-c896-45ef-848b-790b8f983a8a";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Firestore GET ${collectionName} returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data || !data.documents) {
      return [];
    }

    return data.documents.map((docItem: any) => {
      const doc: any = {};
      const fields = docItem.fields || {};
      
      // Extract segment after last slash as ID
      if (docItem.name) {
        const p = docItem.name.split('/');
        doc.id = p[p.length - 1];
      }

      for (const [key, value] of Object.entries(fields)) {
        const valObj: any = value;
        if (valObj.stringValue !== undefined) {
          doc[key] = valObj.stringValue;
        } else if (valObj.integerValue !== undefined) {
          doc[key] = parseInt(valObj.integerValue, 10);
        } else if (valObj.booleanValue !== undefined) {
          doc[key] = valObj.booleanValue;
        } else if (valObj.doubleValue !== undefined) {
          doc[key] = parseFloat(valObj.doubleValue);
        } else if (valObj.arrayValue !== undefined) {
          const values = valObj.arrayValue.values || [];
          doc[key] = values.map((v: any) => v.stringValue || JSON.stringify(v));
        } else {
          doc[key] = JSON.stringify(value);
        }
      }
      return doc;
    });
  } catch (err) {
    console.warn(`Error compiling collection list ${collectionName} during static sitemap compilation:`, err);
    return [];
  }
}

async function runSitemapGenerator() {
  console.log("Generating high-performance SEO static sitemap.xml for www.beforeregret.com...");
  const origin = "https://beforeregret.com";
  
  const staticUrls = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "explore", changefreq: "weekly", priority: "0.8" },
    { path: "regrets", changefreq: "daily", priority: "0.8" },
    { path: "court", changefreq: "daily", priority: "0.9" },
    { path: "boards", changefreq: "daily", priority: "0.9" },
    { path: "flags", changefreq: "daily", priority: "0.9" },
    { path: "should-i-leave", changefreq: "daily", priority: "0.95" },
    { path: "will-i-regret", changefreq: "daily", priority: "0.95" },
    { path: "red-flags", changefreq: "daily", priority: "0.95" },
    { path: "relationship-regrets", changefreq: "daily", priority: "0.95" },
    { path: "commitment-issues", changefreq: "daily", priority: "0.95" },
    { path: "guides", changefreq: "weekly", priority: "0.9" },
    { path: "ldr-game", changefreq: "weekly", priority: "0.8" },
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

  // 1b. Expert Decision Guides
  const guideSlugs = [
    "infidelity-reconciliation-math-of-forgiveness",
    "ultimatum-protocol-why-marriage-deadlocks-fail",
    "relocation-risk-index-moving-for-love",
    "red-flag-evaluation-boundary-matrix",
    "financial-infidelity-secret-debt-private-accounts",
    "emotional-cheating-vs-close-friendship-boundaries",
    "stonewalling-silent-treatment-emotional-punishment",
    "breadwinner-resentment-income-disparity",
    "narcissistic-gaslighting-vs-healthy-disagreements",
    "long-distance-deadlock-closing-the-gap",
    "cold-feet-vs-marriage-dealbreakers",
    "codependency-vs-interdependence-autonomy-score"
  ];
  for (const slug of guideSlugs) {
    urlTags.push(`  <url>
    <loc>${origin}/guides/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.88</priority>
  </url>`);
  }

  // 2. Preseeded situations
  for (const situation of PRESEEDED_SITUATIONS) {
    urlTags.push(`  <url>
    <loc>${origin}/decision/${situation.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.82</priority>
  </url>`);
  }

  // 3. Preseeded comparison pages
  const someComparisons = [
    "boyfriend-doesnt-want-marriage-vs-stayed-after-cheating",
    "moved-in-together-vs-long-distance-commitment",
    "had-baby-to-save-marriage-vs-stayed-for-children"
  ];
  for (const comp of someComparisons) {
    urlTags.push(`  <url>
    <loc>${origin}/compare/${comp}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.70</priority>
  </url>`);
  }

  // 4. Country filters
  const popularCountries = ["usa", "india", "canada"];
  for (const country of popularCountries) {
    urlTags.push(`  <url>
    <loc>${origin}/country/${country}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.60</priority>
  </url>`);
  }

  // 5. Popular tags
  const popularTags = ["marriage", "cheating", "trust", "regret", "kids", "finance"];
  for (const tag of popularTags) {
    urlTags.push(`  <url>
    <loc>${origin}/tag/${tag}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.60</priority>
  </url>`);
  }

  // 6. Dynamic Court Cases from Firestore
  try {
    const courtCasesObj = await fetchAllDocumentsInCollection("courtCases");
    console.log(`Fetched ${courtCasesObj.length} dynamic court cases for static sitemap inclusion.`);
    for (const caseObj of courtCasesObj) {
      if (caseObj.slug) {
        urlTags.push(`  <url>
    <loc>${origin}/court/${caseObj.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
      }
    }
  } catch (err) {
    console.error("Sitemap compilation dynamic courtCases query error:", err);
  }

  // 7. Dynamic Advice Questions from Firestore
  try {
    const questionsObj = await fetchAllDocumentsInCollection("questions");
    console.log(`Fetched ${questionsObj.length} dynamic Q&A questions for static sitemap inclusion.`);
    for (const qObj of questionsObj) {
      if (qObj.slug) {
        urlTags.push(`  <url>
    <loc>${origin}/boards/${qObj.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
      }
    }
  } catch (err) {
    console.error("Sitemap compilation dynamic questions query error:", err);
  }

  // 8. Dynamic Regret Registry Stories from Firestore
  try {
    const storiesObj = await fetchAllDocumentsInCollection("stories");
    console.log(`Fetched ${storiesObj.length} dynamic stories for static sitemap inclusion.`);
    for (const storyObj of storiesObj) {
      if (storyObj.id) {
        let titleSlug = '';
        if (storyObj.title) {
          titleSlug = '-' + storyObj.title
            .toLowerCase()
            .replace(/['"’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        urlTags.push(`  <url>
    <loc>${origin}/regrets/${storyObj.id}${titleSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
      }
    }
  } catch (err) {
    console.error("Sitemap compilation dynamic stories query error:", err);
  }

  // 9. Dynamic Red Flag Cases from Firestore
  try {
    const redFlagsObj = await fetchAllDocumentsInCollection("redFlagCases");
    console.log(`Fetched ${redFlagsObj.length} dynamic red flags for static sitemap inclusion.`);
    for (const rObj of redFlagsObj) {
      if (rObj.id) {
        let titleSlug = '';
        if (rObj.title) {
          titleSlug = '-' + rObj.title
            .toLowerCase()
            .replace(/['"’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        urlTags.push(`  <url>
    <loc>${origin}/flags/${rObj.id}${titleSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
      }
    }
  } catch (err) {
    console.error("Sitemap compilation dynamic red_flag_meter query error:", err);
  }

  // Construct legal XML package
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags.join("\n")}
</urlset>`;

  const targetPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(targetPath, sitemapXml, "utf8");
  console.log(`Sitemap compiled successfully and written to physical static file: ${targetPath}`);
}

runSitemapGenerator().catch(err => {
  console.error("Failed to run build-time static sitemap compiler:", err);
  process.exit(1);
});
