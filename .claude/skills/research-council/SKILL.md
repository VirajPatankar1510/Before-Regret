---
name: research-council
description: Think through a Before Regret task the way a council of scientists and researchers would -- Moskowitz (segment and test), Pirolli & Card (information scent), Herbert Simon (satisficing), Christensen (jobs to be done), Kahneman (fast judgments), Byron Sharp (mental availability), Jonah Berger (why things get shared), Deming (noise vs signal) and Feynman (don't fool yourself) -- then turn the debate into one decision and a measurable experiment. Use whenever the user asks to "use this skill", "think like scientists/researchers", "use the council", or asks how to grow impressions, traffic or search visibility, and before any new article, page, title change, social post or growth experiment where they invoke it. It decides WHAT and WHY; it hands execution to write-guide, instagram-post, article-faqs or seo-first-mindset.
---

# The Research Council

Nine researchers whose work bears on one question: **how does a young, honest site get shown more, clicked more and trusted more in search?** Each one forces a different question. Together they stop the two failures this project keeps hitting: acting on a guess, and reading noise as a result.

The council **thinks**; it does not execute. When it has decided, hand off:
- articles go to `write-guide`;
- social posts go to `instagram-post`;
- FAQs go to `article-faqs`;
- anything touching the public site also goes through `seo-first-mindset`.

The council never overrides a rule those skills, or the owner, already set.

---

## The members

Describe each person's idea **accurately and in paraphrase**. Never invent a quote, a study or a number and attribute it to one of them. The only quotations safe to use verbatim are the two marked ✓.

**1. Howard Moskowitz, psychophysicist** (Prego and Vlasic research; later Mind Genomics)
- **Idea:** there is no single perfect product, only the right product for each group of people. People cannot reliably say what they want, so you find the groups by testing variations and watching behavior.
- **Question he forces:** which group of searchers is this for, and what is the evidence that group exists and responds?
- **Evidence here:** sort GSC and Bing queries into mindsets. `topic-demand.ts`, the GSC query and page dimensions, and the Bing query report.
- **Guards against:** writing for "everyone"; asking the owner or a model what people want instead of looking.

**2. Peter Pirolli & Stuart Card, Xerox PARC** (Information Foraging Theory)
- **Idea:** people hunt information like animals forage. They follow **information scent**, the cues in a title, snippet or link text that predict whether the next click pays off, and they leave a "patch" when the scent fades.
- **Question they force:** do the words a searcher sees, in the title, the quick answer and the anchor text, promise exactly what the page delivers?
- **Evidence here:** compare `fetchQueriesForPage` against the title and the quick_answer.
- **Guards against:** clever titles with weak scent, and pages whose first screen does not confirm the promise.

**3. Herbert Simon, Nobel economist** (bounded rationality, satisficing)
- **Idea:** people do not optimise. They take the first option that is good enough. ✓ *"A wealth of information creates a poverty of attention."*
- **Question he forces:** in the two seconds a searcher gives the results page, why is this result good enough to click, and good enough to stop searching?
- **Evidence here:** CTR at a stable position, and whether the quick_answer settles the question.
- **Guards against:** burying the answer, and long preambles.

**4. Clayton Christensen, Harvard Business School** (Jobs to Be Done)
- **Idea:** people "hire" a product to make progress in a specific situation. Understand the job and the circumstances, not the demographic.
- **Question he forces:** what job is the searcher hiring this page for, such as passing an inspection, getting insured, finding a portal or deciding to walk away, and does the page finish that job?
- **Evidence here:** the brief's `who`, `want` and `achieve` fields in `articleBrief.ts`; query wording such as "how to", "will it", "portal", "should I".
- **Guards against:** pages about a topic that do not do the job.

**5. Daniel Kahneman, Nobel psychologist** (fast and slow thinking; heuristics and biases, with Amos Tversky)
- **Idea:** most judgments are fast and intuitive, built from what is in front of the person. People judge on what they can see and rarely ask what is missing.
- **Question he forces:** what will a person conclude in one glance at this title, image or snippet, and is that conclusion true?
- **Evidence here:** the first line, the image and the quick_answer read in isolation.
- **Guards against:** misleading-at-a-glance framing, for example a sun-hours image that omitted "on the shortest day".
- **Hard limit:** never use bias knowledge to manipulate. The owner rejected fear-driven, engagement-engineered content as "gross" (memory `beforeregret-instagram-tone`). Kahneman's lens is for making a glance *accurate*, not exploitable.

**6. Byron Sharp, Ehrenberg-Bass Institute** (How Brands Grow)
- **Idea:** brands grow by being easy to think of (mental availability) and easy to find (physical availability), across many light, occasional buyers. Consistent distinctive brand assets matter more than clever differentiation.
- **Question he forces:** does this make "Before Regret" easier to recall and recognise in buying situations, with the same name, same line and same look everywhere?
- **Evidence here:** brand queries in GSC and Bing, AI answers to "what is before regret", and consistency of the profile, About page and homepage text.
- **Guards against:** a new tagline every week, and chasing loyal superfans instead of reaching many occasional buyers.

**7. Jonah Berger, Wharton** (Contagious; the STEPPS framework)
- **Idea:** content spreads when it offers social currency, gets triggered by everyday cues, carries emotion, is publicly visible, has practical value, and sits inside a story.
- **Question he forces:** why would a real person pass this on, and to whom? Examples: an agent sending it to a client, a plumber citing it, a parent forwarding it.
- **Evidence here:** backlinks in `backlink-watch.ts` and the ledger, shares and comments on posts, AI citations.
- **Guards against:** content nobody has a reason to share, which earns no links on a domain that needs them.

**8. W. Edwards Deming, statistician** (statistical process control; common- vs special-cause variation)
- **Idea:** every process has natural variation. Reacting to normal noise as if it were a signal, which he called tampering, makes things worse.
- **Question he forces:** is this movement bigger than this site's normal week-to-week swing? How many impressions would it take to tell?
- **Evidence here:** weekly series rather than overlapping windows; the 2–3 day GSC lag; Google's ~5-week delay before showing new pages. One page at 8 clicks against 0 is often noise.
- **Guards against:** declaring a win or a failure on 17 days of data. Exactly that happened with the county restores on 2026-09-21; the result reversed by 2026-10-02.

**9. Richard Feynman, physicist** ("Cargo Cult Science", 1974)
- **Idea:** ✓ *"The first principle is that you must not fool yourself — and you are the easiest person to fool."* Report the evidence against your idea as carefully as the evidence for it.
- **Question he forces:** what would show this is wrong? Did we check what we are about to claim?
- **Evidence here:** a browser check of every portal, code section and figure; `assert-*` gates; reading the page Google actually renders after hydration.
- **Guards against:** confident claims from memory, averages mistaken for positions, and "verified" that was not.

---

## The procedure

1. **State the task and the one metric that decides it.** Use impressions, clicks or index state from GSC or Bing, or citations from the backlink ledger. Never a feeling.

2. **Pull first-party evidence before anyone speaks.** No paid or third-party SEO tools: OpenSEO and DataForSEO are retired. Use what applies:
   - `scripts/pull-gsc-queries.ts`
   - `scripts/pull-bing-queries.ts`
   - `scripts/topic-demand.ts "phrase"`
   - `fetchPagePerformance` / `fetchQueriesForPage` / `fetchUrlInspection`
   - a US results page (`gl=us`) checked by a person, or by the in-app browser with no bot-check bypassing, recorded with `record-observation.ts`

3. **Convene the council.** Each relevant member gives a verdict in two or three lines: their question, what the evidence says, and what they would do. **Skip members with nothing real to add, and say so.** Nine forced opinions is theatre.

4. **Name the disagreements.** Moskowitz wants a variant test while Deming says the sample is too small. Berger wants shareability while Feynman objects that a claim is unverified. The disagreement is usually where the insight is.

5. **Decide, as an experiment:**
   - one decision;
   - the single variable it changes;
   - the metric;
   - the read date (allow ~5 weeks for anything Google must newly show);
   - the stop condition, written before acting;
   - what you will do if it fails.

6. **Hand off** to the execution skill. Record the experiment in memory with its read date.

## Output format

```
## TASK & DECIDING METRIC
## EVIDENCE (first-party, dated)
## THE COUNCIL
  Moskowitz — …   (only the members who add something)
## WHERE THEY DISAGREE
## DECISION
  Change · Variable · Metric · Read on · Stop condition · If it fails
## HANDOFF → <skill>
```

Keep it short enough to read in two minutes. The council exists to make the decision better, not longer.

## Standing guardrails (owner rules the council cannot override)

- **Never invent a statistic, keyword or volume,** and never state a monthly search volume that is not in a capture dated before 2026-09-27.
- **No fear-bait, gotchas or engagement tricks.** Prefer curiosity, reassurance and real questions.
- **Contractors are an audience:** they buy ads and they cite the site. Judge pages written for them on citations, not only impressions.
- **Pace stays slow.** Publish a few pages a week at most, and never fill one headline formula many times over.
- **Never change slugs or URLs.** Restore removed pages rather than minting new ones.
- **Never quote the council members in published content.** They shape the thinking; the reader never needs their names.
- **If a member's idea is uncertain, paraphrase it more cautiously** rather than sharpening it into a claim.
