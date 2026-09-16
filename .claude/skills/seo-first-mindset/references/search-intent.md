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

## Leading hypothesis, explicitly unproven

AI Overview absorption on definitional queries. It fits the intent-selectivity, the suddenness,
and the standing open-ground case (indexed, unshown, while an AI Overview reproduced the content
citing nobody).

**It cannot be confirmed with the tools available.** Search Console folds AI Overview impressions
into ordinary web results and does not break them out — `fetchSearchAppearance()` returns only
`TRANSLATED_RESULT` here. DataForSEO is paused. **Label it hypothesis. Do not plan as if proven,
and do not assert it to the user as fact.**

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
