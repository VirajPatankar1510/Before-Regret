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

      const candidateModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
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
          console.log(`Skipping model ${modelName} during keyword generation.`);
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

      const candidateModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
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
          console.log(`Skipping model ${modelName} during Instagram post generation.`);
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

      const candidateModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
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
          console.log(`Skipping model ${modelName} during Meme generation.`);
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
