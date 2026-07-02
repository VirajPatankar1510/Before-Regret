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

function getSEOHeadingForSituation(slug: string, fallbackName: string): string {
  switch (slug) {
    case 'boyfriend-doesnt-want-marriage':
      return "Will I Regret Staying If My Boyfriend Doesn't Want Marriage?";
    case 'stayed-after-cheating':
      return "Will I Regret Staying After Cheating? Forgiveness Statistics & Outcomes";
    case 'partner-doesnt-want-kids':
      return "Will I Regret Staying With a Partner Who Doesn't Want Kids?";
    case 'moved-for-love':
      return "Should I Move for Love? Relocation Regrets & Survival Rates";
    case 'long-distance-relationship':
      return "Are Long Distance Relationships Worth It? Split Rates & Regret Curves";
    case 'different-religion-marriage':
      return "Do Interfaith Marriages Work? Religion Friction & Outcome Statistics";
    case 'marriage-ultimatum':
      return "Do Marriage Ultimatums Work? Resentment Rates & Divorce Statistics";
    case 'ignored-red-flags':
      return "Will I Regret Ignoring Red Flags? Relationship Warning Outcomes";
    default:
      return `Should I ${fallbackName}? Real Outcomes & Regret Metrics`;
  }
}

function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  if (slug.includes('-')) {
    const parts = slug.split('-');
    const prefix = parts[0];
    const isPreseededStory = /^s\d+$/.test(prefix);
    const isCustomStory = prefix.startsWith('story_');
    const isRedFlag = prefix.startsWith('rf_');
    
    if (isPreseededStory || isCustomStory || isRedFlag) {
      return prefix;
    }
  }
  return slug;
}

// Generate matching page title and description exactly aligned with front-end routing
async function getPageMetadata(urlPath: string) {
  const parts = urlPath.split('/').filter(Boolean);
  
  let title = "BeforeRegret — Relationship Decisions Before Regret";
  let description = "BeforeRegret is the ultimate decision intelligence platform for relationship regrets. Read crowdsourced anonymous story timelines, citizen jury verdicts, and red flag warnings before making life-altering choices.";
  
  if (parts.length === 0) {
    return { 
      title: "BeforeRegret — Relationship Decisions Before Regret | Relationship Court & Regrets", 
      description: "Analyze crowdsourced anonymous timeline stories on marriage, cheating, cohabitation, and family commitments before making major life decisions. Vote on Red Flag warnings, hear jury trials, and write survivor guidelines." 
    };
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
    const seoHeading = getSEOHeadingForSituation(slug, sName);
    title = `${seoHeading} | BeforeRegret`;
    description = preseeded ? preseeded.description : `Access crowdsourced demographics, average regret curves, and 100% anonymous story timelines about "${sName}".`;
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
    if (parts[1]) {
      const dbId = extractIdFromSlug(parts[1]);
      const story = await fetchDocumentFromFirestore("stories", dbId);
      if (story) {
        title = `Regret Story: "${story.title || 'Relationship Outcome'}" | BeforeRegret`;
        description = story.fullStory ? story.fullStory.slice(0, 155) + "..." : `Read the 100% anonymous regret story and outcomes timeline for this relationship decision.`;
      } else {
        title = `Regret Story Outcomes | BeforeRegret`;
        description = `Read real stories, average regrets, and veteran survivors reports of relationship regrets.`;
      }
    } else {
      title = "BeforeRegret Relationship Story Ledger & Regrets";
      description = "Read full timeline stories, interactive outcome statistics, and veteran survivors reports of relationship regrets.";
    }
  }
  else if (first === 'flags' || first === 'redflags' || first === 'red-flags' || first === 'red-flag-meter') {
    if (parts[1]) {
      const dbId = extractIdFromSlug(parts[1]);
      const redFlag = await fetchDocumentFromFirestore("redFlagCases", dbId);
      if (redFlag) {
        title = `Red Flag Dilemma: "${redFlag.title || 'Relationship Danger Meter'}" | BeforeRegret`;
        description = redFlag.description ? redFlag.description.slice(0, 155) + "..." : `Cast your citizen vote on this red flag dilemma and review comments.`;
      } else {
        title = `Red Flag Dilemma | BeforeRegret`;
        description = `Review and audit relationship red/yellow/green flag cases submitted anonymously.`;
      }
    } else {
      title = "Scientific Red Flags Meter: Dating & Relationship Warning Signs | BeforeRegret";
      description = "Audit and vote on red, yellow, and green flag relationship warnings submitted anonymously by real partners.";
    }
  }
  else if (first === 'should-i-leave') {
    title = "Should I Leave My Partner? Decision Calculator & Outcomes Hub | BeforeRegret";
    description = "Uncover relationship outcome data, crowd-voted verdicts, and peer experiences to help answer: Should I leave or should I stay? Read real timelines from people who faced the exact same decision.";
  }
  else if (first === 'will-i-regret') {
    title = "Will I Regret It? Relationship Decision Regret Curves & Analysis | BeforeRegret";
    description = "Analyze the statistical curve of relationship regret. Find out if staying with a partner who does not want kids, staying after cheating, or giving ultimatums leads to long-term regret.";
  }
  else if (first === 'red-flags') {
    title = "Scientific Red Flags Meter: Dating & Relationship Warning Signs | BeforeRegret";
    description = "Review the crowd-voted community Red Flags warning lights, active warning board cases, and survivor logs detailing behavior warnings you shouldn't ignore.";
  }
  else if (first === 'relationship-regrets') {
    title = "Relationship Regrets Registry: 100% Anonymous Timelines & Lessons | BeforeRegret";
    description = "Read authentic, chronological timelines detailing years of relationship decisions and their long-term consequences. Explore the physical, emotional and financial realities of staying or leaving.";
  }
  else if (first === 'commitment-issues') {
    title = "Commitment Issues & Ultimatums: Marriage, Kids & Cohabitation | BeforeRegret";
    description = "Real data and community advisory dossiers on deep-seated relationship bottlenecks. Compare marriage ultimatums, interfaith friction, and different partner life visions.";
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
  else if (first === 'guides' || first === 'decision-guides' || first === 'editorial' || first === 'articles') {
    if (parts[1]) {
      const displayArt = parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      title = `Relationship Science Guide: ${displayArt} | BeforeRegret`;
      description = `Read our deep, accredited editorial guide on "${displayArt}". Composed by certified family therapists, psychologists, and relationship science experts.`;
    } else {
      title = "Accredited Relationship Decision Guides & Science | BeforeRegret";
      description = "Browse deep long-form editorial guides written by certified psychologists, clinical mediators, and relationship researchers. Learn the math of trust rebuilding, ultimatum psychology, and red flags.";
    }
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

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
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
          console.log(`Model ${modelName} shifted during keyword generation.`);
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

  // API route to generate an Instagram post from a submission
  app.post("/api/admin/generate-instagram-post", async (req, res) => {
    try {
      const { title, content, type, author, communityOpinions } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: "GEMINI_API_KEY is not configured in environment variables." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a viral social media strategist for @BeforeRegret, a trending American relationship platform.
We are creating a high-impact, viral Instagram 4:5 Post text slide based on a real, raw relationship situation and its associated real community opinions/comments.

Here is the user's raw submission and associated real community opinions/verdicts:
---
Type: ${type || 'Story'}
Title: ${title || 'Relationship dilemma'}
Content: ${content || 'No content provided.'}
Author: ${author || 'Anonymous'}
Community Opinions/Verdicts: ${communityOpinions || 'None yet'}
---

Your task is to transform this submission into a highly relatable, viral, trending 4:5 text slide and caption tailored for a young US audience (ages 18-35).
It must NOT sound like AI. It should feel 100% like a real person sharing a raw, unfiltered relationship truth, confession, realization, or hot-take.

Strict Guidelines:
1. "Hook" (The Post Overlay Text):
   - This will be displayed in the center of the post.
   - It should NOT be a dry title or generic summary.
   - Instead, make it a spicy, high-conflict relationship lesson, an unfiltered confession, a modern dating rule, or a "hot take" inspired by the situation.
   - Use raw emotions and colloquial US phrasing. Examples of highly viral human hooks:
     - "Dating a guy who 'is not ready yet' is basically paying full price for a demo version."
     - "If you have to ask him to marry you after 6 years, you already have your answer."
     - "He bought the house. He handles the bills. But you're paying with your freedom."
     - "Unpopular opinion: If they want to talk to their ex, let them. And then let them go."
     - "We've been living together for 3 years, but he still calls his mom to make his big decisions. It's giving roommate, not husband."
   - Keep it extremely punchy and conversational (15-30 words max). No corporate tone.

2. "CommunitySpotlight" (The Engaged Community Verdict / Peer Suggestion):
   - Formulate a highly engaging highlight representing community reaction.
   - If there are "Community Opinions/Verdicts" provided in the input, extract and refine the spiciest one into a punchy quote.
   - If no community opinions exist, invent a highly realistic, spicy peer opinion/judgement as if a passionate reader commented it.
   - Examples:
     - "Juror: 'If he split the bills 50/50 but split chores 100/0, it's not a partnership, it's a scam.'"
     - "Community Verdict: 84% GUILTY of playing mind games."
     - "Top Comment: 'You are low-key paying his lease while he figures himself out. Run. 🚩'"
   - Keep it short, punchy, and incredibly natural (12-25 words).

3. "Caption":
   - The caption should feel like a close friend venting or dropping hard truth bombs in a chat.
   - Use short, punchy, single-sentence paragraphs with generous line breaks to optimize readability on mobile.
   - Use current US dating lingo organically (e.g., "low-key", "major red flag", "playing house", "living rent-free", "if they wanted to, they would", "dating scene is in shambles", "ghosted", "gaslight", "he's a 10 but...").
   - Absolutely NO corporate buzzwords, self-promotional jargon, or sterile summaries.
   - Mention the situation's core dilemma in a dramatic, empathetic way.
   - Highlight the user verdict/community spotlight: "One user suggested this opinion: [communitySpotlight]. What verdict or opinion would you give?"
   - Always conclude with a highly provocative, interactive question that makes people want to write long comments debating the topic (e.g., "What verdict or opinion would you give? Let me know in the comments 👇").
   - Mention smoothly that they can read the full raw submission, vote on who is wrong, and see what the internet decided at BeforeRegret.com (or "link in bio").
   - Use at most 1 or 2 emojis. Do not over-embellish. Keep the text raw and authentic.

4. "VisualSuggestion":
   - Detail how this 4:5 vertical slide should look visually to grab attention (e.g., "A clean minimalist iOS Notes App style screenshot centered on a warm charcoal gray background", or "A typewriter-style font on a grainy, atmospheric twilight photo of city lights, keeping the aesthetic low-key and mysterious").

5. "Hashtags":
   - Provide 5-8 trending, high-traffic US hashtags for relationship advice, modern dating, and confessions. Avoid generic spam.`;

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
      let response = null;
      let lastError = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`Attempting Instagram post generation using model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hook: { type: Type.STRING },
                  communitySpotlight: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["hook", "communitySpotlight", "caption", "visualSuggestion", "hashtags"]
              }
            }
          });
          if (response && response.text) {
            console.log(`Successfully generated Instagram post with: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.log(`Model ${modelName} shifted during Instagram post generation.`);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        console.warn("All candidate Gemini models failed or were unavailable due to demand spikes/quota limits. Employing programmatic high-relatability human-crafted fallback post generator.");
        
        // Beautiful human fallback generator adhering strictly to target tone and style
        const cleanedTitle = (title || "Unpopular Opinion").trim();
        const cleanedContent = (content || "").trim();
        let hook = "";

        if (cleanedTitle.length > 5 && cleanedTitle.toLowerCase() !== "untitled") {
          const lowerTitle = cleanedTitle.toLowerCase();
          if (lowerTitle.includes("ex") || lowerTitle.includes("breakup") || lowerTitle.includes("past")) {
            hook = `Unpopular opinion: If they're still keeping tabs on their ex, you're not their partner—you're their distraction.`;
          } else if (lowerTitle.includes("toxic") || lowerTitle.includes("red flag") || lowerTitle.includes("shady")) {
            hook = `If you have to play detective to get the full truth, you already have your answer. Choose your peace.`;
          } else if (lowerTitle.includes("marriage") || lowerTitle.includes("proposal") || lowerTitle.includes("future")) {
            hook = `Stop playing spouse for someone who treats commitment like a subscription they can cancel anytime.`;
          } else {
            hook = `“${cleanedTitle}” — sometimes you're not in love with them, you're just attached to the version of them you created in your head.`;
          }
        } else {
          hook = `Unpopular opinion: Stop trying to squeeze a lifetime commitment out of someone who can't even give you a consistent reply.`;
        }

        const communitySpotlight = "One user commented: 'If you have to play detective to get the full truth, you already have your answer.'";
        const caption = `Let's talk about this real quick, because this situation is wild... 😳\n\n"${cleanedContent.substring(0, 180)}${cleanedContent.length > 180 ? "..." : ""}"\n\nOne user gave this verdict: "${communitySpotlight}"\n\nWhat verdict or opinion would you give? Do you agree, or is this a reach?\n\nLow-key, modern dating is in absolute shambles right now. We've completely normalized accepting the absolute bare minimum, and then we wonder why we're feeling low-key exhausted.\n\nAt the end of the day, if they wanted to, they would. It is literally that simple. Stop building futures with people who only offer you temporary attention.\n\nLet me know in the comments 👇\n\n(Read the full raw story and cast your official vote on who is wrong at beforeregret.com or click the 🔗 in bio!)`;
        
        const visualSuggestion = "A clean minimalist iOS Notes App style screenshot centered on a warm charcoal gray background to keep the aesthetic low-key and raw.";
        const hashtags = ["beforeregret", "relationshipadvice", "moderndating", "confessions", "toxicrelationships", "datingadvice", "redflags"];

        return res.json({ 
          success: true, 
          post: { hook, communitySpotlight, caption, visualSuggestion, hashtags },
          isFallback: true
        });
      }

      const postData = JSON.parse(response.text);
      return res.json({ success: true, post: postData });

    } catch (error: any) {
      console.error("Instagram post generation error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate Instagram post." 
      });
    }
  });

  // API route to generate a highly relatable, trending USA 9:16 relationship meme
  app.post("/api/admin/generate-meme-post", async (req, res) => {
    try {
      const { title, content, type, author } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: "GEMINI_API_KEY is not configured in environment variables." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a viral social media comedian and content creator for @BeforeRegret, a highly popular relationship platform.
We are creating an ultra-relatable, humorous 9:16 vertical text layout tailored for Gen Z and Millennials (ages 18-30) on Instagram, TikTok, and Pinterest.
This post must be directly inspired by the following real-life user submission:
---
Type: ${type || 'Story'}
Title: ${title || 'Relationship dilemma'}
Content: ${content || 'No content provided.'}
Author: ${author || 'Anonymous'}
---

Your task is to transform this drama/situation into one of three highly shareable, humorous, and relatable text-based layouts. Choose the template that best fits this specific drama:

1. 'translation' (The Relationship Dictionary / Translation Guide):
   - What people say vs. what they actually mean.
   - Example:
     - Title: "The 'He's Just Busy' Dictionary"
     - Phrase: "I've been so swamped with work" -> Reality: "I had 4 hours to send a text but chose to check my Clash of Clans clan instead."
     - Phrase: "I'm just not on my phone like that" -> Reality: "My screen time is 9 hours and 42 minutes but typing 5 letters to you is a chore."

2. 'starterpack' (The Starter Pack):
   - Exactly 4 funny, highly specific things, quotes, or behaviors that define this relationship archetype or behavior.
   - Example:
     - Title: "The 'We Are Not Labeling It' Starter Pack"
     - Items: 
       - "Checking their active status while they've been 'sleeping' for 3 hours"
       - "The sentence: 'I don't want to ruin what we have right now'"
       - "Crying to a Drake song at 2:00 AM on a Tuesday"
       - "Going on full dinner dates but splitting the bill 50/50"

3. 'math' (Dating/Relationship Math):
   - Funny, absurd but real illogical behaviors in modern dating.
   - Example:
     - Title: "Situationship Math"
     - Item: "Leaving me on read for 12 hours is 'busy', but posting a 4K resolution sunset on their story 10 minutes later is 'unplugging'."
     - Item: "Not being ready for a relationship but being ready to text me 'good morning' every day for 8 months straight."

Strict Guidelines:
- It MUST be funny, slightly sarcastic, highly relatable, and completely free of AI-sounding corporate clichés.
- Never use the word "Meme", "Meme Court", or "USA Trending" in any output fields (especially the title).
- Use extremely simple, clear, easy, and natural title language (e.g. "The 'Share Location' Starter Pack" or "Relationship Red Flag Dictionary"). Simple titles perform much better. DO NOT use all-caps for titles. Use standard title-casing.
- Use current colloquial dating terms (e.g., "situationship", "low-key", "clown behavior", "talking stage", "it's giving", "living rent-free", "valid", "gaslight", "he's a 10 but...").
- Keep items punchy, funny, and direct.

Please output your response as JSON matching this schema:
- memeType: "translation" | "starterpack" | "math"
- title: A simple, natural, clear title using title-casing.
- items: An array containing the content:
  - If memeType is "translation", this must be an array of objects: { "phrase": string, "reality": string } (provide 2-3 pairs).
  - If memeType is "starterpack", this must be an array of strings (exactly 4 funny items).
  - If memeType is "math", this must be an array of objects: { "condition": string, "conclusion": string } (provide 2-3 pairs).
- caption: A hilarious Instagram caption that vents about this behavior, asks a provocative question to spark debate/tags in the comments, and smoothly mentions that the full raw submission is at BeforeRegret.com.
- hashtags: An array of 5-8 trending relationship hashtags (e.g., #beforeregret #relationshipadvice #clownbehavior #relatable).`;

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
      let response = null;
      let lastError = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`Attempting Meme post generation using model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  memeType: { type: Type.STRING, enum: ["translation", "starterpack", "math"] },
                  title: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        phrase: { type: Type.STRING },
                        reality: { type: Type.STRING },
                        condition: { type: Type.STRING },
                        conclusion: { type: Type.STRING }
                      }
                    }
                  },
                  caption: { type: Type.STRING },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["memeType", "title", "items", "caption", "hashtags"]
              }
            }
          });
          if (response && response.text) {
            console.log(`Successfully generated Meme post with: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.log(`Model ${modelName} shifted during Meme generation.`);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        console.warn("All candidate Gemini models failed or were unavailable due to demand spikes/quota limits. Employing programmatic high-relatability fallback meme generator.");
        
        // Beautiful human fallback generator for Memes
        const cleanedTitle = (title || "Unpopular Opinion").trim();
        const lowerTitle = cleanedTitle.toLowerCase();
        
        let memeType = "starterpack";
        let memeTitle = "Modern Dating Starter Pack";
        let items: any[] = [];
        
        if (lowerTitle.includes("ex") || lowerTitle.includes("breakup") || lowerTitle.includes("past")) {
          memeType = "translation";
          memeTitle = "Still Friends With My Ex Dictionary";
          items = [
            { phrase: '"We\'re just friends, it\'s not like that"', reality: '"I still want their validation because I haven\'t fully healed yet."' },
            { phrase: '"They just reached out to ask how I was doing"', reality: '"We both know they\'re checking if they still have access to me."' }
          ];
        } else if (lowerTitle.includes("toxic") || lowerTitle.includes("red flag") || lowerTitle.includes("shady") || lowerTitle.includes("phone")) {
          memeType = "math";
          memeTitle = "Relationship Red Flag Dictionary";
          items = [
            { condition: "Putting their phone face down every single time they leave the room", conclusion: "But calling you 'insecure' for asking why their phone is on 1% brightness." },
            { condition: "Being too tired to go out on a Friday date", conclusion: "But somehow finding the energy to reply to group chat messages for 4 hours." }
          ];
        } else {
          memeType = "starterpack";
          memeTitle = "The 'Situationship Limbo' Starter Pack";
          items = [
            "A 'good morning' text at 2:30 PM",
            "The phrase: 'I'm just really focusing on myself right now'",
            "Splitting a $14 dinner bill to the exact cent",
            "Being too scared to ask 'what are we' because you know the answer will hurt"
          ];
        }

        const caption = `Honestly, we need to talk about this because situationship culture has got to be studied in a lab... 💀💀\n\nIs this actually facts or is it literally just what we do now? Modern dating is a full-time sport.\n\nRead the full raw story that inspired this post and cast your vote on BeforeRegret.com (🔗 in bio to judge)!`;
        const hashtags = ["beforeregret", "datingguide", "relationshiphumor", "situationships", "datingmath", "starterpack"];

        return res.json({ 
          success: true, 
          post: { memeType, title: memeTitle, items, caption, hashtags },
          isFallback: true
        });
      }

      const memeData = JSON.parse(response.text);
      // Ensure starterpack items are just clean strings if parsed differently
      if (memeData.memeType === 'starterpack' && memeData.items && typeof memeData.items[0] === 'object') {
        memeData.items = memeData.items.map((i: any) => i.phrase || i.condition || JSON.stringify(i));
      }
      return res.json({ success: true, post: memeData });

    } catch (error: any) {
      console.error("Meme post generation error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate Meme post." 
      });
    }
  });

  // API route to perform ahrefs-style Keyword Research & generate high-performing human pSEO relationship submissions
  app.post("/api/admin/generate-seo-submission", async (req, res) => {
    try {
      const { type, topic, existingTitles } = req.body;
      const requestedType = type || "court_case"; // default
      const apiKey = process.env.GEMINI_API_KEY;

      console.log(`Starting SEO dynamic generation. Type: ${requestedType}, Topic: ${topic || "Any trending"}. Existing titles count: ${Array.isArray(existingTitles) ? existingTitles.length : 0}`);

      // Setup Gemini parameters and schemas
      const seoAnalysisProperties = {
        targetKeyword: { type: Type.STRING },
        searchVolume: { type: Type.STRING },
        keywordDifficulty: { type: Type.STRING },
        searchIntent: { type: Type.STRING },
        googleSearchPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
        trendingRedditTopic: { type: Type.STRING }
      };

      const seoAnalysisRequired = ["targetKeyword", "searchVolume", "keywordDifficulty", "searchIntent", "googleSearchPhrases", "trendingRedditTopic"];

      let selectedSchema: any = null;
      let promptInstructions = "";

      if (requestedType === "court_case") {
        selectedSchema = {
          type: Type.OBJECT,
          properties: {
            seoAnalysis: {
              type: Type.OBJECT,
              properties: seoAnalysisProperties,
              required: seoAnalysisRequired
            },
            generatedData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                author: { type: Type.STRING },
                votes: {
                  type: Type.OBJECT,
                  properties: {
                    me: { type: Type.INTEGER },
                    partner: { type: Type.INTEGER },
                    both: { type: Type.INTEGER },
                    neither: { type: Type.INTEGER }
                  },
                  required: ["me", "partner", "both", "neither"]
                },
                arguments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      author: { type: Type.STRING },
                      side: { type: Type.STRING }, // "Me" | "Partner" | "Both" | "Neither"
                      text: { type: Type.STRING },
                      role: { type: Type.STRING }, // "Truth Teller", "Relationship Veteran", "Mentor", "Novice", "Top Mentor", "Poster", "Partner"
                      votes: { type: Type.INTEGER }
                    },
                    required: ["author", "side", "text", "role", "votes"]
                  }
                },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "author", "votes", "arguments", "tags"]
            }
          },
          required: ["seoAnalysis", "generatedData"]
        };

        promptInstructions = `Perform simulated SEO Keyword Search for low-competition, high-volume relationship search terms.
Then, generate a Relationship Court Case based on that keyword.
The case description must be a raw, deeply human allegation outlining a me vs partner dilemma.

CRITICAL ARGUMENT DESIGN IN 'arguments':
You MUST generate exactly 6 to 8 items in the 'arguments' array, which MUST consist of two distinct sections:

Section 1: Active Submitter/Partner Conversational Debate (at least 3-4 back-and-forth items)
- This represents an ongoing conversational dialogue thread between 'ME' (the submitter) and 'Partner' to give the public a complete view of both sides of the story.
- Generate a detailed defense/allegation from the partner (role: "Partner", author: "Partner", side: "Partner") where they respond to the description and present their side.
- Generate a reply from the submitter (role: "Poster", author: "ME", side: "Me") offering additional points or reacting to the partner's defense.
- Generate a counter-reply from the partner (role: "Partner", author: "Partner", side: "Partner") or another exchange to make it a series of conversational allegations.

Section 2: Independent Citizen Jurors Deliberations (exactly 3-4 items)
- Generate independent citizen juror comments with roles like 'Relationship Veteran', 'Top Mentor', 'Truth Teller', 'Novice', or 'Mentor'.
- Jurors MUST be completely logically consistent in their stance:
  - If a juror's side is 'Me', they MUST support the submitter and clearly blame the partner. They must NOT blame 'Me' or make statements against the submitter.
  - If a juror's side is 'Partner', they MUST support the partner and clearly blame the submitter. They must NOT blame the partner or make statements against the partner.
  - If a juror's side is 'Both', they must clearly and logically explain how both individuals are at fault.
  - If a juror's side is 'Neither', they must offer neutral advice or support both of them.
- CRITICAL: Juror text fields MUST NOT contain any labels, prefixes, or headers like "Devil's Advocate:", "Unpopular opinion:", "Alternative view:", "My two cents:", etc. The comment must begin directly with their natural human commentary.

The tone of all arguments must be extremely organic, conversational, slightly messy, and full of raw human emotions (e.g. using colloquial phrases like 'low-key', 'he's giving roommate', 'major red flag'). Check the logical flow carefully so that comments are realistic and directly address the specific details of the case description and conversational thread.`;

      } else if (requestedType === "question") {
        selectedSchema = {
          type: Type.OBJECT,
          properties: {
            seoAnalysis: {
              type: Type.OBJECT,
              properties: seoAnalysisProperties,
              required: seoAnalysisRequired
            },
            generatedData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING }, // e.g., "Careers & Moving", "Cheating", "Marriage", "Long Distance"
                answers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      author: { type: Type.STRING },
                      text: { type: Type.STRING },
                      votes: { type: Type.INTEGER },
                      isOutcomeVerified: { type: Type.BOOLEAN },
                      date: { type: Type.STRING }
                    },
                    required: ["author", "text", "votes", "isOutcomeVerified", "date"]
                  }
                },
                pollOptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      votes: { type: Type.INTEGER }
                    },
                    required: ["text", "votes"]
                  }
                },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "category", "answers", "pollOptions", "tags"]
            }
          },
          required: ["seoAnalysis", "generatedData"]
        };

        promptInstructions = `Perform simulated SEO Keyword Search for relationship advice questions typed into search engines.
Then, create a Survivor Q&A Question.
The title must be a clear, highly searchable question (e.g., 'Do relationship ultimatums ever work?').
The description must be a detailed story explaining the crisis.
The answers array should represent 3-4 seasoned survivors or older veterans sharing actual long-term wisdom, statistics, or outcome results (e.g. 'I gave an ultimatum 5 years ago, here is what actually happened...').
Provide 3 realistic pollOptions (e.g. 'Stay and wait', 'Give strict timeline', 'Leave immediately') with votes.`;

      } else if (requestedType === "story") {
        selectedSchema = {
          type: Type.OBJECT,
          properties: {
            seoAnalysis: {
              type: Type.OBJECT,
              properties: seoAnalysisProperties,
              required: seoAnalysisRequired
            },
            generatedData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                situationSlug: { type: Type.STRING }, // choose one of our core slugs: "boyfriend-doesnt-want-marriage", "stayed-after-cheating", "partner-doesnt-want-kids", "moved-for-love", "long-distance-relationship", "different-religion-marriage", "marriage-ultimatum", "ignored-red-flags"
                situationName: { type: Type.STRING }, // matching situation
                age: { type: Type.INTEGER },
                gender: { type: Type.STRING },
                country: { type: Type.STRING },
                relationshipDuration: { type: Type.STRING },
                decisionMade: { type: Type.STRING }, // 'Stayed' | 'Left' | 'Married' | 'Moved Together' | 'Other'
                currentOutcome: { type: Type.STRING }, // 'Still Together' | 'Married' | 'Engaged' | 'Separated' | 'Divorced' | 'Complicated'
                regretScore: { type: Type.INTEGER }, // 1 to 10
                wouldDoAgain: { type: Type.STRING }, // 'Yes' | 'No' | 'Not Sure'
                fullStory: { type: Type.STRING },
                timeline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      year: { type: Type.STRING },
                      stage: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["year", "stage", "description"]
                  }
                },
                userName: { type: Type.STRING },
                helpfulVotes: { type: Type.INTEGER },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                updates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      daysAfter: { type: Type.INTEGER },
                      text: { type: Type.STRING }
                    },
                    required: ["daysAfter", "text"]
                  }
                }
              },
              required: [
                "title", "situationSlug", "situationName", "age", "gender", "country", 
                "relationshipDuration", "decisionMade", "currentOutcome", "regretScore", 
                "wouldDoAgain", "fullStory", "timeline", "userName", "helpfulVotes", "tags", "updates"
              ]
            }
          },
          required: ["seoAnalysis", "generatedData"]
        };

        promptInstructions = `Perform simulated SEO Keyword Search for long-term relationship regrets.
Then, generate a chronological Regret Story and timelines.
Choose the closest preseeded situation slug and name matching the topic:
- "boyfriend-doesnt-want-marriage" (He won't marry me)
- "stayed-after-cheating" (Staying after infidelity)
- "partner-doesnt-want-kids" (Mismatched baby timelines)
- "moved-for-love" (Relocating for a partner)
- "long-distance-relationship" (LDR trials)
- "different-religion-marriage" (Interfaith marriages)
- "marriage-ultimatum" (Ultimatums)
- "ignored-red-flags" (Regretting ignored warnings)
The fullStory should be a raw, multi-paragraph chronological retrospective.
Generate 3-5 timeline nodes representing years/stages.
Generate 1-2 future outcome updates (e.g. daysAfter: 365, text: 'One year later, we are...') highlighting actual results.`;

      } else { // red_flag_case
        selectedSchema = {
          type: Type.OBJECT,
          properties: {
            seoAnalysis: {
              type: Type.OBJECT,
              properties: seoAnalysisProperties,
              required: seoAnalysisRequired
            },
            generatedData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING }, // 'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other'
                votes: {
                  type: Type.OBJECT,
                  properties: {
                    green: { type: Type.INTEGER },
                    yellow: { type: Type.INTEGER },
                    red: { type: Type.INTEGER }
                  },
                  required: ["green", "yellow", "red"]
                },
                comments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      author: { type: Type.STRING },
                      text: { type: Type.STRING },
                      date: { type: Type.STRING }
                    },
                    required: ["author", "text", "date"]
                  }
                },
                author: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "category", "votes", "comments", "author", "tags"]
            }
          },
          required: ["seoAnalysis", "generatedData"]
        };

        promptInstructions = `Perform simulated SEO Keyword Search for relationship behavior warning signs and red flags.
Then, create a Red Flag Warning Case.
The description should represent a highly specific, suspicious, or borderline behavior (e.g. sharing locations but always turning it off during certain hours, or deleting chats with a 'friend' from work).
Provide initial crowd-sourced warning light votes (green, yellow, red counts reflecting a complex split).
Generate 2-3 realistic comments arguing whether it is a toxic control red flag, a normal boundary, or a cautious yellow flag.`;
      }

      const existingTitlesList = Array.isArray(existingTitles) && existingTitles.length > 0
        ? existingTitles.map((t, idx) => `  ${idx + 1}. "${t}"`).join("\n")
        : "None specified.";

      const mainPrompt = `You are an elite Search Engine Optimization (SEO) director and human-experience copywriter for BeforeRegret.com.
We need to generate a new submission of type: "${requestedType}".
The administrator selected topic/focus: "${topic || "Any trending high-demand relationship conflict"}"

CRITICAL - UNIQUE CONTENT & NEW NICHES MANDATE:
To maintain high organic search value and keep the website fresh, the generated submission MUST NOT repeat or closely resemble existing stories, cases, or questions.
Here is a list of existing titles/concepts currently live on our website:
${existingTitlesList}

Your absolute priority is to discover and target a NEW relationship sub-niche, unexplored topic, or fresh behavioral angle that is NOT represented in the list above. Think logically and creatively to identify untapped keyword opportunities typed into search engines by people facing modern dating and relationship crises.

Examples of fresh niches to explore:
- Digital boundaries (e.g. social media presence, location sharing expectations, deleting chats with certain 'friends', phone privacy rules, being secretly left out of social media posts).
- Modern financial dynamics (e.g. wage disparities, joint expenses vs personal splurges, secretly hiding debt, splitting bills unequally, partner refusing to work/financial dependence).
- Cohabitation & pace mismatches (e.g. living together for years without commitment/marriage talk, moving in too early, different cleanliness standards, chore imbalances, feeling like roommates).
- Career vs love priorities (e.g. partner accepting a job across the country, one partner working late constantly, career jealousy, asymmetric sacrifice).
- In-law & family interference (e.g. partner prioritizing their parents over their spouse, overbearing parents, boundary-crossing family members, family planning pressures).
- Friend group boundaries & hobbies (e.g. partner spending every weekend with friends, inappropriate emotional intimacy with a close friend of the opposite gender, obsessive hobbies ignoring the relationship).
- Emotional labor & attention gaps (e.g. partner stopped trying after marriage, weaponized incompetence, different parenting styles, mismatch in quality time expectations).

CRITICAL DIRECTIVE - COPYRIGHT & ORIGINALITY SAFEGUARD:
- DO NOT copy, plagiarize, or closely paraphrase any real internet posts, advice columns, or articles.
- Every scenario, character name, dialogue, timeline step, and specific event MUST be completely original, fictional, and synthesized from scratch.
- Ensure that the details are deeply specific but fully original to avoid copyright or infringement strikes.

CRITICAL DIRECTIVE - AI DETECTION BYPASS (NATURAL HUMAN WRITING):
- Write exactly like a raw, emotional, real human in a state of distress, confusion, or reflection.
- Use conversational, slightly messy phrasing, varying sentence lengths, realistic run-on sentences, and authentic emotional pacing.
- Feel free to occasionally use minor human spelling/punctuation traits (such as lowercase 'i' or using ellipses '...' or casual colloquialisms like 'low-key', 'giving roommate', 'major red flag', 'absolutely done', 'checking out').
- STICK TO CONCRETE logistics and direct feelings.
- ABSOLUTELY AVOID standard AI clichés, sterile structural summaries, or transitions such as: "delve", "testament", "tapestry", "moreover", "furthermore", "in conclusion", "to sum up", "it is important to remember", "a roller coaster of emotions", "only time will tell", "buckle up", "at the end of the day", "look no further".

CRITICAL DIRECTIVE - ZERO BRAND NAMES / NO TRADEMARKS:
- DO NOT include or mention ANY real brand names, trademarked platforms, websites, apps, or services anywhere in the content, titles, keywords, or meta fields.
- Instead of using brand names, use high-quality, professional, generic descriptions:
  - Instead of "Google" or "Ahrefs": Use "search engine", "organic search console", "search volume analytics", or "search queries".
  - Instead of "Reddit" or "Reddit-style": Use "popular relationship forum", "anonymous online support community", "anonymous counseling thread", or "discussion board".
  - Instead of "Instagram" or "TikTok": Use "photo-sharing feed", "short-form video app", or "popular social media feed".
  - Instead of "Snapchat" or "Snapscore": Use "messaging application" or "social app activity level".
  - Instead of "Find My" or "Google Maps": Use "live location tracking app" or "phone map sharing settings".
  - Instead of "Slack", "Discord", or "Teams": Use "office work chat", "online gaming chatroom", or "workplace chat app".

Follow this two-step process:
STEP 1 (Simulated SEO Keyword Research):
Identify a low-to-moderate competition target keyword (SEO Difficulty: 10-35 out of 100) that has high organic search volume and strong decisional search intent.
The keyword must represent a painful, contemporary relationship dilemma, mistake, or query typed directly into search engines (e.g. 'living together 4 years no ring', 'cheated but stayed for kids remorse', 'boyfriend won\\'t post me on social media').
Formulate estimated monthly search volumes, SEO difficulties, search intent types, and 3-5 hyper-specific search phrases / complaints.

STEP 2 (Organic human-centric writing):
Now, draft the relationship content itself following all of the copyright, AI-bypass, and brand-ban guidelines above.
Do NOT use sterile summaries, structural introductions, or AI-like clichés.
Include specific details, messy feelings, complex logistics, and authentic dialogues to keep users engaged.

Ensure compliance with this dynamic prompt:
${promptInstructions}

Deliver the output strictly in JSON matching the specified schema.`;

      let generatedResponse = null;

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
        let lastError = null;

        for (const modelName of candidateModels) {
          try {
            console.log(`Attempting SEO pSEO generation using model: ${modelName}`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: mainPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: selectedSchema
              }
            });

            if (response && response.text) {
              console.log(`Successfully generated SEO content using model: ${modelName}`);
              generatedResponse = JSON.parse(response.text);
              break;
            }
          } catch (err: any) {
            console.log(`Model ${modelName} shifted during SEO generation.`);
            lastError = err;
          }
        }
      }

      if (!generatedResponse) {
        console.warn("API key unavailable or models failed. Running programmatic fallback with high human fidelity.");

        // Fallback generator to ensure zero downtime
        const randomID = Math.floor(Math.random() * 900000 + 100000).toString();
        const customTitle = topic ? `Is "${topic}" a relationship mistake?` : "Is living together for 4 years with no ring a waste of time?";
        const dateStr = new Date().toISOString();

        if (requestedType === "court_case") {
          generatedResponse = {
            seoAnalysis: {
              targetKeyword: topic || "living together 4 years no proposal",
              searchVolume: "8,200/mo",
              keywordDifficulty: "18 - Easy",
              searchIntent: "Commercial/Decisional",
              googleSearchPhrases: [
                "boyfriend won't propose after 4 years living together",
                "is playing house a trap for marriage",
                "waiting for proposal while paying half the rent"
              ],
              trendingRedditTopic: "Highly trending sub-threads on popular anonymous discussion boards regarding cohabitation duration deadlocks."
            },
            generatedData: {
              title: customTitle,
              description: "We've been living together in a high-rise in Chicago for 4 years. We split the rent 50/50, we split the dog costs 50/50, and we literally operate like a married couple. But every time I bring up marriage, he says he's 'not financially stable enough' or that 'marriage is just a piece of paper.' I'm 29 now and feel like I'm wasting my best years playing wife for a boyfriend discount. He bought a new gaming setup last week without asking but says a ring is too expensive. Am I crazy for wanting to pack my bags?",
              author: "discount_spouse_29",
              votes: { me: 142, partner: 18, both: 44, neither: 5 },
              arguments: [
                { author: "vet_counselor_88", side: "Me", text: "You are not crazy at all. Living together for 4 years with 50/50 splits gives him all the benefits of a wife with zero of the legal or emotional commitment. He's comfortable. Pack your bags, he knows what he's doing.", role: "Relationship Veteran", votes: 89 },
                { author: "chicago_guy_90", side: "Partner", text: "As a guy, maybe he's genuinely terrified of the financial burden. Chicago is expensive. If you force him into a proposal with an ultimatum, he will just resent you for the rest of his life. Give him some grace.", role: "Novice", votes: 12 },
                { author: "balanced_opinion", side: "Both", text: "You are both contributing to this deadlock. He is being selfish with his finances and future-faking, but you also accepted a 50/50 roommate dynamic for 4 years without drawing a clear line. You need a sit-down timeline conversation.", role: "Top Mentor", votes: 41 },
                { author: "truth_seeker", side: "Neither", text: "Neither of you actually want the same life. It's not about the ring, it's about mismatched visions. Stop arguing who is right and just recognize you are incompatible.", role: "Truth Teller", votes: 55 }
              ],
              tags: ["marriage", "cohabitation", "commitment-deadlock", "finances"]
            }
          };
        } else if (requestedType === "question") {
          generatedResponse = {
            seoAnalysis: {
              targetKeyword: topic || "relationship ultimatum divorce statistics",
              searchVolume: "4,500/mo",
              keywordDifficulty: "22 - Moderate-Easy",
              searchIntent: "Informational",
              googleSearchPhrases: [
                "do ultimatums ever result in happy marriages",
                "resentment after marriage ultimatum",
                "giving bf ultimatum to propose timeline"
              ],
              trendingRedditTopic: "Spike in anonymous marriage advice discussions about proposal deadlines."
            },
            generatedData: {
              title: "Do marriage ultimatums ever lead to a happy ending, or is it always resentment?",
              description: "My partner of 5 years (M31) keeps pushing our timeline back. First it was after he got his promotion, then it was after we traveled, and now it's 'next year.' I (F29) finally told him that if we aren't engaged by December, I'm moving out. He looked shocked and said I'm 'forcing' him and that it ruins the romance. I don't want to bully him into marrying me, but I also can't wait forever. Does an ultimatum ever actually work, or am I just signing up for a bitter divorce later?",
              category: "Marriage",
              answers: [
                { author: "happily_ultimatumed", text: "I gave my husband a 6-month timeline after 4 years. He proposed, we've been married for 12 years with 2 kids and we are very happy. He later admitted he just needed a push because he was lazy and comfortable. It can work, but ONLY if they actually want a future with you and are just procrastinating.", votes: 112, isOutcomeVerified: true, date: "1 day ago" },
                { author: "resentful_ex_wife", text: "Do not do it. I pressured my ex-husband into marrying me with an ultimatum. He said yes, but throughout our 4 years of marriage, he constantly blamed me for 'trapping' him and would bring it up in every fight. We divorced last year. If they wanted to, they would. Save your dignity.", votes: 85, isOutcomeVerified: false, date: "18 hours ago" }
              ],
              pollOptions: [
                { text: "Ultimatums breed toxic resentment", votes: 245 },
                { text: "Sometimes people just need a clear timeline", votes: 184 },
                { text: "Just leave, don't even bother with a deadline", votes: 98 }
              ],
              tags: ["marriage", "ultimatum", "proposal-timeline", "resentment"]
            }
          };
        } else if (requestedType === "story") {
          generatedResponse = {
            seoAnalysis: {
              targetKeyword: topic || "stayed after cheating remorse statistics",
              searchVolume: "12,400/mo",
              keywordDifficulty: "32 - Moderate",
              searchIntent: "Decisional",
              googleSearchPhrases: [
                "can you ever trust a cheater again",
                "stayed with cheating husband 5 years later regret",
                "rebuilding trust after emotional affair coworker"
              ],
              trendingRedditTopic: "Very high volume on anonymous infidelity-support forums concerning trust hypervigilance."
            },
            generatedData: {
              title: "I stayed for 5 years after he cheated with a coworker. Here is my deepest regret.",
              situationSlug: "stayed-after-cheating",
              situationName: "Stayed After Cheating",
              age: 34,
              gender: "Female",
              country: "United States",
              relationshipDuration: "9 years",
              decisionMade: "Stayed",
              currentOutcome: "Complicated",
              regretScore: 8,
              wouldDoAgain: "No",
              fullStory: "When I discovered my husband was having an emotional and physical affair with a junior coworker, my world collapsed. We had a beautiful house and a 2-year-old toddler, so I chose to stay and 'fight' for our family. He did all the right things: cut off contact, changed jobs, went to therapy, and let me monitor his phone. But here is the raw truth that people don't tell you about reconciliation: you never truly recover. Five years later, my phone still triggers a tiny spike of adrenaline when it buzzes in the middle of the night. I've become a hypervigilant warden in my own home. I regret staying because even though we saved the marriage, I lost my peace of mind and my self-esteem. I traded five years of potential happiness for an anxious, broken truce.",
              timeline: [
                { year: "Year 1", stage: "The Discovery & Rage", description: "Found the texts and receipts. Experienced severe panic attacks. He wept, begged, and immediately switched departments to get away from her." },
                { year: "Year 3", stage: "The Quiet warden", description: "Reconciliation appeared 'successful' to outsiders. But I was secretly checking his location 15 times a day and feeling nauseous if he logged off the work chat app." },
                { year: "Year 5", stage: "The Emotional Exhaustion", description: "Realized that while I still love him, I am no longer in love with the person I became to keep him. The trust is permanently flatlined." }
              ],
              userName: "warden_of_chicago",
              helpfulVotes: 231,
              tags: ["cheating", "trust", "reconciliation", "emotional-affair", "stayed"],
              updates: [
                { daysAfter: 365, text: "One year post-discovery: We are in intensive therapy. Some days are peaceful, but the shadow is always there. He is trying his best, which makes it even harder because I am still so angry." }
              ]
            }
          };
        } else { // red_flag_case
          generatedResponse = {
            seoAnalysis: {
              targetKeyword: topic || "sharing location phone rules relationship",
              searchVolume: "6,800/mo",
              keywordDifficulty: "15 - Easy",
              searchIntent: "Informational/Decisional",
              googleSearchPhrases: [
                "is hiding phone location a red flag",
                "boyfriend pauses location on tracking app",
                "he turned off location sharing when going out"
              ],
              trendingRedditTopic: "Substantial active discussions on popular video sharing networks and relationship support forums regarding location tracking boundaries."
            },
            generatedData: {
              title: "He pauses his location-sharing whenever he goes out with his friends",
              description: "My boyfriend (M26) and I (F25) have been sharing locations for over a year for safety. However, I noticed that whenever he goes to a night out or club, his location on the tracking app displays 'Location Paused' or 'No Location Found' for 3-4 hours. When I ask, he claims his phone was dead or he had bad cellular service. But his social activity status keeps going up during those hours. Am I being paranoid or is he intentionally blocking me from seeing where they go?",
              category: "Trust & Privacy",
              votes: { green: 14, yellow: 45, red: 289 },
              comments: [
                { author: "honest_opinion_99", text: "This is a screaming bright crimson red flag. Pausing location is an active setting toggle; it doesn't just happen because of 'bad service' or a dead phone. If their activity shows they are active online, the phone is on and working. He is lying to your face.", date: "1 hour ago" },
                { author: "privacy_first", text: "Honestly, constant location tracking is toxic anyway. Why do you need to watch him like a hawk when he's with his friends? He probably paused it because he is tired of your anxiety.", date: "45 minutes ago" }
              ],
              author: "anxious_gf_detroit",
              tags: ["trust", "location-sharing", "lying", "privacy-boundaries"]
            }
          };
        }
      }

      return res.json({ success: true, seoAnalysis: generatedResponse.seoAnalysis, generatedData: generatedResponse.generatedData });

    } catch (error: any) {
      console.error("SEO Generator route error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate SEO submission." 
      });
    }
  });

  // Dynamic Google Search Console compatible Sitemap Generator

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const origin = `${req.protocol}://${req.get("host") || "beforeregret.com"}`;
      
      // Core static page views
      const staticUrls = [
        { path: "", changefreq: "daily", priority: "1.0" },
        { path: "explore", changefreq: "weekly", priority: "0.8" },
        { path: "regrets", changefreq: "daily", priority: "0.8" },
        { path: "court", changefreq: "daily", priority: "0.9" },
        { path: "boards", changefreq: "daily", priority: "0.9" },
        { path: "guides", changefreq: "weekly", priority: "0.9" },
      ];

      const urlTags: string[] = [];

      // Add individual guide articles
      const articles = [
        "infidelity-reconciliation-math-of-forgiveness",
        "ultimatum-protocol-why-marriage-deadlocks-fail",
        "relocation-risk-index-moving-for-love",
        "red-flag-evaluation-boundary-matrix"
      ];
      for (const art of articles) {
        urlTags.push(`  <url>
    <loc>${origin}/guides/${art}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
      }

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
        const origin = `${req.protocol}://${req.get('host') || 'beforeregret.com'}`;
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
        const origin = `${req.protocol}://${req.get('host') || 'beforeregret.com'}`;
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
