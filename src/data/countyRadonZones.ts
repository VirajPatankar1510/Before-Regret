// EPA Map of Radon Zones -- a static county-by-county classification developed by EPA in 1993
// from indoor radon measurements, geology, aerial radioactivity, soil parameters, and foundation
// types. It hasn't been revised since; there's no live API for it. Source of truth is EPA's own
// combined national table (the "Text Version" xls linked from
// https://www.epa.gov/radon/epa-map-radon-zones), not the per-state PDF maps -- those are the
// same underlying data rendered as a color map, which turned out unreliable to read visually:
// cross-checking every entry below against this table caught one visual misread (a county that
// looked Zone 2 on the map PDF is actually Zone 3 per EPA's own table) and resolved one county
// whose map color was too ambiguous to call by eye at all. Per-state PDFs remain a valid citation
// for a specific county; the table is just the more precise source when both are available.
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
  // Verified against EPA's national radon-zones table (see file header) -- first batch beyond
  // Travis, one county per major metro, chosen for population + geographic spread.
  { stateAbbrev: 'TX', countyName: 'TRAVIS', zone: 3 },
  { stateAbbrev: 'TX', countyName: 'HARRIS', zone: 3 },
  { stateAbbrev: 'TX', countyName: 'DALLAS', zone: 3 },
  { stateAbbrev: 'TX', countyName: 'BEXAR', zone: 3 },
  { stateAbbrev: 'TX', countyName: 'TARRANT', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'LOS ANGELES', zone: 2 },
  { stateAbbrev: 'CA', countyName: 'SAN DIEGO', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'ORANGE', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'SANTA CLARA', zone: 2 },
  { stateAbbrev: 'AZ', countyName: 'MARICOPA', zone: 2 },
  { stateAbbrev: 'IL', countyName: 'COOK', zone: 2 },
  { stateAbbrev: 'WA', countyName: 'KING', zone: 3 },
  { stateAbbrev: 'FL', countyName: 'MIAMI-DADE', zone: 2 },
  { stateAbbrev: 'NV', countyName: 'CLARK', zone: 3 },
  { stateAbbrev: 'GA', countyName: 'FULTON', zone: 1 },
  { stateAbbrev: 'MI', countyName: 'WAYNE', zone: 3 },

  // Second batch beyond the first 16 -- next 15 largest US counties by population not already
  // covered above, per Census Bureau 2025 vintage estimates. Verified against the same EPA table.
  { stateAbbrev: 'NY', countyName: 'KINGS', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'RIVERSIDE', zone: 2 },
  { stateAbbrev: 'NY', countyName: 'QUEENS', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'SAN BERNARDINO', zone: 2 },
  { stateAbbrev: 'FL', countyName: 'BROWARD', zone: 3 },
  { stateAbbrev: 'MA', countyName: 'MIDDLESEX', zone: 1 },
  { stateAbbrev: 'NY', countyName: 'NEW YORK', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'ALAMEDA', zone: 2 },
  { stateAbbrev: 'CA', countyName: 'SACRAMENTO', zone: 3 },
  { stateAbbrev: 'FL', countyName: 'PALM BEACH', zone: 3 },
  { stateAbbrev: 'PA', countyName: 'PHILADELPHIA', zone: 3 },
  { stateAbbrev: 'FL', countyName: 'HILLSBOROUGH', zone: 2 },
  { stateAbbrev: 'NY', countyName: 'SUFFOLK', zone: 3 },
  { stateAbbrev: 'FL', countyName: 'ORANGE', zone: 3 },
  { stateAbbrev: 'NY', countyName: 'BRONX', zone: 3 },

  // Third batch -- next 29 largest US counties not already covered above, per the same Census
  // Bureau population ranking. Verified against the same EPA table (see file header), pulled and
  // cross-checked against both the 'un-filtered-raw-data' and 'filtered-raw data' sheets of EPA's
  // own spreadsheet -- both agreed on every value below.
  { stateAbbrev: 'NY', countyName: 'NASSAU', zone: 3 },
  { stateAbbrev: 'OH', countyName: 'FRANKLIN', zone: 1 },
  { stateAbbrev: 'TX', countyName: 'COLLIN', zone: 3 },
  { stateAbbrev: 'MI', countyName: 'OAKLAND', zone: 2 },
  { stateAbbrev: 'MN', countyName: 'HENNEPIN', zone: 1 },
  { stateAbbrev: 'NC', countyName: 'WAKE', zone: 2 },
  { stateAbbrev: 'NC', countyName: 'MECKLENBURG', zone: 3 },
  { stateAbbrev: 'OH', countyName: 'CUYAHOGA', zone: 2 },
  { stateAbbrev: 'PA', countyName: 'ALLEGHENY', zone: 1 },
  { stateAbbrev: 'UT', countyName: 'SALT LAKE', zone: 2 },
  { stateAbbrev: 'CA', countyName: 'CONTRA COSTA', zone: 2 },
  { stateAbbrev: 'VA', countyName: 'FAIRFAX', zone: 1 },
  { stateAbbrev: 'AZ', countyName: 'PIMA', zone: 2 },
  { stateAbbrev: 'MD', countyName: 'MONTGOMERY', zone: 1 },
  { stateAbbrev: 'TX', countyName: 'DENTON', zone: 3 },
  { stateAbbrev: 'FL', countyName: 'DUVAL', zone: 3 },
  { stateAbbrev: 'CA', countyName: 'FRESNO', zone: 2 },
  { stateAbbrev: 'GA', countyName: 'GWINNETT', zone: 1 },
  { stateAbbrev: 'NY', countyName: 'WESTCHESTER', zone: 3 },
  { stateAbbrev: 'IN', countyName: 'MARION', zone: 1 },
  { stateAbbrev: 'MO', countyName: 'ST. LOUIS', zone: 2 },
  { stateAbbrev: 'HI', countyName: 'HONOLULU', zone: 3 },
  { stateAbbrev: 'NJ', countyName: 'BERGEN', zone: 2 },
  { stateAbbrev: 'TX', countyName: 'FORT BEND', zone: 3 },
  { stateAbbrev: 'MD', countyName: "PRINCE GEORGE'S", zone: 2 },
  { stateAbbrev: 'FL', countyName: 'PINELLAS', zone: 3 },
  { stateAbbrev: 'NY', countyName: 'ERIE', zone: 1 },
  { stateAbbrev: 'WA', countyName: 'PIERCE', zone: 3 },
  { stateAbbrev: 'IL', countyName: 'DUPAGE', zone: 2 },
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
