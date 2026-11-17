# Permit Records Finder: plan and owner conditions (2026-11-17)

The owner approved both decisions on 2026-11-17 and said they prefer this to generating dozens of county pages.

## Decision 1 (approved): a national database, built internally now

Location and tools:
- **Data:** `data/permit-records/<state>/<countyFips>-<name>.json`, one file per county, holding every permitting jurisdiction in it. The schema is national from day one.
- **Schema:** `src/data/permitRecords/schema.ts`.
- **Validator:** `npx tsx scripts/validate-permit-records.ts`. With `--queue` it lists what to research or re-check next.
- **Generators:** `scripts/permit-records/build-pinellas.ts` maps Pinellas ledger facts to fields. `scripts/permit-records/build-from-guide-notes.ts` builds the counties whose evidence is a dated script note. Collier was written by hand from its ledger and test.

### Owner's rules, as enforced in code

- **Verification is recorded per field, never per county.** Each important field carries:
  - status;
  - value;
  - source URL;
  - evidence reference;
  - last-checked date.
- **Status labels** (owner's wording, in `STATUS_LABEL` / `STATUS_MEANING`):

| Label | Meaning |
|---|---|
| Verified | Confirmed using an official source or actual test. |
| Partially verified | Some information confirmed, but limitations remain. The validator requires the limits to be stated. |
| Not tested | The portal capability has not been independently tested. Only allowed on capability fields, and it needs a reason. |
| Outdated | Previously verified, but requires another check. |
| Not researched | No reliable information collected yet. |

- **"Not tested" never means unavailable, and "not researched" never means no records.** Both carry `value: null`, so nothing can be shown except the status itself.
- **Evidence must resolve.** The validator follows every reference to a real ledger fact, test, quote or dated script line. A ledger fact read after the check date fails. A script line that doesn't mention verification fails. A sourceUrl on a different host from its ledger facts fails.
- **Outdated is automatic.** A verified field older than `REVERIFY_AFTER_DAYS` (180, our choice, not the owner's) is shown as Outdated.
- **A city served by another department stores only a pointer** (`permitsIssuedBy`). The portal facts live once, on the issuing jurisdiction.
- **Claims a published guide makes without recorded evidence** go in `unverifiedClaim` on a "not researched" field. That is the re-verification queue, never displayed.

### First population (2026-11-17), from the 24 existing county guides

The plan said "about 30"; the real count is 24 county and city guides. The other permit pages are topic guides.

| Evidence level | Counties |
|---|---|
| Fact ledger + our own portal test | Collier, Pinellas |
| Dated browser-verification note in our scripts | Hillsborough + Tampa (2026-10-02/04), Harris (2026-10-02), Brooklyn LPC / Broward / Santa Clara (2026-10-03), Fort Worth (2026-10-04), Sacramento (2026-10-07) |
| Link answered on two runs, no quote kept, so **partially verified** | Maricopa, San Diego, Clark (2026-09-04) |
| No recorded evidence, so **not researched** (title kept as a claim) | Los Angeles, Orange CA, Riverside, San Bernardino, Miami-Dade, Dallas, Cook, Philadelphia, Middlesex; NYC DOB for all four boroughs |

Totals: 24 county files and 54 jurisdictions. Pinellas alone has 25, from the county's own list of building departments.

**Found while building it:** `publish-batch-b.ts:38` says the NYC DOB walkthrough was verified for batch A, but batch A's own note says DOB answered "Access Denied". DOB is recorded as not researched.

### Browser re-verification (2026-11-17)

The owner said yes to re-checking the guides that had no recorded evidence. Each one now has a fact ledger in `data/fact-ledgers/`. Verified fields are out of the total fields recorded.

| County | Verified | What we found |
|---|---|---|
| Los Angeles | 7/17 | EPIC-LA public search works without a login. The county lists 5 contract cities but its text says 8. ladbs.org (City of LA) returns 403, so nothing for the City of LA. |
| Cook | 12/22 | The county's permit status search needs both the permit number and the PIN, so there is **no search by address** for unincorporated Cook. Chicago's online data covers 2006 on. |
| Miami-Dade | 7/15 | The county publishes which years have plans on file, including years with none (e.g. single-family 1961–1972). Its permit menu has a reCAPTCHA, so no search was run. The guide's "EnerGov" title does not match the county system. |
| Philadelphia | 7/11 | Atlas and L&I Property History search by address with no login and show inspection results. At two public buildings, online permits start in **2007**. |
| Dallas | 6/12 | The department is now "Planning and Development" and the portal is DallasNow (Accela). General Search defaults to a 12/05/2015 start date, and an address search lists only the newest 100 records. Dallas County's site was not approved for our browser. |
| Orange CA | 4/11 | Building and Safety covers unincorporated areas. We found **no public permit-history search**; records come through Permitting Services or a public records request. The old ocpw.ocgov.com hostname no longer resolves. |
| Riverside | 9/11 | The county states records go back to about 1963 (older ones were destroyed) and that permits issued after 1997 are online. Our Permit Lookup test agrees: the earliest issued date is 1997-06-20. Residential plans are not kept. |
| Middlesex | 2/11 | Cambridge only: OpenGov is for applying, and the open data lists only completed applications. No state source was read. |
| NYC (4 boroughs) | 5/11 each | DOB issues permits citywide. Most current permits are in DOB NOW, older jobs in BIS, and the open data splits the two. BIS and DOB NOW are **US-only (HTTP 403)**, so no search was run. |
| San Bernardino | 0 | sbcounty.gov is not approved for our browser. Still not researched. |

The queue (`--queue`) now lists 94 items. It grew from 72 because re-verified fields that are only partly confirmed now carry stated limits.

## Decision 2 (approved): one tool page, no generated county URLs

- **One canonical, indexable URL:** `https://www.beforeregret.com/tools/permit-records-finder/`.
- **Input:** a city, county or ZIP. The input must never be presented as identifying the responsible department.
- **Logic:**
  1. Identify the possible jurisdictions.
  2. Check what is verified for each.
  3. Show all candidate authorities when the boundary is ambiguous.
  4. Explain how to tell which one applies, such as checking city limits.
  5. Show only verified information, each field with its status label.
  6. Where nothing is researched, show the owner's message and link the general guide #286:

  > We haven't researched this jurisdiction yet. That doesn't mean permit records are unavailable. Start with our general guide to finding building permits by address, which explains how to identify the responsible department and request historical records.

- **SEO safeguards:**
  - one indexable URL;
  - no county or city landing pages generated automatically;
  - no indexable query-parameter URLs for individual searches;
  - no duplicate result pages;
  - the researched county guides stay, and they link to the tool.

## Sequence

| When | Work | State |
|---|---|---|
| Now | National schema and internal database | done 2026-11-17 |
| Now | Populate verified information from the existing guides | done: 24 counties, 54 jurisdictions |
| Now | Mark unknown fields honestly | done, enforced by the validator |
| 2026-11-25 | Review the county split test | pending |
| After 11-25 | Build and test the single tool page | not started |
| After launch | Link the existing county guides to the tool | not started, needs owner OK per page |
| Launch + 5 weeks | Google impressions, organic clicks, **and actual lookups tracked separately** | not started |

Tool usage is a product event in its own right, even if organic impressions are low at first (owner).

## Open questions for the tool build

- **ZIP to county** needs a Census ZCTA-to-county relationship file. A ZIP that spans counties must show all of them.
- **City limits:** the Census Geocoder returns incorporated place for an address. That may let the tool narrow the candidates when an address is given. Even then a place is not always the permitting authority, since some cities are served by the county (Everglades City, the six Pinellas cities). The answer must still come from `permitsIssuedBy`.
- **Ads:** whether the result page carries ZIP Report Ads is a separate owner decision.
