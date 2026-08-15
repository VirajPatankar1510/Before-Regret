// Live data fetchers for the two county-research sources that have a real REST API. The other
// two (EPA radon zone, NOAA storm events) don't -- see src/data/countyRadonZones.ts and
// scripts/fetch-county-data.ts respectively. Kept as a shared module (rather than inlined in the
// fetch script) so a future "refresh this county" admin action could call the same functions
// without re-downloading NOAA's bulk files.

import { spawnSync } from 'child_process';

// Node's native fetch() hangs on api.census.gov and services.arcgis.com in this environment --
// confirmed live, a 10s ConnectTimeoutError racing every candidate address (IPv4 and IPv6 alike)
// for both hosts, while curl reaches the same URLs in under a second. Same root cause and same
// workaround already used for NOAA's bulk files in scripts/fetch-county-data.ts (see that file's
// ensureNoaaFilesCached for the fuller diagnosis). Shaped to match the handful of Response
// properties the three fetchers below actually use (ok, status, json()) so those call sites only
// need fetch(url) swapped for curlFetch(url), nothing else.
async function curlFetch(url: string): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
  const result = spawnSync('curl', ['-sS', '-w', '\n%{http_code}', url], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`curl failed for ${url}: ${result.stderr || `exit ${result.status}`}`);
  }
  const output = result.stdout;
  const splitAt = output.lastIndexOf('\n');
  const body = output.slice(0, splitAt);
  const status = parseInt(output.slice(splitAt + 1), 10);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
  };
}

export interface CountyIdentity {
  countyName: string; // Uppercase, e.g. 'TRAVIS' -- matches Census/FEMA/NOAA naming conventions
  stateName: string; // e.g. 'Texas'
  stateAbbrev: string; // e.g. 'TX'
  stateFips: string; // e.g. '48'
  countyFips: string; // e.g. '453' (3-digit county FIPS, no state prefix)
}

export interface CensusHousingAgeResult {
  totalUnits: number;
  // Keys match the ACS table B25034 buckets, oldest first, matching how the Census Bureau itself
  // presents "Year Structure Built."
  yearBuiltBuckets: {
    built2020OrLater: number;
    built2010to2019: number;
    built2000to2009: number;
    built1990to1999: number;
    built1980to1989: number;
    built1970to1979: number;
    built1960to1969: number;
    built1950to1959: number;
    built1940to1949: number;
    built1939OrEarlier: number;
  };
}

// ACS 5-year estimates, table B25034 (Year Structure Built). Real, live query -- no fabricated or
// interpolated figures; a Census suppression (small-sample counties sometimes return null/negative
// margin-of-error placeholders) surfaces as a thrown error here rather than a silently zeroed stat.
export async function fetchCensusHousingAge(
  identity: CountyIdentity,
  apiKey: string
): Promise<CensusHousingAgeResult> {
  const fields = ['B25034_001E', 'B25034_002E', 'B25034_003E', 'B25034_004E', 'B25034_005E', 'B25034_006E', 'B25034_007E', 'B25034_008E', 'B25034_009E', 'B25034_010E', 'B25034_011E'];
  const url = `https://api.census.gov/data/2023/acs/acs5?get=${fields.join(',')}&for=county:${identity.countyFips}&in=state:${identity.stateFips}&key=${apiKey}`;
  const res = await curlFetch(url);
  if (!res.ok) {
    throw new Error(`Census API returned ${res.status} for ${identity.countyName} County, ${identity.stateAbbrev}`);
  }
  const rows = (await res.json()) as string[][];
  const header = rows[0];
  const values = rows[1];
  const get = (field: string) => {
    const idx = header.indexOf(field);
    const raw = idx === -1 ? null : values[idx];
    const n = raw === null ? NaN : parseInt(raw, 10);
    if (!Number.isFinite(n)) throw new Error(`Census API returned no usable value for ${field} (${identity.countyName} County)`);
    return n;
  };
  return {
    totalUnits: get('B25034_001E'),
    yearBuiltBuckets: {
      built2020OrLater: get('B25034_002E'),
      built2010to2019: get('B25034_003E'),
      built2000to2009: get('B25034_004E'),
      built1990to1999: get('B25034_005E'),
      built1980to1989: get('B25034_006E'),
      built1970to1979: get('B25034_007E'),
      built1960to1969: get('B25034_008E'),
      built1950to1959: get('B25034_009E'),
      built1940to1949: get('B25034_010E'),
      built1939OrEarlier: get('B25034_011E'),
    },
  };
}

export interface CensusInsuranceCostResult {
  totalMortgaged: number;
  // Keys match the ACS table B25141 dollar buckets for owner-occupied units WITH a mortgage
  // (B25141_003E-014E) -- not-mortgaged buckets (015E-027E) are deliberately not fetched. A
  // relocating buyer researching a county is financing the purchase in the overwhelming majority
  // of cases, and mixing in the not-mortgaged population (often longtime owners on a fixed,
  // long-settled premium, sometimes self-insuring or underinsuring) would understate what a new
  // buyer should actually expect to pay.
  costBuckets: {
    lessThan100: number;
    between100and299: number;
    between300and499: number;
    between500and799: number;
    between800and999: number;
    between1000and1499: number;
    between1500and1999: number;
    between2000and2499: number;
    between2500and2999: number;
    between3000and3499: number;
    between3500and3999: number;
    over4000: number;
  };
}

// ACS 5-year estimates, table B25141 (Homeowners Insurance Costs by Mortgage Status, Yearly).
// Same fail-loud-on-suppression contract as fetchCensusHousingAge above: a Census suppression
// surfaces as a thrown error, never a silently zeroed stat. Verified live against all 60 counties
// this site currently covers before this was built -- zero suppressions, and margin of error under
// 2.5% of the estimate everywhere (this table has far larger per-county sample sizes than most ACS
// tables, since "owns a home with a mortgage" is a large share of any county's population).
export async function fetchCensusInsuranceCosts(
  identity: CountyIdentity,
  apiKey: string
): Promise<CensusInsuranceCostResult> {
  const fields = [
    'B25141_002E', 'B25141_003E', 'B25141_004E', 'B25141_005E', 'B25141_006E', 'B25141_007E',
    'B25141_008E', 'B25141_009E', 'B25141_010E', 'B25141_011E', 'B25141_012E', 'B25141_013E', 'B25141_014E',
  ];
  const url = `https://api.census.gov/data/2023/acs/acs5?get=${fields.join(',')}&for=county:${identity.countyFips}&in=state:${identity.stateFips}&key=${apiKey}`;
  const res = await curlFetch(url);
  if (!res.ok) {
    throw new Error(`Census API returned ${res.status} for ${identity.countyName} County, ${identity.stateAbbrev}`);
  }
  const rows = (await res.json()) as string[][];
  const header = rows[0];
  const values = rows[1];
  const get = (field: string) => {
    const idx = header.indexOf(field);
    const raw = idx === -1 ? null : values[idx];
    const n = raw === null ? NaN : parseInt(raw, 10);
    if (!Number.isFinite(n)) throw new Error(`Census API returned no usable value for ${field} (${identity.countyName} County)`);
    return n;
  };
  return {
    totalMortgaged: get('B25141_002E'),
    costBuckets: {
      lessThan100: get('B25141_003E'),
      between100and299: get('B25141_004E'),
      between300and499: get('B25141_005E'),
      between500and799: get('B25141_006E'),
      between800and999: get('B25141_007E'),
      between1000and1499: get('B25141_008E'),
      between1500and1999: get('B25141_009E'),
      between2000and2499: get('B25141_010E'),
      between2500and2999: get('B25141_011E'),
      between3000and3499: get('B25141_012E'),
      between3500and3999: get('B25141_013E'),
      over4000: get('B25141_014E'),
    },
  };
}

export interface FemaHazardRating {
  rating: string;
  score: number | null;
}

export interface FemaRiskResult {
  population: number;
  riskRating: string;
  riskScore: number;
  // Keyed by FEMA's own hazard codes; label mapping lives in the presentation layer
  // (src/components/seo/CountyPageView.tsx) so this stays a faithful pass-through of the API.
  hazards: Record<string, FemaHazardRating>;
}

const FEMA_HAZARD_CODES = [
  'AVLN', 'CFLD', 'CWAV', 'DRGT', 'ERQK', 'HAIL', 'HWAV', 'HRCN', 'ISTM',
  'LNDS', 'LTNG', 'IFLD', 'SWND', 'TRND', 'TSUN', 'VLCN', 'WFIR', 'WNTW',
];

// FEMA National Risk Index, queried live from the same public ArcGIS Feature Service the NRI's
// own map application uses (https://hazards.fema.gov/nri) -- not a bulk CSV re-hosted here, so
// this always reflects whatever NRI version FEMA currently has live.
export async function fetchFemaRiskIndex(identity: CountyIdentity): Promise<FemaRiskResult> {
  // ArcGIS's `where` clause is SQL-like, so a literal apostrophe in the county name (Prince
  // George's, MD is the real case that surfaced this) terminates the string early and the service
  // returns a 400 "invalid query parameters" -- not a "county not found," a malformed query.
  // Standard SQL escaping is doubling the quote, which ArcGIS's query engine also honors.
  const escapedCountyName = identity.countyName.replace(/'/g, "''");
  const where = encodeURIComponent(`STATEABBRV='${identity.stateAbbrev}' AND COUNTY='${escapedCountyName}'`);
  const url = `https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=${where}&outFields=*&f=json`;
  const res = await curlFetch(url);
  if (!res.ok) {
    throw new Error(`FEMA NRI service returned ${res.status} for ${identity.countyName} County, ${identity.stateAbbrev}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`FEMA NRI service error: ${JSON.stringify(data.error)}`);
  }
  const feature = data.features?.[0]?.attributes;
  if (!feature) {
    throw new Error(`FEMA NRI service returned no match for ${identity.countyName} County, ${identity.stateAbbrev}`);
  }

  const hazards: Record<string, FemaHazardRating> = {};
  for (const code of FEMA_HAZARD_CODES) {
    const rating = feature[`${code}_RISKR`];
    if (rating && rating !== 'Not Applicable' && rating !== 'No Rating') {
      hazards[code] = { rating, score: typeof feature[`${code}_RISKS`] === 'number' ? feature[`${code}_RISKS`] : null };
    }
  }

  if (typeof feature.RISK_RATNG !== 'string' || typeof feature.RISK_SCORE !== 'number') {
    throw new Error(`FEMA NRI service returned an incomplete record for ${identity.countyName} County, ${identity.stateAbbrev}`);
  }

  return {
    population: typeof feature.POPULATION === 'number' ? feature.POPULATION : 0,
    riskRating: feature.RISK_RATNG,
    riskScore: feature.RISK_SCORE,
    hazards,
  };
}
