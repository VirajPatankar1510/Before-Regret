# Permit question: covering the whole USA (plan, 2026-11-18)

Owner, 2026-11-18: "think of a plan to cover entire USA", approved ("yes"). Serves the permit question in the guided research tool (`docs/plans/guided-research-tool-2026-11.md`) and shares its data with the Permit Records Finder (`docs/plans/permit-records-finder-2026-11.md`). Unpublished until the owner says the whole tool is ready.

## Where we started (2026-11-18)

Permit database: 24 counties, 74 jurisdictions (`data/permit-records/`).

| Level | Jurisdictions |
|---|---|
| Full walkthrough (verified portal + tested address search + online-records start) | 5: unincorporated LA, Riverside and Pinellas counties; Philadelphia; City of Dallas |
| Right office + verified portal link, steps not tested | 15 |
| Who issues permits known, no verified link | 41 |
| Not researched | 13 (incl. Houston, Phoenix, City of Los Angeles, Las Vegas, Miami) |

The county-wide question "which addresses does each office cover" was verified in only 6 counties.

## The fix for "which office": Census boundaries (tested 2026-11-18)

The mailing city on an address is not the city the house is in. Tested on public buildings with the Census geocoder (`geographies` endpoint, layers Incorporated Places, County Subdivisions, Census Designated Places, Counties):

| Public building | Mailing city | Census result |
|---|---|---|
| East LA Library, 4837 E 3rd St | Los Angeles | No incorporated place; East Los Angeles CDP (FUNCSTAT S, statistical) → LA County |
| Kendall Branch Library, 9101 SW 97th Ave | Miami | No incorporated place; Kendall CDP (S) → Miami-Dade County |
| Philadelphia City Hall | Philadelphia | Philadelphia city (A) |
| Clearwater City Hall | Clearwater | Clearwater city (A) |
| Austin City Hall | Austin | Austin city (A) |
| Lexington Town Hall, MA | Lexington | No incorporated place; Lexington town, county subdivision (A) |
| Cherry Hill municipal building, NJ | Cherry Hill | No incorporated place; Cherry Hill township, county subdivision (A) |

The coordinates endpoint (what the tool uses) returned the same for the East LA Library point.

**Rule:** active incorporated place (FUNCSTAT A) → that municipality; else active county subdivision (FUNCSTAT A: New England towns, townships) → that town or township; else → the county. Census Designated Places (FUNCSTAT S) are statistical and never a government. Limits: boundaries lag annexations; the rule names the *government*, not who actually runs permits (some towns contract the county or a private agency), so the tool says "most likely, confirm by phone" until the jurisdiction is verified.

## Layers

| Layer | What every buyer in it gets | How | Size |
|---|---|---|---|
| 0. Every US address | The office named by the Census rule, labelled as the likely office; what to search for, what to ask the seller, what to do if nothing is online | The rule above; no per-place research | Every Census-matched address |
| 1. Every state | Who has building-code authority (do counties permit outside cities, state-run trade permits, third-party inspectors), the state public-records law for older permits | One browser-verified fact sheet per state, same method as the state licence set | 51 |
| 2. Common portal software | Step-by-step for the platform (Accela, Tyler EnerGov, eTRAKiT, others) | One verified walkthrough per platform, then confirm each jurisdiction's link | A handful + link checks |
| 3. Biggest places, deep | Full walkthrough | Rank jurisdictions by housing units (Census, computed by us); weekly batches; first the 15 half-done, then Houston, Phoenix, City of Los Angeles | Batches |
| 4. Live permit data | "Permits on file for this address" | Only where a city publishes permit open data we've checked; show type, date and status only, never owner names; store nothing | **Owner decision** |
| Upkeep | Links that keep working | Monthly link check (like Permit Pulse) + "Did this work?" with no personal data | Ongoing |

**Measure:** share of US housing units at each level, from Census housing-unit counts per place, county subdivision and county remainder. Needs Census reference files (ask the owner before downloading).

## Build order

1. Layer 0 in the tool (Census office lookup + general route) and the 24 database counties on top. **Built 2026-11-18 on the branch:**
   `POST /api/research/permit-office` (coordinates → Census → `authorityFromCensus`, `src/data/permitRecords/authority.ts`);
   `scripts/build-permit-index.ts` → `src/data/permitRecords/permitIndex.json` (verified values only, runs in `npm run build`);
   matcher `src/components/research/permitAnswer.ts`; screens `src/components/research/PermitView.tsx`.
   Matching tested on 10 public buildings (East LA, Kendall, Philadelphia, Clearwater, Dallas, Brooklyn, Naples, Houston, Lexington, Austin): all correct; unmatched names fall back to the general route, never a guessed office.
   Rule kept: only a fully verified "online records start" is repeated in answers and the report.
2. Layer 1, state by state. **Texas pilot built 2026-11-18 on the branch:**
   sheet `data/permit-states/tx.json` (schema `StateSheet` in `src/data/permitRecords/schema.ts`, same Field status rules),
   ledger `data/fact-ledgers/permit-state-tx.json` (Local Government Code ch. 233 subchapter F; Government Code ch. 552, quoted),
   checked by `validate-permit-records.ts` and carried into `permitIndex.json` (`states`).
   Fields: `outsideCityLimits` + `outsideCityJobs` + `nearCityLimits` (addresses Census puts outside any city or town),
   `olderRecordsLaw` (every address in the state). Shown on the "where to look" screen; the verified outside-city lines
   also replace the generic "no permit found" answer (full note for an addition or "any work", one line for a single job).
   Tested on the Barbara Bush Branch Library (unincorporated Harris County) and Austin City Hall (city: law note only).
   Cut for lack of a source: "Texas counties don't issue building permits" (Harris does, under other law), which counties
   opted in, and how far city codes reach into the ETJ (ch. 212 and the 2023 ETJ changes not read yet).
   Next states, by the same method: the other states in the database (CA, FL, AZ, NV, IL, NY, PA, MA), then the rest.
3. Layer 3 batches; Layer 2 once two or more jurisdictions share a platform walkthrough.
4. Layer 4 only on the owner's OK.
