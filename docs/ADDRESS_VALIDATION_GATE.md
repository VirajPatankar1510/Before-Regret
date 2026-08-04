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

### Layer 3 — Requester-declared property type

**BeforeRegret has no real, legally-cleared county assessor data integration for any
jurisdiction.** Every prior "assessor lookup" was fabricated (hardcoded parcel IDs, fake success
logs for API calls that never happened; see the Task 1 audit in project history). A follow-up
evaluation of free/open county parcel data (ChatGPT deep research, independently re-verified
against live endpoints) found real candidates with genuinely useful fields — e.g. Cook County,
IL publishes a live, current `class` code (vacant/residential/multifamily/exempt) plus a real
building/improvement-value field — but no commercially-licensed jurisdiction that could be
confirmed without per-county legal review, which doesn't scale for a small team. A separate
attempt to auto-detect property type from geocoder metadata alone (OSM `type`/`class` tags) was
also tested and rejected: verified empirically that real commercial buildings frequently get the
same generic `house` tag as real homes, so it isn't reliable enough to trust as a hard gate.

**Current design: the requester declares the property type directly.** `validateLayer3()` takes
a `declaredPropertyType` (`single_family` / `condo_or_multifamily` / `other`) and, for
condo/multifamily, a `unitNumber`. There is no external data source to check the declaration
against, so this is not "verification" in the sense Layers 1–2 are — it's an explicit, disclosed
trade-off: single-family and condo-with-unit declarations pass, `other` and missing declarations
fail closed, and every report is labeled that this field is self-reported, not independently
verified by BeforeRegret (see `Layer3Result.message`). The frontend also shows a **non-blocking**
warning (`looksCommercial()` in `AddressSearchBox.tsx`) when geocoder metadata suggests a
business address — a nudge to double-check, not a gate, since that signal isn't reliable enough
to block on (see above).

**Do not replace this with silent auto-detection from unverified signals** — that's the original
fabrication problem this gate exists to remove, just moved one layer down.

## Onboarding a real jurisdiction (upgrading Layer 3 later)

When there's time/budget to properly clear a jurisdiction (a licensed data vendor, or a county
whose open-data license is confirmed in writing to permit commercial reuse):

1. Secure a real, legally-cleared assessor data source. Confirm the license explicitly, in
   writing — don't rely on an AI-generated research summary's citation without independently
   checking it (a real example from this project: a research report cited a CC0 license for a
   Cook County dataset that could not be found anywhere in that dataset's actual metadata or
   Cook County's terms of use when checked directly).
2. Design `validateLayer3()`'s real classification logic against that API's actual response
   shape, and test it against real data for that jurisdiction specifically — don't extend the
   self-declaration model with unverified guesses.
3. Once a jurisdiction has real backing data, it can replace or supplement the self-declaration
   for addresses in that jurisdiction specifically (e.g. skip asking the question when a real
   answer is available) — this can be introduced incrementally, jurisdiction by jurisdiction,
   without needing to solve every US county at once.

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
