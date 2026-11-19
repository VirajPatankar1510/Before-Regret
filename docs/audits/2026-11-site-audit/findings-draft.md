# Findings draft (unverified until phase 10)

| id | phase | severity (draft) | summary | evidence | status |
|---|---|---|---|---|---|
| F1 | 1 | Medium | Guide #312 home-insurance-aerial-photos-roof flagged as ending mid-list ("…gov / - Cotality premium projections, reported by Fox Business") | evidence/gates/content-audit.txt | lead |
| L1 | 1 | — | 6 external links timed out from script (fema.gov x5 incl. msc, gao.gov, plasticpipe.org PDF) on #313 #322 #327 | evidence/gates/content-audit.txt | lead: browser check |
| F2 | 2 | Low-Medium | Soft 404: any one-segment path under /about, /advertise, /terms, /accessibility returns 200 + homepage shell with canonical "/" | evidence/soft404.txt; server.ts:72-83, 1525-1550 | confirmed by code (2 routes) |
| F3 | 2 | Low | lang="en" instead of en-US on 2 research pages | evidence/crawl-issues.json | lead |
| F4 | 3 | Info | #13 and #22 "Discovered - currently not indexed", 0 impressions 90d (#22 <5 weeks old: do not judge) | evidence/url-inspection.txt, page-visibility.json | confirmed (GSC) |
| F5 | 3 | Low | 16 experiment read dates have passed; memory doesn't record whether they were read | MEMORY.md | confirmed |
| F6 | 4 | Medium | Engine cost figures (28 $ lines) have no recorded source, yet appear on guides and reports | src/engine/inspectionPriorities.ts; top-pages-claims.json | lead |
| F7 | 4 | Medium | 81 of 136 guides have no fact ledger; several high-traffic ones cite no source at all | evidence/ledger-coverage.json, top-pages-claims.json | lead |
| F1 | 1 | — | #312 truncation | evidence/gates/content-audit.txt | DROPPED (ends on sources list) |
| F8 | 4 | Medium | Permit Pulse not refreshed: 20 county guides say "Right Now ... through July 2026"; Census has Aug+Sep files out since 2026-10-27 | evidence/permit-pulse-staleness.txt | confirmed (2 routes) |
| F9 | 4 | Medium | Hurricane Isaias guides #327/#328 still open with the pre-landfall forecast of 9 Oct | articles.json + live HTML | confirmed (2 routes) |
| F10 | 4 | Low | 8 guides contain banned AI-cliché phrasing | evidence/aitells-context.txt | confirmed (context read) |
| F11 | 4 | Low | Terms §3.6 still mentions a report refund though reports are free | src/components/TermsConditions.tsx:136 vs :122,:131 | confirmed |
| F12 | 5 | High | Every report for a 1950–1989 home (and guide #50) says "Certain recalled panel brands"; the panels meant (FPE/Zinsco) were not recalled per the site's own guide #321 (CPSC closed FPE probe 1983 without a finding) | src/engine/inspectionPriorities.ts:252; articles #50, #321 | confirmed (2 routes) |
| F13 | 5 | Low-Medium | Property-type pop-up isn't a real dialog: no role/aria-modal, Escape doesn't close, no focus trap; decoder textarea unlabeled | src/components/AddressSearchBox.tsx; browser | confirmed |
| F14 | 5 | Medium | Research tool promises to "put the date on your report" but the report never shows the deadline unless something needs confirming; checklist keeps "before your inspection deadline" | HouseResearchTool.tsx:203,600; researchState.ts:307-316; browser | confirmed (2 routes) |
| F15 | 6 | Medium | Report header calls a declared single-family home "Condo / Multi-Family Complex" when the street text contains tower/commons/enclave/#/" ste"/" unit" etc. | server.ts:2230-2260; local API on 1530 Tower Ave | confirmed (2 routes) |
| F16 | 7 | Medium | /api/seo/indexnow is unauthenticated: anyone can make the site submit URLs to IndexNow with its key | server.ts:374-382; local 400 only on missing list | confirmed (code + local) |
| F17 | 7 | Low-Medium | /api/internal/log-ai-crawler is unauthenticated: anyone can add fake AI-crawler visits to the measurement table | server.ts:123-129; local 204 | confirmed (code + local) |
| F18 | 7 | Medium | npm audit: 1 critical (not reachable), 11 high, 3 moderate in production deps, all fixable | evidence/npm-audit.json | confirmed |
| F19 | 7 | Low | Per-IP report cap reads the leftmost X-Forwarded-For; spoofable unless Vercel overwrites it | server.ts:160 | plausible (not tested on prod) |
| L2 | 8 | (Medium if real) | Homepage CLS 0.9+ at 1024 px from the footer jumping during hydration; 0 on mobile; measured in a hidden pane | browser Performance API | plausible — check GSC Core Web Vitals |
| F20 | 8 | Low | Gold "eyebrow" labels are 2.8:1 contrast (needs 4.5:1); "QUICK ANSWER" label 4.36:1 | computed styles + WCAG formula | confirmed |
