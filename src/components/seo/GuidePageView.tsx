import React, { useEffect, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, Clock, Calendar, Loader2, MessageCircleQuestion, ExternalLink } from 'lucide-react';
import { renderArticleMarkdown, parseInline, stripCitationMarkers } from '../../utils/renderArticleMarkdown';
import { resolveKnownSource } from '../../data/knownSources';
import { ArticleClosingNote } from './ArticleClosingNote';
import { GuideAdSlot } from '../GuideAdSlot';
import { pickRelatedGuides, GuideSummary } from '../../utils/relatedGuides';
import { buildPageTitle } from '../../utils/pageTitle';

interface GuidePageViewProps {
  guideSlug: string;
  onNavigate: (path: string) => void;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  status: string;
  publishedAt: string | null;
}

// Reads from the real articles table (see src/server/articlesApi.ts) rather than the old static
// EDITORIAL_GUIDES_DATASET array -- a draft is never reachable here since the API only returns
// status = 'published' rows for this route.
// Reads the article scripts/prerender-guides.tsx bakes into the static page as
// __PRELOADED_GUIDE__, only when its slug matches the one being rendered -- a client-side
// navigation to a DIFFERENT guide (e.g. via Related Guides) must still fetch fresh, since the
// script tag on the page still holds whichever guide was server-rendered, not the new one.
function readPreloadedGuide(slug: string): Article | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('__PRELOADED_GUIDE__');
  if (!el?.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent);
    return parsed?.slug === slug ? (parsed as Article) : null;
  } catch {
    return null;
  }
}

export const GuidePageView: React.FC<GuidePageViewProps> = ({ guideSlug, onNavigate }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allGuides, setAllGuides] = useState<GuideSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setArticle(null);

    // Skip the network entirely when the exact guide being rendered is already embedded in the
    // page -- see readPreloadedGuide above. This is the fix for a real production bug: Google's
    // renderer showed "Guide Not Found" for a page whose static <head> (title, canonical,
    // description) was completely correct, because the fetch below failed or got cut off inside
    // Google's render time budget, and the .catch() further down treated that identically to the
    // guide genuinely not existing. A fetch that never has to happen can't fail like that.
    const preloaded = readPreloadedGuide(guideSlug);
    if (preloaded) {
      setArticle(preloaded);
      setLoading(false);
      return;
    }

    fetch(`/api/guides/${encodeURIComponent(guideSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.article) {
          setArticle(data.article);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guideSlug]);

  // Full list fetched once (not scoped to guideSlug) purely to rank "Related Guides" -- same list
  // Footer.tsx already fetches independently for its own "Editorial Guides" links.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && Array.isArray(data.articles)) {
          setAllGuides(data.articles);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const relatedGuides = article ? pickRelatedGuides(article.slug, article.title, allGuides) : [];

  const canonicalUrl = `https://www.beforeregret.com/guides/${guideSlug}/`;

  useEffect(() => {
    if (!article) return;
    applyHeadSeo({
      title: buildPageTitle(article.title, ' | BeforeRegret Guides'),
      description: article.metaDescription,
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': article.title,
          'description': article.metaDescription,
          'image': 'https://www.beforeregret.com/hero-bg.png',
          'datePublished': article.publishedAt,
          'author': {
            '@type': 'Organization',
            'name': 'BeforeRegret'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Editorial Guides', 'item': 'https://www.beforeregret.com/guides/' },
            { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': canonicalUrl }
          ]
        },
        // FAQPage schema using the title as the question and the Quick Answer as the accepted
        // answer -- this is the structured-data version of the same Quick Answer box rendered on
        // the page, giving search engines an explicit machine-readable target for a featured
        // snippet instead of hoping they extract it correctly from prose.
        ...(article.quickAnswer ? [{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': [{
            '@type': 'Question',
            'name': article.title,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': stripCitationMarkers(article.quickAnswer)
            }
          }]
        }] : [])
      ]
    });
  }, [article, canonicalUrl]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Guide Not Found</h1>
        <p className="text-xs text-slate-600">The requested editorial guide is unavailable.</p>
        <button onClick={() => onNavigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  const wordCount = article.bodyMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className="bg-slate-50 min-h-screen pb-16">

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-blue-600">Editorial Guides</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">{article.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Guide Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-lg">
              GUIDE
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{readTimeMinutes} min read</span>
            </span>
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {article.title}
          </h1>

          {article.metaDescription && (
            <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {article.metaDescription}
            </p>
          )}
        </div>

        {/* Quick Answer -- a short, self-contained answer up top for skimmers and search
            snippets, separate from the meta description above (that's written for the Google
            results page; this is written to be read on the page itself). */}
        {article.quickAnswer && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 sm:p-8 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              <span>Quick answer</span>
            </div>
            <p className="text-sm sm:text-base text-blue-950 leading-relaxed font-medium">
              {parseInline(article.quickAnswer)}
            </p>
          </div>
        )}

        {/* Vendor ad slot: below Quick Answer, above the article body -- reader already has the
            direct answer, hasn't started the deep-dive yet. Always renders something: the paying
            vendor currently occupying this slot, or a recruitment CTA if it's unsold. See
            src/server/guideAdsApi.ts and GuideAdSlot.tsx. */}
        <GuideAdSlot articleId={article.id} position="top" guideTitle={article.title} />

        {/* Article Body */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-sm">
          <div className="max-w-none">
            {renderArticleMarkdown(article.bodyMarkdown)}
          </div>
        </div>

        {/* Vendor ad slot: below the article body, above our own closing CTA -- deliberately not
            adjacent to/inside ArticleClosingNote below, so a vendor ad never visually competes
            with or gets mistaken for our own conversion element. */}
        <GuideAdSlot articleId={article.id} position="bottom" guideTitle={article.title} />

        <ArticleClosingNote onNavigate={onNavigate} />

        {/* Related Guides: placed after our own conversion CTA, not before it -- the closing note
            above is the one thing on this page we most want the reader to act on, and putting
            more reading material ahead of it would compete with that. Still well above Sources,
            since exploring more guides is a more likely next click than following a citation.
            Fixes every guide's biggest internal-linking gap -- see src/utils/relatedGuides.ts. */}
        {relatedGuides.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Related Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => onNavigate(`/guides/${g.slug}/`)}
                  className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-colors cursor-pointer group"
                >
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{g.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sources -- resolved from a hand-verified lookup (src/data/knownSources.ts), never
            from a URL the model wrote itself. See src/server/articleGenerator.ts for why. */}
        {article.sources.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</h2>
            <ul className="space-y-2">
              {article.sources.map((code) => {
                const source = resolveKnownSource(code);
                if (!source) return null;
                return (
                  <li key={code}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>{source.name}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
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
};
