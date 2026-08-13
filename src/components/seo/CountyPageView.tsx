import React, { useEffect, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, Loader2, MapPin, Home, Flame, CloudRain, ExternalLink, BarChart3 } from 'lucide-react';
import { ArticleClosingNote } from './ArticleClosingNote';
import { pickGuidesForCounty, GuideLink } from '../../utils/countyGuideTopics';
import { CountyRankings } from '../../utils/countyRankings';

interface CountyPageViewProps {
  countySlug: string;
  onNavigate: (path: string) => void;
}

interface CountyData {
  slug: string;
  countyName: string;
  stateName: string;
  stateAbbrev: string;
  population: number | null;
  radonZone: number | null;
  censusTotalUnits: number | null;
  censusYearBuiltBuckets: Record<string, number>;
  femaRiskRating: string | null;
  femaRiskScore: number | null;
  femaHazards: Record<string, { rating: string; score: number | null }>;
  noaaEventCounts: Record<string, number>;
  noaaYearsCovered: string | null;
  fetchedAt: string;
  /** Optional -- absent for any cached __PRELOADED_COUNTY__ blob written before this field existed. */
  rankings?: CountyRankings;
}

// Labels/order for the Census B25034 buckets this page renders -- oldest first, matching how
// FaqSection.tsx-style honesty framing expects a reader to scan (recent construction first would
// bury the "does this county have a lot of pre-1960s housing" signal a buyer actually wants).
const YEAR_BUILT_LABELS: Array<[key: string, label: string]> = [
  ['built2020OrLater', '2020 or later'],
  ['built2010to2019', '2010-2019'],
  ['built2000to2009', '2000-2009'],
  ['built1990to1999', '1990-1999'],
  ['built1980to1989', '1980-1989'],
  ['built1970to1979', '1970-1979'],
  ['built1960to1969', '1960-1969'],
  ['built1950to1959', '1950-1959'],
  ['built1940to1949', '1940-1949'],
  ['built1939OrEarlier', '1939 or earlier'],
];

// FEMA's own short codes -> human labels, kept here rather than in the fetcher (see
// src/server/countyDataFetcher.ts) so that module stays a faithful pass-through of the API.
const FEMA_HAZARD_LABELS: Record<string, string> = {
  AVLN: 'Avalanche', CFLD: 'Coastal Flooding', CWAV: 'Cold Wave', DRGT: 'Drought',
  ERQK: 'Earthquake', HAIL: 'Hail', HWAV: 'Heat Wave', HRCN: 'Hurricane',
  ISTM: 'Ice Storm', LNDS: 'Landslide', LTNG: 'Lightning', IFLD: 'Inland Flooding',
  SWND: 'Strong Wind', TRND: 'Tornado', TSUN: 'Tsunami', VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire', WNTW: 'Winter Weather',
};

const RADON_ZONE_TEXT: Record<number, string> = {
  1: 'Zone 1 -- highest potential. EPA predicts an average indoor radon screening level greater than 4 pCi/L for this county.',
  2: 'Zone 2 -- moderate potential. EPA predicts an average indoor radon screening level between 2 and 4 pCi/L for this county.',
  3: 'Zone 3 -- low potential. EPA predicts an average indoor radon screening level below 2 pCi/L for this county.',
};

// A handful of real county names have a correct spelling the naive title-case regex below can't
// produce -- an internal capital that isn't at a word/hyphen boundary. Checked before falling
// through to the regex, keyed on the all-caps source form.
const TITLE_CASE_OVERRIDES: Record<string, string> = {
  DUPAGE: 'DuPage',
};

// The API returns countyName in the all-caps form FEMA/NOAA/Census use internally for matching
// (e.g. "TRAVIS") -- fine for those lookups, not for a reader-facing page. Title-cased once here
// rather than at every display site below.
function titleCase(value: string): string {
  if (TITLE_CASE_OVERRIDES[value]) return TITLE_CASE_OVERRIDES[value];
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

// Reads the county scripts/prerender-counties.tsx bakes into the static page as
// __PRELOADED_COUNTY__, only when its slug matches the one being rendered -- same fix, same
// reasoning, as GuidePageView.tsx's readPreloadedGuide: a client-side navigation to a different
// county must still fetch fresh, since the script tag on the page holds whichever county was
// server-rendered, not a new one.
function readPreloadedCounty(slug: string): Record<string, any> | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('__PRELOADED_COUNTY__');
  if (!el?.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent);
    return parsed?.slug === slug ? parsed : null;
  } catch {
    return null;
  }
}

export const CountyPageView: React.FC<CountyPageViewProps> = ({ countySlug, onNavigate }) => {
  const [county, setCounty] = useState<CountyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setCounty(null);

    // Skip the network entirely when this exact county is already embedded in the page -- see
    // readPreloadedCounty above. Without this, this SPA's createRoot() (not hydrateRoot())
    // re-render unconditionally discards the correct static content and re-fetches identical data
    // on every load, including the very first one; if that fetch fails or gets cut off inside a
    // crawler's render time budget, the .catch() below treats it identically to "this county
    // doesn't exist" -- exactly the soft-404 bug this fixes (see GuidePageView.tsx's identical fix
    // for the full incident writeup).
    const preloaded = readPreloadedCounty(countySlug);
    if (preloaded) {
      setCounty({ ...preloaded, countyName: titleCase(preloaded.countyName) } as CountyData);
      setLoading(false);
      return;
    }

    fetch(`/api/counties/${encodeURIComponent(countySlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.county) {
          setCounty({ ...data.county, countyName: titleCase(data.county.countyName) });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countySlug]);

  const canonicalUrl = `https://www.beforeregret.com/county/${countySlug}/`;

  useEffect(() => {
    if (!county) return;
    const title = `${county.countyName} County, ${county.stateAbbrev} Property Research | BeforeRegret`;
    const description = `Real, sourced data for ${county.countyName} County, ${county.stateAbbrev}: EPA radon zone, Census housing-age distribution, FEMA natural hazard risk, and recorded NOAA storm history.`;
    applyHeadSeo({
      title,
      description,
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          image: 'https://www.beforeregret.com/hero-bg.jpg',
          dateModified: county.fetchedAt,
          author: { '@type': 'Organization', name: 'BeforeRegret' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', position: 2, name: 'County Research', item: 'https://www.beforeregret.com/counties/' },
            { '@type': 'ListItem', position: 3, name: `${county.countyName} County, ${county.stateAbbrev}`, item: canonicalUrl },
          ],
        },
      ],
    });
  }, [county, canonicalUrl]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !county) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">County Not Found</h1>
        <p className="text-xs text-slate-600">This county doesn't have a research page yet.</p>
        <button onClick={() => onNavigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  // All of them, not a top-N slice -- FEMA's National Risk Index scores 18 hazard types (this app
  // stores whichever a county actually has real values for, typically 14), and trimming to a top 5
  // was an arbitrary display cap that hid real data this app already holds and already fetched.
  const femaHazardEntries = Object.entries(county.femaHazards) as [string, { rating: string; score: number | null }][];
  const topHazards = femaHazardEntries.sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0));

  const noaaEventEntries = Object.entries(county.noaaEventCounts) as [string, number][];
  const topStormEvents = noaaEventEntries.sort((a, b) => b[1] - a[1]);
  const totalStormEvents = noaaEventEntries.reduce((sum, [, count]) => sum + count, 0);
  // Same top-1 entry the hazard-map SVG picks server-side (see topHazard() in
  // countyHazardSvg.ts) -- reused here only to build accurate alt text, not recomputed
  // differently, so the image and its own alt text can never disagree about which hazard is "most
  // frequent."
  const topNoaaHazard = topStormEvents.length > 0 ? { type: topStormEvents[0][0], count: topStormEvents[0][1] } : null;

  const oldHousingShare = county.censusTotalUnits
    ? Math.round(
        (((county.censusYearBuiltBuckets.built1939OrEarlier || 0) +
          (county.censusYearBuiltBuckets.built1940to1949 || 0) +
          (county.censusYearBuiltBuckets.built1950to1959 || 0) +
          (county.censusYearBuiltBuckets.built1960to1969 || 0)) /
          county.censusTotalUnits) *
          100
      )
    : null;

  const relatedGuides: GuideLink[] = pickGuidesForCounty({
    slug: county.slug,
    countyName: county.countyName,
    stateAbbrev: county.stateAbbrev,
    radonZone: county.radonZone,
    yearBuiltBuckets: county.censusYearBuiltBuckets,
    totalUnits: county.censusTotalUnits,
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate('/counties/')} className="hover:text-blue-600 shrink-0">County Research</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">{county.countyName} County, {county.stateAbbrev}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{county.stateName}{county.population ? ` -- population ${county.population.toLocaleString()}` : ''}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {county.countyName} County, {county.stateAbbrev} Property Research
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real data from four public sources, not an internal estimate: the EPA's radon zone classification, Census housing-age records, FEMA's natural hazard risk index, and NOAA's recorded storm history for this county. Every figure below links to where it actually comes from.
          </p>
        </div>

        {county.rankings && (county.rankings.oldHousingShareRank || county.rankings.hazardRiskScoreRank || county.rankings.stormFrequencyRank) && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              How {county.countyName} County Compares
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ranked against all {county.rankings.oldHousingShareRank?.total || county.rankings.hazardRiskScoreRank?.total || county.rankings.stormFrequencyRank?.total} counties BeforeRegret currently covers -- same source data as the sections below, just compared side by side.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {county.rankings.oldHousingShareRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{county.rankings.oldHousingShareRank.rank}<span className="text-xs font-medium text-slate-400"> / {county.rankings.oldHousingShareRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">Share of housing built before 1970</div>
                </div>
              )}
              {county.rankings.hazardRiskScoreRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{county.rankings.hazardRiskScoreRank.rank}<span className="text-xs font-medium text-slate-400"> / {county.rankings.hazardRiskScoreRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">FEMA overall hazard risk score</div>
                </div>
              )}
              {county.rankings.stormFrequencyRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{county.rankings.stormFrequencyRank.rank}<span className="text-xs font-medium text-slate-400"> / {county.rankings.stormFrequencyRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">Recorded storm events{county.noaaYearsCovered ? ` (${county.noaaYearsCovered})` : ''}</div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              #1 is the highest of the group for that measure -- not necessarily a warning, and not a claim about any specific property in the county.
            </p>
          </section>
        )}

        {(county.femaRiskRating || county.radonZone) && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-600" />
              Hazard Summary
            </h2>
            {/* Rendered live from this same row -- see src/utils/countyHazardSvg.ts and the
                /api/images/:filename route (kept under /api/ since vercel.json only rewrites
                /api/:path* to the real server function; a scoped robots.txt Allow makes this one
                path crawlable despite the blanket /api/ disallow -- see generateRobotsTxt()).
                Not build-time static, so it can never go stale the way a prerendered guide page
                can (see deployHookService.ts); every value plotted here is read from the
                identical row the text sections below already cite, so the image can't say
                anything the page doesn't. Filename carries the real slug for image-SEO, not a
                generic "hazard-map.svg" repeated across all 31 counties. */}
            <img
              src={`/api/images/${county.slug}-hazard-map.svg`}
              alt={`${county.countyName} County, ${county.stateAbbrev} hazard summary: FEMA National Risk Index rated ${county.femaRiskRating || 'not available'}${county.radonZone ? `; EPA radon zone ${county.radonZone} of 3` : ''}${topNoaaHazard ? `; most frequently recorded hazard is ${topNoaaHazard.type.toLowerCase()} (${topNoaaHazard.count} events${county.noaaYearsCovered ? `, ${county.noaaYearsCovered}` : ''})` : ''}.`}
              width={640}
              height={240}
              loading="lazy"
              className="w-full max-w-2xl rounded-2xl border border-slate-100"
            />
          </section>
        )}

        {county.radonZone && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-600" />
              Radon Risk
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{RADON_ZONE_TEXT[county.radonZone]}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This is a county-wide prediction from geology and soil data, not a measurement of any specific home -- EPA recommends testing every home regardless of zone.{' '}
              <button onClick={() => onNavigate('/guides/negotiate-radon-mitigation-after-inspection/')} className="text-blue-600 hover:underline font-medium">
                See our guide on negotiating radon mitigation after inspection
              </button>.
            </p>
            <a
              href="https://www.epa.gov/radon/epa-maps-radon-zones-and-supporting-documents-state"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
            >
              <span>Source: EPA Map of Radon Zones</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </section>
        )}

        {county.censusTotalUnits != null && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" />
              Housing Age
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {county.countyName} County has {county.censusTotalUnits.toLocaleString()} housing units.
              {oldHousingShare != null && oldHousingShare > 0 && (
                <> About {oldHousingShare}% were built in 1969 or earlier -- old enough that knob-and-tube wiring, lead-based paint, and galvanized supply lines are all realistic possibilities worth checking for, not just a general inspection line item.</>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {YEAR_BUILT_LABELS.map(([key, label]) => (
                <div key={key} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-slate-500">{label}</div>
                  <div className="font-bold text-slate-900">{(county.censusYearBuiltBuckets[key] || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              <button onClick={() => onNavigate('/guides/knob-tube-wiring-have-be-replaced-before-closing/')} className="text-blue-600 hover:underline font-medium">
                Does knob-and-tube wiring have to be replaced before closing?
              </button>
            </p>
            <a
              href="https://data.census.gov/table/ACSDT5Y2023.B25034"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
            >
              <span>Source: U.S. Census Bureau, ACS 5-Year Estimates, Table B25034</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </section>
        )}

        {county.femaRiskRating && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              Natural Hazard Risk
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              FEMA rates {county.countyName} County's overall natural hazard risk as <strong>{county.femaRiskRating}</strong>, relative to the rest of the country.
            </p>
            {topHazards.length > 0 && (
              <div className="space-y-1.5">
                {topHazards.map(([code, h]) => (
                  <div key={code} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    <span className="text-slate-700 font-medium">{FEMA_HAZARD_LABELS[code] || code}</span>
                    <span className="text-slate-900 font-bold">{h.rating}</span>
                  </div>
                ))}
              </div>
            )}
            <a
              href="https://hazards.fema.gov/nri/"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
            >
              <span>Source: FEMA National Risk Index</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </section>
        )}

        {totalStormEvents > 0 && county.noaaYearsCovered && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              Recorded Storm History ({county.noaaYearsCovered})
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              NOAA recorded {totalStormEvents.toLocaleString()} storm events in {county.countyName} County between {county.noaaYearsCovered.replace('-', ' and ')}. This is actual event history, not a risk model -- the counts below are individually logged storms, not a prediction.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {topStormEvents.map(([type, count]) => (
                <div key={type} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-slate-500">{type}</div>
                  <div className="font-bold text-slate-900">{count.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <a
              href="https://www.ncei.noaa.gov/stormevents/"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
            >
              <span>Source: NOAA National Centers for Environmental Information, Storm Events Database</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Guides Relevant to This County's Housing Stock
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => onNavigate(`/guides/${g.slug}/`)}
                  className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 text-left"
                >
                  <span>{g.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <ArticleClosingNote onNavigate={onNavigate} />

        <p className="text-xs text-slate-400 leading-relaxed">
          This page reports what these four public agencies have published for {county.countyName} County as a whole -- it is not an assessment of any specific address or property, and does not replace a licensed home inspection, radon test, or insurance review for a specific home. Data last checked {new Date(county.fetchedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        </p>
      </div>
    </div>
  );
};
