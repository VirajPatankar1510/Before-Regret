import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';

// Reader-reported inaccuracies. See content_reports in db.ts for why this had to be built rather
// than wired up: the modal that collects these was submitting to nothing at all while promising a
// reply within 1-2 business days.
//
// The public POST is deliberately unauthenticated. The whole point is that someone who spots a
// wrong claim in a guide can say so without making an account, and a correction channel gated
// behind sign-up is one nobody uses. Abuse surface is small -- it writes short text to a table
// nothing renders publicly -- and the length caps below bound the damage from a bad actor.

const MAX_TOPIC = 200;
const MAX_DESCRIPTION = 4000;
const MAX_EMAIL = 320;
const MAX_LABEL = 300;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function requestIp(req: Request): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

export function registerContentReportRoutes(app: Express) {
  app.post('/api/content-reports', async (req: Request, res: Response) => {
    const sourceType = clean(req.body?.sourceType, 20);
    const sourceRef = clean(req.body?.sourceRef, 300);
    const sourceLabel = clean(req.body?.sourceLabel, MAX_LABEL);
    const topic = clean(req.body?.topic, MAX_TOPIC);
    const description = clean(req.body?.description, MAX_DESCRIPTION);
    const reporterEmail = clean(req.body?.reporterEmail, MAX_EMAIL);

    if (sourceType !== 'report' && sourceType !== 'guide') {
      res.status(400).json({ success: false, error: 'sourceType must be "report" or "guide".' });
      return;
    }
    if (!topic || !description) {
      res.status(400).json({ success: false, error: 'Both a topic and a description are required.' });
      return;
    }
    // Fail loudly rather than accepting and dropping. Returning success here would recreate the
    // exact defect this endpoint was written to fix.
    if (!isDbConfigured()) {
      res.status(503).json({
        success: false,
        error: 'unavailable',
        message: 'We could not record that just now. Please email hello@beforeregret.com instead.',
      });
      return;
    }

    try {
      const rows = await withDb((sql) => sql`
        INSERT INTO content_reports (
          source_type, source_ref, source_label, topic, description, reporter_email, ip_address, user_agent
        ) VALUES (
          ${sourceType}, ${sourceRef}, ${sourceLabel || null}, ${topic}, ${description},
          ${reporterEmail || null}, ${requestIp(req)}, ${(req.headers['user-agent'] as string) || null}
        )
        RETURNING id
      `);
      const id = (rows as any[])[0]?.id;
      res.json({ success: true, referenceId: `CR-${id}` });
    } catch (err) {
      console.error('[content-reports] Failed to record report:', err);
      res.status(500).json({
        success: false,
        error: 'save_failed',
        message: 'We could not record that just now. Please email hello@beforeregret.com instead.',
      });
    }
  });

  // Admin triage. Without somewhere to actually READ these, storing them would keep the promise
  // only in the narrow sense that the row exists -- the reader was told a person would look.
  app.get('/api/admin/content-reports', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured.' });
      return;
    }
    const status = typeof req.query.status === 'string' ? req.query.status : 'open';
    try {
      const rows = await withDb((sql) => (
        status === 'all'
          ? sql`SELECT * FROM content_reports ORDER BY created_at DESC LIMIT 200`
          : sql`SELECT * FROM content_reports WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`
      ));
      res.json({ success: true, reports: rows });
    } catch (err) {
      console.error('[content-reports] Failed to list:', err);
      res.status(500).json({ success: false, error: 'Could not load reports.' });
    }
  });

  app.post('/api/admin/content-reports/:id/resolve', requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid id.' });
      return;
    }
    const note = clean(req.body?.note, 2000);
    try {
      await withDb((sql) => sql`
        UPDATE content_reports
        SET status = 'resolved', resolved_at = now(), resolution_note = ${note || null}
        WHERE id = ${id}
      `);
      res.json({ success: true });
    } catch (err) {
      console.error('[content-reports] Failed to resolve:', err);
      res.status(500).json({ success: false, error: 'Could not update that report.' });
    }
  });
}
