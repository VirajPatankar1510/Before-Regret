import { EDITORIAL_GUIDES_DATASET } from '../data/seoDataset.js';

const BASE_URL = 'https://beforeregret.com';

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
}

// 1. Sitemap Index Generator (/sitemap.xml)
export function generateSitemapIndexXml(): string {
  const today = new Date().toISOString().split('T')[0];

  const sitemaps = [
    { loc: `${BASE_URL}/sitemaps/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-guides.xml`, lastmod: today },
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

// 2. Child Sitemap Generator (/sitemaps/:name.xml)
export function generateChildSitemapXml(name: string): string {
  const cleanName = name.replace(/\.xml$/, '');
  let entries: SitemapUrlEntry[] = [];

  const today = new Date().toISOString().split('T')[0];

  if (cleanName === 'sitemap-pages') {
    entries = [
      { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/support/`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/terms/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/privacy/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/refunds/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
    ];
  } else if (cleanName === 'sitemap-guides') {
    EDITORIAL_GUIDES_DATASET.forEach(g => {
      if (g.isPublished && g.robotsDirective.includes('index')) {
        entries.push({
          loc: `${BASE_URL}/guides/${g.slug}/`,
          lastmod: g.publishDate || today,
          changefreq: 'monthly',
          priority: '0.7'
        });
      }
    });
  }

  return buildUrlsetXml(entries);
}

function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  entries.forEach(u => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${u.loc}</loc>`);
    xmlLines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${u.priority}</priority>`);
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
Allow: /support
Allow: /terms
Allow: /privacy
Allow: /refunds

Disallow: /report/
Disallow: /admin
Disallow: /api/
Disallow: /state/
Disallow: /compare/

Sitemap: https://beforeregret.com/sitemap.xml
`;
}
