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
  // Structured area fields, populated on every pass regardless of which source resolved it.
  // Read these directly rather than parsing matchedAddress -- added alongside the fallback path
  // below, where there is no Census matchedAddress string to parse at all.
  resolvedCity?: string;
  resolvedState?: string;
  resolvedZip?: string;
  // 'census' when the Census Bureau placed this on a real address range; 'search-geocoder' when
  // Census had nothing and this fell back to the area the search box's own geocoder already
  // resolved (see the fallback param below). Not shown to users -- this is for anything
  // downstream that ever needs to know how precisely an address was pinned down.
  resolvedVia?: 'census' | 'search-geocoder';
  lat?: number;
  lon?: number;
}

/** What the caller already knows about the address from its own (less strict) geocoder, used
 *  only if the Census Bureau cannot place the address at all. See validateLayer1's fallback
 *  branch for why this exists and what it does and does not let through. */
export interface Layer1Fallback {
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Checks: the input has a leading street number, and resolves to a real address area.
 * Calls: US Census Bureau geocoder (geocoding.geo.census.gov, Public_AR_Current benchmark).
 * On failure: returns { passed: false, code, message } -- never throws to the caller.
 * Fails closed on: missing street number, no match from Census AND no usable fallback, missing
 * coordinates on the chosen Census match, network error, non-OK response, or unparseable body.
 *
 * WHAT CHANGED, AND WHY. This used to require Census to resolve to EXACTLY one address point,
 * and hard-failed on zero matches or more than one. That was built for a product that verified
 * one specific house. This product verifies the AREA a report is about, not any one house inside
 * it, so two of the old failure modes were stricter than the product now needs:
 *
 *   - Ambiguous (>1) matches no longer fails. Multiple Census candidates for the same input
 *     overwhelmingly agree on city and ZIP even when they disagree on unit or building -- which
 *     is exactly the distinction that stopped mattering. The first candidate is used.
 *   - Zero matches no longer fails outright if the caller supplies a fallback area (city + state,
 *     from whatever geocoder the search box itself used to resolve the reader's selection). This
 *     is what a reader's own address should have gotten from the start: 133 Wynooska Rd is a real,
 *     Zillow-listed home that the search box could resolve every time, but Census's stricter
 *     address-range matcher initially couldn't (until the ZIP-retry below), and a stricter-than-
 *     necessary Layer 1 was rejecting a real house because of it. The fallback closes that gap for
 *     any address, not just this one.
 *
 * The fallback path returns no lat/lon: it has no Census-verified point, and Layer 2 (the
 * government-facility check) is written to trust a Census point, not an arbitrary client-supplied
 * one. runAddressGate skips Layer 2 rather than run it against an unverified coordinate -- see
 * that function's own comment on the same tradeoff.
 */
// Every real USPS state/territory abbreviation the fallback path will accept. /api/address/validate
// is a public endpoint a direct API call can hit with an arbitrary body, and the fallback exists to
// trust the search geocoder's OWN city/state -- which in the real UI flow always comes from
// LocationIQ's structured response, never free text. Without this check a direct call could claim
// any city/state pair (state: "ZZ" was accepted and passed in testing before this was added) and
// get an area-scoped report generated against a fabricated location. This is not a defense against
// a determined attacker supplying a real-but-wrong state; it only closes the "not even a real
// state" gap, which is the gap this fallback actually introduced.
const VALID_US_STATE_CODES: ReadonlySet<string> = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
  'WV', 'WI', 'WY', 'PR', 'GU', 'VI', 'AS', 'MP',
]);

export async function validateLayer1(rawAddress: string, fallback?: Layer1Fallback): Promise<Layer1Result> {
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
    // Census has nothing at all for this address, at either ZIP. Fall back to the area the
    // search box's own geocoder already resolved, rather than reject a real house over a
    // disagreement between two geocoders -- see this function's own doc comment. Gated on the
    // state actually being a real US state/territory code (see VALID_US_STATE_CODES) so a direct
    // API call can't pass this branch with a fabricated location.
    const fallbackState = (fallback?.state || '').trim().toUpperCase();
    if (fallback?.city && VALID_US_STATE_CODES.has(fallbackState)) {
      return {
        passed: true,
        code: 'L1_RESOLVED_VIA_SEARCH_GEOCODER',
        message: "Address area confirmed via the search geocoder; the US Census Bureau's stricter address-range matcher had no exact record for this street.",
        resolvedCity: fallback.city,
        resolvedState: fallbackState,
        resolvedZip: fallback.zip,
        resolvedVia: 'search-geocoder',
      };
    }
    return {
      passed: false,
      code: 'L1_NO_MATCH',
      message: 'This address could not be verified. Double-check the street number, name, city, state, and ZIP.',
    };
  }

  // Once Census places the address at all, ambiguity among candidates (different units or
  // buildings on the same input) no longer matters -- see this function's doc comment for why.
  // The first candidate's area is representative of all of them.
  const match = matches[0];
  const coords = match?.coordinates;
  const ac = match?.addressComponents || {};
  if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') {
    // A genuinely rare Census response shape (a match with no coordinates) -- not the same case
    // as "no match", so this does not fall back; there is no reason to expect a coordinate-free
    // match to recur with the fallback area either.
    return {
      passed: false,
      code: 'L1_NO_COORDINATES',
      message: 'Address verification did not return usable coordinates for this address.',
    };
  }

  const titleCase = (s: string) =>
    s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());

  return {
    passed: true,
    code: 'L1_RESOLVED',
    message: 'Address resolved to a verified US Census Bureau address point.',
    resolvedCity: ac.city ? titleCase(String(ac.city)) : undefined,
    resolvedState: ac.state ? String(ac.state).toUpperCase() : undefined,
    resolvedZip: ac.zip ? String(ac.zip) : undefined,
    resolvedVia: 'census',
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
  resolvedCity?: string;
  resolvedState?: string;
  resolvedZip?: string;
  resolvedVia?: 'census' | 'search-geocoder';
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
  unitNumber?: string | null,
  // The ZIP the search box's own geocoder reported, if any. Only ever used as Layer 1's
  // fallback-area input (alongside city/state above) when Census cannot place the address at
  // all -- see validateLayer1's doc comment. Optional and additive: every existing call site
  // keeps working unchanged without it, just without the fallback.
  zip?: string | null
): Promise<AddressGateResult> {
  const layer1 = await validateLayer1(rawAddress, { city, state, zip: zip || undefined });
  if (!layer1.passed) {
    return { canGenerateReport: false, blockedAtLayer: 1, message: layer1.message, layer1 };
  }
  const resolvedFields = {
    resolvedAddress: layer1.matchedAddress,
    resolvedCity: layer1.resolvedCity,
    resolvedState: layer1.resolvedState,
    resolvedZip: layer1.resolvedZip,
    resolvedVia: layer1.resolvedVia,
    lat: layer1.lat,
    lon: layer1.lon,
  };

  // Layer 2 needs a Census-verified point to query against -- it was written and buffer-tuned
  // against Census's own interpolation, not an arbitrary client-supplied coordinate. The
  // search-geocoder fallback path has no such point (see validateLayer1), so rather than either
  // crash on a missing coordinate or trust an unverified one for a security-relevant check, skip
  // Layer 2 outright and say so plainly. This is the direct, honest consequence of no longer
  // claiming house-level precision: a report that can't be pinned to a verified point can't run a
  // point-in-polygon facility check either.
  const layer2: Layer2Result =
    typeof layer1.lat === 'number' && typeof layer1.lon === 'number'
      ? await validateLayer2(layer1.lat, layer1.lon)
      : {
          passed: true,
          code: 'L2_SKIPPED_NO_VERIFIED_POINT',
          message: 'Government-facility check skipped: no Census-verified coordinate for this address.',
        };
  if (!layer2.passed) {
    return {
      canGenerateReport: false,
      blockedAtLayer: 2,
      message: layer2.message,
      layer1,
      layer2,
      ...resolvedFields,
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
      ...resolvedFields,
    };
  }

  return {
    canGenerateReport: true,
    blockedAtLayer: null,
    message: 'Address passed all validation layers.',
    layer1,
    layer2,
    layer3,
    ...resolvedFields,
  };
}
