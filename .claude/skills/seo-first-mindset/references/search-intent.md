# Search intent

Intent is the strongest predictor of whether a page on this property earns impressions. It
outweighs length, schema, internal links and freshness — all four were measured and none
separated winners from losers.

## The measured finding (2026-09-04/05)

Seven definitional guides — `reverse-polarity-…`, `open-ground-…`, `get-home-insurance-fuse-box`,
`double-tapped-breaker-…`, `what-is-knob-and-tube-wiring`, `tpr-valve-…`,
`evidence-prior-repair-…` — collapsed in 48 hours and stayed down:

```
Sep 2: 139   Sep 3: 137   Sep 4: 63   Sep 5: 13   Sep 6: 15
Sep 7:  13   Sep 8:   4   Sep 9:  0   Sep 10: 2   Sep 11: 0
```

Over the same days the six county-permit guides went **66 → 124/day**.

Nothing on the pages separated the two groups:

| | collapsed | healthy |
|---|---|---|
| mean body | 11,409 chars | 11,903 chars |
| inbound links | 3.4 | 1.2 |
| index state | all indexed, recent crawl | all indexed |
| max content overlap | 1.6% | — |

**The only difference is what the searcher is asking.**

## The two intents on this property

**Definitional — "what does X mean" — underperforms.**
Open Ground's queries went to *zero impressions*, not to worse positions:
`open ground` (pos 31.5 → 0), `what is an open ground` (21.5 → 0), `open ground artinya` (5.0 → 0).
A page at position 5 earning zero impressions is not being outranked; it is not being shown.

**Navigational / procedural — "how do I look up permits in X county" — holds.**
11 permit pages produce **2,528 impressions / 28 days — 37% of site impressions from 19% of
pages**, mean 230 impr/page/28d. This format also responds to deliberate work: the two largest
gainers on the site were LA County (+218, after a title fix) and EIFS (+118, after query
targeting).

## The hypothesis was AI Overviews. It was REFUTED on 2026-09-17.

Search Console's Generative AI Features report (UI export; there is no API) gives AI-feature
impressions per day. Against web impressions over the same window:

```
Sep 3   571 web   97 AI
Sep 4   428 web   94 AI
Sep 5   285 web   27 AI    <- both collapse, same day
```

**Pearson r = 0.936 across 28 days.** Absorption would have shown AI impressions RISING while web
fell. They fell together, so the event hit both surfaces — a Google-side visibility change, not a
format shift.

Also corrected: this file previously said Search Console "folds AI Overview impressions into
ordinary web results and does not break them out." It does break them out.
`fetchSearchAppearance()` returning only `TRANSLATED_RESULT` is a narrower API dimension that was
misread as proof of absence.

**What follows: the deprioritisation below is REOPENED, not reversed.** The cluster really did go
to near-zero and stayed there, so do not rush back into definitional content. What changed is that
there is no longer a reason to believe the format is structurally doomed — the cause is simply
unknown. Pull `scripts/import-ai-features.ts` on a fresh export before reasoning about this again.

## What follows for decisions

- **Do not propose a new definitional page** without saying how it escapes this finding.
- **Do not spend on rewriting the seven.** If the SERP is absorbing the answer, a better answer
  does not buy the impression back. This is where budget goes to die.
- **Prefer procedural and navigational targets.** They survive, and they respond to work.
- Before building, name the searcher: `who` / `want` / `achieve` in `articleBrief.ts`. If the
  honest answer to `want` is "a definition", expect this outcome.

## Do not re-test these

Every site-side cause was eliminated with evidence: deindexing (all "Submitted and indexed",
recent crawls), orphaning (losers better linked than gainers), pruned-page decay (93% of
impressions from published pages), thin content, the Sep-4 book card (went on all 37 guides;
one cluster fell), position collapse (Cook moved 10.3 → 17.5 while losing 97% of impressions),
broken serving, and our own later edits (10–11 Sep, *after* the 4–5 Sep cliff).
