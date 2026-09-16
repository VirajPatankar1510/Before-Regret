# Technical SEO

## How this site is served

`vercel.json` rewrites `/(.*)` → `/api/index`. **Every page is served by the Node function;
nothing comes from the CDN edge.** Guides are prerendered to static HTML at build time.

**A published database row without a rebuild is a soft 404.** Publishing is two steps:
write the row, then build and deploy.

Deploys run from `main` on Vercel Hobby. An hourly cron can silently kill *all* deploys with no
failed build showing — check the GitHub Deployments API when a deploy seems not to land.

## Verifying a deploy

Check the status code, then the content. A loop that greps for a string and ignores HTTP status
will read a **403 bot challenge** as "not deployed yet" — this happened for ten minutes across
~60 requests.

```bash
curl -s -o /tmp/p.html -w "%{http_code}" -A "Mozilla/5.0 (compatible; Googlebot/2.1)" "$URL"
```

## Crawler access

Confirmed answering **200** to Googlebot, Google-Extended, GPTBot, PerplexityBot, ClaudeBot and
plain curl. If a crawler-access theory arises, test it before believing it.

## 410 versus 301

**410 Gone** for the previous product's URLs and for removed pages with no successor.
**301/308** only where a genuine successor exists.

Why: on four legal-page duplicates a 301 was tried and Google kept the old URL as canonical. On
a site crawled at roughly 3 pages/day, every crawl spent on a dead duplicate is one not spent on
real content. An irrelevant redirect is treated as a soft 404 anyway.

`src/data/legacyUrls.ts` holds `LEGACY_GONE_PATHS` and `LEGACY_GONE_PREFIXES`, shared by the
runtime handler and `scripts/legacy-url-audit.ts` so the two cannot disagree about the rule.

**A 410 retires a page. It does not replace an entity.** See `references/structured-data.md`.

How durable the old index is: Google held
`/guides/narcissistic-gaslighting-vs-healthy-disagreements` as "Submitted and indexed" while it
answered 404 **for months**, and `/city/mumbai` likewise.

## Indexing is the constraint

This is the single most important technical fact about the property.

Pages sit at **"Discovered – currently not indexed"** while being in the sitemap, internally
linked, 8.6k–16k chars, carrying FAQs, serving correctly, and non-duplicative (max 1.6% overlap).
Of the five county guides restored on 2026-09-04, **three indexed and earned +429 impressions;
two produced nothing** — one "Discovered, not indexed", one "URL is unknown to Google".

Internal links do not fix this. `look-up-building-permits-by-address/` was **crawled 2026-09-15**
carrying a rendered link to the Harris page, and Harris remained *unknown to Google*. Google saw
the link and declined.

**Levers that actually exist:**
- **Google: Request Indexing in the Search Console UI.** UI-only, one URL at a time. This is the
  user's action, not yours. Hand over a prioritised URL list; do not perform substitute busywork.
- **Bing: `scripts/bing-submit-urls.ts`.** Real API, 100/day. Defaults to a dry run on purpose —
  it is an outward-facing call against a third-party quota. Ask before `--write`.
  The script's own note is accurate: *"It cannot touch the Google problem."*

## Gates

`scripts/assert-canonical-urls.ts` runs in the build: trailing slashes on every emitted guide
URL, JSON-LD parsed (not regexed), and title/meta budgets across indexable pages, with noindex
pages skipped.

## Renderer limits

`renderArticleMarkdown.tsx` → `parseInline` **does not recurse**. `**[text](url)**` ships as
literal markdown. Assert against both orderings:

```ts
for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
  if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
}
```

A markdown table without a separator row renders as garbled prose. Assert one exists.

## Open item

**TTFB** — measured 1.36s on the homepage. Every page is served by the function, never the edge.
**Measure warm vs cold TTFB before touching `vercel.json`.** Do not change the rewrite on theory.
