import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { isQuotaError, generateContentWithFallback, contentQuotaExhaustedMessage } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import {
  BACKLINK_REPLY_SYSTEM_INSTRUCTION,
  BACKLINK_REPLY_RESPONSE_SCHEMA,
  NEW_GUIDE_URL_PLACEHOLDER,
  buildBacklinkReplyPrompt,
  CountyContextForReply,
} from './backlinkReplyGenerator.js';

// Queue of candidate forum threads for the guerilla backlink workflow (see /admin/backlinks).
// Deliberately not a live scanner: Reddit blocks both search indexing and direct navigation
// outright, and the forums that are reachable (City-Data, Bogleheads) still block automated
// page-fetching, so finding and reading the actual thread stays a manual/assisted step. This API
// only stores what a human found, drafts a reply, and tracks whether it's been posted -- nothing
// here ever posts anywhere on its own.

interface BacklinkLeadRow {
  id: number;
  source: string;
  title: string;
  url: string;
  topic_snippet: string;
  status: string;
  draft_answer: string;
  county_slug: string | null;
  created_at: string;
  updated_at: string;
}

function toApiShape(row: BacklinkLeadRow) {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    url: row.url,
    topicSnippet: row.topic_snippet,
    status: row.status,
    draftAnswer: row.draft_answer,
    countySlug: row.county_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const VALID_STATUSES = new Set(['new', 'drafted', 'posted', 'dismissed']);

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The backlink leads database is not configured yet.' });
}

export function registerBacklinksRoutes(app: Express) {
  // --- Admin: list all leads, newest first ----------------------------------------------------
  app.get('/api/admin/backlink-leads', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM backlink_leads ORDER BY created_at DESC
      `);
      res.json({ success: true, leads: (rows as unknown as BacklinkLeadRow[]).map(toApiShape) });
    } catch (err: any) {
      console.error('[backlink-leads] list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load leads.' });
    }
  });

  // --- Admin: add a lead found by a manual/assisted search scan -------------------------------
  app.post('/api/admin/backlink-leads', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const source = typeof req.body?.source === 'string' ? req.body.source.trim() : '';
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const topicSnippet = typeof req.body?.topicSnippet === 'string' ? req.body.topicSnippet.trim() : '';
    const countySlug = typeof req.body?.countySlug === 'string' && req.body.countySlug.trim() ? req.body.countySlug.trim() : null;
    if (!source || !title || !url) {
      res.status(400).json({ success: false, error: 'A lead needs at least a source, title, and URL.' });
      return;
    }
    try {
      const result = await withDb(async (sql) => {
        const rows = await sql`
          INSERT INTO backlink_leads (source, title, url, topic_snippet, county_slug)
          VALUES (${source}, ${title}, ${url}, ${topicSnippet}, ${countySlug})
          RETURNING *
        `;
        return rows[0] as BacklinkLeadRow;
      });
      res.json({ success: true, lead: toApiShape(result) });
    } catch (err: any) {
      console.error('[backlink-leads] create failed:', err);
      res.status(500).json({ success: false, error: 'Could not save the lead.' });
    }
  });

  // --- Admin: update status and/or drafted answer ----------------------------------------------
  app.put('/api/admin/backlink-leads/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid lead id.' });
      return;
    }
    const hasStatus = typeof req.body?.status === 'string';
    const hasDraft = typeof req.body?.draftAnswer === 'string';
    if (hasStatus && !VALID_STATUSES.has(req.body.status)) {
      res.status(400).json({ success: false, error: 'Invalid status.' });
      return;
    }
    if (!hasStatus && !hasDraft) {
      res.status(400).json({ success: false, error: 'Nothing to update.' });
      return;
    }
    try {
      const result = await withDb(async (sql) => {
        const existing = await sql`SELECT * FROM backlink_leads WHERE id = ${id} LIMIT 1`;
        const current = existing[0] as BacklinkLeadRow | undefined;
        if (!current) return null;
        const nextStatus = hasStatus ? req.body.status : current.status;
        const nextDraft = hasDraft ? req.body.draftAnswer : current.draft_answer;
        const rows = await sql`
          UPDATE backlink_leads
          SET status = ${nextStatus}, draft_answer = ${nextDraft}, updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
        return rows[0] as BacklinkLeadRow;
      });
      if (!result) {
        res.status(404).json({ success: false, error: 'Lead not found.' });
        return;
      }
      res.json({ success: true, lead: toApiShape(result) });
    } catch (err: any) {
      console.error('[backlink-leads] update failed:', err);
      res.status(500).json({ success: false, error: 'Could not update the lead.' });
    }
  });

  // --- Admin: AI-draft a reply from a human-pasted real thread ---------------------------------
  // Never writes draft_answer to the DB itself -- returns the text for the client to review and
  // edit, same as every other admin write in this file requiring an explicit Save. The point
  // isn't caution theater: a human reading the draft before it's stored as "the" draft is a real
  // check against exactly the failure mode this feature could otherwise have (a plausible-sounding
  // but subtly wrong reply going out under a real person's account on a forum this project doesn't
  // own).
  app.post('/api/admin/backlink-leads/:id/generate-reply', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid lead id.' });
      return;
    }
    const threadText = typeof req.body?.threadText === 'string' ? req.body.threadText.trim() : '';
    if (!threadText) {
      res.status(400).json({ success: false, error: 'Paste the actual thread text first -- a title and URL alone are not enough to draft a grounded reply.' });
      return;
    }

    try {
      const lead = await withDb(async (sql) => {
        const rows = await sql`SELECT * FROM backlink_leads WHERE id = ${id} LIMIT 1`;
        return (rows[0] as BacklinkLeadRow | undefined) ?? null;
      });
      if (!lead) {
        res.status(404).json({ success: false, error: 'Lead not found.' });
        return;
      }

      let county: CountyContextForReply | null = null;
      if (lead.county_slug) {
        const countyRow = await withDb(async (sql) => {
          const rows = await sql`SELECT * FROM county_data WHERE slug = ${lead.county_slug} AND data_complete = true LIMIT 1`;
          return rows[0] as Record<string, any> | undefined;
        });
        if (countyRow) {
          county = {
            countyName: countyRow.county_name,
            stateAbbrev: countyRow.state_abbrev,
            femaRiskRating: countyRow.fema_risk_rating,
            femaRiskScore: countyRow.fema_risk_score,
            femaHazards: JSON.parse(countyRow.fema_hazards_json || '{}'),
            noaaEventCounts: JSON.parse(countyRow.noaa_event_counts_json || '{}'),
            noaaYearsCovered: countyRow.noaa_years_covered,
            radonZone: countyRow.radon_zone,
            countyUrl: `https://www.beforeregret.com/county/${lead.county_slug}/`,
          };
        }
      }

      // Only published guides -- a draft's URL 404s until someone publishes it AND a real
      // redeploy runs (guide pages are statically prerendered, per articlesApi.ts/prerender-
      // guides.tsx). Citing anything else would hand back a dead link for a human to post on a
      // forum this project doesn't own.
      const guideRows = await withDb((sql) => sql`
        SELECT slug, title FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      const guides = (guideRows as unknown as Array<{ slug: string; title: string }>).map((g) => ({
        title: g.title,
        url: `https://www.beforeregret.com/guides/${g.slug}/`,
      }));

      const prompt = buildBacklinkReplyPrompt({
        threadTitle: lead.title,
        threadUrl: lead.url,
        topicSnippet: lead.topic_snippet,
        threadText,
        county,
        guides,
      });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const { result: response, model: usedModel } = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: BACKLINK_REPLY_SYSTEM_INSTRUCTION,
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: BACKLINK_REPLY_RESPONSE_SCHEMA,
        },
      });

      logGeminiUsage('backlink_reply_generation', usedModel, response.usageMetadata);
      const raw = response.text?.trim() || '';
      if (!raw) {
        res.status(500).json({ success: false, error: 'Gemini returned an empty response. Try again.' });
        return;
      }
      let parsed: { reply?: unknown; suggestedGuideTitle?: unknown };
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error('[backlink-leads] generate-reply: response was not valid JSON:', raw);
        res.status(500).json({ success: false, error: 'Gemini returned a malformed response. Try again.' });
        return;
      }
      const draftAnswer = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
      if (!draftAnswer) {
        res.status(500).json({ success: false, error: 'Gemini returned an empty reply. Try again.' });
        return;
      }
      const suggestedGuideTitle = typeof parsed.suggestedGuideTitle === 'string' && parsed.suggestedGuideTitle.trim()
        ? parsed.suggestedGuideTitle.trim()
        : null;
      // Belt-and-suspenders: only report a title when the reply actually uses the placeholder --
      // a model that fills in suggestedGuideTitle without the token would otherwise show the
      // admin a "new guide needed" prompt with nothing in the draft to attach the link to.
      const usesPlaceholder = draftAnswer.includes(NEW_GUIDE_URL_PLACEHOLDER);
      res.json({
        success: true,
        draftAnswer,
        countyDataUsed: !!county,
        suggestedGuideTitle: usesPlaceholder ? suggestedGuideTitle : null,
        placeholderToken: usesPlaceholder ? NEW_GUIDE_URL_PLACEHOLDER : null,
      });
    } catch (err: any) {
      console.error('[backlink-leads] generate-reply failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({
          success: false,
          error: contentQuotaExhaustedMessage(),
        });
      } else {
        res.status(500).json({ success: false, error: 'Reply generation failed. Try again.' });
      }
    }
  });

  // --- Admin: remove a lead ---------------------------------------------------------------------
  app.delete('/api/admin/backlink-leads/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid lead id.' });
      return;
    }
    try {
      await withDb((sql) => sql`DELETE FROM backlink_leads WHERE id = ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[backlink-leads] delete failed:', err);
      res.status(500).json({ success: false, error: 'Could not delete the lead.' });
    }
  });
}
