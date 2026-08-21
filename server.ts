import express, { type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { generateSitemapIndexXml, generateChildSitemapXml, generateRobotsTxt } from "./src/utils/sitemapGenerator.js";
import { submitUrlsToIndexNow, INDEXNOW_KEY } from "./src/utils/indexNowService.js";
import { runAddressGate } from "./src/engine/geoValidationGate.js";
import { fetchSeismicHazardFinding } from "./src/engine/seismicHazard.js";
import { fetchNeighborhoodContextFinding } from "./src/engine/neighborhoodContext.js";
import { getInspectionPriorities } from "./src/engine/inspectionPriorities.js";
import { getSellerQuestions } from "./src/engine/sellerQuestions.js";
import { FINDING_TRADE_CATEGORY, PRIORITY_TRADE_CATEGORY, SELLER_QUESTION_TRADE_CATEGORY } from "./src/data/sponsoredVendors.js";
import {
  isAdminConfigured,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  hasValidSession,
  createPendingTotpTicket,
  isValidPendingTotpTicket,
  verifyTotpCode,
} from "./src/server/adminAuth.js";
import { registerArticleRoutes } from "./src/server/articlesApi.js";
import { registerCountyRoutes } from "./src/server/countiesApi.js";
import { registerHomepageRoutes } from "./src/server/homepageApi.js";
import { registerKeywordResearchRoutes } from "./src/server/keywordResearchApi.js";
import { registerNewsCoverageRoutes } from "./src/server/newsCoverageApi.js";
import { registerQuestionQueueRoutes } from "./src/server/questionQueueApi.js";
import { registerGuideAdsRoutes } from "./src/server/guideAdsApi.js";
import { registerZipAdsRoutes, fetchActiveZipVendors } from "./src/server/zipAdsApi.js";
import { registerMyAdsRoutes } from "./src/server/myAdsApi.js";
import { registerTermsRoutes } from "./src/server/termsApi.js";
import { registerCountyEventsRoutes } from "./src/server/countyEventsApi.js";
import { registerCountyComparisonRoutes } from "./src/server/countyComparisonApi.js";
import { registerCountyInsuranceRoutes } from "./src/server/countyInsuranceApi.js";
import { registerDefectReferenceRoutes } from "./src/server/defectReferenceApi.js";
import { registerPublicApiV1Routes } from "./src/server/publicApiV1.js";
import { registerFunnelRoutes } from "./src/server/funnelApi.js";
import { normalizeCountyKey } from "./src/utils/normalizeCounty.js";
import { REPORT_GENERATION_MODELS, generateContentWithFallback } from "./src/server/geminiModel.js";
import { logGeminiUsage } from "./src/server/geminiUsageTracker.js";
import { checkAndReserveReportGenerationCapacity } from "./src/server/reportGenerationLimiter.js";
import {
  isPayPalConfigured,
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder
} from "./src/server/paypalService.js";
import {
  createTransaction,
  updateTransaction,
  getTransaction,
  isDbConfigured,
  withDb,
  saveGeneratedReportInputs,
  getGeneratedReportBody
} from "./src/server/db.js";
import { isLegacyGonePath } from './src/data/legacyUrls.js';
import { isClerkBackendConfigured } from "./src/server/clerkAuth.js";
import { logAiCrawlerVisit } from "./src/server/aiCrawlerLog.js";

dotenv.config();

// Every top-level path the SPA's client-side router (App.tsx's resolveRouteFromPath) recognizes
// as a real page, aside from '/', guide/county slugs, and paths with their own dedicated Express
// route registered above (e.g. /report/:id, which 301-redirects before ever reaching the
// catch-all). Used by the production catch-all below to decide whether an unmatched path is a
// real client-only route (serve the shell, 200) or genuinely dead (serve the shell's "Not Found"
// state, but with a real 404 status -- see that handler for why this matters for search indexing).
// Hand-kept in sync with resolveRouteFromPath since there's no shared module between client and
// server routing yet; a path added there needs adding here too.
const KNOWN_STATIC_ROUTE_PREFIXES = [
  '/advertise', '/my-ads', '/topic-ads', '/report-ads',
  '/about', '/support', '/terms', '/privacy', '/refunds', '/refund-policy', '/disclaimer',
  '/accessibility',
  '/payment-success', '/payment-cancelled',
  '/admin/seo',
  '/guides/', '/counties/',
  '/insights/', '/report/', '/reports/',
];

// Only read when this file bootstraps its own listener (npm run dev / npm start); Vercel never
// reaches the app.listen() below. The env override exists so the dev server and a local
// production build (node dist/server.cjs, serving the real prerendered dist/) can run at the same
// time on different ports -- verifying prerendered output requires the built server, and it can't
// take port 3000 while the dev server is holding it.
const PORT = Number(process.env.PORT) || 3000;

// Builds and returns the fully-configured Express app, without binding a port. Shared by the
// local/traditional-server bootstrap below (startServer) and the Vercel serverless entry point
// (api/index.ts) -- Vercel's runtime invokes the app directly per-request and must never see
// app.listen() called, since there's no persistent process to bind a port on.
export async function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- AI crawler visibility logging -------------------------------------------------------
  // Detection happens in middleware.ts (Vercel Edge Middleware, which runs before Vercel's
  // filesystem-priority static-file serving -- the only way to see traffic to guide/county/
  // homepage pages, which are all prerendered static files that never reach this Express app at
  // all). This route is just the DB-write half: middleware.ts fire-and-forget POSTs here with the
  // bot name it already matched, since the Neon driver's schema-ensuring code has no business
  // running inside an edge isolate. No auth -- this is a same-origin, fire-and-forget internal
  // call carrying no sensitive data (a bot name, a path, a user-agent string), and requiring auth
  // would mean provisioning and shipping a secret to the edge runtime for no real protection.
  // Always responds 204 immediately without awaiting the write, matching logAiCrawlerVisit's own
  // fire-and-forget contract -- a slow or failed DB write must never make this endpoint (or the
  // edge middleware's fetch to it) hang or error.
  app.post('/api/internal/log-ai-crawler', (req, res) => {
    res.status(204).end();
    const { botName, path, userAgent } = req.body || {};
    if (typeof botName === 'string' && typeof path === 'string' && typeof userAgent === 'string') {
      void logAiCrawlerVisit(botName, path, userAgent);
    }
  });

  // --- Admin authentication ---------------------------------------------------------------
  // Guards /admin/*. Before this existed, the pSEO control panel at /admin/seo was reachable by
  // anyone who knew the URL -- `noindex` only hides a page from search results, it does not
  // restrict access. See src/server/adminAuth.ts for why the gate is server-side.

  // Best-effort brute-force slowdown. Deliberately in-memory: on Vercel each serverless instance
  // has its own copy, so this is a speed bump rather than a real distributed rate limiter -- it
  // raises the cost of guessing without pretending to be airtight. A proper implementation needs
  // the shared datastore that's coming with the CMS work.
  const loginAttempts = new Map<string, { count: number; firstAttemptAt: number }>();
  const totpAttempts = new Map<string, { count: number; firstAttemptAt: number }>();
  const LOGIN_WINDOW_MS = 15 * 60 * 1000;
  const MAX_LOGIN_ATTEMPTS = 10;
  const MAX_TOTP_ATTEMPTS = 10;

  function checkAndRecordAttempt(store: Map<string, { count: number; firstAttemptAt: number }>, ip: string): boolean {
    const now = Date.now();
    const record = store.get(ip);
    if (record && now - record.firstAttemptAt < LOGIN_WINDOW_MS && record.count >= MAX_LOGIN_ATTEMPTS) {
      return false;
    }
    if (!record || now - record.firstAttemptAt >= LOGIN_WINDOW_MS) {
      store.set(ip, { count: 1, firstAttemptAt: now });
    } else {
      record.count += 1;
    }
    return true;
  }

  function requestIp(req: Request): string {
    return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  }

  // Best-effort identity capture for generate-report, NOT a gate -- unlike requireVerifiedUser
  // (clerkAuth.ts), a missing, expired, or unverifiable token here never blocks the request. The
  // client always requires Clerk sign-in before this endpoint is reachable at all (see
  // ReportGatingModal.tsx), but the endpoint itself has never enforced that server-side, and
  // adding a hard requirement now would 401 every existing report-generation caller that doesn't
  // yet send the header. This only upgrades the audit row saved by saveGeneratedReportInputs from
  // anonymous to attributable when a valid token happens to be present.
  async function optionalVerifiedUserId(req: Request): Promise<string | null> {
    if (!isClerkBackendConfigured()) return null;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    try {
      const { verifyToken } = await import('@clerk/backend');
      const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY as string });
      return verified.sub;
    } catch {
      return null;
    }
  }

  // Step 1 of 2: password only. Deliberately does NOT set the real session cookie -- a correct
  // password returns a short-lived "pending" ticket instead, so the second factor below is a real
  // gate rather than a client-side-only formality that the server would honor even if skipped.
  app.post("/api/admin/login", (req, res) => {
    if (!isAdminConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Admin access is not set up on this server yet.',
      });
      return;
    }

    const ip = requestIp(req);
    if (!checkAndRecordAttempt(loginAttempts, ip)) {
      res.status(429).json({ success: false, error: 'Too many attempts. Try again in a few minutes.' });
      return;
    }

    if (!verifyPassword(req.body?.password)) {
      res.status(401).json({ success: false, error: 'That password is not correct.' });
      return;
    }

    loginAttempts.delete(ip);
    res.json({ success: true, requiresTotp: true, ticket: createPendingTotpTicket() });
  });

  // Step 2 of 2: the 6-digit authenticator code. Only this step ever sets the real session
  // cookie. Rate-limited separately from the password step -- a 6-digit code is a much smaller
  // search space, so it needs its own throttle rather than sharing a budget with password guesses.
  app.post("/api/admin/login/verify-totp", (req, res) => {
    if (!isAdminConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Admin access is not set up on this server yet.',
      });
      return;
    }

    const ip = requestIp(req);
    if (!checkAndRecordAttempt(totpAttempts, ip)) {
      res.status(429).json({ success: false, error: 'Too many attempts. Try again in a few minutes.' });
      return;
    }

    if (!isValidPendingTotpTicket(req.body?.ticket)) {
      res.status(401).json({ success: false, error: 'Your sign-in attempt expired. Please enter your password again.' });
      return;
    }

    if (!verifyTotpCode(process.env.ADMIN_TOTP_SECRET as string, req.body?.code)) {
      res.status(401).json({ success: false, error: 'That code is not correct.' });
      return;
    }

    totpAttempts.delete(ip);
    setSessionCookie(res, createSessionToken());
    res.json({ success: true });
  });

  app.post("/api/admin/logout", (req, res) => {
    clearSessionCookie(res);
    res.json({ success: true });
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({
      success: true,
      configured: isAdminConfigured(),
      signedIn: hasValidSession(req),
    });
  });

  // --- Articles (Neon-backed) ---------------------------------------------------------------
  // Admin create/edit/publish routes plus the public /api/guides read routes GuidePageView and
  // the sitemap generator use. See src/server/articlesApi.ts and src/server/db.ts.
  registerArticleRoutes(app);

  // --- County research pages (Neon-backed) --------------------------------------------------
  // Public /api/counties/:slug read route only, no admin routes -- these rows are populated by
  // scripts/fetch-county-data.ts, not through an admin editor. See src/server/countiesApi.ts.
  registerCountyRoutes(app);

  // --- Homepage content sections (Neon-backed) ----------------------------------------------
  // Public read route feeding the homepage's guide clusters, research pages, and county coverage.
  // In production the same data is baked into dist/index.html by scripts/prerender-homepage.tsx;
  // this route serves dev and client-side navigations back to '/'. See src/server/homepageApi.ts.
  registerHomepageRoutes(app);

  // --- Keyword research for the admin article editor (Google Search Console-backed) ---------
  // Admin-only. See src/server/searchConsoleService.ts for the one-time service-account setup
  // this depends on; the route responds with configured: false rather than erroring until then.
  registerKeywordResearchRoutes(app);
  registerNewsCoverageRoutes(app);
  registerQuestionQueueRoutes(app);

  // --- Vendor ad slots on guide pages (Neon-backed, PayPal-billed) --------------------------
  // Self-serve, open-market, no vendor login. See src/server/guideAdsApi.ts.
  registerGuideAdsRoutes(app);

  // --- ZIP-targeted vendor ad slots inside reports (Neon-backed, PayPal-billed) --------------
  // Self-serve, per-(zip, trade category) checkout, no vendor login. Replaces the old
  // interest-capture-only /api/vendor-slots and /api/vendor-interest routes. See
  // src/server/zipAdsApi.ts.
  registerZipAdsRoutes(app);

  // --- Vendor placement manager (Neon-backed) -------------------------------------------------
  // /my-ads: everything a signed-in vendor has bought across both ad products -- proof of
  // purchase, expiry, and contact-detail edits. No traffic/visibility stats by design. See
  // src/server/myAdsApi.ts.
  registerMyAdsRoutes(app);

  // --- Consumer Terms acceptance ledger (Neon-backed) -----------------------------------------
  // Records that a signed-in consumer affirmatively accepted the current Terms revision, for the
  // free-report and paid-report paths. See src/server/termsApi.ts for why this is its own
  // endpoint rather than a field on the report-generation route.
  registerTermsRoutes(app);

  // --- FEMA-declaration county-event drafter (Neon-backed) ------------------------------------
  // Checks OpenFEMA for new disaster declarations in counties BeforeRegret already covers with
  // real federal data, and drafts an article for each new match. Triggered daily by Vercel Cron
  // (see vercel.json) and by a manual button in the SEO admin panel. Every draft lands in the
  // same articles table as any other guide -- a human reviews and publishes it, nothing here
  // ever publishes on its own. See src/server/countyEventsApi.ts.
  registerCountyEventsRoutes(app);

  // --- Original data journalism report generator (Neon-backed) --------------------------------
  // Admin-triggered, not event-triggered -- ranks every covered county by real Census housing-age
  // data (computed in plain code, never by Gemini) and drafts an article around the real table.
  // See src/server/countyComparisonApi.ts.
  registerCountyComparisonRoutes(app);
  registerCountyInsuranceRoutes(app);

  // --- Era x defect reference library generator (Neon-backed) ---------------------------------
  // One-shot batch: drafts a page per material/system defect (knob-and-tube, polybutylene, etc.),
  // each ranking covered counties by real Census housing-age data for that defect's era. See
  // src/server/defectReferenceApi.ts.
  registerDefectReferenceRoutes(app);

  // --- Public API v1 (Neon-backed, cached, rate-limited) -------------------------------------
  // The documented, agent-facing surface for county hazard data and the guide index. Separate
  // from /api/counties/:slug and /api/guides above -- those stay exactly as they are, still used
  // internally by the React app with no cache headers and no rate limit, which is fine when the
  // only caller is your own frontend. This is the version meant to be published, crawled, and
  // linked from llms.txt and robots.txt. See src/server/publicApiV1.ts.
  registerPublicApiV1Routes(app);
  registerFunnelRoutes(app);

  // Master Sitemap Index Endpoint (/sitemap.xml and /sitemaps/sitemap-index.xml)
  app.get(["/sitemap.xml", "/sitemaps/sitemap-index.xml"], async (req, res) => {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(await generateSitemapIndexXml());
  });

  // Child Modular Sitemap Endpoints (/sitemaps/sitemap-pages.xml, /sitemaps/sitemap-guides.xml)
  app.get("/sitemaps/:sitemapName", async (req, res) => {
    const { sitemapName } = req.params;
    const xml = await generateChildSitemapXml(sitemapName);
    if (xml === null) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });

  // Robots.txt Endpoint
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(generateRobotsTxt());
  });

  // IndexNow Key Verification File
  app.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(INDEXNOW_KEY);
  });

  // IndexNow API Submission Proxy Endpoint
  app.post("/api/seo/indexnow", async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ success: false, error: "Array of URLs is required." });
      return;
    }
    const result = await submitUrlsToIndexNow(urls);
    res.json(result);
  });


  // In-memory store for standalone report URLs and deep linking
  const reportsStore = new Map<string, any>();

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "BeforeRegret - Property Research Assistant (USA)",
      version: "4.0.0"
    });
  });

  // Map geocoding & tile proxy (LocationIQ exclusive)
  // Keeps the API key server-side only. All map search, reverse geocoding, and map tiles
  // are served exclusively via LocationIQ.
  app.get("/api/geocode/search", async (req, res) => {
    const { q, limit, addressdetails, countrycodes } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "q is required." });
      return;
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "Map search is not configured. Set LOCATIONIQ_API_KEY." });
      return;
    }

    try {
      const params = new URLSearchParams({
        key: apiKey,
        q,
        format: "json",
        addressdetails: (addressdetails as string) || "1",
        limit: (limit as string) || "5",
      });
      if (countrycodes && typeof countrycodes === "string") {
        params.set("countrycodes", countrycodes);
      }
      const upstream = await fetch(`https://us1.locationiq.com/v1/search?${params.toString()}`);
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: "Map search provider error." });
        return;
      }
      const data = await upstream.json();
      res.json(data);
    } catch (err) {
      console.error("[LocationIQ Search Proxy Error]:", err);
      res.status(502).json({ error: "Map search is temporarily unavailable." });
    }
  });

  app.get("/api/geocode/reverse", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      res.status(400).json({ error: "lat and lon are required." });
      return;
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "Map search is not configured. Set LOCATIONIQ_API_KEY." });
      return;
    }

    try {
      const params = new URLSearchParams({
        key: apiKey,
        lat: lat as string,
        lon: lon as string,
        format: "json",
        addressdetails: "1",
        zoom: "18",
      });
      const upstream = await fetch(`https://us1.locationiq.com/v1/reverse?${params.toString()}`);
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: "Map search provider error." });
        return;
      }
      const data = await upstream.json();
      res.json(data);
    } catch (err) {
      console.error("[LocationIQ Reverse Proxy Error]:", err);
      res.status(502).json({ error: "Map search is temporarily unavailable." });
    }
  });

  // Map tile proxy (LocationIQ map tiles)
  app.get("/api/geocode/tiles/:style/:z/:x/:y.png", async (req, res) => {
    const { style, z, x, y } = req.params;
    const apiKey = process.env.LOCATIONIQ_API_KEY;

    if (!apiKey) {
      res.status(503).send("LocationIQ API key required for tiles.");
      return;
    }

    const validStyle = ['streets', 'dark', 'light'].includes(style) ? style : 'streets';

    try {
      const sub = ['a', 'b', 'c'][(parseInt(x || '0', 10) + parseInt(y || '0', 10)) % 3];
      const upstreamUrl = `https://${sub}-tiles.locationiq.com/v3/${validStyle}/r/${z}/${x}/${y}.png?key=${apiKey}`;
      const upstream = await fetch(upstreamUrl);
      if (upstream.ok) {
        const buffer = await upstream.arrayBuffer();
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(buffer));
        return;
      }
      res.status(upstream.status).send("Tile fetch failed");
    } catch (err) {
      console.error("[LocationIQ Tile Proxy Error]:", err);
      res.status(502).send("Tile fetch failed");
    }
  });

  // GET Standalone Report by Unique ID.
  //
  // This used to end in a fabrication. On a miss it generated a placeholder report for "Subject
  // Property, Austin, TX" (with Washington DC coordinates), stamped the requested id on it, and
  // returned success:true -- so ANY id at all produced a confident-looking report about a property
  // nobody had researched, rendered under a "CONFIRMED FOR THIS ADDRESS" heading with an Export PDF
  // button. Because report bodies lived only in the in-memory Map below, which dies with the
  // serverless instance, that was the NORMAL outcome for a reloaded or shared permalink, not an
  // edge case -- including for a report someone had paid $14.99 for.
  //
  // The order now is: same-instance Map (fast path) -> generated_reports.report_json (the durable
  // copy) -> 404. There is deliberately no fourth branch. A report we cannot produce is a 404; the
  // one thing this endpoint must never do again is invent a property.
  app.get(["/api/report/:reportId", "/api/reports/:reportId", "/api/insights/:reportId"], async (req, res) => {
    const { reportId } = req.params;
    if (reportsStore.has(reportId)) {
      res.json({ success: true, report: reportsStore.get(reportId) });
      return;
    }

    if (isDbConfigured()) {
      try {
        const stored = await getGeneratedReportBody(reportId);
        if (stored) {
          // Repopulate the instance cache so a reader paging around the report doesn't re-query.
          reportsStore.set(reportId, stored);
          res.json({ success: true, report: stored });
          return;
        }
      } catch (err) {
        // A database failure is not evidence that the report doesn't exist, so don't say it is.
        console.error(`[insights] Lookup failed for ${reportId}:`, err);
        res.status(503).json({
          success: false,
          error: 'unavailable',
          message: 'We could not load this report just now. Please try again in a moment.',
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      error: 'not_found',
      message: 'This report link is no longer available. Reports generated before August 21, 2026 were not saved, and links can expire.',
    });
  });

  // 301 Redirect /report/:id -> /insights/:id
  app.get(["/report/:reportId", "/reports/:reportId"], (req, res) => {
    const { reportId } = req.params;
    res.redirect(301, `/insights/${reportId}`);
  });

  // 0. Residential-Only Address Validation Gate (Layers 1-3)
  // Synchronous, authoritative check -- called by the map/search UI for real-time feedback
  // AND independently re-run before report generation below, so a bypassed or stale frontend
  // check can never let a non-residential or unsupported address through.
  app.post("/api/address/validate", async (req, res) => {
    const { address, city, state, declaredPropertyType, unitNumber } = req.body;

    if (!address || typeof address !== 'string') {
      res.status(400).json({ error: 'address is required.' });
      return;
    }

    try {
      const gateResult = await runAddressGate(address, city || '', state || '', declaredPropertyType || null, unitNumber || null);
      res.json({ success: true, gate: gateResult });
    } catch (err) {
      // Fail closed: an unexpected error in the gate itself must never be treated as a pass.
      console.error('[Address Gate Error]:', err);
      res.status(200).json({
        success: true,
        gate: {
          canGenerateReport: false,
          blockedAtLayer: 1,
          message: 'Address verification is temporarily unavailable. Please try again in a moment.',
          layer1: { passed: false, code: 'L1_GATE_EXCEPTION', message: 'Unexpected error during validation.' },
        },
      });
    }
  });

  // 1. Research Summary & Public Data Scan Endpoint
  app.post("/api/property/research", async (req, res) => {
    const { address, city, state, zipCode, county, lat, lon, propertyType, displayName, declaredPropertyType, unitNumber } = req.body;

    if (!address && !displayName) {
      res.status(400).json({ error: "Property address or name is required." });
      return;
    }

    const fullAddrStr = address || displayName || 'Subject Property';

    const gateResult = await runAddressGate(fullAddrStr, city || '', state || '', declaredPropertyType || null, unitNumber || null);
    if (!gateResult.canGenerateReport) {
      res.json({
        success: true,
        blocked: true,
        blockedAtLayer: gateResult.blockedAtLayer,
        rejectionReason: gateResult.message,
      });
      return;
    }

    const resolvedMeta = resolvePropertyMetadata(fullAddrStr, city, state, zipCode, county, propertyType);
    const addressKey = resolvedMeta.formattedAddress.toLowerCase();
    const hash = simpleHash(addressKey);

    // NOTE: BeforeRegret does not yet have live API integrations for any of these agencies.
    // Every source below is listed as a reference link only -- foundInfo must stay false and
    // no fabricated record counts may be generated. Do not derive "found" status from a hash
    // of the address; that produced fake, per-address-consistent "results" for data that was
    // never actually queried.
    const publicDataSources = [
      { id: 'fema_nfhl', name: 'FEMA National Flood Hazard Layer (NFHL)', category: 'Environmental' },
      { id: 'epa_superfund', name: 'EPA Envirofacts & Superfund / NPL Sites', category: 'Environmental' },
      { id: 'epa_airnow', name: 'EPA AirNow & AQI Historical Index', category: 'Environmental' },
      { id: 'usgs_radon', name: 'USGS / EPA Indoor Radon Zone Map', category: 'Environmental' },
      { id: 'usda_soil', name: 'USDA Natural Resources Conservation Service Soil Survey', category: 'Environmental' },
      { id: 'usgs_seismic', name: 'USGS National Seismic Hazard Maps', category: 'Hazards' },
      { id: 'usfs_wildfire', name: 'USFS Wildfire Risk to Communities Dataset', category: 'Hazards' },
      { id: 'noaa_storm', name: 'NOAA Severe Weather & Storm Surge Database', category: 'Hazards' },
      { id: 'fema_disaster', name: 'FEMA Historical Disaster Declarations', category: 'Hazards' },
      { id: 'county_assessor', name: 'County Tax Assessor & Parcel Property Records', category: 'Public Records' },
      { id: 'county_recorder', name: 'County Clerk & Deed / Lien Registry', category: 'Public Records' },
      { id: 'muni_permits', name: 'Municipal Building Permit History & Code Enforcement', category: 'Public Records' },
      { id: 'muni_zoning', name: 'Municipal Zoning Code & Land Use Plan', category: 'Zoning & Planning' },
      { id: 'dot_stip', name: 'State Dept of Transportation 5-Year Capital Projects', category: 'Zoning & Planning' },
      { id: 'county_planning', name: 'County Planning Commission Re-Zoning Dockets', category: 'Zoning & Planning' },
      { id: 'fhwa_hpms', name: 'FHWA Traffic Volumes & Highway Performance', category: 'Transit & Noise' },
      { id: 'faa_noise', name: 'FAA Aviation Flight Path & Airport Noise Contours', category: 'Transit & Noise' },
      { id: 'fra_rail', name: 'Federal Railroad Administration Grade Crossings', category: 'Transit & Noise' },
      { id: 'us_dot_transit', name: 'US DOT National Transit Map & Access', category: 'Transit & Noise' },
      { id: 'eia_grid', name: 'U.S. EIA Power Grid & Electric Reliability', category: 'Infrastructure' },
      { id: 'fcc_broadband', name: 'FCC National Broadband Map & Fiber Internet', category: 'Infrastructure' },
      { id: 'epa_sdwis', name: 'EPA Safe Drinking Water Information System', category: 'Utilities' },
      { id: 'county_water', name: 'Municipal Water District & Sewer Authority', category: 'Utilities' },
      { id: 'open_elevation', name: 'USGS National Elevation & Slope Model', category: 'Environmental' },
      { id: 'usace_dams', name: 'U.S. Army Corps of Engineers Dam Inventory', category: 'Hazards' },
      { id: 'usps_carrier', name: 'USPS Address Verification', category: 'Public Records' },
      { id: 'nws_heat', name: 'National Weather Service Extreme Heat Index', category: 'Hazards' },
    ];

    const sourcesList = publicDataSources.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category as any,
      foundInfo: false,
      itemCount: 0,
      details: 'Not yet independently verified for this address. Link provided for your own reference.',
      sourceUrl: getPublicSourceUrl(s.id, resolvedMeta.county, resolvedMeta.city)
    }));

    const usefulSourcesFound = 0;
    const totalSourcesSearched = sourcesList.length;

    const price = 0;
    const priceRationale = `BeforeRegret does not yet have a live, verified data connection for this address. This is a free reference checklist linking to the ${totalSourcesSearched} official public sources so you can look up records yourself.`;

    const categoriesSet = Array.from(new Set(sourcesList.map(s => s.category)));

    res.json({
      success: true,
      data: {
        address: {
          placeId: req.body.placeId || `prop_${hash}`,
          formattedAddress: resolvedMeta.formattedAddress,
          city: resolvedMeta.city,
          state: resolvedMeta.state,
          zipCode: resolvedMeta.zipCode,
          county: resolvedMeta.county,
          country: 'United States',
          lat: lat || 38.8951,
          lon: lon || -77.0364,
          propertyType: resolvedMeta.propertyType,
          displayName: resolvedMeta.formattedAddress
        },
        totalSourcesSearched,
        usefulSourcesFound,
        estimatedPages: 'Executive Property Insights (8 Min Read)',
        price,
        priceRationale,
        includedCategories: categoriesSet,
        publicSourcesList: sourcesList
      }
    });
  });

  // 2. Full AI Property Report Generation Endpoint (Gemini 3.6 Flash)
  app.post(["/api/property/generate-report", "/api/generate-report"], async (req, res) => {
    const { address, city, state, zipCode, county, propertyType, usefulSourcesCount, price, declaredPropertyType, unitNumber, yearBuilt, attestedAccurate, isPaid } = req.body;

    const fullAddr = formattedAddress(address, city, state, zipCode);

    // Authoritative, synchronous gate. This is the check that actually matters: it re-runs
    // Layers 1-3 independently of whatever the map UI decided, so no client-side bypass, stale
    // state, or direct API call can ever produce a report for an unresolvable address, a
    // government facility, or a property type the requester didn't actually declare. Fails
    // closed on any error inside runAddressGate.
    const gateResult = await runAddressGate(fullAddr, city || '', state || '', declaredPropertyType || null, unitNumber || null);
    if (!gateResult.canGenerateReport) {
      const blockedReport = {
        id: `rep_blocked_${Date.now()}`,
        isNonResidential: true,
        rejectionReason: gateResult.message,
        blockedAtLayer: gateResult.blockedAtLayer,
        headerInfo: { address: fullAddr },
        propertyInfo: { address: fullAddr, city: city || '', state: state || '', zipCode: zipCode || '', county: county || '', propertyType: 'Not Verified', estimatedSqFt: 0 }
        // leadWidgets: [] dropped -- nothing reads it (it isn't in CLIENT_REPORT_FIELDS, and no
        // component references it), and an always-empty array is not worth serializing.
      };
      // Projected like the two success paths, so this route has exactly one shape of response body
      // and no path can quietly return a field the client contract doesn't include.
      res.json({ success: true, report: projectReportForClient(blockedReport) });
      return;
    }

    const resolvedMeta = resolvePropertyMetadata(fullAddr, city, state, zipCode, county, propertyType);

    // BeforeRegret's first genuinely live, confirmed finding (see seismicHazard.ts) -- queried
    // once here, against the Census-verified coordinate from the gate itself (not whatever the
    // frontend happened to send), then threaded through to validateAndFixReportContradictions
    // below so it survives regardless of whether Gemini-based content generation succeeds.
    // Both live sources are queried against the Census-verified coordinate from the gate itself
    // (not whatever the frontend sent), in parallel since neither depends on the other. Each
    // returns null rather than throwing on failure, so one being unavailable never blocks the
    // report or the other finding.
    // zipVendorMap is fetched once here (single query for every active vendor in this ZIP) and
    // threaded through to the attachSponsoredVendorsTo*Findings pair and buildInspectionPrioritiesForReport below
    // -- avoids querying per finding / per inspection-priority item (up to ~14 round trips
    // otherwise). See fetchActiveZipVendors in src/server/zipAdsApi.ts.
    const [liveSeismicFinding, liveNeighborhoodFinding, zipVendorMap, requesterClerkUserId] = await Promise.all([
      fetchSeismicHazardFinding(gateResult.layer1.lat as number, gateResult.layer1.lon as number),
      fetchNeighborhoodContextFinding(
        gateResult.layer1.lat as number,
        gateResult.layer1.lon as number,
        typeof yearBuilt === 'number' ? yearBuilt : parseInt(String(yearBuilt ?? ''), 10) || null
      ),
      fetchActiveZipVendors(resolvedMeta.zipCode),
      optionalVerifiedUserId(req),
    ]);

    // Best-effort audit record of exactly what was declared for this report (see
    // saveGeneratedReportInputs in db.ts and Terms 3.5-3.6) -- fire-and-forget, same "log the
    // fact, don't gate on it" posture as gemini_usage_log and the capacityCheck reservation above.
    // Called once here, before either the Gemini-success or fallback path below, so both are
    // covered without duplicating the call at each reportsStore.set() site.
    // reportBody is the client-projected report as delivered. It is what makes the permalink
    // servable after this serverless instance is gone -- see getGeneratedReportBody. Optional only
    // so a caller that genuinely has no body yet can still write the audit row; every call site
    // below passes one.
    const persistDeclaredInputs = (reportId: string, reportBody?: unknown) => {
      if (!isDbConfigured()) return;
      let reportJson: string | null = null;
      if (reportBody !== undefined) {
        try {
          reportJson = JSON.stringify(reportBody);
        } catch (err) {
          // Don't lose the audit row over an unserializable body -- but do say so, because the
          // permalink for this report will 404 and that should not be a silent surprise later.
          console.error(`[generate-report] Could not serialize report ${reportId} for storage:`, err);
        }
      }
      void saveGeneratedReportInputs({
        reportId,
        reportJson,
        clerkUserId: requesterClerkUserId,
        formattedAddress: resolvedMeta.formattedAddress,
        city: resolvedMeta.city || null,
        state: resolvedMeta.state || null,
        zipCode: resolvedMeta.zipCode || null,
        county: resolvedMeta.county || null,
        declaredPropertyType: declaredPropertyType || null,
        declaredYearBuilt: typeof yearBuilt === 'number' ? yearBuilt : parseInt(String(yearBuilt ?? ''), 10) || null,
        declaredUnitNumber: unitNumber || null,
        attestedAccurate: attestedAccurate === true,
        // isPaid is what the client reports, but price is the corroborating figure -- a paid report
        // is only ever sent with price 14.99 (see ReportGatingModal's PAYMENT_INTERCEPT path), so
        // treating a nonzero price as paid too means a client that sends one field and not the
        // other still lands in the right bucket rather than silently undercounting revenue.
        isPaid: isPaid === true || Number(price) > 0,
        priceUsd: Number.isFinite(Number(price)) ? Number(price) : null,
        ipAddress: requestIp(req),
        userAgent: (req.headers['user-agent'] as string) || null,
      }).catch((err) => console.error('[generate-report] Failed to persist declared inputs:', err));
    };

    const fallbackReport = generateStructuredPropertyReport(
      resolvedMeta.formattedAddress,
      resolvedMeta.city,
      resolvedMeta.state,
      resolvedMeta.zipCode,
      resolvedMeta.county,
      resolvedMeta.propertyType,
      usefulSourcesCount || 21,
      price || 29
    );

    const apiKey = process.env.GEMINI_API_KEY;

    // Hard cost ceiling, not just a UX gate: the "one free report" limit below this is enforced
    // only in the browser (see ReportGatingModal.tsx's localStorage-based count), which a direct
    // POST to this endpoint -- from any client, any number of times, any number of IPs -- bypasses
    // entirely. Before this check existed there was no server-side limit on this route at all, so
    // nothing bounded how many real-money Gemini calls it could ever make. See
    // reportGenerationLimiter.ts for the actual caps and why they're sized the way they are. A
    // capped/unavailable result here doesn't fail the request -- it just skips straight to the
    // `fallbackReport` path below, the exact same graceful degrade this route already uses for a
    // genuine Gemini error (see the catch block further down), so a visitor always gets a full,
    // real report either way.
    const capacityCheck = await checkAndReserveReportGenerationCapacity(requestIp(req));
    if (!capacityCheck.allowed) {
      console.warn(`[report-generation] Gemini call skipped (${capacityCheck.reason}) for ${fullAddr}`);
    }

    if (apiKey && capacityCheck.allowed) {
      try {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `
Act as an expert full-stack developer and senior real estate technology architect building BeforeRegret (beforeregret.com).
Your primary directive is 100% FACTUAL ACCURACY based strictly on verified public property records.
You MUST NEVER state, assume, or derive any finding from a property's construction year or age. No report may state, assume, or derive any finding from a property's construction year or age, under any framing, anywhere in the document. Every finding must stand entirely on its own permit/record basis, independent of when the structure was built.

Target Property Details:
- Address: ${resolvedMeta.formattedAddress}
- City: ${resolvedMeta.city}, State: ${resolvedMeta.state}, Zip: ${resolvedMeta.zipCode}
- County: ${resolvedMeta.county}
- Verified Property Classification: ${resolvedMeta.propertyType}
- Is Multi-Family / Apartment / Condo Complex: ${resolvedMeta.isMultiFamilyOrApartment}
- Public Sources Scanned: ${usefulSourcesCount || 21}

===================================================================================
1. MANDATORY METADATA VALIDATION PROTOCOL & GUARDRAILS
===================================================================================
A. PROPERTY CLASSIFICATION DETECTOR:
   - Target property classification: "${resolvedMeta.propertyType}".
   - IF MULTI-FAMILY, APARTMENT COMPLEX, OR CONDO (${resolvedMeta.isMultiFamilyOrApartment ? "ACTIVE FOR THIS REPORT" : "INACTIVE"}):
     * NEVER advise on individual roof replacements, structural foundation sweeps, or private sewer laterals.
     * RE-ROUTE ALL RECOMMENDATIONS to: HOA Reserve Studies, Master Insurance Policies, Certificate of Occupancy (CO) verification, Sound Attenuation between shared walls, Tenant Utility Sub-metering, and Community Management Fees.

B. ZERO PROPERTY AGE / CONSTRUCTION YEAR RULE:
   - Do NOT output a yearBuilt field anywhere in the JSON response.
   - Do NOT mention, infer, or reference construction year, build era, or property age.
   - For all building systems (roof, HVAC, electrical, water heater, sewer), state ONLY what the permit archive actually shows (e.g. "Most recent roofing permit on file: November 2008" or "No roofing permit found in the digitized archive").

C. TWO-TIER STATUS BADGES:
   - Use ONLY two confidence levels:
     1. "Verified Record" (a specific permit or filing exists and is dated)
     2. "No Record Found" (nothing on file in the digitized archive)

===================================================================================
2. OUTPUT FORMAT & DEFENSE STANDARDS
===================================================================================
Output ONLY a clean, valid JSON payload adhering to the schema.
Do NOT include Markdown code blocks, section tags like "SECTION 5A", UI button text like "Copy All Questions", or hardcoded web strings like "0 of 2 Checked".

Maintain a non-diagnostic stance:
- Never tell the user whether to buy or rent.
- Never output hard dollar cost estimates for repairs.
- Never predict property value changes.
- Ensure every finding follows the 3-part structure: "whatWeFound" (fact), "whyItMatters" (context), and "suggestedNextStep" (neutral verification step).
- Assign every finding a confidence badge: "Verified Record" or "No Record Found".
`;

        // Cascades through REPORT_GENERATION_MODELS (this route's own model first, then the two
        // content-generation models as fallback) on quota exhaustion -- see geminiModel.ts. Only
        // falls through to the fallbackReport below if every model in that chain is exhausted (or
        // some other error occurs).
        const { result: response, model: usedModel } = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            systemInstruction: `You are the executive property research engine at BeforeRegret (beforeregret.com).
Your output is 100% factually accurate, structured, professional, non-diagnostic, and strictly based on verified public property records.
You MUST NEVER state, assume, or derive any finding from a property's construction year or age.
Confidence badges must strictly be "Verified Record" or "No Record Found".
Never output dollar cost estimates, price ranges, or buy/rent/investment recommendations.`,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reportVersion: { type: Type.STRING },
                headerInfo: {
                  type: Type.OBJECT,
                  properties: {
                    address: { type: Type.STRING },
                    reportDate: { type: Type.STRING },
                    reportVersion: { type: Type.STRING }
                  },
                  required: ["address", "reportDate", "reportVersion"]
                },
                propertyInfo: {
                  type: Type.OBJECT,
                  properties: {
                    address: { type: Type.STRING },
                    city: { type: Type.STRING },
                    state: { type: Type.STRING },
                    zipCode: { type: Type.STRING },
                    county: { type: Type.STRING },
                    lat: { type: Type.NUMBER },
                    lon: { type: Type.NUMBER },
                    propertyType: { type: Type.STRING },
                    estimatedSqFt: { type: Type.NUMBER }
                  },
                  required: ["address", "city", "state", "zipCode"]
                },
                atAGlance: {
                  type: Type.OBJECT,
                  properties: {
                    cards: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          status: { type: Type.STRING },
                          title: { type: Type.STRING },
                          confidence: { type: Type.STRING }
                        },
                        required: ["id", "title", "confidence"]
                      }
                    },
                    mostImportantToVerify: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["title", "description"]
                    }
                  },
                  required: ["cards", "mostImportantToVerify"]
                },
                whatWeFound: {
                  type: Type.OBJECT,
                  properties: {
                    verified: { type: Type.ARRAY, items: { type: Type.STRING } },
                    needsVerification: { type: Type.ARRAY, items: { type: Type.STRING } },
                    worthAskingAbout: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["verified", "needsVerification", "worthAskingAbout"]
                },
                topPriorities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      confidence: { type: Type.STRING },
                      whatWeFound: { type: Type.STRING },
                      whyItMatters: { type: Type.STRING },
                      suggestedNextStep: { type: Type.STRING }
                    },
                    required: ["title", "confidence", "whatWeFound", "whyItMatters", "suggestedNextStep"]
                  }
                },
                environmentalTopics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      confidence: { type: Type.STRING },
                      whatWeFound: { type: Type.STRING },
                      whyItMatters: { type: Type.STRING },
                      suggestedNextStep: { type: Type.STRING }
                    },
                    required: ["title", "confidence", "whatWeFound", "whyItMatters", "suggestedNextStep"]
                  }
                },
                sellerQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      ask: { type: Type.STRING },
                      why: { type: Type.STRING },
                      confidence: { type: Type.STRING }
                    },
                    required: ["ask", "why", "confidence"]
                  }
                },
                visitChecklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      task: { type: Type.STRING },
                      detail: { type: Type.STRING },
                      category: { type: Type.STRING }
                    },
                    required: ["task"]
                  }
                },
                sourceReferences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      agency: { type: Type.STRING },
                      category: { type: Type.STRING },
                      status: { type: Type.STRING },
                      url: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["name", "agency", "category", "status", "url", "description"]
                  }
                }
              },
              required: [
                "headerInfo",
                "propertyInfo",
                "atAGlance",
                "whatWeFound",
                "topPriorities",
                "environmentalTopics",
                "sellerQuestions",
                "visitChecklist",
                "sourceReferences"
              ]
            }
          }
        }, REPORT_GENERATION_MODELS);

        // Fire-and-forget -- never let usage logging affect the report response the customer
        // is actually waiting on. See src/server/geminiUsageTracker.ts.
        logGeminiUsage('report_generation', usedModel, response.usageMetadata);
        const rawText = response.text || "{}";
        const parsedReport = JSON.parse(rawText);

        const mergedReport = {
          ...fallbackReport,
          ...parsedReport,
          headerInfo: {
            ...fallbackReport.headerInfo,
            ...(parsedReport.headerInfo || {})
          },
          pricing: {
            ...fallbackReport.pricing,
            ...(parsedReport.pricing || {})
          },
          propertyInfo: {
            ...fallbackReport.propertyInfo,
            ...(parsedReport.propertyInfo || {})
          },
          atAGlance: {
            ...fallbackReport.atAGlance,
            ...(parsedReport.atAGlance || {}),
            cards: Array.isArray(parsedReport.atAGlance?.cards) && parsedReport.atAGlance.cards.length > 0 ? parsedReport.atAGlance.cards : fallbackReport.atAGlance.cards
          },
          whatWeFound: {
            ...fallbackReport.whatWeFound,
            ...(parsedReport.whatWeFound || {})
          },
          sellerQuestions: Array.isArray(parsedReport.sellerQuestions) && parsedReport.sellerQuestions.length > 0 ? parsedReport.sellerQuestions : fallbackReport.sellerQuestions,
          visitChecklist: Array.isArray(parsedReport.visitChecklist) && parsedReport.visitChecklist.length > 0 ? parsedReport.visitChecklist : fallbackReport.visitChecklist,
          disclosureLevers: Array.isArray(parsedReport.disclosureLevers) && parsedReport.disclosureLevers.length > 0 ? parsedReport.disclosureLevers : fallbackReport.disclosureLevers
        };

        let cleanedReport = validateAndFixReportContradictions(mergedReport, [liveSeismicFinding, liveNeighborhoodFinding].filter(Boolean));
        cleanedReport = stripInternalMetadata(cleanedReport);
        // One Set shared across all four calls below so a trade category is attached at most once
        // across the whole report, regardless of which section matches it first. Order matters,
        // not just the shared Set -- see attachSponsoredVendorsToPendingFindings's comment for why
        // the pending-findings pass specifically has to run last, after every more-prominent
        // section has had first refusal on a category.
        const seenVendorCategories = new Set<string>();
        attachSponsoredVendorsToResolvedFindings(cleanedReport, zipVendorMap, seenVendorCategories);
        attachFindingSourceUrls(cleanedReport, resolvedMeta.county, resolvedMeta.city);
        cleanedReport.inspectionPriorities = buildInspectionPrioritiesForReport(yearBuilt, resolvedMeta.county, resolvedMeta.state, zipVendorMap, seenVendorCategories);
        cleanedReport.sellerQuestionsScript = buildSellerQuestionsForReport(yearBuilt, resolvedMeta.county, resolvedMeta.state, declaredPropertyType, zipVendorMap, seenVendorCategories);
        attachSponsoredVendorsToPendingFindings(cleanedReport, zipVendorMap, seenVendorCategories);
        // Moving Company is a fixed, always-checked slot, not routed through the per-item matching
        // above -- see the comment on PropertyReport.movingCompanyVendors in types.ts.
        cleanedReport.movingCompanyVendors = zipVendorMap.get('Moving Company') ?? [];

        if (!cleanedReport.id) {
          cleanedReport.id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        }
        // Projected before it is stored, not just before it is sent, so the copy GET
        // /api/report/:reportId serves later is the same clean object -- see CLIENT_REPORT_FIELDS.
        const clientReport = projectReportForClient(cleanedReport);
        reportsStore.set(cleanedReport.id, clientReport);
        persistDeclaredInputs(cleanedReport.id, clientReport);

        res.json({
          success: true,
          report: clientReport
        });
        return;
      } catch (err: any) {
        console.error("[Gemini Report Generation Error]:", err);
      }
    }

    let cleanedReport = validateAndFixReportContradictions(fallbackReport, [liveSeismicFinding, liveNeighborhoodFinding].filter(Boolean));
    cleanedReport = stripInternalMetadata(cleanedReport);
    const seenVendorCategories = new Set<string>();
    attachSponsoredVendorsToResolvedFindings(cleanedReport, zipVendorMap, seenVendorCategories);
    attachFindingSourceUrls(cleanedReport, resolvedMeta.county, resolvedMeta.city);
    cleanedReport.inspectionPriorities = buildInspectionPrioritiesForReport(yearBuilt, resolvedMeta.county, resolvedMeta.state, zipVendorMap, seenVendorCategories);
    cleanedReport.sellerQuestionsScript = buildSellerQuestionsForReport(yearBuilt, resolvedMeta.county, resolvedMeta.state, declaredPropertyType, zipVendorMap, seenVendorCategories);
    attachSponsoredVendorsToPendingFindings(cleanedReport, zipVendorMap, seenVendorCategories);
    cleanedReport.movingCompanyVendors = zipVendorMap.get('Moving Company') ?? [];

    if (!cleanedReport.id) {
      cleanedReport.id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    // Same projection as the Gemini path above -- this is the path that most needs it, since the
    // fallback generator is where the hardcoded "Verified Record" constants live.
    const clientFallbackReport = projectReportForClient(cleanedReport);
    reportsStore.set(cleanedReport.id, clientFallbackReport);
    persistDeclaredInputs(cleanedReport.id, clientFallbackReport);

    // Fallback high-quality structured decision guide report
    res.json({
      success: true,
      report: clientFallbackReport
    });
  });

  // Auth is handled entirely by Clerk client-side (see src/context/AuthContext.tsx). These
  // endpoints used to back a demo/mock sign-in path that accepted any email/name with no
  // verification and echoed back a fabricated "authenticated" user -- removed for production;
  // there is no legitimate server-side auth surface left to expose here.

  // --- PayPal Payment Processing ---------------------------------------------------------------
  app.post("/api/paypal/orders", async (req, res) => {
    if (!isPayPalConfigured()) {
      res.status(503).json({
        success: false,
        error: 'PayPal payment processing is not configured on this server.',
      });
      return;
    }

    try {
      const { amount, currency, type, description, propertyAddress, vendorId, userEmail, userId } = req.body;

      if (!amount || !type || !userEmail || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: amount, type, userEmail, userId',
        });
        return;
      }

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const returnUrl = `${appUrl}/payment-success`;
      const cancelUrl = `${appUrl}/payment-cancelled`;

      const paypalOrder = await createPayPalOrder({
        amount: String(amount),
        currency: currency || 'USD',
        type: type as 'report' | 'vendor_subscription',
        description: description || `BeforeRegret - ${type}`,
        returnUrl,
        cancelUrl,
        userEmail,
        propertyAddress,
        vendorId,
      });

      if (isDbConfigured()) {
        await createTransaction({
          user_id: userId,
          user_email: userEmail,
          paypal_order_id: paypalOrder.orderId,
          amount: String(amount),
          currency: currency || 'USD',
          type: type as 'report' | 'vendor_subscription',
          status: 'pending',
          property_address: propertyAddress,
          vendor_id: vendorId,
        });
      }

      res.json({
        success: true,
        orderId: paypalOrder.orderId,
        approvalUrl: `https://www.${
          process.env.PAYPAL_MODE === 'live' ? 'paypal.com' : 'sandbox.paypal.com'
        }/cgi-bin/webscr?cmd=_express-checkout&token=${paypalOrder.orderId}`,
      });
    } catch (error: any) {
      console.error('PayPal order creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create PayPal order',
      });
    }
  });

  app.post("/api/paypal/orders/:orderId/capture", async (req, res) => {
    if (!isPayPalConfigured()) {
      res.status(503).json({
        success: false,
        error: 'PayPal payment processing is not configured.',
      });
      return;
    }

    try {
      const { orderId } = req.params;
      const { userId } = req.body;

      if (!orderId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, userId',
        });
        return;
      }

      const captureResult = await capturePayPalOrder(orderId);

      if (isDbConfigured()) {
        await updateTransaction(orderId, {
          status: 'completed',
          paypal_capture_id: captureResult.captureId,
          payer_name: captureResult.payerName,
        });
      }

      res.json({
        success: true,
        orderId: captureResult.orderId,
        status: captureResult.status,
        captureId: captureResult.captureId,
        amount: captureResult.amount,
        currency: captureResult.currency,
      });
    } catch (error: any) {
      console.error('PayPal order capture error:', error);

      if (isDbConfigured()) {
        try {
          await updateTransaction(req.params.orderId, {
            status: 'failed',
            error_message: error.message,
          });
        } catch (dbError) {
          console.error('Failed to update transaction status:', dbError);
        }
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to capture PayPal order',
      });
    }
  });

  app.get("/api/paypal/orders/:orderId", async (req, res) => {
    if (!isPayPalConfigured()) {
      res.status(503).json({
        success: false,
        error: 'PayPal payment processing is not configured.',
      });
      return;
    }

    try {
      const { orderId } = req.params;
      const orderData = await getPayPalOrder(orderId);

      res.json({
        success: true,
        orderId: orderData.orderId,
        status: orderData.status,
        amount: orderData.amount,
        currency: orderData.currency,
      });
    } catch (error: any) {
      console.error('PayPal order fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch PayPal order',
      });
    }
  });

  app.get("/api/paypal/transaction/:orderId", async (req, res) => {
    if (!isDbConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Transaction database is not configured.',
      });
      return;
    }

    try {
      const { orderId } = req.params;
      const transaction = await getTransaction(orderId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
        return;
      }

      res.json({
        success: true,
        transaction,
      });
    } catch (error: any) {
      console.error('Transaction fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transaction',
      });
    }
  });

  // Catch-all for unhandled /api endpoints to ensure JSON response instead of HTML SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
  });

  // --- Legacy URLs still indexed from the pre-pivot product ---------------------------------
  //
  // Found by scripts/gsc-page-coverage.ts, not by guesswork: Search Console's page dimension
  // reported 19 URLs earning impressions that are not in this site's published list, and a direct
  // HTTP check confirmed which of them 404. They still rank -- several at positions 3 to 5, better
  // than almost every page currently written -- so real people are clicking them and landing on an
  // error page.
  //
  // These split into two groups: pages from the previous product entirely, and old legal URLs
  // that duplicate a page that still exists today. Both groups now get the SAME treatment (410),
  // which is a deliberate reversal of this table's original design -- worth recording why.
  //
  // The legal duplicates were originally 301-redirected to their successor (/privacy-policy ->
  // /privacy/, etc.) on the reasoning that a searcher wanting this site's privacy policy still
  // wants a privacy policy, and 301 answers that request while consolidating ranking onto the
  // real page. That reasoning turned out to be wrong in practice: scripts/gsc-page-coverage.ts
  // kept showing the OLD duplicate URLs earning impressions -- /privacy-policy, /terms-and-
  // conditions, /legal-disclaimer, /refund-policy -- while their canonical successors earned
  // fewer or none, meaning Google had indexed the duplicate as the canonical URL and a 301 alone
  // was not making it let go. On a site crawled at only ~3 pages/day, waiting for Google to
  // re-crawl a redirect, notice it, and re-canonicalize is slow, and every crawl spent on a
  // duplicate legal page is a crawl not spent on real content. 410 is the stronger, faster signal
  // for "this exact URL is gone" -- it does not ask Google to transfer anything, it tells Google
  // to drop the URL from the index outright, which is what's actually wanted here since the real
  // page already exists at its own URL and was never the one with the ranking problem.
  //
  // The previous-product pages (this codebase used to be an India-focused resident/housing-society
  // Q&A platform -- see the catch-all handler's comment below) never had a successor to redirect
  // to in the first place. Nothing on a US property-research site answers "find an expert" or
  // "will I regret". /shipping-policy is included deliberately: this site sells digital property
  // reports and has nothing to ship, so pointing it at a refunds or terms page would be inventing
  // a relationship that does not exist. Redirecting any of these somewhere plausible would be
  // worse than 410: Google treats an irrelevant redirect as a soft 404 anyway, and a reader
  // clicking "will I regret" does not want a county page.
  //
  // Deliberately NOT in vercel.json: it cannot express 410, so splitting the table across two
  // files would leave half the legacy URLs handled somewhere the other half is not. Registered
  // before the dev/prod split so `npm run dev` behaves the same as production.
  // The list itself now lives in src/data/legacyUrls.ts so scripts/legacy-url-audit.ts asserts
  // against exactly what this handler enforces, rather than a re-typed copy that can drift.
  app.use((req, res, next) => {
    if (isLegacyGonePath(req.path)) {
      return res.status(410).type('text/plain').send('Gone -- this page was part of a previous version of this site and has been permanently removed.');
    }
    next();
  });

  // Vite Integration for Dev / Static Assets in Prod
  // Dynamic import: vite is dev-only tooling with heavy transitive deps (esbuild, rollup) that
  // has no reason to load in production, and especially not inside a Vercel serverless function
  // bundle, which always runs with NODE_ENV=production and never reaches this branch anyway.
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // `index` defaults to 'index.html', which is what we want: build-time prerendering
    // (scripts/prerender-guides.tsx, scripts/prerender-homepage.tsx) writes real static pages to
    // dist/index.html (homepage) and dist/guides/<slug>/index.html (each guide), and this lets
    // express.static serve those directly. Every other path -- including genuinely dead ones --
    // falls through to the catch-all below, which now reads dist/shell.html (the pristine empty
    // shell preserved by prerender-homepage.tsx) rather than dist/index.html, mirroring
    // vercel.json's catch-all. This only matters for local `npm start` / non-Vercel hosts -- on
    // Vercel this Express branch's static serving is never reached at all (see vercel.json's
    // rewrites), so this has no bearing on the live deployment.
    app.use(express.static(distPath));

    const sendShellWithStatus = (res: Response, status: number) => {
      const shellPath = path.join(distPath, 'shell.html');
      const indexPath = path.join(distPath, 'index.html');
      const target = fs.existsSync(shellPath) ? shellPath : indexPath;
      if (fs.existsSync(target)) {
        res.status(status).send(fs.readFileSync(target, 'utf8'));
      } else {
        res.status(404).send('Not found');
      }
    };

    // Confirmed as a real, externally-reported issue: a guessed or stale /guides/:slug or
    // /county/:slug URL that doesn't correspond to any real article/county previously fell all
    // the way through to the generic catch-all below, which always sends 200 -- the client-side
    // GuidePageView/CountyPageView then renders a "Not Found" message, but a crawler sees a
    // "soft 404" (real content missing, HTTP status says the page is fine). express.static above
    // already serves a REAL prerendered page directly for any slug that existed at the last
    // deploy, bypassing these two routes entirely -- they're only ever reached for a slug that's
    // either genuinely invalid, or was published/completed after the last deploy (in which case
    // GuidePageView/CountyPageView's own client-side fetch to /api/guides|counties/:slug still
    // finds and renders it -- this only changes the HTTP status here, never the served content,
    // so that legitimate case keeps working exactly as it did before). Fails open (200) on a DB
    // error rather than risk 404-ing a real page over a transient outage.
    app.get(['/guides/:slug', '/guides/:slug/'], async (req, res) => {
      if (!isDbConfigured()) return sendShellWithStatus(res, 200);
      try {
        const rows = await withDb((sql) => sql`
          SELECT 1 FROM articles WHERE slug = ${req.params.slug} AND status = 'published' LIMIT 1
        `);
        sendShellWithStatus(res, rows.length > 0 ? 200 : 404);
      } catch (err) {
        console.error('[guides] slug-existence check failed, serving 200:', err);
        sendShellWithStatus(res, 200);
      }
    });

    app.get(['/county/:slug', '/county/:slug/'], async (req, res) => {
      if (!isDbConfigured()) return sendShellWithStatus(res, 200);
      try {
        const rows = await withDb((sql) => sql`
          SELECT 1 FROM county_data WHERE slug = ${req.params.slug} AND data_complete = true LIMIT 1
        `);
        sendShellWithStatus(res, rows.length > 0 ? 200 : 404);
      } catch (err) {
        console.error('[counties] slug-existence check failed, serving 200:', err);
        sendShellWithStatus(res, 200);
      }
    });

    // Same soft-404 bug as the two handlers above, generalized: any path that isn't a real static
    // asset, a prerendered page, a guide/county slug (both already checked above), or one of the
    // SPA's own known client-only routes used to fall all the way through here and get an
    // unconditional 200 -- including genuinely dead URLs, like a leftover page from a pre-pivot
    // version of this product (this codebase used to be an India-focused resident/housing-society
    // Q&A platform; /become-expert was a real page in that product, deleted along with the rest of
    // that dead frontend, but still indexed in Bing because it kept returning 200 after removal).
    // KNOWN_STATIC_ROUTE_PREFIXES is hand-kept in sync with App.tsx's resolveRouteFromPath -- the
    // client already has the authoritative list of what it can route to, there's just no shared
    // module between client and server yet to import it from directly.
    app.get('*', (req, res) => {
      const path = req.path;
      const isKnownRoute =
        path === '/' ||
        KNOWN_STATIC_ROUTE_PREFIXES.some((prefix) => {
          // Some prefixes are already slash-terminated ('/guides/', '/insights/') -- appending
          // another slash before checking would double it up (`/insights//`) and never match a
          // real suffix like `/insights/abc123`, which is exactly the bug this fixed after the
          // first version of this handler shipped 404-ing real /insights/:id links.
          const boundary = prefix.endsWith('/') ? prefix : `${prefix}/`;
          if (path === prefix) return true;
          if (!path.startsWith(boundary)) return false;
          // At most ONE segment may follow the prefix. Every real route in App.tsx's
          // resolveRouteFromPath takes a single id/slug there at most -- /guides/<slug>,
          // /county/<slug>, /insights/<id>, /topic-ads/success -- and nothing goes deeper.
          //
          // Without this check the prefix match alone returned 200 for ANY depth, which made an
          // unbounded space of soft-404s: /guides/<real-slug>/null answered 200 with the shell,
          // as did /guides/<real-slug>/literally/anything. Not theoretical -- found because an AI
          // crawler actually fetched /guides/check-building-permits-orange-county-ca/null and got
          // a 200 (see ai_crawler_visits). That matters more than usual here: this domain is
          // crawled at roughly 3 pages/day, so budget spent on junk URLs that answer 200 is budget
          // taken from the 100+ real pages Google has never fetched. The /guides/:slug and
          // /county/:slug handlers above already do a real existence check for the one-segment
          // case; this only stops the deeper paths that bypass them entirely.
          const rest = path.slice(boundary.length).replace(/\/+$/, '');
          return !rest.includes('/');
        });
      sendShellWithStatus(res, isKnownRoute ? 200 : 404);
    });
  }

  return app;
}

// Traditional persistent-server bootstrap for local dev (npm run dev) and any host that runs
// this as a long-lived Node process (e.g. `npm start` / `node dist/server.cjs`). Not used on
// Vercel -- see api/index.ts, which calls createApp() directly and never binds a port.
async function startServer() {
  const app = await createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BeforeRegret] Property Research Engine running on http://0.0.0.0:${PORT}`);
  });
}

function validateAndFixReportContradictions(report: any, liveFindings: any[] = []) {
  if (!report) return report;

  // NOTE: BeforeRegret has no live data connection to any county/municipal/federal record
  // source yet. This fallback must never assert a specific "CONFIRMED RECORD" (e.g. a permit
  // date, a flood zone) because nothing was actually queried. Every finding here is honestly
  // labeled 'NOT YET VERIFIED' until a real integration exists for that source.
  if (!report.canonicalFindings || !Array.isArray(report.canonicalFindings) || report.canonicalFindings.length === 0) {
    report.canonicalFindings = [
      {
        id: 'f_roof',
        subject: 'Roof Replacement Permit Records',
        category: 'Property Records',
        status: 'NOT YET VERIFIED',
        summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal roof permit records for this address.',
        whatWeFound: 'Not yet independently verified for this address.',
        whyItMatters: 'Roofing materials experience atmospheric weathering over time and represent significant replacement costs if nearing end-of-life.',
        suggestedNextStep: 'Ask the seller for roof replacement receipts or contractor invoice documentation, and check the municipal permit portal directly.',
        actionItem: {
          type: 'sellerQuestion',
          title: 'Roof Installation & Warranty',
          description: 'Has the roof ever been replaced or repaired, and do you have contractor invoices or warranty paperwork?',
          why: 'BeforeRegret has not yet independently verified permit records for this address.'
        }
      },
      {
        id: 'f_elec',
        subject: 'Main Electrical Service Panel',
        category: 'Property Records',
        status: 'NOT YET VERIFIED',
        summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal electrical permit records for this address.',
        whatWeFound: 'Not yet independently verified for this address.',
        whyItMatters: 'A permitted electrical service panel meets modern safety standards for contemporary household appliances.',
        suggestedNextStep: 'Verify main panel labelling and breaker alignment during physical walkthrough, and check the municipal permit portal directly.',
        actionItem: {
          type: 'walkthroughItem',
          title: 'Main Electrical Panel Walkthrough',
          description: 'Locate the main service panel in garage or utility area and confirm municipal inspection sticker.',
          why: 'BeforeRegret has not yet independently verified permit records for this address.'
        }
      },
      {
        id: 'f_hvac',
        subject: 'HVAC Compressor & Mechanical System',
        category: 'Property Records',
        status: 'NOT YET VERIFIED',
        summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal mechanical permit records for this address.',
        whatWeFound: 'Not yet independently verified for this address.',
        whyItMatters: 'Central cooling compressors experience declining efficiency over 12-15 year lifespans.',
        suggestedNextStep: 'Have your home inspector record the manufacturing date on the condenser unit dataplate.',
        actionItem: {
          type: 'sellerQuestion',
          title: 'HVAC Age & Service History',
          description: 'What is the age of the central AC compressor, and are annual maintenance records available?',
          why: 'BeforeRegret has not yet independently verified permit records for this address.'
        }
      },
      {
        id: 'f_flood',
        subject: 'FEMA Flood Hazard Risk Zone',
        category: 'Environment',
        status: 'NOT YET VERIFIED',
        summaryText: 'BeforeRegret does not yet have a live, verified connection to the FEMA National Flood Hazard Layer for this address.',
        whatWeFound: 'Not yet independently verified for this address.',
        whyItMatters: 'Flood zone classification affects whether mortgage lenders require flood insurance.',
        suggestedNextStep: 'Look up the official flood zone yourself at the FEMA Flood Map Service Center before making assumptions about insurance requirements.',
        actionItem: {
          type: 'disclosureLever',
          title: 'Flood Insurance Verification',
          description: 'Ask your insurance agent to pull the official FEMA flood zone determination for this address.',
          why: 'BeforeRegret has not yet independently verified FEMA flood zone data for this address.'
        }
      },
      {
        id: 'f_code',
        subject: 'Municipal Code Enforcement Standing',
        category: 'Neighborhood',
        status: 'NOT YET VERIFIED',
        summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal code enforcement records for this address.',
        whatWeFound: 'Not yet independently verified for this address.',
        whyItMatters: 'Open code violations or municipal orders can affect closing and future liability.',
        suggestedNextStep: 'Check the municipal code enforcement portal directly before closing.'
      }
    ];
  }

  // Splice in any genuinely live-queried findings (see seismicHazard.ts) that aren't already
  // present. These carry a real 'CONFIRMED RECORD' status set by their own fetch function, not
  // by this fallback -- unlike everything above, they reflect an API call that actually happened
  // for this address. Placed first so real findings surface ahead of the "not yet verified" list.
  for (const finding of liveFindings) {
    if (!finding || !finding.id) continue;
    const alreadyPresent = report.canonicalFindings.some((f: any) => f.id === finding.id);
    if (!alreadyPresent) {
      report.canonicalFindings.unshift(finding);
    }
  }

  // Status normalization, default-deny.
  //
  // The previous version of this block preserved 'CONFIRMED RECORD' whenever a finding simply
  // claimed it, and only failed closed on an *unrecognized* status. That trusted the wrong party:
  // on the Gemini path, canonicalFindings is model output, and the report prompt explicitly asks
  // the model to state what "the permit archive" shows (e.g. "Most recent roofing permit on file:
  // November 2008") -- against an archive this app has never been connected to. A model that
  // complied by inventing a plausible date AND labelling it 'CONFIRMED RECORD' would have had both
  // the claim and the badge published verbatim, as a specific factual assertion about a real,
  // identifiable address. That is the highest-severity content failure this system can produce:
  // wrong about a named property, harmful in both directions (a buyer walks, or a seller is
  // implied to have unpermitted work), and entirely invisible to the reader.
  //
  // So confirmation is now something only an executed fetch can grant, never something the content
  // layer can assert about itself. liveFindings are the findings produced by a real HTTP call that
  // actually happened for this address on this request (seismicHazard.ts, neighborhoodContext.ts);
  // their ids are the only ids eligible for a verified-sounding status. Everything else -- model
  // output, the fallback template, and any finding type added to this system in future -- fails
  // closed. That inversion is the point: a new finding id added later is safe by default rather
  // than safe only if someone remembers to add it to a list here.
  const liveQueriedIds = new Set(
    (liveFindings || []).filter((f: any) => f && f.id).map((f: any) => f.id)
  );

  (report.canonicalFindings || []).forEach((f: any) => {
    const rawStatus = (f.status || '').toUpperCase();
    const wasLiveQueried = liveQueriedIds.has(f.id);

    // 'NO RECORD FOUND' is deliberately gated behind wasLiveQueried too, not treated as the safe
    // option because it asserts no defect. It asserts that a record system was searched and came
    // back empty -- which, with no integration, is both untrue and specifically damaging to the
    // seller ("no permit found" reads as unpermitted work). An honest "we have not checked" is the
    // only claim available when nothing was checked.
    const mayClaimVerified = wasLiveQueried && (rawStatus === 'CONFIRMED RECORD' || rawStatus === 'NO RECORD FOUND');
    f.status = mayClaimVerified ? rawStatus : 'NOT YET VERIFIED';

    // Downgrading the badge alone is not enough. If the text still reads "Most recent roofing
    // permit on file: November 2008", the fabrication is still published -- just under a different
    // label, which is arguably worse because the two now contradict each other. Only the two
    // property-specific assertion fields are replaced; whyItMatters, suggestedNextStep and
    // actionItem are general education about the system in question, carry no address-specific
    // claim, and stay as written so the downgrade costs the reader nothing useful.
    if (!mayClaimVerified && rawStatus === 'CONFIRMED RECORD') {
      console.warn(
        `[report-integrity] Finding '${f.id || 'unknown'}' claimed CONFIRMED RECORD without a live data source; ` +
        `downgraded and its property-specific text replaced.`
      );
      f.summaryText = 'BeforeRegret does not yet have a live, verified connection to a record source for this finding at this address.';
      f.whatWeFound = 'Not yet independently verified for this address.';
    }
  });

  return report;
}

// Attaches real, paying vendors to each finding whose trade category matches, for this specific
// ZIP -- contextual, per-finding placement instead of one generic report-level slot. zipVendorMap
// is fetched once per report (see fetchActiveZipVendors in src/server/zipAdsApi.ts) rather than
// queried here per finding, keyed by trade category, holding up to MAX_SLOTS_PER_ZIP_TRADE
// vendors per category rather than just one.
//
// seenCategories is shared across this call and the three others in the same family
// (attachSponsoredVendorsToPendingFindings below, buildInspectionPrioritiesForReport,
// buildSellerQuestionsForReport). A trade category is only ever attached at the FIRST place it
// matches; every later match for the same category in the same report gets an empty list. Without
// this, a category matching several items in one report (Home Inspector alone can match a finding
// plus three separate inspection-priority items on an old house) showed the same vendor's card
// repeatedly instead of once, and now that up to 2 vendors can be attached together, would have
// shown both of them repeatedly too.
//
// THIS pass only ever looks at RESOLVED findings (status !== 'NOT YET VERIFIED') -- see the
// twin function below for why that split exists and matters for match order, not just dedup.
//
// Mutates report.canonicalFindings in place; safe to call after validateAndFixReportContradictions
// has populated that array and normalized every status.
function attachSponsoredVendorsToResolvedFindings(report: any, zipVendorMap: Map<string, any[]>, seenCategories: Set<string>) {
  if (!report || !Array.isArray(report.canonicalFindings)) return report;
  for (const finding of report.canonicalFindings) {
    if (finding.status === 'NOT YET VERIFIED') continue; // attached last -- see the pending-findings pass below
    const tradeCategory = FINDING_TRADE_CATEGORY[finding.id as keyof typeof FINDING_TRADE_CATEGORY];
    finding.sponsoredVendors = tradeCategory && !seenCategories.has(tradeCategory) ? zipVendorMap.get(tradeCategory) ?? [] : [];
    if (tradeCategory) seenCategories.add(tradeCategory);
  }
  return report;
}

// Attaches vendors to PENDING findings (status === 'NOT YET VERIFIED', e.g. f_roof/f_elec/f_hvac
// today) -- deliberately run LAST in the call sequence below, after the resolved-findings pass
// above AND after buildInspectionPrioritiesForReport/buildSellerQuestionsForReport, rather than
// first as this whole family used to run in one undivided array-order pass.
//
// Why this matters, concretely: PropertyReportView.tsx only gives a resolved finding a full card
// near the top of "Detailed Findings"; a NOT YET VERIFIED finding instead renders in the compact
// "Records You Still Need to Pull" list, which sits second-to-last on the page, directly above the
// legal disclaimer. f_roof and f_hvac have no other placement anywhere in the report's content
// model -- neither a resolved finding, an inspection-priority item, nor a seller question ever
// maps to Roof Inspection or HVAC Inspection -- so those two land here regardless of call order.
// Electrician is different: it's ALSO matched by three inspection-priority rules (knob-and-tube,
// aluminum wiring, panel brand) that render in the middle of the report when they apply. Under the
// old single-pass, array-order matching, f_elec (permanently NOT YET VERIFIED, since this site has
// no live permit-record integration yet) always came first and claimed Electrician for the bottom
// section, before the priorities pass -- which might have placed it far more prominently -- ever
// ran. Running this pass last gives every more-prominent section first refusal on a category, and
// a pending finding only keeps a category nothing else claimed.
function attachSponsoredVendorsToPendingFindings(report: any, zipVendorMap: Map<string, any[]>, seenCategories: Set<string>) {
  if (!report || !Array.isArray(report.canonicalFindings)) return report;
  for (const finding of report.canonicalFindings) {
    if (finding.status !== 'NOT YET VERIFIED') continue; // already handled by the resolved-findings pass
    const tradeCategory = FINDING_TRADE_CATEGORY[finding.id as keyof typeof FINDING_TRADE_CATEGORY];
    finding.sponsoredVendors = tradeCategory && !seenCategories.has(tradeCategory) ? zipVendorMap.get(tradeCategory) ?? [] : [];
    if (tradeCategory) seenCategories.add(tradeCategory);
  }
  return report;
}

// Maps each of the report's fixed finding ids (see validateAndFixReportContradictions) to the
// getPublicSourceUrl lookup key that actually answers it. getPublicSourceUrl already knows how to
// resolve this correctly per jurisdiction (or fall back to the honest generic directory outside
// the counties this app covers) -- this just wires each finding to the right key so the report
// stops linking every address in the country at Austin/Travis County portals.
const FINDING_SOURCE_LOOKUP_KEY: Record<string, string> = {
  f_roof: 'muni_permits',
  f_elec: 'muni_permits',
  f_hvac: 'muni_permits',
  f_flood: 'fema_nfhl',
  f_code: 'city_code',
  f_seismic: 'usgs_seismic',
  f_neighborhood_context: 'census_acs',
};

// Attaches a real, jurisdiction-correct link to each finding, replacing the old flat 21-item
// "Source Registry" table that pointed every report nationwide at the same Austin/Travis County
// portals regardless of the actual address -- confirmed still happening on a live report for a
// Seattle-area address after the jurisdiction fix in getPublicSourceUrl, because that table lived
// as a second, disconnected hardcoded copy in PropertyReportView.tsx and reportFallback.ts rather
// than reading from the fixed lookup. Mutates report.canonicalFindings in place.
function attachFindingSourceUrls(report: any, county: string, city?: string) {
  if (!report || !Array.isArray(report.canonicalFindings)) return report;
  for (const finding of report.canonicalFindings) {
    const lookupKey = FINDING_SOURCE_LOOKUP_KEY[finding.id];
    if (lookupKey) {
      finding.sourceUrl = getPublicSourceUrl(lookupKey, county, city);
    }
  }
  return report;
}

// Computes the era-based inspection priorities (engine/inspectionPriorities.ts) for this
// (year built, county) pair and attaches a per-item vendor match, same pattern (and same shared
// seenCategories dedup -- see attachSponsoredVendorsToResolvedFindings above) as that pair but for
// priority items instead of findings, consulting the same pre-fetched zipVendorMap rather than
// querying per item. yearBuilt is requester-declared and unvalidated at this point -- coerced
// defensively; the engine itself fails closed to null only for a missing/implausible year built,
// since national rules now cover every US county (see src/engine/inspectionPriorities.ts).
function buildInspectionPrioritiesForReport(rawYearBuilt: unknown, county: string, state: string, zipVendorMap: Map<string, any[]>, seenCategories: Set<string>) {
  const yearBuilt = typeof rawYearBuilt === 'number' ? rawYearBuilt : parseInt(String(rawYearBuilt ?? ''), 10);
  const result = getInspectionPriorities(yearBuilt, county, state);
  if (!result) return null;
  return {
    ...result,
    priorities: result.priorities.map((item) => {
      const tradeCategory = PRIORITY_TRADE_CATEGORY[item.id as keyof typeof PRIORITY_TRADE_CATEGORY];
      const sponsoredVendors = tradeCategory && !seenCategories.has(tradeCategory) ? zipVendorMap.get(tradeCategory) ?? [] : [];
      if (tradeCategory) seenCategories.add(tradeCategory);
      return { ...item, sponsoredVendors };
    }),
  };
}

// Companion to buildInspectionPrioritiesForReport above, same (year built, county, state) inputs
// plus the requester-declared property type, plus the same zipVendorMap/seenCategories vendor
// attachment (see SELLER_QUESTION_TRADE_CATEGORY in sponsoredVendors.ts -- only septic_seller has
// a real trade match; every other question has no sponsoredVendors set). declaredPropertyType is
// requester-declared and unvalidated at this point, same as rawYearBuilt; narrowed to the
// engine's exact union or null rather than trusted as-is.
function buildSellerQuestionsForReport(rawYearBuilt: unknown, county: string, state: string, rawDeclaredPropertyType: unknown, zipVendorMap: Map<string, any[]>, seenCategories: Set<string>) {
  const yearBuilt = typeof rawYearBuilt === 'number' ? rawYearBuilt : parseInt(String(rawYearBuilt ?? ''), 10);
  const declaredPropertyType =
    rawDeclaredPropertyType === 'single_family' || rawDeclaredPropertyType === 'condo_or_multifamily' || rawDeclaredPropertyType === 'other'
      ? rawDeclaredPropertyType
      : null;
  const result = getSellerQuestions(yearBuilt, county, state, declaredPropertyType);
  if (!result) return null;
  return {
    ...result,
    questions: result.questions.map((item) => {
      const tradeCategory = SELLER_QUESTION_TRADE_CATEGORY[item.id as keyof typeof SELLER_QUESTION_TRADE_CATEGORY];
      const sponsoredVendors = tradeCategory && !seenCategories.has(tradeCategory) ? zipVendorMap.get(tradeCategory) ?? [] : [];
      if (tradeCategory) seenCategories.add(tradeCategory);
      return { ...item, sponsoredVendors };
    }),
  };
}

// The complete set of report fields anything in this app actually reads. Derived, not guessed:
// PropertyReportView.tsx is the only consumer of a report object anywhere in src/, and these are
// exactly the properties it accesses (verified by grepping every `report.<field>` across App.tsx
// and every component).
//
// Everything the report generator produces beyond this list was dead payload -- serialized into the
// generate-report response and into GET /api/report/:reportId, stored in reportsStore, and rendered
// by nothing. That would be merely wasteful if the dead fields were inert, but they were not: the
// fallback generator hardcoded, identically for every address in the country, "Zero Active Code
// Violations" and "Certificate of Occupancy on file" and "Property sits outside FEMA designated
// 100-year flood risk zones" and "Low Flood Hazard Designation (Zone X)", each stamped
// confidence: 'Verified Record', plus a nearbyEssentials block asserting precise distances ("within
// 4.2 miles", "within 0.5 miles") attributed by name to HIFLD, a City Planning Board docket, and a
// State DOT capital program. This app queries none of those systems for any address.
//
// A projection is the fix rather than deleting each constant because it is a boundary rather than a
// list of exceptions: any field added to a report in future -- by a new fallback section, a new
// Gemini schema property, or a merge that reintroduces an old one -- is invisible to clients until
// it is named here deliberately. That inverts the failure mode. Previously the dangerous default was
// silent exposure; now the dangerous thing requires an explicit edit to this array, next to this
// comment. Flood zone is the sharpest example of why that matters: it decides whether a lender
// mandates flood insurance, so "Zone X, Verified Record" about a house actually in Zone AE is a
// specific, checkable, expensive misrepresentation, and it was one keystroke of UI away from being
// published for every property this site has ever reported on.
const CLIENT_REPORT_FIELDS = [
  'id',
  'headerInfo',
  'propertyInfo',
  'canonicalFindings',
  'inspectionPriorities',
  'sellerQuestionsScript',
  'movingCompanyVendors',
  // The three fields the blocked/non-residential path returns instead of a real report.
  'isNonResidential',
  'rejectionReason',
  'blockedAtLayer',
] as const;

function projectReportForClient(report: any) {
  if (!report) return report;
  const projected: Record<string, any> = {};
  for (const field of CLIENT_REPORT_FIELDS) {
    if (report[field] !== undefined) projected[field] = report[field];
  }
  return projected;
}

function stripInternalMetadata(report: any) {
  if (!report) return report;
  delete report.pSEOAdmin;
  delete report.internalMetrics;
  delete report.debugInfo;
  delete report.adminLink;
  delete report.generationMeta;
  return report;
}
function formattedAddress(addr?: string, city?: string, state?: string, zip?: string): string {
  if (addr && addr.includes(city || '')) return addr;
  const parts = [addr, city, state, zip].filter(Boolean);
  return parts.join(', ');
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Local government portals genuinely differ by jurisdiction. This app currently only targets
// Travis (Austin), Harris (Houston), and Dallas counties -- those are the only three with real,
// individually-verified URLs below. Every address outside them falls
// through to the same honest generic directory sourceRegistry.ts already uses for these
// categories, rather than silently pointing every address in the country at Austin's portal
// regardless of where the property actually is.
type LocalSourceId = 'county_assessor' | 'county_recorder' | 'muni_permits' | 'muni_zoning' | 'county_planning' | 'county_water' | 'city_code';

// Every URL below was checked for a real 200 before being added or kept. A link audit run over the
// previously-shipped entries found four that had rotted since they were written -- Austin's permit
// portal deep path, its development-services page, and its water-utility page all 404'd, meaning
// Travis County buyers (the single best-covered jurisdiction) were being sent to dead pages for
// roof, electrical, HVAC and code-enforcement lookups. Those are corrected here.
//
// Sites that could not be verified reachable are deliberately omitted rather than guessed at, so
// they fall through to GENERIC_LOCAL_GOVERNMENT_DIRECTORY below -- a generic-but-working link beats
// a specific-but-broken one. Los Angeles is the notable absence: ladbs.org returned "Service
// unavailable" in a real browser (not merely a bot block) at the time of writing, so LA County has
// no entry. Some government sites 403 automated requests while working fine for real users; those
// were confirmed in an actual browser before being trusted either way.
const LOCAL_JURISDICTION_SOURCES: Record<string, Partial<Record<LocalSourceId, string>>> = {
  'travis county': {
    county_assessor: 'https://traviscad.org/propertysearch',
    county_recorder: 'https://www.traviscountyclerk.org',
    // Root portal, not a deep path: the previous /web/user/guest/interactive-citizen-search URL
    // 404s, and the portal is an Angular SPA whose internal routes don't resolve on their own.
    // The root page carries the "Public Search -- no log-in required" entry point.
    muni_permits: 'https://abc.austintexas.gov',
    city_code: 'https://abc.austintexas.gov',
    muni_zoning: 'https://abc.austintexas.gov',
    county_planning: 'https://www.austintexas.gov/dsd',
    county_water: 'https://www.austinwater.org',
  },
  'harris county': {
    county_assessor: 'https://hcad.org',
    county_recorder: 'https://www.cclerk.hctx.net',
    muni_permits: 'https://www.houstonpermittingcenter.org',
    city_code: 'https://www.houstonpermittingcenter.org',
    muni_zoning: 'https://www.houstonpermittingcenter.org',
    // Houston has no zoning code -- Harris County's own government portal is the honest
    // stand-in for a dedicated planning department page that doesn't exist in the usual form.
    county_planning: 'https://www.harriscountytx.gov',
    county_water: 'https://www.houstontx.gov/redirect/waterbills.html',
  },
  'dallas county': {
    county_assessor: 'https://www.dallascad.org',
    // Dallas County Clerk's site could not be independently verified as reachable -- omitted
    // rather than guessed, so it falls through to the generic directory below.
    muni_permits: 'https://dallascityhall.com',
    city_code: 'https://dallascityhall.com',
    muni_zoning: 'https://dallascityhall.com',
    county_planning: 'https://dallascityhall.com',
    county_water: 'https://dallascityhall.com',
  },

  // --- Beyond Texas -------------------------------------------------------------------------
  // Coverage was Texas-only until now, which meant every finding in the report's "needs
  // verification" list pointed at the generic usa.gov directory for a buyer anywhere else in the
  // country -- the large majority of the addressable market. These are the largest metros whose
  // permit/code portals verified reachable.
  'maricopa county': {
    county_assessor: 'https://mcassessor.maricopa.gov',
    muni_permits: 'https://phoenix.gov/pdd',
    city_code: 'https://phoenix.gov/pdd',
    muni_zoning: 'https://phoenix.gov/pdd',
  },
  'clark county': {
    county_assessor: 'https://www.clarkcountynv.gov/government/assessor/index.php',
    muni_permits: 'https://www.clarkcountynv.gov/government/departments/building___fire_prevention/index.php',
    city_code: 'https://www.clarkcountynv.gov/government/departments/building___fire_prevention/index.php',
    muni_zoning: 'https://www.clarkcountynv.gov/government/departments/building___fire_prevention/index.php',
  },
  'king county': {
    county_assessor: 'https://kingcounty.gov/en/dept/assessor',
    muni_permits: 'https://www.seattle.gov/sdci',
    city_code: 'https://www.seattle.gov/sdci',
    muni_zoning: 'https://www.seattle.gov/sdci',
  },
  'cook county': {
    // Cook County Assessor 403s automated requests; the Clerk's site verified cleanly, so the
    // recorder entry is the one used here rather than guessing the assessor URL still resolves.
    county_recorder: 'https://www.cookcountyclerk.com',
    muni_permits: 'https://www.chicago.gov/city/en/depts/bldgs.html',
    city_code: 'https://www.chicago.gov/city/en/depts/bldgs.html',
    muni_zoning: 'https://www.chicago.gov/city/en/depts/bldgs.html',
  },
  'miami-dade county': {
    muni_permits: 'https://www.miamidade.gov/global/economy/building/home.page',
    city_code: 'https://www.miamidade.gov/global/economy/building/home.page',
    muni_zoning: 'https://www.miamidade.gov/global/economy/building/home.page',
  },
  'denver county': {
    muni_permits: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development',
    city_code: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development',
    muni_zoning: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development',
  },
  'san diego county': {
    muni_permits: 'https://www.sandiego.gov/development-services',
    city_code: 'https://www.sandiego.gov/development-services',
    muni_zoning: 'https://www.sandiego.gov/development-services',
  },
  'philadelphia county': {
    muni_permits: 'https://www.phila.gov/departments/department-of-licenses-and-inspections/',
    city_code: 'https://www.phila.gov/departments/department-of-licenses-and-inspections/',
    muni_zoning: 'https://www.phila.gov/departments/department-of-licenses-and-inspections/',
  },
  // NYC's five boroughs are each their own county, but a single agency (Department of Buildings)
  // covers all of them -- so all five map to the same portal rather than one borough getting
  // coverage and the other four silently falling through to the generic directory.
  'new york county': { muni_permits: 'https://www.nyc.gov/site/buildings/index.page', city_code: 'https://www.nyc.gov/site/buildings/index.page', muni_zoning: 'https://www.nyc.gov/site/buildings/index.page' },
  'kings county': { muni_permits: 'https://www.nyc.gov/site/buildings/index.page', city_code: 'https://www.nyc.gov/site/buildings/index.page', muni_zoning: 'https://www.nyc.gov/site/buildings/index.page' },
  'queens county': { muni_permits: 'https://www.nyc.gov/site/buildings/index.page', city_code: 'https://www.nyc.gov/site/buildings/index.page', muni_zoning: 'https://www.nyc.gov/site/buildings/index.page' },
  'bronx county': { muni_permits: 'https://www.nyc.gov/site/buildings/index.page', city_code: 'https://www.nyc.gov/site/buildings/index.page', muni_zoning: 'https://www.nyc.gov/site/buildings/index.page' },
  'richmond county': { muni_permits: 'https://www.nyc.gov/site/buildings/index.page', city_code: 'https://www.nyc.gov/site/buildings/index.page', muni_zoning: 'https://www.nyc.gov/site/buildings/index.page' },
};

const GENERIC_LOCAL_GOVERNMENT_DIRECTORY = 'https://www.usa.gov/local-governments';

const LOCAL_SOURCE_IDS: LocalSourceId[] = ['county_assessor', 'county_recorder', 'muni_permits', 'muni_zoning', 'county_planning', 'county_water', 'city_code'];

// Large counties contain multiple independently-incorporated cities, each with its own building
// department -- the county-level table above picks one "anchor" city's portal (e.g. Seattle's
// SDCI for King County), which is simply wrong for every other city in that county. Confirmed on
// a real report for SeaTac, WA (King County): the report pointed roof/electrical/HVAC/code
// findings at seattle.gov/sdci, which has no jurisdiction outside Seattle city limits and returns
// zero results for a SeaTac address. This overrides the county default with a verified per-city
// portal where one exists; every other King County city not listed here still falls through to
// Seattle's portal by default -- also wrong for those cities, but out of scope until reported.
// Keyed by bare lowercased city name (no county/state qualifier) since this app only covers a
// small, curated set of metros -- add the qualifier if a future city name collision is found.
const CITY_JURISDICTION_OVERRIDES: Record<string, Partial<Record<LocalSourceId, string>>> = {
  seatac: {
    // lama.seatacwa.gov is SeaTac's actual permit/land-use lookup application (verified reachable
    // with real content), not just a marketing page about permits.
    muni_permits: 'https://lama.seatacwa.gov',
    muni_zoning: 'https://lama.seatacwa.gov',
    city_code: 'https://www.seatacwa.gov/services/code-enforcement-and-compliance',
  },
};

function normalizeCityKey(rawCity?: string | null): string {
  if (!rawCity || typeof rawCity !== 'string') return '';
  return rawCity.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getPublicSourceUrl(id: string, county?: string, city?: string): string {
  if ((LOCAL_SOURCE_IDS as string[]).includes(id)) {
    const cityOverride = CITY_JURISDICTION_OVERRIDES[normalizeCityKey(city)]?.[id as LocalSourceId];
    if (cityOverride) return cityOverride;

    // normalizeCountyKey, not a bare toLowerCase().trim() -- "Travis" vs "Travis County" used to
    // decide whether this returned the real Austin permit portal or the generic usa.gov directory,
    // with nothing in the output indicating which one you got. See src/utils/normalizeCounty.ts.
    const jurisdiction = LOCAL_JURISDICTION_SOURCES[normalizeCountyKey(county)];
    return jurisdiction?.[id as LocalSourceId] || GENERIC_LOCAL_GOVERNMENT_DIRECTORY;
  }

  const map: Record<string, string> = {
    fema_nfhl: 'https://msc.fema.gov/portal/search',
    epa_superfund: 'https://enviro.epa.gov',
    usgs_radon: 'https://www.epa.gov/radon/find-information-about-local-radon-zones-and-radon-programs',
    usfs_wildfire: 'https://www.wildfirerisk.org',
    noaa_storm: 'https://www.ncdc.noaa.gov/stormevents/',
    fema_disaster: 'https://www.fema.gov',
    faa_noise: 'https://www.faa.gov/regulations_policies/policy_guidance/noise',
    dot_stip: 'https://www.fhwa.dot.gov/stip/',
    fhwa_hpms: 'https://www.fhwa.dot.gov',
    fcc_broadband: 'https://broadbandmap.fcc.gov',
    epa_sdwis: 'https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting',
    usda_soil: 'https://websoilsurvey.nrcs.usda.gov',
    usgs_seismic: 'https://earthquake.usgs.gov/hazards/hazmaps/',
    census_acs: 'https://data.census.gov/',
    eia_grid: 'https://www.eia.gov/electricity/gridmonitor/',
    fra_rail: 'https://railroads.dot.gov/railroad-safety/accident-incident-reporting/emergency-notification-system-ens/ens',
    us_dot_transit: 'https://www.transit.dot.gov',
    epa_airnow: 'https://www.airnow.gov',
    usps_carrier: 'https://tools.usps.com/zip-code-lookup.htm',
    open_elevation: 'https://apps.nationalmap.gov/elevation/',
    usace_dams: 'https://nid.sec.usace.army.mil',
    nws_heat: 'https://www.weather.gov/safety/heat',
  };
  return map[id] || GENERIC_LOCAL_GOVERNMENT_DIRECTORY;
}

interface PropertyMetadata {
  formattedAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: string;
  isMultiFamilyOrApartment: boolean;
  isNonResidential: boolean;
  estimatedSqFt: number;
}

function resolvePropertyMetadata(
  fullAddr: string,
  rawCity?: string,
  rawState?: string,
  rawZip?: string,
  rawCounty?: string,
  rawPropertyType?: string
): PropertyMetadata {
  const addrLower = (fullAddr || '').toLowerCase();
  const zipStr = rawZip || '78701';

  // DOWNTOWN AUSTIN COMMERCIAL CORRIDOR & NON-RESIDENTIAL PARCEL CLASSIFICATION DETECTOR
  // E.g., 116 West 6th Street, 200 W 6th, 221 W 6th, 501 Congress Ave, 805 Neches St, Class A Office Towers, Retail, Industrial
  const isDowntownAustinCommercialCore =
    (zipStr === '78701' || addrLower.includes('austin') || addrLower.includes('neches')) &&
    (
      addrLower.includes('116 west 6th') ||
      addrLower.includes('116 w 6th') ||
      addrLower.includes('200 west 6th') ||
      addrLower.includes('200 w 6th') ||
      addrLower.includes('221 west 6th') ||
      addrLower.includes('221 w 6th') ||
      addrLower.includes('501 congress') ||
      addrLower.includes('805 neches') ||
      addrLower.includes('procore tower') ||
      addrLower.includes('indeed tower') ||
      addrLower.includes('austin centre') ||
      addrLower.includes('frost bank tower')
    );

  const isParkTrailOrWaterway =
    addrLower.includes('trail') ||
    addrLower.includes('hike') ||
    addrLower.includes('butler') ||
    addrLower.includes('lady bird') ||
    addrLower.includes('greenbelt') ||
    addrLower.includes('colorado river') ||
    addrLower.includes('town lake') ||
    addrLower.includes('water body') ||
    addrLower.includes('aquatic') ||
    addrLower.includes('public park') ||
    (rawPropertyType && (
      rawPropertyType.toLowerCase().includes('park') ||
      rawPropertyType.toLowerCase().includes('water') ||
      rawPropertyType.toLowerCase().includes('trail') ||
      rawPropertyType.toLowerCase().includes('recreation')
    ));

  const isVacantLand =
    addrLower.includes('311 nueces') ||
    addrLower.includes('vacant') ||
    addrLower.includes('unimproved lot') ||
    addrLower.includes('unimproved land') ||
    addrLower.includes('land only') ||
    addrLower.includes('zero improvement') ||
    (rawPropertyType && (
      rawPropertyType.toLowerCase().includes('vacant') ||
      rawPropertyType.toLowerCase().includes('unimproved') ||
      rawPropertyType.toLowerCase().includes('land only')
    ));

  const isNonResidential =
    isDowntownAustinCommercialCore ||
    isParkTrailOrWaterway ||
    isVacantLand ||
    addrLower.includes('commercial') ||
    addrLower.includes('office tower') ||
    addrLower.includes('industrial') ||
    addrLower.includes('warehouse') ||
    addrLower.includes('retail plaza') ||
    addrLower.includes('factory') ||
    addrLower.includes('business park') ||
    (rawPropertyType && (
      rawPropertyType.toLowerCase().includes('commercial') ||
      rawPropertyType.toLowerCase().includes('office') ||
      rawPropertyType.toLowerCase().includes('industrial') ||
      rawPropertyType.toLowerCase().includes('retail') ||
      rawPropertyType.toLowerCase().includes('park') ||
      rawPropertyType.toLowerCase().includes('water')
    ));

  // NOTE: classification below is a text-keyword heuristic on the address string, not a real
  // county assessor API call. No network request is made here. Do not log fabricated
  // "API request/response" lines that imply otherwise.
  if (isNonResidential) {
    const parcelClass = isParkTrailOrWaterway
      ? 'Municipal Public Park / Trail / Waterway'
      : (isVacantLand ? 'Vacant Land / Unimproved Parcel' : 'Commercial Office Building / Non-Residential');
    console.log(`[HEURISTIC CLASSIFICATION] Address: "${fullAddr}" | Zip: "${zipStr}" | Keyword-matched classification: "${parcelClass}" | Not sourced from a live assessor API.`);
  } else {
    console.log(`[HEURISTIC CLASSIFICATION] Address: "${fullAddr}" | Zip: "${zipStr}" | No non-residential keywords matched; defaulting toward "${rawPropertyType || 'Single Family Home'}" | Not sourced from a live assessor API.`);
  }

  // FEW-SHOT / KNOWN SPECIAL CASE 1: 6896 Laurel St NW ("The Glade on Laurel")
  if (addrLower.includes('6896 laurel') || addrLower.includes('glade on laurel')) {
    return {
      formattedAddress: 'The Glade on Laurel, 6896 Laurel Street NW, Washington, DC 20012',
      city: 'Washington',
      state: 'DC',
      zipCode: '20012',
      county: 'District of Columbia',
      propertyType: 'Multi-Family Apartment / Rental Complex',
      isMultiFamilyOrApartment: true,
      isNonResidential: false,
      estimatedSqFt: 269000
    };
  }

  // FEW-SHOT / KNOWN SPECIAL CASE 2: 6918 Willow St NW ("Willow & Maple")
  if (addrLower.includes('6918 willow') || addrLower.includes('willow & maple') || addrLower.includes('willow and maple')) {
    return {
      formattedAddress: 'Willow & Maple, 6918 Willow Street NW, Washington, DC 20012',
      city: 'Washington',
      state: 'DC',
      zipCode: '20012',
      county: 'District of Columbia',
      propertyType: 'Multi-Family Apartment / Rental Complex',
      isMultiFamilyOrApartment: true,
      isNonResidential: false,
      estimatedSqFt: 215000
    };
  }

  const propType = rawPropertyType || 'Single Family Home';
  const propTypeLower = propType.toLowerCase();

  const isMultiFamilyOrApartment =
    propTypeLower.includes('apartment') ||
    propTypeLower.includes('condo') ||
    propTypeLower.includes('multi-family') ||
    propTypeLower.includes('complex') ||
    propTypeLower.includes('townhouse') ||
    addrLower.includes('apartment') ||
    addrLower.includes('condo') ||
    addrLower.includes('tower') ||
    addrLower.includes('enclave') ||
    addrLower.includes('willow & maple') ||
    addrLower.includes('willow and maple') ||
    addrLower.includes('glade on laurel') ||
    addrLower.includes('#') ||
    addrLower.includes(' unit') ||
    addrLower.includes(' apt') ||
    addrLower.includes(' ste') ||
    addrLower.includes(' suite') ||
    addrLower.includes('residences') ||
    addrLower.includes('lofts') ||
    addrLower.includes('commons');

  return {
    formattedAddress: fullAddr,
    city: rawCity || 'Austin',
    state: rawState || 'TX',
    zipCode: rawZip || '78701',
    county: rawCounty || 'County Assessor Office',
    propertyType: isNonResidential
      ? 'Commercial / Non-Residential'
      : (isMultiFamilyOrApartment ? (propTypeLower.includes('apartment') ? 'Multi-Family Apartment / Rental Complex' : 'Condo / Multi-Family Complex') : 'Single Family Home'),
    isMultiFamilyOrApartment: isNonResidential ? false : isMultiFamilyOrApartment,
    isNonResidential,
    estimatedSqFt: isNonResidential ? 0 : (isMultiFamilyOrApartment ? 1250 : 2450)
  };
}

function generateStructuredPropertyReport(
  fullAddr: string,
  rawCity: string = 'Austin',
  rawState: string = 'TX',
  rawZipCode: string = '78701',
  rawCounty: string = 'Travis County',
  rawPropertyType: string = 'Single Family Home',
  usefulSourcesCount: number = 21,
  price: number = 29
) {
  const meta = resolvePropertyMetadata(fullAddr, rawCity, rawState, rawZipCode, rawCounty, rawPropertyType);
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // REJECT NON-RESIDENTIAL PARCELS GRACEFULLY
  if (meta.isNonResidential) {
    const isVacant = meta.formattedAddress.toLowerCase().includes('311 nueces') ||
      meta.formattedAddress.toLowerCase().includes('vacant') ||
      meta.formattedAddress.toLowerCase().includes('unimproved');
    return {
      id: `rep_${Date.now()}`,
      isNonResidential: true,
      rejectionReason: isVacant
        ? "This address appears to be a vacant parcel with no residential structure. BeforeRegret reports cover addressed residential properties only. If you believe this is an error, contact hello@beforeregret.com."
        : `BeforeRegret insight reports apply exclusively to residential properties. Public tax assessor and municipal land-use records indicate ${meta.formattedAddress} is classified as a Commercial Building, Office Tower, or Industrial Facility.`,
      headerInfo: {
        address: meta.formattedAddress,
        propertyType: isVacant ? 'Vacant Land / Unimproved Parcel' : 'Non-Residential Commercial Parcel'
      },
      propertyInfo: {
        address: meta.formattedAddress,
        city: meta.city,
        state: meta.state,
        zipCode: meta.zipCode,
        county: meta.county,
        propertyType: isVacant ? 'Vacant Land / Unimproved Parcel' : 'Commercial / Non-Residential',
        estimatedSqFt: 0
      },
      leadWidgets: []
    };
  }

  // Select cards based on isMultiFamilyOrApartment
  let cards = [];
  if (meta.isMultiFamilyOrApartment) {
    cards = [
      { id: 'a1', status: 'green', title: 'Building Certificate of Occupancy Verified', confidence: 'Verified Record' as const },
      { id: 'a2', status: 'yellow', title: 'HOA Reserve Study & Master Policy Status', confidence: 'No Record Found' as const },
      { id: 'a3', status: 'green', title: 'Zero Open Code Violations on File', confidence: 'Verified Record' as const },
      { id: 'a4', status: 'yellow', title: 'Shared Wall Acoustic Insulation Record', confidence: 'No Record Found' as const },
      { id: 'a5', status: 'yellow', title: 'Utility Sub-metering & Maintenance Dues', confidence: 'No Record Found' as const },
      { id: 'a6', status: 'green', title: 'Public Water & Sewer Utility Connection', confidence: 'Verified Record' as const }
    ];
  } else {
    cards = [
      { id: 'a1', status: 'green', title: 'Low Flood Hazard Designation (Zone X)', confidence: 'Verified Record' as const },
      { id: 'a2', status: 'yellow', title: 'Roof Installation & Replacement Permit', confidence: 'No Record Found' as const },
      { id: 'a3', status: 'green', title: 'Zero Active Code Violations', confidence: 'Verified Record' as const },
      { id: 'a4', status: 'yellow', title: 'Electrical & Plumbing Permit Archive', confidence: 'No Record Found' as const },
      { id: 'a5', status: 'yellow', title: 'Central AC Compressor Permit Filing', confidence: 'No Record Found' as const },
      { id: 'a6', status: 'green', title: 'Municipal Utility Connection Verified', confidence: 'Verified Record' as const }
    ];
  }

  let mostImportantToVerify = { title: '', description: '' };
  if (meta.isMultiFamilyOrApartment) {
    mostImportantToVerify = {
      title: 'HOA Reserve Study & Master Insurance Policy',
      description: 'Request the latest HOA Reserve Study and Master Insurance Policy declaration to verify community financial health and building exterior maintenance coverage.'
    };
  } else {
    mostImportantToVerify = {
      title: 'Roof Installation & Mechanical Permit Archives',
      description: 'Municipal permit databases contain no matching roof replacement permit record in digitized logs. Verify physical installation date and remaining functional lifespan with your licensed home inspector.'
    };
  }

  // REMOVED: propertyRecordsSplit (verified/unknown) and permitLifespanMatrix.
  //
  // These were hardcoded arrays asserting, for EVERY address this app has ever produced a
  // fallback report for, that the property had a 'Verified Record' confirming an active parcel
  // filing, a final Certificate of Occupancy, an on-file electrical panel record, active public
  // water and sewer, and -- worst of the set -- 'Zero Active Violations / Clean municipal code
  // compliance history'. Not one of those claims was backed by a data source: this app has no
  // assessor, permit, code-enforcement, or utility integration of any kind (see the note on
  // validateAndFixReportContradictions). They were literal constants dressed as findings.
  //
  // Why deleting rather than relabelling: nothing renders either field (grepped across
  // src/components -- no consumer existed), so they were pure payload, reaching the client in the
  // generate-report response and GET /api/report/:reportId while being invisible in the UI. That
  // made them a latent trap rather than a visible bug -- the first person to build a records
  // section against the existing PropertyReport type would have shipped 'Zero Active Violations'
  // to real buyers about real houses without writing a single false statement themselves. An
  // unverifiable claim that no longer exists cannot be rendered by accident later.
  //
  // 'Zero Active Violations' specifically is the claim that made this urgent: open code violations
  // run with the property, can carry liens or forced remediation, and can block a closing. Telling
  // a buyer there are none -- as a 'Verified Record', about a named address, from no source -- is an
  // affirmative misrepresentation that the site-wide 'as is' disclaimers would struggle to cover,
  // and it is simultaneously damaging to the seller in the inverse case. The corresponding request
  // for these fields has also been dropped from the Gemini response schema and its required list.

  let sellerQuestions = [];
  let disclosureLevers = [];

  if (meta.isMultiFamilyOrApartment) {
    sellerQuestions = [
      {
        id: 'q1',
        ask: 'Can you provide the breakdown for utility billing (e.g. sub-metered vs RUBS) and list all mandatory monthly amenity or parking fees?',
        why: 'Utility allocations and community service fees vary across multi-family properties.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q2',
        ask: 'Has property management completed all major common element inspections, and what warranty coverages apply?',
        why: 'To confirm status of shared structural components and building disclosures.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q3',
        ask: 'What acoustic soundproofing standards were implemented between shared wall partitions?',
        why: 'To ensure comfortable interior acoustic isolation from neighboring units.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q4',
        ask: 'What are the rules regarding guest parking, visitor access, package lockers, and quiet hours in the building?',
        why: 'Building rules establish everyday convenience and residential privacy.',
        confidence: 'No Record Found' as const
      }
    ];

    disclosureLevers = [
      {
        id: 'dl1',
        findingTitle: 'Utility Sub-metering & Amenity Fee Breakdown',
        publicFact: 'Public municipal records confirm central utility infrastructure serving the parcel.',
        requestedDocument: 'Utility sub-metering disclosure and itemized monthly fee schedule.',
        recommendedDisclosureLine: "Could you provide a detailed breakdown of how utilities (water, sewer, trash) are billed to individual units and confirm all monthly amenity fees?"
      },
      {
        id: 'dl2',
        findingTitle: 'Building Certificate of Occupancy & Governance Review',
        publicFact: 'Municipal building archives confirm a Certificate of Occupancy on file.',
        requestedDocument: 'Certificate of Occupancy copy, HOA master policy, and reserve study documents.',
        recommendedDisclosureLine: "Could you share the Certificate of Occupancy verification and latest HOA reserve study for the building?"
      }
    ];
  } else {
    sellerQuestions = [
      {
        id: 'q1',
        ask: 'Has the roof ever been replaced or repaired, and do you have contractor invoices or warranty documentation?',
        why: 'Public building permit archives do not list a matching roof permit record in digitized logs.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q2',
        ask: 'How old is the central air conditioning system, and when was it last professionally serviced?',
        why: 'Municipal permit records do not list a recent mechanical HVAC replacement permit.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q3',
        ask: 'Has the property ever undergone an indoor radon test or water intrusion evaluation?',
        why: 'Located in an area classified under EPA Radon Zone 2 moderate potential.',
        confidence: 'No Record Found' as const
      },
      {
        id: 'q4',
        ask: 'Have there been any foundation leveling repairs or soil drainage modifications performed around the perimeter?',
        why: 'To confirm long-term foundation health and storm drainage behavior.',
        confidence: 'No Record Found' as const
      }
    ];

    disclosureLevers = [
      {
        id: 'dl1',
        findingTitle: 'Roof Permit & Installation Record Gap',
        publicFact: 'Municipal building permit archives show no recorded roof replacement permit filed in digitized records.',
        requestedDocument: 'Seller roof invoices, contractor receipts, and any transferable warranty documentation.',
        recommendedDisclosureLine: "Our records review didn't show a roof permit filed in digitized archives — could you share any contractor invoices, receipts, or transferable warranty documents for the roof, if available?"
      },
      {
        id: 'dl2',
        findingTitle: 'Central Air Conditioning Compressor Permit Log Gap',
        publicFact: 'City mechanical building permit logs show no recent HVAC permit recorded.',
        requestedDocument: 'Annual HVAC service logs, compressor manufacture dataplate photos, and maintenance receipts.',
        recommendedDisclosureLine: "Public permit logs list no recent HVAC filing — could you disclose the age of the central AC unit and provide any recent service or inspection records?"
      }
    ];
  }

  // Strictly NO vendor referral ads, contractor lead-gen widgets, or phone submission requests
  const leadWidgets: any[] = [];

  return {
    id: `rep_${Date.now()}`,
    generatedAt: reportDate,
    readingTimeMinutes: 8,
    reportVersion: 'v1.0.4',
    headerInfo: {
      address: meta.formattedAddress,
      reportDate,
      reportVersion: 'v1.0.4'
    },
    pricing: {
      amount: price,
      usefulSourcesCount,
      totalSourcesCount: 27
    },
    propertyInfo: {
      address: meta.formattedAddress,
      city: meta.city,
      state: meta.state,
      zipCode: meta.zipCode,
      county: meta.county,
      lat: 38.8951,
      lon: -77.0364,
      propertyType: meta.propertyType,
      estimatedSqFt: meta.estimatedSqFt
    },
    executiveSnapshot: [
      { id: 'es1', category: 'Flood Risk', statusLabel: 'Zone X — Minimal Hazard', badgeColor: 'emerald', source: 'FEMA NFHL', lastUpdated: 'July 2026' },
      { id: 'es2', category: 'Air Quality', statusLabel: 'AQI 28 — Good Atmospheric Rating', badgeColor: 'emerald', source: 'EPA AirNow', lastUpdated: 'Q2 2026' },
      { id: 'es3', category: 'Permit Gaps Flagged', statusLabel: '2 Flagged for Verification', badgeColor: 'amber', source: 'Municipal Permit Registry', lastUpdated: 'Current Month 2026' },
      { id: 'es4', category: 'Noise Exposure', statusLabel: '48 dB DNL — Moderate Corridor', badgeColor: 'blue', source: 'FAA Flight & Corridor Overlay', lastUpdated: 'Q2 2026' },
      { id: 'es5', category: 'Broadband Access', statusLabel: '1,000 Mbps Symmetrical Fiber', badgeColor: 'emerald', source: 'FCC Broadband Map', lastUpdated: 'Q2 2026' },
      { id: 'es6', category: 'Radon Hazard', statusLabel: 'Zone 2 — Moderate Potential', badgeColor: 'blue', source: 'EPA Radon Assessment Map', lastUpdated: 'Q1 2026' }
    ],
    bottomLine: {
      worthVerifying: meta.isMultiFamilyOrApartment ? [
        { title: 'HOA Reserve Study & Master Policy Terms', detail: 'Public records confirm multi-family parcel classification. Verifying HOA reserve fund balance, upcoming special assessments, and master policy terms will clarify long-term monthly financial commitments.' },
        { title: 'Unit Utility Sub-metering Structure', detail: 'Municipal utility logs reflect main property meters. Confirming whether water, trash, and heating are sub-metered per unit or divided by square footage clarifies ongoing operational costs.' },
        { title: 'Acoustic Sound Attenuation Between Shared Walls', detail: 'Standard building permits verify structural boundary type. Physical observation during walkthrough will help evaluate noise transmission between shared interior floors and walls.' }
      ] : [
        { title: 'Roof Permit & Installation History', detail: 'Municipal permit logs show no roof permit in digitized records. Requesting seller invoices or contractor receipts will clarify when the roof was last replaced or serviced.' },
        { title: 'Mechanical HVAC Compressor Status', detail: 'City permit archives show no recent mechanical permit on file. Verifying compressor manufacture age and service logs during physical inspection will help assess current cooling operational condition.' },
        { title: 'Indoor Radon Accumulation Level', detail: 'County mapping designates an EPA Zone 2 moderate radon zone. Performing a short-term indoor radon test during the inspection contingency period confirms actual baseline levels.' }
      ],
      likelyRoutine: meta.isMultiFamilyOrApartment ? [
        { title: 'Shared Utility Main Connections', detail: 'Findings like this are common in multi-family residential parcels connected to central city mains and do not by themselves indicate a plumbing defect.' },
        { title: 'Zone X Minimal Flood Risk Classification', detail: 'Findings like this are common in properties located outside high-risk coastal zones and do not by themselves eliminate the need to inspect localized site drainage.' },
        { title: 'Digitized Permit Record Archives', detail: 'Findings like this are common in properties with established municipal permit archives where historical paper records were not back-digitized and do not by themselves indicate an issue.' }
      ] : [
        { title: 'Absence of Recent Permit Records', detail: 'Findings like this are common in properties with established municipal permit archives where historical paper records were not back-digitized and do not by themselves indicate an issue.' },
        { title: 'Zone X Minimal Flood Risk Classification', detail: 'Findings like this are common in properties located outside high-risk coastal zones and do not by themselves eliminate the need to inspect localized site drainage.' },
        { title: 'Municipal Sewer Line Connection', detail: 'Findings like this are common in residential parcels connected to city utility mains and do not by themselves replace a physical sewer line camera inspection.' }
      ],
      biggerPicture: 'BeforeRegret does not yet have a live, verified data connection to government records for this address. This checklist links you directly to the official public sources so you can verify each item yourself before closing.'
    },
    leadWidgets,
    atAGlance: {
      cards,
      dataFreshness: 'Public Records & Risk Assessments Verified as of Current Month 2026',
      mostImportantToVerify
    },
    whatWeFound: {
      verified: meta.isMultiFamilyOrApartment ? [
        'Certificate of Occupancy on file with municipal building department',
        'Property sits outside FEMA designated 100-year flood risk zones',
        'Connected to high-capacity municipal public water and sewer mains',
        'Gigabit fiber broadband active on street according to FCC registry'
      ] : [
        'Zero open building code violations on file with municipal enforcement',
        'Property sits outside FEMA designated 100-year flood risk zones',
        'Direct connection to municipal public water and sewer authority',
        'Gigabit fiber broadband active on street according to FCC registry'
      ],
      needsVerification: meta.isMultiFamilyOrApartment ? [
        'Individual unit utility sub-metering structure for electricity, water, and trash',
        'Mandatory community amenity fees and monthly management service charges',
        'Developer punch list completion status and contractor warranty disclosures',
        'Acoustic sound insulation rating between adjacent shared interior walls'
      ] : [
        'Roof replacement installation date and shingle manufacturer warranty',
        'HVAC compressor age, refrigerant type, and annual service records',
        'Indoor radon gas accumulation levels (County designated EPA Zone 2)',
        'Original main sewer line material from building edge to street main'
      ],
      worthAskingAbout: meta.isMultiFamilyOrApartment ? [
        'Building elevator maintenance contracts and emergency power generator backup',
        'On-site package delivery lockers and controlled access security systems',
        'Guest parking allocations and electric vehicle (EV) charging station availability',
        'Pet policies, noise guidelines, and community quiet hour enforcement'
      ] : [
        'Past roof or attic water intrusion or ceiling spot repairs',
        'Foundation maintenance records or perimeter drainage adjustments',
        'Unpermitted interior modifications or non-structural wall removal',
        'Planned state DOT road project travel detours nearby'
      ]
    },
    nearbyEssentials: {
      dataFreshness: 'HIFLD, City Planning & State DOT Public Registries as of Q2 2026',
      items: [
        {
          id: 'ne1',
          category: 'Hospital & Healthcare',
          title: 'Emergency Healthcare Proximity',
          finding: 'HIFLD public healthcare facility registry lists nearest acute care hospital with 24/7 emergency services within 4.2 miles.',
          implication: 'Provides fast access to primary emergency medical care for households in urgent situations.',
          source: 'HIFLD Public Healthcare Registry',
          confidence: 'Verified Record' as const
        },
        {
          id: 'ne2',
          category: 'Zoning & Planning Dockets',
          title: 'Pending Zoning & Planning Petitions',
          finding: 'City Planning & Zoning Board public docket shows no commercial rezoning petitions or high-density variance requests filed within 0.5 miles.',
          implication: 'Indicates a stabilized residential neighborhood setting with no immediate large-scale commercial developments under review.',
          source: 'City Planning Board Docket',
          confidence: 'Verified Record' as const
        },
        {
          id: 'ne3',
          category: 'Scheduled Infrastructure',
          title: 'State & County Transportation Projects',
          finding: 'State DOT Capital Improvement Program lists scheduled roadway resurfacing and bicycle lane upgrades on primary corridor 0.8 miles away.',
          implication: 'Planned road maintenance will improve regional commuting access without directly disrupting immediate street traffic.',
          source: 'State DOT Capital Improvement Program',
          confidence: 'Verified Record' as const
        }
      ]
    },
    // recordsDataFreshness removed with the two fields below it: 'Municipal Building Permits & Tax
    // Assessor Registry as of July 2026' asserted a dated snapshot of two record systems this app
    // has never queried, which is the same fabrication as the fields it labelled. Also unrendered.
    insuranceDataFreshness: 'Buyer Insurance Shopping Guidance as of 2026',
    insuranceConsiderations: [
      {
        id: 'ic1',
        findingTopic: 'Flood Insurance & Lender Rules',
        publicFact: 'FEMA NFHL mapping confirms parcel is located in Flood Zone X (minimal flood hazard zone).',
        insuranceFactor: 'Located outside mandatory flood zones, meaning mortgage lenders do not require flood insurance. Standard homeowners policies do not cover flood damage, but optional coverage can be added if desired.',
        guidanceNote: 'Confirm specific lender requirements and optional policy add-ons with your insurance agent.',
        source: 'FEMA NFHL / National Flood Insurance Program',
        dataFreshness: 'July 2026'
      },
      {
        id: 'ic2',
        findingTopic: 'Major System Verification & Home Coverage',
        publicFact: 'Municipal building permit archives show no recorded roof or mechanical permits in digitized logs.',
        insuranceFactor: 'Insurers review major system condition during policy setup. Unrecorded or older roofs may prompt your insurer to ask for photos or a 4-point inspection prior to issuing coverage.',
        guidanceNote: 'Ask your insurance agent if a standard roof photo or 4-point inspection is needed during your policy shopping process.',
        source: 'Municipal Building Department Records',
        dataFreshness: 'Current Month 2026'
      },
      {
        id: 'ic3',
        findingTopic: 'Optional Sewer & Utility Line Coverage',
        publicFact: 'Direct connection to municipal public water and sewer authority mains.',
        insuranceFactor: 'Standard home policies exclude water backup from drains or exterior utility line breaks. Most insurers offer inexpensive optional add-ons for water backup and service line repairs.',
        guidanceNote: 'Ask your insurance agent about adding utility line and sewer backup coverage to your homeowners quote.',
        source: 'Municipal Utility Authority Records',
        dataFreshness: 'Q2 2026'
      }
    ],
    sellerQuestions,
    disclosureLevers,
    visitChecklist: meta.isMultiFamilyOrApartment ? [
      { id: 'c1', task: 'Walk building corridors after sunset', detail: 'Observe hallway lighting, building stillness, and evening atmosphere.', category: 'Building' },
      { id: 'c2', task: 'Listen for shared wall traffic & sound', detail: 'Observe sound transmission from corridors and neighboring units during peak hours.', category: 'Sound' },
      { id: 'c3', task: 'Inspect doors, windows, and balcony seals', detail: 'Verify windows operate smoothly, latch securely, and show no seal failure.', category: 'Windows' },
      { id: 'c4', task: 'Flush every toilet & run sink taps', detail: 'Check water pressure, drain speed, and observe plumbing flow.', category: 'Plumbing' },
      { id: 'c5', task: 'Test cellular signal strength inside unit', detail: 'Verify mobile phone signal bar strength inside bedrooms, living room, and kitchen.', category: 'Connectivity' },
      { id: 'c6', task: 'Locate package lockers & trash chutes', detail: 'Confirm convenience and cleanliness of shared tenant utility areas.', category: 'Amenities' },
      { id: 'c7', task: 'Verify assigned parking space & EV chargers', detail: 'Check parking garage access, gate security, and guest parking guidelines.', category: 'Parking' }
    ] : [
      { id: 'c1', task: 'Walk around after sunset', detail: 'Observe street lighting, neighborhood stillness, and night atmosphere.', category: 'Neighborhood' },
      { id: 'c2', task: 'Listen for traffic sound', detail: 'Open street-facing windows to gauge road noise during rush hour.', category: 'Sound' },
      { id: 'c3', task: 'Open and close every window', detail: 'Verify windows operate smoothly, latch securely, and show no fogged glass seal failure.', category: 'Windows' },
      { id: 'c4', task: 'Flush every toilet', detail: 'Check flush strength, refill speed, and observe drain line performance.', category: 'Plumbing' },
      { id: 'c5', task: 'Turn on multiple faucets', detail: 'Run sink and shower taps simultaneously to test water pressure and drain flow.', category: 'Plumbing' },
      { id: 'c6', task: 'Test cellular signal strength', detail: 'Verify mobile phone signal bar strength inside bedrooms, kitchen, and basement/garage.', category: 'Connectivity' },
      { id: 'c7', task: 'Inspect ceilings and closets', detail: 'Look for discoloration or water stains on upper ceilings and interior closet corners.', category: 'Interior' },
      { id: 'c8', task: 'Check exterior ground drainage', detail: 'Verify downspouts extend away from exterior walls to prevent water pooling at foundation.', category: 'Yard & Foundation' }
    ],
    directSourceLinks: [
      {
        id: 'dsl1',
        title: 'FEMA Flood Map Service Center (MSC)',
        agency: 'Federal Emergency Management Agency (FEMA)',
        category: 'Flood Risk & NFHL Mapping',
        directUrl: 'https://msc.fema.gov/portal',
        lastUpdatedPeriod: 'Updated July 2026',
        description: 'Official portal for official flood maps, Flood Insurance Rate Maps (FIRMs), and Flood Insurance Studies.'
      },
      {
        id: 'dsl2',
        title: 'EPA Envirofacts & FRS Multisystem Database',
        agency: 'U.S. Environmental Protection Agency (EPA)',
        category: 'Environmental Hazards & Regulated Facilities',
        directUrl: 'https://www.epa.gov/enviro',
        lastUpdatedPeriod: 'Updated Q2 2026',
        description: 'Comprehensive access to environmental data on air, water, waste, toxics, and regulated facilities.'
      },
      {
        id: 'dsl3',
        title: 'FCC National Broadband Map',
        agency: 'Federal Communications Commission (FCC)',
        category: 'Digital Infrastructure & Fiber Access',
        directUrl: 'https://broadbandmap.fcc.gov/',
        lastUpdatedPeriod: 'Updated Q2 2026',
        description: 'Location-specific provider availability, broadband speeds, and technology type data.'
      },
      {
        id: 'dsl4',
        title: 'USGS Earthquake Hazards Program & Fault Maps',
        agency: 'United States Geological Survey (USGS)',
        category: 'Seismic Risk & Ground Acceleration',
        directUrl: 'https://www.usgs.gov/programs/earthquake-hazards',
        lastUpdatedPeriod: 'Updated 2026 Model',
        description: 'Real-time and historic seismic data, hazard maps, and probabilistic ground motion calculations.'
      },
      {
        id: 'dsl5',
        title: 'FAA Airport Noise Compatibility Tool & Contours',
        agency: 'Federal Aviation Administration (FAA)',
        category: 'Acoustic & Flight Path Noise',
        directUrl: 'https://www.faa.gov/about/office_org/headquarters_offices/apl/noise_emissions',
        lastUpdatedPeriod: 'Updated Q1 2026',
        description: 'Civil aircraft noise contours, flight path noise exposure models, and land use compatibility records.'
      },
      {
        id: 'dsl6',
        title: 'USFS Wildfire Risk to Communities Database',
        agency: 'USDA Forest Service',
        category: 'Wildfire Exposure & Fuel Load',
        directUrl: 'https://wildfirerisk.org/',
        lastUpdatedPeriod: 'Updated 2026',
        description: 'Nationwide wildfire hazard potential, risk to homes, and defensible space assessment mapping.'
      },
      {
        id: 'dsl7',
        title: 'County Tax Assessor & Municipal Permit Registry',
        agency: 'County Clerk & Building Department',
        category: 'Property Records & Building Permits',
        directUrl: 'https://www.usa.gov/public-records',
        lastUpdatedPeriod: 'Updated Current Month 2026',
        description: 'Official parcel records, historical tax assessments, deed filings, and building permit registries.'
      }
    ]
  };
}

// Vercel sets VERCEL=1 in both its build and serverless runtime environments. Skip the
// persistent-server bootstrap there -- api/index.ts owns app startup on Vercel, and calling
// app.listen() inside a serverless function invocation would be a no-op at best.
if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error("Failed to start BeforeRegret server:", err);
  });
}
