---
name: write-article
description: How BeforeRegret writes an article like a real, careful human expert -- high-effort, first-party, original work that Google and readers recognise as such, never AI filler. Answer the owner's five questions in writing BEFORE drafting (curated around the reader's goal; something unique and first-party; visible evidence of work; beyond common facts; depth only where needed), verify every fact at its primary source, write in a plain human voice, then publish through the enforced gates. Use whenever the owner asks to write, create, draft, plan, research or publish a new article or guide for BeforeRegret, gives a title to write, asks what to write next or which topic or keyword to target, or asks to rewrite or deepen an existing article. Do NOT use for FAQs on an existing page (article-faqs), Instagram posts (instagram-post) or the research studies under /research/. For the "Yes, but" strand, use yes-but-guide alongside this.
---

# Writing a BeforeRegret article

Owner, 2026-10-14: *"I want to create high-effort content -- original facts, first-party information,
original content crafted from our own research, unique perspective -- that Google sees as high-effort
and not just AI-generated content."*

Everything below serves that sentence. All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.
**Read `beforeregret_content_standard.md` (memory) first.** It holds the history behind these rules.

---

## The five questions -- answered in writing before a word of the article

These are the owner's questions, in the owner's words. Answer each in the effort brief (`src/seo/effortBrief.ts`,
`validateEffortBrief()`). The code refuses empty or filler answers. If an honest answer is "no",
**do not write the page yet**: go and get the missing thing, or tell the owner the topic isn't ready.

**1. Is the content edited and curated thoughtfully? Is it organised around the user's goal, with the
most valuable content easy to find?**
- Name the reader's goal as they would say it (`readerGoal`), and what they get on the first phone
  screen (`firstScreen`). On this site, 63% of Google clicks come from phones.
- Structure follows the reader's job, not the topic. The order is what they need first, then next.
- Curate: every section must earn its place. Cut anything the reader wouldn't miss.
- The first paragraph never restates the quick answer; it moves the reader forward (owner, 2026-10-14).

**2. Did we add something unique that does not exist elsewhere? First-party information is critical:
original data, facts and observations.**
- `firstParty` must list at least one thing WE made, measured or observed, with a checkable source. What counts here:
  - **Our report engine:** `src/engine/inspectionPriorities.ts` `PRIORITY_RULES` (costs, lifespans, era rules). Read it at run time, never retype it.
  - **Our datasets:** `docs/data/*.json` (studies: flood outside zones, county premiums, dams, permits, housing age), `src/data/homeStats.json`.
  - **Our computations:** the sunlight engine, county figures, anything a script of ours calculates. Commit the script.
  - **Our own Search Console / Bing data:** which questions real people ask us, labelled as ours, never as market size.
  - **Our observations:** an official portal walked through in the browser and screenshotted, dated, with no personal data. A government form read line by line. A real lookup run on a public, non-personal example.
  - **Our diagrams** (`public/images/`), drawn from verified facts.
- A primary document we read (a statute, a code section, a city form) is evidence, not first-party.
  It goes in the fact ledger and in Q4. What makes a page unique is what we DID with it.

**3. Does the content show evidence of work? For example: explaining our methodology, high-quality
photos, screenshots, observations.**
- Every article carries a visible **"How we checked this"** section (or an image we made). The draft gate
  `assertHumanDraft()` fails a page without one. That section names what we read, ran or looked at, and when.
  It also says what we could not verify. It is short, specific and honest. It is not a bibliography dump.
- Screenshots: our own, taken in the in-app browser, cropped to what matters, personal data removed,
  saved under `public/images/` as `.webp`, with alt text that says what the image shows. Never a stock photo
  or an AI image presented as real. (The AI photo once drew the plumbing wrong. See the homepage redesign memory.)
- Tables built from our data say which file they came from.

**4. Does the content go beyond common facts? If someone could easily reproduce it by researching the
internet, it is low-effort. Explain details or edge cases if we need to dive deeper. No made-up stories or cases.**
- Write `reproducibilityCheck` honestly. Answer: could someone rebuild this page by summarising the top five
  results? If yes, the page isn't done.
- `beyondCommonFacts` needs at least two specifics a summary wouldn't have. Good examples:
  - the exact threshold in a statute;
  - the exception buried in a code section;
  - what a city's form actually grades;
  - a number from our own data;
  - a step on an official portal that trips people up;
  - the case where the usual advice is wrong.
- **Never** invent a story, a case, a quote, a "buyer we spoke to", a testimonial, a statistic, a search volume
  or an expert. If a real example is needed, it must be a public record we can cite, or our own observation.

**5. Does the content provide deep discussion? Not every page requires it.**
- Decide `discussion: needed | not-needed`, and say why. Discussion is needed where the reader must weigh
  something: trade-offs, sources that disagree, when the advice changes by state, age or condition.
- A navigational page (find the portal, look up the record) is better short and direct. Padding a page to
  look deep is the opposite of high effort.

---

## Write like a real person who knows the subject

- **Voice:** a knowledgeable friend who has done the homework. Plain words, specific nouns, short and long
  sentences mixed. Say "we" for what Before Regret actually did ("we read the 2021 code text").
- **Earned opinions:** give a view where the evidence supports one ("book the survey first; it's the one
  answer you can't get later"). Admit uncertainty plainly where it exists, once, not in every sentence.
- **No AI tells.** The draft gate rejects the worst: "it's important to note", "in today's", "delve",
  "navigate the…", "ever-evolving", "in conclusion", "whether you're a…", "comprehensive guide", "dive into",
  "furthermore/moreover", "crucial/pivotal", "landscape", "when it comes to", "peace of mind", "not only…but
  also". Also avoid things no gate can catch:
  - every section ending on a tidy summary line;
  - triplets everywhere;
  - headings that are all questions;
  - a closing paragraph that repeats the page.
- **Vary the shape.** No two articles share an outline. Two guides built to one template is the
  scaled-content signature that got 120 pages pruned (2026-09-02).
- **No fear-bait** (owner: a fear post was "gross"). Calm, practical, on the reader's side.

## Rules that never bend

- **Facts:** every fact traces to a primary source, quoted in the fact ledger (`data/fact-ledgers/<slug>.json`;
  template `_TEMPLATE.json`) before drafting. Verify in the browser where needed. Cut what can't be
  verified; don't soften it. A site behind a bot check or a regional block is skipped, never worked around.
  Record it under `blockedSources`.
- **Search data:** first-party only (own Search Console and Bing, `topic-demand.ts`, a person's US results-page
  observation). **Never state a search volume.** Bing counts are a thin sample: relative only.
- **Insurers:** never name an insurer beside an underwriting verb; never write "most carriers…".
- **Report claims:** never imply the report knows facts about a specific house. Reports are area-based.
- **Owner titles:** an owner-given title is used word for word. If it breaks a budget, ask, with the tradeoff.
- **Existing pages:** never change a published slug. Never edit an existing page without the owner's OK. That includes adding links to it.
- **Contractors** are an audience too. They advertise and they link.

---

## The flow

**0. Is it worth a new page?**
- **Demand:** `npx tsx scripts/topic-demand.ts "2-4 word phrase" ...`. Tier 1 is our own impressions,
  tier 2 is Bing counts (relative), tier 3 is nothing, which means writing it as an experiment with a
  stop condition.
- **Overlap: always check.** Search the published articles for the subject, and read the headings and the
  Search Console queries of any close page. If a page already covers it, propose updating that page or a
  clearly different angle, and ask the owner. Examples from 2026-10-13: the deck guides #311 and #326; the
  aerial-photo guide #312.

**1. Briefs.** Write both, then validate both:
- `ArticleBrief` (`src/seo/articleBrief.ts`): who, want, achieve, titlePromise, stopCondition.
- `EffortBrief` (`src/seo/effortBrief.ts`): the five questions.

**2. Research and the fact ledger.** Primary sources only, quoted. This is where the first-party item
gets made: run the numbers, walk the portal, take the screenshot.

**3. Draft.**
- **Floors:** title ≤60 (unless it's the owner's exact title); meta 70–155.
- **Quick answer:** only on question titles, 120–450 chars, verdict first.
- **Reproducibility:** a cost from the engine, a standard by name and number, or a law by number.
- **Links:** prose links only where the text already discusses the target.
- **Cluster:** the slug and title must match a `GUIDE_TOPIC_PATTERNS` bucket.
- **"How we checked this"** section.

**4. Publish script.** Dry run by default. Use the latest `scripts/publish-*.ts` as the pattern, for
example `publish-home-insurance-nonrenewal-roof-photo.ts`. It must:
- call `validateBrief`, `validateEffortBrief` and `assertHumanDraft`;
- check that every number appears in the ledger;
- keep overlap with sibling pages ≤8%;
- find no dead links and no bold-wrapped links;
- carry no insurer names.

Write nothing without `APPLY=true`.

**5. Gate:** `npx tsx scripts/assert-article-quality.ts` must exit 0.

**6. Publish** (only when the owner says "publish"):
1. Run the script with `APPLY=true`.
2. Add FAQs with the `article-faqs` skill. A page without a quick answer still needs them for the FAQPage schema.
3. `npm run build`. **Check the build actually succeeded before pushing.** A retry loop's exit code is not proof.
4. Commit and push.
5. Wait for the deploy, then check `/api/health`, the live page (title, FAQ schema) and `faq-verify-live.ts`.
6. Notify Bing through IndexNow.
7. Run `suggest-inbound-links.ts`. It suggests only; editing an existing page needs the owner's OK.
8. Give the owner the link, and ask them to request indexing in Search Console.

**7. Measure.** Put the read date (about 5 weeks out) and the stop condition in the script header and in memory.
On that date, check whether the page was shown, and act on the stop condition.

## Pace

**A handful of articles a week, never a burst.** Each one is individually researched. Speed is never a
reason to skip question 2 or 3.
