# Internal linking

## What internal links do here — and what they do not

**They do:** carry a reader from one page to a related one, and keep a cluster connected so no
page is a dead end.

**They do not:** get a page indexed. This was tested directly.
`look-up-building-permits-by-address/` was **crawled 2026-09-15**, carries a rendered link to the
Harris page, and Harris remained **"URL is unknown to Google"**. Google crawled the page holding
the link and declined the target anyway.

Measured across the biggest movers of 2026-09-07 → 09-13:

```
biggest LOSERS   mean 3.4 inbound links
biggest GAINERS  mean 1.2 inbound links
site-wide        58 published, mean 2.2, ZERO orphans
```

**Losers were better linked than gainers.** Do not propose internal links as a fix for an
impressions decline or an indexing failure. That is activity, and the Core Rules forbid it.

## When linking is genuinely the right action

- A guide is a **dead end** — no outbound links to related guides.
- A cluster is an **island** — connected internally but not to the main graph.
- A page is **orphaned** — no inbound link from anywhere. In September 2026, 14 of 44 published
  guides were orphaned; fixing that was correct work on its own merits.

Current state: zero orphans. Linking work on this site is largely finished.

## Link from prose that already exists

`scripts/suggest-inbound-links.ts` finds passages already discussing a topic and proposes a link
there. It does not invent a sentence to hold a link.

Distinctiveness is scored by document frequency — a phrase appearing across many guides is a poor
anchor:

```ts
const DF_CEILING = Math.max(2, Math.ceil(rows.length * 0.10));
```

The ceiling took three attempts to calibrate (25% → 10%). A term above it is generic vocabulary,
not a topic.

## Anchor discipline

- Vary anchors. An identical anchor repeated across a cluster is a footprint.
- The anchor must describe the destination.
- **Never `**[text](url)**`** — `parseInline` does not recurse and it ships as literal markdown.
  See `references/technical-seo.md`.

## Related Guides

Ranked by topic, not recency. A "related" list ordered by publish date is not related.
