// Cross-county ranking context -- the piece that was missing from every county page: each one
// reported its own data in isolation, with no sense of how that county compares to the other 30
// we cover. Real, computed comparisons from data already sitting in county_data (housing age,
// FEMA's own overall risk score, NOAA's own recorded storm counts) -- nothing here is a new data
// source, and nothing is AI-generated. A shared, dependency-free module (no React, no Node) so the
// live API route (src/server/countiesApi.ts) and the static prerender
// (scripts/prerender-counties.tsx) compute the exact same rank from the exact same input, the same
// discipline src/utils/homeContent.ts uses for the homepage.
//
// Ranking is a plain ordinal position after sorting descending ("higher share/score/count ranks
// higher"), ties broken by slug for a deterministic order -- not a statistical percentile. That's
// the right precision level for "ranks 4th of 31," not overengineering for what's ultimately a
// small, fixed comparison set.

export interface CountyMetricInput {
  slug: string;
  censusTotalUnits: number | null;
  /** Raw Census B25034 buckets, keyed like 'built1939OrEarlier', 'built1940to1949', etc. */
  censusYearBuiltBuckets: Record<string, number>;
  femaRiskScore: number | null;
  /** Raw NOAA event-type -> count map, e.g. { Hail: 147, "Flash Flood": 96 }. */
  noaaEventCounts: Record<string, number>;
}

export interface CountyRank {
  rank: number;
  total: number;
}

export interface CountyRankings {
  oldHousingShareRank: CountyRank | null;
  hazardRiskScoreRank: CountyRank | null;
  stormFrequencyRank: CountyRank | null;
}

const PRE_1970_BUCKETS = ['built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969'];

/** Share (0-100) of a county's housing units built before 1970 -- the same cutoff CountyPageView.tsx
 *  and prerender-counties.tsx already use for the "old enough that knob-and-tube..." callout, kept
 *  here as the single source of truth for both that callout and this ranking. */
export function computeOldHousingSharePct(row: CountyMetricInput): number | null {
  if (!row.censusTotalUnits) return null;
  const preSum = PRE_1970_BUCKETS.reduce((sum, key) => sum + (row.censusYearBuiltBuckets[key] || 0), 0);
  return (preSum / row.censusTotalUnits) * 100;
}

export function computeTotalStormEvents(row: CountyMetricInput): number {
  return Object.values(row.noaaEventCounts).reduce((sum, n) => sum + n, 0);
}

/** 1-based rank of `value` within `values` sorted descending (rank 1 = highest). Ties share sort
 *  order by slug, not by value, so every county still gets a distinct, deterministic rank. */
function rankDescending(entries: Array<{ slug: string; value: number }>, targetSlug: string): CountyRank | null {
  const target = entries.find((e) => e.slug === targetSlug);
  if (!target) return null;
  const sorted = [...entries].sort((a, b) => b.value - a.value || a.slug.localeCompare(b.slug));
  const index = sorted.findIndex((e) => e.slug === targetSlug);
  return { rank: index + 1, total: sorted.length };
}

export function computeCountyRankings(targetSlug: string, allRows: CountyMetricInput[]): CountyRankings {
  const housingEntries = allRows
    .map((r) => ({ slug: r.slug, value: computeOldHousingSharePct(r) }))
    .filter((e): e is { slug: string; value: number } => e.value !== null);
  const hazardEntries = allRows
    .map((r) => ({ slug: r.slug, value: r.femaRiskScore }))
    .filter((e): e is { slug: string; value: number } => e.value !== null);
  const stormEntries = allRows.map((r) => ({ slug: r.slug, value: computeTotalStormEvents(r) }));

  return {
    oldHousingShareRank: rankDescending(housingEntries, targetSlug),
    hazardRiskScoreRank: rankDescending(hazardEntries, targetSlug),
    stormFrequencyRank: rankDescending(stormEntries, targetSlug),
  };
}
