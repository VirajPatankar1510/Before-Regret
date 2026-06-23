import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { PRESEEDED_RELATIONSHIP_PROBLEMS } from "./src/data/relationshipProblems";
import { PRESEEDED_SITUATIONS } from "./src/data/mockData";

dotenv.config();

// Blazing fast lightweight fetch helper to get Firestore documents via Google REST API
async function fetchDocumentFromFirestore(collectionName: string, documentId: string): Promise<any> {
  const projectId = "universal-cogency-hnzsc";
  const databaseId = "ai-studio-8253964b-c896-45ef-848b-790b8f983a8a";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${documentId}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data || !data.fields) {
      return null;
    }
    
    // Simple mapper to convert firestore value wrappers to a plain javascript object
    const doc: any = {};
    for (const [key, value] of Object.entries(data.fields)) {
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
  } catch (err) {
    console.warn(`Error fetching document ${collectionName}/${documentId} from Firestore REST:`, err);
    return null;
  }
}

// Blazing fast lightweight fetch helper to list all documents from a Firestore collection
async function fetchAllDocumentsInCollection(collectionName: string): Promise<any[]> {
  const projectId = "universal-cogency-hnzsc";
  const databaseId = "ai-studio-8253964b-c896-45ef-848b-790b8f983a8a";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!data || !data.documents) {
      return [];
    }

    return data.documents.map((docItem: any) => {
      const doc: any = {};
      const fields = docItem.fields || {};
      
      // Extract segment after last slash as ID (e.g. projects/.../documents/courtCases/slug-xyz)
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
    console.warn(`Error listing collection ${collectionName} from Firestore REST:`, err);
    return [];
  }
}

// Generate matching page title and description exactly aligned with front-end routing
async function getPageMetadata(urlPath: string) {
  const parts = urlPath.split('/').filter(Boolean);
  
  let title = "BeforeRegret — See what happened before making the same decision.";
  let description = "BeforeRegret is an interactive ledger of crowdsourced anonymous relationship timeline stories on marriage, cheating, and commitment regrets.";
  
  if (parts.length === 0) {
    return { title, description };
  }
  
  const first = parts[0].toLowerCase();
  const displaySlug = parts[1] ? parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  if (first === 'explore') {
    title = "Explore Decisional Outcomes | BeforeRegret";
    description = "Browse real relationship categories and outcome dossiers grouped by decision, gender, age, and country.";
  }
  else if (first === 'decision') {
    const slug = parts[1] || 'boyfriend-doesnt-want-marriage';
    const preseeded = PRESEEDED_SITUATIONS.find(s => s.slug === slug);
    const sName = preseeded ? preseeded.name : displaySlug;
    title = `Should I ${sName}? Real Outcomes & Regrets | BeforeRegret`;
    description = preseeded ? preseeded.description : `Access crowd-sourced demographics, average regret curves, and 100% anonymous stories on "${sName}".`;
  }
  else if (first === 'compare') {
    const slug = parts[1] || 'boyfriend-doesnt-want-marriage-vs-stayed-after-cheating';
    const subParts = slug.split('-vs-');
    const d1 = subParts[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Alpha';
    const d2 = subParts[1]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Beta';
    title = `Compare ${d1} vs ${d2} | Relationship Decision Ledger`;
    description = `Raw side-by-side comparative analysis of ${d1} vs ${d2}. Check relationship split rates, average regret ratings, and demographic stats.`;
  }
  else if (first === 'court') {
    if (parts[1]) {
      const slug = parts[1];
      const courtCase = await fetchDocumentFromFirestore("courtCases", slug);
      if (courtCase) {
        title = `Relationship Jury Trial: "${courtCase.title}" | BeforeRegret`;
        description = courtCase.description ? courtCase.description.slice(0, 155) + "..." : `Review active relationship trial: "${courtCase.title}" in the public citizens tribunal. Vote on verdict options.`;
      } else {
        title = `Relationship Jury Trial: "${displaySlug}" | BeforeRegret`;
        description = `Review active relationship trial: "${displaySlug}" in the public citizens tribunal. Vote on verdict options and write arguments.`;
      }
    } else {
      title = "Peers Jury Tribunal - Give Judgement on Relationship Evidence | BeforeRegret";
      description = "Deliberate and vote on user-lodged relationship conflict trials. Defend arguments as an anonymous juror citizen.";
    }
  }
  else if (first === 'boards') {
    if (parts[1]) {
      const slug = parts[1];
      const question = await fetchDocumentFromFirestore("questions", slug);
      if (question) {
        title = `Survivor Q&A advice: "${question.title}" | BeforeRegret`;
        description = question.description ? question.description.slice(0, 155) + "..." : `Ask seasoned survivors and read Q&A advice for: "${question.title}". Read responses and view active polls.`;
      } else {
        title = `Survivor Q&A advice: "${displaySlug}" | BeforeRegret`;
        description = `Ask seasoned survivors and read Q&A advice for: "${displaySlug}". Read community responses and view active polls.`;
      }
    } else {
      title = "Community Advice Boards - Ask Survivor Veterans | BeforeRegret";
      description = "Browse advice and questions from individuals facing major relationship crises answered by veteran survivors.";
    }
  }
  else if (first === 'regrets') {
    title = "BeforeRegret Relationship Story Ledger & Regrets";
    description = "Read full timeline stories, interactive outcome statistics, and veteran survivors reports of relationship regrets.";
  }
  else if (first === 'country') {
    const countryName = parts[1] ? parts[1].toUpperCase() : 'Global';
    title = `Relationship Decisions, Regrets & Outcomes in ${countryName} | BeforeRegret`;
    description = `Explore demographic logs, regret curves, and relationship split rates from citizens facing relationship decisions in ${countryName}.`;
  }
  else if (first === 'tag') {
    title = `Choice Outcomes matching "${displaySlug}" | BeforeRegret`;
    description = `Analyze community outcomes, average regrets, and survivor guidelines classified under dynamic category keyword: #${displaySlug}.`;
  }
  
  return { title, description };
}

// Transform the index.html template and inject standard SEO and OpenGraph meta tags
function hydrateHtml(rawHtml: string, title: string, description: string, url: string): string {
  let html = rawHtml.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  
  // Strip pre-existing elements we are replacing
  html = html.replace(/<meta name="description"[^>]*>/gi, '');
  html = html.replace(/<meta property="og:[^>]*>/gi, '');
  html = html.replace(/<link rel="canonical"[^>]*>/gi, '');

  const metaTags = `
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="BeforeRegret" />
    <link rel="canonical" href="${url}" />
  `;

  return html.replace('</head>', `${metaTags}\n</head>`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API dynamic keyword generation proxy using Gemini API
  app.post("/api/admin/sync-relationship-problems", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not configured. Falling back to preseeded relationship problems.");
        return res.json({ success: true, list: PRESEEDED_RELATIONSHIP_PROBLEMS, isFallback: true });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert relationship search analyst. Generate a comprehensive JSON array of modern relationship problems and their backend search query terms/phrases.
Include problems like friend-zone, ghosting, situationship, love-bombing, micro-cheating, emotional-unavailability, gaslighting-narcissism, mismatched-future-goals, financial-conflict, intimacy-issues, in-laws-struggles, codependency, trust-control-issues, breadcrumbing, rebound-regrets, lost-spark, neglect-priority, orbiting, future-faking, benching-cushioning.
Ensure that:
1. The lists are highly relatable and cover a broad range of contemporary relationship problems.
2. For each problem, provide a highly specific description.
3. For each problem, expand the 'keywords' array with 10-15 highly realistic phrases, complaints, and exact search queries that people type into search engines or relationship support forums (e.g. 'stopped replying to me', 'likes me as a friend', 'stuck in limbo', 'shady phone secrets', 'ex watches my stories').`;

      const candidateModels = ["gemini-3.5-flash", "gemini-2.5-flash"];
      let response = null;
      let lastError = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`Attempting keyword generation using model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "name", "description", "keywords"]
                }
              }
            }
          });
          if (response && response.text) {
            console.log(`Successfully completed keyword generation with: ${modelName}`);
            break; // Success!
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed or unavailable:`, err?.message || err);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        console.warn("All candidate Gemini models were unavailable or failed. Falling back to preseeded relationship problems.", lastError);
        return res.json({ success: true, list: PRESEEDED_RELATIONSHIP_PROBLEMS, isFallback: true });
      }

      const parsedProblems = JSON.parse(response.text || "[]");
      return res.json({ success: true, list: parsedProblems });
    } catch (error: any) {
      console.error("Gemini sync error: Falling back to preseeded relationship problems.", error);
      return res.json({ success: true, list: PRESEEDED_RELATIONSHIP_PROBLEMS, isFallback: true });
    }
  });

  // Dynamic Google Search Console compatible Sitemap Generator
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const origin = `${req.protocol}://${req.get("host") || "beforeregret.org"}`;
      
      // Core static page views
      const staticUrls = [
        { path: "", changefreq: "daily", priority: "1.0" },
        { path: "explore", changefreq: "weekly", priority: "0.8" },
        { path: "regrets", changefreq: "daily", priority: "0.8" },
        { path: "court", changefreq: "daily", priority: "0.9" },
        { path: "boards", changefreq: "daily", priority: "0.9" },
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

      // 6. Dynamic Court Cases (Active citizens jury trial posts) from Firestore
      try {
        const courtCasesObj = await fetchAllDocumentsInCollection("courtCases");
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
        console.error("Sitemap dynamic courtCases fetch error:", err);
      }

      // 7. Dynamic Advice Questions (Community Q&A advice boards) from Firestore
      try {
        const questionsObj = await fetchAllDocumentsInCollection("questions");
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
        console.error("Sitemap dynamic questions fetch error:", err);
      }

      // Construct legal XML package
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags.join("\n")}
</urlset>`;

      res.header("Content-Type", "application/xml");
      res.status(200).send(sitemapXml);
    } catch (error) {
      console.error("Error generating sitemap.xml:", error);
      res.status(500).send("Error generating sitemap.xml");
    }
  });

  // Extremely robust check to determine if the server is running in production mode
  const isProd = 
    process.env.NODE_ENV === "production" || 
    !fs.existsSync(path.join(process.cwd(), "server.ts")) ||
    (typeof __filename !== "undefined" && (__filename.includes("dist") || __filename.endsWith(".cjs"))) ||
    (fs.existsSync(path.join(process.cwd(), "dist")) && process.env.VITE_DEV !== "true");

  if (!isProd) {
    console.log("Starting server in development mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    
    // Serve static files to prevent infinite loops
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return next();
      }
      try {
        const indexPagePath = path.join(process.cwd(), "index.html");
        if (!fs.existsSync(indexPagePath)) {
          return next();
        }
        const rawHtml = fs.readFileSync(indexPagePath, "utf-8");
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        const { title, description } = await getPageMetadata(req.path);
        const origin = `${req.protocol}://${req.get('host') || 'beforeregret.org'}`;
        const canonicalUrl = `${origin}${req.originalUrl}`;
        const hydratedHtml = hydrateHtml(transformedHtml, title, description, canonicalUrl);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(hydratedHtml);
      } catch (err) {
        next(err);
      }
    });
  } else {
    console.log("Starting server in production mode, serving built static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve build assets first
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', async (req, res) => {
      try {
        const distIndexPage = path.join(distPath, 'index.html');
        if (!fs.existsSync(distIndexPage)) {
          return res.sendFile(distIndexPage);
        }
        const rawHtml = fs.readFileSync(distIndexPage, "utf-8");
        const { title, description } = await getPageMetadata(req.path);
        const origin = `${req.protocol}://${req.get('host') || 'beforeregret.org'}`;
        const canonicalUrl = `${origin}${req.originalUrl}`;
        const hydratedHtml = hydrateHtml(rawHtml, title, description, canonicalUrl);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(hydratedHtml);
      } catch (err) {
        console.error("Production HTML hydration error, falling back:", err);
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (isProd=${isProd})`);
  });
}

startServer();
