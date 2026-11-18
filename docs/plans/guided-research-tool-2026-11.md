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
| What should I ask about a house built in [year]? | Every address | 1 | Engine cost-range sources audit (known gap) |
| Did anyone pull a permit for the [work]? | Full walkthrough for verified jurisdictions in the permit database; everywhere else the general route (guide #286) and the owner's "not researched yet" message | 2 | Verified fields only; status label + date on each |
| Will this house be hard to insure? | Every address: FEMA flood map, CLUE (seller requests it) | 3 | Browser-verify FEMA Map Service Center steps; facts from the #13 ledger |
| Is the pipe from the street lead? | Every address: the utility's service line inventory | 3 | Facts from the lead-service-line guide's ledger; browser-check the steps |
| Found something weird in the inspection report? | Everyone: the Inspection Report Decoder | 3 | Confirm the Decoder's public status |
| Any unfinished paperwork? Liens and taxes? | Later | 4 | Research first |

## Stages

1. **Entry and plan**: the two-button choice in the address step, the tool route, the three quick questions (stage, deadline, seller's claimed updates), the plan screen with area data, and the era question.
2. **Permits and the final report**: the permit question with the database, the report (Check / Ask / Verify), print/save.
3. **Insurance, lead pipe, Decoder**, each browser-verified.
4. **Launch prep**: funnel tracking (started, details done, first question solved, report finished), phone and desktop checks, accessibility pass, copy pass against the voice guide, owner review of the whole flow.

## Publish gate

Only when the owner has tried stages 1 to 3 end to end and says "publish". Then: build, push the branch's commits, verify live, record the baseline and set the read date (28 days, tracked separately from search traffic).
