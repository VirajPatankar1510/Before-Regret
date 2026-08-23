import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';

// Public read route backing the homepage's content sections (clusters, original research, county
// coverage). One route rather than three because the homepage needs all of it before it can render
// a stable layout -- three parallel fetches would each pop in separately and shift the page.
//
// scripts/prerender-homepage.tsx runs these same two queries directly against the DB at build time
// and embeds the result as __PRELOADED_HOME__, so in production this route is a fallback: it serves
// dev, and client-side navigations back to '/' that never reload the document. Keep the response
// shape here and the preload shape there identical -- src/components/Hero.tsx reads whichever it
// finds and can't tell the difference.

interface ArticleRow {
  slug: string;
  title: string;
  meta_description: string | null;
  article_type: string | null;
  published_at: string | null;
}

interface CountyRow {
  slug: string;
  county_name: string;
  state_abbrev: string;
  population: number | null;
  census_total_units: number | null;
}

export async function loadHomepageData() {
  const articleRows = (await withDb((sql) => sql`
    SELECT slug, title, meta_description, article_type, published_at
    FROM articles WHERE status = 'published' ORDER BY published_at DESC
  `)) as unknown as ArticleRow[];

  // data_complete = true is the same gate countiesApi.ts and prerender-counties.tsx enforce: a
  // county whose data isn't fully verified has no page, so it must not be linked from here either.
  const countyRows = (await withDb((sql) => sql`
    SELECT slug, county_name, state_abbrev, population, census_total_units
    FROM county_data WHERE data_complete = true AND page_enabled = true ORDER BY population DESC NULLS LAST
  `)) as unknown as CountyRow[];

  return {
    articles: articleRows.map((row) => ({
      slug: row.slug,
      title: row.title,
      metaDescription: row.meta_description,
      articleType: row.article_type,
      publishedAt: row.published_at,
    })),
    counties: countyRows.map((row) => ({
      slug: row.slug,
      countyName: row.county_name,
      stateAbbrev: row.state_abbrev,
      population: row.population,
      censusTotalUnits: row.census_total_units,
    })),
  };
}

export function registerHomepageRoutes(app: Express) {
  app.get('/api/homepage', async (_req: Request, res: Response) => {
    // An unconfigured DB isn't an error here -- the homepage's product sections (hero, pricing,
    // FAQ) render fine without content, so return empty collections and let the content sections
    // hide themselves rather than failing the whole page.
    if (!isDbConfigured()) {
      res.json({ success: true, articles: [], counties: [] });
      return;
    }
    try {
      const data = await loadHomepageData();
      res.json({ success: true, ...data });
    } catch (err) {
      console.error('[homepage] failed to load content:', err);
      res.status(500).json({ success: false, error: 'Could not load homepage content.' });
    }
  });
}
