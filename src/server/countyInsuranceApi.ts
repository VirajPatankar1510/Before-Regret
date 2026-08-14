import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { isQuotaError, generateContentWithFallback, contentQuotaExhaustedMessage } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import { slugify } from './articlesApi.js';
import {
  computeInsuranceCostRankings,
  buildInsuranceRankingTableMarkdown,
  buildCountyInsuranceComparisonPrompt,
  COUNTY_INSURANCE_COMPARISON_SYSTEM_INSTRUCTION,
  COUNTY_INSURANCE_COMPARISON_RESPONSE_SCHEMA,
  CountyInsuranceCostRow,
} from './countyInsuranceComparisonGenerator.js';

// Admin-triggered county homeowners-insurance-cost report -- see /admin/seo's insurance-cost
// report card. Same singleton, living-page, update-in-place pattern as countyComparisonApi.ts
// (the housing-age report), just keyed on article_type = 'insurance-cost' instead of 'comparison'
// so the two singleton lookups never collide, and on census_insurance_json (which counties this
// data has, independent of data_complete -- see that column's comment in db.ts) instead of
// data_complete.

interface CountyInsuranceDbRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  census_insurance_json: string;
}

interface ExistingInsuranceArticle {
  id: number;
  slug: string;
  counties_ranked: number | null;
  status: string;
}

async function findExistingInsuranceArticle(): Promise<ExistingInsuranceArticle | null> {
  const rows = await withDb((sql) => sql`
    SELECT id, slug, counties_ranked, status FROM articles
    WHERE article_type = 'insurance-cost' ORDER BY created_at DESC LIMIT 1
  `);
  return (rows as unknown as ExistingInsuranceArticle[])[0] || null;
}

// A county counts as eligible once its census_insurance_json is a real (non-empty) object --
// deliberately not gated on data_complete, since this data is independent of what a county's own
// /county/<slug>/ page needs (see the census_insurance_json column comment in db.ts).
async function fetchEligibleInsuranceRows(): Promise<CountyInsuranceDbRow[]> {
  const rows = await withDb((sql) => sql`
    SELECT slug, county_name, state_abbrev, census_insurance_json
    FROM county_data
    WHERE census_insurance_json IS NOT NULL AND census_insurance_json != '{}' AND census_insurance_json != ''
  `);
  return rows as unknown as CountyInsuranceDbRow[];
}

export function registerCountyInsuranceRoutes(app: Express) {
  // --- Status: does a report already exist, and has coverage grown since it was last written? ---
  app.get('/api/admin/reports/county-insurance/status', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }
    try {
      const [existing, eligibleRows] = await Promise.all([
        findExistingInsuranceArticle(),
        fetchEligibleInsuranceRows(),
      ]);
      res.json({
        success: true,
        eligibleCounties: eligibleRows.length,
        exists: Boolean(existing),
        articleId: existing?.id ?? null,
        slug: existing?.slug ?? null,
        countiesRanked: existing?.counties_ranked ?? null,
        status: existing?.status ?? null,
      });
    } catch (err) {
      console.error('[county-insurance] status failed:', err);
      res.status(500).json({ success: false, error: 'Could not load report status.' });
    }
  });

  app.post('/api/admin/reports/county-insurance', requireAdmin, async (_req: Request, res: Response) => {
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
      const rows = await fetchEligibleInsuranceRows();
      if (rows.length < 5) {
        res.status(400).json({ success: false, error: `Only ${rows.length} counties have insurance-cost data -- need at least 5 for a meaningful comparison.` });
        return;
      }

      const existing = await findExistingInsuranceArticle();
      if (existing && existing.counties_ranked === rows.length) {
        res.status(400).json({
          success: false,
          error: `Already up to date -- the report already ranks all ${rows.length} counties with insurance-cost data. Fetch more county data first.`,
        });
        return;
      }

      const insuranceRows: CountyInsuranceCostRow[] = rows.map((r) => {
        const parsed = JSON.parse(r.census_insurance_json || '{}');
        return {
          slug: r.slug,
          countyName: r.county_name,
          stateAbbrev: r.state_abbrev,
          totalMortgaged: parsed.totalMortgaged || 0,
          costBuckets: parsed.costBuckets || {},
        };
      });

      const ranked = computeInsuranceCostRankings(insuranceRows);
      const realTable = buildInsuranceRankingTableMarkdown(ranked);
      const prompt = buildCountyInsuranceComparisonPrompt({ ranked, totalCounties: ranked.length });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const { result: response, model: usedModel } = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: COUNTY_INSURANCE_COMPARISON_SYSTEM_INSTRUCTION,
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: COUNTY_INSURANCE_COMPARISON_RESPONSE_SCHEMA,
        },
      });
      logGeminiUsage('county_insurance_comparison_generation', usedModel, response.usageMetadata);

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
      // reassembled from anything the model wrote. Same as countyComparisonApi.ts.
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
        // Update in place -- status deliberately not touched, same reasoning as
        // countyComparisonApi.ts's identical update branch.
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
          VALUES (${slug}, ${title}, ${metaDescription}, ${bodyMarkdown}, ${quickAnswer}, 'draft', 'insurance-cost', ${ranked.length})
          RETURNING id, slug
        `;
        return insertRows[0] as { id: number; slug: string };
      });

      res.json({ success: true, action: 'created', articleId: articleId.id, slug: articleId.slug, countiesRanked: ranked.length });
    } catch (err: any) {
      console.error('[county-insurance] generate failed:', err);
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
