import type { CountyIdentity } from '../server/countyDataFetcher.js';

// The counties BeforeRegret has a real, complete county_data row for (see
// scripts/fetch-county-data.ts, which populates county_data from this same list -- FIPS codes
// verified against the Census Bureau's national_county2020.txt reference file). Shared here,
// rather than left inline in the fetch script, so anything that needs to match an external event
// (a FEMA disaster declaration, eventually other federal feeds) against "a county we actually
// cover" has one real list to check against instead of guessing from the county_data table's
// text-only county_name/state_abbrev columns, which carry no FIPS code to match on.
export const COVERED_COUNTIES: Array<CountyIdentity & { slug: string }> = [
  { slug: 'travis-county-tx', countyName: 'TRAVIS', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '453' },
  { slug: 'harris-county-tx', countyName: 'HARRIS', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '201' },
  { slug: 'dallas-county-tx', countyName: 'DALLAS', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '113' },
  { slug: 'bexar-county-tx', countyName: 'BEXAR', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '029' },
  { slug: 'tarrant-county-tx', countyName: 'TARRANT', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '439' },
  { slug: 'los-angeles-county-ca', countyName: 'LOS ANGELES', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '037' },
  { slug: 'san-diego-county-ca', countyName: 'SAN DIEGO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '073' },
  { slug: 'orange-county-ca', countyName: 'ORANGE', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '059' },
  { slug: 'santa-clara-county-ca', countyName: 'SANTA CLARA', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '085' },
  { slug: 'maricopa-county-az', countyName: 'MARICOPA', stateName: 'Arizona', stateAbbrev: 'AZ', stateFips: '04', countyFips: '013' },
  { slug: 'cook-county-il', countyName: 'COOK', stateName: 'Illinois', stateAbbrev: 'IL', stateFips: '17', countyFips: '031' },
  { slug: 'king-county-wa', countyName: 'KING', stateName: 'Washington', stateAbbrev: 'WA', stateFips: '53', countyFips: '033' },
  { slug: 'miami-dade-county-fl', countyName: 'MIAMI-DADE', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '086' },
  { slug: 'clark-county-nv', countyName: 'CLARK', stateName: 'Nevada', stateAbbrev: 'NV', stateFips: '32', countyFips: '003' },
  { slug: 'fulton-county-ga', countyName: 'FULTON', stateName: 'Georgia', stateAbbrev: 'GA', stateFips: '13', countyFips: '121' },
  { slug: 'wayne-county-mi', countyName: 'WAYNE', stateName: 'Michigan', stateAbbrev: 'MI', stateFips: '26', countyFips: '163' },
  { slug: 'kings-county-ny', countyName: 'KINGS', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '047' },
  { slug: 'riverside-county-ca', countyName: 'RIVERSIDE', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '065' },
  { slug: 'queens-county-ny', countyName: 'QUEENS', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '081' },
  { slug: 'san-bernardino-county-ca', countyName: 'SAN BERNARDINO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '071' },
  { slug: 'broward-county-fl', countyName: 'BROWARD', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '011' },
  { slug: 'middlesex-county-ma', countyName: 'MIDDLESEX', stateName: 'Massachusetts', stateAbbrev: 'MA', stateFips: '25', countyFips: '017' },
  { slug: 'new-york-county-ny', countyName: 'NEW YORK', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '061' },
  { slug: 'alameda-county-ca', countyName: 'ALAMEDA', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '001' },
  { slug: 'sacramento-county-ca', countyName: 'SACRAMENTO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '067' },
  { slug: 'palm-beach-county-fl', countyName: 'PALM BEACH', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '099' },
  { slug: 'philadelphia-county-pa', countyName: 'PHILADELPHIA', stateName: 'Pennsylvania', stateAbbrev: 'PA', stateFips: '42', countyFips: '101' },
  { slug: 'hillsborough-county-fl', countyName: 'HILLSBOROUGH', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '057' },
  { slug: 'suffolk-county-ny', countyName: 'SUFFOLK', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '103' },
  { slug: 'orange-county-fl', countyName: 'ORANGE', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '095' },
  { slug: 'bronx-county-ny', countyName: 'BRONX', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '005' },

  // Second batch -- next-most-populous US counties by 2024/2025 Census estimates not already
  // above, per the Wikipedia-sourced ranking cross-checked against this list (ranks ~30-61).
  // FIPS codes verified against the Census Bureau's national_county2020.txt reference file, same
  // as the batch above. One nominally-higher-ranked entry (Connecticut's "Capitol Planning
  // Region," rank ~51) was skipped: Connecticut retired traditional counties for most statistical
  // purposes, so it has no standard county-equivalent FIPS code the rest of this app's
  // FIPS-keyed matching (Census API calls, FEMA declaration matching) can rely on the same way.
  { slug: 'nassau-county-ny', countyName: 'NASSAU', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '059' },
  { slug: 'franklin-county-oh', countyName: 'FRANKLIN', stateName: 'Ohio', stateAbbrev: 'OH', stateFips: '39', countyFips: '049' },
  { slug: 'collin-county-tx', countyName: 'COLLIN', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '085' },
  { slug: 'oakland-county-mi', countyName: 'OAKLAND', stateName: 'Michigan', stateAbbrev: 'MI', stateFips: '26', countyFips: '125' },
  { slug: 'hennepin-county-mn', countyName: 'HENNEPIN', stateName: 'Minnesota', stateAbbrev: 'MN', stateFips: '27', countyFips: '053' },
  { slug: 'wake-county-nc', countyName: 'WAKE', stateName: 'North Carolina', stateAbbrev: 'NC', stateFips: '37', countyFips: '183' },
  { slug: 'mecklenburg-county-nc', countyName: 'MECKLENBURG', stateName: 'North Carolina', stateAbbrev: 'NC', stateFips: '37', countyFips: '119' },
  { slug: 'cuyahoga-county-oh', countyName: 'CUYAHOGA', stateName: 'Ohio', stateAbbrev: 'OH', stateFips: '39', countyFips: '035' },
  { slug: 'allegheny-county-pa', countyName: 'ALLEGHENY', stateName: 'Pennsylvania', stateAbbrev: 'PA', stateFips: '42', countyFips: '003' },
  { slug: 'salt-lake-county-ut', countyName: 'SALT LAKE', stateName: 'Utah', stateAbbrev: 'UT', stateFips: '49', countyFips: '035' },
  { slug: 'contra-costa-county-ca', countyName: 'CONTRA COSTA', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '013' },
  { slug: 'fairfax-county-va', countyName: 'FAIRFAX', stateName: 'Virginia', stateAbbrev: 'VA', stateFips: '51', countyFips: '059' },
  { slug: 'pima-county-az', countyName: 'PIMA', stateName: 'Arizona', stateAbbrev: 'AZ', stateFips: '04', countyFips: '019' },
  { slug: 'montgomery-county-md', countyName: 'MONTGOMERY', stateName: 'Maryland', stateAbbrev: 'MD', stateFips: '24', countyFips: '031' },
  { slug: 'denton-county-tx', countyName: 'DENTON', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '121' },
  { slug: 'duval-county-fl', countyName: 'DUVAL', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '031' },
  { slug: 'fresno-county-ca', countyName: 'FRESNO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '019' },
  { slug: 'gwinnett-county-ga', countyName: 'GWINNETT', stateName: 'Georgia', stateAbbrev: 'GA', stateFips: '13', countyFips: '135' },
  { slug: 'westchester-county-ny', countyName: 'WESTCHESTER', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '119' },
  { slug: 'marion-county-in', countyName: 'MARION', stateName: 'Indiana', stateAbbrev: 'IN', stateFips: '18', countyFips: '097' },
  { slug: 'st-louis-county-mo', countyName: 'ST. LOUIS', stateName: 'Missouri', stateAbbrev: 'MO', stateFips: '29', countyFips: '189' },
  { slug: 'honolulu-county-hi', countyName: 'HONOLULU', stateName: 'Hawaii', stateAbbrev: 'HI', stateFips: '15', countyFips: '003' },
  { slug: 'bergen-county-nj', countyName: 'BERGEN', stateName: 'New Jersey', stateAbbrev: 'NJ', stateFips: '34', countyFips: '003' },
  { slug: 'fort-bend-county-tx', countyName: 'FORT BEND', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '157' },
  { slug: 'prince-georges-county-md', countyName: "PRINCE GEORGE'S", stateName: 'Maryland', stateAbbrev: 'MD', stateFips: '24', countyFips: '033' },
  { slug: 'pinellas-county-fl', countyName: 'PINELLAS', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '103' },
  { slug: 'erie-county-ny', countyName: 'ERIE', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '029' },
  { slug: 'pierce-county-wa', countyName: 'PIERCE', stateName: 'Washington', stateAbbrev: 'WA', stateFips: '53', countyFips: '053' },
  { slug: 'dupage-county-il', countyName: 'DUPAGE', stateName: 'Illinois', stateAbbrev: 'IL', stateFips: '17', countyFips: '043' },

  // Fourth batch -- next 40 largest US counties not already covered above, per a live Census
  // Bureau ACS 2023 5-year population query (B01003_001E, sorted descending), which returns FIPS
  // codes directly alongside population -- verified data, not transcribed from a webpage. Two
  // higher-ranked entries were skipped and backfilled with the next real county: Connecticut's
  // "Capitol Planning Region" (same reasoning as the second batch's skip -- no standard
  // county-equivalent FIPS this app's FIPS-keyed matching can rely on) and the District of
  // Columbia (a federal district, not a county -- no county government for county-specific copy
  // to describe).
  { slug: 'milwaukee-county-wi', countyName: 'MILWAUKEE', stateName: 'Wisconsin', stateAbbrev: 'WI', stateFips: '55', countyFips: '079' },
  { slug: 'shelby-county-tn', countyName: 'SHELBY', stateName: 'Tennessee', stateAbbrev: 'TN', stateFips: '47', countyFips: '157' },
  { slug: 'kern-county-ca', countyName: 'KERN', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '029' },
  { slug: 'hidalgo-county-tx', countyName: 'HIDALGO', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '215' },
  { slug: 'macomb-county-mi', countyName: 'MACOMB', stateName: 'Michigan', stateAbbrev: 'MI', stateFips: '26', countyFips: '099' },
  { slug: 'el-paso-county-tx', countyName: 'EL PASO', stateName: 'Texas', stateAbbrev: 'TX', stateFips: '48', countyFips: '141' },
  { slug: 'worcester-county-ma', countyName: 'WORCESTER', stateName: 'Massachusetts', stateAbbrev: 'MA', stateFips: '25', countyFips: '027' },
  { slug: 'middlesex-county-nj', countyName: 'MIDDLESEX', stateName: 'New Jersey', stateAbbrev: 'NJ', stateFips: '34', countyFips: '023' },
  { slug: 'montgomery-county-pa', countyName: 'MONTGOMERY', stateName: 'Pennsylvania', stateAbbrev: 'PA', stateFips: '42', countyFips: '091' },
  { slug: 'essex-county-nj', countyName: 'ESSEX', stateName: 'New Jersey', stateAbbrev: 'NJ', stateFips: '34', countyFips: '013' },
  { slug: 'baltimore-county-md', countyName: 'BALTIMORE', stateName: 'Maryland', stateAbbrev: 'MD', stateFips: '24', countyFips: '005' },
  { slug: 'ventura-county-ca', countyName: 'VENTURA', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '111' },
  { slug: 'san-francisco-county-ca', countyName: 'SAN FRANCISCO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '075' },
  { slug: 'snohomish-county-wa', countyName: 'SNOHOMISH', stateName: 'Washington', stateAbbrev: 'WA', stateFips: '53', countyFips: '061' },
  { slug: 'hamilton-county-oh', countyName: 'HAMILTON', stateName: 'Ohio', stateAbbrev: 'OH', stateFips: '39', countyFips: '061' },
  { slug: 'essex-county-ma', countyName: 'ESSEX', stateName: 'Massachusetts', stateAbbrev: 'MA', stateFips: '25', countyFips: '009' },
  { slug: 'multnomah-county-or', countyName: 'MULTNOMAH', stateName: 'Oregon', stateAbbrev: 'OR', stateFips: '41', countyFips: '051' },
  { slug: 'oklahoma-county-ok', countyName: 'OKLAHOMA', stateName: 'Oklahoma', stateAbbrev: 'OK', stateFips: '40', countyFips: '109' },
  { slug: 'lee-county-fl', countyName: 'LEE', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '071' },
  { slug: 'san-joaquin-county-ca', countyName: 'SAN JOAQUIN', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '077' },
  { slug: 'suffolk-county-ma', countyName: 'SUFFOLK', stateName: 'Massachusetts', stateAbbrev: 'MA', stateFips: '25', countyFips: '025' },
  { slug: 'jefferson-county-ky', countyName: 'JEFFERSON', stateName: 'Kentucky', stateAbbrev: 'KY', stateFips: '21', countyFips: '111' },
  { slug: 'cobb-county-ga', countyName: 'COBB', stateName: 'Georgia', stateAbbrev: 'GA', stateFips: '13', countyFips: '067' },
  { slug: 'dekalb-county-ga', countyName: 'DEKALB', stateName: 'Georgia', stateAbbrev: 'GA', stateFips: '13', countyFips: '089' },
  { slug: 'polk-county-fl', countyName: 'POLK', stateName: 'Florida', stateAbbrev: 'FL', stateFips: '12', countyFips: '105' },
  { slug: 'monroe-county-ny', countyName: 'MONROE', stateName: 'New York', stateAbbrev: 'NY', stateFips: '36', countyFips: '055' },
  { slug: 'san-mateo-county-ca', countyName: 'SAN MATEO', stateName: 'California', stateAbbrev: 'CA', stateFips: '06', countyFips: '081' },
  { slug: 'el-paso-county-co', countyName: 'EL PASO', stateName: 'Colorado', stateAbbrev: 'CO', stateFips: '08', countyFips: '041' },
  { slug: 'norfolk-county-ma', countyName: 'NORFOLK', stateName: 'Massachusetts', stateAbbrev: 'MA', stateFips: '25', countyFips: '021' },
  { slug: 'jackson-county-mo', countyName: 'JACKSON', stateName: 'Missouri', stateAbbrev: 'MO', stateFips: '29', countyFips: '095' },
  { slug: 'denver-county-co', countyName: 'DENVER', stateName: 'Colorado', stateAbbrev: 'CO', stateFips: '08', countyFips: '031' },
  { slug: 'lake-county-il', countyName: 'LAKE', stateName: 'Illinois', stateAbbrev: 'IL', stateFips: '17', countyFips: '097' },
  { slug: 'hudson-county-nj', countyName: 'HUDSON', stateName: 'New Jersey', stateAbbrev: 'NJ', stateFips: '34', countyFips: '017' },
  { slug: 'davidson-county-tn', countyName: 'DAVIDSON', stateName: 'Tennessee', stateAbbrev: 'TN', stateFips: '47', countyFips: '037' },
  { slug: 'will-county-il', countyName: 'WILL', stateName: 'Illinois', stateAbbrev: 'IL', stateFips: '17', countyFips: '197' },
  { slug: 'utah-county-ut', countyName: 'UTAH', stateName: 'Utah', stateAbbrev: 'UT', stateFips: '49', countyFips: '049' },
  { slug: 'bernalillo-county-nm', countyName: 'BERNALILLO', stateName: 'New Mexico', stateAbbrev: 'NM', stateFips: '35', countyFips: '001' },
  { slug: 'tulsa-county-ok', countyName: 'TULSA', stateName: 'Oklahoma', stateAbbrev: 'OK', stateFips: '40', countyFips: '143' },
  { slug: 'jefferson-county-al', countyName: 'JEFFERSON', stateName: 'Alabama', stateAbbrev: 'AL', stateFips: '01', countyFips: '073' },
  { slug: 'providence-county-ri', countyName: 'PROVIDENCE', stateName: 'Rhode Island', stateAbbrev: 'RI', stateFips: '44', countyFips: '007' },
];
