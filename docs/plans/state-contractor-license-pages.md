# State contractor-license pages: tracker

Owner decision, 2026-11-13: all 50 states, each page real, useful and more than 60% different from every other. Flow
and rules: `.claude/skills/state-license-guides/SKILL.md`. Checker: `scripts/check-state-license-set.ts`.

**Statuses:**
- **TODO:** not started.
- **RESEARCH:** sources being read and the portal walked.
- **DRAFT:** written; checks not yet passing.
- **REVIEW:** checks pass; waiting for the owner.
- **LIVE #id:** published.
- **EXTENDED:** fewer than 10 license facts, so related state topics were added; the topics are listed in Notes.
- **BLOCKED:** a source would not load from our location; never worked around.

**Publishing:** each page goes live as soon as it's ready and the owner says "publish" (owner decision, 2026-11-13). Each page is read 5 weeks after it goes live.

**Hub:** `contractor-license-lookup-by-state` (TODO). It publishes after the Phase 1 survey and links each state page as it goes live.

| # | State | Slug | Status | Batch | Demand | Facts | Max overlap | Read date | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Alabama | alabama-contractor-license-lookup | TODO | | | | | | |
| 2 | Alaska | alaska-contractor-license-lookup | TODO | | | | | | |
| 3 | Arizona | arizona-contractor-license-lookup | TODO | | | | | | |
| 4 | Arkansas | arkansas-contractor-license-lookup | TODO | | | | | | |
| 5 | California | cslb-license-check-california-contractor | LIVE #350 | 0 | tier 2 | 22 | n/a | 2026-12-15 | Published 2026-11-10; never rename |
| 6 | Colorado | colorado-contractor-license-lookup | TODO | | | | | | |
| 7 | Connecticut | connecticut-contractor-license-lookup | TODO | | | | | | |
| 8 | Delaware | delaware-contractor-license-lookup | TODO | | | | | | |
| 9 | Florida | florida-contractor-license-lookup | TODO | | | | | | |
| 10 | Georgia | georgia-contractor-license-lookup | TODO | | | | | | |
| 11 | Hawaii | hawaii-contractor-license-lookup | TODO | | | | | | |
| 12 | Idaho | idaho-contractor-license-lookup | TODO | | | | | | |
| 13 | Illinois | illinois-contractor-license-lookup | TODO | | | | | | |
| 14 | Indiana | indiana-contractor-license-lookup | TODO | | | | | | |
| 15 | Iowa | iowa-contractor-license-lookup | TODO | | | | | | |
| 16 | Kansas | kansas-contractor-license-lookup | TODO | | | | | | |
| 17 | Kentucky | kentucky-contractor-license-lookup | TODO | | | | | | |
| 18 | Louisiana | louisiana-contractor-license-lookup | TODO | | | | | | |
| 19 | Maine | maine-contractor-license-lookup | TODO | | | | | | |
| 20 | Maryland | maryland-contractor-license-lookup | TODO | | | | | | |
| 21 | Massachusetts | massachusetts-contractor-license-lookup | TODO | | | | | | |
| 22 | Michigan | michigan-contractor-license-lookup | TODO | | | | | | |
| 23 | Minnesota | minnesota-contractor-license-lookup | TODO | | | | | | |
| 24 | Mississippi | mississippi-contractor-license-lookup | TODO | | | | | | |
| 25 | Missouri | missouri-contractor-license-lookup | TODO | | | | | | |
| 26 | Montana | montana-contractor-license-lookup | TODO | | | | | | |
| 27 | Nebraska | nebraska-contractor-license-lookup | TODO | | | | | | |
| 28 | Nevada | nevada-contractor-license-lookup | TODO | | | | | | |
| 29 | New Hampshire | new-hampshire-contractor-license-lookup | TODO | | | | | | |
| 30 | New Jersey | new-jersey-contractor-license-lookup | TODO | | | | | | |
| 31 | New Mexico | new-mexico-contractor-license-lookup | TODO | | | | | | |
| 32 | New York | new-york-contractor-license-lookup | TODO | | | | | | |
| 33 | North Carolina | north-carolina-contractor-license-lookup | TODO | | | | | | |
| 34 | North Dakota | north-dakota-contractor-license-lookup | TODO | | | | | | |
| 35 | Ohio | ohio-contractor-license-lookup | TODO | | | | | | |
| 36 | Oklahoma | oklahoma-contractor-license-lookup | TODO | | | | | | |
| 37 | Oregon | oregon-contractor-license-lookup | LIVE #353 (2026-11-13) | Group 1 | tier 2 (2026-11-13-demand-oregon-contractor-license) | 28 | 1.9% (vs CA) | 2026-12-18 | Portal walked 2026-11-13; ORS 701 site blocked, only CCB-cited ORS used; image JPEG (no webp encoder) |
| 38 | Pennsylvania | pennsylvania-contractor-license-lookup | TODO | | | | | | |
| 39 | Rhode Island | rhode-island-contractor-license-lookup | TODO | | | | | | |
| 40 | South Carolina | south-carolina-contractor-license-lookup | TODO | | | | | | |
| 41 | South Dakota | south-dakota-contractor-license-lookup | TODO | | | | | | |
| 42 | Tennessee | tennessee-contractor-license-lookup | TODO | | | | | | |
| 43 | Texas | texas-contractor-license-lookup | LIVE #358 (2026-11-14) | Group 1 | tier 2 (2026-11-14-demand-texas-contractor-license) | 19 | 2.4% (vs CA) | 2026-12-19 | TDLR search walked 2026-11-14; no state GC license; TSBPE complaint page Cloudflare-blocked, no plumbing search run; image JPEG |
| 44 | Utah | utah-contractor-license-lookup | TODO | | | | | | |
| 45 | Vermont | vermont-contractor-license-lookup | TODO | | | | | | |
| 46 | Virginia | virginia-contractor-license-lookup | TODO | | | | | | |
| 47 | Washington | washington-contractor-license-lookup | LIVE #354 (2026-11-13) | Group 1 | tier 2 (2026-11-13-demand-washington-contractor-license) | 22 | 3.1% (vs OR) | 2026-12-18 | Verify walked 2026-11-13; RCW 18.27 read in full; image JPEG |
| 48 | West Virginia | west-virginia-contractor-license-lookup | TODO | | | | | | |
| 49 | Wisconsin | wisconsin-contractor-license-lookup | TODO | | | | | | |
| 50 | Wyoming | wyoming-contractor-license-lookup | TODO | | | | | | |

## Progress log

| Date | States researched | Notes |
|---|---|---|
| 2026-11-13 | Phase 1 survey started: 26 states have a first verified row; 7 blocked; 17 to retry in the browser | Survey data: `data/state-license-survey.json` |
| 2026-11-13 | Phase 1 first pass done: all 50 rows filled or BLOCKED (2 verified, 36 partial, 12 BLOCKED; SC and KS have rows but blocked lookups) | Blocked list sent to owner for screenshots. Partial rows still need lookup URL (10) or statute section (26); those are filled during each state's Phase 2 research, not guessed now. "No statewide GC license" claims (type B/D) each still need an official source before a page states them. |
| 2026-11-13 | Oregon: Phase 2 research and draft done, checker + publish dry run + quality gate pass; sent to owner for review | Checker and quality gate now accept ORS/RCW/NRS citations (state convention has no §). |
| 2026-11-13 | Oregon published as #353 (commit 94dc36d): FAQs verified live, IndexNow 200, in sitemap | No inbound-link anchor in the library yet; the hub will link it. READ 2026-12-18. |
| 2026-11-13 | Washington: Phase 2 research and draft done, all checks pass; sent to owner for review | |
| 2026-11-13 | Washington published as #354 | READ 2026-12-18. |
| 2026-11-14 | Texas: Phase 2 research and draft done; set checker (0 fails, worst 3.1%), publish dry run and quality gate pass; sent to owner for review | |
| 2026-11-14 | Texas published as #358 after a correctness pass (DBA wording fixed; unsourced "written request" line cut); 4 FAQs | READ 2026-12-19. |
