import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';

// Real read/write path for editorial articles, replacing the static EDITORIAL_GUIDES_DATASET
// array and the fake SeoAdminPanel "publish" button that only ever changed local React state.
// Admin routes (create/update/publish/delete) require a valid admin session via requireAdmin.
// The two public routes only ever return rows with status = 'published' -- a draft is never
// reachable by its URL before someone with the admin password chooses to publish it.

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  body_markdown: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function toApiShape(row: ArticleRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    bodyMarkdown: row.body_markdown,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'article';
}

// Server-unavailable response shared by every route below when DATABASE_URL isn't configured --
// same fail-closed shape as requireAdmin's own 503, so a missing env var reads the same way
// everywhere rather than surfacing as a generic 500 crash.
function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The article database is not configured yet.' });
}

export function registerArticleRoutes(app: Express) {
  // --- Admin: create -------------------------------------------------------------------------
  app.post('/api/admin/articles', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      res.status(400).json({ success: false, error: 'Give the article a title first.' });
      return;
    }
    try {
      const result = await withDb(async (sql) => {
        const base = slugify(title);
        let slug = base;
        for (let attempt = 1; attempt <= 20; attempt++) {
          const existing = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
          if (existing.length === 0) break;
          slug = `${base}-${attempt + 1}`;
        }
        const rows = await sql`
          INSERT INTO articles (slug, title, meta_description, body_markdown, status)
          VALUES (${slug}, ${title}, '', '', 'draft')
          RETURNING *
        `;
        return rows[0] as ArticleRow;
      });
      res.json({ success: true, article: toApiShape(result) });
    } catch (err: any) {
      console.error('[articles] create failed:', err);
      res.status(500).json({ success: false, error: 'Could not create the article.' });
    }
  });

  // --- Admin: list all (drafts and published) -------------------------------------------------
  app.get('/api/admin/articles', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      const rows = await withDb((sql) => sql`SELECT * FROM articles ORDER BY updated_at DESC`);
      res.json({ success: true, articles: (rows as unknown as ArticleRow[]).map(toApiShape) });
    } catch (err: any) {
      console.error('[articles] list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load articles.' });
    }
  });

  // --- Admin: get one ---------------------------------------------------------------------------
  app.get('/api/admin/articles/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid article id.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`SELECT * FROM articles WHERE id = ${id} LIMIT 1`);
      const row = (rows as unknown as ArticleRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Article not found.' });
        return;
      }
      res.json({ success: true, article: toApiShape(row) });
    } catch (err: any) {
      console.error('[articles] get failed:', err);
      res.status(500).json({ success: false, error: 'Could not load the article.' });
    }
  });

  // --- Admin: update title / meta description / body -------------------------------------------
  app.put('/api/admin/articles/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid article id.' });
      return;
    }
    const title = typeof req.body?.title === 'string' ? req.body.title : undefined;
    const metaDescription = typeof req.body?.metaDescription === 'string' ? req.body.metaDescription : undefined;
    const bodyMarkdown = typeof req.body?.bodyMarkdown === 'string' ? req.body.bodyMarkdown : undefined;
    try {
      const rows = await withDb((sql) => sql`
        UPDATE articles
        SET
          title = COALESCE(${title ?? null}, title),
          meta_description = COALESCE(${metaDescription ?? null}, meta_description),
          body_markdown = COALESCE(${bodyMarkdown ?? null}, body_markdown),
          updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `);
      const row = (rows as unknown as ArticleRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Article not found.' });
        return;
      }
      res.json({ success: true, article: toApiShape(row) });
    } catch (err: any) {
      console.error('[articles] update failed:', err);
      res.status(500).json({ success: false, error: 'Could not save changes.' });
    }
  });

  // --- Admin: publish / unpublish ----------------------------------------------------------------
  app.post('/api/admin/articles/:id/publish', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid article id.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        UPDATE articles
        SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `);
      const row = (rows as unknown as ArticleRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Article not found.' });
        return;
      }
      res.json({ success: true, article: toApiShape(row) });
    } catch (err: any) {
      console.error('[articles] publish failed:', err);
      res.status(500).json({ success: false, error: 'Could not publish the article.' });
    }
  });

  app.post('/api/admin/articles/:id/unpublish', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid article id.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        UPDATE articles SET status = 'draft', updated_at = now() WHERE id = ${id} RETURNING *
      `);
      const row = (rows as unknown as ArticleRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Article not found.' });
        return;
      }
      res.json({ success: true, article: toApiShape(row) });
    } catch (err: any) {
      console.error('[articles] unpublish failed:', err);
      res.status(500).json({ success: false, error: 'Could not unpublish the article.' });
    }
  });

  // --- Admin: delete -------------------------------------------------------------------------
  app.delete('/api/admin/articles/:id', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ success: false, error: 'Invalid article id.' });
      return;
    }
    try {
      await withDb((sql) => sql`DELETE FROM articles WHERE id = ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[articles] delete failed:', err);
      res.status(500).json({ success: false, error: 'Could not delete the article.' });
    }
  });

  // --- Public: list published articles (guides index + sitemap) --------------------------------
  app.get('/api/guides', async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.json({ success: true, articles: [] });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      res.json({ success: true, articles: (rows as unknown as ArticleRow[]).map(toApiShape) });
    } catch (err: any) {
      console.error('[guides] list failed:', err);
      res.json({ success: true, articles: [] });
    }
  });

  // --- Public: single published article by slug -------------------------------------------------
  app.get('/api/guides/:slug', async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(404).json({ success: false, error: 'Not found.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM articles WHERE slug = ${req.params.slug} AND status = 'published' LIMIT 1
      `);
      const row = (rows as unknown as ArticleRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Not found.' });
        return;
      }
      res.json({ success: true, article: toApiShape(row) });
    } catch (err: any) {
      console.error('[guides] get failed:', err);
      res.status(404).json({ success: false, error: 'Not found.' });
    }
  });
}
