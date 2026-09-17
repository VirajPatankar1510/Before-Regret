---
name: seo-first-mindset
description: >-
  Evidence-driven SEO decision framework for Before Regret. Use when a task
  could affect public content, URLs, metadata, structured data, internal links,
  sitemaps, redirects, rendering, site architecture, or organic search
  performance.
---

# SEO-First Mindset

## Mission
Grow qualified, sustainable organic search traffic to Before Regret.
Protect factual accuracy, user trust, existing organic equity, and technical integrity.

## When to use
Use before changes that affect:
- public content, titles, meta descriptions, headings
- URLs, routing, redirects, canonicals
- schema, sitemaps, robots directives
- internal links, site architecture
- rendering, indexability, page templates
- programmatic pages or content generation

## When not to use
Skip for private code, internal tooling, non-public pages, or tasks with no search surface.

## Quick triage
1. Does this affect public search surface?
2. Is there evidence of demand or risk?
3. Can an existing URL solve this?
4. What is the smallest safe action?
5. How will it be measured?

## Core rules
- Never invent SEO data, sources, rankings, volume, or traffic.
- Label fact, observation, calculation, inference, hypothesis, recommendation.
- Prefer first-party evidence: GSC, analytics, crawl, production HTML.
- Default to updating existing assets, not creating new URLs.
- Do not add schema, links, or content merely for SEO activity.
- Preserve organic equity: URLs, canonicals, redirects, sitemaps, internal links.
- Do not misrepresent Before Regret product capabilities.
- You are authorized to decide: DO NOTHING.

## Decision pipeline
REQUEST → OBJECTIVE → CURRENT STATE → EVIDENCE → SERP/INTENT → EXISTING ASSET → CANNIBALIZATION → OPPORTUNITY → INFORMATION GAIN → ACTION → VALIDATION → MEASUREMENT

## Action decisions
DO NOTHING / UPDATE EXISTING / CREATE NEW / MERGE / REDIRECT / REMOVE / INTERNAL-LINK / TECHNICAL FIX / STRUCTURED-DATA FIX / RESEARCH / EXPERIMENT

## Hard stops
Stop and investigate when:
- a factual claim cannot be verified
- a law/insurance/regulatory claim lacks scope
- a new URL may cannibalize an existing page
- a technical change may affect indexability
- only cohort data exists but property-level certainty is implied

## Recommendation format
Use: Recommendation, Objective, Evidence, Observations, Inferences,
Information Gain, SEO Mechanism, Risks, Decision, Priority,
Implementation, Validation, Measurement, Confidence.

---

## Operational hooks

The rules above are the framework. These are the commands that satisfy them in this
repository. A step in the pipeline that cannot be backed by one of these, or by a capture
already on disk, is not evidence — it is a guess, and the Core Rules forbid acting on it.

**EVIDENCE — pull, never recall**

```bash
npx tsx scripts/pull-gsc-via-openseo.ts     # Google queries -> data/keywords/<date>-gsc-queries.json
npx tsx scripts/pull-bing-queries.ts        # Bing queries   -> data/keywords/<date>-bing-queries.json
npx tsx scripts/import-ai-features.ts <dir> # GSC Generative AI Features (UI export -- no API exists)
npx tsx scripts/gsc-page-coverage.ts 28     # which published URLs Google has actually shown
npx tsx scripts/keyword-opportunities.ts    # striking-distance analysis
```

**CURRENT STATE — index status, not assumption**

```bash
npx tsx scripts/gsc-url-inspection-sweep.ts <url>...   # no args = every never-shown guide
```

**VALIDATION — the gates that must pass before anything ships**

```bash
npx tsx scripts/assert-keyword-provenance.ts   # a keyword claim without a capture fails the build
npx tsx scripts/assert-article-quality.ts      # pre-publish content gates
npx tsx scripts/assert-canonical-urls.ts       # trailing slashes, JSON-LD, title/meta budgets
npx tsx scripts/suggest-inbound-links.ts       # inbound-link candidates from existing prose
```

**Budgets enforced by `assert-canonical-urls.ts`** — title ≤ 60, meta 70–155,
`quick_answer` 120–450. The 450 is a mobile ceiling, not a style preference: mobile is the
majority of clicks on this property.

**The only place a keyword claim may be written is `src/seo/targetKeywords.ts`**, and every
entry must cite a capture in `data/keywords/`. `src/seo/articleBrief.ts` refuses a brief
missing `slug`, `targetQuery`, `capture`, `intent`, `who`, `want`, `achieve`, `titlePromise`.

## Standing facts about this property

Load the reference file before reasoning about any of these. Each is measured, dated, and
cost real effort to establish — re-deriving them wastes the budget the Mission exists to protect.

- **Google's query dimension is a filtered sample.** It disclosed ~5% of clicks here; the page
  dimension is the honest number. Never score a page on the query report alone.
- **Bing converts ~5.8x better per impression; Google wins absolute clicks ~2.4:1.**
  Like-for-like 2026-08-12..09-08: Google 5,868 impr / 45 clicks / 0.77%, Bing 425 / 19 / 4.47%.
  **Quote the CTR, not the click count** — an older "Bing out-clicks Google 5:1" line is stale and
  has now been misquoted twice. Bing's value is an independent index and unfiltered queries, and a
  page alive on either engine is alive.
- **The constraint is indexing, not content.** Pages sit "Discovered – currently not indexed"
  while healthy, linked, unique and in the sitemap. More pages do not mean more impressions.
- **Definitional intent underperforms here; navigational intent holds** — but the REASON is now
  unknown. The AI-Overview explanation was refuted 2026-09-17: AI and web impressions correlate at
  r = 0.936 and fell together, so AI features were not absorbing those queries. The deprioritisation
  is **reopened, not reversed**. See `references/search-intent.md`.
- **Generative AI Features is ~14% of impressions and export-only.** 952 of 7,186 over
  2026-08-18..09-14. The strongest predictor of appearing there is a `quick_answer` that OPENS with
  a verdict (No / Generally / It can) — 5 of the top 8 pages, 0 of the bottom 8. Length, lists,
  tables and heading count do not discriminate.
- **Every page is served by the Node function** (`vercel.json` rewrites `/(.*)` → `/api/index`),
  and guides are prerendered at build time. A published row without a rebuild is a soft 404.

## References
Load only when needed:
- references/evidence-hierarchy.md
- references/claim-provenance.md
- references/search-intent.md
- references/cannibalization.md
- references/technical-seo.md
- references/structured-data.md
- references/internal-linking.md
- references/programmatic-seo.md
- references/original-research.md
- references/measurement.md
