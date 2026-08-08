import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';

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
      const rows = await withDb((sql) => sql`
        SELECT * FROM county_data WHERE slug = ${req.params.slug} AND data_complete = true LIMIT 1
      `);
      const row = (rows as unknown as CountyRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Not found.' });
        return;
      }
      res.json({ success: true, county: toApiShape(row) });
    } catch (err: any) {
      console.error('[counties] get failed:', err);
      res.status(404).json({ success: false, error: 'Not found.' });
    }
  });
}
