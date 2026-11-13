---
name: state-license-guides
description: The enforced flow for the 50-state contractor license lookup set on BeforeRegret ("How to check a contractor's license in [State]") and its hub table. Use whenever the owner asks to start, continue, research, draft, check or publish a state contractor-license page, the hub, the next batch, or asks where the set stands. Do NOT use for county permit guides, other article types or FAQs on an existing page (article-faqs). California is already live as #350 (cslb-license-check-california-contractor) and is never renamed.
---

# State contractor-license pages: the flow

Owner, 2026-11-13: "I want to add all 50 pages but only useful, real and authentic content. All pages should be more
than 60% different from each other. If there is no/thin content add more related content that would help us rank
further with relatable keywords. First create a guide and flow ... so that you don't lose track, hallucinate or
duplicate content."

**The full plan is `docs/plans/state-contractor-license-plan.md`. Read it first; if this file and the plan disagree, the plan wins.** It holds the phases (survey first), the five state types, the uniqueness design, the voice rules and banned words.

This is a programmatic set, built by hand. The data keeps facts honest; the hand work keeps pages from being thin.
Our August 2026 county pages were the bad version of this (templated, thin, pruned). Every rule below exists so this
set is the good version. Read `docs/research/pseo-good-vs-bad-2026-10.md` §6 once before the first batch.

All commands run from `/Users/viraj/Desktop/Claud Code/Before-Regret`.

## The files that hold the state (never work from memory)

| File | What it holds |
|---|---|
| `docs/plans/state-contractor-license-pages.md` | The tracker: one row per state, its status, batch, slug, demand, blockers and read date. Update it after every step. |
| `data/fact-ledgers/state-license/<state-slug>.json` | One ledger per state, copied from `_TEMPLATE.json` in that folder. Every fact on a page is a quote here first. |
| `scripts/check-state-license-set.ts` | The cross-page checker: pairwise overlap, shared sentences, shared headings, ledger numbers and quotes. Must pass before any publish. |
| `guides/<slug>.md` | The draft of each page. |

## Rules that never bend

1. **Facts come only from primary sources:** the state licensing board's own pages, the state statute or code, the
   official lookup portal walked in the browser. Never a lead-gen site, a blog, a directory or a model's memory.
   Quote each fact in the state ledger before drafting.
2. **No invented anything:** no numbers, no case stories, no "most contractors", no search volumes, no URLs typed from
   memory. Every URL on the page was opened on the read date.
3. **Blocked sites are skipped, never worked around.** If a state's board or portal won't load (as trec.texas.gov
   didn't on 2026-11-13), record it under `blockedSources`, mark the tracker row BLOCKED, and either wait or ask the
   owner to send the document. Never fill the gap from a secondary source.
4. **Over 60% different from every other page, measured.** `check-state-license-set.ts` computes, for every pair of
   pages, the share of one page's word-trigrams that also appear in the other.
   - Hard fail at 40% or more, which is the owner's 60% rule.
   - Warn at 15% or more; the target is close to entirely unique.
   - Also fails on any sentence of 8+ words that appears on another state page, and on any H2 heading text used on
     more than 10 of the pages.
5. **No page stays thin (owner, 2026-11-13).**
   - **Thin means:** fewer than 10 verified, state-specific facts on the license topic alone.
   - **Extending:** a thin state is extended with related, useful sections from the bank below until it has at least 10.
     Every page gets a page; none is left as a table row only.
   - **What an extension must be:** verified, state-specific and sourced like everything else, never general advice that
     would read the same in another state. General advice would also fail the 60% rule.
   - **Choosing sections:** go by that state's own related searches (first-party).
6. **Not one outline.** Each page leads with what is most distinctive about that state (for example: no state license
   for general contractors; a homeowner recovery fund; a separate home-improvement registration; a city that licenses
   instead of the state). Section order and headings follow the facts, not a fixed template.
7. **Publishing: each page as soon as it's ready (owner decision, 2026-11-13, replacing "all at once").** A page goes
   live once:
   - it passes the checker;
   - the owner has seen it;
   - the owner says "publish".

   Each page gets its own read date, 5 weeks after it goes live. The hub publishes once the Phase 1 survey is verified,
   and grows as state pages go live.
8. **Existing pages:** never edit a published page without the owner's OK (feedback-dont-touch-ranking-pages). #350
   California keeps its slug and content. The hub links to it.
9. **No insurer names beside coverage claims.** Bond and insurance companies shown on a portal record are never
   named. No business or person from a record is named. Screenshots are cropped to remove them.

## What every state page must contain (the floor, not the outline)

- The official lookup, linked in the first paragraph, with its exact name as the state uses it.
- Who is licensed at state level in this state: general or residential contractors, specific trades, a
  home-improvement registration, or none (then: which cities or counties license instead, for the largest 2-3).
- How the lookup actually behaves, from our own browser walk on the read date:
  - search options and quirks;
  - what a record shows (status, classification or trade, bond, insurance, complaints or discipline);
  - what it doesn't show.
- One cropped screenshot of a record or search result with no names, or a written reason why none was taken.
- At least one state law cited by number (statute, code or administrative rule section), so the page passes the
  reproducibility gate.
- A short "How we checked this" section: what we read and walked, the date, what we couldn't confirm.
- Links: the hub table, plus California (#350) only where the text compares to it. No other inbound or outbound links
  are added without a reason in the text.

## The related-topic bank (to extend thin states, and to match related searches)

Use only topics the state's own sources cover. Pick them by that state's related Bing queries from `topic-demand.ts`
(first-party). Never pick a topic because it fills space.

- The dollar threshold under which no license is needed (the "handyman" or minor-work exemption), with its conditions.
- What happens if you hire an unlicensed contractor: can they sue for payment, can you recover what you paid.
- A homeowner recovery or guaranty fund: who can claim, the cap, and how.
- Home-improvement contract rules: required terms, down-payment limits, cancellation rights.
- Required bond or insurance amounts, and who the bond protects.
- Separate trade licensing (electrical, plumbing, HVAC) and its own lookup, if different.
- Local licensing in the state's largest cities, when the state doesn't license.
- How to file a complaint with the board.
- Permits: whether the state lets homeowners pull their own (owner-builder rules), when the board's site states it.
- The statewide building code the state has adopted (which edition, and whether cities can amend it), from the state's
  own code agency.
- Mechanic's lien notices a homeowner may receive from subcontractors or suppliers, and what the state requires.
- Home inspector licensing in the state (whether inspectors are licensed, and the lookup), when the related searches
  show buyers also check inspectors.
- The state consumer-protection office's complaint route for contractor disputes, if separate from the board.

Each bank topic still needs primary-source quotes in the ledger. If a topic isn't covered by the state's own sources,
skip it rather than writing it from general knowledge.

## The flow, per state

**0. Demand and related searches.**
- Run `NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts" npx tsx scripts/topic-demand.ts "<state> contractor license" "<state abbrev> contractor license lookup" "<state> handyman license"`.
- Record the capture name and the strongest tier in the tracker.
- Note the state's related queries; they decide which bank topics to research.

**1. Find the authorities.** From the state's own government site, list every body that licenses residential
construction trades, and its lookup URL. Open each URL. Record anything blocked.

**2. Walk the portal.** In the in-app browser:
- search by license number and by business name, using a large business entity, never an individual;
- note every quirk;
- open one record and list every section it shows;
- take one screenshot, cropped to sections with no names, and save it as
  `public/images/<state-slug>-license-record.webp`.

**3. Read the law.** Find the licensing statute and the bank topics the related queries call for. Quote each
fact into the ledger, with URL and read date.

**4. Count.**
- **10 or more** verified state-specific facts: write the page.
- **Fewer than 10:** research more bank topics, chosen by the state's related searches, until it reaches 10. Mark the
  tracker EXTENDED and list the topics added.
- **No page is dropped.** If a state still struggles after the bank, tell the owner which topics were tried and what
  the sources didn't cover.

**5. Draft from the ledger only.** Open with that state's most distinctive fact. Plain voice, calm, no fear framing.
Every number and quote on the page must be in the ledger.

**6. Check.** Run `npx tsx scripts/check-state-license-set.ts` (all drafts plus published pages) and fix every failure.
Then run the per-page publish script dry run and `assert-article-quality.ts --draft`.

**7. Owner review.** As soon as a page passes the checker, send the owner:
- a one-line summary of each page;
- the overlap matrix summary;
- whether it was EXTENDED;
- anything cut or blocked.

Publish only on the owner's "publish".

**8. Publish the page.**
1. run the publish script with `APPLY=true`;
2. add FAQs (article-faqs: grounded in the page, state-specific questions only);
3. build, then confirm the build actually succeeded;
4. commit and push;
5. verify live (`faq-verify-live.ts`, title, canonical, health);
6. notify IndexNow.

Then update the tracker and the hub table.

**9. Measure.** Five weeks after each page goes live:
- is it indexed and shown (Google and Bing)?
- AI crawler fetches (`ai_crawler_visits`).

Report the numbers to the owner, with a running total across the set. If the early pages aren't being indexed, say so
before many more go live. Propose consolidating the weakest into the hub, and never do it without the owner's OK.

**10. Keep it true.** Re-verify every published state by its re-check date (6 months after publishing). Boards change
URLs and thresholds.

## The hub

- **What it is:** one page, "How to Check a Contractor's License in Every State": a table with one row per state.
- **What each row holds:** licensing body, lookup link, what's licensed, the verified date, and a link to the state page
  where one exists.
- **Anchors:** one per state, such as `#texas`.
- **Timing:** it publishes once the Phase 1 survey rows are verified, and gains a link in each row as that state's
  page goes live.
- **Topic bucket:** it matches `contractor-licensing`.

## Slugs

- **State pages:** `<state-slug>-contractor-license-lookup`, for example `texas-contractor-license-lookup`.
- **California:** keeps `cslb-license-check-california-contractor`.
- **Hub:** `contractor-license-lookup-by-state`.
- **Topic bucket:** every slug must match `contractor-licensing` in `src/utils/relatedGuides.ts`. The check script
  asserts it.
