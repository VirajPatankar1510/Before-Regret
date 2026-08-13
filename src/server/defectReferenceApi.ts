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
import type { PriorityRule } from '../engine/inspectionPriorities.js';

// Admin-triggered generator for the "era x defect" reference library -- see /admin/seo's
// "Generate reference library" button. Fixed set of 8 defects (see defectReferenceGenerator.ts's
// DEFECT_RULE_IDS), each a living page tracked by counties_ranked -- same pattern as
// countyComparisonApi.ts's singleton report, applied per-defect instead of once. Each click does
// exactly ONE thing (create the next missing page, or update the next stale one), not the whole
// remaining batch -- keeps each draft reviewable on its own, avoids burning through Gemini's daily
// quota in a single click, and (the reason this file exists in its current form) means a defect
// page whose county coverage has grown gets refreshed in place instead of silently sitting stale
// forever, or -- worse -- a second near-duplicate page ever getting created for the same defect.

interface CountyDataRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  census_total_units: number | null;
  census_year_built_json: string;
}

interface DefectArticleState {
  ruleId: string;
  exists: boolean;
  id: number | null;
  slug: string | null;
  countiesRanked: number | null;
}

async function loadDefectArticleStates(rules: readonly PriorityRule[]): Promise<DefectArticleState[]> {
  const rows = await withDb((sql) => sql`
    SELECT defect_rule_id, id, slug, counties_ranked FROM articles WHERE article_type = 'reference'
  `);
  const bySlug = new Map(
    (rows as unknown as Array<{ defect_rule_id: string; id: number; slug: string; counties_ranked: number | null }>).map(
      (r) => [r.defect_rule_id, r]
    )
  );
  return rules.map((rule) => {
    const existing = bySlug.get(rule.id);
    return {
      ruleId: rule.id,
      exists: Boolean(existing),
      id: existing?.id ?? null,
      slug: existing?.slug ?? null,
      countiesRanked: existing?.counties_ranked ?? null,
    };
  });
}

/** First rule with no article at all, else first rule whose article predates current coverage. Null
 *  means every rule is both present and up to date -- nothing left for a click to do. */
function pickNextAction(
  states: DefectArticleState[],
  eligibleCounties: number
): { action: 'create' | 'update'; state: DefectArticleState } | null {
  const missing = states.find((s) => !s.exists);
  if (missing) return { action: 'create', state: missing };
  const stale = states.find((s) => s.exists && s.countiesRanked !== eligibleCounties);
  if (stale) return { action: 'update', state: stale };
  return null;
}

export function registerDefectReferenceRoutes(app: Express) {
  // --- Status: what would the next click do, without spending a Gemini call to find out ---------
  app.get('/api/admin/reports/defect-reference-library/status', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }
    try {
      const [eligibleRows, states] = await Promise.all([
        withDb((sql) => sql`SELECT count(*)::int AS n FROM county_data WHERE data_complete = true`),
        loadDefectArticleStates(getDefectRules()),
      ]);
      const eligibleCounties = (eligibleRows as unknown as Array<{ n: number }>)[0].n;
      const next = pickNextAction(states, eligibleCounties);
      res.json({
        success: true,
        eligibleCounties,
        totalDefects: states.length,
        missingCount: states.filter((s) => !s.exists).length,
        staleCount: states.filter((s) => s.exists && s.countiesRanked !== eligibleCounties).length,
        nextAction: next?.action ?? null,
        nextRuleId: next?.state.ruleId ?? null,
      });
    } catch (err) {
      console.error('[defect-reference] status failed:', err);
      res.status(500).json({ success: false, error: 'Could not load reference library status.' });
    }
  });

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

    const summary = {
      attempted: 0,
      created: 0,
      results: [] as Array<{ ruleId: string; slug?: string; action?: 'created' | 'updated'; error?: string; skipped?: boolean }>,
    };

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

      // summary.results only ever reports the one rule this click touches -- with the old
      // create-only design "already exists" meant "permanently done," so listing every other rule
      // as skipped told the whole library's story in one response. Under update-in-place, existing
      // doesn't mean done (it might be stale), so that story now belongs to the status endpoint's
      // missingCount/staleCount instead; a single click only ever does one thing, and only needs to
      // report that one thing.
      const rules = getDefectRules();
      const states = await loadDefectArticleStates(rules);
      const next = pickNextAction(states, rows.length);
      if (!next) {
        res.json({ success: true, summary, complete: true });
        return;
      }
      const rule = rules.find((r) => r.id === next.state.ruleId)!;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

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
        const metaDescription = parsed.metaDescription?.trim() || '';
        const quickAnswer = parsed.quickAnswer?.trim() || '';

        if (next.action === 'update') {
          // Same id, same slug -- preserves the URL and whatever indexing it's earned. status is
          // deliberately NOT touched, same reasoning as countyComparisonApi.ts's update path: an
          // already-published page stays published rather than blinking out of the sitemap and
          // out of "published" status every time coverage grows.
          await withDb((sql) => sql`
            UPDATE articles
            SET title = ${title}, meta_description = ${metaDescription}, body_markdown = ${bodyMarkdown},
                quick_answer = ${quickAnswer}, counties_ranked = ${rows.length}, updated_at = now()
            WHERE id = ${next.state.id}
          `);
          summary.created++;
          summary.results.push({ ruleId: rule.id, slug: next.state.slug!, action: 'updated' });
        } else {
          const created = await withDb(async (sql) => {
            const base = slugify(title);
            let slug = base;
            for (let attempt = 1; attempt <= 20; attempt++) {
              const existing = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
              if (existing.length === 0) break;
              slug = `${base}-${attempt + 1}`;
            }
            const insertRows = await sql`
              INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, status, article_type, defect_rule_id, counties_ranked)
              VALUES (${slug}, ${title}, ${metaDescription}, ${bodyMarkdown}, ${quickAnswer}, 'draft', 'reference', ${rule.id}, ${rows.length})
              RETURNING slug
            `;
            return (insertRows[0] as { slug: string }).slug;
          });

          summary.created++;
          summary.results.push({ ruleId: rule.id, slug: created, action: 'created' });
        }
      } catch (innerErr: any) {
        console.error(`[defect-reference] failed for ${rule.id}:`, innerErr);
        summary.results.push({ ruleId: rule.id, error: innerErr?.message || 'unknown error' });
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
