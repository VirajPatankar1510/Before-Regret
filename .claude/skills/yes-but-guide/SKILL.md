---
name: yes-but-guide
description: The enforced flow for the "Yes, but" guide strand on BeforeRegret -- "Can you [do X / get Y] with [an old-house system]?" articles whose honest answer is conditional. Use whenever the owner asks to start, continue, draft or publish the next one of these, names one of the queued questions (GFCI on an ungrounded outlet, roof over old shingles, PEX to galvanized, copper to galvanized, insurance with a wood stove, insulating over knob-and-tube), or asks what is next in this strand. Do NOT use for county permit guides, records-by-address guides or FAQs on an existing page.
---

# The "Yes, but" guide flow

Built 2026-10-08 at the owner's request: "create flow to do all of these articles, so that you don't
hallucinate and forget what to do." This file is the order of work. Three files hold the state, and a
script enforces the rules -- so a step that is skipped fails rather than quietly producing a worse page.

| file | what it holds |
|---|---|
| `data/content-queue/yes-but-guides.json` | the questions, their order, the UNVERIFIED verdict hypotheses, the sources each needs, status |
| `data/fact-ledgers/<slug>.json` | every fact the article states, with the source's own words, URL, date and method |
| `scripts/assert-yes-but-guide.ts <slug>` | the gate: no number or code section without a ledger fact; "Can You" title; conditional verdict; banned wording |

Also apply `write-guide` (the general pipeline) and `beforeregret_content_standard.md` §1-§7. This flow adds
to them; it never loosens them.

## Why this strand exists (so it is not misapplied)

Research 2026-10-08: the site's three best-clicked guides open "Yes, ... but" (Romex, fuse box, aluminum
wiring: 23 of 30 clicks among verdict-first guides). Guides opening with a flat "No, a standard inspection
does not..." rank about as well and get 0-1 clicks, because the results-page snippet answers them. So
the value is in the **condition**: the "but" must carry something a snippet cannot -- the code section,
the exact conditions, what to ask or do next. A page whose honest answer turns out to be a flat yes or
no does not belong in this strand: drop it or reframe it, never force a "but".

## Steps -- in order, one article at a time

**0. Pick the next item.** Read the queue. Take the lowest `order` with `status: "queued"`. Read its
`verdictHypothesis` as a hypothesis only. Pace: 2 a week at most, never two of these on one day.

**1. Check it is not already covered.** Search the published library (slugs, titles, bodies) for the
subject. If an existing guide answers it, the move is to extend that guide, not to mint a URL --
stop and tell the owner.

**2. First-party demand.** `npx tsx scripts/topic-demand.ts "<2-4 word phrasings>"`. Record the tier in
the brief. Tier 3 (nothing) is allowed for this strand -- the Romex page started that way -- but the brief
then needs a stop condition. Never state a search volume.

**3. Verify BEFORE drafting, into the ledger.** Copy `data/fact-ledgers/_TEMPLATE.json` to
`data/fact-ledgers/<slug>.json`. For each source in the queue item's `sourcesToVerify`:
- open the PRIMARY source (code publisher's free-access copy, the agency's own page, the statute) in the
  browser or WebFetch; a search snippet, a blog or memory is not a source;
- paste the exact words into `quote`, with URL, date and method;
- engine figures (costs, eras) come from `PRIORITY_RULES` at run time: method `engine`, quote the string;
- anything that cannot be opened goes in `cut` with the reason, and is not written;
- a bot check or "Access Denied" is recorded in `blockedSources` and never worked around.
Then write `verdictConfirmed`. **If verification contradicts the hypothesis, the confirmed verdict wins.**
Set the queue status to `verified`.

**4. Brief.** Fill an `ArticleBrief` (`src/seo/articleBrief.ts`): who, want, achieve, titlePromise,
capture, stopCondition (read date = publish + about 5 weeks). Two audiences usually search these: a
buyer or owner deciding what to do, and the electrician / plumber / roofer or DIYer doing it. Write for
both; contractors are an audience.

**5. Draft** `guides/<slug>.md` in this exact form (the gate parses it):

    ---
    meta: <70-155 chars>
    quick: <120-450 chars: verdict first, condition in the first two sentences>
    ---
    # Can You <...>?

    <body>

Draft rules, beyond write-guide's:
- the quick answer opens with the verdict (Yes / Generally / Usually / Only ...) and the condition
  arrives in its first two sentences;
- the body explains the condition with the ledger's specifics, then what to ask or do -- not a lecture;
- every number and code section must already be in the ledger (the gate checks);
- never name an insurer, never "most/many carriers will ...": write "your carrier may" and how to get a
  written answer;
- vary structure, headings and length from the previous guide in this strand; 500-1,600 words, never
  padded; no "Step N" headings;
- prose links only where the text already discusses the target (queue `linksExpected` are hints).

**6. Gate.** `npx tsx scripts/assert-yes-but-guide.ts <slug>` must print "gate passed". Fix the draft or
the ledger -- never the gate -- until it does. Set the queue status to `drafted`.

The gate can only check numbers and code sections. Then read the draft sentence by sentence against
the ledger: any factual claim with no number in it (what a pipe looks like, what an agency does, who may
file something) must be in the ledger too, or come out. Learned on the first guide, 2026-10-08: a
pipe-appearance sentence passed the gate with no ledger fact behind it and was removed by hand.

**7. Publish script, dry run.** Copy the pattern of `scripts/publish-flood-zone-by-address.ts` into
`scripts/publish-<slug>.ts`: parse the front block, `validateBrief`, cluster check (`guideTopic` must be
the queue item's `cluster`), dead-link check against published guides, trigram overlap <= 8% against the
closest live guides, and call nothing that writes unless `APPLY=true`. Header comment: what was verified,
where, and what was cut. Run it dry.

**8. Show the owner and wait.** Send the draft file and a short summary: verdict, what is verified, what
was cut and why. Nothing goes live until the owner says "publish".

**9. On "publish"** -- all of it, in order:
1. `APPLY=true npx tsx scripts/publish-<slug>.ts`
2. `npx tsx scripts/assert-article-quality.ts` (must pass)
3. FAQs with the `article-faqs` skill (facts only from the body; `faq-save.ts` enforces it)
4. `npx tsx scripts/suggest-inbound-links.ts <slug> --all-clusters` -> write only honest anchors with a
   dry-run-first script; finding none is a result, not a reason to invent a sentence
5. add the keyword to `src/seo/targetKeywords.ts` only if step 2 found a tier 1-2 capture
6. `npm run build` (retry once on a Neon DNS blip), commit, push (`git -c http.postBuffer=157286400 push`)
7. verify live: page 200, `faq-verify-live.ts <id>`
8. IndexNow for the new page and every page that gained a link to it
9. queue: `status: "published"`, `publishedAt`, `readOn`; memory: add the read date to
   `beforeregret_yes_but_strand.md`

**10. Measure.** On each read date, check Google and Bing for the page. The strand's stop condition is
in the queue file (`strandStopCondition`): after the first four are 5+ weeks old, under 1 Google click per
page per 28 days on average stops the strand.

## Never

- Never draft before the ledger exists, or state a fact the ledger does not carry.
- Never force a "but" the sources do not support.
- Never loosen the gate to make a draft pass.
- Never publish without the owner's "publish"; never commit without it.
