import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { GEMINI_MODEL, isQuotaError } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import { slugify } from './articlesApi.js';
import {
  getDefectRules,
  computeDefectCountyRanking,
  matchGuidesToDefect,
  buildRankingTableMarkdown,
  buildDefectReferencePrompt,
  DEFECT_REFERENCE_SYSTEM_INSTRUCTION,
  DEFECT_REFERENCE_RESPONSE_SCHEMA,
  CountyHousingRow,
} from './defectReferenceGenerator.js';

// Admin-triggered, one-shot batch generator for the "era x defect" reference library -- see
// /admin/seo's "Generate reference library" button. Fixed set of 8 defects (see
// defectReferenceGenerator.ts's DEFECT_RULE_IDS), each drafted independently so one failure
// doesn't block the rest. Meant to be run once to build out the library, and occasionally again
// if a defect rule's real data changes -- not a recurring/scheduled job like the FEMA checker.

interface CountyDataRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  census_total_units: number | null;
  census_year_built_json: string;
}

export function registerDefectReferenceRoutes(app: Express) {
  app.post('/api/admin/reports/defect-reference-library', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }

    const summary = { attempted: 0, created: 0, results: [] as Array<{ ruleId: string; slug?: string; error?: string; skipped?: boolean }> };

    try {
      const countyRows = await withDb((sql) => sql`
        SELECT slug, county_name, state_abbrev, census_total_units, census_year_built_json
        FROM county_data WHERE data_complete = true
      `);
      const rows = countyRows as unknown as CountyDataRow[];
      const housingRows: CountyHousingRow[] = rows.map((r) => ({
        slug: r.slug,
        countyName: r.county_name,
        stateAbbrev: r.state_abbrev,
        totalUnits: r.census_total_units || 0,
        yearBuiltBuckets: JSON.parse(r.census_year_built_json || '{}'),
      }));

      const guideRows = await withDb((sql) => sql`SELECT slug, title FROM articles WHERE status = 'published' ORDER BY published_at DESC`);
      const allGuides = (guideRows as unknown as Array<{ slug: string; title: string }>).map((g) => ({
        title: g.title,
        url: `https://www.beforeregret.com/guides/${g.slug}/`,
      }));

      const rules = getDefectRules();
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      for (const rule of rules) {
        const alreadyExists = await withDb(async (sql) => {
          const rows = await sql`SELECT id FROM articles WHERE defect_rule_id = ${rule.id} LIMIT 1`;
          return rows.length > 0;
        });
        if (alreadyExists) {
          summary.results.push({ ruleId: rule.id, skipped: true });
          continue;
        }

        summary.attempted++;
        try {
          const dataPack = computeDefectCountyRanking(housingRows, rule);
          dataPack.guides = matchGuidesToDefect(rule.id, allGuides);
          const realTable = buildRankingTableMarkdown(dataPack);
          const prompt = buildDefectReferencePrompt(dataPack);

          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              systemInstruction: DEFECT_REFERENCE_SYSTEM_INSTRUCTION,
              temperature: 0.6,
              responseMimeType: 'application/json',
              responseSchema: DEFECT_REFERENCE_RESPONSE_SCHEMA,
            },
          });
          logGeminiUsage('defect_reference_generation', GEMINI_MODEL, response.usageMetadata);

          const raw = response.text?.trim() || '';
          const parsed = JSON.parse(raw);
          const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
          if (!title || !parsed.openingMarkdown || !parsed.closingAnalysisMarkdown) {
            throw new Error('Gemini returned an incomplete draft.');
          }

          const bodyMarkdown = [
            parsed.openingMarkdown.trim(),
            '## Why This Matters for Buyers',
            parsed.buyerRelevanceMarkdown.trim(),
            '## County Ranking',
            realTable,
            '## What This Data Shows',
            parsed.closingAnalysisMarkdown.trim(),
            '## Methodology',
            parsed.methodologyMarkdown.trim(),
          ].join('\n\n');

          const created = await withDb(async (sql) => {
            const base = slugify(title);
            let slug = base;
            for (let attempt = 1; attempt <= 20; attempt++) {
              const existing = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
              if (existing.length === 0) break;
              slug = `${base}-${attempt + 1}`;
            }
            const insertRows = await sql`
              INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, status, article_type, defect_rule_id)
              VALUES (${slug}, ${title}, ${parsed.metaDescription?.trim() || ''}, ${bodyMarkdown}, ${parsed.quickAnswer?.trim() || ''}, 'draft', 'reference', ${rule.id})
              RETURNING slug
            `;
            return (insertRows[0] as { slug: string }).slug;
          });

          summary.created++;
          summary.results.push({ ruleId: rule.id, slug: created });
        } catch (innerErr: any) {
          console.error(`[defect-reference] failed for ${rule.id}:`, innerErr);
          summary.results.push({ ruleId: rule.id, error: innerErr?.message || 'unknown error' });
        }
      }

      res.json({ success: true, summary });
    } catch (err: any) {
      console.error('[defect-reference] batch failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({ success: false, error: `Gemini's daily quota for ${GEMINI_MODEL} is used up.` });
      } else {
        res.status(500).json({ success: false, error: 'Reference library generation failed. See server logs.' });
      }
    }
  });
}
