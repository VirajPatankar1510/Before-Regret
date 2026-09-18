---
name: diagnose-ranking
description: >-
  Work out why a specific BeforeRegret page ranks below the pages above it, by
  measuring both instead of guessing. Use when asked why a page is ranking low,
  why it is not ranking, what is holding a page back, how it compares to
  competitors or top-ranked pages, whether the problem is content or domain
  age/authority, whether there is scope to improve a page's position, or whether
  AI clichés or AI slop are hurting a page. Also use before rewriting any page
  "for SEO".
---

# Diagnosing a page that ranks low

All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.

**The rule this skill exists to enforce: do not answer "domain authority" until you have
measured the content.** That answer is available for every page, costs nothing to produce,
cannot be falsified, and is the reason nobody ever looks for the gap that is actually there.
It is sometimes the right answer. It is never the first one.

---

## Two corrections to make before reasoning

**"Domain authority" is not a Google metric.** DA is a score Moz invented to model Google.
Google does not have it and does not use it. When someone asks whether low DA is the cause,
answer the real question underneath — links, age, brand demand — and say plainly that the
metric they named does not exist on Google's side. Do not repeat it back as if it did.

**AI clichés are not a ranking factor.** Google's documented target is unhelpful content, not a
phrase list. No evidence exists that the word "delve" costs a position. What is true is that
slop phrasing *travels with* thin, derivative writing, which is targeted — so treat clichés as a
**symptom worth checking**, never as a cause you have found. Step 4 makes this falsifiable by
running the same check on the pages that outrank us.

---

## 0. What is this page actually doing

Never diagnose from the URL alone. Get its measured position and the queries it appears for.

```bash
npx tsx scripts/gsc-page-coverage.ts 28        # position and impressions per URL
npx tsx scripts/pull-gsc-via-openseo.ts        # query-level, writes a capture
npx tsx scripts/bing-report.ts                 # Bing discloses ~100% of its clicks
```

If the page has **zero impressions**, stop. This is not a ranking problem, it is an indexing
problem, and the rest of this skill does not apply. Run
`npx tsx scripts/gsc-url-inspection-sweep.ts <url>` and read
`beforeregret_indexing_bottleneck.md` instead.

Remember which instrument you are holding: Google's query dimension is disclosure-filtered and
showed ~5% of clicks here. The page dimension is the honest one.

## 1. Find who actually ranks — do not assume

Run a real search for the query the page is losing on, and take the pages that are genuinely
above it. `WebSearch` is free and returns the live SERP. DataForSEO's `get_serp_results` costs
credits and **that account has been returning HTTP 402 on every endpoint since 2026-09-18**, so
assume the free path is the only one until someone says it has been topped up.

Pick 3–5 competitors. Include at least one that is *not* a national brand, or the whole
comparison collapses into "they are Progressive and we are not", which you knew already.

## 2. Measure both sides

```bash
npx tsx scripts/diagnose-ranking.ts \
  --url https://www.beforeregret.com/guides/<slug>/ \
  --vs https://a.example/x,https://b.example/y,https://c.example/z
```

It prints words, H2 count, tables, lists, `.gov`/`.edu` citations, outbound links and schema for
every page side by side; the **coverage gap** — multi-word terms most rivals use that our page
does not; a cliché and slop scan of our page; and the same scan run on theirs.

Large sites frequently answer automated requests with 403. The script says which failed and
carries on with the rest. If none respond, read them by hand — do not infer.

## 3. Read the output against this table

| what you see | what it means |
|---|---|
| our words and H2s **well above** the median, coverage gap thin | content is not the gap. Look off-page. |
| our words **well below**, gap full of substantive terms | real coverage gap. Extend the page. |
| gap is all brand names and boilerplate | noise. Ignore it. |
| rivals carry **as many or more** clichés than us | phrasing is not the differentiator. Full stop. |
| we have schema and citations, they do not, and they still win | almost certainly links and age. Say so. |

**The coverage gap deserves a second look before you act on it.** On
`get-home-insurance-aluminum-wiring` the gap was phrases like *"insurance companies charge higher
rates"* and *"companies insure"* — flat commercial assertions our carrier rule forbids us from
making. That is not a content deficiency; it is our own editorial standard costing us query
match, and the right response is to argue about the standard, not to quietly break it. Read
§3 of the content standard before treating any gap term as a to-do.

## 4. Write the verdict in this shape

1. **What the page measures against the pages above it** — the table, no adjectives.
2. **Whether content explains the gap** — yes or no, with the numbers that decide it.
3. **What is fixable**, ranked, each with the measurement behind it.
4. **What is not fixable by editing this page** — backlinks, domain age, brand demand, click
   behaviour. Name them so they are not silently mistaken for content problems.
5. **What you could not see.** The script cannot measure links or age. Say so rather than
   letting the absence read as an all-clear.

If content does not explain the gap, **say that and stop**. A page already longer, better cited
and cleaner than everything above it does not need another rewrite, and recommending one anyway
is how a week disappears into work that could not have helped.

## 5. Changing anything afterwards

Stop and check before editing:

- **Is this page in a live experiment?** Read `data/ai-verdict-test.json` and
  `data/zero-click-meta-test.json`. Most guides are controls. Changing a control's
  `quick_answer` opening moves it between arms and silently corrupts the readout.
- **What does the field feed?** `quick_answer` renders as the on-page TL;DR and fills
  `FAQPage.acceptedAnswer` — not the title, meta, body, slug or canonical.
- **Budgets:** title ≤60, meta 70–155, `quick_answer` 120–450, the 450 being a mobile ceiling
  because 63.3% of this site's Google clicks are mobile.
- Then the usual gate: `npx tsx scripts/assert-article-quality.ts` must exit 0, and
  `npm run build` after any database write, or the change is not live.
