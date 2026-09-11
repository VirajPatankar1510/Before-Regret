---
name: write-guide
description: The enforced pipeline for creating a new BeforeRegret guide article — pull real query data from the self-hosted OpenSEO MCP, pick a target from a persisted capture instead of inventing one, write and validate an ArticleBrief before drafting, draft against seven content rules, then run the pre-publish gate, publish, rebuild, earn inbound links and verify live. Use this whenever the user wants to write, create, draft, generate or plan a new guide or article for BeforeRegret, asks what to write next, asks which keyword or topic to target, wants content for a search query or cluster, or asks to publish an article to the articles table. Also use when asked to fix or extend an existing guide's cost data, titles or clusters. Do NOT use for FAQs on an existing article (use article-faqs) or for the research studies under /research/.
---

# Writing a BeforeRegret guide

Nine steps. Most are enforced by code, so skipping one fails rather than merely producing weaker
work. **Read `beforeregret_content_standard.md` §1–§7 before drafting** — this skill is the flow;
that file is the rules the flow applies.

All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.

---

## 0. Pull the data

```bash
npx tsx scripts/pull-gsc-via-openseo.ts
```

Reads Search Console through the self-hosted OpenSEO MCP at `http://localhost:3001/mcp` and writes a
capture into `data/keywords/`. If OpenSEO is not running: `cd ../open-seo && docker compose up -d`
(needs `PATH="$HOME/.docker/bin:$PATH"`).

Bing is separate — OpenSEO has no Bing tools. Export the **Keywords** table from Bing Webmaster
Tools (Search Performance → *List By* → Keywords) and run
`npx tsx scripts/import-gsc-export.ts <file>.csv --source bing`.

**Never invent a keyword, a volume or a position.** Every number in an article traces to a file in
`data/keywords/`.

## 1. Pick the target query

Read the captures. **Bing is the primary instrument**: it disclosed 100% of its clicks where
Google's query dimension disclosed 4% (1,859/2 at query level vs 6,138/50 at page level over the
same window). Never characterise performance from Google's query dimension — it is a
disclosure-filtered sample, not a total.

Prefer a topic cluster with fewer than three members; step 5 prints them. Prefer a query with
measured impressions and no clicks over one with neither.

## 2. Write the brief — before any prose

Fill in `ArticleBrief` from `src/seo/articleBrief.ts` and call `validateBrief()`:

`slug` · `targetQuery` · `capture` · `intent` · `who` · `want` · `achieve` · `titlePromise`

It rejects boilerplate, answers under 25 characters, three answers that are the same sentence, a
definition-shaped `titlePromise` on transactional intent, and two briefs sharing a field. `who` must
name a person in a situation, not a category — "homeowners" fails, "a buyer whose inspector flagged
aluminium branch wiring" passes.

This is §7's *three questions before drafting* made structural. It cannot make anyone think; it
makes not thinking visible.

## 3. Draft against the rules

| rule | requirement |
|---|---|
| title | promises an outcome, not a bare definition echo · ≤60 chars |
| meta | 70–155 chars |
| `quick_answer` | **120–450 chars** that actually answers — 450 is a mobile ceiling |
| reproducibility | at least one real cost figure **or** a standard cited by name AND number |
| carriers | **never** a named insurer beside an underwriting verb |
| no bait | no "read on", "we'll explain below" |
| no clichés | no `delve`, `furthermore`, `crucial`, `regulatory landscape`, `when it comes to` |
| cluster | slug + title must match a `GUIDE_TOPIC_PATTERNS` bucket in `src/utils/relatedGuides.ts` |
| links | prose links only where the text ALREADY discusses the target |

**Why the mobile ceiling.** 63.3% of this site's Google clicks come from mobile on 37.3% of
impressions — the phone converts three times better than desktop and is the real reader.
`quick_answer` is what that reader sees before scrolling.

**Why the carrier rule is absolute.** 29% of Bing queries carry insurance intent and many name a
carrier. We hold no carrier underwriting data; those guidelines are largely non-public, vary by
state and year, and change without notice. Write "your carrier", "some carriers". Explain the peril
with a citation, what underwriting generally weighs, and how to get a written answer from their own
insurer. A generic *"most insurers refuse X"* passes the regex and is still inventing — cite CPSC or
NEC rather than asserting it.

**Where cost figures come from.** `PRIORITY_RULES` in `src/engine/inspectionPriorities.ts`, read at
run time, never retyped — a retyped number drifts from the report the same engine generates.

**On clichés, literal uses are fine.** "Seamless" for synthetic stucco or HDPE pipe, "leverage" as
the noun (contractual leverage under a contingency) are domain vocabulary. Only the metaphors are
banned.

## 4. Publishing script — dry run by default

Follow the pattern in `scripts/ctr-round-3-eifs-la.ts`. Assert before writing:

- a `requires` gate — metadata may only promise what the body already delivers
- title ≤60, meta 70–155
- no dead `/guides/` or `/research/` links
- no `**[text](url)**` or `[**text**](url)` — `parseInline` does not recurse, so these ship as
  literal markdown
- no duplicate headings or opening sentences across a batch

Print a diff. Write nothing without `APPLY=true`.

## 5. Pre-publish gate

```bash
npx tsx scripts/assert-article-quality.ts
```

Seven rules across the whole library: carrier claims · reproducibility · TL;DR floor and ceiling ·
engagement-bait · definition-echo titles · clusters · AI-clichés. **Must exit 0.**

Not in the build chain on purpose — it reads Neon, and a DNS blip there would fail the deploy of the
entire site. Two grandfather lists in `data/quality-grandfathered.json` may only SHRINK; the run
prints which grandfathered guides now pass, so gains get locked in.

## 6. Apply, build, deploy

```bash
APPLY=true npx tsx scripts/<your-script>.ts
npm run build
git add … && git commit && git push origin main
```

The build asserts keyword provenance, walkthrough checks, trailing slashes, and structured data in
`dist/` — Article + FAQPage + BreadcrumbList, parsed rather than substring-matched. Schema is
composed at prerender from database columns and is **never** in the markdown.

**Guides are prerendered: a published DB row without a rebuild is a soft 404.**

## 6b. Earn inbound internal links

```bash
npx tsx scripts/suggest-inbound-links.ts <slug>
```

Finds sentences in existing guides that ALREADY discuss the new subject. It suggests and never
writes: an injector with no honest anchor available has to invent a sentence to carry the link, and
§3 forbids that. Vary anchor wording between them — identical anchors repeated into one page are a
footprint.

**Finding nothing is a result.** It means the guide is disconnected from the library, which is a
reason to reconsider the guide, not to insert a sentence.

## 7. Verify live, then measure

Fetch the URL. Confirm the figures render, no markdown leaked, headings intact, and the page still
ends on a next step rather than a price list. Later, re-run step 0 — the instrument that chose the
query is the one that judges it.

---

## Pace

§1: **a handful a week, not seventeen a day.** The library was cut from 155 guides to 35 for the
SHAPE of its publishing, not the substance of any page. Do not publish more until existing pages are
indexed. Vary length and title construction; never fill one headline formula N times.

## Add FAQs afterwards

Use the `article-faqs` skill. Do not hand-write `faq_json` here.
