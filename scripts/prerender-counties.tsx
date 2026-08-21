import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderToStaticMarkup } from 'react-dom/server';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { pickGuidesForCounty, GuideLink, findPermitGuideForCounty, PermitGuideLink, isPossiblePermitGuideSlug } from '../src/utils/countyGuideTopics.js';
import { computeCountyRankings, CountyMetricInput, CountyRankings } from '../src/utils/countyRankings.js';
import { StaticFooterLinks, FooterGuideSummary } from '../src/components/StaticFooterLinks';
import { modulePreloadTags } from './lib/routeChunkPreload.js';
import { renderArticleMarkdown } from '../src/utils/renderArticleMarkdown.js';

// Static HTML generator for county research pages, mirroring scripts/prerender-guides.tsx exactly
// -- same reasoning applies: the live app is a pure client-render SPA (createRoot, not
// hydrateRoot -- see src/main.tsx), so a non-JS crawler sees nothing without this. Only ever reads
// county_data rows where data_complete = true, the same enforcement point as the public API route
// in src/server/countiesApi.ts -- a county whose data isn't fully verified never gets a static
// file, exactly like it never gets an API response.

interface CountyRow {
  slug: string;
  county_name: string;
  state_name: string;
  state_abbrev: string;
  population: number | null;
  radon_zone: number | null;
  census_total_units: number | null;
  census_year_built_json: string;
  fema_risk_rating: string | null;
  fema_risk_score: number | null;
  fema_hazards_json: string;
  noaa_event_counts_json: string;
  noaa_years_covered: string | null;
  narrative_markdown: string;
  fetched_at: string;
}

// Matches src/server/countiesApi.ts's toApiShape() exactly -- this is what gets embedded as
// __PRELOADED_COUNTY__ and read back by CountyPageView.tsx, so it needs to be a real substitute
// for what GET /api/counties/:slug would have returned, not just whatever fields this script's own
// static render happens to use.
function toPreloadShape(row: CountyRow, rankings: CountyRankings) {
  return {
    slug: row.slug,
    countyName: row.county_name,
    stateName: row.state_name,
    stateAbbrev: row.state_abbrev,
    population: row.population,
    radonZone: row.radon_zone,
    censusTotalUnits: row.census_total_units,
    censusYearBuiltBuckets: JSON.parse(row.census_year_built_json || '{}'),
    femaRiskRating: row.fema_risk_rating,
    femaRiskScore: row.fema_risk_score,
    femaHazards: JSON.parse(row.fema_hazards_json || '{}'),
    noaaEventCounts: JSON.parse(row.noaa_event_counts_json || '{}'),
    noaaYearsCovered: row.noaa_years_covered,
    narrativeMarkdown: row.narrative_markdown || '',
    fetchedAt: row.fetched_at,
    rankings,
  };
}

const YEAR_BUILT_LABELS: Array<[string, string]> = [
  ['built2020OrLater', '2020 or later'], ['built2010to2019', '2010-2019'],
  ['built2000to2009', '2000-2009'], ['built1990to1999', '1990-1999'],
  ['built1980to1989', '1980-1989'], ['built1970to1979', '1970-1979'],
  ['built1960to1969', '1960-1969'], ['built1950to1959', '1950-1959'],
  ['built1940to1949', '1940-1949'], ['built1939OrEarlier', '1939 or earlier'],
];

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

function CountyStaticBody({
  row,
  rankings,
  permitGuide,
  footerGuides,
}: {
  row: CountyRow;
  rankings: CountyRankings;
  /** The "How to Check Building Permits" guide about THIS county, if one exists -- see
   *  findPermitGuideForCounty in countyGuideTopics.ts. Not every county has one. */
  permitGuide?: PermitGuideLink;
  footerGuides: FooterGuideSummary[];
}) {
  const yearBuilt = JSON.parse(row.census_year_built_json || '{}') as Record<string, number>;
  // All of them, not a top-N slice -- see the matching comment in CountyPageView.tsx. This also
  // fixes a real accuracy bug: totalStorms below sums this same array, so when it was capped at 8
  // event types, any county with more than 8 distinct storm types had its own total undercounted
  // in the static HTML (the client version summed the *unsliced* noaaEventEntries separately, so
  // it never had this bug -- only this static twin did).
  const hazards = Object.entries(JSON.parse(row.fema_hazards_json || '{}') as Record<string, { rating: string; score: number | null }>)
    .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0));
  const storms = Object.entries(JSON.parse(row.noaa_event_counts_json || '{}') as Record<string, number>)
    .sort((a, b) => b[1] - a[1]);
  const totalStorms = storms.reduce((sum, [, c]) => sum + c, 0);
  const oldHousingShare = row.census_total_units
    ? Math.round((((yearBuilt.built1939OrEarlier || 0) + (yearBuilt.built1940to1949 || 0) + (yearBuilt.built1950to1959 || 0) + (yearBuilt.built1960to1969 || 0)) / row.census_total_units) * 100)
    : null;
  const relatedGuides: GuideLink[] = pickGuidesForCounty({
    slug: row.slug,
    countyName: row.county_name,
    stateAbbrev: row.state_abbrev,
    radonZone: row.radon_zone,
    yearBuiltBuckets: yearBuilt,
    totalUnits: row.census_total_units,
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href="/counties/" className="hover:text-blue-600">County Research</a>
          <span>/</span>
          <span className="text-slate-900 font-bold">{row.county_name} County, {row.state_abbrev}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="text-xs text-slate-500">
            {row.state_name}{row.population ? ` -- population ${row.population.toLocaleString()}` : ''}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {row.county_name} County, {row.state_abbrev} Property Research
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real data from four public sources, not an internal estimate: the EPA's radon zone classification, Census housing-age records, FEMA's natural hazard risk index, and NOAA's recorded storm history for this county. Every figure below links to where it actually comes from.
          </p>
        </div>

        {(rankings.oldHousingShareRank || rankings.hazardRiskScoreRank || rankings.stormFrequencyRank) && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">How {row.county_name} County Compares</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ranked against all {rankings.oldHousingShareRank?.total || rankings.hazardRiskScoreRank?.total || rankings.stormFrequencyRank?.total} counties BeforeRegret currently covers -- same source data as the sections below, just compared side by side.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rankings.oldHousingShareRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{rankings.oldHousingShareRank.rank}<span className="text-xs font-medium text-slate-400"> / {rankings.oldHousingShareRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">Share of housing built before 1970</div>
                </div>
              )}
              {rankings.hazardRiskScoreRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{rankings.hazardRiskScoreRank.rank}<span className="text-xs font-medium text-slate-400"> / {rankings.hazardRiskScoreRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">FEMA overall hazard risk score</div>
                </div>
              )}
              {rankings.stormFrequencyRank && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xl font-extrabold text-slate-900">
                    #{rankings.stormFrequencyRank.rank}<span className="text-xs font-medium text-slate-400"> / {rankings.stormFrequencyRank.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">Recorded storm events{row.noaa_years_covered ? ` (${row.noaa_years_covered})` : ''}</div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              #1 is the highest of the group for that measure -- not necessarily a warning, and not a claim about any specific property in the county.
            </p>
          </section>
        )}

        {/* The county-specific analysis, above the data tables on purpose. Everything below this
            point is the same shell on all 100 pages -- which is exactly what left them 79%
            identical and "Discovered - currently not indexed" in Search Console. This is the part
            that differs county to county, so it leads. Renders nothing at all where a county has
            no narrative yet, which is what lets the pilot cover 5 counties without touching 95. */}
        {row.narrative_markdown?.trim() && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="prose-county space-y-3">
              {renderArticleMarkdown(row.narrative_markdown)}
            </div>
          </section>
        )}

        {(row.fema_risk_rating || row.radon_zone) && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Hazard Summary</h2>
            {/* Static twin of the same image in CountyPageView.tsx -- a non-JS crawler needs this
                in the actual HTML, not just the client-rendered version, or it never sees it at
                all. See src/utils/countyHazardSvg.ts and the /api/images/:filename route. */}
            <img
              src={`/api/images/${row.slug}-hazard-map.svg`}
              alt={`${row.county_name} County, ${row.state_abbrev} hazard summary: FEMA National Risk Index rated ${row.fema_risk_rating || 'not available'}${row.radon_zone ? `; EPA radon zone ${row.radon_zone} of 3` : ''}${storms.length > 0 ? `; most frequently recorded hazard is ${storms[0][0].toLowerCase()} (${storms[0][1]} events${row.noaa_years_covered ? `, ${row.noaa_years_covered}` : ''})` : ''}.`}
              width={640}
              height={240}
              loading="lazy"
              className="w-full max-w-2xl rounded-2xl border border-slate-100"
            />
          </section>
        )}

        {row.radon_zone && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Radon Risk</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{RADON_ZONE_TEXT[row.radon_zone]}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This is a county-wide prediction from geology and soil data, not a measurement of any specific home -- EPA recommends testing every home regardless of zone.{' '}
              <a href="/guides/negotiate-radon-mitigation-after-inspection/" className="text-blue-600 hover:underline font-medium">See our guide on negotiating radon mitigation after inspection</a>.
            </p>
            <a href="https://www.epa.gov/radon/epa-maps-radon-zones-and-supporting-documents-state" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
              Source: EPA Map of Radon Zones
            </a>
          </section>
        )}

        {row.census_total_units != null && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Housing Age</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {row.county_name} County has {row.census_total_units.toLocaleString()} housing units.
              {oldHousingShare != null && oldHousingShare > 0 && (
                <> About {oldHousingShare}% were built in 1969 or earlier -- old enough that knob-and-tube wiring, lead-based paint, and galvanized supply lines are all realistic possibilities worth checking for, not just a general inspection line item.</>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {YEAR_BUILT_LABELS.map(([key, label]) => (
                <div key={key} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-slate-500">{label}</div>
                  <div className="font-bold text-slate-900">{(yearBuilt[key] || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              <a href="/guides/knob-tube-wiring-have-be-replaced-before-closing/" className="text-blue-600 hover:underline font-medium">Does knob-and-tube wiring have to be replaced before closing?</a>
            </p>
            <a href="https://data.census.gov/table/ACSDT5Y2023.B25034" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
              Source: U.S. Census Bureau, ACS 5-Year Estimates, Table B25034
            </a>
          </section>
        )}

        {row.fema_risk_rating && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Natural Hazard Risk</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              FEMA rates {row.county_name} County's overall natural hazard risk as <strong>{row.fema_risk_rating}</strong>, relative to the rest of the country.
            </p>
            <div className="space-y-1.5">
              {hazards.map(([code, h]) => (
                <div key={code} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <span className="text-slate-700 font-medium">{FEMA_HAZARD_LABELS[code] || code}</span>
                  <span className="text-slate-900 font-bold">{h.rating}</span>
                </div>
              ))}
            </div>
            <a href="https://hazards.fema.gov/nri/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
              Source: FEMA National Risk Index
            </a>
          </section>
        )}

        {totalStorms > 0 && row.noaa_years_covered && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Recorded Storm History ({row.noaa_years_covered})</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              NOAA recorded {totalStorms.toLocaleString()} storm events in {row.county_name} County between {row.noaa_years_covered.replace('-', ' and ')}. This is actual event history, not a risk model -- the counts below are individually logged storms, not a prediction.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {storms.map(([type, count]) => (
                <div key={type} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-slate-500">{type}</div>
                  <div className="font-bold text-slate-900">{count.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <a href="https://www.ncei.noaa.gov/stormevents/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
              Source: NOAA National Centers for Environmental Information, Storm Events Database
            </a>
          </section>
        )}

        {/* Real-identity match, not a relevance guess -- rendered above the era-based list below
            because it's a stronger, more specific link: this guide is ABOUT this county, not
            merely relevant to its housing stock. See findPermitGuideForCounty. */}
        {permitGuide && (
          <a
            href={`/guides/${permitGuide.slug}/`}
            className="flex items-center justify-between gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-3xl p-6 sm:p-8 transition-colors"
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-1">
                Permit search guide for this county
              </span>
              <span className="block text-sm font-bold text-blue-950">{permitGuide.title} →</span>
            </span>
          </a>
        )}

        {relatedGuides.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Guides Relevant to This County's Housing Stock
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}/`}
                  className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800"
                >
                  <span>{g.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Get Your Free Property Report</h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
            BeforeRegret pulls live seismic hazard data, validates the address, and builds era- and county-specific inspection priorities and seller questions into one report -- with anything not yet independently verified clearly labeled, not guessed at.
          </p>
          <a href="/" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 font-bold text-sm sm:text-base rounded-xl">
            Get Your First Report Free
          </a>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This page reports what these four public agencies have published for {row.county_name} County as a whole -- it is not an assessment of any specific address or property, and does not replace a licensed home inspection, radon test, or insurance review for a specific home. Data last checked {new Date(row.fetched_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        </p>
      </div>

      <StaticFooterLinks guides={footerGuides} />
    </div>
  );
}

// FEMA short codes -> human labels. Third copy in this repo, and deliberately so: the same
// 18-entry table is already duplicated in countyHazardSvg.ts, whose own comment explains the
// reasoning (a small, stable static lookup is cheaper to keep in sync by hand than to restructure
// the import graph for a build script, a server module and a client component).
const HAZARD_LABELS: Record<string, string> = {
  AVLN: 'Avalanche', CFLD: 'Coastal Flooding', CWAV: 'Cold Wave', DRGT: 'Drought',
  ERQK: 'Earthquake', HAIL: 'Hail', HWAV: 'Heat Wave', HRCN: 'Hurricane',
  ISTM: 'Ice Storm', LNDS: 'Landslide', LTNG: 'Lightning', IFLD: 'Inland Flooding',
  SWND: 'Strong Wind', TRND: 'Tornado', TSUN: 'Tsunami', VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire', WNTW: 'Winter Weather',
};

// Same buckets and labels as pickDominantEraYear in countyEventsApi.ts. Not imported from there
// because that module pulls in the Gemini client and route registration, none of which a build
// script should drag in to compute one string.
const ERA_LABELS: Record<string, string> = {
  built2020OrLater: '2020 or later', built2010to2019: '2010s', built2000to2009: '2000s',
  built1990to1999: '1990s', built1980to1989: '1980s', built1970to1979: '1970s',
  built1960to1969: '1960s', built1950to1959: '1950s', built1940to1949: '1940s',
  built1939OrEarlier: 'before 1940',
};

const TITLE_MAX = 60;   // Google truncates around 60 -- same budget src/utils/pageTitle.ts uses.
const DESC_MAX = 158;   // Descriptions get cut around 160; leave a character of headroom.

function dominantEraLabel(bucketsJson: string): string | null {
  let buckets: Record<string, number>;
  try { buckets = JSON.parse(bucketsJson || '{}'); } catch { return null; }
  let bestKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of Object.entries(buckets)) {
    if (typeof count === 'number' && count > bestCount && key in ERA_LABELS) {
      bestCount = count;
      bestKey = key;
    }
  }
  return bestKey ? ERA_LABELS[bestKey] : null;
}

/**
 * Per-county title and meta description, built from that county's own data.
 *
 * WHY THIS REPLACED A TEMPLATE. Every one of the 100 county pages previously carried the identical
 * description -- "Real, sourced data for {County}, {ST}: EPA radon zone, Census housing-age
 * distribution, FEMA natural hazard risk, and recorded NOAA storm history" -- byte-for-byte the
 * same apart from the county name, and a title differing only in the same two words. Measured
 * against Search Console's page dimension (scripts/gsc-page-coverage.ts), 0 of those 100 pages had
 * ever earned a single impression. Near-identical metadata is not the only reason for that, but it
 * gives Google nothing to tell one page from another, and it is the part that was fixable here.
 *
 * Every value comes from that county's stored record -- FEMA National Risk Index rating, its
 * highest-scoring hazard, EPA radon zone, dominant Census housing decade. Nothing is invented, and
 * a county missing a field simply omits that clause.
 *
 * A hazard is only named when FEMA rates it Relatively High or Very High. The top-scoring hazard
 * of a genuinely low-risk county is still its top hazard, but putting "Avalanche" in the title of
 * a county FEMA rates Very Low for avalanche would advertise a risk the source does not support --
 * the same overclaiming the article rules forbid in body copy.
 *
 * Both title and description degrade rather than truncate: clauses are added only while the result
 * still fits, so a long county name loses the last detail instead of shipping a title Google cuts
 * mid-word. Verified across all 100 counties by scripts/check-county-meta.ts.
 */
export function buildCountyMeta(row: CountyRow): { title: string; description: string } {
  const place = `${row.county_name} County, ${row.state_abbrev}`;

  const hazards = Object.entries(
    JSON.parse(row.fema_hazards_json || '{}') as Record<string, { rating: string; score: number | null }>
  ).sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0));
  const top = hazards[0];
  const notableHazard =
    top && (top[1].rating === 'Very High' || top[1].rating === 'Relatively High')
      ? HAZARD_LABELS[top[0]] || null
      : null;

  const era = dominantEraLabel(row.census_year_built_json);
  const zone = row.radon_zone;

  // Richest title that fits, falling back a step at a time.
  const titleCandidates = [
    notableHazard && zone ? `${place} Radon Zone ${zone} & ${notableHazard} Risk` : null,
    notableHazard ? `${place} ${notableHazard} & Property Risk Data` : null,
    zone ? `${place} Property Risk: Radon Zone ${zone}` : null,
    era ? `${place} Property Research: ${era} Homes` : null,
    `${place} Property Research`,
  ].filter((t): t is string => Boolean(t));
  const title = titleCandidates.find((t) => t.length <= TITLE_MAX) ?? titleCandidates[titleCandidates.length - 1];

  // Description: add clauses while they still fit, so the least important detail drops first.
  const clauses = [
    row.fema_risk_rating ? `FEMA risk ${row.fema_risk_rating}` : null,
    notableHazard ? `top hazard ${notableHazard}` : null,
    zone ? `EPA Radon Zone ${zone}` : null,
    era ? `most homes built ${era}` : null,
  ].filter((c): c is string => Boolean(c));

  let description = `${place}: `;
  const kept: string[] = [];
  for (const clause of clauses) {
    const next = `${place}: ${[...kept, clause].join(', ')}.`;
    if (next.length <= DESC_MAX) kept.push(clause);
  }
  description = kept.length > 0
    ? `${place}: ${kept.join(', ')}.`
    : `Real, sourced property risk data for ${place}.`;

  // Only if there is genuine room left -- this sentence is the least important thing on the line.
  const withSources = `${description} Census, FEMA, EPA and NOAA sources.`;
  if (withSources.length <= DESC_MAX) description = withSources;

  return { title, description };
}

function buildJsonLd(row: CountyRow, canonicalUrl: string): Record<string, any>[] {
  const { title, description } = buildCountyMeta(row);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: 'https://www.beforeregret.com/hero-bg.jpg',
      dateModified: row.fetched_at,
      author: { '@type': 'Organization', name: 'BeforeRegret' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
        { '@type': 'ListItem', position: 2, name: 'County Research', item: 'https://www.beforeregret.com/counties/' },
        { '@type': 'ListItem', position: 3, name: `${row.county_name} County, ${row.state_abbrev}`, item: canonicalUrl },
      ],
    },
  ];
}

// Mirrors prerender-guides.tsx's GuidesIndexStaticBody / CountiesIndexView.tsx -- the hub every
// county page should be reachable from with one click, baked to real HTML at
// dist/counties/index.html so a crawler that doesn't run JS sees the same grouped list and the
// same real <a href> links to all 31 (now more) counties a browser would. Before this existed, 20
// of 31 county pages had zero inbound links anywhere on the site.
function CountiesIndexStaticBody({ rows, footerGuides }: { rows: CountyRow[]; footerGuides: FooterGuideSummary[] }) {
  const grouped = Array.from(
    rows
      .reduce((map, r) => {
        const list = map.get(r.state_abbrev) ?? [];
        list.push(r);
        map.set(r.state_abbrev, list);
        return map;
      }, new Map<string, CountyRow[]>())
      .entries()
  )
    .map(([state, list]) => ({
      state,
      counties: list.sort((a, b) => (b.population || 0) - (a.population || 0)),
    }))
    .sort((a, b) => b.counties.length - a.counties.length || a.state.localeCompare(b.state));

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <span className="text-slate-900 font-bold">County Research</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 inline-block px-2.5 py-1 rounded-full">
            County Research
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Every county we have complete data for
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Each page carries that county's real EPA radon zone, Census housing-age breakdown, FEMA
            natural hazard risk, and recorded NOAA storm history -- pulled from the source, not
            estimated. A county with incomplete data from any of the four never gets a page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          {grouped.map((group) => (
            <div key={group.state} className="space-y-2">
              <div className="flex items-baseline gap-2 pb-1.5 border-b border-slate-200">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">{group.state}</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {group.counties.length} {group.counties.length === 1 ? 'county' : 'counties'}
                </span>
              </div>
              <ul>
                {group.counties.map((c) => (
                  <li key={c.slug}>
                    <a
                      href={`/county/${c.slug}/`}
                      className="flex items-baseline justify-between gap-3 py-1.5 text-xs text-slate-700 hover:text-blue-700 font-medium"
                    >
                      <span>{c.county_name} County</span>
                      {c.population && (
                        <span className="text-[11px] text-slate-400 shrink-0">pop. {c.population.toLocaleString()}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <StaticFooterLinks guides={footerGuides} />
    </div>
  );
}

// Matches the same override in CountyPageView.tsx -- see that file's comment for why.
const TITLE_CASE_OVERRIDES: Record<string, string> = {
  DUPAGE: 'DuPage',
  DEKALB: 'DeKalb',
};

function titleCase(value: string): string {
  if (TITLE_CASE_OVERRIDES[value]) return TITLE_CASE_OVERRIDES[value];
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function run() {
  if (!isDbConfigured()) {
    console.log('[prerender-counties] DATABASE_URL not configured -- skipping.');
    return;
  }

  const distPath = path.join(process.cwd(), 'dist');
  const templatePath = path.join(distPath, 'shell.html');
  const fallbackTemplatePath = path.join(distPath, 'index.html');
  const actualTemplatePath = fs.existsSync(templatePath) ? templatePath : fallbackTemplatePath;
  if (!fs.existsSync(actualTemplatePath)) {
    console.error('[prerender-counties] No dist template found -- run `vite build` first.');
    process.exit(1);
  }
  // Note: reads dist/shell.html (the pristine empty-#root shell), NOT dist/index.html, since by
  // the time this script runs (after prerender-homepage.tsx in the build pipeline) dist/index.html
  // has already been overwritten with real homepage content.
  const template = fs.readFileSync(actualTemplatePath, 'utf8');

  const rows = (await withDb((sql) => sql`
    SELECT slug, county_name, state_name, state_abbrev, population, radon_zone,
           census_total_units, census_year_built_json, fema_risk_rating, fema_risk_score,
           fema_hazards_json, noaa_event_counts_json, noaa_years_covered, narrative_markdown, fetched_at
    FROM county_data WHERE data_complete = true
  `)) as unknown as CountyRow[];

  // This script never queried the articles table before -- it had no way to know a guide existed
  // at all, let alone link to one. Two things need it now: the direct permit-guide<->county
  // pairing (findPermitGuideForCounty, real-identity match, not a relevance guess) and the footer
  // nav's evergreen-guides list (see StaticFooterLinks.tsx for why that link needed a static twin
  // in the first place).
  const guideRows = (await withDb((sql) => sql`
    SELECT slug, title, article_type FROM articles WHERE status = 'published' ORDER BY published_at DESC
  `)) as unknown as Array<{ slug: string; title: string; article_type: string | null }>;
  // Every guide permitGuideCountySlug can ever match -- both the direct-slug guides and every
  // alias-table entry -- so filtering here is a correctness-free way to keep
  // findPermitGuideForCounty's search small rather than scanning all 140+ guides per county.
  // isPossiblePermitGuideSlug is the shared source of truth for "which slugs count" rather than a
  // second, independent prefix check here: a prior version of this filter only checked the
  // standard prefix directly, which silently excluded two alias-table guides whose slugs don't
  // start with it (confirmed live: their county-data card rendered on the guide page but never on
  // the matching county page, because this filter dropped them before findPermitGuideForCounty
  // ever ran).
  const permitGuides = guideRows.filter((g) => isPossiblePermitGuideSlug(g.slug));
  const footerGuides: FooterGuideSummary[] = guideRows
    .filter((g) => (g.article_type ?? 'guide') === 'guide')
    .slice(0, 4)
    .map((g) => ({ slug: g.slug, title: g.title }));

  // Every covered county's minimal fields, computed once outside the loop -- ranking one county
  // needs every county's numbers in hand, and re-deriving this per iteration would be the same
  // fixed cost 31+ times over for no benefit. See src/utils/countyRankings.ts.
  const rankingInputs: CountyMetricInput[] = rows.map((r) => ({
    slug: r.slug,
    censusTotalUnits: r.census_total_units,
    censusYearBuiltBuckets: JSON.parse(r.census_year_built_json || '{}'),
    femaRiskScore: r.fema_risk_score,
    noaaEventCounts: JSON.parse(r.noaa_event_counts_json || '{}'),
  }));

  let written = 0;
  const titleCasedRows: CountyRow[] = [];
  for (const rawRow of rows) {
    // county_name is stored in the all-caps form FEMA/NOAA/Census use for matching (e.g.
    // "TRAVIS") -- title-cased once here for the reader-facing page, matching
    // CountyPageView.tsx's client-side equivalent.
    const row: CountyRow = { ...rawRow, county_name: titleCase(rawRow.county_name) };
    titleCasedRows.push(row);
    const rankings = computeCountyRankings(row.slug, rankingInputs);
    const canonicalUrl = `https://www.beforeregret.com/county/${row.slug}/`;
    // Same helper the JSON-LD uses, so the <title> and the structured data's headline cannot drift
    // apart -- they were two independent template literals before, which is exactly how that kind
    // of mismatch gets introduced silently.
    const { title, description } = buildCountyMeta(row);
    const permitGuide = findPermitGuideForCounty(row.slug, permitGuides);
    const bodyHtml = renderToStaticMarkup(
      <CountyStaticBody row={row} rankings={rankings} permitGuide={permitGuide} footerGuides={footerGuides} />
    );
    const jsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(buildJsonLd(row, canonicalUrl))}</script>`;
    // Embedded verbatim so CountyPageView.tsx's mount effect can use it directly instead of
    // re-fetching over the network on first paint -- same fix, same reasoning, as
    // scripts/prerender-guides.tsx's __PRELOADED_GUIDE__. Built from rawRow (all-caps county
    // name), not the title-cased row above, since it needs to match what GET
    // /api/counties/:slug actually returns -- CountyPageView.tsx applies title-casing itself.
    const preloadScript = `<script type="application/json" id="__PRELOADED_COUNTY__">${escapeJsonForScriptTag(toPreloadShape(rawRow, rankings))}</script>`;

    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtmlAttr(description)}"`)
      .replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="index, follow"`)
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(title)}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(description)}"`)
      .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(title)}"`)
      .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(description)}"`)
      .replace('</head>', `${modulePreloadTags('county')}\n  ${jsonLdScript}\n${preloadScript}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

    const outDir = path.join(distPath, 'county', row.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    written++;
  }

  console.log(`[prerender-counties] Wrote static HTML for ${written} verified county page(s) to dist/county/<slug>/index.html`);

  // The hub page (dist/counties/index.html) -- see CountiesIndexView.tsx for the client-rendered
  // twin, and its own comment for why this page needed to exist at all.
  const indexCanonicalUrl = 'https://www.beforeregret.com/counties/';
  const indexTitle = 'County Property Research | BeforeRegret';
  const indexDescription = `Real EPA radon, Census housing-age, FEMA hazard, and NOAA storm data for ${titleCasedRows.length} US counties -- every figure sourced, nothing estimated.`;
  const indexBodyHtml = renderToStaticMarkup(<CountiesIndexStaticBody rows={titleCasedRows} footerGuides={footerGuides} />);
  const indexJsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
        { '@type': 'ListItem', position: 2, name: 'County Research', item: indexCanonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: titleCasedRows.map((r, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://www.beforeregret.com/county/${r.slug}/`,
        name: `${r.county_name} County, ${r.state_abbrev}`,
      })),
    },
  ];
  const indexJsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(indexJsonLd)}</script>`;
  const indexHtml = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(indexTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtmlAttr(indexDescription)}"`)
    .replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="index, follow"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(indexCanonicalUrl)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(indexCanonicalUrl)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(indexTitle)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(indexDescription)}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(indexTitle)}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(indexDescription)}"`)
    .replace('</head>', `${modulePreloadTags('countiesIndex')}\n  ${indexJsonLdScript}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${indexBodyHtml}</div>`);
  const indexOutDir = path.join(distPath, 'counties');
  fs.mkdirSync(indexOutDir, { recursive: true });
  fs.writeFileSync(path.join(indexOutDir, 'index.html'), indexHtml, 'utf8');
  console.log('[prerender-counties] Wrote static HTML for the counties hub to dist/counties/index.html');
}

// Only prerender when this file is executed directly, not when another module imports it.
// buildCountyMeta above is a pure function worth testing on its own, and
// scripts/check-county-meta.ts imports it to run every county through the real implementation
// rather than a copy. Without this guard that import would kick off a full prerender as a side
// effect -- which is exactly what happened on the first run, failing on a missing Vite manifest
// because no build had run yet.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  run().catch((err) => {
    console.error('[prerender-counties] Failed:', err);
    process.exit(1);
  });
}
