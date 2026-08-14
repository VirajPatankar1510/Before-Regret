import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { isQuotaError, generateContentWithFallback, contentQuotaExhaustedMessage } from './geminiModel.js';
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

// Admin-triggered "original data journalism" report generator -- see /admin/seo's comparison-
// report card. A singleton, living page (article_type = 'comparison', at most one row ever) rather
// than a one-off: re-running this always updates that same row in place instead of inserting a new
// one, which is what a second click used to do before this file tracked counties_ranked -- two
// near-identical drafts ranking the same counties, just with different AI prose wrapped around an
// identical table. The real ranking numbers are computed here in plain code from county_data, never
// by Gemini -- see countyComparisonGenerator.ts's own comment for why that's stricter than this
// app's usual "cite only real data given to you" rule.

interface CountyDataRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  census_total_units: number | null;
  census_year_built_json: string;
}

interface ExistingComparisonArticle {
  id: number;
  slug: string;
  counties_ranked: number | null;
  status: string;
}

async function findExistingComparisonArticle(): Promise<ExistingComparisonArticle | null> {
  const rows = await withDb((sql) => sql`
    SELECT id, slug, counties_ranked, status FROM articles
    WHERE article_type = 'comparison' ORDER BY created_at DESC LIMIT 1
  `);
  return (rows as unknown as ExistingComparisonArticle[])[0] || null;
}

async function countEligibleCounties(): Promise<number> {
  const rows = await withDb((sql) => sql`SELECT count(*)::int AS n FROM county_data WHERE data_complete = true`);
  return (rows as unknown as Array<{ n: number }>)[0].n;
}

export function registerCountyComparisonRoutes(app: Express) {
  // --- Status: does a report already exist, and has coverage grown since it was last written? ---
  // The admin panel button's label/enabled state is entirely driven by this, so a click can't be
  // wasted re-running Gemini just to learn "nothing's changed."
  app.get('/api/admin/reports/county-comparison/status', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }
    try {
      const [existing, eligibleCounties] = await Promise.all([
        findExistingComparisonArticle(),
        countEligibleCounties(),
      ]);
      res.json({
        success: true,
        eligibleCounties,
        exists: Boolean(existing),
        articleId: existing?.id ?? null,
        slug: existing?.slug ?? null,
        countiesRanked: existing?.counties_ranked ?? null,
        status: existing?.status ?? null,
      });
    } catch (err) {
      console.error('[county-comparison] status failed:', err);
      res.status(500).json({ success: false, error: 'Could not load report status.' });
    }
  });

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

      const existing = await findExistingComparisonArticle();
      if (existing && existing.counties_ranked === rows.length) {
        res.status(400).json({
          success: false,
          error: `Already up to date -- the report already ranks all ${rows.length} covered counties. Add more county data first.`,
        });
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
      const { result: response, model: usedModel } = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: COUNTY_COMPARISON_SYSTEM_INSTRUCTION,
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: COUNTY_COMPARISON_RESPONSE_SCHEMA,
        },
      });
      logGeminiUsage('county_comparison_generation', usedModel, response.usageMetadata);

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
      const metaDescription = typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : '';
      const quickAnswer = typeof parsed.quickAnswer === 'string' ? parsed.quickAnswer.trim() : '';

      if (existing) {
        // Update in place -- same id, same slug (preserves the URL and whatever indexing/backlinks
        // it's already earned), fresh title/body/counties_ranked. status is deliberately NOT
        // touched here: an already-published page stays published. Flipping it to draft on every
        // refresh would pull an already-indexed URL out of the sitemap and out of "published"
        // status each time coverage grows -- real churn on a real ranking signal, not a safety
        // measure. The generation pipeline here is the same one already trusted for the initial
        // publish, and only the data changed (more counties), not the prompt or the review it
        // already passed.
        await withDb((sql) => sql`
          UPDATE articles
          SET title = ${title}, meta_description = ${metaDescription}, body_markdown = ${bodyMarkdown},
              quick_answer = ${quickAnswer}, counties_ranked = ${ranked.length}, updated_at = now()
          WHERE id = ${existing.id}
        `);
        res.json({ success: true, action: 'updated', articleId: existing.id, slug: existing.slug, countiesRanked: ranked.length });
        return;
      }

      const articleId = await withDb(async (sql) => {
        const base = slugify(title);
        let slug = base;
        for (let attempt = 1; attempt <= 20; attempt++) {
          const existingSlug = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
          if (existingSlug.length === 0) break;
          slug = `${base}-${attempt + 1}`;
        }
        const insertRows = await sql`
          INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, status, article_type, counties_ranked)
          VALUES (${slug}, ${title}, ${metaDescription}, ${bodyMarkdown}, ${quickAnswer}, 'draft', 'comparison', ${ranked.length})
          RETURNING id, slug
        `;
        return insertRows[0] as { id: number; slug: string };
      });

      res.json({ success: true, action: 'created', articleId: articleId.id, slug: articleId.slug, countiesRanked: ranked.length });
    } catch (err: any) {
      console.error('[county-comparison] generate failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({
          success: false,
          error: contentQuotaExhaustedMessage(),
        });
      } else {
        res.status(500).json({ success: false, error: 'Report generation failed. Try again.' });
      }
    }
  });
}
