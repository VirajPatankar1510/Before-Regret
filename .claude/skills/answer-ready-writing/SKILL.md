---
name: answer-ready-writing
description: "THE skill for writing any new BeforeRegret article or guide (it replaced write-article on 2026-11-24). How BeforeRegret writes like a real, careful human expert -- high-effort, first-party work that Google, its AI answers (AI Overviews, AI Mode) and readers recognise as such, never AI filler. Map the buyer's whole decision first; answer the owner's five questions in writing before drafting; verify every fact at its primary source into a fact ledger; write in a plain human voice with key paragraphs that still make sense when lifted out of the page (check-passages.ts); publish through the enforced gates; then read seen vs chosen vs acted. Use whenever the owner asks to write, create, draft, plan, research or publish a new article or guide, gives a title to write, asks what to write next or which topic or keyword to target, or asks about AI Overviews, AI Mode, query fan-out, getting cited by AI, llms.txt or 'AI SEO' for an article. Do NOT use to edit or rewrite existing published pages (owner rule 2026-11-19), for FAQs on an existing page (article-faqs), Instagram posts (instagram-post), the research studies under /research/, or Google Ads. For the 'Yes, but' strand use yes-but-guide alongside this; for state contractor-license pages use state-license-guides alongside this."
---

# Writing a BeforeRegret article (answer-ready)

Owner, 2026-10-14: *"I want to create high-effort content -- original facts, first-party information,
original content crafted from our own research, unique perspective -- that Google sees as high-effort
and not just AI-generated content."*

Owner, 2026-11-24: this skill **replaces write-article**. It is write-article's full flow, with the
answer-ready rules (decision map, standalone passages, seen/chosen/acted) built into its steps instead
of sitting in a second skill. The old write-article text is kept in `references/write-article-retired-2026-11-24.md`.

All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.
**Read `beforeregret_content_standard.md` (memory) first.** It holds the history behind these rules.

### What Google itself says (verified 2026-11-19)
- AI Overviews and AI Mode "may use a 'query fan-out' technique — issuing multiple related searches across subtopics and data sources".
- You don't need special AI files, markup or schema to appear in them.
- Trying to manipulate generative AI answers is spam. So is scaled content made "for the primary purpose of manipulating search rankings and not helping users".
- **Practitioner opinion, not Google's:** that self-contained, specific passages get used more. We treat it as a hypothesis and measure it (step 7).
- Source: Neil Patel's video "Google's New Rules for Getting Customers" (2026-11-19), every claim checked against Google's docs first. Full analysis: `references/video-analysis-2026-11-19.md`.

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
  - **Our computations:** the sunlight engine, county figures, anything a script of ours calculates (Census ACS via curl, e.g. `scripts/build-south-pasadena-housing-age.ts`). Commit the script.
  - **Our own Search Console / Bing data:** which questions real people ask us, labelled as ours, never as market size.
  - **Our observations:** an official portal walked through in the browser and screenshotted, dated, with no personal data. A government form read line by line. A real lookup run on a public, non-personal example (a city hall, never a private home).
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

- **Voice:** a knowledgeable friend who has done the homework (`docs/brand/voice-guide.md`). Plain words, specific nouns, short and long
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
  scaled-content signature that got 120 pages pruned (2026-09-02). Reused sentences from a sibling page
  (especially in "How we checked this") will trip the 8% overlap check -- write each page's method fresh.
- **No fear-bait** (owner: a fear post was "gross"). Calm, practical, on the reader's side.

### Passages that survive being lifted out

Google pulls pages, then uses the specific parts that answer the question. A paragraph that leans on the one
before it breaks when it's quoted alone. These rules apply to **key paragraphs**: the opening paragraph, and
the first paragraph under each `##`.

- **Name the subject.** Don't open on *It*, *This*, *That*, *These*, *They*, *So*, *Both* or *Also*. Say the thing: "The 1997 CPSC adapter recall…", not "That recall…".
- **Say who or when it applies:** the year range, the state, the house type or the form. "Our report engine flags knob and tube for houses built up to 1955" works on its own; "It applies to older houses" doesn't.
- **Put the limit next to the claim.** The condition, the exception or the source goes in the same paragraph as the claim it limits. A caveat three paragraphs later never gets quoted.
- **One paragraph, one complete point.** No "as mentioned above" and no "the same form". Name the form again.
- **Don't** chop the page into tiny chunks, add llms.txt, or add "AI schema". Google says none of it is needed, and chopping fights the human-voice rule.
- Non-key paragraphs may use normal transitions. The voice rules still win. A page made only of standalone sentences reads like a machine wrote it.

---

## Rules that never bend

- **Facts:** every fact traces to a primary source, quoted in the fact ledger (`data/fact-ledgers/<slug>.json`;
  template `_TEMPLATE.json`) before drafting. Verify in the browser where needed. Cut what can't be
  verified; don't soften it (record it under `cut`). A site behind a bot check or a regional block is skipped, never worked around.
  Record it under `blockedSources`.
- **Search data:** first-party only (own Search Console and Bing, `topic-demand.ts`, a person's US results-page
  observation). **Never state a search volume.** Bing counts are a thin sample: relative only. No third-party question tools.
- **Insurers:** never name an insurer beside an underwriting verb; never write "most carriers…".
- **Report claims:** never imply the report knows facts about a specific house. Reports are area-based.
- **Owner titles:** an owner-given title is used word for word. If it breaks a budget, ask, with the tradeoff.
- **Grow by adding, never by fixing (owner, 2026-11-19):** "don't fix already existing pages. add new pages." Topical authority comes from NEW pages next to the ones that already rank, each owning an intent the old page doesn't. Don't propose sections, rewrites, title tests or inbound links for published guides. A new page may link out to them in its own prose. Never change a published slug. If you find a factual error on an existing page, report it with the evidence and don't fix it unasked.
- **Contractors** are an audience too. They advertise and they link.
- **Advertisers:** a page is never written as a traffic promise to a vendor. If an advertiser's area prompts a page, it must stand on its own merits and the owner is told it's an experiment.

---

## The flow

**0. Is it worth a new page? Map the decision first.**

AI search answers a buyer's question by running the questions behind it. One page that covers its own
decision fully is worth more than a page that answers only its title. But a page for every sub-question is
exactly what Google's scaled-content policy describes, and how this site got pruned (155 guides to 35).

1. **Write the buyer's decision question** in their words: *"Should I still buy this house if it has a Pushmatic panel?"*
2. **List the 4–8 questions they must answer before they can act** (is it recalled? will insurance cover it? what does replacing it cost? who checks it? what do I ask the seller?). Take them from first-party evidence only, or the owner.
3. **Check the site for each one** (search the published articles): *answered*, *mentioned in passing* or *gap*.
4. **Decide each gap:** a section of this page (the default); a new page only if it's its own intent, we have primary or first-party facts, and it passes the five questions alone; or nothing, if we can't answer it honestly.
5. **Demand:** `npx tsx scripts/topic-demand.ts "2-4 word phrase" ...`. Tier 1 is our own impressions,
   tier 2 is Bing counts (relative), tier 3 is nothing, which means writing it as an experiment with a stop condition.
6. **Overlap: always check.** Search the published articles for the subject, and read the headings and the
   Search Console queries of any close page. If a page already covers it, propose a clearly different angle and ask the owner.
7. **Is the format proven? (owner rule 2026-11-17: "scale only the page formats where we can repeatedly demonstrate independent user value and actual search demand").** Check the format's row in the scorecard (memory `feedback_scale_only_proven_formats`). The gate (thresholds are ours, not the owner's): 5+ pages older than 5 weeks, 80%+ of them shown, median about 50+ Google impressions per 28 days, and median CTR about 1%+ or about 1+ click per page. A proven format (county/city permit, insurance question) can take more pages at normal pace. Anything else, or tier-3 demand, is an **experiment**: tell the owner before drafting, say so in the publish-script header with a stop condition, and never write a batch of them.
8. **Range widely.** Topic ideas aren't limited to named defects (owner, 2026-08-24: the defect scope is "very limiting"). Look across the whole buying decision: research before an offer, the contract, inspection, insurance, closing, the first year in the house.
9. **Write the map into the publish script header** as a short table (question → answered where / section / new page / skipped). Every row the page claims must be answered in the body.

**1. Briefs.** Write both, then validate both:
- `ArticleBrief` (`src/seo/articleBrief.ts`): who, want, achieve, titlePromise, stopCondition.
- `EffortBrief` (`src/seo/effortBrief.ts`): the five questions.

**2. Research and the fact ledger.** Primary sources only, quoted. This is where the first-party item
gets made: run the numbers, walk the portal, take the screenshot. Every number and every quote of 12+
characters that the page will use must be in the ledger (`facts` quotes for quotes; `facts` or `ourWork` for numbers).

**3. Draft.**
- **Floors:** title ≤60 (unless it's the owner's exact title); meta 70–155. An owner title longer than 60 is never shortened silently: ask, with the tradeoff, and if it stays, add it to `OWNER_LONG_TITLES`.
- **Title = H1.** The `title` column drives the `<h1>`, the `<title>` and the schema at once; there is no separate SEO title. Any table of proposed titles shown to the owner carries a column "H1 changes too: yes". If a brief says no H1 changes, raise the conflict before publishing.
- **Use the searcher's word.** Put the exact word searchers use (from our GSC/Bing captures) in the title and in at least one H2, not only in the body. Measured on this site: "evaluation" moved the EIFS guide from position 41 to 16; "IDIS" moved LA from 17 to 9. Portal and system names (IDIS, EnerGov, SHAPE PHX) are searcher words for permit pages.
- **No internal SEO notes on the page** (owner, 2026-11-13). Never write why we chose the topic ("our Bing data showed…", "Why this page…", AI-citation talk) in the body, the quick answer or the FAQs. Demand evidence lives only in the brief, the ledger `demand` field and the script header. `INTERNAL_SEO_NOTE` in `effortBrief.ts` fails the draft if it slips in.
- **Quick answer:** only on question titles, 120–450 chars, verdict first.
- **Reproducibility:** a cost from the engine, a standard by name and number, or a law by number (e.g. "Health and Safety Code § 19851", "Statutes § 39-121").
- **Links:** prose links only where the text already discusses the target.
- **Cluster:** the slug and title must match a `GUIDE_TOPIC_PATTERNS` bucket.
- **"How we checked this"** section.
- **Passages:** run the checker. Target: zero flagged KEY paragraphs; fix non-key flags when cheap. A flag is a prompt to reread, not proof -- if a flagged paragraph is right as written, say why to the owner.

```bash
npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts <slug>
npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts <slug> --max-fail 0
```

**4. Publish script.** Dry run by default. Copy the latest `scripts/publish-*.ts` (e.g.
`publish-city-of-south-pasadena-permit-guide.ts`). It must:
- call `validateBriefs`, `validateEffortBrief` and `assertHumanDraft`;
- check that every number appears in the ledger and every long quote is a ledger quote;
- keep overlap with sibling pages ≤8%;
- find no dead links and no bold-wrapped links;
- carry no insurer names;
- hold the decision map, the read date and the stop condition in its header.

Write nothing without `APPLY=true`.

**5. Gate:** run the library-wide gate with the new draft included (scripts that touch the DB need
`NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts"`):

```bash
npx tsx scripts/assert-article-quality.ts --draft guides/<slug>.md
```

- **The new page must have zero violations of its own.** That part is non-negotiable.
- **A violation on an already-published page is not this page's blocker.** Report it to the owner with the evidence, and don't fix it (grow-by-adding rule). Never run `--seed` to re-baseline it away without the owner's OK, because that silences the gate for good.
- Known as of 2026-11-24: #385 Brevard fails "no cost figure and no numbered standard" and awaits the owner's decision. Until that's settled, the gate exits 1 for everyone; read the violation list and confirm none of them names the new slug.

**6. Publish** (only when the owner says "publish"):
1. Run the script with `APPLY=true`.
2. **County permit guides only:** add the Permit Pulse block (`ONLY=<slug>`, see memory `beforeregret_permit_pulse`) and read every VERBOSE paragraph before applying it, because figures go stale. City pages get no Pulse block; Pulse is county-level.
3. Add FAQs with the `article-faqs` skill. A page without a quick answer still needs them for the FAQPage schema.
4. `npm run build`. **Check the build actually succeeded before pushing.** A retry loop's exit code is not proof.
5. **If anything server-reachable changed** (`server.ts`, `src/server/*`, or a `src/data/*` / `src/utils/*` file they import): every relative import needs a `.js` extension. Build, `tsc` and esbuild all accept extensionless imports; only the live Vercel function doesn't, and one missing `.js` took every `/api` route down for 9 minutes on 2026-10-12.
6. Commit only this page's files (other people's uncommitted edits stay out) and push (`git push origin HEAD:main` after `git merge-base --is-ancestor origin/main HEAD`).
7. **Confirm a deploy was actually attempted**, not just that the URL answers: check that the newest entry from `curl -s "https://api.github.com/repos/VirajPatankar1510/Before-Regret/deployments?per_page=2"` has your commit's sha (the `gh` CLI isn't installed here; plain curl works). Vercel can reject a config before any build exists (the hourly-cron incident, 2026-08-29), and the old build keeps serving, looking healthy.
8. Then check `/api/health`, one real API route if server code changed, the live page (title, FAQ schema) and `faq-verify-live.ts`.
9. Notify Bing through IndexNow (`submitUrlsToIndexNow` in `src/utils/indexNowService.ts`).
10. Optional: `suggest-inbound-links.ts`, as a report only. Existing pages are not edited to add links.
11. Give the owner the link, and ask them to request indexing in Search Console.

**7. Measure: seen, chosen, acted.** Put the read date (about 5 weeks out) and the stop condition in the
script header and in memory. At the read, record three numbers -- each gap points to a different fix:

| outcome | where it comes from | a gap here means |
|---|---|---|
| **Seen / cited:** impressions, and AI-feature appearances | Search Console and Bing pulls; the Generative AI Features export (`scripts/import-ai-features.ts`); `scripts/gsc-url-inspection-sweep.ts` for index status | the page isn't being picked up: indexing, topic or passages |
| **Chosen:** clicks and CTR | the same pulls, page dimension (never the query dimension alone) | the title, meta or quick answer doesn't earn the click |
| **Acted:** clicks to the report or tool | `scripts/cta-click-report.ts` (cta_clicks per page) | the page doesn't lead on to the next step |

- Never report a page as winning on impressions alone. Act on the stop condition.
- Compare pages with few key-paragraph flags against pages with many over time. That's how we learn whether the passage rules earn their keep; the checker becomes a gate only if they do.
- Baseline (2026-11-19, report only): #372 two-prong 6 of 16 flagged, 0 key; #373 Pushmatic 3 of 12, 1 key.

## Optional: what AI says we're good for (a person runs it, monthly at most)

AI search still describes this domain's previous product, the relationship/regret site that ran until
2026-07-31 (memory: prior-domain identity). The owner (or Claude in the in-app browser, if the owner asks)
types about 10 real buyer questions into AI Mode, Gemini and ChatGPT, and records whether Before Regret
appears, what it's described as, and which sources are cited. Never automate queries against a search engine
or chatbot, never work around a bot check, and treat results as diagnosis only.

## Pace

**A handful of articles a week, never a burst.** After the Nov 16 burst (20 guides in a week) a cap of 2 new
pages a week was proposed to the owner; check whether they accepted it before starting a third. Each one is individually researched. Speed is never a reason to skip
question 2 or 3.

## Not taken from the video

Google Ads AI Max and lead import; third-party question tools; agency survey numbers and Google Ads uplift
figures. These must never appear on our pages or in our reasoning as evidence.
