// EPA Map of Radon Zones -- a static county-by-county classification developed by EPA in 1993
// from indoor radon measurements, geology, aerial radioactivity, soil parameters, and foundation
// types. It hasn't been revised since; there's no live API for it, just PDF maps published per
// state at https://www.epa.gov/radon/epa-maps-radon-zones-and-supporting-documents-state. Each
// entry below was read directly off EPA's own state PDF, not a third-party summary.
//
// Zone 1 = highest potential (predicted average indoor screening level > 4 pCi/L)
// Zone 2 = moderate potential (2-4 pCi/L)
// Zone 3 = low potential (< 2 pCi/L)
//
// This is deliberately a small, hand-verified table rather than a bulk-imported one -- adding a
// county here is a real verification step against EPA's own document, not a bulk copy from a
// secondary source. A county with no entry here is simply not eligible for a county research
// page yet (see scripts/fetch-county-data.ts's "no data, no page" gate); it never silently
// defaults to a guessed zone.
export interface CountyRadonZone {
  stateAbbrev: string;
  countyName: string; // Uppercase, matching Census/FEMA/NOAA county-name conventions
  zone: 1 | 2 | 3;
}

export const COUNTY_RADON_ZONES: CountyRadonZone[] = [
  // Verified against https://www.epa.gov/sites/default/files/2014-08/documents/texas.pdf
  { stateAbbrev: 'TX', countyName: 'TRAVIS', zone: 3 },
];

export function findCountyRadonZone(stateAbbrev: string, countyName: string): CountyRadonZone | undefined {
  const normalizedCounty = countyName.trim().toUpperCase();
  const normalizedState = stateAbbrev.trim().toUpperCase();
  return COUNTY_RADON_ZONES.find(
    (c) => c.stateAbbrev === normalizedState && c.countyName === normalizedCounty
  );
}

export const RADON_ZONE_DESCRIPTIONS: Record<1 | 2 | 3, string> = {
  1: 'Highest potential -- EPA predicts an average indoor radon screening level greater than 4 pCi/L for this county.',
  2: 'Moderate potential -- EPA predicts an average indoor radon screening level between 2 and 4 pCi/L for this county.',
  3: 'Low potential -- EPA predicts an average indoor radon screening level below 2 pCi/L for this county.',
};
