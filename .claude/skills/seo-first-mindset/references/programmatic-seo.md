# Programmatic SEO

Templated pages across a dimension — counties, ZIPs, materials. This property has run the
experiment in both directions and the results are unusually clear.

## The failure: 100 county pages

100 near-identical templated county pages "never earned meaningful Search Console impressions
after months live". A pre-registered pilot testing whether hand-written narratives would fix
that was cut short in favour of removing the page type outright. `/counties/` is now 410 — a hub
with nothing live to link to is itself dead weight.

**Lesson: differentiation must be real, and it must be per-page.** A template with a county name
substituted in is not differentiation.

## The success: county permit guides

The same shape, different substance — each page carries that county's actual permit portal,
its actual process:

```
11 permit pages   2,528 impressions / 28 days   mean 230 impr/page/28d
                  = 37% of site impressions from 19% of pages
```

Philadelphia alone: 472 impr/28d at position 9.6. San Bernardino 328 at 8.9. Cook 301 at 10.7.

**What separates it from the county pages:** a real per-county procedure the searcher cannot get
from the template, matched to navigational intent. See `references/search-intent.md`.

## The binding constraint is indexing, not page count

Of the five county guides restored on 2026-09-04:

- **LA, San Diego, Clark** → indexed → **+429 impressions**
- **Harris** → "URL is unknown to Google" → **0**
- **Maricopa** → "Discovered – currently not indexed" → **0**

**A 3-in-5 conversion rate is the real planning number.** Publishing N pages does not produce N
pages' worth of impressions; it produces roughly 0.6N, and only if demand is comparable.

20 county permit guides remain in `status='removed'`. At the observed mean that is ~4,600
impr/28d — but that figure is an **upper bound assuming comparable demand and full indexing**,
and both assumptions are known to be optimistic. Label it as such whenever you cite it.

## Do not score a removed page from our own data

A 410'd page earns zero impressions by construction. Checking the query captures for a removed
county's demand returns zero for every one of them — that is arithmetic, not a finding. Scoring
restore candidates needs external volume data (DataForSEO, currently paused) or a comparable-metro
argument stated plainly as an inference.

## Rules

1. **Batch and verify.** Restore or publish ~5, confirm index state with
   `scripts/gsc-url-inspection-sweep.ts`, then decide on the next batch. Never ship 20 at once —
   that re-runs the dilution the 2026-09-02 prune (155 → 35 pages) was meant to fix.
2. **Every page needs a real, checkable, per-page fact.** If you cannot name it, do not build it.
3. **Match navigational or procedural intent.** Definitional templates underperform here.
4. **A hub needs live children.** Do not ship a hub before the pages it links to.
5. **Prune with care.** The 2026-09-02 prune was followed by six days of restores —
   "Restore two mis-pruned guides", "Restore the four removed guides holding vendor-payable
   Google positions", "Restore the six removed guides Google still ranks on page one". Check what
   a page currently earns *before* removing it.
