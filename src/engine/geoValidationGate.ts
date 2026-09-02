// Real, executing residential-address validation gate.
//
// Replaces the dead code in addressValidationGate.ts (never called anywhere, confirmed by a
// repo-wide search) and the OSM-keyword heuristics that used to live in AddressSearchBox.tsx,
// the since-removed MapBuildingPickerModal.tsx, and server.ts's resolvePropertyMetadata() (all
// confirmed to be text-keyword guesses, not real government-data checks -- see the Task 1/2
// audit).
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

  // One attempt against the Census geocoder. Returns null for "ask again differently" (zero
  // matches) and a Layer1Result for anything the caller must return as-is.
  async function askCensus(address: string): Promise<{ matches: any[] } | Layer1Result> {
    let response: Response;
    try {
      const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
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
    const m = data?.result?.addressMatches;
    return { matches: Array.isArray(m) ? m : [] };
  }

  const first = await askCensus(trimmed);
  if (!('matches' in first)) return first;
  let matches = first.matches;

  // RETRY WITHOUT THE ZIP when the first attempt found nothing.
  //
  // Reported by a reader whose address the site refused for days. The two geocoders disagree
  // about his ZIP: LocationIQ resolves 133 Wynooska Road to "Greene, PA 18325", the Census
  // Bureau has the very same house as "GREENTOWN, PA 18426". Because the search box hands this
  // gate LocationIQ's normalised string, Census was being asked to verify an address carrying a
  // ZIP it does not associate with that street, and returned zero matches -- so a real,
  // Census-listed home was rejected as unverifiable. Measured directly: with ZIP 18325, zero
  // matches; with the ZIP dropped, exactly one, correctly resolved to Greentown 18426.
  //
  // Only fires on ZERO matches, never to break a tie, and the single-match requirement below
  // still applies to the retry. That ordering matters: "100 Main St, Springfield, MA" is
  // ambiguous without its ZIP (two matches) but resolves cleanly with it, so it succeeds on the
  // first attempt and never reaches this path.
  if (matches.length === 0) {
    const withoutZip = trimmed.replace(/[, ]+\d{5}(-\d{4})?\s*(,\s*USA)?$/i, '').trim();
    if (withoutZip && withoutZip !== trimmed) {
      const second = await askCensus(withoutZip);
      if (!('matches' in second)) return second;
      matches = second.matches;
    }
  }

  if (matches.length === 0) {
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
//   3. GSA Inventory of OWNED Properties (Esri's hosted copy of GSA's own IOLP open data; point
//      layer, queried with a small buffer, catches standalone federal office buildings that
//      aren't on a dedicated federal land parcel). The companion LEASED layer was dropped on
//      2026-08-29 -- a lease is a tenancy in a privately owned building, not a facility, and it
//      was blocking ordinary residential addresses. See FACILITY_SOURCES.
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
  /**
   * When present, a polygon hit only blocks if its agencyField value is in this set. Absent means
   * any hit blocks, which is correct for sources that contain nothing but facilities.
   *
   * Added 2026-08-29 for PAD-US, which is not a facility database at all -- it is a land
   * MANAGEMENT database, and blocking on every polygon in it was rejecting ordinary homes at
   * scale. See PADUS_BLOCKING_MANAGERS below.
   */
  blockingAgencies?: ReadonlySet<string>;
}

/**
 * The only PAD-US manager categories that block an address.
 *
 * WHY THIS IS AN ALLOWLIST AND NOT A LIST OF EXCLUSIONS. PAD-US publishes 31 distinct
 * MngNm_Desc values (enumerated live from the service on 2026-08-29). The overwhelming majority
 * of them describe land that ordinary people live on or beside: American Indian Lands, City Land,
 * County Land, Private, Non-Governmental Organization, Regional Water Districts, every "Other or
 * Unknown" bucket, and the conservation agencies whose boundaries routinely enclose private
 * inholdings -- there are homes legally inside national forests and national parks. Enumerating
 * what to exclude would mean listing almost everything and still being wrong about the next one.
 *
 * THE BUG THAT PROMPTED THIS. Blocking on any PAD-US polygon rejected 1280 N Riverwalk Ter,
 * Jenks OK -- a house listed on Zillow -- with "This location is a government or federal
 * facility", because it falls inside the Creek Oklahoma Tribal Statistical Area, filed under
 * American Indian Lands. That polygon covers most of eastern Oklahoma after McGirt v. Oklahoma
 * (2020), including the whole of Tulsa. Verified: Jenks, Tulsa and Broken Arrow were all blocked;
 * Austin TX passed. A tribal statistical area is a JURISDICTION containing ordinary towns, not a
 * facility, and telling a resident their home is a federal facility is both wrong and offensive.
 *
 * WHY LOSING THE REST COSTS NOTHING. PAD-US was never what caught real facilities. The White
 * House blocks on the USA Federal Lands layer, and military installations have their own NTAD
 * layer -- both verified before this narrowing. What remains here are the two categories where a
 * residential address genuinely cannot exist and which the other layers might not carry.
 */
const PADUS_BLOCKING_MANAGERS: ReadonlySet<string> = new Set([
  'Department of Defense',
  'Department of Energy',
]);

const POLYGON_FACILITY_BUFFER_METERS = 25;
// GSA publishes buildings as POINTS, not footprints, so this radius is standing in for a building
// outline. It was 60m, which in a dense city is most of a block: verified 2026-08-29 that a 60m
// radius blocked ordinary residential points in Tribeca NYC, the Chicago Loop and SF Civic Center.
// Condo/multifamily is a property type this product explicitly supports, so that was rejecting a
// core segment. 25m still covers the building the point sits on without reaching its neighbours.
const POINT_FACILITY_BUFFER_METERS = 25;
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
  // GSA LEASED BUILDINGS (IOLP FeatureServer/1) was a source here and was removed 2026-08-29.
  //
  // A GSA lease is a tenancy, not a place. It records that some federal office rents floors in an
  // ordinary commercial building -- the building is privately owned, the lease turns over, and the
  // apartment next door is in no sense a federal facility. Blocking on it was rejecting real
  // residential addresses: with the old 60m radius it blocked Tribeca NYC (15 Worth Street) and
  // SF Civic Center (355 McAllister Street), both ordinary residential neighbourhoods.
  //
  // The two error directions here are not symmetric, and this gate should lean toward permitting.
  // A false positive turns away a real buyer and tells them their home is a federal facility --
  // wrong, and it costs the customer. A false negative lets someone generate a research report on
  // a federal office building, which is merely unhelpful. Federal Lands, Military Bases, GSA OWNED
  // buildings and the narrowed PAD-US still block every genuine installation; verified that the
  // White House and Nellis AFB both still block after this removal.
  {
    id: 'protected_areas',
    label: 'PAD-US Protected Areas National (USGS)',
    url: 'https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/PADUS_Protected_Areas_National/FeatureServer/0',
    bufferMeters: PROTECTED_AREA_BUFFER_METERS,
    nameField: 'Unit_Nm',
    agencyField: 'MngNm_Desc',
    blockingAgencies: PADUS_BLOCKING_MANAGERS,
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

    // Every overlapping polygon is considered, not just features[0]. Protected-area boundaries
    // nest and overlap -- a point can sit inside a tribal statistical area AND a military
    // installation at once -- so taking the first feature would let the blocking one hide behind
    // whichever the service happened to return first.
    const hits = features
      .map((f: any) => f?.attributes || {})
      .filter((attrs: any) => {
        if (!source.blockingAgencies) return true;
        const agency = source.agencyField ? attrs[source.agencyField] : undefined;
        return typeof agency === 'string' && source.blockingAgencies.has(agency);
      });

    if (hits.length === 0) return { ok: true, matched: false };
    const attrs = hits[0];
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
 * a federal land parcel, military base, GSA-owned building, or a blocking-category protected area.
 * Calls: 4 ArcGIS FeatureServer point-in-polygon/point-in-radius queries in parallel -- Esri
 * Living Atlas USA Federal Lands, US DOT/BTS NTAD Military Bases, Esri-hosted GSA IOLP owned
 * buildings, and USGS PAD-US Protected Areas National (Defense/Energy managers only).
 * GSA LEASED buildings were removed as a source on 2026-08-29 -- see FACILITY_SOURCES.
 * On failure: returns { passed: false, code, message, matchedFacility? } -- never throws.
 * Fails closed on: a match from any source (blocks), OR any source's query erroring/timing out
 * (blocks as "temporarily unavailable" even if other sources came back clear -- an inconclusive
 * result from any single source is treated as not-yet-cleared, not as a pass).
 */
export async function validateLayer2(lat: number, lon: number): Promise<Layer2Result> {
  // One retry per source before an inconclusive result is allowed to block the address.
  //
  // A reader reported being told his home was a "Government Facility" on an address that passes
  // this check on any other attempt. Layer 2 fails closed if ANY of the four sources errors, and
  // one of them is much slower than the rest: measured at his coordinates, NTAD Military Bases
  // averaged 1.7s and peaked at 7.1s against this module's 8s timeout, while the other three all
  // returned in under a second. So the gate was intermittently aborting on that one source and
  // blocking a residential address that nothing had actually matched.
  //
  // Retrying only the sources that came back inconclusive keeps the fail-closed guarantee intact
  // -- a source that fails twice still blocks -- while removing the single-timeout coin flip. It
  // costs nothing on the normal path, where no source is retried at all.
  let outcomes = await Promise.all(FACILITY_SOURCES.map((s) => queryFacilitySource(s, lat, lon)));
  if (outcomes.some((o) => !o.ok)) {
    outcomes = await Promise.all(
      outcomes.map((o, i) => (o.ok ? o : queryFacilitySource(FACILITY_SOURCES[i], lat, lon)))
    );
  }

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
// LAYER 3 -- Requester-Declared Property Type
// ---------------------------------------------------------------------------
// BeforeRegret does not have a real, legally-cleared county assessor data integration anywhere
// (see Task 1 audit -- the previous "assessor lookup" was entirely fabricated, and a follow-up
// evaluation of free/open county parcel data found real candidates but none with an
// independently confirmed commercial-use license reachable without per-jurisdiction legal
// review, which doesn't scale for a small team).
//
// Rather than either blocking every address (safe but non-functional) or silently guessing
// residential from unreliable signals (re-introducing the original fabrication problem --
// tested empirically: OSM's "house" type tag alone false-positives on real commercial
// buildings), this layer requires the person requesting the report to explicitly declare the
// property type, and is honest everywhere in the product that this field is self-reported, not
// independently verified by BeforeRegret. This is a deliberate, disclosed trade-off, not a
// hidden one -- see docs/ADDRESS_VALIDATION_GATE.md.

export interface Layer3Result {
  passed: boolean;
  code: string;
  message: string;
  promptForUnit?: boolean;
}

export type DeclaredPropertyType = 'single_family' | 'condo_or_multifamily' | 'other';

/**
 * Checks: the property type as declared by the requester (there is no external data source to
 * check it against -- see module comment above).
 * Calls: no external API.
 * On failure: returns { passed: false, code, message, promptForUnit? } -- never throws.
 * Fails closed on: no declaration provided, an unrecognized declared type, "other" (a type this
 * product doesn't support), or "condo/multifamily" without a specific unit number (prompts for
 * one rather than passing or failing outright). Never defaults a missing or unrecognized
 * declaration to "residential."
 */
export function validateLayer3(
  declaredPropertyType: DeclaredPropertyType | undefined | null,
  unitNumber: string | undefined | null
): Layer3Result {
  if (!declaredPropertyType) {
    return {
      passed: false,
      code: 'L3_DECLARATION_REQUIRED',
      message: 'Please tell us what type of property this is before generating a report.',
    };
  }

  if (declaredPropertyType === 'single_family') {
    return {
      passed: true,
      code: 'L3_DECLARED_SINGLE_FAMILY',
      message: 'Property type as provided by the requester: single-family home. Not independently verified by BeforeRegret.',
    };
  }

  if (declaredPropertyType === 'condo_or_multifamily') {
    if (!unitNumber || !unitNumber.trim()) {
      return {
        passed: false,
        code: 'L3_UNIT_REQUIRED',
        message: 'Please enter a specific unit number (e.g., #705) for this building.',
        promptForUnit: true,
      };
    }
    return {
      passed: true,
      code: 'L3_DECLARED_CONDO_MULTIFAMILY',
      message: 'Property type as provided by the requester: condo/multifamily unit. Not independently verified by BeforeRegret.',
    };
  }

  // declaredPropertyType === 'other', or any unrecognized value -- fail closed.
  return {
    passed: false,
    code: 'L3_UNSUPPORTED_PROPERTY_TYPE',
    message: "BeforeRegret doesn't yet support this property type. We currently cover single-family homes and condo/multifamily units with a specific unit number.",
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface AddressGateResult {
  canGenerateReport: boolean;
  blockedAtLayer: 1 | 2 | 3 | null;
  message: string;
  promptForUnit?: boolean;
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
export async function runAddressGate(
  rawAddress: string,
  city: string,
  state: string,
  declaredPropertyType?: DeclaredPropertyType | null,
  unitNumber?: string | null
): Promise<AddressGateResult> {
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

  const layer3 = validateLayer3(declaredPropertyType, unitNumber);
  if (!layer3.passed) {
    return {
      canGenerateReport: false,
      blockedAtLayer: 3,
      message: layer3.message,
      promptForUnit: layer3.promptForUnit,
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
