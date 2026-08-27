# Permit guide titles, revised 2026-08-27

All 30 county permit guides were retitled from the pattern
`How to Check Building Permits in {Place}` to titles naming the specific system,
agency, or jurisdictional quirk each page actually documents.

## Why

Of 32 county guides, exactly one has ever been indexed by Google:
`check-building-permits-philadelphia-county-pa`. Measured 2026-08-27 with the URL
Inspection API:

    1  Submitted and indexed          <- Philadelphia
    28  Discovered - currently not indexed
    3  URL is unknown to Google

The other 31 get zero impressions because they are not in the index, not because
they rank badly. Nothing structural separates them: same publish batch (several
within the same hour), same sitemap, same homepage internal links, mid-pack
length. Indexing predicts traffic perfectly on this site -- 8/8 pages with
impressions are indexed, 0/18 sampled pages without impressions are.

Body text was checked for templating and is NOT templated: across all 11,325
possible pairs among the 151 published guides, zero pairs exceed 0.10 Jaccard on
8-word shingles, and the 32 county guides have 32 distinct heading structures.
The prose is genuinely researched per jurisdiction.

What WAS templated is the part Google could see without crawling. A page at
"Discovered - currently not indexed" has never been fetched, so the crawl
decision rested on the URL, the title, and the anchor text alone. Thirty-one
URLs matching `check-building-permits-{place}-{state}` with titles matching
`How to Check Building Permits in {Place}`, published in one batch on a domain
with zero backlinks, look like mass-generated location pages on exactly those
signals. Philadelphia's title was the one that named something specific --
"Philadelphia L&I Permit & Violation Search by Address".

## Honesty about the evidence

This is a reasoned bet, not a demonstrated fix. Pattern-cluster membership
correlates with being unindexed (5.1% vs 12.5% for standalone pages) but a
Fisher exact test gives p = 0.16 -- suggestive, not significant at n = 16
indexed pages. Standalone pages are 87.5% dark too, so the template is at most a
secondary factor on top of a sitewide indexing problem whose real cause is
off-page (zero backlinks, 20-day-old domain, 151 pages published in 20 days).

Falsifiable: if these pages move from "Discovered" to "Submitted and indexed"
over the next few weeks, the signal mattered. If nothing moves, the bottleneck is
entirely off-page and no further on-page effort on these pages is warranted.

## Constraints applied

- Every title names only a system the page actually covers, checked against that
  page's own headings. No title claims an agency or portal the body does not.
- All 30 are 47-56 characters, under the ~60 char SERP truncation point.
  Philadelphia, the page that works, is 53.
- articles.title also renders the visible <h1> and the schema.org headline (see
  GuidePageView.tsx), so these are page headings, not just metadata.
- Meta descriptions were NOT updated and may now be slightly out of step.

Drafts and per-title rationale: scratchpad/permit-title-drafts.json
