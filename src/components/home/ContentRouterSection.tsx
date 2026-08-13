import React from 'react';
import {
  FileSearch,
  ShieldAlert,
  Wrench,
  ScanText,
  UserCheck,
  ClipboardList,
  Receipt,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { GuideCluster } from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface ContentRouterSectionProps {
  clusters: GuideCluster[];
  totalGuides: number;
  onNavigate?: (path: string) => void;
}

// Keyed by the cluster ids in src/utils/homeContent.ts. A cluster with no entry falls back to
// BookOpen rather than breaking the grid, so adding a rule there can't crash this.
const CLUSTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  permits: FileSearch,
  insurance: ShieldAlert,
  materials: Wrench,
  decoder: ScanText,
  hiring: UserCheck,
  scope: ClipboardList,
  mechanics: Receipt,
};

const LINKS_PER_CARD = 3;

/**
 * The homepage's content router: the library indexed by the buyer's situation rather than by topic
 * or publish date.
 *
 * Most people who reach this site arrive mid-purchase with one specific worry ("what does amateur
 * workmanship mean on my report", "will they insure a fuse box"), and a reverse-chronological list
 * of 56 guides makes them hunt for it. Grouping by situation lets someone self-identify in one
 * scan, and it gives the homepage a real internal-linking job -- roughly two dozen guide pages that
 * previously had no path in from the highest-authority page on the domain.
 */
export const ContentRouterSection: React.FC<ContentRouterSectionProps> = ({
  clusters,
  totalGuides,
  onNavigate,
}) => {
  if (clusters.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Start with what's actually worrying you
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {totalGuides} researched guides, grouped by the situation you're in — not by the date they
            were written. Every one is free to read.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clusters.map((cluster) => {
            const Icon = CLUSTER_ICONS[cluster.id] ?? BookOpen;
            const shown = cluster.guides.slice(0, LINKS_PER_CARD);
            const remaining = cluster.guides.length - shown.length;

            return (
              <div
                key={cluster.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 tabular-nums shrink-0">
                    {cluster.guides.length} guides
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-sans text-lg font-bold text-slate-900 leading-snug">
                    {cluster.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cluster.blurb}</p>
                </div>

                <ul className="space-y-1 pt-1 border-t border-slate-100 mt-auto">
                  {shown.map((guide) => (
                    <li key={guide.slug}>
                      <ContentLink
                        href={`/guides/${guide.slug}/`}
                        onNavigate={onNavigate}
                        className="group flex items-start gap-2 py-2 text-xs font-medium text-slate-700 hover:text-blue-700 leading-snug"
                      >
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        <span>{guide.title}</span>
                      </ContentLink>
                    </li>
                  ))}
                </ul>

                {remaining > 0 && (
                  <ContentLink
                    href="/guides/"
                    onNavigate={onNavigate}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    +{remaining} more in this group →
                  </ContentLink>
                )}
              </div>
            );
          })}

          {/* Terminal card: the grid's last cell doubles as the route into the full index, so the
              section ends on a way forward rather than a ragged edge. */}
          <ContentLink
            href="/guides/"
            onNavigate={onNavigate}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center gap-3 text-center hover:bg-slate-800 transition-all group"
          >
            <BookOpen className="w-7 h-7 text-blue-400 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="font-sans text-lg font-bold text-white">Browse the full library</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All {totalGuides} guides in one index, searchable by title.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 inline-flex items-center justify-center gap-1.5">
              View all guides <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </ContentLink>
        </div>

      </div>
    </section>
  );
};
