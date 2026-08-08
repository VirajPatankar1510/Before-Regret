// Live data fetchers for the two county-research sources that have a real REST API. The other
// two (EPA radon zone, NOAA storm events) don't -- see src/data/countyRadonZones.ts and
// scripts/fetch-county-data.ts respectively. Kept as a shared module (rather than inlined in the
// fetch script) so a future "refresh this county" admin action could call the same functions
// without re-downloading NOAA's bulk files.

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
  const res = await fetch(url);
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
  const where = encodeURIComponent(`STATEABBRV='${identity.stateAbbrev}' AND COUNTY='${identity.countyName}'`);
  const url = `https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=${where}&outFields=*&f=json`;
  const res = await fetch(url);
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
