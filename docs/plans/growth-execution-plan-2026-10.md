# Before Regret — growth execution plan

**Written:** 2026-10-21. **Owner:** Viraj. **Executor:** Claude, in Claude Code sessions.
**Source strategy:** the four-pillar roadmap from 2026-10-21. This file turns it into steps someone can follow.

This plan is followed in order. Each task lists:
- **Why:** the goal;
- **Touch:** the files involved;
- **Steps:** what to do;
- **Verify:** proof that it worked;
- **Owner:** what needs your go-ahead;
- **Rollback:** how to undo it.

A task is done only when its **Verify** step has been run and its output pasted into the task log at the bottom of this file.

---

## 0. Rules for not making things up (apply to every task)

1. **Measure first, quote second.** Every number in this plan, in a page or in a pitch comes from a file or a script run in that session. It is quoted with the file name and date. Numbers remembered from earlier sessions are re-pulled before use.
2. **Every outside name is checked in a browser before use.** That covers journalists, outlets, subreddits, newsletters, portals and laws. Record the URL that proves it and the date it was read. If it can't be checked, write `UNVERIFIED` and don't use it.
3. **Legal and policy lines are quoted from the primary source:**
   - Google's spam policies: developers.google.com/search/docs/essentials/spam-policies
   - RESPA §8: 12 U.S.C. §2607
   - Reddit rules: each subreddit's own rules page

   Paraphrase only after reading.
4. **Never invent:** statistics, search volumes, experts, quotes, testimonials, partner names or "results". Search data is first-party only, and Bing counts are relative only.
5. **Existing rules still apply:** reports are area-based; no fear wording; no insurer next to an underwriting verb; never change a published slug; never edit an existing page without the owner's OK; owner titles are used word for word.
6. **Nothing goes live without the owner saying "publish".** Nothing is sent to anyone outside (email, DM, pitch, Reddit) by Claude. The owner sends everything by hand.
7. **If a step's check fails, stop.** Report the failure with its output. Don't work around it.

---

## 1. Facts this plan rests on (measured 2026-10-21)

| Fact | How it was measured |
|---|---|
| 100 guide URLs and 17 page URLs (9 of them research studies) are in the sitemaps | `grep -c "<loc>" public/sitemaps/*.xml` |
| 21 county permit guides are live (list in §6.4) | sitemap-guides.xml |
| Report permalinks are `/insights/<id>`, and `/report/<id>` redirects there with a 301 | server.ts:536, App.tsx:492 |
| **Defect 1:** `/insights/<any-id>` returns HTTP 200 with the homepage's `<title>`, `index, follow` and canonical `/`. The `noindex` only arrives after JavaScript runs | `curl https://www.beforeregret.com/insights/abc123/` |
| **Defect 2:** the report's `noindex` is set client-side with canonical `/report/<id>`, which is a redirect | App.tsx:805–810 |
| The report has a "Save PDF" button (`window.print()`) and **no share button** | PropertyReportView.tsx:228 |
| CTA clicks are logged in `cta_clicks` through `POST /api/cta-click`. Only names on the `CTAS` allow-list are kept | src/server/ctaClicksApi.ts |
| 11 diagrams are on the CC BY reuse list | src/data/reusableDiagrams.ts |
| 1 earned backlink (MG Plumbing → cast-iron guide) | data/backlinks/ledger.json |

**County datasets.** The join to the 3,144 counties in `oldest-housing-by-county.csv` was checked in this session:

| Dataset | Rows | Key | Matched by name | Note |
|---|---|---|---|---|
| oldest-housing-by-county.csv | 3,144 | `geoid` (FIPS) | — | Base table: housing age by decade, median year built |
| permit-pulse-figures.json | 567 | `fips` | — | Only counties that pass the study's data gates |
| county-premiums.json | 3,093 | name + state | 3,050 | 43 don't match |
| dams-high-hazard.json | 2,274 | name + state | 2,233 | 41 don't match. **Unknown:** does a county with no row mean zero dams, or no data? Check before use |
| flood-outside-zone.json | 1,921 | name + state | 1,897 | 24 don't match. `minShow` = 25, so small samples are left out on purpose |
| flood-takeup.json | 2,304 | name + state | 2,297 | 7 don't match |
| storm-and-premium-counties.csv | 100 | `geoid` | — | 100 counties only |

**How many modules each county has** (of 8; housing age and era counts always exist):

| Modules | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|
| Counties | 71 | 240 | 574 | 808 | 991 | 405 | 55 |

So 2,259 counties have 5 or more modules. The first gate barely limits anything; gates 2–4 in §6.3 and the pilot size do.

---

## 2. Order of work and calendar

| Phase | What | Starts | Depends on |
|---|---|---|---|
| P0 | Baseline snapshot | 2026-10-21 | — |
| P1 | Report-link safety fixes | 2026-10-22 | P0 |
| P2 | Sharing on the report | after P1 is live | P1 |
| P3 | Content cadence (5 clusters), runs throughout | 2026-10-22 | — |
| P4 | County hub pilot (10 hubs) | after P2 ships | P0, owner approves the new URL section |
| P5 | Reusable diagrams, embed snippet | with P3 | — |
| P6 | Data PR (one study, one pitch round) | after P4 is published | P4 hubs, so pitches have a county page to link to |
| P7 | Inspector and loan-officer partners | after P2 (needs the checklist PDF) | P2 |
| P8 | Measure, read dates, decide | weekly | all |

**Honest timing.** Google takes about 5 weeks to start showing new pages here. Most traffic effects from P3, P4 and P6 land **after** 2026-11-27, the date of your $500/month goal. That goal depends on selling ads: ZIP ads are built but have never been pitched. This plan grows the readers the ads are sold on. It doesn't replace selling them.

---

## P0. Baseline snapshot (day 1, about 1 hour)

**Why:** every later "it worked" or "it didn't" is compared against this. No baseline means no claim.

**Steps:**
```bash
npx tsx scripts/pull-gsc-queries.ts
npx tsx scripts/pull-bing-queries.ts
npx tsx scripts/gsc-page-coverage.ts 28        # prints top 15 only -- never sum its stdout
npx tsx scripts/gsc-url-inspection-sweep.ts   # index state of never-shown guides
npx tsx scripts/cta-click-report.ts
npx tsx scripts/backlink-watch.ts
```
- Write `data/experiments/2026-10-21-growth-baseline.json` with:
  - Google and Bing impressions and clicks over 28 days, for the site and **per page type** (county guide, other guide, research), taken from the page dimension rather than the query dimension;
  - the count of indexed vs not-indexed guides;
  - CTA clicks by name;
  - the backlink count.
- Every value records the script and the run date.

**Verify:** the JSON exists. Each value matches the script output pasted into the log.
**Owner:** none.

---

## P1. Report-link safety (before any sharing work)

### P1.1 Server-side noindex and a real 404 for report links
**Why:** fixes Defects 1 and 2. Sharing would otherwise put hundreds of homepage duplicates in front of Google.

**Touch:** `server.ts` (the `/insights/` handler and the catch-all at about line 1258, where `KNOWN_STATIC_ROUTE_PREFIXES` lists the routes).

**Steps:**
1. Read how `/insights/:id` is served today. Don't assume.
2. For `GET /insights/:id` and `/reports/:id`:
   - look the ID up with the same query as `/api/insights/:reportId`;
   - if it isn't found, return a real **404** with the 404 shell;
   - if it is found, serve the shell with the header `X-Robots-Tag: noindex, nofollow`, and replace `<meta name="robots">` in the HTML with `noindex, nofollow`.
3. Replace the canonical with the report's own `/insights/<id>/` URL, or remove the canonical tag. A canonical must never point at `/` or at a redirect.
4. In App.tsx:809, change the client canonical to match.

**Verify (paste the outputs):**
```bash
curl -sI https://www.beforeregret.com/insights/abc123/ | grep -i "^HTTP\|x-robots"                        # expect 404
curl -sI https://www.beforeregret.com/insights/<a-real-id>/ | grep -i "x-robots"                          # expect noindex, nofollow
curl -s  https://www.beforeregret.com/insights/<a-real-id>/ | grep -o '<meta name="robots"[^>]*>'          # expect noindex
```
- A real report ID comes from the DB. Never create a test report for this, because the local `.env` is the production DB.
- `npm run build` must pass, and `/api/health` must return 200 after the push.

**Owner:** "publish". **Rollback:** revert the commit.

### P1.2 Report link previews that don't reveal the address
**Why:** a link pasted into iMessage, WhatsApp or Reddit currently previews the homepage. A preview showing the street address would reveal the house someone is buying.

**Steps:**
1. List the fields a stored report actually has: `SELECT` one row and record which ones exist (county, state, decade built, …). Use only those.
2. Render on the server: `og:title` and `twitter:title` as "Home-buying checklist: a [decade]-built home in [County], [State]", plus a matching `og:description`.
3. **Never include the street address, ZIP code or report ID in any preview tag.**
4. Use the existing default `og:image`. A new image is optional and comes later.

**Verify:**
- `curl` a real report and grep for `og:title`. Confirm the address string does **not** appear in `<head>`, by grepping for the street number.
- Then paste the link into a preview tool, or ask the owner to text it to themselves.

**Owner:** "publish".

---

## P2. Sharing on the report

**Before building:** the owner approves the exact button labels and pre-filled text below. Change the wording here first, then build.

| Element | Behaviour | Pre-filled text (draft for the owner to approve) |
|---|---|---|
| **Share** button (next to Save PDF) | On phones, `navigator.share({title, url})` opens the built-in share sheet. Elsewhere, "Copy link" with a "Link copied" confirmation | "What to check on this house before our inspection deadline:" + link |
| **Email my agent / inspector** | Opens a draft in the user's own email app (`mailto:`). Nothing is sent by us | Subject: "Questions for the inspection — [County] home, built [decade]". Body: the report's Ask/Verify items as plain text, plus the link |
| **Inspector checklist** | A print layout with only the items to verify, a tick box per item and a notes line; small brand line and URL in the footer | — |
| **Copy for Reddit / a forum** | Copies plain text without the address: county, decade, top 3 items. No link by default | "Buying a [decade] home in [County], [State]. These came up as things to check: … What would you ask the inspector?" |

**Rules:**
- **Never use `document.title` as the share title.** On an open report the client sets it to "Property Insights | <full address>", which was seen in P1 testing. Build the share title from era, county and state, like the server preview.
- Wording stays area-based: "what to check for a home like this".
- No countdowns, no fear wording, no rewards for sharing.
- Claude never posts anywhere.

**Logging:**
- Add `report_share`, `report_copy_link`, `report_email_agent`, `report_checklist_print` and `report_copy_forum` to `CTAS` in `ctaClicksApi.ts`.
- Send `page: '/insights/'` **without the report ID**, so `cta_clicks` never stores a link to someone's report.

**Measuring where shared visits come from:**
- Shared links carry `?s=share`. On load, if `s=share` is present, log the CTA `report_open_from_share` once.
- The tag holds no personal data.

**Verify:**
- Build passes.
- Check in the browser at a phone size on the local production preview (`beforeregret-prod`): each button works, the text copied for forums contains no address, and the print preview shows only the checklist.
- After deploy, `npx tsx scripts/cta-click-report.ts` shows the new CTA names once the owner has clicked each one.

**Owner:** approve the wording, then "publish".
**Read:** 4 weeks after it goes live. Metric: `report_open_from_share` ÷ reports created over the same window.

---

## P3. Content cadence: five clusters (runs throughout)

**Process:** every page goes through the `write-article` skill (five questions, fact ledger, "How we checked this", `assert-article-quality`). There are no exceptions and no batches.

**Pace:** 3–5 pages a week in total. Never more than 2 in one day.

### P3.0 Inventory (before writing anything new)
- Sort every published guide into the five clusters below. Run `guideTopic()` over the DB and save the output as `data/content-queue/cluster-inventory-2026-10.json`.
- For each cluster, list the members, the 28-day Google and Bing impressions (from P0) and the index state.
- Gaps are chosen from this file, not from memory.

### The clusters, and the first pages in order

| # | Cluster | First moves | Data used (files that exist) |
|---|---|---|---|
| 1 | Permits and unpermitted work | #287 rewrite (Google: discovered, not indexed) → 2 new county guides a week (the not-templated method; portal checked in a browser) | `permit-pulse-by-county.csv`, portal screenshots |
| 2 | Can it be insured | CLUE guide done 2026-10-20 → a 4-point inspection guide (check demand first) | `county-premiums.json`, `storm-and-premium-*` |
| 3 | Water | Add the sewer diagram to #300 after 2026-11-11 (owner already OK'd) → "outside the flood zone and still flooded" (overlap check against #322 first) | `flood-outside-zone.json`, `flood-takeup.json`, `dams-high-hazard.json` |
| 4 | Era systems | "When was my house built" guide (proposed in memory, overlap check against #115 and the oldest-housing study) | `oldest-housing-by-county.csv`, engine `PRIORITY_RULES` |
| 5 | After the inspection | Read every state's standard contract inspection clause before writing anything; start with one state where the form is publicly readable | Each state form, quoted with section numbers |

**Each page also:**
- Before writing: `topic-demand.ts` (tier recorded in the brief) and an overlap check.
- After publishing: `suggest-inbound-links.ts`; links are added only with the owner's OK.

**Verify, per page:** the write-article checklist and the live-page check, recorded in that page's memory note with its read date.

---

## P4. County data hub pilot (10 hubs)

> **STOP: found during P0 (2026-10-21). This was tried before and failed.**
> - **2026-08-09** (`d4647ff`): 100 county research pages were built at `/county/<slug>/`, using Census housing age, the EPA radon zone, FEMA's National Risk Index and NOAA storm events.
> - **2026-08-23** (`a09f74b`): 91 were removed as "near-identical templated copy". They had never been indexed after months, with about 0 impressions in 90 days.
> - **Today:** the `county_data` table still has all 100 rows, with **0 enabled**. `/counties/` returns **410** and `/county/<slug>/` returns 410.
>
> What P4 below proposes is the same idea with more datasets, so it must not go ahead as written. Revised recommendation, which needs the owner's decision:
> - **(A, recommended) Update the existing pages.** Add a county data section to the **21 existing county permit guides**. Google already shows 17 of them: 2,001 impressions and 25 clicks over 28 days (P0 baseline). This creates no new URLs, so no new indexing problem, and it uses the crosswalk from P4.1. Every guide edit needs the owner's OK.
> - **(B) Retry new URLs.** Only with a written answer to "what is different from August": for example no generated narrative, a person-checked portal, the decile gate, 10 pages, and a different URL from the 410'd ones. Even then, history says expect "Discovered – not indexed".
> - **(C) Drop P4.**
>
> P4.1 (crosswalk) is useful under A or B. The rest of P4 below describes B and is kept for reference.

**Owner approval needed first:** a new URL section `/counties/`. Show the owner one rendered hub before building the other nine.

### P4.1 Crosswalk the data to FIPS (`scripts/build-county-hub-data.ts`)
**Why:** four datasets are keyed by name; §1 measured 7–43 unmatched rows each.

**Steps:**
1. Use `oldest-housing-by-county.csv` as the base (3,144 FIPS codes).
2. Join the name-keyed files using normalised names plus the state, written to `docs/data/county-hub-data.json`.
3. Print every row that doesn't match. Fix each through an explicit alias table in the script, such as Virginia independent cities and Alaska boroughs. Never guess a match.
4. Write down, for each dataset, what a missing row **means**: zero, suppressed or no data. Read each study's own script or methodology to find out. Dams is the open question. A module is shown only when its meaning is known.
5. Compute each county's national percentile for every measure.

**Verify:**
- Unmatched rows are listed, and each one is aliased or explained.
- Spot-check 5 counties by hand against the source CSV or JSON, and paste them in the log.
- Lesson from the "Risk Without Price" study: look for outliers (for example Puerto Rico or territories leaking in) before trusting any rank.

### P4.2 Methodology page `/counties/methodology/`
- One page holds all the fixed explanation text: sources, years, what is suppressed and why, and the area-based caveat.
- Hubs link to it, so they don't repeat boilerplate.

### P4.3 Hub page `/counties/<st>/<county-slug>/`
- **Modules:** only those with known-meaning data. The table is in the strategy. Each module shows its source and year, and its chart is drawn from `county-hub-data.json`.
- **Lead finding:** computed from the county's most extreme percentile using one sentence pattern per measure. Fixed sentences filled with numbers, never generated text.
- **Records module:**
  - Links the county permit guide where one exists.
  - Otherwise shows a county portal link checked in a browser, with "checked on <date>".
  - If neither exists, the hub fails gate 3.
- **Main action:** "Check an address in [County]" opens the report tool.
- **Rules:** no AI text; the title never contains "permit"; the page is prerendered at build time like the guides.

### P4.4 The gate (server-side; `assert-county-hubs.ts` runs in the build)
A hub gets `index, follow` and a sitemap entry only if all four hold:
1. At least 5 of the 8 modules have data with a known meaning.
2. At least one measure is in the top or bottom 10% nationally.
3. The county portal was checked by a person in a browser within 90 days. The date is stored with the hub.
4. **Uniqueness:** at least 60% of the hub's visible text words are county-specific values or labels. The check script counts them.

**Otherwise:**
- `noindex, follow` sent as an `X-Robots-Tag` header, and no sitemap entry.
- robots.txt never blocks `/counties/`.
- The state hub `/counties/<st>/` stays noindex until 3 of its counties pass.

### P4.5 The pilot: 10 counties that already have a permit guide
The 21 county guides cover: Tarrant TX, Los Angeles CA, Orange CA, Santa Clara CA, Riverside CA, San Bernardino CA, Broward FL, Middlesex MA, Sacramento CA, Hillsborough FL, Bronx NY, Queens NY, Brooklyn (Kings) NY, Manhattan (New York County) NY, Philadelphia PA, San Diego CA, Miami-Dade FL, Cook IL, Clark NV, Maricopa AZ, Dallas TX.

- **Choosing the 10:** after P4.1, take the 10 with the most modules and a gate-2 finding. Avoid more than 3 from one state.
- **Links:** each permit guide gets **one** prose sentence linking its hub, and only with the owner's OK. The hub links back from its Records module.

### P4.6 Publish, read and decide
- **Publish:** owner says "publish" → build → push → `curl` each hub for status, robots and canonical → IndexNow the indexable hubs → the owner requests indexing for 3 of them.
- **Read date:** 5 weeks after publishing. Before publishing, record the 28-day impressions of the 10 matching permit guides, to watch for one stealing searches from the other.
- **Decide:**
  - **Scale:** if Google shows 6 or more of the 10, and the permit guides haven't dropped by more than their normal week-to-week swing, add 5 hubs a week.
  - **Hold:** if Google shows 3–5, change one thing (for example the lead finding or the internal links) and read again in 4 weeks.
  - **Fold:** if Google shows fewer than 3, move the modules into the permit guides as a data section, redirect each hub to its guide (301), and record it in memory.

---

## P5. Reusable diagrams (alongside P3)

- On each diagram in `REUSABLE_DIAGRAMS` (11 today), add an "Use this diagram" box: the CC BY 4.0 licence line plus a copyable HTML snippet.
- **The credit link is the brand name "Before Regret", not keywords.** Keyword credit links can count as link schemes under Google's spam policies. Quote that policy line in the code comment after reading it.
- Every new diagram is added to the list when it's published.
- **Monthly** (first Monday): run `backlink-watch.ts` and record new links. A trade business that cites us is also a prospect for Find a Pro or ads.

**Verify:** the snippet renders, and the copied HTML is valid with the credit link to the guide.

---

## P6. Data PR: one study, one round

1. **Pick the study** with the clearest county ranking. Candidates: Outside the Zone, Oldest Housing, Permit Pulse. Make sure the study's numbers are re-checked and still current.
2. **Build the pitch kit:**
   - the top-10 county list, computed from the study's JSON (script committed);
   - a short methods note;
   - a CSV;
   - a CC BY chart.

   Each county's numbers must match its hub from P4.
3. **Find recipients by real bylines:**
   - For each top-10 county, find the local newspaper or TV data or real-estate reporter **from an article they wrote** in the last 12 months.
   - Record the article URL and date in `marketing/pr-tracker.csv`. No byline found means no pitch to that outlet.
   - Do the same for national outlets (housing and data desks) and dataset newsletters. Check each newsletter's submission page exists before listing it.
4. **Drafts:** Claude writes one email per county with that county's numbers, in "we" voice, with no hype. The owner sends from hello@beforeregret.com by hand.
5. **Never:** paid links, guest-post swaps, or "link to us" asks. Offer the data and the chart.
6. **Track** replies, coverage and links in `pr-tracker.csv`, and confirm with `backlink-watch.ts`. Read 6 weeks after the first send.

---

## P7. Inspector and loan-officer partners (after P2 ships)

**What we offer:**
- the inspector checklist PDF from P2;
- a free Find a Pro listing;
- a link they can send clients: `/?p=<partner-slug>`. The tag is logged as a CTA, with no personal data.

**Rules:**
- **No link or mention required in return** for a listing. Required link swaps break Google's link-scheme policy.
- **Loan officers and RESPA §8 (12 U.S.C. §2607):** nothing of value is exchanged for referrals. Read the statute text and quote the relevant line in the outreach notes before contacting any lender.
- **Outreach voice:** Instagram DMs in our voice (`feedback_vendor_dm_voice`): "we", no numbers, not tied to one page. Claude drafts; the owner sends by hand.
- **Prospects:** start with businesses already in `marketing/instagram-prospects.csv` and any business that cites us (P5).

**Track:** a partner sheet in `marketing/partners.csv` (who, date contacted, reply, listing live, link tag clicks). Read 6 weeks after the first contact.

---

## P8. Measuring and deciding (every Monday)

- **Run:** `pull-gsc-queries`, `pull-bing-queries`, `gsc-page-coverage 28`, `cta-click-report`.
- **Compare** with the P0 baseline using weekly figures, not overlapping windows. Google data lags 2–3 days.
- **Act on stop conditions on their dates.** "Wait longer" is not an outcome.
- **Existing read dates in memory:** 11-02, 11-06, 11-07, 11-08, 11-09, 11-11, 11-12, 11-13, 11-14, 11-18, 11-21, 11-22, 11-23. P8 includes them.

---

## Task log
<!-- Each finished task: date, task id, Verify output pasted, commit hash. -->

| Date | Task | Result / verify output | Commit |
|---|---|---|---|
| 2026-10-21 | §1 facts | Dataset joins and coverage measured in session | — |
| 2026-10-21 | P0 | `scripts/growth-baseline.ts` → `data/experiments/2026-10-21-growth-baseline.json`. Google, 28 days by page: 10,000 impr / 93 clicks / 120 URLs. County permit guides: 17 of 21 shown, 2,001 impr, 25 clicks (95 impr and 1.19 clicks per published page). Other live guides: 73 of 79 shown, 7,045 impr, 54 clicks (89 and 0.68). Research: 123 impr, 1 click. Removed guide URLs still shown: 12, with 426 impr and 9 clicks (top: knob-tube-fuse-box-look-like 154/2, happens-if-seller-didn-t-disclose-past-insurance-claim 135/3, home-inspection-cover-retaining-walls 70/4). Bing capture: 413 queries, 642 impr, 57 clicks. CTA clicks over 28 days: 2. Backlinks: 1. Correction: the remembered "county guides 2.6× per page" is stale; impressions per page are now equal and clicks per page are 1.7× | 6ed76f1 |
| 2026-10-21 | P0 finding | `/counties/` and `/county/*` were tried in Aug 2026 and removed (see the STOP box in P4) | — |
| 2026-10-21 | P4 decision | Owner chose **option A** (county data on the 21 existing permit guides, no new URLs). The pSEO research (docs/research/pseo-good-vs-bad-2026-10.md) was done first | — |
| 2026-10-21 | P4.1 crosswalk | `scripts/build-county-guide-data.ts` → `src/data/countyGuideData.json`. All 21 joined by FIPS (housing, permits) and by name with near-miss guard (flood, take-up, dams); 0 ambiguous. Absence meanings taken from each study's Method section. Take-up has no row for the NYC boroughs, Tarrant or Philadelphia and gives no reason, so the module is hidden. Premiums left out (ACS 2019–23, pre-surge). Single-family % is shown only on a base of ≥50. Spot-checks against the raw CSV: LA 1965/14.3%, Kings 1944/47.0%, Tarrant 1990/2.8% | uncommitted |
| 2026-10-21 | P4 mock-up | `CountyDataSection.tsx` in GuideArticleLayout (server HTML and browser), enabled for Philadelphia only. Local build: present in dist Philadelphia, absent in Cook; phone render checked, no console errors; decade shares sum to 100.0% | superseded by the split test below |
| 2026-10-30 | Tool: Inspection Report Decoder LIVE (noindex) | /tools/inspection-decoder/: 43 terms in 9 categories, each linked to a published guide (all 42 links exist). Accordion layout, sticky Share/Print bar. Paste-scan in the browser with negation handling (`scripts/test-decoder-matching.ts`, 11/11). No AI, no outside API. "Shared by" is opt-in only (the demo uses `?via=example`). Private usage counts in cta_clicks, read with `scripts/decoder-usage-report.ts`. Live: 200 + noindex; no-slash URL 308; /tools/ 404; health 200. Not opened live, to keep usage data clean | b08ba65 |
| 2026-10-22 | P3 #287 rewrite | write-article: IRC 2021 R105.1/.2/.5/R108.6/R113, Fannie Mae B4-1.3-05, TX Prop. Code 5.008, WA RCW 64.06.010/.020/.030 read in the browser; ledger with 9 facts and 6 cuts (insurers, title policy blocked, CA TDS not in statute). Quick answer cleared (not a question title). Dry run: overlap ≤5.5% with 6 siblings, every number in the ledger; quality gate ok. Live: new sections present, 4 FAQs verified in schema and on the page, health 200, IndexNow 200. **READ 2026-11-26** | 4b2eb2e |
| 2026-10-21 | P4 split test LIVE | Owner approved a split test. Section is on 10 guides (Riverside, Philadelphia, LA, Orange, Queens, Miami-Dade, Cook, Middlesex, Santa Clara, Sacramento). The 11 others are the comparison group. Baseline (28 days): treatment 1,071 impr / 18 clicks; control 1,006 / 9 (`data/experiments/2026-10-21-county-data-split.json`). Live: all 21 return 200 with FAQPage schema; section present on exactly the 10. IndexNow 200. **READ 2026-11-25** | 6d111ea |
| 2026-10-21 | P1 live | Deployed in about 80 s. Same checks against www.beforeregret.com: fake ID 404 + noindex header; 2 real reports 200 + noindex, area-only titles, no address or ZIP in the HTML; /report/ 301; /api/health 200; homepage `index, follow`; guides 200 | 6ed76f1 |
| 2026-10-21 | P1.1 + P1.2 (local) | Local production build, port 3001. Fake ID: 404 with X-Robots-Tag `noindex, nofollow`, robots meta noindex, no canonical, no og:url. Two real reports: 200 with noindex header and meta; title and og:title "Home-buying checklist: 1950s construction in Morris County, NJ \| Before Regret"; street address and ZIP absent from the HTML (checked by string match). `/report/abc123` → 301. Homepage still `index, follow`. Report renders in the browser (21 blocks, Save PDF, no console errors); client canonical is now self-referencing | 6ed76f1 |
