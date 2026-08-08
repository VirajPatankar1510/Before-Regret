import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { buildArticlePrompt } from './articleGenerator.js';

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
  quick_answer: string;
  sources_json: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function toApiShape(row: ArticleRow) {
  let sources: string[] = [];
  try {
    const parsed = JSON.parse(row.sources_json || '[]');
    if (Array.isArray(parsed)) sources = parsed.filter((s) => typeof s === 'string');
  } catch {
    sources = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    bodyMarkdown: row.body_markdown,
    quickAnswer: row.quick_answer,
    sources,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

// SEO-friendly slugs are short and keyword-focused, not a verbatim copy of the headline --
// stripping filler words keeps them concise. Falls back to the un-stripped word list if
// stripping stopwords leaves too little to work with (e.g. a very short, mostly-generic title).
const SLUG_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'in', 'on', 'of', 'with', 'is', 'are',
  'your', 'you', 'how', 'what', 'why', 'can', 'do', 'does', 'this', 'that', 'it', 'its',
]);

function slugify(input: string): string {
  const words = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stripped = words.filter((w) => !SLUG_STOPWORDS.has(w));
  const chosen = stripped.length >= 3 ? stripped : words;
  const slug = chosen.join('-').slice(0, 60).replace(/-+$/, '');
  return slug || 'article';
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

  // --- Admin: AI-assisted draft, streamed live into the editor ---------------------------------
  // Streams raw text chunks as they arrive from Gemini (not full SSE framing -- there's only one
  // event type here, so a plain streamed response body is enough; the client reads it with
  // response.body.getReader()). See src/server/articleGenerator.ts for the prompt and the
  // deliberate limits on what this can and can't do (no invented keyword-difficulty score, no
  // plagiarism-checking guarantee).
  app.post('/api/admin/articles/generate', requireAdmin, async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }
    const topic = typeof req.body?.topic === 'string' ? req.body.topic : '';
    const exactTitle = typeof req.body?.exactTitle === 'string' ? req.body.exactTitle : '';
    const currentArticleId = Number.isFinite(parseInt(req.body?.currentArticleId, 10))
      ? parseInt(req.body.currentArticleId, 10)
      : null;
    // Titles the client has already generated for this same draft earlier in this editing
    // session, before ever hitting Save. Without this, regenerating for the same topic looked
    // identical to the model every time -- the duplicate guard below only ever knew about
    // *saved* articles, so an unsaved retry carried no memory of what it just wrote a moment ago.
    const previousAttempts = Array.isArray(req.body?.previousAttempts)
      ? req.body.previousAttempts.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    // Best-effort: if the DB read fails for any reason, generation still proceeds without the
    // duplicate-content guard rather than blocking the whole feature on it.
    let existingTitles: string[] = [...previousAttempts];
    if (isDbConfigured()) {
      try {
        const rows = await withDb((sql) => sql`SELECT id, title FROM articles`);
        existingTitles = existingTitles.concat(
          (rows as unknown as Array<{ id: number; title: string }>)
            .filter((r) => r.id !== currentArticleId && r.title && r.title !== 'Untitled article')
            .map((r) => r.title)
        );
      } catch (err) {
        console.error('[articles] failed to load existing titles for duplicate check:', err);
      }
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const { systemInstruction, contents } = buildArticlePrompt(topic, existingTitles, exactTitle);

      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders?.();

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) res.write(text);
      }
      res.end();
    } catch (err: any) {
      console.error('[articles] generate failed:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'AI generation failed. Try again.' });
      } else {
        res.end();
      }
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

  // --- Admin: update title / meta description / body / quick answer / sources / web address ------
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
    const quickAnswer = typeof req.body?.quickAnswer === 'string' ? req.body.quickAnswer : undefined;
    const sourcesInput = Array.isArray(req.body?.sources)
      ? req.body.sources.filter((s: unknown) => typeof s === 'string')
      : undefined;
    // Deliberately NOT normalized here yet -- normalizing (slugify()) on every save, even when
    // the slug didn't change, risks a false "locked" error the moment SLUG_STOPWORDS is ever
    // edited or against a slug set by an earlier version of this function: re-running slugify()
    // on its own output isn't guaranteed to be a no-op forever. Only normalize once we know
    // below that the raw value actually differs from what's stored.
    const rawSlugInput = typeof req.body?.slug === 'string' ? req.body.slug : undefined;

    try {
      const result = await withDb(async (sql) => {
        const existingRows = await sql`SELECT * FROM articles WHERE id = ${id} LIMIT 1`;
        const existing = existingRows[0] as ArticleRow | undefined;
        if (!existing) return { error: 'not_found' as const };

        // Web address changes only apply pre-publish -- once an article is live, its URL is a
        // real link someone might have already shared or Google might already have crawled.
        let finalSlug = existing.slug;
        if (rawSlugInput !== undefined && rawSlugInput !== existing.slug) {
          const requestedSlug = slugify(rawSlugInput);
          if (requestedSlug !== existing.slug) {
            if (existing.status === 'published') {
              return { error: 'locked' as const };
            }
            let candidate = requestedSlug;
            for (let attempt = 1; attempt <= 20; attempt++) {
              const clash = await sql`SELECT id FROM articles WHERE slug = ${candidate} AND id != ${id} LIMIT 1`;
              if (clash.length === 0) break;
              candidate = `${requestedSlug}-${attempt + 1}`;
            }
            finalSlug = candidate;
          }
        }

        const sourcesJson = sourcesInput !== undefined
          ? JSON.stringify(sourcesInput)
          : existing.sources_json;

        const rows = await sql`
          UPDATE articles
          SET
            title = COALESCE(${title ?? null}, title),
            meta_description = COALESCE(${metaDescription ?? null}, meta_description),
            body_markdown = COALESCE(${bodyMarkdown ?? null}, body_markdown),
            quick_answer = COALESCE(${quickAnswer ?? null}, quick_answer),
            sources_json = ${sourcesJson},
            slug = ${finalSlug},
            updated_at = now()
          WHERE id = ${id}
          RETURNING *
        `;
        return { row: rows[0] as ArticleRow };
      });

      if ('error' in result) {
        if (result.error === 'not_found') {
          res.status(404).json({ success: false, error: 'Article not found.' });
        } else {
          res.status(409).json({ success: false, error: "Can't change the web address of a published article. Unpublish it first if you need to change it." });
        }
        return;
      }
      res.json({ success: true, article: toApiShape(result.row) });
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
