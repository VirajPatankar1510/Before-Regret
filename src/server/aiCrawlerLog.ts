import { withDb, isDbConfigured } from './db.js';

export { detectAiCrawler } from '../utils/detectAiCrawler.js';

// Fire-and-forget by design, same convention as indexNowService.ts's submitUrlsToIndexNow and
// deployHookService.ts's triggerRedeploy -- this is passive observation, and a logging failure
// (DB hiccup, cold start) must never affect the actual response being served. Never awaited by
// its caller.
//
// Called from POST /api/internal/log-ai-crawler (server.ts), not from an Express middleware
// directly. Confirmed live that guide/county/homepage/legal pages are served as static files by
// Vercel's filesystem-priority routing, which wins the race over the vercel.json rewrite that
// leads to this Express app entirely -- the same mechanism documented at length in
// prerender-legal-pages.tsx for the identical /refund-policy bug. An Express-level middleware here
// would only ever see traffic to routes with no matching static file (API routes, 410/legacy
// paths), missing nearly all real content traffic -- exactly where an AI crawler would actually
// fetch from. middleware.ts (Vercel Edge Middleware, which runs before static-file resolution)
// does the detection and forwards a match here with a fire-and-forget fetch, so this function
// only has to worry about the DB write.
export async function logAiCrawlerVisit(botName: string, path: string, userAgent: string): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await withDb((sql) => sql`
      INSERT INTO ai_crawler_visits (bot_name, path, user_agent) VALUES (${botName}, ${path}, ${userAgent})
    `);
  } catch (err) {
    console.warn('[ai-crawler-log] failed to record visit:', err);
  }
}
