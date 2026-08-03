import { ZIP_PSEO_DATASET, EDITORIAL_GUIDES_DATASET, ZIP_COMPARISONS_DATASET, VALIDATED_MARKETS, SINGLE_TOPICS_METADATA } from '../data/seoDataset';
import { evaluateZipUniqueness } from './seoUniquenessEvaluator';

export function generateXmlSitemap(): string {
  const baseUrl = 'https://beforeregret.com';
  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];

  const today = new Date().toISOString().split('T')[0];

  // 1. Homepage & Core Hubs
  urls.push({ loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' });

  // 2. State & City Hubs
  VALIDATED_MARKETS.forEach(m => {
    urls.push({ loc: `${baseUrl}/state/${m.state}/`, lastmod: today, changefreq: 'weekly', priority: '0.9' });
    urls.push({ loc: `${baseUrl}/state/${m.state}/${m.city}/`, lastmod: today, changefreq: 'weekly', priority: '0.8' });
  });

  // 3. Zip Hubs & Single-Topic Deep Pages (ONLY if uniqueness score >= 70 and not sparse)
  Object.values(ZIP_PSEO_DATASET).forEach(z => {
    const evalRes = evaluateZipUniqueness(z);
    if (evalRes.passed && !z.isDataSparse) {
      const stateSlug = z.stateFullName.toLowerCase().replace(/\s+/g, '');
      const citySlug = z.city.toLowerCase();

      // Zip Hub
      urls.push({
        loc: `${baseUrl}/state/${stateSlug}/${citySlug}/${z.zipCode}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8'
      });

      // 5 Deep Topic Pages per valid Zip
      Object.keys(SINGLE_TOPICS_METADATA).forEach(topicSlug => {
        urls.push({
          loc: `${baseUrl}/state/${stateSlug}/${citySlug}/${z.zipCode}/${topicSlug}/`,
          lastmod: today,
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    }
  });

  // 4. Editorial Guides
  EDITORIAL_GUIDES_DATASET.forEach(g => {
    if (g.isPublished && g.robotsDirective.includes('index')) {
      urls.push({
        loc: `${baseUrl}/guides/${g.slug}/`,
        lastmod: g.publishDate,
        changefreq: 'monthly',
        priority: '0.7'
      });
    }
  });

  // 5. Zip Comparison Pages
  ZIP_COMPARISONS_DATASET.forEach(c => {
    if (c.isPublished && c.robotsDirective.includes('index')) {
      urls.push({
        loc: `${baseUrl}/compare/${c.slug}/`,
        lastmod: today,
        changefreq: 'monthly',
        priority: '0.7'
      });
    }
  });

  // Build XML string
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  urls.forEach(u => {
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

export function generateRobotsTxt(): string {
  return `# BeforeRegret Robots.txt
User-agent: *
Allow: /
Allow: /state/
Allow: /guides/
Allow: /compare/
Disallow: /admin
Disallow: /api/
Disallow: /report/

Sitemap: https://beforeregret.com/sitemap.xml
`;
}
