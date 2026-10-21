# Good vs bad programmatic SEO: what search engines actually say

**Researched:** 2026-10-21. **For:** deciding whether, and how, Before Regret does pSEO.

**How to read this.** Every claim is labelled:
- **[Google]** / **[Bing]** is the engine's own primary page, read on the date shown.
- **[Mueller]** is Google's Search Advocate, from the original post (read in the browser).
- **[Secondary]** is press or SEO-industry reporting, which is directional only.
- **[Ours]** is our own data.
- **[Inference]** is my reasoning, not anyone's statement.

The wording below is paraphrased. Follow the links for the exact text.

---

## 1. What the engines define as bad

### 1.1 Google: scaled content abuse
Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies), last updated 2026-08-28; [March 2024 announcement](https://developers.google.com/search/blog/2024/03/core-update-spam-policies).

- **[Google] Definition:** many pages generated mainly to manipulate rankings rather than help users. It usually means large amounts of unoriginal content of little or no value.
- **[Google] The method doesn't matter.** In March 2024 the old "automatically generated content" policy was widened. It now covers automation, human effort, or any mix: hand-written templated pages count too.
- **[Google] Examples given:**
  - AI or other tools producing many pages without value;
  - scraping feeds or search results and transforming them (synonyms, translation);
  - stitching content from other pages together without adding value;
  - several sites built to hide the scale;
  - pages that make little sense to a reader but contain keywords.
- **[Google] If a site hosts such content,** Google advises excluding it from Search.

### 1.2 Google: doorway abuse (the classic bad location-page pattern)
- **[Google]** Pages made to rank for many similar searches that funnel the visitor elsewhere. Examples:
  - many pages or domains targeting regions or cities that lead to one destination;
  - near-duplicate pages that sit closer to search results than a clear, browsable hierarchy does.
- **[Secondary]** In 2019 Mueller reportedly called a plan for 1,300 "keyword + city" pages doorway pages. This comes from a forum repost of Search Engine Roundtable, and I didn't verify the original.

### 1.3 Google: the rater guidelines (September 11, 2025 edition, read from the primary PDF)
- **§4.6.5 Scaled content abuse:** raters give **Lowest** to sites built from scaled content with no originality or added value, *whatever the method*. A rater may judge it after looking at several pages, even without knowing how the pages were made.
- **§4.6.6:** **Lowest** goes to pages whose main content is almost entirely copied, paraphrased, embedded or auto/AI-generated, with little effort, originality or added value. This holds **even if sources are credited**.
- **Worked example, "Auto-generated car engine code" (Lowest):**
  - Each page on the site was made by filling a template from a list of error codes, with no manual checking.
  - The key fact (the code's cause) was missing from the page.
  - The code was repeated as keywords, and nobody was named as responsible for the site.

  **This is the textbook bad-pSEO page.**
- **Other Lowest examples:**
  - templated pages built from Amazon product data;
  - hundreds of templated question-and-answer articles, a format often made by harvesting "People also ask" questions and answering them with paraphrased text.
- **§5.2.2 Filler:** low-effort content that takes prominent space and makes a page look rich without helping. This is the boilerplate intro on templated pages.
- **§3.2 Effort:** effort includes **building page functionality and the systems that power a page**, not only writing. By contrast, thousands of pages made by running free content through software with no oversight show **no** effort.
- **Rater scores don't directly change rankings.** Google uses them to evaluate its systems.

### 1.4 Google: AI and automation
Source: [Using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content), updated 2026-10-01; [Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), updated 2026-10-05.

- **[Google] AI is not banned.** Using it mainly to manipulate rankings is.
- **[Google]** Producing lots of text with AI and no manual review or curation, or generating pages automatically from feeds, counts as little or no effort.
- **[Google] Everything AI-produced must be fact-checked by a person,** including titles, meta descriptions, structured data and alt text.
- **[Google] The "Who, How, Why" questions:**
  - Disclose how automation was used where readers would wonder.
  - "Why" is the most important question: was the page made mainly for people who'd come to the site directly?
- **[Google] Warning signs** from the self-assessment list:
  - lots of content on many topics hoping some performs;
  - extensive automation across many topics;
  - mainly summarising others;
  - readers needing to search again;
  - targeting a word count;
  - changing dates without real changes.

### 1.5 Bing
Source: [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a), read in the browser 2026-10-21.

- **[Bing] Things to avoid:**
  - automatically generated content at scale without oversight, quality control or editorial review (it may be excluded from the index);
  - scraped or lightly rewritten content;
  - duplicate content across URLs;
  - keyword stuffing and engineered language;
  - affiliate pages without value;
  - misleading structured data;
  - cloaking;
  - link schemes;
  - prompt injection aimed at its AI.
- **[Bing] Crawl waste:** large numbers of low-value or duplicate URLs can directly **limit indexing and delay discovery of the important pages**.
- **[Bing] Removing pages:** return 404 when removing content, and notify Bing through IndexNow on add, update and delete. List only canonical URLs in sitemaps, with accurate lastmod.
- **[Bing] What earns AI citations:**
  - pages focused on one topic;
  - key facts stated explicitly and early, so the page stands on its own;
  - consistent entity names.

---

## 2. How damage spreads beyond the bad pages

- **[Google, 2022, still the most direct statement]** The helpful-content signal was described as **site-wide**. Sites with a lot of unhelpful content do worse overall, removing that content can help the rest, and recovery can take months. Sources: [2022 post](https://developers.google.com/search/blog/2022/08/helpful-content-update), [Core updates page](https://developers.google.com/search/docs/appearance/core-updates) (updated 2025-12-10).
- **[Google, 2024]** That system is now part of the core ranking systems. They work mainly page by page, but some site-wide signals are still used.
- **[Google]** The Core updates page treats deleting content as a last resort. Recovery can take **several months**, sometimes until the next core update.
- **[Mueller, Bluesky, 7 Sept 2026]** ([post](https://bsky.app/profile/johnmu.com/post/3muwiaqvf5t22), read in full):
  - **The setup:** a site that generated combination pages, was de-indexed as thin, noindexed those pages, and months later found even its core pages stuck on "Crawled – currently not indexed".
  - **His points:**
    - This kind of pSEO often ends up spam, borderline spam or low quality.
    - Padding pages with more generated text doesn't help.
    - Google's systems may have lost faith in the site because of the old pages.
    - Fixing that takes time and significant effort.
  - In 2023 he was also reported as calling pSEO "often a fancy banner for spam" ([Secondary, SER 2023-07-26](https://seroundtable.com/recap-07-26-2023-35772.html)).
- **[Google] Crawl budget** ([doc](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget)):
  - Duplicate and low-value URLs waste crawling.
  - **`noindex` does not save crawl budget:** Google still fetches the page. Use robots.txt to stop the crawling, and 404/410 for pages that are gone.
- **[Google] Filter pages that show nothing** should return a 404 at their own URL ([faceted navigation doc](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation), updated 2025-12-18).

---

## 3. Real cases

| Case | What happened | Grade |
|---|---|---|
| **Our own county pages, Aug 2026** | 100 data pages at `/county/<slug>/` (Census housing age, EPA radon, FEMA NRI, NOAA), plus generated narratives. 91 were removed on 08-23 as near-identical templated copy, never indexed in months. Today 0 are enabled and `/counties/` returns 410. Commits `d4647ff` and `a09f74b` | [Ours] |
| **Our prune, Sep 2026** | Guides went from 155 to 35; the indexing bottleneck has persisted since ("Discovered – not indexed") | [Ours] |
| **StackScope (Sept 2026)** | Combination pages → de-indexed → noindexed → core pages still not indexed months later; Mueller's "lost faith" reply | [Mueller] primary |
| **"SEO heist" (Causal, 2023)** | About 1,800 AI articles made from a competitor's sitemap. Traffic later fell below its starting level (Ahrefs estimates) | [Secondary] ([NiemanLab](https://www.niemanlab.org/reading/using-this-process-we-published-1800-articles-in-a-few-hours/), [The Decoder](https://the-decoder.com/?p=9670)) |
| **March 2024 manual actions** | Two independent samples found about 1.7–2% of sites hit; the affected ones leaned heavily on AI content. Google published no count | [Secondary] ([Originality.ai](https://originality.ai/blog/google-march-2024-manual-action-ai-update-list), [Wordtracker](https://wordtracker.com/blog/search-news/googles-march-2024-updates-the-impact-so-far)) |
| **Wise, Zapier, Tripadvisor** (often-cited good pSEO) | Each page carries something you can't get from a summary: live exchange rates and fee comparisons; working integration templates for each app pair; user reviews and photos. Traffic figures vary widely between sources | [Secondary] ([example](https://www.centricdxb.com/insights/zapier-tripadvisor-programmatic-seo)) |

---

## 4. Synthesis: what separates good pSEO from bad

[Inference, built from §1–§3.] A template is not the problem. Google itself treats building functionality as effort. Pages fail when the *set* of them shows that the template, not the reader, decided what exists.

**Good pSEO: every one of these must hold, for every page**
1. **There is a real search behind each page.** Someone already searches for this exact thing, evidenced by our own GSC or Bing data. "Every combination we can generate" is not a reason.
2. **The core value differs from page to page.** Swap the place name between two pages: if what remains is mostly the same, it's a doorway. The differences must be *the answer itself* (data, functionality, a checked local fact), not decoration.
3. **It does something or holds data the reader can't get from a summary.** A working tool, our own computation, a verified link, a chart of our data (the Wise and Zapier pattern; rater §3.2 "functionality").
4. **A person checked something on each page,** for example the portal, the edge cases, or whether the data makes sense. This is the opposite of the car-code example, where a missing cause went unnoticed.
5. **No filler.** No intro boilerplate, no AI paragraph to make it look "rich", no padding with definitions (Mueller's "what does PHP mean" example).
6. **Accountability.** Who made it, how, from which sources and dates, and how to report an error ("Who, How, Why").
7. **It's part of a hierarchy readers can browse, not a funnel.** Each page is a destination, linked from a real parent page, never a stepping stone to another page.
8. **Indexing is decided per page, with honest status codes.** Thin and empty variants are never produced, or get a 404/410. noindex is not a way to save crawling. The sitemap lists only pages we'd defend.
9. **Released in small, measured batches** with a stop rule. Scale only on evidence. Never publish the whole set at once.

**Bad pSEO: any one of these is disqualifying**
- Pages for every combination of keyword and place/attribute, with the same body.
- Generated text, by AI or by template sentences, as the main content.
- Data echoed from a public source with nothing added (scraping or "stitching").
- Empty or near-empty variants left indexable, or noindexed but still linked and crawled at scale.
- Question-and-answer pages built from harvested "People also ask" questions.
- Counting on volume to outweigh quality.

---

## 5. What this means for Before Regret

**[Ours] Our starting position is weaker than a new site's.**
- We have already shipped one bad-pSEO set (the August county pages) and pruned 120 guides in September.
- "Discovered/Crawled – not indexed" has persisted since.
- [Inference] That fits Mueller's "lost faith" description. It's a hypothesis, not a diagnosis, but it makes another page set a **higher** risk for us than for a new site. Mueller's advice is time and clear proof of value, not more pages.

**Already pSEO-like and fits the "good" list:**
- **County permit guides (21).** Each is researched individually, with a portal checked in a browser and local specifics. 17 of 21 are shown on Google (P0 baseline).
- **Tool pages.** `/sunlight/` drew 356 Google impressions in 28 days (P0 baseline), the most of any non-guide page. It *does* something.

**Candidates, ranked from safest to riskiest:**
1. **Add our data to pages that already exist (no new URLs):** put the county data modules on the 21 permit guides (option A). This is pure added value, no new crawl paths, and no doorway risk.
2. **Pages where the tool is the answer:** for example running the report or sunlight tool for a location, where the page itself is functionality. Investigate demand in our own GSC and Bing first, plus what `/sunlight/` already does.
3. **More individually researched county guides:** they're semi-programmatic (shared research steps, written individually). Keep the pace of 2–3 a week.
4. **New template page sets (county data hubs):** only after 1–3 show results, only with a written answer to "what's different from August", and only in batches of 5–10. History says expect "not indexed".

**Never:** pages per address or ZIP; city × trade pages (including Find a Pro landing pages); AI or template-sentence text as main content; any set released all at once.

**Find a Pro note [Inference].** Google's site reputation abuse policy targets third-party content hosted without close oversight to borrow a site's rankings. Our profiles are business-supplied. Keeping thin profiles noindex (already done: an 80-character description is required) and keeping close oversight (removal rights, report link) keeps us on the right side. Never generate landing pages from listings.

---

## 6. A checklist to run before any template page ships

For each candidate page set, answer in writing, with evidence:
1. **Demand:** which first-party query or impression data shows people search for *this* page? (Capture file and date.)
2. **The swap test:** compare two pages from the set with the place names removed. What share of the visible text differs? (Measured by script; target ≥60% page-specific.)
3. **The thing that can't be summarised:** what data, tool or verified fact is on the page? (File or feature.)
4. **The human check:** what did a person verify on *each* page, and when? (Logged date.)
5. **Filler:** is there any paragraph that would read the same on every page? (Must be none, or moved to one methodology page.)
6. **Accountability:** are author, method, sources with dates, and a report-an-error link visible?
7. **Status codes:** do thin or empty variants return 404 or 410, never "200 + noindex" at scale? Does the sitemap list only pages that pass?
8. **Batch and stop rule:** how many pages ship now, when are they read (about 5 weeks), and what result folds or redirects them?
9. **History:** how is this different from the August 2026 county pages? (Must be answered.)

---

### Sources (all read 2026-10-21)
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google March 2024 core update and spam policies: https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- Google helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google generative AI guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google core updates: https://developers.google.com/search/docs/appearance/core-updates
- Google helpful content update (2022): https://developers.google.com/search/blog/2022/08/helpful-content-update
- Google crawl budget: https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget
- Google faceted navigation: https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
- Google page indexing report: https://support.google.com/webmasters/answer/7440203
- Search Quality Rater Guidelines, 2025-09-11 edition (PDF): https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Mueller on Bluesky, 2026-09-07: https://bsky.app/profile/johnmu.com/post/3muwiaqvf5t22
- Secondary: seroundtable.com (2023-07-26), niemanlab.org, the-decoder.com, originality.ai, wordtracker.com, centricdxb.com
