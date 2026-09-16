# Measurement

## Never score a page on Search Console alone

**Quote the CTR, not the click count.** Like-for-like 2026-08-12..09-08: Google
**5,868 impressions / 45 clicks / 0.77%**, Bing **425 / 19 / 4.47%**. Google leads absolute clicks
about **2.4:1** on 13.8x the impressions; Bing converts about **5.8x better per impression**.

An older note said "Bing out-clicks Google 5:1". That was true on 2026-09-02 and flipped on
2026-09-03 — and it has since been misquoted twice from the headline without the correction
beneath it. **Do not quote a click ratio from memory; re-pull both.**

A page judged dead on GSC may still be the best performer on Bing — the polybutylene cluster is
exactly that case, and 6 of 13 click-earning pages once had zero Google impressions.

Always pull both:

```bash
npx tsx scripts/pull-gsc-via-openseo.ts
npx tsx scripts/pull-bing-queries.ts
```

## Use the page dimension for totals, the query dimension for names

Measured 2026-09-16: query dimension reported 668 queries / 2,570 impressions / **3 clicks**
all-time; the page dimension reported **60 clicks** over 90 days. The 3 is a disclosure artifact.

**Query dimension answers "which queries exist". Page dimension answers "how much".**

## Beware overlapping windows

`last 7d` / `14d` / `28d` all include the present and each other, so a naive comparison
manufactures a trend. **Pull the daily series** and compare like-for-like weeks:

```
Aug 31 - Sep  6   2,744 impressions   26 clicks
Sep  7 - Sep 13   2,132 impressions   14 clicks
                  -22.3%              -46.2%
```

## Account for reporting lag

Search Console lags roughly **2–3 days**; the last two days of any pull are incomplete and will
revise upward. Re-check a decline with those days excluded before reporting it. The −22.3% above
survived that test (433/day → 341/day over five clean days, still −21%); a weaker signal would
not have.

## Zero impressions is absence, not a zero

Search Console returns a row only for pages with at least one impression. A never-shown page is
**missing from the response**, not present with 0. "Never shown" exists only as the difference
between the site's own published URL list and what the API returns — which is what
`scripts/gsc-page-coverage.ts` computes. Reading the API alone silently undercounts the problem
to nothing.

## Impressions and index state are different facts

`gsc-page-coverage.ts` cannot see a URL Google has never crawled. Only
`scripts/gsc-url-inspection-sweep.ts` reports crawl and index state. A page with zero impressions
may be indexed-and-unshown or never-crawled, and the fixes are unrelated.

## Check a stale report before reading it as flat

Bing returned **byte-identical rows** on 2026-09-13 and 2026-09-16 — 160 queries, 210 impressions,
20 clicks, zero rows differing. That is a lagging report, not three quiet days. Diff the rows
before calling anything flat.

## Net the cluster before acting on a page

Cook County's −238 looked alarming; the permit cluster netted **+73** because three
newly-restored pages absorbed it. See `references/cannibalization.md`.

## What to measure after a change

| Change | Signal | When |
|---|---|---|
| Title / meta | CTR at stable position | 2–4 weeks |
| Retarget an existing page | impressions on the new target query | 2–4 weeks |
| New or restored page | **index state first**, impressions second | 1–2 weeks, then 4–8 |
| Technical / indexability | coverage state, crawl date | days |
| Internal links | crawl frequency of the destination | weeks |

**For anything new, index state is the first measurement.** Three of five restored pages indexed;
measuring impressions on the other two would have measured nothing.

## Baseline

Zero revenue, zero customers as of 2026-08-27; the property was 20 days old. Growth is measured
against that, and against a target of $500 by 2026-11-27. Revenue is **vendor ads** — the $14.99
report is a credibility signal, not the business. Pages are sold on **readers**, not slot
inventory, so impressions and clicks are the currency that matters.
