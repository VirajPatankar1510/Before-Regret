import { guideTopic } from '../utils/relatedGuides';

// Topic sponsorships: one advertiser on every guide in a topic cluster, for one flat price.
// Owner decision 2026-10-12 ($39 / 30 days; see marketing/cluster-plan.md).
//
// HOW IT IS STORED. A sponsorship is ONE guide_ad_purchases row, placed on the cluster's anchor
// guide and tagged with cluster_key. Every guide in the cluster that has no single-guide advertiser
// of its own shows that row's ad (GET /api/guide-ads/active/:articleId falls back to it). A guide
// already held by a single-guide advertiser keeps that advertiser; when their placement ends, the
// sponsor's ad takes the page over. So renewal, the one-time contact edit,
// click attribution and My Placements all keep running through the paths single-guide ads already
// use, with no second copy of any of them. A guide published into the cluster later is covered from
// the moment it goes live, with nothing to grant, because membership is computed rather than stored.
//
// MEMBERSHIP is the related-guides topic bucket (guideTopic in src/utils/relatedGuides.ts), the same
// grouping readers already see as "Related Guides". One definition, so the pages a sponsor pays for
// and the pages that link to one another as a topic cannot drift apart.
//
// The price is not here: it lives in src/server/adPricing.ts with every other ad price, and the
// client reads it from /api/guide-ads/slots.
export interface AdCluster {
  key: string;
  /** Shown to vendors and readers, e.g. "Stucco & EIFS". */
  name: string;
  /** The guideTopic() bucket whose published guides make up the cluster. */
  topic: string;
  /** The guide the sponsorship row is stored against. Must be a published member of the cluster. */
  anchorSlug: string;
  /**
   * The checkout's business types (TRADE_CATEGORIES) this topic is offered to. A vendor who picks a
   * business type sees only the topics listed for it; before picking one, they see every topic on offer.
   */
  trades: readonly string[];
}

// Owner rule 2026-10-12: a topic is only offered while at least this many of its guides are open for
// sale, i.e. not held by a single-guide advertiser. Below that it is a handful of pages, not a topic.
export const MIN_OPEN_GUIDES_FOR_SPONSORSHIP = 4;

export const AD_CLUSTERS: readonly AdCluster[] = [
  {
    key: 'stucco',
    name: 'Stucco & EIFS',
    topic: 'stucco',
    anchorSlug: 'standard-home-inspection-check-eifs-stucco-moisture',
    // Stucco & EIFS first (its own business type since 2026-10-12). Home Inspector and General
    // Contractor still see it, since some inspectors and repair firms who do EIFS will pick those.
    trades: ['Stucco & EIFS', 'Home Inspector', 'General Contractor'],
  },
];

export function adClusterByKey(key: unknown): AdCluster | null {
  return AD_CLUSTERS.find((c) => c.key === key) ?? null;
}

/** The sponsorable cluster a guide belongs to, or null when its topic is not sold as a cluster. */
export function adClusterForGuide(slug: string, title: string): AdCluster | null {
  const topic = guideTopic(slug, title);
  if (!topic) return null;
  return AD_CLUSTERS.find((c) => c.topic === topic) ?? null;
}
