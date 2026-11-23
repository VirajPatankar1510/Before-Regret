---
meta: Search City of Phoenix building permits for a house: which of the two city searches holds which years, and why an EXPR status doesn't mean the work failed.
quick:
---
# City of Phoenix Permit Search: PDD Online and SHAPE PHX

A house inside Phoenix city limits has its permit history split across two city searches, and neither needs an account. Older records live in the [PDD Online permit search](https://apps-secure.phoenix.gov/PDD/Search/Permits). Newer ones live in SHAPE PHX, whose own search page says it is "limited to Shape PHX records entered as of June 6, 2022". Search both for the same address, then open the inspection history on anything that matters to you. The status column on its own will mislead you.

## Which search holds which work

| When the work was permitted | Search here | What we saw on 2026-11-23 |
|---|---|---|
| Before June 6, 2022 | PDD Online | 915 records at City Hall's address, oldest issued 12/06/1993 |
| From June 6, 2022 | SHAPE PHX, Data / Reports, category Permit | 647 results at the same address |
| New single-family permits from April 27, 2026 | SHAPE PHX | The city's SHAPE PHX page lists them |

The line between the two isn't perfectly clean. SHAPE PHX also returned records issued in 2019 and 2020, so some older permits were carried over. That's the practical reason to run the address in both places instead of guessing which one a given job landed in.

The SHAPE PHX page puts the newest home permits there: "Effective April 27, 2026 - You can now visit the SHAPE PHX portal for access to NEW Commercial Plan Review and Inspections permits", and the list under it includes single-family residential permits and inspections. If the seller remodeled this year, that work is in SHAPE PHX, not PDD Online.

## Is the house in the City of Phoenix at all?

PDD Online and SHAPE PHX cover City of Phoenix permits only. By our count from Census data, the city holds 653,065 homes, 34.7% of the housing in Maricopa County. The other two-thirds are in other cities, towns or unincorporated county land, each with its own records. If an address search comes back empty in both city tools, check the jurisdiction before you read anything into it. Our [Maricopa County permit guide](/guides/check-building-permits-maricopa-county-az/) covers the county's own search and the other cities.

## An EXPR status doesn't mean the work never passed

A Phoenix permit marked EXPR on the PDD Online results list is easy to read as expired and never finished, and that's the trap we'd warn a friend about. The permit's own inspection history doesn't always agree with that reading.

We opened permit OE-94023192, issued 11/07/1994 at City Hall's address, status EXPR. Its inspection history tells a different story: a final electrical visit on 08/06/1996 got no access, the next one on 09/19/1996 failed, and the final electrical passed on 10/09/1996.

![PDD Online inspection history for permit OE-94023192 showing NO ACCESS on 08/06/1996, FAIL on 09/19/1996 and PASS on 10/09/1996 for the final electrical inspection; inspector names removed](/images/phoenix-pdd-expired-permit-passed-final.webp "Our screenshot, 2026-11-23. Names removed by us.")

The opposite also happens. Another EXPR permit from the same year, ELEC-94011014, opened to an empty inspection history. That one tells you nothing either way, which is exactly when to ask the seller or the city.

For any Phoenix permit that matters to the house, such as a roof, an addition, a pool, a panel or a water heater, click Inspection History and look for a passed final. The status column is a starting point. The final inspection is the evidence.

## Search habits that stop you missing records

**Leave the dates alone in PDD Online.** The Start Date and End Date boxes come pre-filled with the last 30 days, and they look like they'd limit your search. They sit inside the Solar, Green and Adaptive Re-use section. With the dates left at 10/24/2026 to 11/23/2026, our address search still returned all 915 records.

**Turn on "Show temps" once.** It defaults to No. The page explains that "Clicking 'Yes' will include temporary/unissued permits in the results along with the issued permits." An application that was never issued is worth knowing about: it can mean work was planned, priced and then done some other way.

**Check every address in a SHAPE PHX result.** We typed house number 200 on West Washington and the results included 2002 W Washington St. The number box matched a longer house number. Before you count a permit as this house's, read its address column.

**Use the wildcard in PDD Online.** The search says "A wildcard search character (*) may be used to replace any character in the search field." If a street name has a spelling you're unsure of, a partial name with * catches the variants.

**Narrow a big SHAPE PHX search.** It says "Search results will show the first 50,000 records." A single house won't hit that, but a vague street-only search can.

## What the records can and can't tell you

A Phoenix permit record names the permit type, the issue date, the contractor and, for many permits, every inspection visit. That's enough to answer the buyer's real question: was this work inspected and passed? It can't tell you about work nobody applied for. An empty history means no record was found, not that the house is clean. Our guide to [finding unpermitted work before buying](/guides/find-unpermitted-work-before-buying/) covers what to look for on site, and if you find a permit that was opened and never closed, [resolving open permits before closing](/guides/resolve-open-building-permits-before-closing/) explains who usually fixes it and when.

Age matters here too. By our Census count, the median Phoenix home was built in 1985, and 72.2% were built before 2000. Plenty of houses have had decades of re-roofs, panel swaps and water heaters, and each one of those is a record worth finding.

For anything you can't find online, ask the Planning and Development Department's Records team, on 602-262-7800 or pdd.records@phoenix.gov. You don't need to be the owner to ask. Arizona Revised Statutes § 39-121 says "Public records and other matters in the custody of any officer shall be open to inspection by any person at all times during office hours."

## How we checked this

On 2026-11-23 we ran both city searches with no account, from an ordinary browser. We used Phoenix City Hall's public address, 200 W Washington St, because we never search a private home. In PDD Online we left the default dates in place, sorted by issued date, and opened inspection histories on three 1994 permits. In SHAPE PHX we used Data / Reports with the category set to Permit. Many City Hall results there were standard-plan home records, which is a quirk of testing on City Hall, not something you'll see on a house.

We read the city's SHAPE PHX page, the department's contact page and Arizona Revised Statutes § 39-121 the same day. The housing figures are our own computation from the Census Bureau's American Community Survey 2020-2024, tables B25034 and B25035, for Phoenix city and Maricopa County. They are estimates.

What we couldn't confirm: the city doesn't publish a legend for EXPR, DONE and VOID that we found, so we've described what the records showed rather than defining them. And the oldest record at one address isn't the start date of the system. Older permits may exist on paper or film, and the Records team is who to ask.
