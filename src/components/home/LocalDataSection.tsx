import React from 'react';
import { MapPin, Radio, ArrowRight } from 'lucide-react';
import {
  HomeArticle,
  HomeCounty,
  groupCountiesByState,
  titleCaseCounty,
  formatCompact,
  formatPublishedDate,
} from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface LocalDataSectionProps {
  counties: HomeCounty[];
  updates: HomeArticle[];
  onNavigate?: (path: string) => void;
}

/**
 * County coverage plus the live county-update feed, side by side.
 *
 * Paired deliberately: the county grid is the static proof of depth (31 verified datasets), and the
 * update feed is the proof it's still being maintained -- a research site that looks abandoned
 * converts badly no matter how good the archive is. Both halves were previously unreachable from
 * the homepage, which meant neither signal existed for a first-time visitor.
 */
export const LocalDataSection: React.FC<LocalDataSectionProps> = ({ counties, updates, onNavigate }) => {
  if (counties.length === 0) return null;

  const grouped = groupCountiesByState(counties);

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
            <MapPin className="w-4 h-4" />
            <span>Local data</span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Counties we hold verified data on
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Each page carries that county's real housing-age breakdown, FEMA risk rating, radon zone, and
            NOAA storm history — pulled from the source, not estimated.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* County grid */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {grouped.map((group) => (
                <div key={group.state} className="space-y-2">
                  <div className="flex items-baseline gap-2 pb-1.5 border-b border-slate-200">
                    <span className="font-sans text-sm font-extrabold text-slate-900 tracking-tight">
                      {group.state}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                      {group.counties.length} {group.counties.length === 1 ? 'county' : 'counties'}
                    </span>
                  </div>
                  <ul>
                    {group.counties.map((county) => (
                      <li key={county.slug}>
                        <ContentLink
                          href={`/county/${county.slug}/`}
                          onNavigate={onNavigate}
                          className="flex items-baseline justify-between gap-3 py-1.5 text-xs text-slate-700 hover:text-blue-700 font-medium group"
                        >
                          <span className="group-hover:underline">
                            {titleCaseCounty(county.countyName)}
                          </span>
                          {county.censusTotalUnits ? (
                            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                              {formatCompact(county.censusTotalUnits)} homes
                            </span>
                          ) : null}
                        </ContentLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Update feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-600">
                <Radio className="w-3.5 h-3.5" />
                <span>County updates</span>
              </div>
              <h3 className="font-sans text-lg font-bold text-slate-900 leading-snug">
                When something happens where you're buying
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We track federal disaster declarations daily and write up the ones that land in a covered
                county — what was declared, and what it means for a buyer mid-purchase there.
              </p>
            </div>

            {updates.length > 0 ? (
              <ul className="space-y-1 border-t border-slate-100 pt-2">
                {updates.map((update) => (
                  <li key={update.slug}>
                    <ContentLink
                      href={`/guides/${update.slug}/`}
                      onNavigate={onNavigate}
                      className="block py-2.5 group"
                    >
                      <span className="block text-[11px] font-semibold text-slate-400 tabular-nums mb-0.5">
                        {formatPublishedDate(update.publishedAt)}
                      </span>
                      <span className="block text-xs font-semibold text-slate-800 group-hover:text-blue-700 leading-snug">
                        {update.title}
                      </span>
                    </ContentLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-4 leading-relaxed">
                No declarations in a covered county recently — this feed only fills when something real
                happens.
              </p>
            )}

            <ContentLink
              href="/guides/"
              onNavigate={onNavigate}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5 mt-auto"
            >
              All coverage <ArrowRight className="w-3.5 h-3.5" />
            </ContentLink>
          </div>

        </div>
      </div>
    </section>
  );
};
