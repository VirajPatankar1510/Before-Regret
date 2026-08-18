// Shared topic model linking a county's housing-age/hazard profile to the guides most relevant to
// a home of that profile -- and the reverse: which of our verified counties are the strongest
// real-world examples of a given guide's topic. Powers cross-linking in both directions:
//   - scripts/prerender-counties.tsx / CountyPageView.tsx: "Related Guides" on a county page
//   - scripts/prerender-guides.tsx: "Where This Comes Up" on a guide page (static-only -- see that
//     script's comment for why this direction isn't mirrored in the live client component)
// One era-share calculation feeds both directions, so a county page and a guide page can never
// disagree about whether, say, Travis County counts as "knob-and-tube era."
//
// Every mapping below is tied to a real, common installation era for that defect/material (per
// the guide content itself, which already cites this), not a guess at what might be interesting
// to link -- same "no data, no page" standard the rest of the county pipeline holds itself to.

export interface GuideLink {
  slug: string;
  title: string;
}

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
  | 'castIronEra'
  | 'asbestosEra';

// slug -> topic, for the guide-page-to-county-page direction.
export const GUIDE_TOPICS: Record<string, GuideTopic> = {
  'negotiate-radon-mitigation-after-inspection': 'radonZone1',
  'i-buy-house-knob-tube-wiring': 'knobAndTubeEra',
  'get-homeowners-insurance-knob-tube-wiring': 'knobAndTubeEra',
  'knob-tube-wiring-have-be-replaced-before-closing': 'knobAndTubeEra',
  'federal-pacific-stab-lok-panel-inspectors-flag': 'midCenturyPanelEra',
  'fpe-panel-fail-home-insurance-like-zinsco': 'midCenturyPanelEra',
  'will-zinsco-panel-fail-4-point-inspection': 'midCenturyPanelEra',
  'get-home-insurance-aluminum-wiring': 'aluminumWiringEra',
  'spot-polybutylene-pipes-before-buying-house': 'polybutyleneEra',
  'get-home-insurance-polybutylene-plumbing': 'polybutyleneEra',
  'cast-iron-sewer-pipes-fail-standard-home-inspection': 'castIronEra',
  'standard-home-inspection-check-asbestos': 'asbestosEra',
};

// topic -> guides to show on a county page, most specific/actionable first.
const TOPIC_GUIDES: Record<GuideTopic, GuideLink[]> = {
  radonZone1: [
    { slug: 'negotiate-radon-mitigation-after-inspection', title: 'Can You Negotiate Radon Mitigation After Inspection?' },
  ],
  knobAndTubeEra: [
    { slug: 'i-buy-house-knob-tube-wiring', title: 'Can I buy a house with knob-and-tube wiring?' },
    { slug: 'get-homeowners-insurance-knob-tube-wiring', title: 'Can You Get Homeowners Insurance with Knob and Tube Wiring?' },
    { slug: 'knob-tube-wiring-have-be-replaced-before-closing', title: 'Does Knob and Tube Wiring Have to Be Replaced Before Closing?' },
  ],
  midCenturyPanelEra: [
    { slug: 'federal-pacific-stab-lok-panel-inspectors-flag', title: 'What Is a Federal Pacific Stab-Lok Panel and Why Inspectors Flag It?' },
    { slug: 'fpe-panel-fail-home-insurance-like-zinsco', title: 'Do Federal Pacific (FPE) Panels Affect Insurance Like Zinsco Panels?' },
    { slug: 'will-zinsco-panel-fail-4-point-inspection', title: 'Will a Zinsco Panel Fail a 4-Point Inspection?' },
  ],
  aluminumWiringEra: [
    { slug: 'get-home-insurance-aluminum-wiring', title: 'Can You Get Home Insurance with Aluminum Wiring?' },
  ],
  polybutyleneEra: [
    { slug: 'spot-polybutylene-pipes-before-buying-house', title: 'How to Spot Polybutylene Pipes Before Buying a House' },
    { slug: 'get-home-insurance-polybutylene-plumbing', title: 'Can You Get Home Insurance with Polybutylene Plumbing?' },
  ],
  castIronEra: [
    { slug: 'cast-iron-sewer-pipes-fail-standard-home-inspection', title: 'Can Cast Iron Sewer Pipes Fail a Standard Home Inspection?' },
  ],
  asbestosEra: [
    { slug: 'standard-home-inspection-check-asbestos', title: 'Does a Standard Home Inspection Check for Asbestos?' },
  ],
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
    case 'castIronEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, [
        'built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969',
      ]);
    case 'asbestosEra':
      return eraShare(county.yearBuiltBuckets, county.totalUnits, [
        'built1939OrEarlier', 'built1940to1949', 'built1950to1959', 'built1960to1969', 'built1970to1979',
      ]);
  }
}

const ALL_TOPICS: GuideTopic[] = [
  'radonZone1', 'knobAndTubeEra', 'midCenturyPanelEra', 'aluminumWiringEra', 'polybutyleneEra', 'castIronEra', 'asbestosEra',
];

// County-page direction: which guides are relevant to this county's actual profile, ranked by how
// strongly the county matches each topic. De-duplicated in case a guide is reachable via more than
// one matching topic (e.g. a county that's both knob-and-tube era and mid-century-panel era).
export function pickGuidesForCounty(county: CountyTopicInput): GuideLink[] {
  const matchedTopics = ALL_TOPICS
    .map((topic) => ({ topic, share: topicShare(topic, county) }))
    .filter((t) => t.share >= THRESHOLD)
    .sort((a, b) => b.share - a.share);

  const seen = new Set<string>();
  const result: GuideLink[] = [];
  for (const { topic } of matchedTopics) {
    for (const guide of TOPIC_GUIDES[topic]) {
      if (!seen.has(guide.slug)) {
        seen.add(guide.slug);
        result.push(guide);
      }
    }
  }
  return result.slice(0, 6);
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
// (check-building-permits-<county-slug>), so the match is usually just string surgery. The five
// exceptions are US municipalities that sit inside a differently-named county -- verified against
// the real county_data rows, not guessed: Manhattan -> New York County, Brooklyn -> Kings County,
// Queens -> Queens County, the Bronx -> Bronx County, Seattle -> King County, WA.
const PERMIT_GUIDE_COUNTY_ALIASES: Record<string, string> = {
  'check-building-permits-manhattan-ny': 'new-york-county-ny',
  'check-building-permits-brooklyn-ny': 'kings-county-ny',
  'check-building-permits-queens-ny': 'queens-county-ny',
  'check-building-permits-bronx-ny': 'bronx-county-ny',
  'check-building-permits-seattle-wa': 'king-county-wa',
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

export interface PermitGuideLink {
  slug: string;
  title: string;
}

// County-page direction: given the full published-guide list, which permit guide (if any) is
// about THIS county. Built from the real guide corpus rather than a hardcoded title, so a county
// page never shows a stale title if the guide's own title is ever edited.
export function findPermitGuideForCounty(
  countySlug: string,
  guides: Array<{ slug: string; title: string }>
): PermitGuideLink | undefined {
  return guides.find((g) => permitGuideCountySlug(g.slug) === countySlug);
}
