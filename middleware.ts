import { detectAiCrawler } from './src/utils/detectAiCrawler.js';

// Vercel Edge Middleware: runs BEFORE Vercel decides how to route a request, which is what makes
// this the only place in this codebase that can see traffic to guide/county/homepage/legal
// pages. Those are all prerendered static files (scripts/prerender-guides.tsx et al.), and
// Vercel's filesystem-priority routing serves a matching static file directly, winning the race
// over the vercel.json rewrite that leads to the Express app in server.ts -- confirmed live,
// twice: once for /refund-policy (see prerender-legal-pages.tsx's own history of that bug), and
// again while building this feature, when an Express-level app.use() middleware correctly logged
// a bot hit on /court (no static file, reaches Express) but silently missed every hit on an
// actual guide page (a static file, never reaches Express at all).
//
// Deliberately does almost nothing itself: detectAiCrawler is a pure, zero-dependency string
// match (see that file's own comment for why it's factored out from src/server/aiCrawlerLog.ts
// specifically so nothing here can accidentally pull the Neon driver's schema-ensuring code into
// this restricted edge runtime), and the actual DB write happens in a normal Express route
// (POST /api/internal/log-ai-crawler in server.ts) that this fire-and-forget POSTs to. Never
// returns a Response -- returning undefined lets Vercel continue exactly as if this file did not
// exist, so this can never block, redirect, slow, or otherwise alter any real request.
export const config = {
  matcher: '/:path*',
};

export default function middleware(request: Request, context: { waitUntil?: (promise: Promise<unknown>) => void }) {
  const userAgent = request.headers.get('user-agent') || '';
  const bot = detectAiCrawler(userAgent);
  if (!bot) return;

  const url = new URL(request.url);
  const logPromise = fetch(`${url.origin}/api/internal/log-ai-crawler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botName: bot, path: url.pathname, userAgent }),
  }).catch(() => {
    // Best-effort only -- a failed log POST must never surface anywhere a real visitor (or bot)
    // would notice, and there is nothing useful to do with the error here.
  });

  // Without this, the edge runtime can reclaim the execution context as soon as this function
  // returns, killing the fetch above before it ever reaches the network -- the well-documented
  // "fire-and-forget gets silently dropped" pitfall on every edge/serverless platform with a
  // waitUntil-style API (Cloudflare Workers' ctx.waitUntil is the same pattern). Guarded because
  // this is typed structurally rather than via a @vercel/edge dependency this project doesn't
  // otherwise need -- if a future runtime ever omits it, this still degrades to "best-effort,
  // sometimes dropped" rather than throwing.
  context?.waitUntil?.(logPromise);
}
