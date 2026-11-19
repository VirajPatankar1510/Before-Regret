---
name: answer-ready-writing
description: Make a new BeforeRegret article usable by Google's AI answers (AI Overviews, AI Mode) without gaming them. Covers three things. (1) Map the buyer's whole decision before choosing the page, because AI search fans one question out into several. (2) Write passages that still make sense when lifted out of the page, checked with check-passages.ts. (3) Measure cited vs clicked vs acted at the read date. Use it ALONGSIDE write-article whenever a new article is planned, drafted or read: at step 0 (is it worth a page / which sub-questions), at step 3 (drafting) and at step 7 (the read). Also use it when the owner asks about AI Overviews, AI Mode, query fan-out, getting cited by AI, llms.txt or "AI SEO" for an article. Do NOT use it to edit or rewrite existing published pages (owner rule 2026-11-19), for FAQs (article-faqs), or for Google Ads.
---

# Answer-ready writing

**Where this comes from:** Neil Patel's video "Google's New Rules for Getting Customers" (2026-11-19). Each claim in it was checked against Google's own documentation before it became a rule here.
- The full analysis, with what was verified and what wasn't: `references/video-analysis-2026-11-19.md`.
- Two of the video's six rules are about Google Ads and are left out.

**What Google itself says (verified 2026-11-19):**
- AI Overviews and AI Mode "may use a 'query fan-out' technique — issuing multiple related searches across subtopics and data sources".
- You don't need special AI files, markup or schema to appear in them.
- Trying to manipulate generative AI answers is spam. So is scaled content made "for the primary purpose of manipulating search rankings and not helping users".

**What is practitioner opinion, not Google's:** that self-contained, specific passages get used more. We treat it as a hypothesis and measure it (part 3).

This skill adds to `write-article`; it never replaces it. The five questions, the fact ledger, first-party-only data, the carrier rule, the owner's voice rules and every gate still apply. Where this skill seems to conflict with one of them, the other rule wins.

---

## 1. Map the decision before choosing the page (write-article step 0)

AI search answers a buyer's question by running the questions behind it. One page that covers its own decision fully is worth more than a page that answers only its title. But a page for every sub-question is exactly what Google's scaled-content policy describes. It's also how this site got pruned on 2026-09-02, from 155 guides to 35.

1. **Write the buyer's decision question** in their words. For example: *"Should I still buy this house if it has a Pushmatic panel?"*
2. **List the questions they must answer before they can act.** Usually 4–8, such as:
   - Is it recalled?
   - Will insurance cover it?
   - What does replacing it cost?
   - Who checks it?
   - What do I ask the seller?

   Take them from first-party evidence only: our own Search Console and Bing captures, `topic-demand.ts`, a person's US results-page observation recorded with `record-observation.ts`, or the owner. Never from third-party question tools.
3. **Check the site for each question.** Search the published articles. Mark each one *answered*, *mentioned in passing* or *gap*.
4. **Decide what each gap is:**
   - **A section of the page you're writing.** This is the default.
   - **A new page.** Only when the gap is its own distinct intent, we can bring primary or first-party facts to it, and it passes the five questions on its own.
   - **Nothing.** When we can't answer it honestly.
5. **Owner rule (2026-11-19):** a gap on an *existing* page is noted, never fixed. Don't propose sections, rewrites or inbound links for published guides. New pages may link out to them.
6. **Write the map into the publish script header**, as a short table (question → answered where / section / new page / skipped). It doubles as the outline check: every row the page claims must be answered in the body.

## 2. Write passages that survive being lifted out (write-article step 3)

Google pulls pages, then uses the specific parts that answer the question. A paragraph that leans on the one before it breaks when it's quoted alone. These rules apply to **key paragraphs**: the opening paragraph, and the first paragraph under each `##`.

- **Name the subject.** Don't open on *It*, *This*, *That*, *These*, *They*, *So* or *Also*. Say the thing: "The 1997 CPSC adapter recall…", not "That recall…".
- **Say who or when it applies:** the year range, the state, the house type or the form. "Our report engine flags knob and tube for houses built up to 1955" works on its own; "It applies to older houses" doesn't.
- **Put the limit next to the claim.** The condition, the exception or the source goes in the same paragraph as the claim it limits. A caveat three paragraphs later never gets quoted.
- **One paragraph, one complete point.** No "as mentioned above" and no "the same form". Name the form again.
- **Don't** chop the page into tiny chunks, add llms.txt, or add "AI schema". Google says none of it is needed, and chopping fights the human-voice rule.
- Non-key paragraphs may use normal transitions. The voice rules still win: no AI tells, mixed sentence lengths, earned opinions. A page made only of standalone sentences reads like a machine wrote it, and this skill must not create that.

**Check it** before showing the owner a draft:

```bash
npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts <slug>          # report
npx tsx .claude/skills/answer-ready-writing/scripts/check-passages.ts <slug> --max-fail 0
```

- The checker flags three things: backward-pointing openers, back-references ("above", "that line", "the same form"), and paragraphs that never name the page's topic.
- **Target for a new draft: zero flagged KEY paragraphs.** Reread non-key flags and fix them when the fix is cheap.
- A flag is a prompt to reread, not proof of a defect. If a flagged paragraph is right as written, say why in the message to the owner.
- **Baseline (2026-11-19, run after publishing, report only under the owner rule):**
  - #372 two-prong: 6 of 16 paragraphs flagged, 0 key.
  - #373 Pushmatic: 3 of 12 flagged, 1 key.

The checker is report-only on purpose. It becomes a gate only if part 3's reads show it matters.

## 3. Cited is not clicked is not acted (write-article step 7, the read)

At every read date, record three numbers per page. Each gap points to a different fix, so one "visibility" number hides the answer.

| outcome | where it comes from | a gap here means |
|---|---|---|
| **Seen / cited:** impressions, and AI-feature appearances | Search Console and Bing pulls; the Generative AI Features export (`scripts/import-ai-features.ts`) | the page isn't being picked up: indexing, topic or passages |
| **Chosen:** clicks and CTR | the same pulls, page dimension (never the query dimension alone) | the title, meta or quick answer doesn't earn the click |
| **Acted:** clicks to the report or tool | `scripts/cta-click-report.ts` (cta_clicks per page) | the page doesn't lead on to the next step |

- Write all three into the read memory.
- Never report a page as winning on impressions alone.
- Compare pages with low key-paragraph flags against high ones over time. That's how we learn whether part 2 earns its keep.

## 4. Optional: what AI says we're good for (a person runs it, monthly at most)

AI search still describes this domain's previous product, the relationship/regret site that ran until 2026-07-31 (memory: prior-domain identity). To check:
1. The owner (or Claude in the in-app browser, if the owner asks) types about 10 real buyer questions into AI Mode, Gemini and ChatGPT.
2. Record whether Before Regret appears, what it's described as, and which sources are cited.
3. Trace wrong descriptions back to their source.

Rules for the test:
- Never automate queries against a search engine or chatbot. Never work around a bot check.
- Treat results as diagnosis only. One run can't prove a fix worked.

## Not taken from the video

- Google Ads AI Max and lead import (rules 4–5).
- Third-party question tools.
- Agency survey numbers and Google Ads uplift figures. These must never appear on our pages or in our reasoning as evidence.
