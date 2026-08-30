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

// Same 48-hour News-sitemap freshness window as generateChildSitemapXml's 'sitemap-news' branch
// below -- pulled out so the index can decide whether to list that file at all. The sitemaps.org
// schema requires <urlset> to contain at least one <url> (minOccurs="1"), so a urlset with zero
// entries -- which is exactly what happens whenever no county-event article has published in the
// last 48 hours -- is not just empty, it's an invalid sitemap. Google Search Console reports this
// as "Sitemap can be read, but has errors / Missing XML tag" on urlset. The fix isn't to fake an
// entry; it's to not list (or serve) the file at all when there's genuinely nothing current to
// report, same as any other time-windowed feed.
async function countRecentNewsArticles(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    const rows = await withDb((sql) => sql`
      SELECT count(*)::int AS n FROM articles
      WHERE status = 'published' AND article_type = 'news' AND published_at >= now() - interval '48 hours'
    `);
    return (rows as unknown as Array<{ n: number }>)[0].n;
  } catch (err) {
    console.error('[sitemap] failed to count recent news articles:', err);
    return 0;
  }
}

// 1. Sitemap Index Generator (/sitemap.xml)
export async function generateSitemapIndexXml(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  // sitemap-counties.xml removed 2026-08-23: every county page was retired (see the /counties
  // entry in src/data/legacyUrls.ts), so that child sitemap would only ever list 0 URLs now.
  const sitemaps = [
    { loc: `${BASE_URL}/sitemaps/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemaps/sitemap-guides.xml`, lastmod: today },
  ];

  if ((await countRecentNewsArticles()) > 0) {
    sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-news.xml`, lastmod: today });
  }

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

// 2. Child Sitemap Generator (/sitemaps/:name.xml). Returns null for sitemap-news specifically
// when there's currently nothing within its freshness window -- see countRecentNewsArticles
// above for why a zero-entry urlset isn't just empty, it's invalid. Callers should treat null as
// "this file doesn't exist right now" (a 404 for the live route, skip writing it for the static
// build), not as "serve a body anyway."
export async function generateChildSitemapXml(name: string): Promise<string | null> {
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
      if (rows.length === 0) return null;
      const newsEntries: NewsUrlEntry[] = (rows as unknown as Array<{ slug: string; title: string; published_at: string | Date | null }>).map((a) => ({
        loc: `${BASE_URL}/guides/${a.slug}/`,
        title: a.title,
        publicationDate: a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString(),
      }));
      return buildNewsUrlsetXml(newsEntries);
    } catch (err) {
      console.error('[sitemap] failed to load recent news articles:', err);
      return null;
    }
  }

  if (cleanName === 'sitemap-pages') {
    entries = [
      { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/guides/`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      // /counties/ removed 2026-08-23: every county page was retired (see the /counties entry in
      // src/data/legacyUrls.ts), so the hub itself now 410s and has no place in a sitemap.
      // Only indexable pages belong here. /support/, /terms/, /privacy/ and /refunds/ used to be
      // listed and are all 'noindex' (see scripts/prerender-legal-pages.tsx) -- submitting a URL
      // for indexing while the page itself tells Google not to index it is a contradiction, which
      // Search Console reports as "Submitted URL marked 'noindex'" and an Ahrefs site audit
      // flagged as "Noindex page in sitemap". Removing them is not a demotion: a sitemap is a
      // crawl request, and on a site with ~106 URLs stuck in "Discovered -- currently not indexed"
      // there is no crawl budget to spend asking Google to fetch pages it has been told to ignore.
      // Those pages are still reachable, still crawlable, and now 'noindex, follow' so their
      // footer links still count.
      //
      // /accessibility/ is the inverse case and was the mistake in the other direction: it is the
      // one legal page deliberately set 'index, follow', and it was missing from this list
      // entirely -- an indexable page with no sitemap entry, which the same audit caught as a
      // canonical URL without inlinks.
      { loc: `${BASE_URL}/about/`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/accessibility/`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
      // Newly indexable (scripts/prerender-advertise.tsx) -- the vendor-acquisition page, not a
      // legal page, but the same rule applies: only list it here once it is genuinely 'index,
      // follow' and has real prerendered content to back that up. /topic-ads and /report-ads, the
      // two checkout pages this page routes to, stay noindex and are correctly absent.
      { loc: `${BASE_URL}/advertise/`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
      // The research study (scripts/prerender-research.tsx). Listed with a fixed lastmod rather
      // than `today`: it is a dated analysis of a fixed data vintage, and re-declaring it modified
      // on every build would be a false freshness signal on the one page here whose whole value is
      // that a reader can tell exactly what it measured and when.
      { loc: `${BASE_URL}/research/risk-without-price/`, lastmod: '2026-08-30', changefreq: 'yearly', priority: '0.8' },
    ];
  } else if (cleanName === 'sitemap-guides' && isDbConfigured()) {
    try {
      // lastmod is GREATEST(published_at, updated_at), not published_at alone. It was published_at
      // alone, which meant editing an article never changed its sitemap entry: on 2026-08-30 the
      // permit cluster was rewritten across 33 articles and every one still advertised a lastmod of
      // 2026-08-23, so the sitemap actively told Google nothing had changed and there was no reason
      // to re-crawl. On a site where most URLs already sit in "Discovered - currently not indexed",
      // suppressing the one honest freshness signal available is expensive.
      //
      // updated_at is safe to trust here: the only writers are the article edit, publish, and
      // unpublish routes in articlesApi.ts, all of which are real modifications. The ad-tier
      // backfill script deliberately does not touch it. Postgres GREATEST ignores NULLs, so a row
      // with either column null still yields the other.
      const rows = await withDb((sql) => sql`
        SELECT slug, GREATEST(published_at, updated_at) AS lastmod
        FROM articles WHERE status = 'published' ORDER BY published_at DESC
      `);
      (rows as unknown as Array<{ slug: string; lastmod: string | Date | null }>).forEach((g) => {
        entries.push({
          loc: `${BASE_URL}/guides/${g.slug}/`,
          lastmod: g.lastmod ? new Date(g.lastmod).toISOString().slice(0, 10) : today,
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    } catch (err) {
      console.error('[sitemap] failed to load published guides:', err);
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
    xmlLines.push('        <news:name>Before Regret</news:name>');
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
export async function generateXmlSitemap(): Promise<string> {
  return generateSitemapIndexXml();
}

// 3. Robots.txt Generator
//
// The noindex legal pages (/support, /terms, /privacy, /refunds, /disclaimer) are deliberately
// ALLOWED here, and must stay that way. Disallowing them would be the obvious-looking "tidy up"
// and would break two things at once: a crawler that cannot fetch a page never sees its noindex
// tag, so the page can still end up indexed from inbound links, and it certainly cannot follow
// that page's links -- which now matters, because those pages carry the footer link block feeding
// the guide and county URLs. robots.txt controls CRAWLING; the meta tag controls INDEXING. These
// pages need to be crawled precisely so the noindex is seen and the links are followed.
//
// /report/ and /insights/ are the deliberate exception to that reasoning, and the difference is
// UNBOUNDEDNESS, not sensitivity. Both serve generated per-property reports keyed by an id
// (/insights/<reportId> -- see App.tsx's pathname.startsWith('/insights/') branch), so the URL
// space under them grows with every report a visitor generates and has no fixed member list. The
// noindex-via-prerender approach used for the fixed commercial routes (scripts/prerender-noindex-
// routes.tsx) cannot reach them at all: that script writes one static shell per KNOWN directory,
// and there is no way to enumerate report ids at build time. Disallow is the only mechanism that
// covers the whole pattern. The usual cost of Disallow -- a crawler never sees the noindex, so an
// inbound-linked URL can still be indexed url-only -- is acceptable here precisely because these
// pages carry no footer link block worth following and nothing a searcher should ever land on.
// /insights/ was missing while its sibling /report/ was already listed, which is the inconsistency
// this line closes, not a new policy.
//
// /out/ is the same unboundedness argument again, applied before it becomes a problem rather than
// after. Those are the vendor click-tracking redirects (see src/server/adClicksApi.ts): one URL per
// placement, each a 302 to an advertiser's own site. Googlebot has no reason to follow them, and
// this site cannot spare the crawl -- Google's crawl stats for 2026-08-07..26 show 618 requests
// total with only 3.88% (~24) spent on DISCOVERY across the whole 20-day window.
//
// It is theoretical today, which is exactly why it is cheap to fix now: with zero active
// placements, no /out/ link is rendered on any page, so nothing is discoverable. The moment a slot
// sells, GuideAdSlot.tsx and SponsoredVendorCard.tsx render real <a href="/out/..."> links on guide
// pages and report pages, and a crawler that follows them spends discovery budget travelling to
// third-party sites. rel="sponsored" already stops link equity passing; it does NOT stop crawling.
// Different mechanism, different problem.
//
// Note this does NOT affect click counting. /out/ is hit by real readers clicking a vendor link,
// not by crawlers following one, and adClicksApi.ts independently excludes bot user-agents from
// the count. Blocking crawlers here removes crawl waste without touching a single real click.
//
// Deliberately NOT extended to /api/v1/: that surface is permitted but undiscoverable -- zero
// sitemap entries, zero inbound links, and /api/v1/counties currently returns an empty set, so its
// one parameterised route expands to nothing. Allow costs nothing when no crawler can find the URL.
// Revisit if county pages are ever re-enabled and that endpoint starts listing 100 slugs.
export function generateRobotsTxt(): string {
  return `# Before Regret Robots.txt
User-agent: *
Allow: /
Allow: /guides/
Allow: /about
Allow: /accessibility
Allow: /support
Allow: /terms
Allow: /privacy
Allow: /refunds
Allow: /disclaimer

Disallow: /report/
Disallow: /insights/
Disallow: /admin
Disallow: /out/
Disallow: /api/
Allow: /api/v1/

Sitemap: https://www.beforeregret.com/sitemap.xml
`;
}
