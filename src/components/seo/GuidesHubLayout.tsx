import React from 'react';
import { ArrowRight, ChevronRight, Search, X } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';
import { GUIDE_CLUSTER_META, groupGuidesForHub } from '../../utils/homeContent';

/**
 * The /guides/ hub, ONE component for both renders (2026-10-04 redesign) -- GuidesIndexView.tsx for
 * the live app and scripts/prerender-guides.tsx for the static HTML. They had drifted: the live
 * cards carried a description and a date that the static cards did not, so every card grew when
 * the app booted. Same reason and same fix as GuideArticleLayout.tsx.
 *
 * The hub's SEO job is unchanged and is why the default view is never filtered: every published
 * guide appears exactly once, grouped into sections (section h2, guide title h3), as a real link.
 * Search and topic chips only narrow what a booted visitor sees; statically they render inert at
 * their resting state, so the page does not reflow when they come alive.
 */

export interface HubGuide {
  slug: string;
  title: string;
  metaDescription?: string | null;
  publishedAt?: string | null;
}

interface GuidesHubLayoutProps<T extends HubGuide> {
  guides: T[];
  /** Guides after search/topic filtering. Equal to `guides` statically. */
  visibleGuides?: T[];
  onNavigate?: (path: string) => void;
  query?: string;
  topic?: string | null;
  topicCounts?: Map<string, number>;
  onQueryChange?: (q: string) => void;
  onTopicChange?: (t: string | null) => void;
  /** Shown instead of the list while the live app loads or fails. */
  status?: React.ReactNode;
}

const chip = (on: boolean) =>
  `px-3.5 py-1.5 text-xs font-bold rounded-full border transition-colors ${
    on ? 'bg-home-navy text-white border-home-navy' : 'bg-white text-slate-600 border-home-linen hover:border-home-oak hover:text-home-ink'
  }`;

export function GuidesHubLayout<T extends HubGuide>({
  guides,
  visibleGuides = guides,
  onNavigate,
  query = '',
  topic = null,
  topicCounts,
  onQueryChange,
  onTopicChange,
  status,
}: GuidesHubLayoutProps<T>) {
  const isFiltering = Boolean(query.trim() || topic);
  const interactive = Boolean(onQueryChange && onTopicChange);
  const clear = () => { onQueryChange?.(''); onTopicChange?.(null); };

  const card = (g: T) => (
    <ContentLink
      key={g.slug}
      href={`/guides/${g.slug}/`}
      onNavigate={onNavigate}
      className="group flex flex-col rounded-2xl bg-white border border-home-linen p-5 hover:border-home-oak hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <h3 className="text-[15px] font-bold text-home-ink leading-snug group-hover:text-home-navy">{g.title}</h3>
      {g.metaDescription && (
        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">{g.metaDescription}</p>
      )}
      <div className="mt-auto pt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          {g.publishedAt && new Date(g.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <ArrowRight className="w-4 h-4 text-home-oak shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </ContentLink>
  );

  return (
    <div className="bg-home-stone min-h-screen pb-16">
      <div className="border-b border-home-linen bg-white/70">
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-home-ink font-semibold">Editorial Guides</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <header className="pt-8 sm:pt-12 pb-6 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-home-brass">Editorial Guides</p>
          <h1 className="mt-3 font-serif text-[2.2rem] leading-[1.08] sm:text-5xl font-semibold text-home-ink tracking-[-0.01em]">
            What to check before you sign
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Every research guide we've published, in one place -- what a specific era, system, or record actually means for a home you're buying, cited back to the government or industry source behind it.
          </p>
        </header>

        {guides.length > 0 && (
          <div className="space-y-3 pb-2">
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={query}
                readOnly={!interactive}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder={`Search ${guides.length} guides...`}
                aria-label="Search guides by title or description"
                className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-home-linen rounded-xl focus:outline-none focus:border-home-oak focus:ring-2 focus:ring-home-oak/20 placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange?.('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {topicCounts && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onTopicChange?.(null)} aria-pressed={topic === null} className={`${chip(topic === null)} cursor-pointer`}>
                  All {guides.length}
                </button>
                {GUIDE_CLUSTER_META.filter((c) => (topicCounts.get(c.id) ?? 0) > 0).map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => onTopicChange?.(topic === c.id ? null : c.id)}
                    aria-pressed={topic === c.id}
                    className={`${chip(topic === c.id)} cursor-pointer`}
                  >
                    {c.title} {topicCounts.get(c.id)}
                  </button>
                ))}
              </div>
            )}

            {isFiltering && (
              <p className="text-xs text-slate-500" role="status" aria-live="polite">
                Showing {visibleGuides.length} of {guides.length} guides.{' '}
                <button type="button" onClick={clear} className="font-bold text-home-navy hover:underline cursor-pointer">
                  Clear filters
                </button>
              </p>
            )}
          </div>
        )}

        {status}

        {guides.length > 0 && visibleGuides.length === 0 && (
          <div className="mt-6 rounded-3xl bg-white border border-home-linen p-8 text-center space-y-2">
            <p className="text-sm text-slate-600">No guides match that search.</p>
            <button type="button" onClick={clear} className="text-xs font-bold text-home-navy hover:underline cursor-pointer">
              Clear filters and show all {guides.length}
            </button>
          </div>
        )}

        {/* Grouped when browsing, flat when filtering. The grouped branch is what the static page
            ships, so it must stay identical to it. */}
        {visibleGuides.length > 0 && (
          isFiltering ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleGuides.map(card)}
            </div>
          ) : (
            <div className="mt-8 space-y-12">
              {groupGuidesForHub<T>(visibleGuides).map((section) => (
                <section key={section.id}>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-home-ink tracking-tight">
                    {section.title}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.guides.map(card)}
                  </div>
                </section>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
