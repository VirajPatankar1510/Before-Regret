import { ZIP_PSEO_DATASET, EDITORIAL_GUIDES_DATASET, ZIP_COMPARISONS_DATASET, VALIDATED_MARKETS, SINGLE_TOPICS_METADATA } from '../data/seoDataset';
import { evaluateZipUniqueness } from './seoUniquenessEvaluator';
import { ZipPSeoData } from '../types/seoTypes';

const BASE_URL = 'https://beforeregret.com';
const MAX_URLS_PER_SITEMAP = 45000;

// Market-scope gate: independent of data quality. A zip only enters the
// generation surface (sitemaps, hub pages) if its city belongs to a market
// that has completed validation — this must hold even if that zip's own
// uniqueness score would otherwise pass.
function isZipInValidatedMarket(z: ZipPSeoData): boolean {
  return VALIDATED_MARKETS.some(
    m => m.isValidated && m.city.toLowerCase() === z.city.toLowerCase() && m.stateAbbr.toLowerCase() === z.state.toLowerCase()
  );
}

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

// Get latest data timestamp for a zip
function getZipLastMod(zipData: typeof ZIP_PSEO_DATASET[string]): string {
  if (zipData.evidenceTrail && zipData.evidenceTrail.length > 0) {
    const dates = zipData.evidenceTrail.map(e => e.timestamp).filter(Boolean);
    if (dates.length > 0) {
      return dates.sort().reverse()[0];
    }
  }
  return '2026-07-28';
}

// 1. Sitemap Index Generator (/sitemap.xml)
export function generateSitemapIndexXml(): string {
  const today = new Date().toISOString().split('T')[0];

  // Calculate zip and topic sitemap counts (for auto-splitting when scaling)
  const validZipsCount = Object.values(ZIP_PSEO_DATASET).filter(z => isZipInValidatedMarket(z) && evaluateZipUniqueness(z).passed && !z.isDataSparse).length;
  const zipSitemapCount = Math.max(1, Math.ceil(validZipsCount / MAX_URLS_PER_SITEMAP));
  
  const totalTopicsCount = validZipsCount * Object.keys(SINGLE_TOPICS_METADATA).length;
  const topicSitemapCount = Math.max(1, Math.ceil(totalTopicsCount / MAX_URLS_PER_SITEMAP));

  const sitemaps = [
    { loc: `${BASE_URL}/sitemaps/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-states.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-cities.xml`, lastmod: today },
  ];

  for (let i = 1; i <= zipSitemapCount; i++) {
    sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-zips-${i}.xml`, lastmod: today });
  }

  for (let i = 1; i <= topicSitemapCount; i++) {
    sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-topics-${i}.xml`, lastmod: today });
  }

  sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-guides.xml`, lastmod: today });

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

  const today = '2026-08-01';

  if (cleanName === 'sitemap-pages') {
    entries = [
      { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/support/`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/terms/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/privacy/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/refunds/`, lastmod: '2026-06-01', changefreq: 'monthly', priority: '0.5' },
    ];
  } else if (cleanName === 'sitemap-states') {
    const states = Array.from(new Set(VALIDATED_MARKETS.map(m => m.state)));
    states.forEach(stateSlug => {
      entries.push({
        loc: `${BASE_URL}/state/${stateSlug}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.9'
      });
    });
  } else if (cleanName === 'sitemap-cities') {
    VALIDATED_MARKETS.filter(m => m.isValidated).forEach(m => {
      entries.push({
        loc: `${BASE_URL}/state/${m.state}/${m.city}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8'
      });
    });
  } else if (cleanName.startsWith('sitemap-zips')) {
    const pageNumStr = cleanName.replace('sitemap-zips-', '');
    const pageNum = parseInt(pageNumStr, 10) || 1;

    const validZips = Object.values(ZIP_PSEO_DATASET).filter(z => isZipInValidatedMarket(z) && evaluateZipUniqueness(z).passed && !z.isDataSparse);
    const startIdx = (pageNum - 1) * MAX_URLS_PER_SITEMAP;
    const pageZips = validZips.slice(startIdx, startIdx + MAX_URLS_PER_SITEMAP);

    pageZips.forEach(z => {
      const stateSlug = z.stateFullName.toLowerCase().replace(/\s+/g, '');
      const citySlug = z.city.toLowerCase();
      entries.push({
        loc: `${BASE_URL}/state/${stateSlug}/${citySlug}/${z.zipCode}/`,
        lastmod: getZipLastMod(z),
        changefreq: 'weekly',
        priority: '0.8'
      });
    });
  } else if (cleanName.startsWith('sitemap-topics')) {
    const pageNumStr = cleanName.replace('sitemap-topics-', '');
    const pageNum = parseInt(pageNumStr, 10) || 1;

    const allTopicEntries: SitemapUrlEntry[] = [];
    const validZips = Object.values(ZIP_PSEO_DATASET).filter(z => isZipInValidatedMarket(z) && evaluateZipUniqueness(z).passed && !z.isDataSparse);

    validZips.forEach(z => {
      const stateSlug = z.stateFullName.toLowerCase().replace(/\s+/g, '');
      const citySlug = z.city.toLowerCase();
      const lastmod = getZipLastMod(z);

      Object.keys(SINGLE_TOPICS_METADATA).forEach(topicSlug => {
        allTopicEntries.push({
          loc: `${BASE_URL}/state/${stateSlug}/${citySlug}/${z.zipCode}/${topicSlug}/`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    });

    const startIdx = (pageNum - 1) * MAX_URLS_PER_SITEMAP;
    entries = allTopicEntries.slice(startIdx, startIdx + MAX_URLS_PER_SITEMAP);
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

    ZIP_COMPARISONS_DATASET.forEach(c => {
      if (c.isPublished && c.robotsDirective.includes('index')) {
        entries.push({
          loc: `${BASE_URL}/compare/${c.slug}/`,
          lastmod: today,
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
Allow: /state/
Allow: /guides/
Allow: /compare/
Allow: /support
Allow: /terms
Allow: /privacy
Allow: /refunds

Disallow: /report/
Disallow: /admin
Disallow: /api/

Sitemap: https://beforeregret.com/sitemap.xml
`;
}
