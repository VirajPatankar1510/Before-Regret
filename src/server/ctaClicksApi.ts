import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { detectAiCrawler } from '../utils/detectAiCrawler.js';
import { hashVisitor } from './adClicksApi.js';
import { DECODER_TERMS } from '../data/inspectionDecoderTerms.js';

// Counts clicks on "get a report" calls to action, per page (src/utils/ctaClickBeacon.ts). Owner
// request 2026-10-14: the site-wide bounce rate says three in four visitors leave after one page, and
// nothing measured whether guide readers ever head for a report, or from which guides.
//
// Same conventions as adClicksApi.ts: unique per (page, CTA, visitor, day) via a unique index, the
// visitor stored only as a salted hash, AI crawlers ignored, and the endpoint always answers 204 so a
// measurement failure can never affect the page. Read with scripts/cta-click-report.ts.
const CTAS = new Set(['guide_closing_report', 'nav_free_report']);

// Inspection Report Decoder usage (owner, 2026-10-30: "only for us" -- never displayed on the site). Same table, same
// privacy: a salted visitor hash and the page path only; never the terms a visitor pasted, only which of OUR term ids
// they opened. Read with scripts/decoder-usage-report.ts.
const DECODER_EVENTS = new Set([
  'decoder_view', 'decoder_view_shared', 'decoder_scan_found', 'decoder_scan_none', 'decoder_share', 'decoder_print', 'decoder_guide_click',
]);
const DECODER_TERM_IDS = new Set(DECODER_TERMS.map((t) => t.id));
export const isAllowedCta = (cta: string) =>
  CTAS.has(cta) || DECODER_EVENTS.has(cta) || (cta.startsWith('decoder_open:') && DECODER_TERM_IDS.has(cta.slice('decoder_open:'.length)));

export function registerCtaClickRoutes(app: Express) {
  app.post('/api/cta-click', async (req: Request, res: Response) => {
    // Write first, then answer 204 -- on Vercel the function may be frozen the moment the response is
    // sent, so replying first dropped every click (caught in the first live test, 2026-10-14).
    try {
      if (!isDbConfigured()) return;
      if (detectAiCrawler(String(req.headers['user-agent'] || ''))) return;
      const { cta, page } = req.body || {};
      if (typeof cta !== 'string' || cta.length > 80 || !isAllowedCta(cta)) return;
      if (typeof page !== 'string' || !page.startsWith('/') || page.length > 200) return;
      const path = page.split('?')[0].split('#')[0];
      await withDb((sql) => sql`
        INSERT INTO cta_clicks (page_path, cta, click_day, visitor_hash)
        VALUES (${path}, ${cta}, current_date, ${hashVisitor(req)})
        ON CONFLICT DO NOTHING
      `);
    } catch (err) {
      console.error('[cta-clicks] could not record click:', err);
    } finally {
      res.status(204).end();
    }
  });
}
