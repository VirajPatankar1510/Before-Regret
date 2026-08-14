import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';

// A FIFO backlog of exact-title questions for the article editor's "Exact title" field (see
// SeoAdminPanel.tsx). The whole point is replacing a manually-maintained spreadsheet: paste a
// batch of titles once, then click "Import next question" per article instead of copying one
// title at a time out of an external file and crossing it off by hand.
//
// Deliberately a plain FIFO queue, not a per-draft link between a question and the article it
// became: "Import next question" only fills the text field (a read, via GET below -- the list is
// already ordered oldest-first, so the client just takes the first row, no extra endpoint
// needed). A row is removed only once the admin actually publishes with it -- see the DELETE
// route below, called from SeoAdminPanel's publishNow() -- not the moment it's imported. That
// matters: importing, then abandoning the draft or overwriting the field, must not silently lose
// a question the admin still needs to write about. Only a real publish consumes it.

interface QuestionQueueRow {
  id: number;
  question_text: string;
  created_at: string;
}

function toApiShape(row: QuestionQueueRow) {
  return { id: row.id, questionText: row.question_text, createdAt: row.created_at };
}

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The question queue database is not configured yet.' });
}

export function registerQuestionQueueRoutes(app: Express) {
  // --- Admin: list the full queue, oldest (next) first -----------------------------------------
  app.get('/api/admin/question-queue', requireAdmin, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM question_queue ORDER BY id ASC
      `);
      res.json({ success: true, questions: (rows as unknown as QuestionQueueRow[]).map(toApiShape) });
    } catch (err: any) {
      console.error('[question-queue] list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load the question queue.' });
    }
  });

  // --- Admin: bulk-add pasted questions, one per line on the client ------------------------------
  // Skips exact duplicates (case/whitespace-insensitive) against both what's already queued and
  // other lines in the same paste -- the real failure mode this guards is pasting the same
  // half-worked spreadsheet in twice and ending up with the same question importable N times.
  app.post('/api/admin/question-queue', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const input = Array.isArray(req.body?.questions) ? req.body.questions : [];
    const cleaned = input
      .filter((q: unknown): q is string => typeof q === 'string')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && q.length <= 200);
    if (cleaned.length === 0) {
      res.status(400).json({ success: false, error: 'No valid questions in that paste (each line must be non-empty and under 200 characters).' });
      return;
    }
    try {
      const result = await withDb(async (sql) => {
        const existingRows = await sql`SELECT question_text FROM question_queue`;
        const existing = new Set(
          (existingRows as unknown as Array<{ question_text: string }>).map((r) => r.question_text.trim().toLowerCase())
        );
        let added = 0;
        let duplicates = 0;
        for (const q of cleaned) {
          const key = q.toLowerCase();
          if (existing.has(key)) {
            duplicates++;
            continue;
          }
          existing.add(key); // catches a duplicate line within this same paste, not just against the DB
          await sql`INSERT INTO question_queue (question_text) VALUES (${q})`;
          added++;
        }
        const rows = await sql`SELECT * FROM question_queue ORDER BY id ASC`;
        return { added, duplicates, questions: (rows as unknown as QuestionQueueRow[]).map(toApiShape) };
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[question-queue] bulk add failed:', err);
      res.status(500).json({ success: false, error: 'Could not save those questions.' });
    }
  });

  // --- Admin: remove one question -- called both on publish (auto-consume) and for manual cleanup
  app.delete('/api/admin/question-queue/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid question id.' });
      return;
    }
    try {
      await withDb((sql) => sql`DELETE FROM question_queue WHERE id = ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[question-queue] delete failed:', err);
      res.status(500).json({ success: false, error: 'Could not remove that question.' });
    }
  });
}
