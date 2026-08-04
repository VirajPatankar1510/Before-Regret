# Residential-Only Address Validation Gate

Implementation: [`src/engine/geoValidationGate.ts`](../src/engine/geoValidationGate.ts)

This is the system that decides whether BeforeRegret will generate a report for a submitted
address. It replaced an earlier implementation that only *looked* like it checked government
records — hardcoded keyword matching on the address string, a client-side heuristic guessing
from OpenStreetMap tags, and fabricated "assessor API" log lines for calls that never happened.
None of that is in the codebase anymore. Everything described below calls a real, live API.

Every layer **fails closed**: a network error, timeout, ambiguous result, or missing data source
blocks the address rather than letting it through.

## The three layers

### Layer 1 — Address format & resolution (US Census Bureau Geocoder)

Calls `geocoding.geo.census.gov` — free, no API key, public domain. Rejects addresses with no
leading street number, addresses the geocoder can't match, and ambiguous multi-match results.

This is the primary resolver instead of Nominatim/OpenStreetMap (which the map UI still uses for
display purposes, e.g. reverse-geocoding a pin drop into a readable address) because Nominatim's
usage policy prohibits the kind of unthrottled production traffic a paid product generates
against its free public endpoint, and it isn't built to be strict about "is this a real
addressable location" the way the Census address-range geocoder is.

### Layer 2 — Federal / government facility & protected-area exclusion

**Important:** the HIFLD Open portal this feature was originally specified against
(`hifld-geoplatform.hub.arcgis.com`) was decommissioned by DHS on **2025-08-26** and no longer
serves data. There is no official government successor portal. This layer instead queries four
independently-hosted, still-live, officially-sourced ArcGIS FeatureServer layers:

| Source | Publisher | What it catches |
| --- | --- | --- |
| USA Federal Lands | Esri Living Atlas (NPS/BLM/USFS/FWS data) | Federal land parcels — verified to correctly cover the White House *and* South Drive, an unnumbered interior road on the same grounds |
| NTAD Military Bases | US DOT / Bureau of Transportation Statistics | Military installations |
| GSA Owned + Leased Buildings | Esri's hosted copy of GSA's own IOLP inventory | Standalone federal office buildings not on a dedicated federal land parcel |
| PAD-US Protected Areas National | USGS | Parks, wildlife refuges, national monuments |

A match on any source blocks the address. Point-in-polygon queries use empirically calibrated
buffers to absorb Census's street-interpolated coordinate imprecision — 25m for
facility/land polygons, 60m for GSA's point-based building records, 0m for protected areas
(their boundaries run alongside too many ordinary residential lots for any buffer to be safe —
verified against a real false positive near a public park before landing on 0m). See the buffer
comment block in `geoValidationGate.ts` for the calibration data.

### Layer 3 — County assessor / supported jurisdictions

**No jurisdiction is currently supported.** `SUPPORTED_JURISDICTIONS` in
`geoValidationGate.ts` is an empty array. BeforeRegret does not have a real, legally-cleared
county assessor data integration anywhere — every prior "assessor lookup" was fabricated
(hardcoded parcel IDs, fake success logs for API calls that never happened; see the Task 1 audit
in project history). Building a per-county scraper raises data-licensing/ToS questions that
haven't been resolved yet (a licensed aggregator such as ATTOM, CoreLogic, or Regrid was
discussed as the likely path forward, versus direct county-by-county integration).

**Practical consequence: Layer 3 blocks every address today**, honestly, with "BeforeRegret
doesn't yet cover this area. We're expanding — check back soon." This means no report can
currently be generated for any address, including legitimate single-family homes, until at least
one jurisdiction has a real backing data source.

This layer intentionally does **not** contain parcel-level classification logic (vacant-land
detection, unit-number prompting for condos/mixed-use, commercial-vs-residential distinctions).
That was built once, then deliberately removed — it was unverified against any real assessor
API's actual shape, sitting in the codebase for a data source that didn't exist, adding
unnecessary risk surface for zero current benefit. **When a real jurisdiction is onboarded,
design that classification logic against the real API's actual response shape and test it
against real data — don't rebuild it speculatively in advance.**

## Onboarding a jurisdiction

1. Secure a real, legally-cleared assessor data source for the county (direct API, licensed
   aggregator, or equivalent). Do not add an entry to `SUPPORTED_JURISDICTIONS` without one —
   that would re-introduce the exact fabrication problem this gate exists to remove.
2. Add the jurisdiction to `SUPPORTED_JURISDICTIONS` in `geoValidationGate.ts`.
3. Implement the real classification logic inside `validateLayer3()`, designed against that
   API's actual response shape, and test it against real responses (not synthetic examples).

## Where this is enforced

- `POST /api/address/validate` (`server.ts`) — used by the map/search UI for real-time
  feedback; disables pin confirmation and the "Get Report" button until the gate passes.
- `POST /api/property/generate-report` (`server.ts`) — runs the same gate **synchronously and
  independently** before generating any report content. This is the check that actually matters:
  it closes the gap where the backend previously trusted whatever the frontend map UI decided
  (or trusted nothing at all, if the endpoint was called directly), which meant a bypassed or
  stale frontend check — or simply calling the API directly — could previously produce a full
  report for a non-residential, unresolvable, or unsupported-jurisdiction address regardless of
  what the map showed.

## Verification

Layers 1 and 2 were verified against live API responses for all 9 addresses in the original
audit plus 5 real single-family addresses across 5 states (zero false positives, zero false
negatives) — see the Task 2 and Task 6 audit reports from project history for the full
address-by-address results. This sandbox had no Node/npm runtime available, so verification was
done by executing the same logic against the same live APIs the TypeScript code calls, not by
running `server.ts` itself — run `npm run dev` and click through the map UI once to confirm the
wiring end-to-end before deploying.
