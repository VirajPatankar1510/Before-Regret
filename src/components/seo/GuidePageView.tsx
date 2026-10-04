import React, { useEffect, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { Loader2 } from 'lucide-react';
import { stripCitationMarkers } from '../../utils/renderArticleMarkdown';
import { GuideAdSlot } from '../GuideAdSlot';
import { ContentLink } from '../home/ContentLink';
import { GuideArticleLayout } from './GuideArticleLayout';
import { pickRelatedGuides, GuideSummary } from '../../utils/relatedGuides';
import { buildPageTitle } from '../../utils/pageTitle';
import { ErrorReportingModal } from '../ErrorReportingModal';
import { resolveArticleSchemaImage } from '../../utils/articleImage';

interface GuidePageViewProps {
  guideSlug: string;
  onNavigate: (path: string) => void;
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
  status: string;
  articleType: string;
  publishedAt: string | null;
  updatedAt: string | null;
  /** Present only in the prerendered preload -- see prerender-guides.tsx. */
  relatedGuides?: GuideSummary[];
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
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

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
      title: buildPageTitle(article.title, ' | Before Regret Guides'),
      description: article.metaDescription,
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          // Kept in sync with scripts/prerender-guides.tsx's buildJsonLd -- see that file's
          // comment for why NewsArticle vs Article and what it does/doesn't earn.
          '@type': article.articleType === 'news' ? 'NewsArticle' : 'Article',
          'headline': article.title,
          'description': article.metaDescription,
          // Static twin: scripts/prerender-guides.tsx resolves the same way.
          'image': resolveArticleSchemaImage(article.bodyMarkdown, canonicalUrl),
          'datePublished': article.publishedAt,
          'dateModified': article.updatedAt || article.publishedAt,
          // Static twin: scripts/prerender-guides.tsx does the same, and explains why these are
          // @id references to the page's existing Organization node rather than inline duplicates.
          'author': { '@id': 'https://www.beforeregret.com/#organization' },
          'publisher': { '@id': 'https://www.beforeregret.com/#organization' },
          'mainEntityOfPage': { '@type': 'WebPage', '@id': canonicalUrl }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Before Regret', 'item': 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Editorial Guides', 'item': 'https://www.beforeregret.com/guides/' },
            { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': canonicalUrl }
          ]
        },
        // A single FAQPage block, not two -- one entry built from the title + Quick Answer (same
        // as before), plus any admin-entered FAQ items appended after it. Two separate FAQPage
        // scripts on one page is invalid/redundant; merging keeps this the one source of truth.
        // Note: Google deprecated the FAQ rich-result dropdown entirely in May 2026 (even the
        // narrow government/health-site allowlist it had left since August 2023 is gone), so this
        // no longer earns a SERP dropdown for anyone. It's kept because Google has said it still
        // uses FAQ structured data to understand a page, and the visible accordion below is real,
        // useful content regardless of what the schema does with it.
        ...(article.quickAnswer || article.faqItems.length > 0 ? [{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': [
            ...(article.quickAnswer ? [{
              '@type': 'Question',
              'name': article.title,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': stripCitationMarkers(article.quickAnswer)
              }
            }] : []),
            ...article.faqItems.map((item) => ({
              '@type': 'Question',
              'name': item.question,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.answer
              }
            }))
          ]
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
        <ContentLink href="/" onNavigate={onNavigate} className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Return Home
        </ContentLink>
      </div>
    );
  }

  // Related Guides come baked into the preload by scripts/prerender-guides.tsx, so the first
  // paint matches the static page instead of the module popping in after /api/guides answers.
  // A client-side navigation to another guide has no preload and falls back to ranking here.
  const related = article.relatedGuides ?? relatedGuides;

  return (
    <>
      <GuideArticleLayout
        article={article}
        relatedGuides={related}
        onNavigate={onNavigate}
        adSlot={<GuideAdSlot articleId={article.id} guideTitle={article.title} />}
        onReportError={() => setIsErrorModalOpen(true)}
      />
      {isErrorModalOpen && (
        <ErrorReportingModal
          sourceType="guide"
          sourceRef={article.slug}
          sourceLabel={article.title}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </>
  );
};
