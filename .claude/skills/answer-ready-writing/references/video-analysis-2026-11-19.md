# Source analysis: "Google's New Rules for Getting Customers" (Neil Patel, 2026-11-19)

- **URL:** https://www.youtube.com/watch?v=BAbsHO9MabI
- **Channel:** Neil Patel. **Published:** 2026-11-19. **Length:** 15:43 (943 s).
- **What was analysed:** the title, the description and its chapter list, and YouTube's English **auto-generated** transcript (122 segments), read in the in-app browser on 2026-11-19.
- **What was not analysed:** the video's pictures. On-screen text, slides and charts were not seen, so nothing here describes them.
- **Transcription errors:** the auto-captions mangle names. "Nurero Duo" is a made-up example product. "Dan Petravic" is probably Dan Petrovic, and "Sy Shepard" is Cyrus Shepard. "AIAX" / "AAX" / "AMAX" is AI Max.

## The six rules, as the video states them

1. **Win the searches they never typed (0:50).**
   - AI Mode can run several searches for one question. The video calls this "query fan-out".
   - So the query you rank for is only part of the answer.
   - Map the buyer's decision: list the questions they need answered before saying yes, and check your site for each one.
   - Warning attributed to Google: don't make a thin page for every sub-question.
2. **Make your answer work outside your page (2:55).**
   - AI pulls pages, then uses specific passages from them.
   - A paragraph must still make sense when copied out of the page. Name the thing, say who it's for, and put the limit next to the claim.
   - Google says you don't need to chop content into chunks, or add special AI markup or llms.txt.
   - The video cites practitioner tests by Mike King and Cyrus Shepard, and labels them "practitioner research, not Google's formula".
   - The suggested check: copy each key paragraph into a blank doc and see if it holds up.
3. **Fix what AI thinks you're good for (5:04).**
   - Don't count mentions. Check which customer AI assigns you to.
   - Build a test set of about 10 real buyer questions per segment, and run it in AI Mode, Gemini and ChatGPT every week.
   - Record whether you show up, how you're described and which sources are cited, then trace bad descriptions back to their sources.
   - The video's own caveat: this is diagnosis. It can't prove that fixing a page changes the answer.
4. **Decide what your website can advertise (7:25).** Google Ads AI Max can write ads from your pages and choose landing pages. Audit old or wrong pages first, then use URL exclusions and brand controls.
5. **Teach Google which leads are worth buying (9:38).** Import qualified and closed leads into Google Ads and use value-based bidding.
6. **Cited is not chosen (12:21).**
   - Track three outcomes separately: cited, recommended, and a valuable action that followed.
   - Each gap points to a different fix.
   - Report customers, not traffic.

## Checked against Google's own pages (2026-11-19)

| Claim in the video | Primary source | Status |
|---|---|---|
| AI Mode / AI Overviews use "query fan-out", meaning several related searches | developers.google.com/search/docs/appearance/ai-features (last updated 2025-12-10): "may use a 'query fan-out' technique — issuing multiple related searches across subtopics and data sources" | **Verified** |
| No special AI markup, AI text file (llms.txt) or schema is needed | Same page: "You don't need to create new machine readable files, AI text files, or markup"; "no special schema.org structured data" | **Verified** |
| Thin pages made to get into AI answers break the spam policies | developers.google.com/search/docs/essentials/spam-policies (last updated 2026-08-28): spam includes "attempting to manipulate generative AI responses in Google Search". Scaled content abuse is "many pages … generated for the primary purpose of manipulating search rankings and not helping users" | **Verified** in substance. The video's exact wording isn't on the page |
| Google's lawn-weeds fan-out example | Not on the current AI-features page. Only secondary sources quote it | **Unverified**; not used |
| Don't chunk content for AI | Reported from Google's Search Off the Record podcast (2026-01-08, Danny Sullivan) by trade press. The podcast itself wasn't heard | **Secondary only**; we follow it anyway because it costs nothing |
| Self-contained, specific passages get used more | Practitioner tests (King, Shepard), which the video itself labels as not Google's | **Practitioner evidence**; treated as a hypothesis |
| Search Console has a generative AI performance report | We already import Search Console's Generative AI Features export (`scripts/import-ai-features.ts`). Google's page says AI-feature traffic sits inside the Web Performance report | **Consistent** with what we see |
| AI Max gives a "typical 14% lift"; NP Digital surveys (4.7/5, 3.4, 93%, 68%, 37%/6%) | Google Ads marketing and the agency's own surveys | **Not checkable; never cite on our pages** |

## What we take, and what we leave

- **Take (writing):**
  - Rule 1 as a decision map before choosing a page, constrained by the owner's new-pages rule and by Google's scaled-content policy.
  - Rule 2 as a passage rule with a report-only checker.
- **Take (measuring):**
  - Rule 6 as three numbers at every read date: visible or cited, clicked, and acted on.
  - Rule 3 as an optional test that a person runs, tied to the prior-domain identity problem.
- **Leave:**
  - Rules 4 and 5 are about Google Ads bidding and ad copy, not writing articles.
  - The "answerthepublic" tool: third-party data, and our SEO data is first-party only.
  - Every agency and Google Ads statistic.
  - The agency pitch at 12:06.
