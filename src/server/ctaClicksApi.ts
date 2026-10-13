import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { detectAiCrawler } from '../utils/detectAiCrawler.js';
import { hashVisitor } from './adClicksApi.js';

// Counts clicks on "get a report" calls to action, per page (src/utils/ctaClickBeacon.ts). Owner
// request 2026-10-14: the site-wide bounce rate says three in four visitors leave after one page, and
// nothing measured whether guide readers ever head for a report, or from which guides.
//
// Same conventions as adClicksApi.ts: unique per (page, CTA, visitor, day) via a unique index, the
// visitor stored only as a salted hash, AI crawlers ignored, and the endpoint always answers 204 so a
// measurement failure can never affect the page. Read with scripts/cta-click-report.ts.
const CTAS = new Set(['guide_closing_report', 'nav_free_report']);

export function registerCtaClickRoutes(app: Express) {
  app.post('/api/cta-click', async (req: Request, res: Response) => {
    res.status(204).end();
    if (!isDbConfigured()) return;
    if (detectAiCrawler(String(req.headers['user-agent'] || ''))) return;
    const { cta, page } = req.body || {};
    if (typeof cta !== 'string' || !CTAS.has(cta)) return;
    if (typeof page !== 'string' || !page.startsWith('/') || page.length > 200) return;
    const path = page.split('?')[0].split('#')[0];
    try {
      await withDb((sql) => sql`
        INSERT INTO cta_clicks (page_path, cta, click_day, visitor_hash)
        VALUES (${path}, ${cta}, current_date, ${hashVisitor(req)})
        ON CONFLICT DO NOTHING
      `);
    } catch (err) {
      console.error('[cta-clicks] could not record click:', err);
    }
  });
}
