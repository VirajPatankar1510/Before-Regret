// Topic model linking a guide to the verified counties that are the strongest real-world examples
// of its subject -- the "Where This Comes Up" block in scripts/prerender-guides.tsx (static-only;
// see that script for why this isn't mirrored in the live client component).
//
// ONE DIRECTION ONLY, AS OF 2026-09-04. This file used to power cross-linking both ways, the
// other half feeding "Related Guides" on a county page. County pages were deleted in 5e4b3e3 and
// scripts/prerender-counties.tsx went with them, which left TOPIC_GUIDES, pickGuidesForCounty,
// ALL_TOPICS, GuideLink, PermitGuideLink, findPermitGuideForCounty and isPossiblePermitGuideSlug
// with no callers at all. They were removed on 2026-09-04 along with the stale slugs below; git
// history has them if county pages ever come back.
//
// STALE SLUGS REMOVED AT THE SAME TIME. The 2026-09-02 prune cut 120 guides, and this file still
// named twelve of them: six keys in GUIDE_TOPICS, six in the permit alias table. None of it
// rendered a dead link -- every entry here is a key looked up BY an existing guide, so a key for
// a guide that no longer exists is simply never read -- but it was twelve slugs claiming to
// describe a library that had moved on. Verified against the database, not by eye.
//
// Two topics went with them. castIronEra and asbestosEra had exactly one guide each and both were
// pruned, leaving the topics unreachable. Note that the cast-iron guide has a survivor: the prune
// 301'd cast-iron-sewer-pipes-fail-standard-home-inspection into why-cast-iron-pipes-corrode,
// which is still published. Mapping that survivor back to a castIronEra topic would restore the
// county links this guide used to get -- deliberately NOT done here, because that adds a block to
// a live page and this change is meant to be behaviour-neutral. It is a one-line change if wanted.
//
// Every mapping below is tied to a real, common installation era for that defect/material (per
// the guide content itself, which already cites this), not a guess at what might be interesting
// to link -- same "no data, no page" standard the rest of the county pipeline holds itself to.

export interface CountyTopicInput {
  slug: string;
  countyName: string;
  stateAbbrev: string;
  radonZone: number | null;
  yearBuiltBuckets: Record<string, number>;
  totalUnits: number | null;
}

type GuideTopic =
  | 'radonZone1'
  | 'knobAndTubeEra'
  | 'midCenturyPanelEra'
  | 'aluminumWiringEra'
  | 'polybutyleneEra'
;

// slug -> topic. Only guides with a real housing-era or radon-zone tie appear here; most
// guides have no topic and get no county block, which is the intended default.
export const GUIDE_TOPICS: Record<string, GuideTopic> = {
  'negotiate-radon-mitigation-after-inspection': 'radonZone1',
  'knob-tube-wiring-have-be-replaced-before-closing': 'knobAndTubeEra',
  'federal-pacific-stab-lok-panel-inspectors-flag': 'midCenturyPanelEra',
  'will-zinsco-panel-fail-4-point-inspection': 'midCenturyPanelEra',
  'get-home-insurance-aluminum-wiring': 'aluminumWiringEra',
  'spot-polybutylene-pipes-before-buying-house': 'polybutyleneEra',
};

function eraShare(buckets: Record<string, number>, total: number | null, keys: string[]): number {
  if (!total) return 0;
  return (keys.reduce((sum, k) => sum + (buckets[k] || 0), 0) / total) * 100;
}

// Minimum share of a county's housing stock that must fall in a defect's installation era before
// it's worth linking -- a county that's 3% pre-1950 shouldn't get a knob-and-tube callout, that's
// noise, not a finding.
const THRESHOLD = 15;

function topicShare(topic: GuideTopic, county: CountyTopicInput): number {
  switch (topic) {
    case 'radonZone1':
      return county.radonZone === 1 ? 100 : 0;
    case 'knobAndTubeEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, ['built1939OrEarlier', 'built1940to1949', 'built1950to1959']);
    case 'midCenturyPanelEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, ['built1950to1959', 'built1960to1969', 'built1970to1979']);
    case 'aluminumWiringEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, ['built1960to1969', 'built1970to1979']);
    case 'polybutyleneEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, ['built1970to1979', 'built1980to1989']);
  }
}

// Guide-page direction: given this guide's topic, which of our verified counties are the
// strongest real examples to link to (highest matching share first). Returns [] for guides with no
// mapped topic (most guides -- only ones with a real housing-era or radon-zone tie get this).
export function pickCountiesForGuide(
  guideSlug: string,
  counties: CountyTopicInput[]
): Array<{ slug: string; countyName: string; stateAbbrev: string }> {
  const topic = GUIDE_TOPICS[guideSlug];
  if (!topic) return [];
  return counties
    .map((county) => ({ county, share: topicShare(topic, county) }))
    .filter((s) => s.share >= THRESHOLD)
    .sort((a, b) => b.share - a.share)
    .slice(0, 3)
    .map((s) => ({ slug: s.county.slug, countyName: s.county.countyName, stateAbbrev: s.county.stateAbbrev }));
}

// A second, unrelated kind of guide<->county link, added alongside the era-topic system above --
// not a threshold match at all, a real-identity one. The "How to Check Building Permits in X
// County" series is ABOUT one specific county each, by name, and none of them carry a housing-era
// topic (they're process guides, not defect guides), so GUIDE_TOPICS/pickCountiesForGuide above
// never fires for them. That left every one of these guides and its own named county page with no
// link to each other at all -- confirmed live: the permit guide for a county and that county's own
// page didn't reference one another anywhere on the site, despite being the most obviously related
// pair possible.
//
// Most permit-guide slugs already encode their target county's slug directly
// (check-building-permits-<county-slug>), so the match is usually just string surgery. Two kinds
// of exception land here: five US municipalities that sit inside a differently-named county
// (Manhattan -> New York County, Brooklyn -> Kings County, Queens -> Queens County, the Bronx ->
// Bronx County, Seattle -> King County, WA), and two guides written before the
// "check-building-permits-<county-slug>" naming convention existed, whose slugs don't start with
// that prefix at all (check-harris-county-permit-history-before-buying, check-building-permit-
// history-before-buying-travis-county-tx) -- found via a real audit of every permit guide's
// rendered HTML: 29 of 31 carried the county-data card automatically, these two were the only
// silent misses, both because permitGuideCountySlug's prefix check simply never matched their
// older slug shape. All seven verified against the real county_data rows, not guessed.
const PERMIT_GUIDE_COUNTY_ALIASES: Record<string, string> = {
  'check-building-permits-bronx-ny': 'bronx-county-ny',
};

const PERMIT_GUIDE_SLUG_PREFIX = 'check-building-permits-';

/** The one county slug a "How to Check Building Permits in X" guide is actually about, or
 *  undefined for every other guide (including one of this series whose target county isn't yet a
 *  verified county_data row -- this deliberately does not guess a match for that case). */
export function permitGuideCountySlug(guideSlug: string): string | undefined {
  if (PERMIT_GUIDE_COUNTY_ALIASES[guideSlug]) return PERMIT_GUIDE_COUNTY_ALIASES[guideSlug];
  if (guideSlug.startsWith(PERMIT_GUIDE_SLUG_PREFIX)) return guideSlug.slice(PERMIT_GUIDE_SLUG_PREFIX.length);
  return undefined;
}

