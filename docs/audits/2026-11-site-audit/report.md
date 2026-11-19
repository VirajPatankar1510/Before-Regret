# Site audit, November 2026

Run on 2026-11-19 against the live site at commit `eda9282` (origin/main), following `docs/plans/site-audit-2026-11.md`, phases 0–11. The audit was read-only: no commits, pushes, DB writes, `APPLY=true`, emails, form submissions or payments. Anything that builds a report ran on the local no-DB build (port 3002). Production pages were tested with beacons stubbed.

Evidence is in `./evidence/`, the step log is in `./progress.md`, and machine-readable findings are in `./findings.json`.

## 1. Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 2 |
| Medium | 8 |
| Low | 8 (2 of them plausible, not confirmed) |
| Info | 1 |

There was no Critical security finding, so the audit did not stop early.

### The 10 most important confirmed findings

1. **F12 (High). Reports tell buyers the panel brands were "recalled".** Every report for a home built 1950–1989 says "Certain recalled panel brands from this era". The panels the rule is about (Federal Pacific, Zinsco) were not recalled. The site's own guide #321 records that the CPSC closed its FPE investigation in 1983 without deciding on a safety risk. The same sentence appears in guide #50.
2. **F15 (High). A house can be labelled a condo because of its street name.** A visitor who declares a single-family home on, for example, "Tower Ave", a "Commons" street, or any street starting with "Ste" (Stevens, Sterling) gets "Condo / Multi-Family Complex" at the top of the report. This was reproduced locally on 1530 Tower Ave, Superior WI. It is the same kind of street-word rule as the "Lost Trail" bug fixed today.
3. **F8 (Medium). The "What X County Is Permitting Right Now" sections are two months out of date.** 20 county guides and the Permit Pulse study still show data through July 2026, and the study says it is "rebuilt monthly". Census has published August and September since 27 October.
4. **F9 (Medium). The two Hurricane Isaias guides still describe a storm that is about to hit.** They open with the 9 October forecast ("expected to reach … that evening"), 41 days later.
5. **F14 (Medium). The research tool's deadline promise isn't kept.** The tool says "we'll … put the date on your report". The report only shows the date when something needs confirming, and the checklist keeps saying "before your inspection deadline".
6. **F2 (Medium). Made-up URLs under /about/, /advertise/, /terms/ and /accessibility/ load the homepage with a 200 status** instead of a 404. This is a soft-404 pattern that wastes crawl budget.
7. **F16 (Medium). Anyone can make the site submit URLs to IndexNow.** `/api/seo/indexnow` has no login check.
8. **F6 (Medium). The cost ranges on reports and guides have no recorded source.** There are 28 cost lines in the engine, and none is traced to where the number came from.
9. **F18 (Medium). 15 known vulnerabilities in production dependencies** (11 high), all with fixes available. The one "critical" item can't be reached in this app's setup.
10. **F13 (Low). The property-type pop-up doesn't work like a proper dialog for keyboard and screen-reader users.** Escape doesn't close it, it has no dialog role, and focus isn't held inside it. The decoder's paste box has no label.

## 2. Findings

Effort: S = under an hour, M = a few hours, L = a project. These are estimates.

### High

**F12. "Certain recalled panel brands" on reports and guide #50.** CONFIRMED.
- **Evidence:**
  - `src/engine/inspectionPriorities.ts:252` contains the sentence.
  - The local report for a 1985 house showed it.
  - Guide #50 carries the same sentence.
  - Guide #321's CPSC paragraph (release 83-008) says the investigation was closed without a finding. The only recalls #321 names are a 1988 Challenger GFCI breaker and certain 1988 I-T-E load centers.
- **Fix:** change `insuranceRedFlag` to "Certain panel brands from this era with documented breaker problems — some insurance carriers decline to write policies on homes that still have them." Make the same one-sentence change in #50.
- **Risk:** #50 is a live ranking page, so it needs the owner's OK.
- **Effort:** S.

**F15. A street word overrides the declared property type in the report header.** CONFIRMED.
- **Evidence:**
  - `server.ts:2230-2260`: `isMultiFamilyOrApartment` matches `tower`, `enclave`, `commons`, `residences`, `lofts`, `#`, ` unit`, ` apt`, ` ste`, ` suite` in the address text.
  - Local API call with `declaredPropertyType: single_family` on 1530 Tower Ave returned "Condo / Multi-Family Complex". Three other addresses returned Single Family Home.
- **Fix:** delete the `addrLower.*` checks and drive the label from the declared type, mapped through `PROPERTY_TYPE_LABEL` the way the report view already does.
- **Risk:** none.
- **Effort:** S.

### Medium

**F8. Permit Pulse is stale.** CONFIRMED.
- **Evidence:** `evidence/permit-pulse-staleness.txt`.
  - The data file was generated on 2026-09-18 and covers January–July 2026.
  - These guides say "through July 2026": #78, 79, 82, 89, 90, 91, 92, 93, 94, 138, 208, 210, 214, 215, 216, 220, 222, 223, 362 and 371.
  - The study page says "Data through July 2026, rebuilt monthly".
  - `co2609y.txt` has been live since 2026-10-27.
- **Fix:** run the designed monthly refresh: `build-permit-pulse.ts`, then the inject script (dry run, then `APPLY=true`), rebuild and deploy.
- **Risk:** 20 ranking pages get only their dated paragraph replaced. Needs the owner's OK.
- **Effort:** M.

**F9. Hurricane guides #327/#328 still describe the storm as on its way.** CONFIRMED in the DB body and the live HTML.
- **Fix:** rewrite only the opening paragraph in past tense. Verify landfall facts at nhc.noaa.gov first.
- **Risk:** owner OK per page.
- **Effort:** S.

**F14. The deadline is missing from the research report.** CONFIRMED.
- **Evidence:**
  - `HouseResearchTool.tsx:203` makes the promise.
  - `researchState.ts:307-316`: the regexes don't match the engine's "before your inspection deadline".
  - `HouseResearchTool.tsx:600`: the date is shown only inside "To confirm before …".
  - Local run with deadline Nov 29: the report contains no date.
- **Fix:** add the "before your inspection deadline" → "before <date>" replacement, and show "Deadline <date>" in the report header whenever a deadline is set.
- **Effort:** S.

**F2. Soft 404 on four sections.** CONFIRMED.
- **Evidence:** `evidence/soft404.txt`; `server.ts:72-83` and `1525-1550`.
- **Fix:** keep a separate list of exact-only pages (about, terms, privacy, refunds, refund-policy, disclaimer, accessibility, support, advertise, payment-*) that never take a child segment. Check App.tsx for real children first, such as `/topic-ads/success` and `/report-ads/...`.
- **Effort:** S.

**F16. Unauthenticated IndexNow proxy.** CONFIRMED.
- **Evidence:** `server.ts:374-382`. Locally, the route is refused only when the URL list is missing. It was not called on production.
- **Fix:** require `hasValidSession`, or delete the route. Publishing already pings IndexNow (`articlesApi.ts:774`).
- **Effort:** S.

**F6. Untraced engine costs.** CONFIRMED.
- **Evidence:** 28 `$` lines in `inspectionPriorities.ts` with no source field. They are shown on reports, and on guides that quote the engine.
- **Fix:** add a source per cost plus a gate.
- **Effort:** L.

**F7. Fact-ledger coverage.** CONFIRMED.
- **Evidence:** 55 of 136 guides have a ledger. Top-traffic pages without one cite nothing; for example, #235 has 0 sources (`evidence/ledger-coverage.json`, `top-pages-claims.json`).
- **Fix:** backfill ledgers page by page, top traffic first. Verification work is safe; body edits need the owner's OK per page.
- **Effort:** L.

**F18. Dependency advisories.** CONFIRMED (`evidence/npm-audit.json`).
- **Evidence:** 1 critical (`proxy-addr`, not reachable because the app never sets `trust proxy`), 11 high (including body-parser, qs, nodemailer, zod, vite) and 3 moderate.
- **Fix:** run `npm audit fix` on a branch, then the build, the gates and a smoke test.
- **Effort:** M.

### Low

- **F3. Two research pages contain a second full HTML document inside `<head>`.** CONFIRMED.
  - **Evidence:** `/research/high-hazard-dams/` and `/research/outside-the-zone/` each have 2 doctypes, 2 `<html>` tags (one `lang="en"`), 3 `<head>` and 2 `<body>`. The cause is `scripts/prerender-research.tsx:825`, which copies the source file's opening tags into the outer head.
  - **Fix:** strip `<!DOCTYPE>`, `<html>`, `<head>`, `</head>` and `<body>` from `zHead` (and the dam equivalent).
  - **Effort:** S.
- **F13. Pop-up dialog accessibility and the decoder textarea label.** CONFIRMED.
  - **Fix:** add `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape to close, and focus handling. Add an `aria-label` to the textarea.
  - **Effort:** S.
- **F20. Contrast.** CONFIRMED.
  - **Evidence:** the gold eyebrow text, rgb(184,137,92) on cream, is 2.80:1 at 12px bold. The "QUICK ANSWER" label is 4.36:1. AA requires 4.5:1.
  - **Fix:** darken one design token.
  - **Effort:** S.
- **F11. Terms §3.6 still mentions a report refund.** CONFIRMED (`TermsConditions.tsx:136` against `:122` and `:131`).
  - **Fix:** remove the refund clause and bump the effective date.
  - **Risk:** legal text, so it needs the owner's approval.
- **F10. AI-cliché phrasing on 8 guides.** CONFIRMED (`evidence/aitells-context.txt`).
  - **Pages:** #7, #115, #135, #171, #216 ("Here is a comprehensive guide"), #221, #266 and #284.
  - **Fix:** edit one phrase per page.
  - **Risk:** ranking pages, so the owner OKs each page; never as a batch programme.
- **F17. Unauthenticated writes to the AI-crawler log.** CONFIRMED.
  - **Evidence:** `server.ts:123-129`; the local call returned 204.
  - **Fix:** require a shared-secret header set by the edge middleware.
- **F5. Overdue experiment reads.** PLAUSIBLE.
  - **Evidence:** 13 memory files show no recorded read result. Detection was a pattern search, so a result written in other words could be missed.
  - **Fix:** run the reads (list in section 5).
- **F19. The per-IP report cap reads the leftmost `X-Forwarded-For`.** PLAUSIBLE (`server.ts:160`).
  - **Why not confirmed:** a spoofing test would write to production.
  - **Fix:** use the platform's client-IP header.

### Info

- **F4.** #13 and #22 are "Discovered – currently not indexed", with 0 Google impressions in 90 days.
  - #22 was restored on 2026-11-14 and is under 5 weeks old, so it must not be judged yet.
  - #13's read is due on 2026-11-23.
  - No action now.

## 3. Not verified

| Item | Reason |
|---|---|
| msc.fema.gov link (#322), gao.gov link (#327) | Connection reset and DNS failure from this machine, in both the browser and curl. Likely a regional block; not worked around. |
| Exact "161,934 claims" on #304 | ALTA's release confirms "nearly 162,000", 2014–2023, >90% of premium and ~80% of claims. The PDF downloaded, but this machine has no PDF text tool. |
| PayPal handoff on the advertiser checkout | Stopped at "Buy now", because clicking it creates an order in production. |
| Cron route `/api/cron/send-pending-report-emails` live behaviour | Not called, because a GET could send mail if `CRON_SECRET` were missing. Verified from code only (`funnelApi.ts:78-96`). |
| Whether the 2 research-tool runs in `cta_clicks` are test traffic | An ad-hoc read-only query by day failed (Neon host unresolvable outside the report script). |
| Spoofing the per-IP cap (F19) | Would require writing to production. |
| "Made an offer" stage, end to end | Not re-walked in this run. It was walked in today's owner walk-through, and the code path (`forStage`) was read. |
| Cold-start TTFB | Not isolated. Every measured run was 0.14–0.26 s. |

## 4. Leads not confirmed

- **L2: homepage CLS of 0.958 and 0.915 at 1024 px.** The `<footer>` moves during hydration. The same page measured 0.000 at 375 px. The browser pane was hidden, which skews timings. Check Search Console → Core Web Vitals before acting.
- **One heading skip (h2 → h4) on `/research/permit-pulse/`.** Seen once; minor.

## 5. Due experiment reads (from MEMORY.md, all past due)

| Date | Read |
|---|---|
| 11-02 | indexing re-read |
| 11-06 | image preview |
| 11-07 | lead line |
| 11-08 | cutaway roof |
| 11-09 | county batch A |
| 11-11 | county batch B, flood guide, title test |
| 11-12 | footer leavers, yes-but pipe / wood stove |
| 11-13 | deck, mobile home, oldest housing, hurricane |
| 11-14 | roof cancellation |
| 11-18 | polybutylene |

Next due: #13 CLUE (11-23), county split test (11-25, don't touch the control group before then), #287 (11-26).

## 6. Proposed fix batches (nothing applied)

- **Batch A: code only, no ranking-page edits, one deploy.** F15, F12 (engine sentence only), F14, F2, F16, F17, F19, F3, F13, F20 and F11 (F11 needs a legal-text OK). Verify on the local build, run the gates, then push on "push".
- **Batch A2: dependency upgrade.** F18, on its own branch, with a full build, gates and smoke test before merge.
- **Batch B: data refresh, DB writes to live pages, owner OK needed.** F8 (Permit Pulse monthly refresh, 20 county guides plus the study) and F9 (#327/#328 openings, after verifying the landfall facts).
- **Batch C: content, one page at a time, owner OK each time.** F12's sentence in guide #50, F10 (8 phrases), F7 (ledger backfill) and F6 (cost sources).
- **Batch D: process.** F5 (run the due reads), F4 (wait for the dates).
