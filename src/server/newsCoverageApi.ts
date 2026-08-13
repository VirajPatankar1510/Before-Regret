import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth.js';

// Manual, on-demand news search for the article editor -- surfaces recent headlines from GDELT
// (gdeltproject.org) and Google News RSS, merged, for whatever the admin is currently looking at.
// Three real uses, same endpoint: (1) opened on a freshly-drafted FEMA county-event article,
// defaulted to that article's own title, as a "what else is being reported on this" follow-up
// check -- we already published from FEMA's own verified declaration data, this is purely to
// catch an angle worth a follow-up piece; (2) a preset topic chip in the editor (data centers,
// insurance non-renewal, school redistricting, etc. -- see src/data/newsTopicPresets.ts), for
// homebuyer-relevant news that has nothing to do with a federal disaster declaration; (3) typed
// by hand for anything else. Either way this is always a live query run at click time (no
// caching, no schedule) -- a headline never becomes a fact cited in an article, it only ever
// seeds what a human decides to write about next, same trust boundary as the hardcoded
// TOPIC_SEEDS list in scripts/generate-draft-articles.ts.
//
// Both sources are free and keyless, but neither is a hard dependency on the other: fetched in
// parallel, and one failing still returns the other's results with a warning, rather than the
// whole request failing just because one source had a bad moment. Only errors out if both do.
//
// GDELT enforces a real rate limit -- observed directly to be stricter in practice than its own
// "one request every 5 seconds" documentation states -- and returns a plain-text throttle message
// with HTTP 200 rather than a proper error status when it kicks in, so a non-JSON response body
// is treated as the throttle signal here, not a crash.
//
// Google News RSS's own response carries a notice restricting the feed to "personal,
// non-commercial use" in a "personal feed reader" -- worth knowing this sits outside that stated
// license for a business tool, even though passive read-only use like this is common practice and
// not something Google appears to actively enforce against.

// Used only when the admin leaves the search box empty -- a general "what's timely in our niche"
// query rather than one scoped to a specific article or preset topic.
const DEFAULT_NICHE_QUERY_TERMS = [
  'aluminum wiring',
  'polybutylene pipe',
  'FPE panel',
  'Zinsco panel',
  'knob and tube wiring',
  'home inspection lawsuit',
  'radon disclosure',
  'septic system inspection',
  'home insurance non-renewal',
  'foundation crack lawsuit',
  'mold disclosure lawsuit',
  'lead paint disclosure',
  'asbestos insulation',
  'well water contamination',
];

export interface NewsCoverageItem {
  title: string;
  url: string;
  domain: string;
  seenAt: string;
  source: 'gdelt' | 'google-news';
}

/**
 * The given query as-is (relevance search, not forced exact-phrase), or an OR-group of the
 * default terms when empty. Confirmed live against a broad preset ("housing market forecast
 * predictions") that force-wrapping every query in exact-phrase quotes was actively hurting
 * results: almost no real article contains that literal 4-word phrase verbatim, so it returned
 * zero matches on a topic that's actually covered constantly. A narrow, specific query (a defect
 * name, a county) still ranks well unquoted since relevance search favors documents containing
 * all the words -- quoting only still makes sense for the default OR-group below, where each
 * term's word boundaries need to stay distinct from the next.
 */
function quotedOrFallback(q: string): string {
  if (q) return q.replace(/"/g, '');
  return `(${DEFAULT_NICHE_QUERY_TERMS.map((t) => `"${t}"`).join(' OR ')})`;
}

// --- GDELT ---------------------------------------------------------------------------------

interface GdeltArticle {
  title?: string;
  url?: string;
  domain?: string;
  seendate?: string;
}

// GDELT's seendate ("20260813T140000Z") is missing the separators ISO 8601 needs to parse.
function parseGdeltDate(seendate: string): string {
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return new Date().toISOString();
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

async function fetchGdelt(q: string): Promise<{ items: NewsCoverageItem[]; warning: string | null }> {
  try {
    const params = new URLSearchParams({
      query: `${quotedOrFallback(q)} sourcelang:english`,
      mode: 'ArtList',
      maxrecords: '25',
      timespan: '14d',
      format: 'json',
      sort: 'DateDesc',
    });
    const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`);
    const raw = await response.text();

    let parsed: { articles?: GdeltArticle[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { items: [], warning: 'GDELT is rate-limiting requests right now.' };
    }

    const items: NewsCoverageItem[] = (parsed.articles || [])
      .filter((a): a is Required<Pick<GdeltArticle, 'title' | 'url'>> & GdeltArticle => Boolean(a.title && a.url))
      .map((a) => ({
        title: a.title!,
        url: a.url!,
        domain: a.domain || '',
        seenAt: a.seendate ? parseGdeltDate(a.seendate) : new Date().toISOString(),
        source: 'gdelt' as const,
      }));
    return { items, warning: null };
  } catch (err) {
    console.error('[news-coverage] GDELT query failed:', err);
    return { items: [], warning: 'Could not reach GDELT.' };
  }
}

// --- Google News RSS -------------------------------------------------------------------------

// &amp; decoded last -- decoding it first would turn a literal "&amp;lt;" into "<" instead of
// the correct "&lt;".
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseRfc2822Date(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// No XML parser dependency -- this app hand-rolls small, well-scoped parsing rather than take on
// a new npm package (same reasoning as adminAuth.ts's hand-rolled TOTP). Google News RSS's item
// shape is simple and stable enough that a per-item regex extraction is the cheaper, safer choice
// over adding a dependency for one endpoint.
function parseGoogleNewsRss(xml: string): NewsCoverageItem[] {
  const items: NewsCoverageItem[] = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = block.match(/<source url="[^"]*">([\s\S]*?)<\/source>/);
    if (!titleMatch || !linkMatch) continue;

    const rawTitle = decodeXmlEntities(titleMatch[1].trim());
    const sourceName = sourceMatch ? decodeXmlEntities(sourceMatch[1].trim()) : '';
    // Google News titles are "Headline - Source Name" -- strip the trailing source suffix when
    // it exactly duplicates the <source> element, so it isn't shown twice in the UI.
    const suffix = ` - ${sourceName}`;
    const title = sourceName && rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle;

    items.push({
      title,
      url: linkMatch[1].trim(),
      domain: sourceName,
      seenAt: pubDateMatch ? parseRfc2822Date(pubDateMatch[1].trim()) : new Date().toISOString(),
      source: 'google-news',
    });
  }
  return items;
}

async function fetchGoogleNews(q: string): Promise<{ items: NewsCoverageItem[]; warning: string | null }> {
  try {
    const params = new URLSearchParams({
      q: `${quotedOrFallback(q)} when:14d`,
      hl: 'en-US',
      gl: 'US',
      ceid: 'US:en',
    });
    const response = await fetch(`https://news.google.com/rss/search?${params.toString()}`);
    if (!response.ok) {
      return { items: [], warning: `Google News returned an error (${response.status}).` };
    }
    const xml = await response.text();
    return { items: parseGoogleNewsRss(xml), warning: null };
  } catch (err) {
    console.error('[news-coverage] Google News query failed:', err);
    return { items: [], warning: 'Could not reach Google News.' };
  }
}

// --- Route -------------------------------------------------------------------------------------

export function registerNewsCoverageRoutes(app: Express) {
  app.get('/api/admin/news-coverage', requireAdmin, async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : '';

    const [gdelt, googleNews] = await Promise.all([fetchGdelt(q), fetchGoogleNews(q)]);

    if (gdelt.warning && googleNews.warning) {
      res.status(502).json({ success: false, error: `${gdelt.warning} ${googleNews.warning}` });
      return;
    }

    // Merge and dedupe by normalized title -- the same real story commonly appears in both feeds
    // (and multiple times within one feed via syndication), under different URLs, so a URL-only
    // dedupe wouldn't catch it.
    const seenTitles = new Set<string>();
    const items: NewsCoverageItem[] = [];
    for (const item of [...gdelt.items, ...googleNews.items]) {
      const key = item.title.trim().toLowerCase();
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      items.push(item);
    }
    items.sort((a, b) => (a.seenAt < b.seenAt ? 1 : -1));

    res.json({
      success: true,
      items: items.slice(0, 30),
      warning: gdelt.warning || googleNews.warning || null,
    });
  });
}
