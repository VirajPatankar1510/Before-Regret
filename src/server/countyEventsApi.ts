import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured, purgeExpiredReportRequestRecords, purgeExpiredIpRateLimitRecords } from './db.js';
import { hasValidSession } from './adminAuth.js';
import { isQuotaError, generateContentWithFallback, contentQuotaExhaustedMessage } from './geminiModel.js';
import { logGeminiUsage } from './geminiUsageTracker.js';
import { slugify } from './articlesApi.js';
import { getInspectionPriorities } from '../engine/inspectionPriorities.js';
import { KNOWN_SOURCES } from '../data/knownSources.js';
import {
  fetchRecentFemaDeclarations,
  matchDeclarationToCoveredCounty,
  femaDeclarationUrl,
} from './femaDeclarationsService.js';
import {
  COUNTY_EVENT_SYSTEM_INSTRUCTION,
  COUNTY_EVENT_RESPONSE_SCHEMA,
  buildCountyEventPrompt,
} from './countyEventGenerator.js';

// Checks for new FEMA disaster declarations in counties BeforeRegret already covers, and drafts
// an article for the first one that hasn't already been processed -- at most one Gemini call per
// request, not a loop over every match. Triggered two ways: a daily Vercel Cron hit (see
// vercel.json), authenticated with CRON_SECRET since a cron invocation carries no admin session
// cookie; and a manual "Check now" button in the SEO admin panel, authenticated the normal way.
// Every draft lands in the same `articles` table as any other guide, at status 'draft' -- nothing
// here ever publishes on its own. See docs at the top of countyEventGenerator.ts for why the
// citation-the-real-declaration rule is non-negotiable.
//
// One-at-a-time is a deliberate fix, not the original design: this route has no maxDuration
// override, so it runs on Vercel's default serverless timeout. Looping over every unprocessed
// match in one request was fine when this covered 31 counties ("a match inside 14 days is rare"),
// but confirmed live after expanding to 60: a single admin-triggered widened-lookback check found
// 3 real unprocessed matches at once, each needing its own sequential Gemini call, and the request
// timed out mid-run with a generic failure and nothing useful in the logs -- the platform killing
// the function, not this file's own catch block, which never got to run. Processing one match per
// request (repeat the check to work through a real backlog, same pattern as the defect-reference
// library and comparison-report generators) makes this timeout-proof regardless of how many real
// matches exist in a given window.

const LOOKBACK_DAYS = 14;

/** Vercel Cron invocations carry `Authorization: Bearer <CRON_SECRET>`, never a session cookie. */
function isAuthorizedCronOrAdmin(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }
  return hasValidSession(req);
}

interface CountyDataRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  radon_zone: number | null;
  census_year_built_json: string;
  fema_risk_rating: string | null;
  fema_risk_score: number | null;
  fema_hazards_json: string;
  noaa_event_counts_json: string;
  noaa_years_covered: string | null;
  data_complete: boolean;
}

// Maps each Census ACS "year structure built" bucket to a representative single year, so the
// existing (yearBuilt, county, state)-keyed inspection-priorities engine can be reused as-is
// rather than needing a bucket-aware variant. Picks the bucket with the most housing units --
// "dominant era" means plurality share, not majority, which is the honest framing (most counties
// don't have any single decade with >50% of the housing stock).
const BUCKET_REPRESENTATIVE_YEAR: Record<string, number> = {
  built2020OrLater: 2022, built2010to2019: 2015, built2000to2009: 2005,
  built1990to1999: 1995, built1980to1989: 1985, built1970to1979: 1975,
  built1960to1969: 1965, built1950to1959: 1955, built1940to1949: 1945,
  built1939OrEarlier: 1930,
};

function pickDominantEraYear(bucketsJson: string): { year: number; label: string } | null {
  let buckets: Record<string, number>;
  try {
    buckets = JSON.parse(bucketsJson || '{}');
  } catch {
    return null;
  }
  let bestKey: string | null = null;
  let bestCount = -1;
  for (const [key, count] of Object.entries(buckets)) {
    if (typeof count === 'number' && count > bestCount && key in BUCKET_REPRESENTATIVE_YEAR) {
      bestCount = count;
      bestKey = key;
    }
  }
  if (!bestKey || bestCount <= 0) return null;
  const year = BUCKET_REPRESENTATIVE_YEAR[bestKey];
  const labelMap: Record<string, string> = {
    built2020OrLater: '2020 or later', built2010to2019: '2010s', built2000to2009: '2000s',
    built1990to1999: '1990s', built1980to1989: '1980s', built1970to1979: '1970s',
    built1960to1969: '1960s', built1950to1959: '1950s', built1940to1949: '1940s',
    built1939OrEarlier: '1939 or earlier',
  };
  return { year, label: labelMap[bestKey] };
}

export function registerCountyEventsRoutes(app: Express) {
  // GET, not POST -- Vercel Cron only ever sends a GET request to the configured path (a POST
  // handler here would 405 on every scheduled run). The manual "Check now" button in the SEO
  // admin panel calls this same GET route.
  app.get('/api/admin/county-events/check', async (req: Request, res: Response) => {
    if (!isAuthorizedCronOrAdmin(req)) {
      res.status(401).json({ success: false, error: 'Not authorized.' });
      return;
    }
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }

    // Data-retention enforcement, deliberately piggybacked on this already-scheduled daily cron
    // rather than given its own vercel.json entry: cron count is a plan-limited resource, and this
    // route is already guaranteed to run once a day. Runs BEFORE the GEMINI_API_KEY check below --
    // the Privacy Policy's three-year deletion promise (see purgeExpiredReportRequestRecords in
    // db.ts) must be kept whether or not AI generation happens to be configured, and that check
    // returns 503 and aborts the handler. Fire-and-forget with its own catch for the same reason
    // the write side is: a failed purge must be visible in the log, not fatal to the cron run.
    void purgeExpiredReportRequestRecords()
      .then((deleted) => {
        if (deleted > 0) console.log(`[retention] Purged ${deleted} report request record(s) past the retention window.`);
      })
      .catch((err) => console.error('[retention] Failed to purge expired report request records:', err));

    // Same rationale, same schedule, separate promise: the rate-limit table holds raw IPs and is
    // only read for CURRENT_DATE, so anything older is undisclosed personal data serving no
    // purpose. Kept as its own fire-and-forget chain rather than chained onto the one above so a
    // failure in either purge can't silently prevent the other from running.
    void purgeExpiredIpRateLimitRecords()
      .then((deleted) => {
        if (deleted > 0) console.log(`[retention] Purged ${deleted} expired IP rate-limit record(s).`);
      })
      .catch((err) => console.error('[retention] Failed to purge expired IP rate-limit records:', err));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server (missing GEMINI_API_KEY).' });
      return;
    }

    const summary = {
      declarationsChecked: 0,
      coveredCountyMatches: 0,
      alreadyProcessed: 0,
      draftsCreated: 0,
      remainingCount: 0,
      processed: null as { disasterNumber: number; countySlug: string; slug: string } | null,
      errors: [] as string[],
    };

    // Optional ?days=N override, for testing against real historical declarations instead of
    // waiting for a live one. Capped at 400 days (a little over a year) so an admin testing this
    // can't accidentally trigger months of drafting across the whole declarations archive, which
    // goes back to 1953. The daily cron in vercel.json always hits the plain path with no query
    // param, so this only ever changes behavior for a request an admin deliberately sent.
    const requestedDays = parseInt(String(req.query.days ?? ''), 10);
    const lookbackDays = Number.isFinite(requestedDays) && requestedDays > 0
      ? Math.min(requestedDays, 400)
      : LOOKBACK_DAYS;

    try {
      const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
      const declarations = await fetchRecentFemaDeclarations(sinceIso);
      summary.declarationsChecked = declarations.length;

      const knownSourcesBlock = KNOWN_SOURCES.map((s) => `${s.key} = ${s.name}`).join('\n');

      // First pass: find every real, actionable match (not yet processed, has complete county
      // data) without spending a single Gemini call -- these are all cheap DB reads. A match with
      // no complete county_data row is deduped immediately here too (also cheap, no Gemini), same
      // "no data, no article" discipline as the rest of this app, so a permanently-incomplete
      // county doesn't get re-checked forever. Only the actual generation step below is expensive
      // enough to risk a timeout, so that's the only thing capped to one per request.
      const actionable: Array<{ declaration: typeof declarations[number]; match: NonNullable<ReturnType<typeof matchDeclarationToCoveredCounty>>; countyRow: CountyDataRow }> = [];
      for (const declaration of declarations) {
        const match = matchDeclarationToCoveredCounty(declaration);
        if (!match) continue;
        summary.coveredCountyMatches++;

        const alreadyProcessed = await withDb(async (sql) => {
          const rows = await sql`
            SELECT id FROM fema_declaration_events
            WHERE disaster_number = ${declaration.disasterNumber} AND county_slug = ${match.slug}
            LIMIT 1
          `;
          return rows.length > 0;
        });
        if (alreadyProcessed) {
          summary.alreadyProcessed++;
          continue;
        }

        const countyRow = await withDb(async (sql) => {
          const rows = await sql`
            SELECT * FROM county_data WHERE slug = ${match.slug} AND data_complete = true LIMIT 1
          `;
          return rows[0] as CountyDataRow | undefined;
        });
        if (!countyRow) {
          await withDb((sql) => sql`
            INSERT INTO fema_declaration_events (disaster_number, county_slug, fema_declaration_string, declaration_title)
            VALUES (${declaration.disasterNumber}, ${match.slug}, ${declaration.femaDeclarationString}, ${declaration.declarationTitle})
            ON CONFLICT (disaster_number, county_slug) DO NOTHING
          `);
          continue;
        }

        actionable.push({ declaration, match, countyRow });
      }

      summary.remainingCount = Math.max(0, actionable.length - 1);

      if (actionable.length > 0) {
        const { declaration, match, countyRow } = actionable[0];
        try {
          const dominantEra = pickDominantEraYear(countyRow.census_year_built_json);
          const eraResult = dominantEra
            ? getInspectionPriorities(dominantEra.year, countyRow.county_name, countyRow.state_abbrev)
            : null;
          // A county can have complete risk/hazard data but no matching inspection-priority rule
          // set (e.g. an implausible or missing dominant-era read) -- still draft the article, just
          // without era-specific priorities, rather than skipping a real, verified disaster event.
          const era = eraResult
            ? { regionLabel: eraResult.regionLabel, priorities: eraResult.priorities, insuranceRedFlags: eraResult.insuranceRedFlags }
            : { regionLabel: `${countyRow.county_name} County, ${countyRow.state_abbrev}`, priorities: [], insuranceRedFlags: [] };

          const guideRows = await withDb((sql) => sql`
            SELECT slug, title FROM articles WHERE status = 'published' ORDER BY published_at DESC
          `);
          const guides = (guideRows as unknown as Array<{ slug: string; title: string }>).map((g) => ({
            title: g.title,
            url: `https://www.beforeregret.com/guides/${g.slug}/`,
          }));

          const prompt = buildCountyEventPrompt({
            declaration: {
              disasterNumber: declaration.disasterNumber,
              femaDeclarationString: declaration.femaDeclarationString,
              declarationTitle: declaration.declarationTitle,
              incidentType: declaration.incidentType,
              declarationDate: declaration.declarationDate,
              incidentBeginDate: declaration.incidentBeginDate,
              declarationUrl: femaDeclarationUrl(declaration.disasterNumber),
            },
            county: {
              countyName: countyRow.county_name,
              stateAbbrev: countyRow.state_abbrev,
              countyUrl: `https://www.beforeregret.com/county/${match.slug}/`,
              femaRiskRating: countyRow.fema_risk_rating,
              femaRiskScore: countyRow.fema_risk_score,
              femaHazards: JSON.parse(countyRow.fema_hazards_json || '{}'),
              noaaEventCounts: JSON.parse(countyRow.noaa_event_counts_json || '{}'),
              noaaYearsCovered: countyRow.noaa_years_covered,
              radonZone: countyRow.radon_zone,
              dominantEraLabel: dominantEra?.label ?? 'not available',
            },
            era,
            guides,
            knownSourcesBlock,
          });

          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
          const { result: response, model: usedModel } = await generateContentWithFallback(ai, {
            contents: prompt,
            config: {
              systemInstruction: COUNTY_EVENT_SYSTEM_INSTRUCTION,
              temperature: 0.6,
              responseMimeType: 'application/json',
              responseSchema: COUNTY_EVENT_RESPONSE_SCHEMA,
            },
          });
          logGeminiUsage('county_event_generation', usedModel, response.usageMetadata);

          const raw = response.text?.trim() || '';
          const parsed = JSON.parse(raw);
          const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
          const bodyMarkdown = typeof parsed.bodyMarkdown === 'string' ? parsed.bodyMarkdown.trim() : '';
          if (!title || !bodyMarkdown) {
            throw new Error('Gemini returned an incomplete draft (missing title or body).');
          }

          const { id: articleId, slug: createdSlug } = await withDb(async (sql) => {
            const base = slugify(title);
            let slug = base;
            for (let attempt = 1; attempt <= 20; attempt++) {
              const existing = await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`;
              if (existing.length === 0) break;
              slug = `${base}-${attempt + 1}`;
            }
            const rows = await sql`
              INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, sources_json, status, article_type)
              VALUES (
                ${slug}, ${title},
                ${typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : ''},
                ${bodyMarkdown},
                ${typeof parsed.quickAnswer === 'string' ? parsed.quickAnswer.trim() : ''},
                ${JSON.stringify(Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed : [])},
                'draft',
                'news'
              )
              RETURNING id, slug
            `;
            return rows[0] as { id: number; slug: string };
          });

          await withDb((sql) => sql`
            INSERT INTO fema_declaration_events (disaster_number, county_slug, fema_declaration_string, declaration_title, article_id)
            VALUES (${declaration.disasterNumber}, ${match.slug}, ${declaration.femaDeclarationString}, ${declaration.declarationTitle}, ${articleId})
            ON CONFLICT (disaster_number, county_slug) DO NOTHING
          `);
          summary.draftsCreated = 1;
          summary.processed = { disasterNumber: declaration.disasterNumber, countySlug: match.slug, slug: createdSlug };
        } catch (innerErr: any) {
          console.error(`[county-events] failed to draft for disaster ${declaration.disasterNumber} / ${match.slug}:`, innerErr);
          summary.errors.push(`${declaration.femaDeclarationString} (${match.slug}): ${innerErr?.message || 'unknown error'}`);
        }
      }

      res.json({ success: true, summary: { ...summary, lookbackDays } });
    } catch (err: any) {
      console.error('[county-events] check failed:', err);
      if (isQuotaError(err)) {
        res.status(429).json({
          success: false,
          error: contentQuotaExhaustedMessage(),
        });
      } else {
        res.status(500).json({ success: false, error: 'County-event check failed. See server logs.' });
      }
    }
  });
}
