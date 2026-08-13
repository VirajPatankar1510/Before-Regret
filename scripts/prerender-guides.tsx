import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { renderArticleMarkdown, parseInline, stripCitationMarkers } from '../src/utils/renderArticleMarkdown';
import { resolveKnownSource } from '../src/data/knownSources';
import { ArticleClosingNote } from '../src/components/seo/ArticleClosingNote';
import { pickRelatedGuides, GuideSummary } from '../src/utils/relatedGuides';
import { buildPageTitle } from '../src/utils/pageTitle';
import { pickCountiesForGuide, CountyTopicInput, GUIDE_TOPICS } from '../src/utils/countyGuideTopics.js';

// Static HTML generator for published guide articles, run once after `vite build` as part of
// `npm run build`. The live app is a pure client-render SPA (createRoot, not hydrateRoot -- see
// src/main.tsx) with every route's title/description/body injected by JavaScript after mount.
// That's invisible to crawlers that don't execute JS, which today includes most AI answer
// engines (ChatGPT, Perplexity, etc. largely fetch raw HTML). This script writes a real,
// self-contained HTML page per guide -- correct <head> tags plus the actual article text baked
// directly into the markup -- to dist/guides/<slug>/index.html. A real browser still loads the
// same JS bundle referenced in the file and boots the normal interactive SPA on top; since the
// client does a destructive createRoot().render() rather than hydrateRoot(), there's no
// hydration-mismatch risk from the static markup being replaced.
//
// Deliberately scoped to guides only, not the homepage or legal pages: the homepage's
// dist/index.html is also what Vercel's catch-all rewrite serves for every *unmatched* path (see
// vercel.json), including genuinely dead URLs that the client-side 404 fix (src/App.tsx) now
// handles at the JS layer. Baking real homepage content into that same file would resurrect the
// soft-404 problem at the static layer -- a crawler hitting a dead URL without executing JS would
// see real homepage content again. Guides get their own dedicated file at a more specific path,
// so this risk doesn't apply to them.

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  body_markdown: string;
  quick_answer: string;
  sources_json: string;
  faq_json: string;
  article_type: string;
  published_at: string | null;
  updated_at: string | null;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  faqItems: FaqItem[];
  articleType: string;
  publishedAt: string | null;
  updatedAt: string | null;
}

function toArticle(row: ArticleRow): Article {
  let sources: string[] = [];
  try {
    const parsed = JSON.parse(row.sources_json || '[]');
    if (Array.isArray(parsed)) sources = parsed.filter((s) => typeof s === 'string');
  } catch {
    sources = [];
  }
  let faqItems: FaqItem[] = [];
  try {
    const parsed = JSON.parse(row.faq_json || '[]');
    if (Array.isArray(parsed)) {
      faqItems = parsed.filter(
        (item): item is FaqItem => item && typeof item.question === 'string' && typeof item.answer === 'string'
      );
    }
  } catch {
    faqItems = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    bodyMarkdown: row.body_markdown,
    quickAnswer: row.quick_answer,
    sources,
    faqItems,
    articleType: row.article_type,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

// AI answer engines (and Google, less strictly) weight how recently a page was verified/updated
// when deciding whether to trust and cite it -- an undated or stale-looking page loses out to one
// that visibly shows its own freshness. Only worth surfacing as "Updated" when it's a genuinely
// different calendar day from publishedAt; otherwise every guide would show two identical dates,
// which reads as noise, not a freshness signal.
function hasVisibleUpdate(article: Pick<Article, 'publishedAt' | 'updatedAt'>): boolean {
  if (!article.updatedAt || !article.publishedAt) return false;
  const published = new Date(article.publishedAt).toDateString();
  const updated = new Date(article.updatedAt).toDateString();
  return published !== updated;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// county_data stores county_name in the all-caps form FEMA/NOAA/Census use for matching (e.g.
// "TRAVIS") -- title-cased here for the reader-facing county links in "Where This Comes Up".
// Duplicated from the equivalent in scripts/prerender-counties.tsx / CountyPageView.tsx rather
// than shared, matching how those two already tolerate the same small duplication.
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildJsonLd(article: Article, canonicalUrl: string): Record<string, any>[] {
  const schemas: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      // NewsArticle for the timely FEMA-declaration county-event pieces (see
      // countyEventsApi.ts), Article for everything else. This doesn't get these into the
      // Google News/Discover tabs by itself -- that also needs a separate news-sitemap.xml and
      // real site trust/authority signals this site doesn't have yet -- but it's the correct
      // schema.org type either way, and Google has said it uses this kind of markup for general
      // page/entity understanding (AI Overviews, AI Mode) independent of any rich-result surface.
      '@type': article.articleType === 'news' ? 'NewsArticle' : 'Article',
      headline: article.title,
      description: article.metaDescription,
      image: 'https://www.beforeregret.com/hero-bg.jpg',
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: { '@type': 'Organization', name: 'BeforeRegret' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
        { '@type': 'ListItem', position: 2, name: 'Editorial Guides', item: 'https://www.beforeregret.com/guides/' },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
      ],
    },
  ];
  // One merged FAQPage block, same reasoning as GuidePageView.tsx: the title + Quick Answer as
  // the first entry, admin-entered FAQ items appended after it, never two separate FAQPage
  // scripts on the same page.
  if (article.quickAnswer || article.faqItems.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        ...(article.quickAnswer ? [{
          '@type': 'Question',
          name: article.title,
          acceptedAnswer: { '@type': 'Answer', text: stripCitationMarkers(article.quickAnswer) },
        }] : []),
        ...article.faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      ],
    });
  }
  return schemas;
}

// Mirrors GuidePageView.tsx's visible markup (header card, quick answer, article body, closing
// CTA, sources) minus AdSlot (irrelevant to crawlers, and reads import.meta.env / window in ways
// that only work inside Vite's own transform, not this standalone script) and minus the
// onNavigate-driven breadcrumb buttons, swapped here for real <a href> links so the static page
// is still navigable without JS.
function GuideStaticBody({
  article,
  relatedGuides,
  relevantCounties,
}: {
  article: Article;
  relatedGuides: GuideSummary[];
  relevantCounties: Array<{ slug: string; countyName: string; stateAbbrev: string }>;
}) {
  const wordCount = article.bodyMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const noNav = () => {};

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href="/guides/" className="hover:text-blue-600">Editorial Guides</a>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate">{article.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className={`px-2.5 py-1 font-bold text-[11px] rounded-lg ${article.articleType === 'news' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
              {article.articleType === 'news' ? 'COUNTY UPDATE' : 'GUIDE'}
            </span>
            <span>{readTimeMinutes} min read</span>
            {article.publishedAt && (
              <span>
                Published {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {hasVisibleUpdate(article) && (
              <span className="text-emerald-700 font-semibold">
                Updated {new Date(article.updatedAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{article.title}</h1>

          {article.metaDescription && (
            <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {article.metaDescription}
            </p>
          )}
        </div>

        {article.quickAnswer && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 sm:p-8 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Quick answer</div>
            <p className="text-sm sm:text-base text-blue-950 leading-relaxed font-medium">
              {parseInline(article.quickAnswer)}
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-sm">
          <div className="max-w-none">{renderArticleMarkdown(article.bodyMarkdown)}</div>
        </div>

        <ArticleClosingNote onNavigate={noNav} />

        {relatedGuides.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Related Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}/`}
                  className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800"
                >
                  <span>{g.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {relevantCounties.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Where This Comes Up</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Real county data where this is a common issue based on housing age, not a guess:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relevantCounties.map((c) => (
                <a
                  key={c.slug}
                  href={`/county/${c.slug}/`}
                  className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800"
                >
                  <span>{c.countyName} County, {c.stateAbbrev}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Static twin of GuidePageView.tsx's FAQ accordion -- rendered fully expanded here since
            this HTML has no JS-driven toggle state; the live client swaps in the interactive
            collapsed version on mount. Both feed the same merged FAQPage schema above. */}
        {article.faqItems.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Frequently Asked Questions</h2>
            <div className="divide-y divide-slate-100">
              {article.faqItems.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="text-sm font-bold text-slate-900">{item.question}</div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">{parseInline(item.answer)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {article.sources.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</h2>
            <ul className="space-y-2">
              {article.sources.map((code) => {
                const source = resolveKnownSource(code);
                if (!source) return null;
                return (
                  <li key={code}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {source.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Static twin of the same link in GuidePageView.tsx -- real <a href>, not onNavigate,
            since this markup has no JS router until the client bundle takes over. */}
        <p className="text-xs text-slate-500 text-center">
          <a href="/about/" className="text-blue-600 hover:underline font-medium">
            How we research and write these guides
          </a>
        </p>
      </div>
    </div>
  );
}

// Mirrors GuidesIndexView.tsx -- the hub every guide should be reachable from with one click,
// baked to real HTML at dist/guides/index.html so a crawler that doesn't run JS sees the same
// list and the same real <a href> links to all 27 (now more) guides that a browser would.
function GuidesIndexStaticBody({ guides }: { guides: GuideSummary[] }) {
  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <span className="text-slate-900 font-bold">Editorial Guides</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 inline-block px-2.5 py-1 rounded-full">
            Editorial Guides
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            What to check before you sign
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Every research guide we've published, in one place -- what a specific era, system, or record actually means for a home you're buying, cited back to the government or industry source behind it.
          </p>
          <a href="/counties/" className="text-xs font-bold text-blue-700 hover:text-blue-800 inline-block">
            Looking for county-level hazard and housing data instead? Browse all covered counties →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guides.map((g) => (
            <a
              key={g.slug}
              href={`/guides/${g.slug}/`}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 block"
            >
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{g.title}</h2>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function applyHeadReplacements(template: string, opts: {
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd: Record<string, any>[];
}): string {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(opts.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtmlAttr(opts.description)}"`
  );
  html = html.replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="index, follow"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(opts.canonicalUrl)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(opts.canonicalUrl)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(opts.title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(opts.description)}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(opts.title)}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(opts.description)}"`);

  const jsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(opts.jsonLd)}</script>`;
  html = html.replace('</head>', `${jsonLdScript}\n  </head>`);

  return html;
}

async function run() {
  if (!isDbConfigured()) {
    console.log('[prerender-guides] DATABASE_URL not configured -- skipping (no published articles to read).');
    return;
  }

  const distPath = path.join(process.cwd(), 'dist');
  const templatePath = path.join(distPath, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender-guides] dist/index.html not found -- run `vite build` first.');
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  const rows = (await withDb((sql) => sql`
    SELECT id, slug, title, meta_description, body_markdown, quick_answer, sources_json, faq_json, article_type, published_at, updated_at
    FROM articles WHERE status = 'published' ORDER BY published_at DESC
  `)) as unknown as ArticleRow[];

  const allGuideSummaries: GuideSummary[] = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    publishedAt: r.published_at,
  }));

  // Powers the "Where This Comes Up" section -- links a guide about a housing-era defect (knob
  // and tube, FPE panels, polybutylene, etc.) to the verified counties where that era actually
  // makes up a real share of the housing stock. See src/utils/countyGuideTopics.ts for why this
  // direction is static-only rather than mirrored in the live GuidePageView.tsx: it would need a
  // new "/api/counties" list endpoint the live client doesn't have today, whereas the reverse
  // direction (county -> guides) is cheap both ways since __PRELOADED_COUNTY__ already carries
  // everything CountyPageView.tsx needs. Crawler-facing link equity is the actual goal here, so
  // static-only still delivers it.
  const countyRows = (await withDb((sql) => sql`
    SELECT slug, county_name, state_abbrev, radon_zone, census_total_units, census_year_built_json
    FROM county_data WHERE data_complete = true
  `)) as unknown as Array<{
    slug: string; county_name: string; state_abbrev: string; radon_zone: number | null;
    census_total_units: number | null; census_year_built_json: string;
  }>;
  const counties: CountyTopicInput[] = countyRows.map((c) => ({
    slug: c.slug,
    countyName: titleCase(c.county_name),
    stateAbbrev: c.state_abbrev,
    radonZone: c.radon_zone,
    yearBuiltBuckets: JSON.parse(c.census_year_built_json || '{}'),
    totalUnits: c.census_total_units,
  }));

  let written = 0;
  const llmsGuides: Array<{ slug: string; title: string; metaDescription: string; canonicalUrl: string }> = [];
  for (const row of rows) {
    const article = toArticle(row);
    const canonicalUrl = `https://www.beforeregret.com/guides/${article.slug}/`;
    const relatedGuides = pickRelatedGuides(article.slug, article.title, allGuideSummaries);
    const relevantCounties = pickCountiesForGuide(article.slug, counties);
    const bodyHtml = renderToStaticMarkup(
      <GuideStaticBody article={article} relatedGuides={relatedGuides} relevantCounties={relevantCounties} />
    );

    // Embedded verbatim so GuidePageView.tsx's mount effect can use it directly instead of
    // re-fetching over the network on first paint -- see the matching read in GuidePageView.tsx
    // for why. Client-side navigation to a DIFFERENT guide (e.g. via Related Guides) still fetches
    // fresh, since this script tag holds only THIS page's article.
    const preloadScript = `<script type="application/json" id="__PRELOADED_GUIDE__">${escapeJsonForScriptTag(article)}</script>`;

    const html = applyHeadReplacements(template, {
      title: buildPageTitle(article.title, ' | BeforeRegret Guides'),
      description: article.metaDescription,
      canonicalUrl,
      jsonLd: buildJsonLd(article, canonicalUrl),
    })
      .replace('</head>', `${preloadScript}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

    const outDir = path.join(distPath, 'guides', article.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    written++;

    llmsGuides.push({ slug: article.slug, title: article.title, metaDescription: article.metaDescription, canonicalUrl });
  }

  console.log(`[prerender-guides] Wrote static HTML for ${written} published guide(s) to dist/guides/<slug>/index.html`);

  // The hub page (dist/guides/index.html) -- see GuidesIndexView.tsx for the client-rendered twin.
  const indexCanonicalUrl = 'https://www.beforeregret.com/guides/';
  const indexBodyHtml = renderToStaticMarkup(<GuidesIndexStaticBody guides={allGuideSummaries} />);
  const indexJsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
        { '@type': 'ListItem', position: 2, name: 'Editorial Guides', item: indexCanonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: allGuideSummaries.map((g, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://www.beforeregret.com/guides/${g.slug}/`,
        name: g.title,
      })),
    },
  ];
  const indexHtml = applyHeadReplacements(template, {
    title: 'Editorial Guides | BeforeRegret',
    description: "Every BeforeRegret research guide in one place -- what to check for a home's age, permit history, and inspection blind spots before you sign.",
    canonicalUrl: indexCanonicalUrl,
    jsonLd: indexJsonLd,
  }).replace('<div id="root"></div>', `<div id="root">${indexBodyHtml}</div>`);
  const indexOutDir = path.join(distPath, 'guides');
  fs.mkdirSync(indexOutDir, { recursive: true });
  fs.writeFileSync(path.join(indexOutDir, 'index.html'), indexHtml, 'utf8');
  console.log('[prerender-guides] Wrote static HTML for the guides hub to dist/guides/index.html');

  // llms.txt -- an emerging, unofficial convention some AI answer engines check for a plain-text
  // summary of a site and a curated list of its real content, since crawling arbitrary HTML for
  // this is unreliable. Written straight to dist/ (not public/) because this script runs after
  // vite build already copied public/ into dist/ -- writing to public/ here would only take
  // effect on the *next* build. Generated from the same DB rows as the sitemap/prerendered pages
  // above so it can never list a guide that doesn't actually exist or is missing one that does.
  //
  // Guides are grouped below using only associations that already exist elsewhere in this
  // codebase, not invented for this file: GUIDE_TOPICS (countyGuideTopics.ts) is the same
  // hand-verified era/material map that drives "Where This Comes Up" on the guide pages
  // themselves, and the by-county grouping is a plain substring match of each guide's own title
  // against the real counties list -- the county name is already in the title text, this isn't a
  // guess. Anything that doesn't match either real structure falls through to a flat list rather
  // than being forced into a category it doesn't actually belong to.
  // Values match county.countyName's actual casing (titleCase() output, e.g. "Kings" not "KINGS")
  // -- county_data stores county names all-caps, but this script title-cases them into `counties`
  // well before this point (see the titleCase(c.county_name) call above), same as it does for
  // every other display use of countyName in this file.
  const NYC_BOROUGH_TO_COUNTY: Record<string, string> = {
    Brooklyn: 'Kings', Manhattan: 'New York', 'Staten Island': 'Richmond', Queens: 'Queens', Bronx: 'Bronx',
  };
  const TOPIC_LABELS: Record<string, string> = {
    radonZone1: 'Radon (EPA Zone 1 counties)',
    knobAndTubeEra: 'Knob-and-tube wiring',
    midCenturyPanelEra: 'Federal Pacific / Zinsco panels',
    aluminumWiringEra: 'Aluminum wiring',
    polybutyleneEra: 'Polybutylene plumbing',
    castIronEra: 'Cast iron sewer pipe',
    asbestosEra: 'Asbestos',
  };

  const taggedSlugs = new Set<string>();
  const guidesByCounty = new Map<string, typeof llmsGuides>();
  for (const county of counties) {
    const nameVariants = [county.countyName, ...Object.entries(NYC_BOROUGH_TO_COUNTY).filter(([, n]) => n === county.countyName).map(([b]) => b)];
    const matches = llmsGuides.filter((g) => !taggedSlugs.has(g.slug) && nameVariants.some((n) => g.title.includes(n)));
    if (matches.length > 0) {
      guidesByCounty.set(county.slug, matches);
      matches.forEach((g) => taggedSlugs.add(g.slug));
    }
  }

  const guidesByTopic = new Map<string, typeof llmsGuides>();
  for (const guide of llmsGuides) {
    if (taggedSlugs.has(guide.slug)) continue;
    const topic = GUIDE_TOPICS[guide.slug];
    if (!topic) continue;
    if (!guidesByTopic.has(topic)) guidesByTopic.set(topic, []);
    guidesByTopic.get(topic)!.push(guide);
    taggedSlugs.add(guide.slug);
  }

  const generalGuides = llmsGuides.filter((g) => !taggedSlugs.has(g.slug));

  const countyGuideSection = [...guidesByCounty.entries()]
    .map(([slug, guides]) => {
      const county = counties.find((c) => c.slug === slug)!;
      const lines = guides.map((g) => `  - [${g.title}](${g.canonicalUrl}): ${g.metaDescription}`).join('\n');
      return `- ${county.countyName} County, ${county.stateAbbrev}\n${lines}`;
    })
    .join('\n');

  const topicGuideSection = [...guidesByTopic.entries()]
    .map(([topic, guides]) => {
      const lines = guides.map((g) => `  - [${g.title}](${g.canonicalUrl}): ${g.metaDescription}`).join('\n');
      return `- ${TOPIC_LABELS[topic] || topic}\n${lines}`;
    })
    .join('\n');

  const generalGuideSection = generalGuides.map((g) => `- [${g.title}](${g.canonicalUrl}): ${g.metaDescription}`).join('\n');

  const countiesListSection = [...counties]
    .sort((a, b) => a.countyName.localeCompare(b.countyName))
    .map((c) => `- [${c.countyName} County, ${c.stateAbbrev}](https://www.beforeregret.com/county/${c.slug}/)`)
    .join('\n');

  const llmsTxt = `# BeforeRegret

> Free, address-based public property research for U.S. homebuyers and renters. Runs a live USGS seismic hazard check and validates the address against U.S. Census records automatically; everything else is a curated checklist linking to the real government source for each check (FEMA, EPA, USDA, U.S. DOT, FCC, local municipal records) -- clearly labeled as not yet independently verified until you follow the link and check it yourself. The first report is free; additional reports are a one-time $14.99 flat fee, no subscription.

BeforeRegret does not fabricate data. If a claim in these guides isn't backed by a live check or a cited government source, it says so explicitly rather than guessing.

## API

Read-only, cached (1 hour), rate-limited (30 requests/minute/IP, no signup required). Full docs: https://www.beforeregret.com/api/v1/docs

- \`GET /api/v1/counties\` -- every verified county (slug, name, state, population)
- \`GET /api/v1/county/{slug}\` -- FEMA National Risk Index (all 18 hazard scores), EPA radon zone, Census housing-age distribution, and NOAA storm-event history for one county, with a fetchedAt timestamp
- \`GET /api/v1/guides\` -- every published guide (slug, title, meta description, publish date)

## Report

Address-based due-diligence report for a specific US residential address: a live USGS/ASCE 7-22 seismic design category lookup, US Census address validation, inspection-budget priorities for a home of that decade and county, exact seller questions with what a reassuring answer sounds like, a phone-tickable walkthrough checklist, and a plainly labeled "what's not yet verified" section linking to the real government source. First report free, no card required; each additional report is a flat $14.99, no subscription. https://www.beforeregret.com/

## Counties (${counties.length} verified)

${countiesListSection}

## Guides -- by county

${countyGuideSection}

## Guides -- by material / system era

${topicGuideSection}

## Guides -- general

${generalGuideSection}

## Site

- [Homepage](https://www.beforeregret.com/): Address search and free property research report.
- [About & Methodology](https://www.beforeregret.com/about/): How reports and guides are researched and sourced.
- [Support & FAQ](https://www.beforeregret.com/support/)
`;
  fs.writeFileSync(path.join(distPath, 'llms.txt'), llmsTxt, 'utf8');
  console.log('[prerender-guides] Wrote dist/llms.txt');
}

run().catch((err) => {
  console.error('[prerender-guides] Failed:', err);
  process.exit(1);
});
