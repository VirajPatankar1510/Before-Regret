// Real, executing residential-address validation gate.
//
// Replaces the dead code in addressValidationGate.ts (never called anywhere, confirmed by a
// repo-wide search) and the OSM-keyword heuristics duplicated in AddressSearchBox.tsx /
// MapBuildingPickerModal.tsx / server.ts's resolvePropertyMetadata() (all confirmed to be
// text-keyword guesses, not real government-data checks -- see the Task 1/2 audit).
//
// Every layer here fails CLOSED: a network error, timeout, ambiguous match, or missing data
// source blocks the address. Nothing here is allowed to silently default to "residential."

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// LAYER 1 -- Address Format & Resolution Validation (US Census Bureau Geocoder)
// ---------------------------------------------------------------------------
// Uses the Census Bureau's free, no-API-key, public-domain geocoder as the primary resolver,
// per the spec. This is a genuine replacement for the Nominatim/OpenStreetMap calls the app
// previously used for this decision -- Nominatim's usage policy explicitly prohibits the kind
// of unthrottled production traffic a paid product would generate against its free endpoint,
// and it isn't built to be strict about "must be a real addressable location" the way the
// Census address-range geocoder is.
//
// The Census "oneline address" geocoder can only return a point interpolated onto a real TIGER
// street address range, or no match at all -- structurally, it cannot resolve to a road
// segment, boundary, water feature, or park the way a general-purpose place index like
// Nominatim can. So "no match" already covers the non-point-feature case described in the spec;
// there is no separate feature-type check to write for this data source.

export interface Layer1Result {
  passed: boolean;
  code: string;
  message: string;
  matchedAddress?: string;
  lat?: number;
  lon?: number;
}

/**
 * Checks: the input has a leading street number, and resolves to exactly one point address.
 * Calls: US Census Bureau geocoder (geocoding.geo.census.gov, Public_AR_Current benchmark).
 * On failure: returns { passed: false, code, message } -- never throws to the caller.
 * Fails closed on: missing street number, no match, ambiguous (>1) match, missing coordinates,
 * network error, non-OK response, or unparseable response body.
 */
export async function validateLayer1(rawAddress: string): Promise<Layer1Result> {
  const trimmed = (rawAddress || '').trim();

  // A real US civic address must start with a street number. This is the one check that can be
  // made without a network call, so it runs first.
  if (!/^\d+[a-zA-Z]?\s+\S/.test(trimmed)) {
    return {
      passed: false,
      code: 'L1_NO_STREET_NUMBER',
      message: 'This does not look like a complete street address. Include a house number and street name (e.g. "119 East 6th Street").',
    };
  }

  let response: Response;
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(trimmed)}&benchmark=Public_AR_Current&format=json`;
    response = await fetchWithTimeout(url);
  } catch (err) {
    // Fail closed: a network error or timeout is not a pass.
    return {
      passed: false,
      code: 'L1_GEOCODER_UNAVAILABLE',
      message: 'Address verification service is temporarily unavailable. Please try again in a moment.',
    };
  }

  if (!response.ok) {
    return {
      passed: false,
      code: 'L1_GEOCODER_ERROR',
      message: 'Address verification service returned an error. Please try again in a moment.',
    };
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return {
      passed: false,
      code: 'L1_GEOCODER_BAD_RESPONSE',
      message: 'Address verification service returned an unreadable response. Please try again.',
    };
  }

  const matches = data?.result?.addressMatches;
  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      passed: false,
      code: 'L1_NO_MATCH',
      message: 'This address could not be verified against US Census Bureau address records. Double-check the street number, name, city, state, and ZIP.',
    };
  }

  // More than one candidate match means the input was ambiguous -- fail closed rather than
  // guessing which candidate the user meant.
  if (matches.length > 1) {
    return {
      passed: false,
      code: 'L1_AMBIGUOUS_MATCH',
      message: 'This address matched more than one location in Census Bureau records. Please enter a more specific address.',
    };
  }

  const match = matches[0];
  const coords = match?.coordinates;
  if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') {
    return {
      passed: false,
      code: 'L1_NO_COORDINATES',
      message: 'Address verification did not return usable coordinates for this address.',
    };
  }

  return {
    passed: true,
    code: 'L1_RESOLVED',
    message: 'Address resolved to a verified US Census Bureau address point.',
    matchedAddress: match.matchedAddress,
    lat: coords.y,
    lon: coords.x,
  };
}

// ---------------------------------------------------------------------------
// LAYER 2 -- Federal / Government Facility & Protected Area Exclusion
// ---------------------------------------------------------------------------
// IMPORTANT: the HIFLD Open portal this task's spec points to (hifld-geoplatform.hub.arcgis.com)
// was decommissioned by DHS on 2025-08-26 and no longer serves data -- confirmed via web search
// before writing this. There is no official government successor portal as of this writing.
//
// This layer instead queries four still-live, independently-hosted, officially-sourced ArcGIS
// FeatureServer layers, each verified with real point-in-polygon test queries (including a
// positive control against the White House/President's Park boundary, a negative control
// against an ordinary residential address, and a positive control against a real military base)
// before being wired in here:
//
//   1. USA Federal Lands (Esri Living Atlas; NPS/BLM/USFS/FWS-managed federal land polygons).
//      Verified to correctly cover both 1600 Pennsylvania Ave NW (the White House itself) and
//      South Drive (an unnumbered interior road on the same grounds) -- satisfying the spec's
//      explicit requirement to catch unnumbered government-grounds roads.
//   2. NTAD Military Bases (US DOT / Bureau of Transportation Statistics, official).
//   3. GSA Inventory of Owned and Leased Properties (Esri's hosted copy of GSA's own IOLP open
//      data; point layer, queried with a small buffer, catches standalone federal office
//      buildings that aren't on a dedicated federal land parcel).
//   4. PAD-US Protected Areas National (USGS, official; parks, wildlife refuges, monuments,
//      other conservation/protected land -- this is the "protected areas database" the spec
//      calls for).
//
// A facility match on ANY layer blocks the address. If any layer's query fails or times out,
// that counts as an inconclusive result for THIS layer, not a pass -- the address only clears
// Layer 2 if every layer was successfully queried and found clear.
//
// IMPORTANT: the Census geocoder (Layer 1) returns a point INTERPOLATED along the street's TIGER
// line address range, not a rooftop/parcel-centroid point -- for a large or irregular property
// like the White House grounds, that interpolated point can land 100+ meters from where it was
// tested and still miss the actual facility polygon on a bare point-in-polygon query. Verified
// empirically: querying Federal Lands with zero buffer at the Census-returned White House
// coordinate returns no match at all.
//
// A buffer fixes that, but the right size differs by layer, and by whether the source is a
// polygon (a real facility footprint) or a point (a single lat/lon standing in for a whole
// building) -- point-to-point comparisons need more tolerance than point-to-polygon ones,
// since both the Census interpolation AND the source's own point placement carry error:
//
//   - Federal Lands / Military Bases (polygons): 25m was the smallest buffer that reliably
//     caught the White House in testing, with zero false positives against several genuine
//     residential addresses at that size.
//   - GSA Owned/Leased Buildings (points): needed 60m -- verified against a real case (600
//     19th St NW, Washington DC) where GSA's own inventory record for that exact civic address
//     sits ~60m from where the Census geocoder interpolates the same address, illustrating how
//     far apart two independent government point sources can legitimately land for the same
//     building. Also verified with zero false positives at 60m against multiple residential
//     addresses.
//   - Protected Areas (polygons, but with long boundaries that commonly run directly behind
//     ordinary residential lots): no buffer at all. Any buffer here starts flagging real homes
//     near a park as if they were on protected land -- confirmed empirically, a real Austin
//     residential address near Mount Bonnell park falsely matched at a 25m buffer but not at
//     0m. This doesn't weaken the White House case: it's independently caught by the Federal
//     Lands layer regardless of the Protected Areas result, since Layer 2 blocks on a match
//     from ANY source.

export interface Layer2Result {
  passed: boolean;
  code: string;
  message: string;
  matchedFacility?: { source: string; name: string; agency?: string };
}

interface FacilitySource {
  id: string;
  label: string;
  url: string;
  bufferMeters?: number;
  nameField: string;
  agencyField?: string;
}

const POLYGON_FACILITY_BUFFER_METERS = 25;
const POINT_FACILITY_BUFFER_METERS = 60;
// Protected areas get no buffer -- their boundaries run alongside too many ordinary residential
// lots for any buffer to be safe (see comment above FACILITY_SOURCES).
const PROTECTED_AREA_BUFFER_METERS = 0;

const FACILITY_SOURCES: FacilitySource[] = [
  {
    id: 'federal_lands',
    label: 'USA Federal Lands (NPS/BLM/USFS/FWS)',
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Federal_Lands/FeatureServer/0',
    bufferMeters: POLYGON_FACILITY_BUFFER_METERS,
    nameField: 'unit_name',
    agencyField: 'Agency',
  },
  {
    id: 'military_bases',
    label: 'NTAD Military Bases (US DOT/BTS)',
    url: 'https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Military_Bases/FeatureServer/0',
    bufferMeters: POLYGON_FACILITY_BUFFER_METERS,
    nameField: 'siteName',
  },
  {
    id: 'gsa_owned_buildings',
    label: 'GSA Owned Buildings (IOLP)',
    url: 'https://services1.arcgis.com/eBupDfPlEJK3mdAm/ArcGIS/rest/services/IOLP_NEW/FeatureServer/0',
    bufferMeters: POINT_FACILITY_BUFFER_METERS,
    nameField: 'Real_Property_Asset_Name',
  },
  {
    id: 'gsa_leased_buildings',
    label: 'GSA Leased Buildings (IOLP)',
    url: 'https://services1.arcgis.com/eBupDfPlEJK3mdAm/ArcGIS/rest/services/IOLP_NEW/FeatureServer/1',
    bufferMeters: POINT_FACILITY_BUFFER_METERS,
    nameField: 'Real_Property_Asset_Name',
  },
  {
    id: 'protected_areas',
    label: 'PAD-US Protected Areas National (USGS)',
    url: 'https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/PADUS_Protected_Areas_National/FeatureServer/0',
    bufferMeters: PROTECTED_AREA_BUFFER_METERS,
    nameField: 'Unit_Nm',
    agencyField: 'MngNm_Desc',
  },
];

type FacilityQueryOutcome =
  | { ok: true; matched: false }
  | { ok: true; matched: true; name: string; agency?: string }
  | { ok: false };

async function queryFacilitySource(source: FacilitySource, lat: number, lon: number): Promise<FacilityQueryOutcome> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: `${source.nameField}${source.agencyField ? ',' + source.agencyField : ''}`,
    returnGeometry: 'false',
    f: 'json',
  });
  if (source.bufferMeters) {
    params.set('distance', String(source.bufferMeters));
    params.set('units', 'esriSRUnit_Meter');
  }

  try {
    const res = await fetchWithTimeout(`${source.url}/query?${params.toString()}`);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    if (data?.error) return { ok: false };
    const features = data?.features;
    if (!Array.isArray(features)) return { ok: false };
    if (features.length === 0) return { ok: true, matched: false };
    const attrs = features[0]?.attributes || {};
    return {
      ok: true,
      matched: true,
      name: attrs[source.nameField] || source.label,
      agency: source.agencyField ? attrs[source.agencyField] : undefined,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Checks: whether the resolved coordinates fall within (or near, see buffer calibration above)
 * a federal land parcel, military base, GSA-owned/leased building, or protected area.
 * Calls: 5 ArcGIS FeatureServer point-in-polygon/point-in-radius queries in parallel -- Esri
 * Living Atlas USA Federal Lands, US DOT/BTS NTAD Military Bases, Esri-hosted GSA IOLP owned +
 * leased buildings, and USGS PAD-US Protected Areas National.
 * On failure: returns { passed: false, code, message, matchedFacility? } -- never throws.
 * Fails closed on: a match from any source (blocks), OR any source's query erroring/timing out
 * (blocks as "temporarily unavailable" even if other sources came back clear -- an inconclusive
 * result from any single source is treated as not-yet-cleared, not as a pass).
 */
export async function validateLayer2(lat: number, lon: number): Promise<Layer2Result> {
  const outcomes = await Promise.all(FACILITY_SOURCES.map((s) => queryFacilitySource(s, lat, lon)));

  for (let i = 0; i < outcomes.length; i++) {
    const outcome = outcomes[i];
    if (outcome.ok && outcome.matched) {
      const source = FACILITY_SOURCES[i];
      return {
        passed: false,
        code: 'L2_GOVERNMENT_FACILITY_BLOCKED',
        message: 'This location is a government or federal facility. BeforeRegret supports residential addresses only.',
        matchedFacility: { source: source.label, name: outcome.name, agency: outcome.agency },
      };
    }
  }

  const anyInconclusive = outcomes.some((o) => !o.ok);
  if (anyInconclusive) {
    return {
      passed: false,
      code: 'L2_FACILITY_CHECK_UNAVAILABLE',
      message: 'Government-facility verification is temporarily unavailable. Please try again in a moment.',
    };
  }

  return {
    passed: true,
    code: 'L2_NO_FACILITY_MATCH',
    message: 'No government, military, or protected-area facility found at this location.',
  };
}

// ---------------------------------------------------------------------------
// LAYER 3 -- County Assessor Parcel Classification / Supported Jurisdictions
// ---------------------------------------------------------------------------
// BeforeRegret does not currently have a real, legally-cleared county assessor data
// integration anywhere -- Task 1 found the previous "assessor lookup" was entirely fabricated
// (hardcoded parcel IDs, fake "200 OK" log lines for calls that never happened). Building a
// per-county scraper raises the licensing/ToS questions already discussed and not yet resolved
// (see conversation on data licensing and the ATTOM/CoreLogic/Regrid alternative).
//
// Every jurisdiction is therefore "not supported" and every address is honestly told so --
// never silently defaulted to "residential." Do not add an entry to SUPPORTED_JURISDICTIONS
// without a real backing data source -- that would re-introduce the exact fabrication problem
// this gate exists to remove.

export interface Layer3Result {
  passed: boolean;
  code: string;
  message: string;
}

// No jurisdiction currently has a real, legally-cleared assessor data source, so this layer
// does exactly one thing: check whether the address's county/state is on the supported list,
// and fail closed with an honest "not covered yet" message if not. It intentionally does NOT
// attempt any parcel-level classification (vacant land, unit numbers, commercial vs.
// residential) -- building that decision logic against a data source that doesn't exist yet
// would be unverified, untested code sitting in a shipped file for no current benefit. When a
// real jurisdiction is onboarded with a real assessor API, that classification logic should be
// designed against that API's actual shape and tested against real responses, not built
// speculatively in advance.
const SUPPORTED_JURISDICTIONS: string[] = [];

function jurisdictionKey(county: string, state: string): string {
  return `${(county || '').trim().toLowerCase()}|${(state || '').trim().toLowerCase()}`;
}

/**
 * Checks: whether the address's county/state is in SUPPORTED_JURISDICTIONS.
 * Calls: no external API -- SUPPORTED_JURISDICTIONS is currently an empty in-memory list,
 * because no jurisdiction has a real, legally-cleared county assessor data source yet.
 * On failure: returns { passed: false, code, message } -- never throws.
 * Fails closed on: any jurisdiction not explicitly in the list (i.e. every jurisdiction today).
 * Never defaults an unrecognized or unsupported area to "residential."
 */
export async function validateLayer3(city: string, state: string): Promise<Layer3Result> {
  const isSupported = SUPPORTED_JURISDICTIONS.includes(jurisdictionKey(city, state));

  if (!isSupported) {
    return {
      passed: false,
      code: 'L3_JURISDICTION_NOT_SUPPORTED',
      message: "BeforeRegret doesn't yet cover this area. We're expanding — check back soon.",
    };
  }

  // Reached only once a jurisdiction is actually onboarded with a real assessor data source.
  return {
    passed: false,
    code: 'L3_NOT_IMPLEMENTED',
    message: "BeforeRegret doesn't yet cover this area. We're expanding — check back soon.",
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface AddressGateResult {
  canGenerateReport: boolean;
  blockedAtLayer: 1 | 2 | 3 | null;
  message: string;
  layer1: Layer1Result;
  layer2?: Layer2Result;
  layer3?: Layer3Result;
  resolvedAddress?: string;
  lat?: number;
  lon?: number;
}

/**
 * Checks: runs Layers 1-3 in order, stopping at the first failure (fail-fast, since a later
 * layer can't run without the coordinates/data the earlier one produces).
 * Calls: validateLayer1(), validateLayer2(), validateLayer3() -- see each for its own API.
 * On failure: returns { canGenerateReport: false, blockedAtLayer, message, ... } identifying
 * exactly which layer blocked and why -- never throws to the caller.
 * Fails closed on: any layer failing. This is the single function callers should use; it's
 * called both by the map/search UI (POST /api/address/validate, for real-time feedback) and
 * independently again inside report generation (POST /api/property/generate-report), so a
 * bypassed or stale frontend check can never let a report through on its own.
 */
export async function runAddressGate(rawAddress: string, city: string, state: string): Promise<AddressGateResult> {
  const layer1 = await validateLayer1(rawAddress);
  if (!layer1.passed) {
    return { canGenerateReport: false, blockedAtLayer: 1, message: layer1.message, layer1 };
  }

  const layer2 = await validateLayer2(layer1.lat!, layer1.lon!);
  if (!layer2.passed) {
    return {
      canGenerateReport: false,
      blockedAtLayer: 2,
      message: layer2.message,
      layer1,
      layer2,
      resolvedAddress: layer1.matchedAddress,
      lat: layer1.lat,
      lon: layer1.lon,
    };
  }

  const layer3 = await validateLayer3(city, state);
  if (!layer3.passed) {
    return {
      canGenerateReport: false,
      blockedAtLayer: 3,
      message: layer3.message,
      layer1,
      layer2,
      layer3,
      resolvedAddress: layer1.matchedAddress,
      lat: layer1.lat,
      lon: layer1.lon,
    };
  }

  return {
    canGenerateReport: true,
    blockedAtLayer: null,
    message: 'Address passed all validation layers.',
    layer1,
    layer2,
    layer3,
    resolvedAddress: layer1.matchedAddress,
    lat: layer1.lat,
    lon: layer1.lon,
  };
}
