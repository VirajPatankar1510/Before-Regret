import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { buildCountyHazardSvg } from '../utils/countyHazardSvg.js';
import { computeCountyRankings, CountyMetricInput } from '../utils/countyRankings.js';

// Public read path for county research pages (see scripts/fetch-county-data.ts for how rows get
// here and CountyPageView.tsx for how they're rendered). data_complete = false is treated
// identically to a missing row -- a county whose data isn't fully verified is never reachable by
// its URL, enforcing the "no data, no page" rule at the read boundary as well as the write one.

interface CountyRow {
  id: number;
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
  data_complete: boolean;
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
  };
}

export function registerCountyRoutes(app: Express) {
  // --- Public: single county by slug, only if fully verified -------------------------------------
  app.get('/api/counties/:slug', async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(404).json({ success: false, error: 'Not found.' });
      return;
    }
    try {
      const [rows, rankingRows] = await Promise.all([
        withDb((sql) => sql`
          SELECT * FROM county_data WHERE slug = ${req.params.slug} AND data_complete = true LIMIT 1
        `),
        // All 31 (and growing) covered counties' minimal fields -- how this one ranks against the
        // rest is only computable with every county's numbers in hand, not just this one's own
        // row. See src/utils/countyRankings.ts for why this lives in a shared module: the static
        // prerender (scripts/prerender-counties.tsx) needs to compute the exact same rank from the
        // exact same input, or a crawler and a live visitor would see different numbers.
        withDb((sql) => sql`
          SELECT slug, census_total_units, census_year_built_json, fema_risk_score, noaa_event_counts_json
          FROM county_data WHERE data_complete = true
        `),
      ]);
      const row = (rows as unknown as CountyRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Not found.' });
        return;
      }
      const rankingInputs: CountyMetricInput[] = (rankingRows as unknown as Array<{
        slug: string; census_total_units: number | null; census_year_built_json: string;
        fema_risk_score: number | null; noaa_event_counts_json: string;
      }>).map((r) => ({
        slug: r.slug,
        censusTotalUnits: r.census_total_units,
        censusYearBuiltBuckets: JSON.parse(r.census_year_built_json || '{}'),
        femaRiskScore: r.fema_risk_score,
        noaaEventCounts: JSON.parse(r.noaa_event_counts_json || '{}'),
      }));
      const rankings = computeCountyRankings(row.slug, rankingInputs);
      res.json({ success: true, county: { ...toApiShape(row), rankings } });
    } catch (err: any) {
      console.error('[counties] get failed:', err);
      res.status(404).json({ success: false, error: 'Not found.' });
    }
  });

  // --- Public: real-data hazard scorecard, rendered live from the current row ---------------------
  // Deliberately not a build-time static file, unlike the guide pages' prerendered HTML -- county
  // hazard data barely changes, but this sidesteps that whole staleness class of bug entirely
  // (see deployHookService.ts's write-up) rather than adding a fourth thing that needs a redeploy
  // to stay correct. Rendering an SVG from a DB row is cheap enough that "always live" costs
  // nothing worth optimizing away.
  //
  // Stays under /api/ deliberately, even though robots.txt disallows that whole path (see
  // sitemapGenerator.ts) -- a real, public /images/counties/ path was the first instinct, but
  // vercel.json only rewrites /api and /api/:path* to the actual server function; every other
  // path (including that one) falls through to the catch-all "/(.*)" -> shell.html rewrite and
  // would never have reached this route at all in production. Fixed the crawlability problem the
  // other way instead: a scoped `Allow: /api/images/` exception in robots.txt, ahead of the
  // blanket `Disallow: /api/`. The filename itself still carries the county slug
  // (travis-county-tx-hazard-map.svg, not a generic hazard-map.svg repeated across all 31
  // counties) since Google's image indexing does weigh the filename, not just the alt text.
  app.get('/api/images/:filename', async (req: Request, res: Response) => {
    const match = req.params.filename.match(/^(.+)-hazard-map\.svg$/);
    if (!match || !isDbConfigured()) {
      res.status(404).send('Not found.');
      return;
    }
    const slug = match[1];
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM county_data WHERE slug = ${slug} AND data_complete = true LIMIT 1
      `);
      const row = (rows as unknown as CountyRow[])[0];
      if (!row) {
        res.status(404).send('Not found.');
        return;
      }
      const county = toApiShape(row);
      const svg = buildCountyHazardSvg({
        countyName: county.countyName,
        stateAbbrev: county.stateAbbrev,
        radonZone: county.radonZone,
        femaRiskRating: county.femaRiskRating,
        femaRiskScore: county.femaRiskScore,
        femaHazards: county.femaHazards,
        noaaEventCounts: county.noaaEventCounts,
        noaaYearsCovered: county.noaaYearsCovered,
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(svg);
    } catch (err: any) {
      console.error('[counties] hazard-map.svg failed:', err);
      res.status(404).send('Not found.');
    }
  });
}
