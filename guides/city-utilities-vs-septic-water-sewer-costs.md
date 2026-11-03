---
meta: How to tell before you offer whether a house is on city sewer and water or on septic and a well, why owners often get it wrong, and what each one costs.
quick:
---
# City Utilities vs Septic: Don't Be Surprised by Water & Sewer Costs

Plenty of people living in a house don't know whether it's on city sewer or a septic tank. In 2023 the Census Bureau checked survey answers in Florida against the state's own records. Among homes the records listed as septic, between 46.0% and 59.6% of the people living there had told the survey they were on public sewer. Even among owners it was 36.0% to 50.9%. So when a seller or a listing says "city sewer", it's worth checking for yourself.

It matters because the two come with different bills, different maintenance and, in some places, a connection cost waiting down the road.

## How to find out before you make an offer

**Ask for a recent utility bill.** The EPA's own tip is that a house on septic shows "a $0.00 charge for wastewater or sewer services on your utility bill", or gets no sewer bill at all. A bill also shows what the sewer side costs each month if the house is connected.

**Look at the water meter.** "If the water line into your home does not have a meter attached to it, that usually indicates you have a private well," the EPA says. Water and sewer are separate questions, so check both.

**Check the paperwork.** The deed, building permits and design plans "will likely contain information about the presence (or lack) of a septic system," according to the EPA. The county or city that issues septic permits is the place to ask for those records.

**Walk the yard.** Follow the plumbing outlet out from the house. The EPA describes looking for an access riser, a black or green disc, usually about 10 feet from the building. Houses around it are a clue too: if the neighbours are all on septic, this one likely is.

**Don't count on the general inspection to settle it.** Under the American Society of Home Inspectors' Standard of Practice (section 6.2), the inspector isn't required to inspect a septic system or well, or even to determine whether the water and sewage are public or private. Our guide on [whether a home inspection includes the septic system](/guides/home-inspection-include-septic-system/) covers what to book instead, and [why you shouldn't skip the inspection](/guides/dont-skip-the-home-inspection/) lists the other gaps.

## What Florida's records show

Florida's Department of Health keeps a statewide inventory, the Florida Water Management Inventory, that labels every developed parcel as central sewer or onsite septic, and public water or private well. It's the dataset the Census Bureau used for that comparison. We counted its built residential parcels on 3 November 2026.

| Wastewater label | Parcels | Share |
|---|---|---|
| Known central sewer | 4,119,535 | 56.7% |
| Likely or somewhat likely central sewer | 744,578 | 10.2% |
| Known onsite septic | 792,971 | 10.9% |
| Likely or somewhat likely onsite septic | 913,836 | 12.6% |
| Unknown, no data | 695,278 | 9.6% |

*Source: our tally of 7,269,907 built residential parcels, saved in docs/data/flwmi-wastewater-stats.json. The 0.1% marked undetermined (conflicting data) is left out.*

Two things stand out. About 23.5% of Florida's residential parcels are labelled septic, but only 46.5% of those labels are "known". The rest are the state's best inference. And 56.1% of the labels were last updated in 2016 or earlier.

We also looked up the county courthouse parcel at 2000 Main St in downtown Sarasota, the same public example we used for [finding the year a house was built](/guides/when-was-my-house-built-by-address/). Its drinking water is "Known Public Water", but its sewer is labelled only "Somewhat Likely Central Sewer". If a downtown government complex carries an inferred label, any one house can too. Treat the record as a starting point, and confirm with the utility or the county.

## What each one costs you

**On city sewer and water**, the cost is a monthly charge on the utility bill, which the seller's recent bills will show. The pipe from the house to the street main is another matter. If the house is older, our guide to [what a sewer scope can reveal](/guides/sewer-scope-before-buying-house/) explains why buyers often camera that line before closing. On city water, the utility's public [lead service line inventory](/guides/lead-service-line-lookup-by-address/) tells you what the supply pipe is made of.

**On septic**, there's no sewer bill, but there's a maintenance cycle. The EPA says household tanks are typically pumped every three to five years, and the system should be inspected by a septic professional at least every three years. In many states, the EPA notes, a septic system must be inspected when a property is sold, so ask the seller whether that's happened and get the report.

**When sewer is coming.** This is the cost that surprises people. In Florida, under Florida Statutes § 381.00655, the owner of a working septic system must connect to a public or investor-owned sewer within 365 days of written notice that it's available. The utility has to give notice at least 1 year before sewer becomes available, and the owner can choose to prepay the connection charges in monthly installments over up to 2 years from that first notice. If you're buying a Florida house on septic, ask the seller in writing whether they've had a notice, because the requirement falls on the owner, which would then be you. Other states and cities have their own connection rules, so ask the local utility the same question anywhere.

## Questions to put to the seller

- Is the house on public sewer or septic, and on public water or a well? Can we see a recent utility bill?
- If septic: when was the tank last pumped, and is there an inspection report or permit on file?
- Has the owner received any notice that sewer is coming, or of connection charges?

## How we checked this

- **What we read, on 2 and 3 November 2026:**
  - the Census Bureau working paper comparing American Housing Survey sewage answers with Florida's records (September 2023);
  - the EPA's septic frequently asked questions and its septic care page;
  - section 6.2 of the ASHI Standard of Practice for Home Inspections;
  - the Florida Department of Health's inventory page;
  - Florida Statutes § 381.00655.
- **What we did:**
  - counted the state inventory's built residential parcels by label through its public map service;
  - looked up one county-owned parcel.

  The counting script is scripts/fetch-flwmi-wastewater-stats.ts. It only requests totals, never the names or contact details people submitted with corrections.
- **What we left out:**
  - typical prices for pumping, septic inspection or a sewer hookup (we didn't verify any);
  - a national septic figure (we didn't read the national survey table this time);
  - who owns the sewer line to the street, which varies by city.
