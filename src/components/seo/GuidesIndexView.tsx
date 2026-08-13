import React, { useEffect, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, Loader2, BookOpen, Calendar } from 'lucide-react';

interface GuidesIndexViewProps {
  onNavigate: (path: string) => void;
}

interface GuideRow {
  slug: string;
  title: string;
  metaDescription: string;
  publishedAt: string | null;
}

// The one page every guide should be reachable from with a single click -- before this existed,
// the only way to a specific guide was the sitemap or a Related Guides link on another guide,
// which meant a reader landing on the homepage had no path to "see everything you've written."
// Also gives search engines one canonical hub to attach authority to instead of 27 disconnected
// leaf pages. See scripts/prerender-guides.tsx for the crawler-facing static twin of this page.
export const GuidesIndexView: React.FC<GuidesIndexViewProps> = ({ onNavigate }) => {
  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.articles)) {
          setGuides(data.articles);
        } else {
          setLoadError(data?.error || 'Could not load the guide list.');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the server.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canonicalUrl = 'https://www.beforeregret.com/guides/';

  useEffect(() => {
    if (!guides) return;
    applyHeadSeo({
      title: 'Editorial Guides | BeforeRegret',
      description: 'Every BeforeRegret research guide in one place -- what to check for a home\'s age, permit history, and inspection blind spots before you sign.',
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Editorial Guides', 'item': canonicalUrl }
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'itemListElement': guides.map((g, idx) => ({
            '@type': 'ListItem',
            'position': idx + 1,
            'url': `https://www.beforeregret.com/guides/${g.slug}/`,
            'name': g.title
          }))
        }
      ]
    });
  }, [guides, canonicalUrl]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Editorial Guides</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Editorial Guides</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            What to check before you sign
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Every research guide we've published, in one place -- what a specific era, system, or record actually means for a home you're buying, cited back to the government or industry source behind it.
          </p>
          <button onClick={() => onNavigate('/counties/')} className="text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer">
            Looking for county-level hazard and housing data instead? Browse all covered counties →
          </button>
        </div>

        {loadError && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-sm text-slate-500">
            {loadError}
          </div>
        )}

        {!guides && !loadError && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {guides && guides.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-sm text-slate-500">
            No guides published yet -- check back soon.
          </div>
        )}

        {guides && guides.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((g) => (
              <button
                key={g.slug}
                onClick={() => onNavigate(`/guides/${g.slug}/`)}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 leading-snug">
                  {g.title}
                </h2>
                {g.metaDescription && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {g.metaDescription}
                  </p>
                )}
                {g.publishedAt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(g.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
