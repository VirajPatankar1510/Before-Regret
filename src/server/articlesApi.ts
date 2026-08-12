import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { buildArticlePrompt } from './articleGenerator.js';
import { GEMINI_MODEL, isQuotaError } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import type { GenerateContentResponseUsageMetadata } from '@google/genai';
import { submitUrlsToIndexNow } from '../utils/indexNowService.js';
import { triggerRedeploy } from './deployHookService.js';

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
  faq_json: string;
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
  let faqItems: { question: string; answer: string }[] = [];
  try {
    const parsed = JSON.parse(row.faq_json || '[]');
    if (Array.isArray(parsed)) {
      faqItems = parsed.filter(
        (item): item is { question: string; answer: string } =>
          item && typeof item.question === 'string' && typeof item.answer === 'string'
      );
    }
  } catch {
    faqItems = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    bodyMarkdown: row.body_markdown,
    quickAnswer: row.quick_answer,
    sources,
    faqItems,
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

export function slugify(input: string): string {
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
    // Real search phrases from the admin panel's keyword-research lookup (see
    // keywordResearchApi.ts) -- capped at 10 so the prompt stays about the article's own topic,
    // not a keyword dump. The client already mixes short-tail and long-tail phrases before
    // sending these (see SeoAdminPanel.tsx), so this is just a hard ceiling, not the selection.
    const relatedKeywords = Array.isArray(req.body?.relatedKeywords)
      ? req.body.relatedKeywords
          .filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0)
          .slice(0, 10)
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
      const { systemInstruction, contents } = buildArticlePrompt(topic, existingTitles, exactTitle, relatedKeywords);

      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders?.();

      // Gemini's streaming usageMetadata is cumulative per chunk, not incremental -- the last
      // chunk that carries it reflects the full call's totals, so overwriting on every chunk
      // rather than summing is correct here.
      let lastUsage: GenerateContentResponseUsageMetadata | undefined;
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) res.write(text);
        if (chunk.usageMetadata) lastUsage = chunk.usageMetadata;
      }
      logGeminiUsage('article_generation', GEMINI_MODEL, lastUsage);
      res.end();
    } catch (err: any) {
      console.error('[articles] generate failed:', err);
      if (!res.headersSent) {
        // A quota 429 and a transient fault need opposite advice, and the old blanket
        // "AI generation failed. Try again." told someone to do the one thing that cannot work --
        // the free-tier cap is per day, so retrying just fails again with no explanation why.
        if (isQuotaError(err)) {
          res.status(429).json({
            success: false,
            error: `Gemini's daily quota for ${GEMINI_MODEL} is used up, so retrying won't help until it resets. Quota is per model, so setting GEMINI_MODEL to another one (e.g. gemini-3.5-flash) works around it; enabling billing on the Gemini API project removes the cap entirely.`,
          });
        } else {
          res.status(500).json({ success: false, error: 'AI generation failed. Try again.' });
        }
      } else {
        res.end();
      }
    }
  });

  // --- Admin: list all (drafts and published) -------------------------------------------------
  // --- Admin: Gemini token usage / cost summary, for the live counter in SeoAdminPanel.tsx -----
  app.get('/api/admin/gemini-usage', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    try {
      // Three window sizes computed in one round trip rather than three separate queries -- each
      // FILTER clause sums against the same scanned rows. estimated_cost_usd can be NULL (unknown
      // model pricing, see geminiUsageTracker.ts); SUM() over an all-NULL group correctly returns
      // NULL rather than 0, which the client renders as "cost unknown" instead of a false "$0.00".
      const rows = await withDb((sql) => sql`
        SELECT
          COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today_tokens,
          SUM(estimated_cost_usd) FILTER (WHERE created_at >= CURRENT_DATE) AS today_cost_usd,
          COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= date_trunc('month', now())), 0) AS month_tokens,
          SUM(estimated_cost_usd) FILTER (WHERE created_at >= date_trunc('month', now())) AS month_cost_usd,
          COALESCE(SUM(total_tokens), 0) AS all_time_tokens,
          SUM(estimated_cost_usd) AS all_time_cost_usd,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today_calls,
          COUNT(*) AS all_time_calls
        FROM gemini_usage_log
      `);
      const recent = await withDb((sql) => sql`
        SELECT created_at, source, model, total_tokens, estimated_cost_usd
        FROM gemini_usage_log ORDER BY created_at DESC LIMIT 20
      `);
      const row = (rows as unknown as Array<Record<string, unknown>>)[0];
      res.json({
        success: true,
        usage: {
          today: { tokens: Number(row.today_tokens), costUsd: row.today_cost_usd === null ? null : Number(row.today_cost_usd), calls: Number(row.today_calls) },
          month: { tokens: Number(row.month_tokens), costUsd: row.month_cost_usd === null ? null : Number(row.month_cost_usd) },
          allTime: { tokens: Number(row.all_time_tokens), costUsd: row.all_time_cost_usd === null ? null : Number(row.all_time_cost_usd), calls: Number(row.all_time_calls) },
          model: GEMINI_MODEL,
          recent: (recent as unknown as Array<{ created_at: string; source: string; model: string; total_tokens: number; estimated_cost_usd: number | null }>),
        },
      });
    } catch (err: any) {
      console.error('[gemini-usage] fetch failed:', err);
      res.status(500).json({ success: false, error: 'Could not load usage data.' });
    }
  });

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
    const faqItemsInput = Array.isArray(req.body?.faqItems)
      ? req.body.faqItems
          .filter((item: unknown): item is { question: unknown; answer: unknown } => typeof item === 'object' && item !== null)
          .map((item: { question: unknown; answer: unknown }) => ({
            question: typeof item.question === 'string' ? item.question.trim() : '',
            answer: typeof item.answer === 'string' ? item.answer.trim() : '',
          }))
          .filter((item: { question: string; answer: string }) => item.question && item.answer)
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
        const faqJson = faqItemsInput !== undefined
          ? JSON.stringify(faqItemsInput)
          : existing.faq_json;

        const rows = await sql`
          UPDATE articles
          SET
            title = COALESCE(${title ?? null}, title),
            meta_description = COALESCE(${metaDescription ?? null}, meta_description),
            body_markdown = COALESCE(${bodyMarkdown ?? null}, body_markdown),
            quick_answer = COALESCE(${quickAnswer ?? null}, quick_answer),
            sources_json = ${sourcesJson},
            faq_json = ${faqJson},
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

      // Only when the edit landed on an already-live article -- see deployHookService.ts. A
      // draft's PUT (the first save inside publishNow, before the follow-up POST /publish call)
      // doesn't need this: nothing is live yet for that slug, so there's no stale static page to
      // fix. This is exactly the gap the Update button was built to close (editing a published
      // article without unpublish/republish) -- without this trigger, Update would silently save
      // to the database while the live page kept showing the old content until the next
      // unrelated deploy, the same staleness bug this whole fix exists for.
      if (result.row.status === 'published') {
        triggerRedeploy(`article ${id} updated`);
      }
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

      // Fire-and-forget: the response above already went out, and submitUrlsToIndexNow never
      // throws (it catches its own network errors and returns a simulated-success result -- see
      // src/utils/indexNowService.ts), so there's nothing here that could fail the publish action
      // itself. Previously this only ran if someone manually POSTed to /api/seo/indexnow after the
      // fact, which nothing in the admin UI ever did -- every published guide before this sat
      // waiting for organic crawl discovery instead of announcing itself.
      submitUrlsToIndexNow([`https://www.beforeregret.com/guides/${row.slug}/`]).then((result) => {
        if (!result.success) {
          console.warn('[articles] IndexNow submission on publish failed:', result.message);
        }
      });

      // See deployHookService.ts -- the static prerendered page for this slug won't exist (or
      // will still show old content, if this slug was published before) until a new deploy runs.
      triggerRedeploy(`article ${id} published`);
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

      // IndexNow explicitly supports notifying on removed content, not just new/updated -- without
      // this, an unpublished guide sits fully indexed until a search engine's next natural recrawl
      // happens to notice it now 404s, instead of being told immediately.
      submitUrlsToIndexNow([`https://www.beforeregret.com/guides/${row.slug}/`]).then((result) => {
        if (!result.success) {
          console.warn('[articles] IndexNow submission on unpublish failed:', result.message);
        }
      });

      // See deployHookService.ts -- without a new deploy, the static page keeps serving the now-
      // unpublished content indefinitely instead of a genuine 404.
      triggerRedeploy(`article ${id} unpublished`);
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
      const rows = await withDb((sql) => sql`DELETE FROM articles WHERE id = ${id} RETURNING slug, status`);
      const row = (rows as unknown as Array<{ slug: string; status: string }>)[0];
      res.json({ success: true });

      // Same reasoning as the unpublish route above -- a deleted guide's URL should be reported
      // gone immediately, not left for the next natural recrawl to discover.
      if (row?.slug) {
        submitUrlsToIndexNow([`https://www.beforeregret.com/guides/${row.slug}/`]).then((result) => {
          if (!result.success) {
            console.warn('[articles] IndexNow submission on delete failed:', result.message);
          }
        });
      }

      // See deployHookService.ts -- only matters if the deleted article was actually live; a
      // draft was never baked into a static file. This is the exact bug that prompted the whole
      // deploy-hook fix: deleting a published article and republishing a new one under the same
      // slug left the OLD one's static page (and its __PRELOADED_GUIDE__ data) serving
      // indefinitely, immune to hard refresh, until the next unrelated deploy happened to run.
      if (row?.status === 'published') {
        triggerRedeploy(`article ${id} deleted`);
      }
    } catch (err: any) {
      console.error('[articles] delete failed:', err);
      res.status(500).json({ success: false, error: 'Could not delete the article.' });
    }
  });

  // --- Public: list published articles (guides index + sitemap) --------------------------------
  // Deliberately a narrow column list rather than SELECT * -> toApiShape. Three consumers hit this
  // route -- Footer.tsx (four links, on every page of the site), GuidesIndexView, and
  // GuidePageView's Related Guides ranking -- and not one of them reads a guide's body; the four
  // fields below are the complete set they render between them. SELECT * meant every page load
  // shipped all 42 published articles' full body_markdown, faq_json and sources_json: 452 KB
  // uncompressed to draw a handful of titles, and the single largest item in the homepage's
  // critical path (PageSpeed clocked it at 3,781 ms on throttled mobile, ahead of the JS bundle).
  // A guide's actual content is still served, one at a time, by /api/guides/:slug below.
  app.get('/api/guides', async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.json({ success: true, articles: [] });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, title, meta_description, published_at
        FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      const articles = (rows as unknown as Array<
        Pick<ArticleRow, 'slug' | 'title' | 'meta_description' | 'published_at'>
      >).map((row) => ({
        slug: row.slug,
        title: row.title,
        metaDescription: row.meta_description,
        publishedAt: row.published_at,
      }));
      res.json({ success: true, articles });
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
