# AI Overview response schema and processing pipeline

How to parse DataForSEO's Google AI Overview payloads, what the fields actually mean, and the
traps that will silently corrupt a naive parser.

Derived from **three live samples across two surfaces**, captured 2026-09-10. Nothing here is
inferred from documentation; every claim is traceable to one of the three payloads.

| # | surface | endpoint | keyword |
|---|---|---|---|
| 1 | AI Mode | `serp/google/ai_mode/live/advanced` | what does open ground mean on a home inspection |
| 2 | AI Mode | `serp/google/ai_mode/live/advanced` | how many high hazard dams are in the us |
| 3 | Organic SERP | `serp/google/organic/live/advanced` | how many high hazard dams are in the us |

Samples 2 and 3 are the **same query on different surfaces**, which is what makes the surface
differences below observable rather than guessed.

---

## 1. The correction that motivated this document

An earlier reading of sample 1 treated `se_results_count: 0` as a zero-click signal — evidence
that AI Overviews were suppressing organic results.

**That was wrong.** It is an artifact of which surface the endpoint queries.

```
sample 1 (ai_mode)  check_url ...&udm=50   se_results_count: 0
sample 2 (ai_mode)  check_url ...&udm=50   se_results_count: 0
sample 3 (organic)  check_url (no udm)     se_results_count: 113
```

`udm=50` is Google's **AI Mode tab**, a separate surface that does not carry a traditional organic
list. `se_results_count: 0` there means "this surface has no organic results", not "Google
suppressed them". Two samples agreeing proved nothing, because on that surface the value can only
ever be 0.

Sample 3 shows what the main SERP actually does:

```
item_types: ["ai_overview", "organic", "people_also_ask", "related_searches"]
items_count: 12   →  1 AI overview + 9 organic + PAA + related searches
```

The AI Overview takes `rank_absolute: 1` and the first organic result takes `rank_absolute: 2`.
**They coexist.** Ranking beneath an AI Overview is still worth something.

**Rule: never infer zero-click from `se_results_count` on an `ai_mode` payload.** Only the organic
endpoint can answer that question.

---

## 2. Surface comparison

Same query, sample 2 versus sample 3:

| | AI Mode (s2) | Organic SERP (s3) |
|---|---|---|
| `se_results_count` | 0 | 113 |
| `item_types` | `[ai_overview]` | `[ai_overview, organic, people_also_ask, related_searches]` |
| AI overview elements | 4 | 3 |
| Element `title` populated | none | 1 of 3 |
| Parent `references` | 4 | 7 |
| `asynchronous_ai_overview` | absent | `true` |
| Cited commercial sites | none | yes (Groundworks, ABC4) |

Two things follow.

**The same query produces different citation sets on different surfaces.** AI Mode cited four
sources, all federal or institutional (FEMA, USACE NID, ASCE, AGU). The organic SERP cited seven,
including a contractor marketing page and a local TV station. Any "who does Google cite" analysis
must state which surface it measured.

**`asynchronous_ai_overview` only exists on the organic payload.** See §5.

---

## 3. Field taxonomy

### Answer content — only two places, and they overlap

| path | form | caveat |
|---|---|---|
| `items[n].markdown` | whole answer, one string | contains citation markup that must be stripped |
| `items[n].items[].text` | per-block, plain | **loses list structure** — bullets flatten to one paragraph |
| `items[n].items[].markdown` | per-block, formatted | keeps bullets, keeps citation noise |

Neither `text` nor `markdown` alone is sufficient. Use `markdown` and strip; `text` is only safe
when the block has no list.

### Attribution — four distinct fields, commonly conflated

| field | scope | meaning |
|---|---|---|
| `items[n].references` | parent | deduped union, `position: "right"` (sidebar cards) |
| `items[n].items[].references` | element | per-claim attribution, `position: "left"` (inline) |
| `items[n].items[].links` | element | inline prose hyperlinks — **not citations** |
| `items[n].items[].images` | element | null in all three samples; never exercised |

`links` and `references` are independent. Sample 2 element 2 has `links` populated and
`references: null`; element 3 has both. Merging them loses the distinction between "the answer
linked to this" and "the answer cited this as a source".

Parent references are the deduped set; element references are the per-claim subsets. Store both, or
you lose either *who was cited* or *for which claim*.

### System artifacts — discard

`id`, `status_code`, `time`, `cost`, `result_count`, `path`, `data.*`, `rank_group`,
`rank_absolute`, `page`, `position`, `xpath`, `rectangle`.

`xpath` is a literal selector into Google's rendered DOM. It is a scraping artifact with no
analytical value and will change without notice.

---

## 4. Traps

Each of these is observed in the samples, not hypothetical.

### 4.1 `domain` is markdown-wrapped when it starts with `www.`

```
"domain": "[www.fema.gov](https://www.fema.gov)"     ← wrapped
"domain": "[www.groundworks.com](https://www.groundworks.com)"
"domain": "infrastructurereportcard.org"              ← clean
"domain": "nid.sec.usace.army.mil"                    ← clean
```

The pattern holds across every occurrence in samples 2 and 3, in both `references` and `organic`
items. Normalise on every read:

```
domain = /^\[([^\]]+)\]\(.*\)$/.exec(raw)?.[1] ?? raw
```

### 4.2 Element `title` is unreliable for section detection

Sample 1 had 3 of 7 elements titled. Sample 2 had **0 of 4**. Sample 3 had 1 of 3. Structure in the
untitled cases comes from markdown bullets *inside* a single element, not from element boundaries.

**Do not key section classification on `title != null`.** Parse the markdown.

### 4.3 Element counts and shapes do not generalise

7, 4 and 3 elements across three samples. There is no fixed template. A parser that assumes
"element 1 is the definition, element N is the follow-up" works on sample 1 and fails on sample 2.

### 4.4 Dangling lead-in elements

Sample 1 splits its follow-up block across two elements: one containing only
`"Would you like to know:"` and the next containing the questions. Samples 2 and 3 put both in a
single element. Handle a trailing element ending in `:` by merging it forward.

### 4.5 References contain duplicates

Sample 3, element 2 `references`: FEMA appears twice at different URLs, ASCE twice at the same URL,
Center for American Progress twice. Dedup by `url` before counting or displaying.

### 4.6 Fused components

Sample 1's `"Is It a Big Deal?"` block contains both severity and remediation as separate bullets
under one heading. One element can hold multiple logical components.

---

## 5. Async loading (organic endpoint only)

Google loads the AI Overview **after** initial page render. The organic endpoint therefore requires:

```json
{ "load_async_ai_overview": true }
```

Without it the AI Overview is **absent from the payload entirely**, which reads identically to
"Google showed no AI Overview". This is the single most dangerous default in the API — it produces
a confident false negative.

When set, the payload carries `"asynchronous_ai_overview": true` on the AI overview item. Treat its
presence as confirmation the async fetch actually ran.

### People Also Ask contains a second AI surface

Sample 3's PAA items each carry:

```json
"expanded_element": [{
  "type": "people_also_ask_ai_overview_expanded_element",
  "items": null, "references": null,
  "asynchronous_ai_overview": true
}]
```

`items` and `references` are null because the PAA answers were not expanded. Expanding them costs
extra (`people_also_ask_click_depth`). Worth knowing that AI Overviews nest inside PAA — a
completeness audit that ignores this undercounts AI surfaces on the page.

---

## 6. Canonical schema

```ts
interface AiOverviewCapture {
  query: string;
  captured_at: string;                       // ISO 8601, from result[].datetime
  surface: 'ai_mode' | 'organic';            // from data.se_type
  locale: { location_code: number; language_code: string; device: string };

  present: boolean;                          // 'ai_overview' in item_types
  async_confirmed: boolean;                  // asynchronous_ai_overview === true
  rank_absolute: number | null;

  /** Only meaningful when surface === 'organic'. Null on ai_mode — see §1. */
  organic_results_count: number | null;
  coexisting_item_types: string[];

  content: {
    markdown_raw: string;                    // items[0].markdown, verbatim
    markdown_clean: string;                  // citation markup stripped
    blocks: Array<{
      heading: string | null;
      text: string;
      markdown: string;
      is_follow_up: boolean;
    }>;
  };

  attribution: {
    has_citations: boolean;                  // a first-class fact, not a null
    sidebar: Citation[];                     // parent references, deduped
    inline: Array<{ block_index: number; citations: Citation[] }>;
    prose_links: Array<{ block_index: number; links: Link[] }>;
  };

  follow_ups: string[];                      // first-class — see §7
  related_searches: string[];                // organic surface only
  paa_questions: string[];                   // organic surface only

  cost_usd: number;
  content_hash: string;                      // sha256 of markdown_clean
}

interface Citation { source: string; domain: string; url: string; title: string; snippet: string }
interface Link { title: string; url: string; domain: string }
```

`has_citations: false` is stored as a fact rather than left as an absent field. "Google answered
this and cited nobody" is a finding, and a null cannot be distinguished from a parse failure.

`content_hash` over the cleaned markdown is what makes re-runs useful: it detects *whether the
answer changed*, which is the thing worth monitoring over time.

---

## 7. Pipeline

**1. Validate.** Require `status_code == 20000` **and** `tasks[].status_code == 20000`. These
differ — this account has returned API `20000` with task `40201` (account paused). Checking only the
outer code ships empty results as successes.

**2. Detect.** `'ai_overview' in result[0].item_types`. Record `item_types` wholesale; what
*else* is on the page is as informative as the overview itself.

**3. Extract.** Take `items[0].markdown` as canonical. Strip citation markup:
empty anchors `[](url)` and numbered refs `[[n]](url)`. Keep the raw copy too — the markup encodes
which claim carried which citation, and is not recoverable once stripped.

**4. Segment.** Walk `items[0].items[]`. Merge dangling lead-ins (§4.4). Split fused blocks (§4.6).
Classify follow-ups by trailing position and interrogative form, never by `title`.

**5. Harvest attribution.** Read `references` and `links` at both levels. Dedup by URL. Normalise
every `domain` (§4.1).

**6. Persist.** Key on `(query, surface, location_code, language_code, device)`. Store
`content_hash` and `captured_at` per run so change-over-time is queryable.

---

## 8. What this is for

Two questions this pipeline exists to answer, both of which need repeated captures rather than a
single look:

**Does an AI Overview appear for our target queries, and does it cite anyone?** Sample 1 answered
a full home-inspection question with **zero citations at any level** — no attribution existed to
compete for. Sample 3, on a statistical query, cited seven sources including a contractor marketing
page and a local TV station. The citation bar is not uniform; it varies by query type and by
surface, and only measurement distinguishes them.

**Where does intent go next?** `follow_ups`, `paa_questions` and `related_searches` are Google
stating what the user asks after the answer. Sample 1 offered *"How common or expensive this
typically is to fix during a home purchase negotiation?"* — a question its own answer did not
address, and one that requires cost data a general model does not hold. That is the most
actionable field in the payload and the easiest to discard as chrome.
