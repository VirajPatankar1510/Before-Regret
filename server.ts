import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { PRESEEDED_RELATIONSHIP_PROBLEMS } from "./src/data/relationshipProblems";

dotenv.config();

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
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode, serving built static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (isProd=${isProd})`);
  });
}

startServer();
