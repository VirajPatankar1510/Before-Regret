// The join at the heart of the building-codes study: every Census permit-issuing office (BPS 2025
// place files) matched to the FEMA BCAT jurisdiction whose code applied to its permits.
//
// BPS identifies an office by state FIPS + county FIPS + a name ("Abbeville", "Baldwin County
// Unincorporated Area", "Kansas City MO"). BCAT identifies a jurisdiction by state + county name +
// place name ("Abbeville", "Baldwin County", "Kansas City"). There is no shared ID, so the match is by
// name, in this fixed order, and every office records HOW it matched so the method is auditable:
//
//   1. exact      -- same state, same county, same normalised place name
//   2. county     -- a county's unincorporated area matched to BCAT's "<Name> County" row
//   3. state      -- same state and normalised name, and exactly one BCAT row has it
//   4. prefix     -- BCAT row in the same county whose name starts with the office name
//                    ("Indianapolis" -> "Indianapolis city (balance)"), only when exactly one does
//   5. uniform    -- no named row, but every BCAT jurisdiction FEMA lists in that county carries the
//                    same rating and residential code, so the office inherits it. Used for county-run
//                    permit offices covering townships (Ohio, Michigan, Wisconsin), never across a split.
//
// Anything left is "unmatched" and is reported as its own bucket, never guessed.
export const STATE_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR',
};
export const STATE_NAME: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
};

export type Jurisdiction = {
  OBJECTID: number; Place: string; County: string; State_abbr: string; Res_Code: string; Building_Code: string;
  Combined_Hazard_Code: string; Flood_Code: string; Wind_Code: string; Hurricane_Code: string; Tornado_Code: string;
  Seismic_Code: string; Local_Code_Weakening_Note: string; Pop_2020: number;
};
export type Office = {
  state: string; id6: string; county: string; placeFips: string; mcdFips: string; pop: number; monthsReported: number; name: string;
  units: { u1: number; u2: number; u34: number; u5: number }; reported: { u1: number; u2: number; u34: number; u5: number };
};
export type Method = 'exact' | 'county' | 'state' | 'prefix' | 'uniform' | 'unmatched';
export type Joined = Office & { st: string; countyName: string; method: Method; j: Jurisdiction | null };

export const norm = (s: string) => s.toLowerCase()
  .replace(/&/g, 'and').replace(/\bsaint\b/g, 'st').replace(/\bst\.?(?=\s)/g, 'st').replace(/\bste\.?(?=\s)/g, 'ste')
  .replace(/\bmount\b/g, 'mt').replace(/\bft\.?(?=\s)/g, 'fort').replace(/[.'’,]/g, '').replace(/-/g, ' ')
  .replace(/\((balance|independent city)\)/g, ' ')
  .replace(/\b(city|town|village|borough|township|twp|charter|plantation|municipality|corporation|of|the)\b/g, ' ')
  .replace(/\s+/g, ' ').trim();

// "Baldwin County" (BPS county file) -> "Baldwin"; "Suffolk (Independent City)" -> "Suffolk".
export const bareCounty = (s: string) => s.trim()
  .replace(/\s*\(Independent City\)?$/i, '') // the BPS county file truncates some names mid-parenthesis
  .replace(/\s+(County|Parish|Borough|Census Area|Municipality|City and Borough|city)$/i, '').trim();

export function joinOffices(jurisdictions: Jurisdiction[], offices: Office[], countyNames: Map<string, string>): Joined[] {
  const key = (st: string, county: string, place: string) => `${st}|${norm(county)}|${norm(place)}`;
  const byCountyPlace = new Map<string, Jurisdiction[]>();
  const byStatePlace = new Map<string, Jurisdiction[]>();
  const byCounty = new Map<string, Jurisdiction[]>();
  const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); };
  for (const j of jurisdictions) {
    push(byCountyPlace, key(j.State_abbr, j.County ?? '', j.Place ?? ''), j);
    push(byStatePlace, `${j.State_abbr}|${norm(j.Place ?? '')}`, j);
    push(byCounty, `${j.State_abbr}|${norm(j.County ?? '')}`, j);
  }
  const one = (a: Jurisdiction[] | undefined) => (a && a.length >= 1 ? a[0] : null);

  return offices.map((o) => {
    const st = STATE_ABBR[o.state] ?? '';
    const countyName = countyNames.get(o.state + o.county) ?? '';
    const county = bareCounty(countyName);
    const unincorporated = /Unincorporated Area$/i.test(o.name);
    let name = o.name
      .replace(/\s*(Part\s+)?Unincorporated Area$/i, '')
      .replace(/\s+(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/, '')
      .trim();
    // "Jacksonville-Duval County" / "Louisville-Jefferson County": a consolidated government named
    // after its city. Not applied to "Part" offices like "Claremore-Rogers County Part", which are
    // the county's own office and fall through to the county rules.
    if (!unincorporated && /^[^-]+-.+ County$/i.test(name)) name = name.split('-')[0];

    const tryList: Array<[Method, Jurisdiction | null]> = [];
    if (!unincorporated) tryList.push(['exact', one(byCountyPlace.get(key(st, county, name)))]);
    if (unincorporated || / County$/i.test(name)) {
      tryList.push(['county', one(byCountyPlace.get(key(st, county, `${county} County`)))]);
      tryList.push(['county', one(byCountyPlace.get(key(st, county, `${county} Parish`)))]);
      tryList.push(['county', one(byCountyPlace.get(key(st, county, county)))]);
      // The BPS county file shortens some names ("Prince George County" for Prince George's), so
      // also try the office's own county name across the state, when exactly one BCAT row has it.
      const own = name.replace(/\s+Part$/i, '');
      const s = byStatePlace.get(`${st}|${norm(/ (County|Parish)$/i.test(own) ? own : `${own} County`)}`);
      tryList.push(['state', s && s.length === 1 ? s[0] : null]);
    } else {
      // An office that is a whole county-equivalent ("San Francisco") sits in BCAT as "San Francisco County".
      if (norm(name) === norm(county)) tryList.push(['county', one(byCountyPlace.get(key(st, county, `${county} County`)))]);
      const s = byStatePlace.get(`${st}|${norm(name)}`);
      tryList.push(['state', s && s.length === 1 ? s[0] : null]);
      const inCounty = (byCounty.get(`${st}|${norm(county)}`) ?? []).filter((j) => norm(j.Place ?? '').startsWith(norm(name) + ' '));
      tryList.push(['prefix', inCounty.length === 1 ? inCounty[0] : null]);
    }
    for (const [method, j] of tryList) if (j) return { ...o, st, countyName, method, j };

    // Uniform fallback: only when FEMA lists jurisdictions in the county and they all agree.
    const all = byCounty.get(`${st}|${norm(county)}`) ?? [];
    if (all.length && all.every((j) => j.Combined_Hazard_Code === all[0].Combined_Hazard_Code && j.Res_Code === all[0].Res_Code)) {
      return { ...o, st, countyName, method: 'uniform' as Method, j: all[0] };
    }
    return { ...o, st, countyName, method: 'unmatched' as Method, j: null };
  });
}

export const totalUnits = (u: { u1: number; u2: number; u34: number; u5: number }) => u.u1 + u.u2 + u.u34 + u.u5;

// FEMA's own legend for Combined_Hazard_Code, read from the BCAT portal's map on 2026-11-25.
export const RATING_LABEL: Record<string, string> = {
  '2': '2021 or later IBC & IRC',
  '1': 'Old or Weakened IBC/IRC, or No IBC/IRC Adopted',
  '0': 'No Building Code Data',
};

// Residential code edition, grouped for the page.
export function resGroup(res: string | undefined): string {
  if (!res) return 'Unmatched';
  if (/^2024 IRC$/.test(res)) return '2024 IRC';
  if (/^2021 IRC$/.test(res)) return '2021 IRC';
  if (/^2018 IRC$/.test(res)) return '2018 IRC';
  if (/^2015 IRC$/.test(res)) return '2015 IRC';
  if (/^No Residential Code$/i.test(res)) return 'No residential code';
  if (/^No Data$/i.test(res)) return 'No data';
  if (/UDC$/.test(res)) return "Wisconsin's own dwelling code";
  if (/^(2000|2003|2006|2009|2012) IRC$/.test(res)) return '2012 IRC or older';
  return 'Other or pre-IRC code';
}
