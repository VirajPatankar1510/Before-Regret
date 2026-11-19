# Site audit progress (started 2026-11-19T04:31Z)

Plan: docs/plans/site-audit-2026-11.md. Evidence: ./evidence/. Findings drafted in ./findings-draft.md, verified in phase 10.

## Phase 0 — Baseline: DONE
- origin/main = live deploy = eda92829095f8ef4d99cca3de11c63fc299c846f (local `main` ref is stale at c084eed; checkout is branch guided-research-tool at eda9282).
- /api/health ok (evidence/health.json). robots.txt saved. llms.txt 200 (saved).
- Live sitemaps: 153 URLs (evidence/sitemap-urls.txt) = 136 guides + /guides/ + 16 other pages. (Plan's "155" counted the 2 child-sitemap entries of the index; 153 is the URL count.) Local public/sitemaps (uncommitted edits) list the same 153 URLs.
- DB (read-only SELECT, evidence/articles.json): 218 rows, 136 published (135 guide, 1 comparison). Published set == sitemap guide set exactly (0 missing either way).
- Next: Phase 1 gates.

## Phase 1 — Gates: DONE (evidence/gates/)
- PASS: assert-article-quality (136 published, 41 grandfathered, "66 still thin" = warnings), assert-keyword-provenance, assert-walkthrough-checks, assert-research-missions, validate-permit-records, check-state-license-set, tsc --noEmit, full build (exit 0).
- assert-yes-but-guide: needs a slug; run on the 4 queue items marked published -> all exit 0. Limit: it checks guides/<slug>.md drafts, not the live DB body.
- content-audit (full corpus, first run failed on Neon DNS ENOTFOUND; re-run with neon-curl fallback OK): 1 truncated (#312 home-insurance-aerial-photos-roof), 6 external links timed out/failed (fema.gov x4, msc.fema.gov, gao.gov, plasticpipe.org) -> LEADS, need browser check in phase 10.
- Next: Phase 2 live crawl.

## Phase 2 — Live crawl: DONE (evidence/crawl.json, recrawl.json, crawl-issues.json, soft404.txt, internal-links.json)
- 164 URLs crawled GET-only (~1 req/s). 2 guides returned status 0 (transient) -> recrawled 200 with structured data intact (recrawl.json).
- Titles/H1/meta match DB. 5 titles >60 chars are all in OWNER_LONG_TITLES (scripts/assert-canonical-urls.ts:134) -> not a finding.
- FAQ JSON-LD count = faq_json + 1 on 109 guides: by design (prerender-guides.tsx adds title + quick answer as Q1) -> not a finding.
- 0 broken internal links, 0 orphan guides; removed guides answer 410/301.
- lang="en" (not en-US) on /research/high-hazard-dams/ and /research/outside-the-zone/ -> F3.
- Soft 404: /about/x/, /advertise/x/, /terms/x/, /accessibility/x/ (and /advertise/topic-ads/, which is not linked anywhere) answer 200 with the homepage shell and canonical "/". Second route: server.ts:72-83 KNOWN_STATIC_ROUTE_PREFIXES + server.ts:1525-1550 allow one segment under ANY prefix, while App.tsx has no child routes for /about, /terms, /accessibility, /advertise -> F2. Side note: real 404 responses also carry canonical "/" + "index, follow" from the shell (harmless with a 404 status, noted in F2).
- h1 count 0 on /tools/house-research/ and /tools/inspection-decoder/ in raw HTML: client-rendered, both noindex -> not a finding (checked again in phase 5 after render).

## Phase 3 — Search data: DONE (evidence/search-performance.json, page-visibility.json, url-inspection.txt)
- Read-only GSC page performance + Bing pages. #13 get-clue-report-before-buying-house and #22 i-buy-house-knob-tube-wiring: "Discovered - currently not indexed", 0 Google impressions in 90 days -> F4 (Info; #22 was restored 2026-11-14 so it is <5 weeks old and must not be judged; #13 rewrite read is due 2026-11-23).
- Experiment reads now due or past due per MEMORY.md (whether each was already done is not recorded in memory): indexing re-read 11-02, image-preview 11-06, lead-line 11-07, cutaway roof 11-08, county batch A 11-09, county batch B 11-11, flood guide 11-11, title test 11-11, footer leavers 11-12, yes-but pipe/wood-stove 11-12, deck 11-13, mobile-home 11-13, oldest-housing 11-13, hurricane 11-13, roof-cancellation 11-14, polybutylene 11-18 -> F5 (process, Low).

## Phase 4 — Content truth: IN PROGRESS
- Ledger coverage: 55 of 136 published guides have a fact ledger, 81 do not (ledger-coverage.json). Number trace on ledgered pages: 12 numbers on 6 pages not in a ledger (number-trace.json).
- Second-route source checks done: 4 Census ACS 2019-2023 B25034 counts exact (sources/census-b25034.txt); CA HSC 19850/19851 match (sources/ca-hsc-19850-19851.txt); 24 CFR 3282.8 and 3280.5 match (sources/ecfr-manufactured-home.txt).
- Engine cost figures: 28 $ lines in src/engine/inspectionPriorities.ts with no source field; same figures appear on guides (top-pages-claims.json) and reports -> F6.
- Top-traffic unledgered pages carry no citation (e.g. #235 open-ground, sources 0) -> F7 (Info/Medium).
- Remaining: browser check of 6 external-link timeouts + #312 ending; CFR 201.21/3280.11/3285.6/3285.801/3285.804; #304 "161934 claims"; freshness; aiTells context; /refunds/ + /support/ staleness.
- (phase 4 cont.) #312 truncation: DROPPED. Stored body and live page both end on a "## Sources" bullet list whose last item has no full stop; the gate's heuristic misread it.
- External links (browser = route 1, curl = route 2): fema.gov risk-rating / glossary/assignment / change-your-flood-zone all load with the right H1 -> OK (script timeouts were bot-side). plasticpipe.org PDF: browser gets the file (download prompt, not saved), curl gets 302 to a login page -> OK for people. msc.fema.gov (browser chrome-error, curl connection reset) and gao.gov (DNS fails from this machine) -> NOT VERIFIED, likely blocked from this location; not worked around.
- CFR: all 7 cites on #316 match eCFR (sources/ecfr-manufactured-home.txt).
- #304 "161,934 claims": ALTA's 2025-11-18 release says "nearly 162,000", 2014-2023, >90% premium, ~80% of claims -> PLAUSIBLE; exact count not verified (PDF fetched but no text extractor here). sources/alta-claims-2025.txt.
- Permit-record fields: 253 verified fields, oldest 76 days, 0 past the 180-day REVERIFY rule (permit-record-freshness.txt).
- Permit Pulse: generated 2026-09-18 with data through July 2026; Census has since published Aug + Sep county files (co2609y.txt last-modified 2026-10-27). 20 county guides still say "Right Now ... through July 2026" -> F8 (permit-pulse-staleness.txt).
- Hurricane guides #327/#328 still open with the 9 Oct pre-landfall forecast ("was expected to reach ... that evening"), 41 days on; memory says update after landfall -> F9 (DB + live HTML).
- AI-tell phrases: 8 pages use real banned phrasing (#7, #115, #135, #171, #216 "Here is a comprehensive guide", #221, #266, #284); the other "not only" hits read naturally -> F10 (aitells-context.txt). internalSeoNote hit on #195 ("which is why this page sends you to your inspector") is natural prose -> dropped.
- Seasonal guides #363-367: Thanksgiving/Christmas wording still current on 2026-11-19 -> OK; recheck after 2026-12-26.
- /refunds/, /terms/, /privacy/ (effective 2026-11-15): reports free, Find a Pro gone, ad prices match src/server/adPricing.ts -> OK. One leftover: Terms 3.6 still offers "a refund determined under our Cancellation & Refund Policy" for a report mismatch though 3.1/3.4 say reports are free -> F11 (Low).
- 95 published guides have no "How we checked this" section (content-rules.json noTowWeChecked) -> folded into F7 (older pages predate the rule; not a finding by itself).
## Phase 4: DONE. Next: Phase 5 product flows.

## Phase 5 — Product flows: DONE (local nodb build port 3002 for anything that builds a report; production pages with beacons stubbed)
- Homepage -> address -> "Generate quick report" -> pop-up -> report (375x812): works, 0 console errors, 0 failed requests. Owner's address 2620 Lost Trail Rd, Edmond OK (single-family, 1985) now passes the gate (eda9282 fix holds).
- Report text: every cost range in "Inspection priorities" is shown without a source (F6 visible). Insurance red flag reads "Certain recalled panel brands from this era" (src/engine/inspectionPriorities.ts:252); the site's own guide #321 records that CPSC closed its FPE Stab-Lok investigation in 1983 without deciding on a safety risk, i.e. no recall -> F12. Same sentence is in guide #50's body. "many carriers now decline or surcharge" line is already pending owner OK per memory (knob-and-tube cluster note) -> not re-raised.
- Research tool, stage "Just looking", unresearched county (Oklahoma County, City of Edmond): setup -> era list -> permits (guide link + Google search button) -> flood -> claims -> quote -> lead line x3 -> summary -> report. Reload mid-flow at step 6 restored state. Network during the 10 steps: nothing sent; "Get my report" sends address/type/year only; beacon body is {cta, page: pathname} (src/utils/ctaClickBeacon.ts:28-29) -> "Your answers stay on this device" holds.
- Research tool, stage "Under contract", researched county (Tampa, public building 601 E Kennedy Blvd; gate showed "might be a business" warning, allowed): deadline set 2026-11-29 -> "Deadline Nov 29 · 10 days left" in summary; Tampa portal steps + "When we tried it" observation shown; Skip path works (1 of 5 answered). Report: the date never appears — checklist and area report still say "before your inspection deadline"; forDeadline (researchState.ts:307-316) only rewrites "before your inspection or option period ends"/"before your deadline", and "To confirm before <date>" (HouseResearchTool.tsx:600) shows only when something needs confirming. Setup copy promises "put the date on your report" (HouseResearchTool.tsx:203) -> F14.
- "Made an offer" stage: not re-walked this run (walked in the 2026-11-19 owner walk-through; forStage covers it). "Start over" uses window.confirm (by design).
- Property-type pop-up: no role="dialog"/aria-modal, Escape does not close it, focus not trapped (AddressSearchBox.tsx has none of these) -> F13. Decoder paste textarea has no label (placeholder only) -> folded into F13.
- Decoder: search + paste; "Find terms" found 4; no request carried the text (only a decoder beacon with pathname) -> promise holds.
- Live guide #25: FAQ accordion renders, related guides render, sitewide book card present (owner's choice). /sunlight/, /walkthrough/, /research/permit-pulse/: 200, no console errors. Permit Pulse study page says "Data through July 2026, rebuilt monthly" -> part of F8.
- /pros/ 301 and /pros 308 -> homepage (as decided). /advertise/ shows $29 / $7.99 (matches adPricing.ts). /topic-ads/: picked one article -> sticky "Buy now"; STOPPED there because Buy now creates an order in production (write). PayPal handoff -> NOT VERIFIED (by rule).
- Desktop 1024: research tool start screen renders, no horizontal scroll (scrollWidth 1009 <= 1024), no console errors.

## Phase 6 — Address gate and report correctness: DONE
- Sweep of server.ts resolvePropertyMetadata (2137-2265): the non-residential street-word checks are gone (eda9282). isNonResidential now = 12 hard-coded downtown Austin addresses, 311 Nueces, or a property TYPE saying park/water/trail/recreation/vacant/commercial/office/industrial/retail -> no street-word refusals left.
- Still street-word based: isMultiFamilyOrApartment (server.ts:2230-2250) matches "tower", "enclave", "commons", "residences", "lofts", "#", " unit", " apt", " ste" (so also "Stevens", "Sterling", "Stewart"...), " suite" in the address text, and sets propertyInfo.propertyType -> the report header label (PropertyReportView.tsx:140) even when the visitor declared single-family.
- Local API test (port 3002, declared single_family, year 1960), public buildings: 1530 Tower Ave Superior WI (public library) -> "Condo / Multi-Family Complex" (WRONG LABEL); 1302 Heights Blvd Houston (library) -> Single Family Home; 601 E Kennedy Blvd Tampa (county center) -> Single Family Home; owner's 2620 Lost Trail Rd Edmond -> Single Family Home. -> F15 (2 routes: API output + code).
- Note: the gate does not refuse public buildings declared single-family (library, county center). By design: declared type is the visitor's attestation (Terms 3.5); the pop-up shows "might be a business" on 601 E Kennedy. Not a finding.
- localizeContractDeadline (inspectionPriorities.ts:151) is applied to all engine priorities and seller questions; the research tool's own copy is handled by forDeadline (non-TX -> "inspection period"). No "option period" leak outside Texas found -> OK.
- PRIORITY_RULES costs/lifespans: none carries a source field -> F6 (already logged).
## Next: Phase 7 security (read-only).

## Phase 7 — Security and operations (read-only): DONE — no Critical security finding, no early stop
- Production, unauthenticated GET to 13 /api/admin/* read routes: all 401; /api/admin/session 200 {"signedIn":false} (by design).
- Local nodb server (same code), unauthenticated POST/PUT/DELETE with body {} to every admin write route: all 401. /api/my-ads/*: 401 "Sign in required". Capture routes: 400/503 on missing fields.
- /api/seo/indexnow (server.ts:374-382): NO auth; any caller can make the server submit a URL list to IndexNow with the site's key (local: only refused when the list is missing). Not called on production (hard limit) -> F16.
- /api/internal/log-ai-crawler (server.ts:123-129): NO auth; any caller can insert rows into ai_crawler_visits, which the LLM-citation measurement reads (local: 204) -> F17.
- Rate limits: report generation has per-IP + site-wide daily caps (server.ts:816, reportGenerationLimiter.ts); geocode spaced + cached; admin login + TOTP attempt limits (in-memory per instance, documented as a speed bump). requestIp (server.ts:160) trusts the LEFTMOST X-Forwarded-For -> per-IP cap may be spoofable unless Vercel overwrites that header. Not tested (would write to production) -> PLAUSIBLE, F19.
- Secrets: git tracks only .env.example (placeholders; Clerk value is a pk_test publishable key, public by design). Local dist: 0 hits for key patterns/secret env values; the only ADMIN_* strings are setup-help text in AdminGate. Live entry bundle: production build, no jsxDEV, no local paths (the local dist is a dev-mode build with absolute file paths — local only, not deployed).
- npm audit --omit=dev (evidence/npm-audit.json): 15 advisories = 1 critical, 11 high, 3 moderate, all with fixes. Critical proxy-addr (IP spoofing via IPv4-mapped IPv6 trust subnet) is not reachable: the app never sets "trust proxy". Highs that do touch prod paths: body-parser (DoS), qs (DoS), nodemailer (allow-list bypass), zod (memory) -> F18.
- vercel.json: 1 cron, daily 06:00 (no hourly cron); security headers set (nosniff, SAMEORIGIN, HSTS, Referrer-Policy, Permissions-Policy). Last change ee4f28f (Find a Pro removal), no TTFB-relevant change.
- /api/health ok. Errors: unknown API -> JSON 404, malformed JSON -> plain "Bad Request" HTML, no stack traces.
- Cron route /api/cron/send-pending-report-emails: NOT called (a GET could send mail if CRON_SECRET were missing). Code (src/server/funnelApi.ts:78-96) refuses without the secret -> verified by code only.
## Next: Phase 8 speed + accessibility.

## Phase 8 — Speed and accessibility: DONE
- TTFB, live, 5 runs each (evidence/ttfb.txt): home 0.16-0.25s, guide 0.14-0.18s, study 0.16-0.26s, tool 0.16-0.26s. Baseline 2026-09-17: warm 0.26-0.34s, cold 0.42-0.93s -> no regression (all at or below the old warm range). Cold starts not isolated this run.
- LCP/CLS (Performance API, in-app browser — NOTE the pane was hidden, which the tool says skews timing): home at 1024x768 CLS 0.958 and 0.915 on two loads, source = <footer> moving from y=65 to off-screen at ~700 ms (prerendered HTML has no footer; it appears with an empty main during hydration, then content pushes it down). Same page at 375x812: CLS 0.000. Guide and permit-pulse: CLS 0.000. -> L2 lead, PLAUSIBLE; confirm in Search Console's Core Web Vitals report before acting.
- Bundles: live entry index-*.js 191 KB raw. Local build sizes are inflated (dev-mode JSX) so not used for comparison; no earlier bundle baseline in memory.
- A11y (home, guide #25, research tool, decoder): 1 h1 per page; one heading skip h2->h4 on /research/permit-pulse/; no unlabeled inputs on home/guide (decoder textarea + property pop-up issues already in F13). "Unnamed" TOC links on the guide are collapsed-TOC false positives (have text).
- Contrast, computed by hand from computed styles: gold eyebrow text rgb(184,137,92) on cream rgb(246,243,238) = 2.80:1 at 12px bold (e.g. "· BUYING AN OLDER HOME", "FREE. NO SIGN-UP REQUIRED", "COMMON IN HOMES BUILT AROUND…"); "QUICK ANSWER" label rgb(85,112,93) on rgb(226,232,223) = 4.36:1 at 11px. WCAG AA needs 4.5:1 -> F20. Other automated lows were text over images/gradients (false positives, dropped).
- Keyboard: property pop-up can't be closed with Escape (F13). Rest of the tool uses native buttons/inputs.
## Next: Phase 9 measurement integrity.

## Phase 9 — Measurement integrity: DONE (evidence/cta-click-report.txt)
- scripts/cta-click-report.ts 28 (SELECT only): 26 unique clicks in 28 days across 15 (cta, page) pairs. Research funnel: choose_research 2 -> research_start 2 -> details_done 2 -> first_solved 2 -> report_done 1.
- Ids: every id the client fires literally is in the server allow-list (src/server/ctaClicksApi.ts); the rest are fired via variables (research funnel, decoder, choose_*). addon_demo_* are fired from the static page public/tools/add-on-finder/index.html (live 200, commit 1cc4e7e) -> no orphan ids either way.
- Once per house: HouseResearchTool.tsx:82-89 sends each funnel step only if not already in state.funnel (localStorage), and the list resets with "Start over" -> design holds; data is consistent (no step exceeds the one before it).
- Test traffic: whether the 2 research runs are the owner's walk-throughs could not be checked — an ad-hoc read-only SELECT by day failed (Neon host ENOTFOUND outside the report script) -> NOT VERIFIED. This audit's own tool runs went to the local nodb server with beacons stubbed, so they are not in these counts.
- Side note: the measurement volume (26 clicks/28 days) is too small to read any CTA rate; not a defect.
## Next: Phase 10 verification pass.

## Phase 10 — Verification pass: DONE
- Each finding was re-checked by a second route: code read, plus a live or local reproduction. Final statuses are in findings.json.
- F3 root cause: scripts/prerender-research.tsx:825 `zHead = zoneSource.slice(0, zWrap)` copies the source file's doctype, html, head and body opening tags into the outer <head>. The dam study does the same.
- F5: 13 memory read dates have passed with no recorded result. This was found by pattern search, so it stays PLAUSIBLE.
- F12: confirmed against guide #321's CPSC paragraph (83-008, closed without a finding). F15: reproduced locally on 1530 Tower Ave (declared single_family, labelled Condo / Multi-Family Complex).
- Dropped after re-check: 8 items, listed in findings.json under "dropped". Examples: the #312 "truncation" and the automated contrast lows over images.
- Final: CONFIRMED 17, PLAUSIBLE 2 (F5, F19), leads 2 (L1, L2), NOT VERIFIED 8 (report.md §3).

## Phase 11 — Report: DONE
- report.md written. Severity: Critical 0, High 2, Medium 8, Low 8, Info 1.
- Fix batches A, A2, B, C and D are proposed. Nothing was applied. Waiting for the owner to say "resolve it".
- Cleanup: nodb preview stopped, local storage in the test tab cleared, viewport reset to desktop.

## Resolve — 2026-11-19 (owner: "resolve it")
Batch A (code), applied and verified on the local build, NOT committed or pushed:
- F15 server.ts resolvePropertyMetadata: the declared type decides the label; the street-word checks are gone. Local: 1530 Tower Ave, declared single_family -> "Single Family Home"; declared condo -> condo.
- F12 inspectionPriorities.ts: "recalled panel brands" -> "panel brands ... with documented breaker problems". The local report has the new wording and no "recalled". (Guide #50's copy of the sentence is batch C.)
- F14 researchState.ts forDeadline also rewrites "before your inspection deadline" / "option period ends|closes" / "inspection period ends" to the date. The final report runs the area report through forDeadlineDeep, and the research section shows "Your deadline: <date> · N days left". Checked with tsx: "before Nov 29".
- F2 server.ts ROUTE_CHILDREN: /about/x, /terms/anything/, /advertise/foo, /my-ads/x, /topic-ads/x and /tools/house-research/x -> 404. Real pages and /topic-ads/success/ -> 200.
- F16 /api/seo/indexnow needs an admin session (401 locally).
- F17 /api/internal/log-ai-crawler writes only when X-Internal-Log == CRON_SECRET. If CRON_SECRET is unset, it keeps logging. middleware.ts sends the header.
- F19 new src/server/clientIp.ts reads x-vercel-forwarded-for, then x-real-ip, then XFF. Used in server.ts, publicApiV1, adClicksApi and contentReportsApi.
- F3 prerender-research.tsx headContents(): outside-the-zone, high-hazard-dams and risk-without-price now have 1 doctype, html, head and body each. Styles are kept.
- F13 AddressSearchBox: role=dialog, aria-modal, aria-labelledby, focus in, Tab trapped, Escape closes, focus restored (all checked in the browser). Decoder textarea has an aria-label.
- F20 index.css: brass #9c7742 -> #7f5f35, moss #55705d -> #4f6957. The guide topic span inherits brass. Measured: 5.28, 5.85, 4.82 and 5.44 (all >= 4.5).
- F11 Terms 3.6: report refund removed. Last Revised Nov 19, 2026. TERMS_VERSION '2026-11-19'.
- Checks: tsc 0, npm run build 0 (canonical/schema gates pass), local smoke test 200s, report API ok.
Batch A2: npm audit fix (lockfile only, no --force). Before: 15 advisories (1 critical, 11 high, 3 moderate). After: 1 high, nodemailer, which needs a major bump (9 -> 10.6) and can't be tested without sending mail, so it was left. Rebuilt and smoke-tested.
Batches B and C: need the owner's OK per page (ranking pages / DB writes). Not started.

## Resolve, part 2: live-page batches (owner approved all four, 2026-11-19)
- F8 Permit Pulse: the Census file now covers Jan–Sep 2026 (total −0.5%, houses −2.9%, 5+ units +5.4%; 642 counties eligible).
  - The data and the study page were regenerated.
  - Three study sentences were written for a rising total and became false. They are now driven by the data, and a 1% stop protects the "flat" framing.
  - The dry run of the 20 county paragraphs found 5 claims the new numbers made false: Dallas "against the national pattern", Harris "most housing in this comparison", LA "more than doubled", Maricopa "multifamily fell further" and Riverside "weakest reporting". Each is now computed or gated, and Hillsborough's "almost exactly equal" became "close to equal".
  - Written with APPLY=true: 20 guides. Built pages: 0 say "through July 2026", 23 say "through September 2026".
- F9: #327 and #328 have past-tense openings. Source: NHC TCU, 830 PM CDT Oct 9 2026 (landfall near Destin FL, 105 mph), read at nhc.noaa.gov/archive/2026/al09/. Script: scripts/update-hurricane-openings-2026-11.ts. It checks the exact old paragraph and changes body only.
- F12 (#50): the "recalled" sentence was replaced, using scripts/fix-audit-sentences-2026-11.ts.
- F10: 10 sentences on #7, #115 (x2), #135, #171, #216, #221, #266 and #284 were written after the owner saw every before/after.
- assert-article-quality: exit 0. npm run build: exit 0. Spot-checked locally: the Dallas block renders.
- Still open:
  - The titles/metas of #327 and #328 still read pre-storm ("as Hurricane Isaias nears?", "Preparing for Hurricane Isaias?"). Not in the approved scope; they need their own OK.
  - nodemailer major upgrade.
  - F6 and F7 (projects).
  - F5 due reads.
- NOTHING committed or pushed. DB changes reach the live site only after the next deploy.
