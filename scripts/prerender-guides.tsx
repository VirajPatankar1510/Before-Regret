import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { renderArticleMarkdown, parseInline, stripCitationMarkers } from '../src/utils/renderArticleMarkdown';
import { resolveKnownSource } from '../src/data/knownSources';
import { ArticleClosingNote } from '../src/components/seo/ArticleClosingNote';

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
  published_at: string | null;
}

interface Article {
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  publishedAt: string | null;
}

function toArticle(row: ArticleRow): Article {
  let sources: string[] = [];
  try {
    const parsed = JSON.parse(row.sources_json || '[]');
    if (Array.isArray(parsed)) sources = parsed.filter((s) => typeof s === 'string');
  } catch {
    sources = [];
  }
  return {
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    bodyMarkdown: row.body_markdown,
    quickAnswer: row.quick_answer,
    sources,
    publishedAt: row.published_at,
  };
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildJsonLd(article: Article, canonicalUrl: string): Record<string, any>[] {
  const schemas: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      image: 'https://www.beforeregret.com/hero-bg.png',
      datePublished: article.publishedAt,
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
  if (article.quickAnswer) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: article.title,
          acceptedAnswer: { '@type': 'Answer', text: stripCitationMarkers(article.quickAnswer) },
        },
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
function GuideStaticBody({ article }: { article: Article }) {
  const wordCount = article.bodyMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const noNav = () => {};

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <span>Editorial Guides</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate">{article.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-lg">GUIDE</span>
            <span>{readTimeMinutes} min read</span>
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
    SELECT slug, title, meta_description, body_markdown, quick_answer, sources_json, published_at
    FROM articles WHERE status = 'published' ORDER BY published_at DESC
  `)) as unknown as ArticleRow[];

  let written = 0;
  const llmsTxtLines: string[] = [];
  for (const row of rows) {
    const article = toArticle(row);
    const canonicalUrl = `https://www.beforeregret.com/guides/${article.slug}/`;
    const bodyHtml = renderToStaticMarkup(<GuideStaticBody article={article} />);

    const html = applyHeadReplacements(template, {
      title: `${article.title} | BeforeRegret Guides`,
      description: article.metaDescription,
      canonicalUrl,
      jsonLd: buildJsonLd(article, canonicalUrl),
    }).replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

    const outDir = path.join(distPath, 'guides', article.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    written++;

    llmsTxtLines.push(`- [${article.title}](${canonicalUrl}): ${article.metaDescription}`);
  }

  console.log(`[prerender-guides] Wrote static HTML for ${written} published guide(s) to dist/guides/<slug>/index.html`);

  // llms.txt -- an emerging, unofficial convention some AI answer engines check for a plain-text
  // summary of a site and a curated list of its real content, since crawling arbitrary HTML for
  // this is unreliable. Written straight to dist/ (not public/) because this script runs after
  // vite build already copied public/ into dist/ -- writing to public/ here would only take
  // effect on the *next* build. Generated from the same DB rows as the sitemap/prerendered pages
  // above so it can never list a guide that doesn't actually exist or is missing one that does.
  const llmsTxt = `# BeforeRegret

> Free, address-based public property research for U.S. homebuyers and renters. Runs a live USGS seismic hazard check and validates the address against U.S. Census records automatically; everything else is a curated checklist linking to the real government source for each check (FEMA, EPA, USDA, U.S. DOT, FCC, local municipal records) -- clearly labeled as not yet independently verified until you follow the link and check it yourself. The first report is free; additional reports are a one-time $14.99 flat fee, no subscription.

BeforeRegret does not fabricate data. If a claim in these guides isn't backed by a live check or a cited government source, it says so explicitly rather than guessing.

## Guides

${llmsTxtLines.join('\n')}

## Site

- [Homepage](https://www.beforeregret.com/): Address search and free property research report.
- [Support & FAQ](https://www.beforeregret.com/support/)
`;
  fs.writeFileSync(path.join(distPath, 'llms.txt'), llmsTxt, 'utf8');
  console.log('[prerender-guides] Wrote dist/llms.txt');
}

run().catch((err) => {
  console.error('[prerender-guides] Failed:', err);
  process.exit(1);
});
