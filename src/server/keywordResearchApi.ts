import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth.js';
import { isSearchConsoleConfigured, fetchTopSearchQueries } from './searchConsoleService.js';

// Admin-only keyword research: real Google queries this site already gets impressions for,
// scoped to a seed term. See searchConsoleService.ts for the setup this depends on and why
// `configured: false` (rather than a 500) is the expected response until that setup is done.
export function registerKeywordResearchRoutes(app: Express) {
  app.get('/api/admin/keyword-research', requireAdmin, async (req: Request, res: Response) => {
    if (!isSearchConsoleConfigured()) {
      res.json({ success: true, configured: false, rows: [] });
      return;
    }
    try {
      const seedTerm = typeof req.query.q === 'string' ? req.query.q : undefined;
      const rows = await fetchTopSearchQueries(seedTerm);
      res.json({ success: true, configured: true, rows });
    } catch (err: any) {
      console.error('[keyword-research] Search Console query failed:', err);
      res.status(502).json({ success: false, configured: true, error: 'Search Console query failed.' });
    }
  });
}
