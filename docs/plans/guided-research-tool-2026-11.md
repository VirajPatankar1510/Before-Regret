# Guided research tool: build plan (2026-11-18)

Owner's flagship idea. Prototype: https://claude.ai/artifact/6ma9YB48uexEnNEnDdkvgA (private). Voice: `docs/brand/voice-guide.md`.

## Owner decisions

| Date | Decision |
|---|---|
| 2026-11-18 | The report is the **final outcome** of the guided flow. |
| 2026-11-18 | SaaS feel, plain enough for an average American, each step a small problem **solved, not homework**. Target emotion: "I didn't know how to investigate this house. Now I know what to check, where to find it and what to do with the answer." |
| 2026-11-18 | **No AI.** Fixed rules, verified data and the report engine only. |
| 2026-11-18 | Hero: **keep the existing H1** and the **address input**; "Don't buy a house blind." becomes the small brand line (done on the branch). |
| 2026-11-18 | **Keep the quick report.** Some people want a fast answer; others want guided research. Never force everyone through the longer flow. |
| 2026-11-18 | Book promo off the homepage (done on the branch). |
| 2026-11-18 | **Publish nothing until the entire tool is ready.** All work stays on the local branch `guided-research-tool`, including the simplified homepage. |

## How a visitor gets in

1. The hero address box, unchanged.
2. The same house-details step and checks as today: property type, unit number for condos, year built, and the address gate (Census match, federal and protected land refused, "Other" refused). Nothing about the checks changes.
3. At the end of that step, **two buttons**: "Get the quick report" (today's flow, untouched) and "Research it step by step" (the tool).

## Architecture

- **One route** for the tool (path to be decided; candidates `/research-this-house/`, `/tools/house-research/`). If opened without an address, it shows the same address box. No address or step ever goes in the URL; nothing indexable per address.
- **State on the visitor's device only** (localStorage, wrapped in try/catch). No account, no email.
- **Area data** comes from the same `/api/property/generate-report` call the quick report uses, so the server re-runs the same gate. The tool shows that data as "What we already know" and the finished report includes it.
- **Permit data**: a build step compiles `data/permit-records/**` into a small client index of verified fields only, with their status labels and check dates. Unknown or unresearched fields are never shown as facts (owner's rules in `permit-records-finder-2026-11.md`).
- **Era data**: `PRIORITY_RULES` from `src/engine/inspectionPriorities.ts`, read at run time.
- **Rules, not AI**: every "what this means" message and every question added to the report comes from fixed rules keyed to the visitor's answers.
- **Data labels** (voice guide rule 7): every statement is marked as address data, area context, era risk, what the seller says, or the visitor's own finding.

## Questions (missions)

| Question | Coverage | Stage | Before it ships |
|---|---|---|---|
| What should I ask about a house built in [year]? | Every address | 1 | Done 2026-11-18: the tool shows no cost figures (the engine's 42 cost fields aren't traced to sources yet). The full report below the visitor's research still carries them, as the quick report does today |
| Did anyone pull a permit for the [work]? | Full walkthrough for verified jurisdictions in the permit database; everywhere else the general route (guide #286) and the owner's "not researched yet" message | 2 | Verified fields only; status label + date on each |
| Will this house be hard to insure? | Every address: FEMA flood map, CLUE (seller requests it) | 3 | Browser-verify FEMA Map Service Center steps; facts from the #13 ledger |
| Is the pipe from the street lead? | Every address: the utility's service line inventory | 3 | Facts from the lead-service-line guide's ledger; browser-check the steps |
| Found something weird in the inspection report? | Everyone: the Inspection Report Decoder | 3 | Confirm the Decoder's public status |
| Any unfinished paperwork? Liens and taxes? | Later | 4 | Research first |

## Stages

1. **Entry and plan**: the two-button choice in the address step, the tool route, the three quick questions (stage, deadline, seller's claimed updates), the plan screen with area data, and the era question.
2. **Permits and the final report**: the permit question with the database, the report (Check / Ask / Verify), print/save.
   **Built 2026-11-18 (branch):** permit question for every US address (see `permit-coverage-usa-2026-11.md`); final report = the
   standard free report from `/api/property/generate-report` (same gate, same engine) with the visitor's findings first as
   "Your research" (`FinalReport.tsx`, `PropertyReportView` `researchSection` prop). Findings stay on the device and are read live,
   so the report is built once per house and never rebuilt (each build counts toward the daily limit). The assent notice sits
   under "Build my full report". Tested on a local server with DATABASE_URL empty so no test report reached production.
3. **Insurance, lead pipe, Decoder**, each browser-verified.
   **Built 2026-11-18 (branch, bba017b):** one data-driven screen (`MissionView.tsx`) runs all three from `missions.ts`:
   where to look → what you found → solved. Each answer has a fixed meaning that adds seller questions and verify items to
   "Your research" (deduplicated). Facts: `data/fact-ledgers/research-tool-missions.json` (eCFR 141.84 + 141.2, EPA Protect
   Your Tap, fema.gov homeowners/SFHA/flood-insurance pages, the #13 CLUE ledger, our Decoder). Gate:
   `scripts/assert-research-missions.ts` (every number must sit in a cited quote). **msc.fema.gov refused our connection**
   (region block, not worked around): the flood-map steps follow FEMA's own instructions, and the address search itself is
   untested by us; the owner should try it once from the US view. The Decoder link is internal and noindex (live).
   Tested on mobile with a public building (Austin City Hall): all three solve, the report shows the three sections, and
   "Nothing that worries me" clears the other inspection picks (and the reverse).
4. **Launch prep**: funnel tracking (started, details done, first question solved, report finished), phone and desktop checks, accessibility pass, copy pass against the voice guide, owner review of the whole flow.
   **Done 2026-11-18 (branch):** funnel events `research_details_done`, `research_first_solved`, `research_report_done`, sent once
   per house (stored in the visitor's saved progress, so reloads never double-count); read with `scripts/cta-click-report.ts`
   (new "research tool funnel" block, from `choose_research` on). Browser-tested with beacons captured in the page, so no test
   rows reached the table; `research_report_done` was not fired live (building a report from dev could write to production).
   Phone (375px) and desktop (1280px): no sideways scroll on any screen. Accessibility: one h1 per screen, every control named,
   choice groups now labelled by their question (`role="group"` + `aria-labelledby`), sitewide focus ring shows on Tab.
   Copy: no AI tells, US spelling, no fear words.
   **Full run 2026-11-18** on the production build with `DATABASE_URL` empty (parent launch.json `beforeregret-nodb`, port
   3002): all five questions answered → "Build my full report" → report built, "Your research" shows Check / Ask / Verify
   for every question, `research_report_done` sent once, no sideways scroll at 375px. Fix from it: the report's checklist
   now falls back to the era screen's default picks. **Left: the owner's own walk-through, then "publish".**

## Published

**Live 2026-11-18** (owner: "publish it"), commit c5ff773: the tool, the two hero buttons and the simplified homepage.
Checked live: /api/health ok, hero lines and both buttons in the homepage HTML, /tools/house-research/ 200 and noindex,
no console errors, address lookup 200 in under 1s (one 25s timeout on the first request after the switch-over, not seen
again in 7 tries). Baseline: zero research-funnel rows before launch. **READ 2026-12-16** with
`npx tsx scripts/cta-click-report.ts 28`: where do visitors stop between choose_research and research_report_done?

## Fresh-eyes walk-through (2026-11-18)

Live site, phone size, Austin City Hall, 1960, under contract. Fixed the same day (owner's picks 1-2 and 5-6):
- **Austin had no permit record**, so the permit question sent our biggest city to a web search. Added
  `data/permit-records/tx/48453-travis.json` (City of Austin only) from a browser walk of Austin Build + Connect
  (ledger `check-building-permits-travis-county-tx`): public search with no login, records back to 1980 at City Hall,
  and the search covers only the past 365 days unless the Start Date is changed (now step 1's first tip).
- **"How do we know?" sat right above "We haven't researched this jurisdiction yet"**, which read as its answer. The
  owner's not-researched note now sits below the search steps, with the guide link.
- **No ending at 5 of 5.** The plan now opens with "Your report is ready" and "Get my report" when every question is
  answered; before that, "Get my report now" sits at the bottom ("your report fills in as you answer").
- **Two reports.** "See your report so far" then "Build my full report" read as two different things. "Get my
  report" now builds the one report directly (findings first, as before). The answers-only page is reached only if
  the build fails ("See and print your answers").

Second round (same day, "do next"):
- **Insurance, water line and inspection report are step by step**, like the permit question: each screen pairs one
  action with the answer that goes with it (`screens` in `missions.ts`), with a progress bar and large answer buttons
  (shared `Choice` and `Progress` in `ui.tsx`). Insurance is 3 screens (flood zone + answer, claims + answer, quote);
  the "Know what the zone changes" step was cut because the zone answers' "What this means" says the same thing.
  Water is 3 screens, the decoder 1.
- **Seller-claimed work with nothing online** no longer says "older records are often not online". It says early
  work may only have a paper permit, and asks when the work was done and by whom.
- The report no longer says "Checked by you with the inspection report" when the inspection hasn't happened.

Third round (same day):
- **Plain words.** "Is it finaled?" became "Was it signed off?" (portal terms listed underneath). Eight checklist titles
  have plainer wording in the tool only (`PLAIN_TITLE` in `researchState.ts`, e.g. "Have a plumber run a camera through
  the sewer line", "If the house sits on piers, have the inspector go into the crawlspace"). The engine, quick report
  and guides keep their wording; the "What to do" lines still name the service to book (sewer scope, WDI report).
  "Galvanized Requiring Replacement" keeps the utility's label, with "(counted like lead)".
- **Report:** "At a glance" (five "Answered" tags) and the CHECK/ASK/VERIFY labels removed. Now: "Not answered yet"
  (only if any), "What you found", the checklist, "Questions, ready to send", "To confirm before [date]".

Still open: homepage two-button clarity. The labels and the hero line are the owner's words (2026-11-18), so this is
a proposal for the owner, not a change.

## Publish gate

Only when the owner has tried stages 1 to 3 end to end and says "publish". Then: build, push the branch's commits, verify live, record the baseline and set the read date (28 days, tracked separately from search traffic).
