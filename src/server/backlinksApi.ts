import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';

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
