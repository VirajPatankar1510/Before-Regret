import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import {
  GuideCluster,
  HomeArticle,
  HomeCounty,
  titleCaseCounty,
  formatPublishedDate,
} from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface LibrarySnapshotSectionProps {
  clusters: GuideCluster[];
  research: HomeArticle[];
  counties: HomeCounty[];
  updates: HomeArticle[];
  totalGuides: number;
  onNavigate?: (path: string) => void;
}

const CLUSTERS_SHOWN = 4;
const LINKS_PER_CLUSTER = 2;
const RESEARCH_SHOWN = 4;
const COUNTIES_SHOWN = 10;

/**
 * A single compact "what's inside" section -- one scan, not a browse. This replaced three full
 * sections (a situation router, an original-research spotlight, a county-by-county directory) that
 * were individually reasonable but together turned the homepage into a library index: every guide,
 * every county, every update, each with its own header and intro paragraph. A landing page's job is
 * to make the case fast and hand off to a real index page for the rest -- so this keeps one example
 * from each content type as proof, real links throughout, and a single link out to /guides/ for
 * everything it deliberately doesn't show inline.
 */
export const LibrarySnapshotSection: React.FC<LibrarySnapshotSectionProps> = ({
  clusters,
  research,
  counties,
  updates,
  totalGuides,
  onNavigate,
}) => {
  if (clusters.length === 0 && research.length === 0 && counties.length === 0) return null;

  const topClusters = clusters.slice(0, CLUSTERS_SHOWN);
  const topResearch = research.slice(0, RESEARCH_SHOWN);
  const topCounties = counties.slice(0, COUNTIES_SHOWN);
  const remainingCounties = counties.length - topCounties.length;
  const latestUpdate = updates[0];

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            What's inside
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {totalGuides} guides, ranked county data, and {counties.length} verified local datasets —
            free to read before you spend anything.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* By situation */}
          {topClusters.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Find your situation
              </h3>
              <div className="space-y-4">
                {topClusters.map((cluster) => (
                  <div key={cluster.id}>
                    <p className="text-sm font-bold text-slate-900 mb-1.5">{cluster.title}</p>
                    <ul className="space-y-1">
                      {cluster.guides.slice(0, LINKS_PER_CLUSTER).map((guide) => (
                        <li key={guide.slug}>
                          <ContentLink
                            href={`/guides/${guide.slug}/`}
                            onNavigate={onNavigate}
                            className="text-xs text-slate-600 hover:text-blue-700 leading-relaxed"
                          >
                            {guide.title}
                          </ContentLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Original research */}
          {topResearch.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Original research
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every covered county ranked by real Census data for a given defect's era.
              </p>
              <ul className="space-y-2.5 pt-1 border-t border-slate-100">
                {topResearch.map((page) => (
                  <li key={page.slug}>
                    <ContentLink
                      href={`/guides/${page.slug}/`}
                      onNavigate={onNavigate}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-700 leading-relaxed block py-0.5"
                    >
                      {page.title}
                    </ContentLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Local coverage */}
          {topCounties.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Local coverage</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {topCounties.map((county) => (
                  <ContentLink
                    key={county.slug}
                    href={`/county/${county.slug}/`}
                    onNavigate={onNavigate}
                    className="text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-300 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1"
                  >
                    {titleCaseCounty(county.countyName)}
                  </ContentLink>
                ))}
                {remainingCounties > 0 && (
                  <span className="text-[11px] font-medium text-slate-400 px-2.5 py-1">
                    +{remainingCounties} more
                  </span>
                )}
              </div>
              {latestUpdate && (
                <ContentLink
                  href={`/guides/${latestUpdate.slug}/`}
                  onNavigate={onNavigate}
                  className="block pt-3 border-t border-slate-100 group"
                >
                  <span className="block text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">
                    Latest update · {formatPublishedDate(latestUpdate.publishedAt)}
                  </span>
                  <span className="block text-xs font-medium text-slate-700 group-hover:text-blue-700 leading-snug">
                    {latestUpdate.title}
                  </span>
                </ContentLink>
              )}
            </div>
          )}

        </div>

        <div className="text-center">
          <ContentLink
            href="/guides/"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            Browse all {totalGuides} guides <ArrowRight className="w-4 h-4" />
          </ContentLink>
        </div>

      </div>
    </section>
  );
};
