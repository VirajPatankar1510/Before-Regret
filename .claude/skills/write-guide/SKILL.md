---
name: write-guide
description: The enforced pipeline for creating a new BeforeRegret guide article — gather demand evidence from first-party data only (this site's own Search Console and Bing accounts, plus what a person sees on a live results page), pick a target from a persisted capture instead of inventing one, write and validate an ArticleBrief before drafting, draft against seven content rules, then run the pre-publish gate, publish, rebuild, earn inbound links and verify live. When the research-council skill has already decided the topic, take its decision as the input rather than re-choosing. Use this whenever the user wants to write, create, draft, generate or plan a new guide or article for BeforeRegret, asks what to write next, asks which keyword or topic to target, wants content for a search query or cluster, or asks to publish an article to the articles table. Also use when asked to fix or extend an existing guide's cost data, titles or clusters. Do NOT use for FAQs on an existing article (use article-faqs) or for the research studies under /research/.
---

# Writing a BeforeRegret guide

Nine steps. Most are enforced by code, so skipping one fails rather than merely producing weaker
work. **Read `beforeregret_content_standard.md` §1–§7 before drafting** — this skill is the flow;
that file is the rules the flow applies.

All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.

## Floors, not a template

The gates below are **floors**: rules a page must not fall under. They are not a shape for the page to
fill. Sections, length, structure, voice and which facts lead are judgment, made fresh for each
article from who is searching and what they need. Two guides built to the same outline is the
scaled-content signature that got 120 pages pruned. If a gate would force something unnatural into a
page, that is a reason to question the gate (as happened 2026-10-02: the citation rule only knew
building codes, so a federal regulation could not count), not to bolt on a filler figure.

## Coming from the research council

When `research-council` has decided the article, its DECISION block is the input to this skill.
Don't re-pick the topic. The council weighed more evidence than step 1 does. Carry each part through:

| from the council | lands in |
|---|---|
| the segment and topic (Moskowitz) | skip step 1's topic choice; step 1 only chooses the **exact phrasing**, the query whose wording best matches the job |
| the job (Christensen) | the brief's `who` / `want` / `achieve`, and the sections: the page is organised around finishing that job |
| the scent warning (Pirolli & Card) | `titlePromise`, the title and the first line of `quick_answer`: the words a searcher sees must promise exactly what the page delivers |
| "good enough to stop searching" and the glance test (Pirolli & Card) | `quick_answer` settles the question on its own; read the title, `quick_answer` and any image in isolation, and each must be true without the rest of the page |
| the verification list (Feynman) | a fact-check step **before drafting**: every portal, code section, figure and regulation verified at its primary source, in a browser if needed. Anything that cannot be verified is cut, not softened |
| the read date and stop condition (Kohavi) | the brief's `stopCondition`, the publish script header, and a memory entry with the date |
| who would cite or share it (Berger) | whether a diagram or data point is worth making, and who outside the site might link to it |
| where its authority comes from (Page & Brin) | which strong existing pages link to it in step 6b. Prefer pages that already earn impressions |
| the engine and batch (Brynjolfsson) | when the council hands over a batch (for example eight county guides), write each page from its own verified facts. A batch never means a template |
| a new segment | may need a new `GUIDE_TOPIC_PATTERNS` bucket; see the cluster row in step 3 |

**The handoff works both ways.** If writing shows the council was wrong, stop and report back instead
of forcing the article through. Examples: a page already covers the topic (cannibalisation), the key
facts cannot be verified, or a real search shows a different intent from the one assumed. Changing
the decision is a council call, not a drafting one.

---

## 0. Gather the evidence — first-party only

**No paid or third-party SEO service.** OpenSEO and DataForSEO were retired on 2026-09-27 (credits
exhausted; the owner chose not to depend on them again). The provenance gate now fails any new
capture from them. Everything below reads this site's own free Search Console and Bing accounts.

```bash
npx tsx scripts/pull-gsc-queries.ts        # every query Google has shown this site for, 16 months
npx tsx scripts/pull-bing-queries.ts       # the same from Bing
npx tsx scripts/topic-demand.ts "seed phrase" "another phrasing"   # a subject with no page yet
```

**If the research council already pulled evidence this session, reuse its captures.** Only fill the gaps, most often a tier-3 observation of the exact wording people use.

`topic-demand.ts` is the step that used to be a keyword-volume lookup. Give it 2–4 word phrasings
(one-word seeds drown in unrelated rows) and read which **tier** it reaches:

| tier | what it found | what it lets you say |
|---|---|---|
| **1** | queries this site is already shown for, with the page shown | measured demand, and usually the page to UPDATE instead of creating a URL. Marked **WEAK** under 20 impressions: a hint, not demand. Discount machine-shaped queries no person would type |
| **2** | Bing's own counts for the phrasing across all of Bing | real but unquantified demand. Thin sample, relative only: calibrated 0 exact / 9 broad for a query a paid tool had at 1,300/month on Google. **A zero is "unknown", never "no demand"** |
| **3** | nothing | ask the owner to look: type the phrasings into Google in a private window and note autocomplete, People Also Ask and related searches, then `scripts/record-observation.ts --query … --where … --by owner`. That proves a query exists, never how many |

A person does the looking in tier 3. Never automate queries against a search engine: that is
scraping, and it trips bot checks. Tried from the in-app browser on 2026-09-28: Google answered
with an "unusual traffic" CAPTCHA and Bing silently served junk results (Microsoft login pages in
Turkish and Dutch for a contractor query). Neither is an observation, and a bot check is never to be
worked around.

**The owner is in Mumbai, so autocomplete is NOT a US signal.** Google localises suggestions by IP:
the same session showed Indian trending searches. Observe from a US results page instead --
`https://www.google.com/search?q=<query>&gl=us&hl=en` -- and record **People also ask** and
**People also search for**, not autocomplete. Say `gl=us results page` in `--where`.

**Never state a search volume.** No number of monthly searches may appear in a brief, an article or
a recommendation unless it comes from a capture dated before 2026-09-27. Impressions from our own
accounts are fine, labelled as ours ("this site was shown 146 times"), never as market size.

## 1. Pick, or confirm, the target query

Read the captures. **Bing is the primary query instrument**: it disclosed 100% of its clicks where
Google's query dimension disclosed 4% (1,859/2 at query level vs 6,138/50 at page level over the
same window). Never characterise performance from Google's query dimension — it is a
disclosure-filtered sample, not a total.

**Tier 1 pointing at an existing page means update that page first.** Default to extending the
page Google already associates with the subject; a new URL beside it competes with it (see
seo-first-mindset `references/cannibalization.md`).

**Tier 3 may still be written, as an experiment.** State the stop condition in the brief before
drafting — e.g. "indexed within 14 days and 20+ impressions within 45, or fold it into <existing
page>". With no volume data, measuring after publishing is how demand gets established.

When the council decided the topic, this step only picks the phrasing (see the section above). Otherwise:
prefer a topic cluster with fewer than three members; step 5 prints them. Prefer a query with
measured impressions and no clicks over one with neither.

## 2. Write the brief — before any prose

Fill in `ArticleBrief` from `src/seo/articleBrief.ts` and call `validateBrief()`:

`slug` · `targetQuery` · `capture` · `intent` · `who` · `want` · `achieve` · `titlePromise` · `stopCondition` (the code requires it when the capture is an observation; write it for **every** article that is an experiment, which includes every council decision)

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
| reproducibility | at least one real cost figure, **or** a standard cited by name AND number (NFPA, NEC, IRC, ASTM…), **or** a law cited by number (`24 CFR Part 3280`, `42 U.S.C. § 5401`, `Florida Statutes § 119.071`). Use whichever is the page's real authority; never add a figure just to pass |
| carriers | **never** a named insurer beside an underwriting verb |
| no bait | no "read on", "we'll explain below" |
| no clichés | no `delve`, `furthermore`, `crucial`, `regulatory landscape`, `when it comes to` |
| cluster | slug + title must match a `GUIDE_TOPIC_PATTERNS` bucket in `src/utils/relatedGuides.ts`. If the article opens a new segment the buckets don't describe, add one (as `orientation` was) instead of letting it fall into a wrong cluster. Place it so it reclassifies **zero** existing guides, check that, and accept that it starts as a one-member cluster, which is the experiment |
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
query is the one that judges it. For a tier-3 experiment, check the stop condition written in the
brief on its date and act on it; an unmet one means fold or remove, not wait longer.

---

## Pace

§1: **a handful a week, not seventeen a day.** The library was cut from 155 guides to 35 for the
SHAPE of its publishing, not the substance of any page. Do not publish more until existing pages are
indexed. Vary length and title construction; never fill one headline formula N times.

## Add FAQs afterwards

Use the `article-faqs` skill. Do not hand-write `faq_json` here.
