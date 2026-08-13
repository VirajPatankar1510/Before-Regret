import React from 'react';
import { BarChart3, ArrowRight, Database } from 'lucide-react';
import { HomeArticle } from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface OriginalResearchSectionProps {
  research: HomeArticle[];
  countyCount: number;
  onNavigate?: (path: string) => void;
}

/**
 * The authority section: pages built by ranking real Census housing-age data across every covered
 * county, rather than written from research. These are the only pages on the site that produce a
 * number nobody else has published, which makes them the strongest trust signal the homepage has --
 * and they were previously reachable only from the guides index.
 *
 * Card copy is each page's own meta description, rendered verbatim. Nothing here is generated or
 * summarised at display time.
 */
export const OriginalResearchSection: React.FC<OriginalResearchSectionProps> = ({
  research,
  countyCount,
  onNavigate,
}) => {
  if (research.length === 0) return null;

  const [featured, ...rest] = research;

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Database className="w-4 h-4" />
            <span>Original research</span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            We rank the data ourselves
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            These pages aren't roundups of other people's articles. Each one ranks all {countyCount} covered
            counties by Census housing-age data for the era a given defect was actually installed — so you
            can see where a risk is concentrated instead of guessing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Featured: newest/most prominent piece gets the wide cell -- a uniform grid of five
              equal cards reads like a list, not an editorial section. */}
          <ContentLink
            href={`/guides/${featured.slug}/`}
            onNavigate={onNavigate}
            className="lg:col-span-2 bg-slate-900/80 border border-slate-700 rounded-2xl p-7 sm:p-8 flex flex-col justify-between gap-6 hover:border-blue-500/60 hover:bg-slate-900 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Featured analysis</span>
              </div>
              <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight group-hover:text-blue-100 transition-colors">
                {featured.title}
              </h3>
              {featured.metaDescription && (
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {featured.metaDescription}
                </p>
              )}
            </div>
            <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300 inline-flex items-center gap-2">
              Read the analysis <ArrowRight className="w-4 h-4" />
            </span>
          </ContentLink>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
            {rest.slice(0, 2).map((page) => (
              <ContentLink
                key={page.slug}
                href={`/guides/${page.slug}/`}
                onNavigate={onNavigate}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
              >
                <h3 className="font-sans text-base font-bold text-white leading-snug group-hover:text-blue-100 transition-colors">
                  {page.title}
                </h3>
                <span className="text-xs font-semibold text-blue-400 inline-flex items-center gap-1.5 mt-auto pt-1">
                  County ranking <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </ContentLink>
            ))}
          </div>
        </div>

        {rest.length > 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.slice(2).map((page) => (
              <ContentLink
                key={page.slug}
                href={`/guides/${page.slug}/`}
                onNavigate={onNavigate}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
              >
                <h3 className="font-sans text-base font-bold text-white leading-snug group-hover:text-blue-100 transition-colors">
                  {page.title}
                </h3>
                <span className="text-xs font-semibold text-blue-400 inline-flex items-center gap-1.5 mt-auto pt-1">
                  County ranking <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </ContentLink>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
