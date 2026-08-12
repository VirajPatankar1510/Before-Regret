import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { GEMINI_MODEL, isQuotaError } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import { MEDIA_REQUEST_SYSTEM_INSTRUCTION, buildMediaRequestPrompt } from './mediaRequestGenerator.js';
import { CountyContextForReply } from './backlinkReplyGenerator.js';

// Queue for journalist source requests (Connectively/Qwoted/Featured) -- see /admin/media-requests.
// Same reasoning as backlinksApi.ts: these platforms require a real account to even see queries,
// so finding one stays a manual step. This API only stores what a human found, drafts a response,
// and tracks whether it's been submitted -- nothing here ever submits anywhere on its own.

interface MediaRequestRow {
  id: number;
  platform: string;
  outlet_name: string;
  query_text: string;
  topic_snippet: string;
  deadline: string | null;
  status: string;
  draft_response: string;
  county_slug: string | null;
  created_at: string;
  updated_at: string;
}

function toApiShape(row: MediaRequestRow) {
  return {
    id: row.id,
    platform: row.platform,
    outletName: row.outlet_name,
    queryText: row.query_text,
    topicSnippet: row.topic_snippet,
    deadline: row.deadline,
    status: row.status,
    draftResponse: row.draft_response,
    countySlug: row.county_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const VALID_STATUSES = new Set(['new', 'drafted', 'submitted', 'expired', 'dismissed']);

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The media requests database is not configured yet.' });
}

export function registerMediaRequestsRoutes(app: Express) {
  // --- Admin: list all requests, newest first --------------------------------------------------
  app.get('/api/admin/media-requests', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM media_requests ORDER BY created_at DESC
      `);
      res.json({ success: true, requests: (rows as unknown as MediaRequestRow[]).map(toApiShape) });
    } catch (err: any) {
      console.error('[media-requests] list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load media requests.' });
    }
  });

  // --- Admin: add a request found on Connectively/Qwoted/Featured -----------------------------
  app.post('/api/admin/media-requests', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim() : '';
    const outletName = typeof req.body?.outletName === 'string' ? req.body.outletName.trim() : '';
    const topicSnippet = typeof req.body?.topicSnippet === 'string' ? req.body.topicSnippet.trim() : '';
    const deadline = typeof req.body?.deadline === 'string' && req.body.deadline.trim() ? req.body.deadline.trim() : null;
    const countySlug = typeof req.body?.countySlug === 'string' && req.body.countySlug.trim() ? req.body.countySlug.trim() : null;
    if (!platform) {
      res.status(400).json({ success: false, error: 'A media request needs at least a platform.' });
      return;
    }
    try {
      const result = await withDb(async (sql) => {
        const rows = await sql`
          INSERT INTO media_requests (platform, outlet_name, topic_snippet, deadline, county_slug)
          VALUES (${platform}, ${outletName}, ${topicSnippet}, ${deadline}, ${countySlug})
          RETURNING *
        `;
        return rows[0] as MediaRequestRow;
      });
      res.json({ success: true, request: toApiShape(result) });
    } catch (err: any) {
      console.error('[media-requests] create failed:', err);
      res.status(500).json({ success: false, error: 'Could not save the media request.' });
    }
  });

  // --- Admin: update status and/or drafted response ---------------------------------------------
  app.put('/api/admin/media-requests/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid request id.' });
      return;
    }
    const hasStatus = typeof req.body?.status === 'string';
    const hasDraft = typeof req.body?.draftResponse === 'string';
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
        const existing = await sql`SELECT * FROM media_requests WHERE id = ${id} LIMIT 1`;
        const current = existing[0] as MediaRequestRow | undefined;
        if (!current) return null;
        const nextStatus = hasStatus ? req.body.status : current.status;
        const nextDraft = hasDraft ? req.body.draftResponse : current.draft_response;
        const rows = await sql`
          UPDATE media_requests
          SET status = ${nextStatus}, draft_response = ${nextDraft}, updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
        return rows[0] as MediaRequestRow;
      });
      if (!result) {
        res.status(404).json({ success: false, error: 'Request not found.' });
        return;
      }
      res.json({ success: true, request: toApiShape(result) });
    } catch (err: any) {
      console.error('[media-requests] update failed:', err);
      res.status(500).json({ success: false, error: 'Could not update the request.' });
    }
  });

  // --- Admin: AI-draft a response from a human-pasted real journalist query ---------------------
  // Never writes draft_response to the DB itself -- returns the text for the client to review and
  // edit, same as backlinksApi.ts's generate-reply. A human reading the draft before it's stored
  // as "the" draft is the real check against a plausible-sounding but subtly wrong quote going out
  // under a real person's name to a real publication.
  app.post('/api/admin/media-requests/:id/generate-response', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid request id.' });
      return;
    }
    const queryText = typeof req.body?.queryText === 'string' ? req.body.queryText.trim() : '';
    if (!queryText) {
      res.status(400).json({ success: false, error: 'Paste the actual query text first -- an outlet name alone is not enough to draft a grounded response.' });
      return;
    }

    try {
      const lead = await withDb(async (sql) => {
        const rows = await sql`SELECT * FROM media_requests WHERE id = ${id} LIMIT 1`;
        return (rows[0] as MediaRequestRow | undefined) ?? null;
      });
      if (!lead) {
        res.status(404).json({ success: false, error: 'Request not found.' });
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

      // Same reasoning as backlinksApi.ts: only published guides, since a draft's URL 404s until
      // it's both published AND redeployed (guide pages are statically prerendered).
      const guideRows = await withDb((sql) => sql`
        SELECT slug, title FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      const guides = (guideRows as unknown as Array<{ slug: string; title: string }>).map((g) => ({
        title: g.title,
        url: `https://www.beforeregret.com/guides/${g.slug}/`,
      }));

      const prompt = buildMediaRequestPrompt({
        platform: lead.platform,
        outletName: lead.outlet_name,
        queryText,
        topicSnippet: lead.topic_snippet,
        county,
        guides,
      });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: MEDIA_REQUEST_SYSTEM_INSTRUCTION, temperature: 0.7 },
      });

      logGeminiUsage('media_request_response', GEMINI_MODEL, response.usageMetadata);
      const draftResponse = response.text?.trim() || '';
      if (!draftResponse) {
        res.status(500).json({ success: false, error: 'Gemini returned an empty response. Try again.' });
        return;
      }
      res.json({ success: true, draftResponse, countyDataUsed: !!county });
    } catch (err: any) {
      console.error('[media-requests] generate-response failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({
          success: false,
          error: `Gemini's daily quota for ${GEMINI_MODEL} is used up. Retrying won't help until it resets, or set GEMINI_MODEL to another model.`,
        });
      } else {
        res.status(500).json({ success: false, error: 'Response generation failed. Try again.' });
      }
    }
  });

  // --- Admin: remove a request --------------------------------------------------------------------
  app.delete('/api/admin/media-requests/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid request id.' });
      return;
    }
    try {
      await withDb((sql) => sql`DELETE FROM media_requests WHERE id = ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[media-requests] delete failed:', err);
      res.status(500).json({ success: false, error: 'Could not delete the request.' });
    }
  });
}
