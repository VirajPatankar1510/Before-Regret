import React, { useEffect, useMemo, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, Loader2, BookOpen, Calendar, Search, X } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';
import { classifyGuideTopic, GUIDE_CLUSTER_META } from '../../utils/homeContent';

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
  // Filtering is CLIENT-SIDE ONLY, and that is a hard constraint rather than an implementation
  // shortcut. scripts/prerender-guides.tsx renders this page's crawler-facing static twin, and its
  // entire job is to give all 158 published guides one crawlable inbound link from a single hub.
  // Anything that removed links from that static HTML would trade the page's whole SEO purpose for
  // a browsing convenience. So the prerender still emits every guide, unfiltered; this state only
  // narrows what a booted human sees.
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);

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

  // Only offer a chip for a topic that actually has guides behind it, and show the real count on
  // it -- a filter that returns nothing is worse than no filter, and the count tells the reader
  // whether a topic is worth opening before they click it.
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides ?? []) {
      const id = classifyGuideTopic(g);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [guides]);

  const visibleGuides = useMemo(() => {
    if (!guides) return [];
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (topic && classifyGuideTopic(g) !== topic) return false;
      if (!q) return true;
      // Matches the meta description too, not just the title: a reader searching "aluminum" should
      // find a guide whose headline says "Stab-Lok" but whose description names the material.
      return `${g.title} ${g.metaDescription ?? ''}`.toLowerCase().includes(q);
    });
  }, [guides, query, topic]);

  const isFiltering = Boolean(query.trim() || topic);

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
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-blue-600">Home</ContentLink>
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
          {/* The "browse all covered counties" link that used to sit here pointed at /counties/,
              which has answered 410 since the county pages were retired on 2026-08-23. Missed in
              that cleanup -- Navbar, Footer and StaticFooterLinks were all updated, this one was
              not, and an Ahrefs crawl found it as the site's only broken internal link. Removed
              rather than repointed: there is no county content left to send anyone to. The twin
              copy in scripts/prerender-guides.tsx is removed alongside it, since the static and
              client renders of this page must not disagree. */}
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
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${guides.length} guides...`}
                aria-label="Search guides by title or description"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTopic(null)}
                aria-pressed={topic === null}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                  topic === null
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                All {guides.length}
              </button>
              {GUIDE_CLUSTER_META.filter((c) => (topicCounts.get(c.id) ?? 0) > 0).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTopic(topic === c.id ? null : c.id)}
                  aria-pressed={topic === c.id}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                    topic === c.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {c.title} {topicCounts.get(c.id)}
                </button>
              ))}
            </div>

            {isFiltering && (
              <p className="text-xs text-slate-500" role="status" aria-live="polite">
                Showing {visibleGuides.length} of {guides.length} guides.{' '}
                <button
                  onClick={() => { setQuery(''); setTopic(null); }}
                  className="font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                >
                  Clear filters
                </button>
              </p>
            )}
          </div>
        )}

        {guides && guides.length > 0 && visibleGuides.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
            <p className="text-sm text-slate-600">No guides match that search.</p>
            <button
              onClick={() => { setQuery(''); setTopic(null); }}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              Clear filters and show all {guides.length}
            </button>
          </div>
        )}

        {guides && guides.length > 0 && visibleGuides.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleGuides.map((g) => (
              <ContentLink
                key={g.slug}
                href={`/guides/${g.slug}/`}
                onNavigate={onNavigate}
                className="block bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
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
              </ContentLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
