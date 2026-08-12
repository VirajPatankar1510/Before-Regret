import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { GEMINI_MODEL, isQuotaError } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import { slugify } from './articlesApi.js';
import {
  computeHousingAgeRankings,
  buildRankingTableMarkdown,
  buildCountyComparisonPrompt,
  COUNTY_COMPARISON_SYSTEM_INSTRUCTION,
  COUNTY_COMPARISON_RESPONSE_SCHEMA,
  CountyHousingAgeRow,
} from './countyComparisonGenerator.js';

// Admin-triggered "original data journalism" report generator -- see /admin/seo's "Generate
// comparison report" button. Unlike the FEMA county-event drafter, this isn't triggered by an
// external event, so there's no cron/dedup table -- an admin runs it deliberately, occasionally
// (the whole point is a handful of these a year, not a content treadmill), and reviews the result
// like any other draft. The real ranking numbers are computed here in plain code from county_data,
// never by Gemini -- see countyComparisonGenerator.ts's own comment for why that's stricter than
// this app's usual "cite only real data given to you" rule.

interface CountyDataRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  census_total_units: number | null;
  census_year_built_json: string;
}

export function registerCountyComparisonRoutes(app: Express) {
  app.post('/api/admin/reports/county-comparison', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }

    try {
      const countyRows = await withDb((sql) => sql`
        SELECT slug, county_name, state_abbrev, census_total_units, census_year_built_json
        FROM county_data WHERE data_complete = true
      `);
      const rows = countyRows as unknown as CountyDataRow[];
      if (rows.length < 5) {
        res.status(400).json({ success: false, error: `Only ${rows.length} counties have complete data -- need at least 5 for a meaningful comparison.` });
        return;
      }

      const housingAgeRows: CountyHousingAgeRow[] = rows.map((r) => ({
        slug: r.slug,
        countyName: r.county_name,
        stateAbbrev: r.state_abbrev,
        totalUnits: r.census_total_units || 0,
        yearBuiltBuckets: JSON.parse(r.census_year_built_json || '{}'),
      }));

      const ranked = computeHousingAgeRankings(housingAgeRows);
      const realTable = buildRankingTableMarkdown(ranked, 'pctBefore1950');
      const prompt = buildCountyComparisonPrompt({ rankedByPre1950: ranked, totalCounties: ranked.length });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: COUNTY_COMPARISON_SYSTEM_INSTRUCTION,
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: COUNTY_COMPARISON_RESPONSE_SCHEMA,
        },
      });
      logGeminiUsage('county_comparison_generation', GEMINI_MODEL, response.usageMetadata);

      const raw = response.text?.trim() || '';
      const parsed = JSON.parse(raw);
      const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const opening = typeof parsed.openingMarkdown === 'string' ? parsed.openingMarkdown.trim() : '';
      const closing = typeof parsed.closingAnalysisMarkdown === 'string' ? parsed.closingAnalysisMarkdown.trim() : '';
      const methodology = typeof parsed.methodologyMarkdown === 'string' ? parsed.methodologyMarkdown.trim() : '';
      if (!title || !opening || !closing) {
        res.status(500).json({ success: false, error: 'Gemini returned an incomplete draft. Try again.' });
        return;
      }

      // The real table is spliced in here, in code -- never passed through the model, and never
      // reassembled from anything the model wrote.
      const bodyMarkdown = [
        opening,
        '## The Full Ranking',
        realTable,
        '## What This Data Shows',
        closing,
        '## Methodology',
        methodology,
      ].join('\n\n');

      const articleId = await withDb(async (sql) => {
        const base = slugify(title);
        let slug = base;
        for (let attempt = 1; attempt <= 20; attempt++) {
          const existing = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
          if (existing.length === 0) break;
          slug = `${base}-${attempt + 1}`;
        }
        const insertRows = await sql`
          INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, status, article_type)
          VALUES (
            ${slug}, ${title},
            ${typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : ''},
            ${bodyMarkdown},
            ${typeof parsed.quickAnswer === 'string' ? parsed.quickAnswer.trim() : ''},
            'draft', 'guide'
          )
          RETURNING id, slug
        `;
        return insertRows[0] as { id: number; slug: string };
      });

      res.json({ success: true, articleId: articleId.id, slug: articleId.slug, countiesRanked: ranked.length });
    } catch (err: any) {
      console.error('[county-comparison] generate failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({
          success: false,
          error: `Gemini's daily quota for ${GEMINI_MODEL} is used up. Retrying won't help until it resets.`,
        });
      } else {
        res.status(500).json({ success: false, error: 'Report generation failed. Try again.' });
      }
    }
  });
}
