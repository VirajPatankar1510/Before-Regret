# Cannibalization

Two URLs competing for one intent. On a site with this little index budget, the cost is not
split rankings — it is a wasted index slot.

## Check before creating any URL

1. Does a published page already rank for the target? `scripts/gsc-page-coverage.ts`,
   or filter the query dimension by page.
2. Would the new page answer the same `want` as an existing one? See `articleBrief.ts`.
3. Measure overlap against every published page before assuming it is new.

## Measuring overlap

5-gram Jaccard against every published body. On this property the baseline is low — the ten
unindexed pages scored **max 1.6%** against their nearest published neighbour, which is what
genuine non-duplication looks like here.

```ts
function shingles(s: string): Set<string> {
  const w = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i < w.length - 4; i++) out.add(w.slice(i, i + 5).join(' '));
  return out;
}
```

Anything above ~8% deserves a MERGE conversation before a CREATE one.

## Redistribution is not cannibalization

Week of 2026-09-07, inside the permit cluster:

```
Cook County            -238      (244 -> 6)
Los Angeles            +218      ( 23 -> 241)   restored 2026-09-04
San Diego              +104                     restored 2026-09-04
Clark County           +107                     restored 2026-09-04
San Bernardino          +46
```

Cluster net: **+73**. Google reallocated within a cluster toward newly-restored pages. Reading
Cook's −238 alone would have produced a panic fix for a cluster that was fine.

**Always net a cluster before acting on a single page's decline.**

The telling detail: Cook lost **all 19 of its queries**, not position on them. Queries at
positions 7–10 went to zero impressions. A page losing queries wholesale is being dropped from
SERPs, not outranked — a different diagnosis with a different fix.

## Trailing-slash duplicates

The canonical form on this site ends in `/`. A no-slash URL 308s to the slash form. Three paths
are still indexed in both forms, holding **250 impressions** on the no-slash variants:

```
/guides/look-up-building-permits-by-address    216 (slash)  /  182 (no-slash, pos 39.9)
/guides/what-is-knob-and-tube-wiring            77 (slash)  /   62 (no-slash)
/guides                                          3 (slash)  /    6 (no-slash)
```

Redirects are in place; these are legacy index entries that consolidate on their own. 3 of 106
URLs is not worth a code change — but every *new* emitted URL must keep its slash, which
`scripts/assert-canonical-urls.ts` enforces.

## Prefer UPDATE over CREATE

The default in the Core Rules is not conservatism, it is arithmetic: Google is already declining
to index pages this site has published. A new URL competes against your own backlog for a budget
that is already exhausted. See `references/programmatic-seo.md`.
