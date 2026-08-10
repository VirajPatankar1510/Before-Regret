import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth.js';
import { isSearchConsoleConfigured, fetchTopSearchQueries } from './searchConsoleService.js';
import { isBingKeywordResearchConfigured, fetchRelatedKeywords } from './bingKeywordService.js';

// Admin-only keyword research for the article editor's "Topic" field. Bing is tried first: it
// reports real search interest in a term regardless of whether this site has any existing content
// for it, which is what "what should I write about next" actually needs. Search Console is the
// fallback, not the primary -- it only ever surfaces queries tied to impressions this site
// *already* has, so on a young domain it stays empty no matter what's typed (see
// searchConsoleService.ts). Both `configured: false` and any live query failure return a 200/502
// with a plain flag rather than crashing the request, matching this file's existing "fail
// visibly, not silently" pattern.
export function registerKeywordResearchRoutes(app: Express) {
  app.get('/api/admin/keyword-research', requireAdmin, async (req: Request, res: Response) => {
    const seedTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (isBingKeywordResearchConfigured()) {
      try {
        const rows = await fetchRelatedKeywords(seedTerm);
        res.json({ success: true, configured: true, source: 'bing', rows });
      } catch (err: any) {
        console.error('[keyword-research] Bing query failed:', err);
        res.status(502).json({ success: false, configured: true, source: 'bing', error: 'Bing keyword research failed.' });
      }
      return;
    }

    if (isSearchConsoleConfigured()) {
      try {
        const rows = await fetchTopSearchQueries(seedTerm || undefined);
        res.json({ success: true, configured: true, source: 'search-console', rows });
      } catch (err: any) {
        console.error('[keyword-research] Search Console query failed:', err);
        res.status(502).json({ success: false, configured: true, source: 'search-console', error: 'Search Console query failed.' });
      }
      return;
    }

    res.json({ success: true, configured: false, rows: [] });
  });
}
