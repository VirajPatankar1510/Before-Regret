import type { Express, Request, Response, NextFunction } from 'express';
import { withDb, isDbConfigured } from './db.js';

// Versioned, documented, cached, rate-limited public API -- the "clean door" for agents and
// developers to read the same county-hazard and guide data that already lives, unversioned and
// unprotected, behind /api/counties/:slug and /api/guides (both still used internally by the
// React app; neither gets touched here). Those two routes have no cache headers and no rate
// limiting -- fine when the only caller is your own frontend, not fine once a URL is published
// and crawled, since every request hits Neon directly. This file exists specifically to put
// caching and a request budget in front of the data before any doc, robots.txt line, or llms.txt
// entry points a stranger at it.

interface CountyRow {
  slug: string;
  county_name: string;
  state_name: string;
  state_abbrev: string;
  population: number | null;
  radon_zone: number | null;
  census_total_units: number | null;
  census_year_built_json: string;
  fema_risk_rating: string | null;
  fema_risk_score: number | null;
  fema_hazards_json: string;
  noaa_event_counts_json: string;
  noaa_years_covered: string | null;
  fetched_at: string;
}

function toApiShape(row: CountyRow) {
  return {
    slug: row.slug,
    countyName: row.county_name,
    stateName: row.state_name,
    stateAbbrev: row.state_abbrev,
    population: row.population,
    radonZone: row.radon_zone,
    censusTotalUnits: row.census_total_units,
    censusYearBuiltBuckets: JSON.parse(row.census_year_built_json || '{}'),
    femaRiskRating: row.fema_risk_rating,
    femaRiskScore: row.fema_risk_score,
    femaHazards: JSON.parse(row.fema_hazards_json || '{}'),
    noaaEventCounts: JSON.parse(row.noaa_event_counts_json || '{}'),
    noaaYearsCovered: row.noaa_years_covered,
    fetchedAt: row.fetched_at,
    source: 'https://www.beforeregret.com/county/' + row.slug + '/',
  };
}

// Per-warm-instance sliding window, not a distributed limiter -- there is no shared store (Redis,
// etc.) in this stack yet, and adding one is real infrastructure this first version deliberately
// skips. What this actually buys: server.ts's createApp() is built once and reused across
// requests on a warm Vercel lambda (see api/index.ts), so this Map persists and genuinely throttles
// a sustained burst from one client hitting one warm instance. What it does NOT do: coordinate
// across multiple concurrent instances or survive a cold start. That's an honest, known gap --
// acceptable for a v1 whose main defense is caching (below), not this. Upgrade path if usage
// ever justifies it: swap this Map for a Redis-backed limiter without changing the middleware's
// call site.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestLog = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestLog.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({
      success: false,
      error: `Rate limit exceeded: ${RATE_LIMIT_MAX_REQUESTS} requests per minute per IP. This is a free, unauthenticated tier -- see /api/v1/docs.`,
    });
    return;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  // Bound the map's growth on a long-lived warm instance -- without this, every distinct IP
  // that ever calls the API stays in memory for the lambda's whole lifetime.
  if (requestLog.size > 5000) {
    for (const [k, v] of requestLog) {
      if (v.every((t) => t <= windowStart)) requestLog.delete(k);
    }
  }
  next();
}

const DOCS_RESPONSE = {
  name: 'BeforeRegret Public API',
  version: 'v1',
  description:
    'Real-data county hazard information (FEMA National Risk Index, EPA radon zones, Census housing-age distribution, NOAA storm-event history) for the counties BeforeRegret has complete data for. Every value is sourced from the cited government agency and carries the fetchedAt timestamp of that agency query -- nothing here is model-generated or estimated.',
  endpoints: {
    'GET /api/v1/counties': 'List every county currently available, with slug, name, state, and population.',
    'GET /api/v1/county/{slug}': 'Full hazard record for one county. Slugs come from /api/v1/counties, e.g. bronx-county-ny.',
    'GET /api/v1/guides': 'List of published editorial guides (slug, title, meta description, publish date).',
  },
  rateLimit: `${RATE_LIMIT_MAX_REQUESTS} requests per minute per IP, unauthenticated. Responses are cached for up to 1 hour -- repeat lookups of the same county/guide list are effectively free.`,
  attribution: 'Free to use. If you build something on this data, a link back to https://www.beforeregret.com is appreciated but not enforced.',
  fabricationPolicy:
    "BeforeRegret does not fabricate data. If a county isn't returned, it means one or more of the four source agencies hasn't been independently verified for it yet -- there is no partial or best-effort record.",
  humanEquivalent: 'https://www.beforeregret.com/llms.txt',
};

export function registerPublicApiV1Routes(app: Express) {
  app.get('/api/v1/docs', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(DOCS_RESPONSE);
  });

  app.get('/api/v1/counties', rateLimit, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, county_name, state_name, state_abbrev, population
        FROM county_data WHERE data_complete = true AND page_enabled = true ORDER BY county_name ASC
      `);
      const counties = (rows as unknown as Array<Pick<CountyRow, 'slug' | 'county_name' | 'state_name' | 'state_abbrev' | 'population'>>).map((r) => ({
        slug: r.slug,
        countyName: r.county_name,
        stateName: r.state_name,
        stateAbbrev: r.state_abbrev,
        population: r.population,
      }));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ success: true, count: counties.length, counties });
    } catch (err: any) {
      console.error('[public-api-v1] counties list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load county list.' });
    }
  });

  app.get('/api/v1/county/:slug', rateLimit, async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM county_data WHERE slug = ${req.params.slug} AND data_complete = true LIMIT 1
      `);
      const row = (rows as unknown as CountyRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Not found. See /api/v1/counties for available slugs.' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ success: true, county: toApiShape(row) });
    } catch (err: any) {
      console.error('[public-api-v1] county lookup failed:', err);
      res.status(500).json({ success: false, error: 'Could not load county.' });
    }
  });

  app.get('/api/v1/guides', rateLimit, async (_req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, title, meta_description, published_at
        FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      const guides = (rows as unknown as Array<{ slug: string; title: string; meta_description: string; published_at: string | null }>).map((r) => ({
        slug: r.slug,
        title: r.title,
        metaDescription: r.meta_description,
        publishedAt: r.published_at,
        url: `https://www.beforeregret.com/guides/${r.slug}/`,
      }));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ success: true, count: guides.length, guides });
    } catch (err: any) {
      console.error('[public-api-v1] guides list failed:', err);
      res.status(500).json({ success: false, error: 'Could not load guides.' });
    }
  });
}
