# Structured data

## Rule

Schema describes what is already on the page. It never asserts something the page does not show,
and it is never added for activity. `assert-canonical-urls.ts` **parses** JSON-LD rather than
regexing it — a block that does not parse fails the build.

## The site entity

`index.html` carries `Organization` + `WebSite` in the **shared template**, so they appear in the
raw HTML of every page without JavaScript. A large share of AI crawlers issue a plain fetch and
never execute JS; an entity definition they cannot see does not do its job.

**That block deliberately carries no `data-seo` attribute.** `src/utils/headSeo.ts` strips
`[data-seo="dynamic"]` and `[data-seo="prerendered"]` on every route change so page schema does
not duplicate. Leaving the global block unmarked is what keeps it in place. **Do not add the
attribute.**

Brand name is **"Before Regret"**, two words, with `alternateName: "BeforeRegret"`. This was
swapped once on the argument that the one-word form is more distinctive, and reverted the same
day. Apple, Amazon, Target and Gap are ordinary words that rank for themselves — a common-word
brand is slower to establish, not blocked. **Do not swap these again.**

`sameAs` carries the LinkedIn company page. Re-tested 2026-09-15 with a Googlebot UA: **200**,
212KB, naming "Before Regret" 61 times and `beforeregret.com` 6 times. The link works — an older
comment claiming HTTP 999 was wrong and has been corrected. For confirmation to run both ways,
LinkedIn's own Website field must point back.

Deliberately omitted rather than guessed: `foundingDate`, employee count, any rating. Same rule
the content follows.

## Per-page schema

Guides emit `Article` + `FAQPage` + `BreadcrumbList`. Research studies additionally declare a
BeforeRegret-authored `Dataset`. `/about/` carries `AboutPage` with `mainEntity` pointing at
`#organization`.

`FAQPage` must match the FAQs actually rendered on the page. Schema for an accordion that is not
there is a misrepresentation.

## Entity replacement

A 410 retires a page; **it does not replace an entity**. Measured case: on 2026-09-15 Google's AI
Mode, asked what this site is, described a platform for "life reflection" and "capturing personal
histories" — the product that occupied this domain until 2026-07-31. Every old URL answered 410
correctly, and the stale entity persisted anyway.

The fix was not more tombstones. It was making a page positively assert the current identity:
`/about/` retitled from *"How We Research and Write BeforeRegret | Methodology"* (h1 *"How we
research and write this site"*) to *"About BeforeRegret: Free Property Research for US Buyers"*
(h1 *"BeforeRegret is free property research for US home buyers"*). Both old signals described
**process**; neither described **identity**.

**When an AI surface misdescribes this site, check whether it matches the pre-August product
before calling it a hallucination.** The domain served a relationship/regret product from
2026-06-23 (`dec5ffe`) until the pivot on 2026-07-31 (`e976887`) — roughly five weeks indexed
under the wrong identity, with automated sitemap generation added the same day the domain was
pointed at it. See `src/data/legacyUrls.ts` and `docs/ai-overview-schema.md`.

## Budgets

Title ≤ 60 · meta 70–155 · `quick_answer` 120–450 (mobile ceiling). Compute candidates; do not
eyeball them.
