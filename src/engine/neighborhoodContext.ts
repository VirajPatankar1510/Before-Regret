import type { CanonicalFinding, FindingMetric } from '../types.js';

// BeforeRegret's second genuinely live, confirmed data source, after seismicHazard.ts.
//
// The point of this module is the difference between a statistic and a finding. "Travis County
// has 594,638 housing units" is a statistic a buyer could look up. "The typical home on this
// block was built in 2006, nine years newer than the county as a whole, and carries $1,202/month
// more in owner costs than the county median" is a finding -- it required resolving the address
// to a census tract, pulling two geographies, and comparing them. Everything below is computed
// from that comparison rather than reported raw.
//
// Two free, no-key Census endpoints do the work:
//  1. geocoding.geo.census.gov -- turns the already-verified lat/lon into a census tract
//     (~4,000 people, i.e. neighborhood scale rather than county scale).
//  2. api.census.gov ACS 5-year -- the actual housing variables, pulled for both that tract and
//     its parent county so every number can be stated as a comparison.
//
// DELIBERATELY EXCLUDED: ACS also publishes race, ethnicity, ancestry, language, religion, and
// family-composition tables at this same tract level. None of them appear here and none should.
// Steering a buyer toward or away from a neighborhood on those characteristics is precisely what
// the Fair Housing Act prohibits, and a property report that surfaced them would be doing exactly
// that regardless of intent. Every variable below describes the housing stock and the cost of
// living in it -- never who lives there.

const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';
const CENSUS_ACS_URL = 'https://api.census.gov/data/2023/acs/acs5';

interface TractIdentity {
  state: string;
  county: string;
  tract: string;
}

interface HousingProfile {
  medianHomeValue: number | null;
  medianYearBuilt: number | null;
  medianOwnerCostWithMortgage: number | null;
  medianGrossRent: number | null;
  totalOccupied: number | null;
  ownerOccupied: number | null;
  meanCommuteMinutes: number | null;
  heatingTotal: number | null;
  heatingGas: number | null;
  heatingElectric: number | null;
  heatingFuelOil: number | null;
}

// ACS variable codes. Kept as a named map rather than inline strings so the request and the
// parsing can't drift apart, and so each one's purpose is documented at the point of use.
const ACS_VARIABLES = {
  medianHomeValue: 'B25077_001E',
  medianYearBuilt: 'B25035_001E',
  medianOwnerCostWithMortgage: 'B25088_002E',
  medianGrossRent: 'B25064_001E',
  totalOccupied: 'B25003_001E',
  ownerOccupied: 'B25003_002E',
  aggregateTravelTime: 'B08013_001E',
  workersForTravelTime: 'B08303_001E',
  heatingTotal: 'B25040_001E',
  heatingGas: 'B25040_002E',
  heatingElectric: 'B25040_004E',
  heatingFuelOil: 'B25040_005E',
} as const;

// The Census geocoder is measurably slower than the USGS endpoint seismicHazard.ts talks to --
// observed around 4-5s for a single coordinate lookup, versus well under a second. 8s (the
// seismic module's default) clipped it on the first real test, so the budget here is set with
// genuine headroom for that variance rather than tuned to the happy path.
async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ACS uses large negative sentinels (e.g. -666666666) for suppressed/unavailable estimates rather
// than null. Treating those as real numbers would put a nonsense figure in a paid report, so
// anything negative or unparseable becomes null and is simply omitted downstream.
function parseAcsValue(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

async function resolveTract(lat: number, lon: number): Promise<TractIdentity | null> {
  const url = `${CENSUS_GEOCODER_URL}?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census+Tracts&format=json`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json();
  const tract = data?.result?.geographies?.['Census Tracts']?.[0];
  if (!tract?.STATE || !tract?.COUNTY || !tract?.TRACT) return null;
  return { state: tract.STATE, county: tract.COUNTY, tract: tract.TRACT };
}

async function fetchAcsProfile(geographyQuery: string): Promise<HousingProfile | null> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) return null;
  const fields = Object.values(ACS_VARIABLES).join(',');
  const url = `${CENSUS_ACS_URL}?get=${fields}&${geographyQuery}&key=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const rows = (await res.json()) as string[][];
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const header = rows[0];
  const values = rows[1];
  const read = (code: string) => {
    const idx = header.indexOf(code);
    return idx === -1 ? null : parseAcsValue(values[idx]);
  };

  const aggregateTravel = read(ACS_VARIABLES.aggregateTravelTime);
  const workers = read(ACS_VARIABLES.workersForTravelTime);

  return {
    medianHomeValue: read(ACS_VARIABLES.medianHomeValue),
    medianYearBuilt: read(ACS_VARIABLES.medianYearBuilt),
    medianOwnerCostWithMortgage: read(ACS_VARIABLES.medianOwnerCostWithMortgage),
    medianGrossRent: read(ACS_VARIABLES.medianGrossRent),
    totalOccupied: read(ACS_VARIABLES.totalOccupied),
    ownerOccupied: read(ACS_VARIABLES.ownerOccupied),
    meanCommuteMinutes: aggregateTravel && workers ? Math.round((aggregateTravel / workers) * 10) / 10 : null,
    heatingTotal: read(ACS_VARIABLES.heatingTotal),
    heatingGas: read(ACS_VARIABLES.heatingGas),
    heatingElectric: read(ACS_VARIABLES.heatingElectric),
    heatingFuelOil: read(ACS_VARIABLES.heatingFuelOil),
  };
}

function pct(part: number, whole: number): number {
  return Math.round((part / whole) * 100);
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

// Builds the heating-system sentence, which is the one part of this finding that changes what a
// buyer should actually have inspected rather than just contextualizing cost. Returns null when
// no fuel type is clearly dominant, rather than reporting a muddled split as if it were a signal.
function describeHeating(tract: HousingProfile): { metricValue: string; nextStep: string } | null {
  const { heatingTotal, heatingGas, heatingElectric, heatingFuelOil } = tract;
  if (!heatingTotal) return null;

  const oilShare = heatingFuelOil ? pct(heatingFuelOil, heatingTotal) : 0;
  const gasShare = heatingGas ? pct(heatingGas, heatingTotal) : 0;
  const electricShare = heatingElectric ? pct(heatingElectric, heatingTotal) : 0;

  // Fuel oil first regardless of share -- even a modest share is worth flagging, because a buried
  // oil tank is one of the few genuinely expensive surprises that a standard inspection routinely
  // does not cover.
  if (oilShare >= 10) {
    return {
      metricValue: `${oilShare}% fuel oil`,
      nextStep: 'Ask the seller directly whether the property has, or ever had, an oil storage tank -- above ground or buried. Buried tanks are a common and expensive remediation surprise, and a standard home inspection generally does not look for them.',
    };
  }
  if (electricShare >= 60) {
    return {
      metricValue: `${electricShare}% electric`,
      nextStep: 'A heat pump or electric furnace is the more likely setup here than a gas furnace. If this home has a heat pump, ask its age -- they typically run 12-16 years, shorter than a gas furnace, and replacement is a four-figure cost. Also ask what the highest winter electricity bill has been.',
    };
  }
  if (gasShare >= 60) {
    return {
      metricValue: `${gasShare}% natural gas`,
      nextStep: 'Ask the age of the furnace and when the flue and gas lines were last inspected. On older gas systems the flue liner and heat exchanger are the two items worth confirming specifically, since a cracked heat exchanger is both a safety issue and a full-replacement trigger.',
    };
  }
  return null;
}

/**
 * Checks: neighborhood-level (census tract) housing context for the given coordinate, expressed
 * as a comparison against the surrounding county.
 * Calls: geocoding.geo.census.gov (no key) and api.census.gov ACS 5-year (CENSUS_API_KEY).
 * On failure: returns null -- never throws, never fabricates a value, same contract as
 * fetchSeismicHazardFinding. The caller falls back to omitting the finding entirely.
 */
export async function fetchNeighborhoodContextFinding(
  lat: number,
  lon: number,
  subjectYearBuilt?: number | null
): Promise<CanonicalFinding | null> {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  if (!process.env.CENSUS_API_KEY) return null;

  try {
    const tractId = await resolveTract(lat, lon);
    if (!tractId) return null;

    const [tract, county] = await Promise.all([
      fetchAcsProfile(`for=tract:${tractId.tract}&in=state:${tractId.state}%20county:${tractId.county}`),
      fetchAcsProfile(`for=county:${tractId.county}&in=state:${tractId.state}`),
    ]);
    if (!tract || !county) return null;

    // Output is split three ways rather than accumulated into one prose blob:
    //   metrics    -- the scannable number grid (label / value / comparison)
    //   headline   -- the single most decision-relevant sentence, used as the card's lead
    //   nextSteps  -- only the genuinely actionable consequences
    // Previously all seven comparisons were joined into a ~130-word paragraph, then concatenated
    // again with whyItMatters and suggestedNextStep at render time, producing a wall of text on a
    // report someone paid for. Same data, same honesty, structured so it can be skimmed.
    const metrics: FindingMetric[] = [];
    const nextSteps: string[] = [];
    let headline = '';

    if (tract.medianYearBuilt && county.medianYearBuilt) {
      const delta = tract.medianYearBuilt - county.medianYearBuilt;
      metrics.push({
        label: 'Typical home age here',
        value: `Built ~${tract.medianYearBuilt}`,
        comparison:
          Math.abs(delta) >= 5
            ? `${Math.abs(delta)} yrs ${delta > 0 ? 'newer' : 'older'} than county (${county.medianYearBuilt})`
            : `In line with county (${county.medianYearBuilt})`,
      });

      // The most decision-relevant comparison available here: how this specific home sits against
      // its own block, which reframes every age-driven inspection priority in the rest of the report.
      //
      // ALWAYS shown when a year is given, not just past a threshold. This used to only render a
      // tile when |subjectDelta| >= 15 -- below that it rendered nothing at all, which reads as a
      // bug rather than a non-finding: a user who enters "1993" and then sees only "Typical home
      // age here: Built ~1994" (the tract median, from real Census data, one year off) with no
      // tile confirming their own entry was even received has no way to tell "these are two
      // independent numbers that happen to be close" from "the report ignored what I typed." A
      // close match is itself a real, reassuring finding -- it just doesn't warrant the stronger
      // "ask about age-adjusted comps" advice a large gap does.
      if (subjectYearBuilt && Number.isFinite(subjectYearBuilt)) {
        const subjectDelta = tract.medianYearBuilt - subjectYearBuilt;
        if (subjectDelta >= 15) {
          metrics.push({
            label: 'This home vs. its block',
            value: `Built ${subjectYearBuilt}`,
            comparison: `${subjectDelta} yrs older than typical here`,
          });
          headline = `This home was built in ${subjectYearBuilt} -- about ${subjectDelta} years older than the typical home on its own block.`;
          nextSteps.push(
            'Because this home is materially older than its neighbors, comparable sales nearby may be newer properties. Ask your agent whether the comps used were age-adjusted, and expect original-era systems here even where surrounding homes have been rebuilt.'
          );
        } else if (subjectDelta <= -15) {
          metrics.push({
            label: 'This home vs. its block',
            value: `Built ${subjectYearBuilt}`,
            comparison: `${Math.abs(subjectDelta)} yrs newer than typical here`,
          });
          headline = `This home was built in ${subjectYearBuilt} -- about ${Math.abs(subjectDelta)} years newer than the typical home on its own block.`;
        } else {
          metrics.push({
            label: 'This home vs. its block',
            value: `Built ${subjectYearBuilt}`,
            comparison: 'In line with typical homes here',
          });
        }
      }
    }

    if (tract.medianOwnerCostWithMortgage && county.medianOwnerCostWithMortgage) {
      const delta = tract.medianOwnerCostWithMortgage - county.medianOwnerCostWithMortgage;
      metrics.push({
        label: 'Median monthly cost to own',
        value: `${money(tract.medianOwnerCostWithMortgage)}/mo`,
        comparison: `${money(Math.abs(delta))} ${delta > 0 ? 'above' : 'below'} county median`,
      });
      if (!headline) {
        headline = `Median monthly ownership cost in this neighborhood is ${money(tract.medianOwnerCostWithMortgage)} -- ${money(Math.abs(delta))} ${delta > 0 ? 'above' : 'below'} the county median.`;
      }
      nextSteps.push(
        `Budget against the ${money(tract.medianOwnerCostWithMortgage)} all-in figure rather than a mortgage quote on its own -- it includes taxes, insurance and utilities, not just the loan payment. Ask the seller for twelve months of actual tax and insurance bills for this specific property.`
      );
    }

    if (tract.medianHomeValue && county.medianHomeValue) {
      const ratio = Math.round((tract.medianHomeValue / county.medianHomeValue) * 100) - 100;
      metrics.push({
        label: 'Median home value',
        value: money(tract.medianHomeValue),
        comparison:
          Math.abs(ratio) >= 5
            ? `${Math.abs(ratio)}% ${ratio > 0 ? 'above' : 'below'} county median`
            : 'In line with county median',
      });
    }

    if (tract.ownerOccupied && tract.totalOccupied) {
      const share = pct(tract.ownerOccupied, tract.totalOccupied);
      metrics.push({
        label: 'Owner-occupied',
        value: `${share}%`,
        comparison: `${100 - share}% rented`,
      });
    }

    if (tract.meanCommuteMinutes && county.meanCommuteMinutes) {
      const delta = Math.round((tract.meanCommuteMinutes - county.meanCommuteMinutes) * 10) / 10;
      metrics.push({
        label: 'Mean commute',
        value: `${tract.meanCommuteMinutes} min`,
        comparison:
          Math.abs(delta) >= 2
            ? `${Math.abs(delta)} min ${delta > 0 ? 'longer' : 'shorter'} than county`
            : 'About the county average',
      });
    }

    const heating = describeHeating(tract);
    if (heating) {
      metrics.push({ label: 'Primary heating fuel', value: heating.metricValue, comparison: 'of homes in this tract' });
      nextSteps.push(heating.nextStep);
    }

    // A finding with nothing computed in it isn't worth showing. Better to omit the section than
    // to print a header over an empty observation.
    if (metrics.length < 2) return null;
    if (!headline) headline = 'Census figures for this address\'s immediate neighborhood, compared against the surrounding county.';

    return {
      id: 'f_neighborhood_context',
      subject: 'Neighborhood Profile (U.S. Census)',
      category: 'Neighborhood',
      status: 'CONFIRMED RECORD',
      summaryText: headline,
      whatWeFound: headline,
      metrics,
      whyItMatters:
        'These figures cover the census tract this address sits in -- roughly a neighborhood, not the whole county -- so they track the immediate area much more closely than county-wide numbers. Housing age drives which defects are plausible here, and the monthly ownership cost is the figure buyers most often underestimate when budgeting from a mortgage quote alone.',
      suggestedNextStep:
        nextSteps.length > 0
          ? nextSteps.join(' ')
          : 'Use these figures as the baseline when judging whether this property is priced and configured typically for its immediate area.',
      sourceAgency: 'U.S. Census Bureau, American Community Survey (5-Year Estimates)',
      lastUpdated: 'ACS 2023 5-year estimates (live query)',
    };
  } catch (err) {
    console.warn('[Neighborhood Context] Census lookup failed:', err);
    return null;
  }
}
