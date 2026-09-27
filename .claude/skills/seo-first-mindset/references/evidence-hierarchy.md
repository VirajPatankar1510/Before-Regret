# Evidence hierarchy

Ranked by how much weight a claim may carry. A recommendation may never rest on a tier
below the one it implies.

## Tier 1 — measured, first-party, reproducible

- **Search Console page dimension** — `scripts/gsc-page-coverage.ts`, `fetchPagePerformance()`.
  The honest impression and click numbers for this site.
- **Search Console URL Inspection** — `scripts/gsc-url-inspection-sweep.ts`. The only source
  for crawl and index *state*. Impressions data is silent about a URL Google has never crawled.
- **Bing Webmaster query report** — `scripts/pull-bing-queries.ts`.
- **Production HTML** — `curl` with a Googlebot UA. What a crawler actually receives.
- **The database** — `articles` in Neon is the authority on what is published.

## Tier 2 — measured but filtered

- **Search Console query dimension.** Google applies a disclosure filter. Measured on this
  property: **1,859 impressions / 2 clicks at query level against 6,138 / 50 at page level** —
  roughly 5% of clicks disclosed. Later re-measured at 668 queries / 2,570 impressions / 3 clicks
  against 60 clicks page-level.
  **Use it for which queries exist. Never use it to count clicks or to score a page.**
- **Bing keyword counts** — `fetchBingKeyword` / `GetRelatedKeywords`, via `scripts/topic-demand.ts`.
  All of Bing, not just this site, but a thin sample: calibrated 2026-09-27 at 0 exact / 9 broad
  over 90 days for "south facing house", which a paid tool had put at 1,300 US searches a month on
  Google. **Relative only. A zero is "unknown", never "no demand".**

## Tier 3 — observed, unquantified

- **A person looking at a live results page** — autocomplete, People Also Ask, related searches —
  recorded with `scripts/record-observation.ts` (who looked, where, when). An engine only suggests
  what people search, so it proves a query EXISTS. It never supports a number. A person does the
  looking; automated querying of a search engine is scraping and is not done here.

## Retired — do not use

- **OpenSEO and DataForSEO**, retired 2026-09-27: credits exhausted, and the owner decided not to
  depend on paid or third-party SEO services again. Captures made before that date stay valid as
  dated measurements (the south-facing volumes, for example). `assert-keyword-provenance.ts` fails
  any capture from either source dated after it. **Never state a monthly search volume that is not
  in one of those old captures.**

## Tier 4 — inference

Permitted, but must be labelled as inference and must name the observation it rests on.

## Not evidence

- Memory of a number from earlier in a session. Re-pull it.
- A figure in a doc without a capture id.
- Volume or difficulty for a query that appears in no capture.
- A Bing keyword count of zero read as "nobody searches this".
- Our own impressions described as market size. "Shown 146 times on this site" is not "146 searches".
- **A page's absence from a report when the page is 410.** A removed URL earns zero impressions
  by construction. "No measured demand" for a removed page is guaranteed, not informative.

## The metadata trap

`appendix/user_data` is a free DataForSEO endpoint that returns `20000` (success) even when the
account is paused. It was once read as proof the integration was live; the real endpoints
returned `40201 paused`. **Verify a paid integration against a paid endpoint.**
Documented in `docs/ai-overview-schema.md` §7.

## Verify before reporting

Two failures worth not repeating:

- A polling loop grepped production for a string and never checked HTTP status. Vercel was
  answering **403** to a bot challenge, and the loop read that as "not deployed yet" for ten
  minutes. **Always check the status code.**
- A "zero carrier claims" result came from a ±100-character window that missed a verb at
  index ~160. The check became sentence-level. **Match the window to the claim.**

## Distinguish these two failures

`null` rows after four failed Neon attempts means **unreachable**, not **not found**. Reporting
the second sends the reader hunting for a slug that is sitting right there.
