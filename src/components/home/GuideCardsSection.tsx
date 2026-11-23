import React from 'react';
import { ChevronRight } from 'lucide-react';
import { GuideCluster, HomeArticle } from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface GuideCardsSectionProps {
  clusters: GuideCluster[];
  research: HomeArticle[];
  totalGuides: number;
  onNavigate?: (path: string) => void;
}

interface CardItem {
  slug: string;
  tag: string;
  title: string;
  excerpt?: string | null;
}

const CLUSTER_CARDS = 4;
const RESEARCH_CARDS = 2;

/**
 * A small, diverse sample of the guide library as real article cards -- one guide from each of a
 * few different buyer situations, plus a couple of the original-research pages.
 *
 * Replaced an earlier version of this section headed "What's Inside": that wording read as a
 * description of the paid report's contents rather than the free guide library sitting next to it,
 * which is exactly the confusion a landing page can't afford right above the price. Cards here are
 * framed and tagged as guides explicitly, and the copy says "free" and "not part of your report"
 * outright rather than leaving it to be inferred.
 */
export const GuideCardsSection: React.FC<GuideCardsSectionProps> = ({
  clusters,
  research,
  totalGuides,
  onNavigate,
}) => {
  const cards: CardItem[] = [
    ...clusters.slice(0, CLUSTER_CARDS).flatMap((cluster) =>
      cluster.guides.slice(0, 1).map((guide) => ({
        slug: guide.slug,
        tag: cluster.title,
        title: guide.title,
        excerpt: guide.metaDescription,
      }))
    ),
    ...research.slice(0, RESEARCH_CARDS).map((page) => ({
      slug: page.slug,
      tag: 'Original research',
      title: page.title,
      excerpt: page.metaDescription,
    })),
  ];

  if (cards.length === 0) return null;

  return (
    <section className="bg-white py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-6xl font-semibold text-home-ink tracking-[-0.025em] [text-wrap:balance]">
            Free guides for home buyers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <ContentLink
              key={card.slug}
              href={`/guides/${card.slug}/`}
              onNavigate={onNavigate}
              className="bg-home-mist border border-transparent rounded-3xl p-6 flex flex-col gap-2.5 hover:bg-home-linen/60 hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-xs font-semibold text-slate-500">
                {card.tag}
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug transition-colors">
                {card.title}
              </h3>
              {card.excerpt && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{card.excerpt}</p>
              )}
              <span className="text-sm font-medium text-blue-600 group-hover:underline underline-offset-2 inline-flex items-center gap-1 mt-auto pt-1">
                Read guide <ChevronRight className="w-4 h-4" />
              </span>
            </ContentLink>
          ))}
        </div>

        <div className="text-center">
          <ContentLink
            href="/guides/"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-1 text-base font-medium text-blue-600 hover:underline underline-offset-2"
          >
            Browse all {totalGuides} guides <ChevronRight className="w-4 h-4" />
          </ContentLink>
        </div>

      </div>
    </section>
  );
};
