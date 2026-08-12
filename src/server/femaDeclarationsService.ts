import { COVERED_COUNTIES } from '../data/coveredCounties.js';

// Fetches recent FEMA disaster declarations from the real, free, no-auth-required OpenFEMA API
// and matches them against the counties BeforeRegret actually has a complete county_data row for.
// Confirmed live against the real endpoint before writing this (declarationDate values from
// today and yesterday came back on a plain unauthenticated request) -- this is a genuinely
// current, government-run feed, not a stale export.
//
// Matching is by FIPS code (fipsStateCode + fipsCountyCode against COVERED_COUNTIES' stateFips +
// countyFips), not county-name text matching -- both sides already carry the real FIPS codes, so
// there's no need for the kind of fuzzy "Travis" vs "Travis County" normalization the rest of
// this app needs elsewhere (see src/utils/normalizeCounty.ts). A declaration whose designated
// area doesn't include one of BeforeRegret's covered counties produces no match and is silently
// skipped -- same "no data, no article" discipline as county_data's own data_complete gate.

const OPENFEMA_BASE_URL = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';

export interface FemaDeclaration {
  disasterNumber: number;
  femaDeclarationString: string;
  declarationTitle: string;
  incidentType: string;
  declarationDate: string;
  incidentBeginDate: string | null;
  state: string;
  fipsStateCode: string;
  fipsCountyCode: string;
  designatedArea: string;
}

interface OpenFemaApiRow {
  disasterNumber: number;
  femaDeclarationString: string;
  declarationTitle: string;
  incidentType: string;
  declarationDate: string;
  incidentBeginDate: string | null;
  state: string;
  fipsStateCode: string;
  fipsCountyCode: string;
  designatedArea: string;
}

/**
 * Declarations with a declarationDate on or after `sinceIso`, newest first. OpenFEMA has no
 * "since" cursor beyond a plain date filter, so this is intentionally a wide net -- the caller's
 * own dedup table (fema_declaration_events) is what actually prevents redrafting the same
 * declaration+county pair on every run, not this query being narrow.
 */
export async function fetchRecentFemaDeclarations(sinceIso: string): Promise<FemaDeclaration[]> {
  const filter = encodeURIComponent(`declarationDate ge '${sinceIso}'`);
  const url = `${OPENFEMA_BASE_URL}?$filter=${filter}&$orderby=declarationDate desc&$top=1000`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenFEMA API returned ${res.status}`);
  }
  const data = await res.json();
  const rows = (data?.DisasterDeclarationsSummaries ?? []) as OpenFemaApiRow[];
  return rows.map((r) => ({
    disasterNumber: r.disasterNumber,
    femaDeclarationString: r.femaDeclarationString,
    declarationTitle: r.declarationTitle,
    incidentType: r.incidentType,
    declarationDate: r.declarationDate,
    incidentBeginDate: r.incidentBeginDate,
    state: r.state,
    fipsStateCode: r.fipsStateCode,
    fipsCountyCode: r.fipsCountyCode,
    designatedArea: r.designatedArea,
  }));
}

export interface CoveredCountyMatch {
  slug: string;
  countyName: string;
  stateAbbrev: string;
}

/** Null when the declaration's designated area isn't one of BeforeRegret's covered counties. */
export function matchDeclarationToCoveredCounty(declaration: FemaDeclaration): CoveredCountyMatch | null {
  const match = COVERED_COUNTIES.find(
    (c) => c.stateFips === declaration.fipsStateCode && c.countyFips === declaration.fipsCountyCode
  );
  if (!match) return null;
  return { slug: match.slug, countyName: match.countyName, stateAbbrev: match.stateAbbrev };
}

/** The real, public FEMA page for this declaration -- confirmed live (e.g. fema.gov/disaster/4830). */
export function femaDeclarationUrl(disasterNumber: number): string {
  return `https://www.fema.gov/disaster/${disasterNumber}`;
}
