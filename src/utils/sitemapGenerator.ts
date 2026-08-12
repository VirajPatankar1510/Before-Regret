import { withDb, isDbConfigured } from '../server/db.js';

const BASE_URL = 'https://www.beforeregret.com';

// county_name is stored all-caps in county_data (matching FEMA/NOAA/Census's own convention for
// matching) -- title-cased here for the reader-facing sitemap title, same small duplication as
// the equivalent titleCase() in scripts/prerender-counties.tsx / prerender-guides.tsx /
// CountyPageView.tsx rather than a shared import across this many files.
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// This previously also generated sitemap-states/cities/zips/topics/compare sections, driven by
// the fabricated per-ZIP dataset removed from seoDataset.ts. Those URL groups (36 live pages)
// were deleted along with the data behind them, not just emptied, so they're gone from here too
// rather than left generating empty-but-present sitemap files for pages that no longer exist.
// Only sitemap-pages (static core pages) and sitemap-guides (hand-written articles) remain.

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  // Google's image sitemap extension -- a real, documented discovery path for Google Images
  // separate from the alt text on the page itself. Only ever populated with a real, reachable
  // image URL (the county hazard-map SVG), never a placeholder.
  images?: Array<{ loc: string; title: string }>;
}

// 1. Sitemap Index Generator (/sitemap.xml)
export function generateSitemapIndexXml(): string {
  const today = new Date().toISOString().split('T')[0];

  const sitemaps = [
    { loc: `${BASE_URL}/sitemaps/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-guides.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-counties.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-news.xml`, lastmod: today },
  ];

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  sitemaps.forEach(s => {
    xmlLines.push('  <sitemap>');
    xmlLines.push(`    <loc>${s.loc}</loc>`);
    xmlLines.push(`    <lastmod>${s.lastmod}</lastmod>`);
    xmlLines.push('  </sitemap>');
  });

  xmlLines.push('</sitemapindex>');
  return xmlLines.join('\n');
}

// Google News sitemap entries need a title + a real publication_date (W3C datetime, not just a
// date), on top of the plain <loc> every other sitemap entry has -- see buildNewsUrlsetXml below.
export interface NewsUrlEntry {
  loc: string;
  title: string;
  publicationDate: string;
}

// 2. Child Sitemap Generator (/sitemaps/:name.xml)
export async function generateChildSitemapXml(name: string): Promise<string> {
  const cleanName = name.replace(/\.xml$/, '');
  let entries: SitemapUrlEntry[] = [];

  const today = new Date().toISOString().split('T')[0];

  // Google News sitemap: a distinct XML shape (news:news per URL, not <changefreq>/<priority>),
  // so it's built and returned separately from the plain-urlset branches below. Only the FEMA
  // county-event pieces qualify (article_type = 'news' -- see countyEventsApi.ts) -- evergreen
  // guides were never meant for this, Google's own guidance is that a news sitemap is for actual
  // news content. Restricted to the last 48 hours per Google's news-sitemap freshness rule: an
  // article older than that should drop out of this sitemap even though it stays live on the
  // site and in the regular sitemap-guides.xml (Google keeps it in the News index for about a
  // month off the strength of when it first saw it here, it just stops needing to be told again).
  if (cleanName === 'sitemap-news' && isDbConfigured()) {
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, title, published_at FROM articles
        WHERE status = 'published' AND article_type = 'news' AND published_at >= now() - interval '48 hours'
        ORDER BY published_at DESC
      `);
      const newsEntries: NewsUrlEntry[] = (rows as unknown as Array<{ slug: string; title: string; published_at: string | Date | null }>).map((a) => ({
        loc: `${BASE_URL}/guides/${a.slug}/`,
        title: a.title,
        publicationDate: a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString(),
      }));
      return buildNewsUrlsetXml(newsEntries);
    } catch (err) {
      console.error('[sitemap] failed to load recent news articles:', err);
      return buildNewsUrlsetXml([]);
    }
  }

  if (cleanName === 'sitemap-pages') {
    entries = [
      { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/guides/`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      // Real trust/process content, not legal boilerplate -- given the same priority as the
      // guides hub, unlike support/terms/privacy/refunds below which are 0.5 (and noindex on the
      // page itself for support/terms/privacy -- see App.tsx). This one needs to actually be
      // found and crawled.
      { loc: `${BASE_URL}/about/`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/support/`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/terms/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/privacy/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/refunds/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
    ];
  } else if (cleanName === 'sitemap-guides' && isDbConfigured()) {
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      (rows as unknown as Array<{ slug: string; published_at: string | Date | null }>).forEach((g) => {
        entries.push({
          loc: `${BASE_URL}/guides/${g.slug}/`,
          lastmod: g.published_at ? new Date(g.published_at).toISOString().slice(0, 10) : today,
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    } catch (err) {
      console.error('[sitemap] failed to load published guides:', err);
    }
  } else if (cleanName === 'sitemap-counties' && isDbConfigured()) {
    try {
      const rows = await withDb((sql) => sql`
        SELECT slug, county_name, state_abbrev, fetched_at FROM county_data WHERE data_complete = true ORDER BY fetched_at DESC
      `);
      (rows as unknown as Array<{ slug: string; county_name: string; state_abbrev: string; fetched_at: string | Date | null }>).forEach((c) => {
        entries.push({
          loc: `${BASE_URL}/county/${c.slug}/`,
          lastmod: c.fetched_at ? new Date(c.fetched_at).toISOString().slice(0, 10) : today,
          changefreq: 'monthly',
          priority: '0.6',
          // Real image, real title -- see src/utils/countyHazardSvg.ts / the /api/images/:filename
          // route. A documented, separate discovery path for Google Images beyond the page's own
          // alt text, and worth the few extra lines since the data (and the image itself) already
          // exists for every county in this loop.
          images: [{
            loc: `${BASE_URL}/api/images/${c.slug}-hazard-map.svg`,
            title: `${titleCase(c.county_name)} County, ${c.state_abbrev} real hazard data summary (FEMA National Risk Index, EPA radon zone, NOAA storm history)`,
          }],
        });
      });
    } catch (err) {
      console.error('[sitemap] failed to load verified counties:', err);
    }
  }

  return buildUrlsetXml(entries);
}

// Google News sitemap protocol: xmlns:news + one <news:news> block per <url>, with
// news:publication (name + language), news:publication_date (W3C datetime), and news:title
// required. https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
function buildNewsUrlsetXml(entries: NewsUrlEntry[]): string {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
  ];

  entries.forEach((e) => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${escapeXml(e.loc)}</loc>`);
    xmlLines.push('    <news:news>');
    xmlLines.push('      <news:publication>');
    xmlLines.push('        <news:name>BeforeRegret</news:name>');
    xmlLines.push('        <news:language>en</news:language>');
    xmlLines.push('      </news:publication>');
    xmlLines.push(`      <news:publication_date>${e.publicationDate}</news:publication_date>`);
    xmlLines.push(`      <news:title>${escapeXml(e.title)}</news:title>`);
    xmlLines.push('    </news:news>');
    xmlLines.push('  </url>');
  });

  xmlLines.push('</urlset>');
  return xmlLines.join('\n');
}

function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const hasImages = entries.some((e) => e.images && e.images.length > 0);
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    hasImages
      ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
      : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  entries.forEach(u => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${u.loc}</loc>`);
    xmlLines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${u.priority}</priority>`);
    (u.images || []).forEach((img) => {
      xmlLines.push('    <image:image>');
      xmlLines.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`);
      xmlLines.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
      xmlLines.push('    </image:image>');
    });
    xmlLines.push('  </url>');
  });

  xmlLines.push('</urlset>');
  return xmlLines.join('\n');
}

// Backward compatibility helper
export function generateXmlSitemap(): string {
  return generateSitemapIndexXml();
}

// 3. Robots.txt Generator
export function generateRobotsTxt(): string {
  return `# BeforeRegret Robots.txt
User-agent: *
Allow: /
Allow: /guides/
Allow: /about
Allow: /support
Allow: /terms
Allow: /privacy
Allow: /refunds

Disallow: /report/
Disallow: /admin
Disallow: /api/
Allow: /api/images/
Allow: /api/v1/

Sitemap: https://www.beforeregret.com/sitemap.xml
`;
}
