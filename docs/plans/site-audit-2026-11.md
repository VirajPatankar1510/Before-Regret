# Site-wide audit plan (2026-11-19)

Owner request: "a complete site wide audit without hallucinating. Plan it completely from start to end."

## What "without hallucinating" means here (the rules every phase follows)

1. **No finding without evidence.** A finding must include:
   - what was run, opened or read (a command, a URL, or `file:line`);
   - the exact output or quote;
   - a saved evidence file under `docs/audits/2026-11-site-audit/evidence/`.

   A suspicion with no evidence goes in the "Leads not confirmed" list, never in the findings.
2. **Second look before it counts.** Before the report is written, every finding is re-checked by a different route than the one that found it:
   - curl, then the browser;
   - a script, then reading the code;
   - live, then local.

   A finding that doesn't reproduce is dropped and the drop is logged. (The `faq-verify-live` lesson: a single `curl | grep` once produced a confident false alarm.)
3. **"Not checked" is a valid answer.** Things we can't check go under "Not verified", with the reason. That includes sites behind a CAPTCHA, a geo-block or a login. They are never guessed and never worked around.
4. **First-party data only.** Use this site's GSC and Bing, production HTML, the repo, the database (read only) and the browser. No third-party SEO numbers. No search volumes.
5. **Read-only.** The audit changes nothing. Fixes are proposed with an exact diff or a step list, and are applied only after the owner says "resolve it". Pushes happen only on "push".
6. **Labels.** Every line in the report is marked **fact**, **calculation**, **inference** or **recommendation**.

## Hard limits (the audit stops at these, never goes around them)

**Data and code**
- No commits, pushes, deploys, DB writes or `APPLY=true` scripts.
- Never run `npm run outreach:send`, `faq-save.ts`, IndexNow or Bing submit scripts.

**Production and test hygiene**
- No reports, test events or funnel beacons into production.
  - Reports are built only on the local no-DB build (`beforeregret-nodb`, port 3002).
  - On a production page, override `navigator.sendBeacon` and `fetch` to `/api/cta-click` before clicking anything.

**People and money**
- No emails, DMs, form submissions, account creation, sign-ins or payments.
  - The advertiser checkout is walked up to the payment provider's page and stops there.

**Browsing**
- Addresses tested must be public buildings, never private homes. The one exception: an address the owner gives for a bug.
- No CAPTCHA solving, no geo-block workarounds and no automated Google or Bing searches.

**Owner rules that limit what the audit may propose**
- Never propose changing a published slug.
- Never propose "pruning" pages younger than 5 weeks.
- Never bulk-edit ranking pages. Any proposal touching a ranking page is flagged "needs owner OK, ranking risk".

## Inventory (fact, from the repo on 2026-11-19)

**Pages**
- **Sitemaps:** 155 unique URLs, mostly guides, plus 10 research studies and these core pages:
  - `/`, `/guides/`, `/about/`, `/accessibility/`, `/advertise/`, `/walkthrough/`, `/research/`, `/sunlight/`
- **Pages not in the sitemaps:**
  - `/tools/house-research/`, `/tools/inspection-decoder/`
  - `/terms/`, `/privacy/`, `/disclaimer/`
  - `/insights/<id>` (saved reports), the advertiser pages, `/admin/*`

**Code**
- **Server:** `server.ts` (29 route registrations) plus 37 modules in `src/server/`.
- **Existing gates:**
  - `assert-article-quality`, `assert-canonical-urls`, `assert-keyword-provenance`
  - `assert-walkthrough-checks`, `assert-yes-but-guide`, `assert-research-missions`
  - `validate-permit-records`, `check-state-license-set`
  - `.claude/skills/article-faqs/scripts/content-audit.ts`
- **Measurement scripts:**
  - `gsc-page-coverage`, `gsc-url-inspection-sweep`, `pull-gsc-queries`, `pull-bing-queries`
  - `cta-click-report`, `backlink-watch`, `keyword-opportunities`

## Phases

Each phase appends to `docs/audits/2026-11-site-audit/progress.md`, recording what ran, where the evidence is, and what's next. This lets the audit resume exactly where it stopped, even after the conversation is summarized.

### Phase 0 — Baseline
- Record the git SHA on `main`, the live deploy SHA, the date (`date -u`), the `/api/health` output and the sitemap URL list.
- Pull every published article row (id, slug, title, meta, quick_answer, updated_at, faq count) read-only. Save it to `evidence/articles.json`.
- **Output:** `inventory.md` matches every URL across the sitemap, the DB and the live site. Each URL found in one source but missing from another is a finding.

### Phase 1 — Existing gates
- Run every existing gate, plus `npx tsc --noEmit -p .` and a full local build.
- Run `content-audit.ts` with no ids, to cover the whole corpus.
- Save each output. A gate that fails is a finding, with its output quoted.
- A gate that can't run is logged as "not verified" with the error, for example a Neon DNS blip after 3 retries.

### Phase 2 — Live technical crawl (every URL from Phase 0)
Use a read-only script in the scratchpad: plain HTTPS GETs with a generic user agent, about 1 request per second. For each URL, check:
- the status code and redirect chain, the trailing slash, and that the canonical equals itself;
- `robots` meta and `noindex` where it shouldn't be;
- title length (≤60) and meta length (70–155);
- exactly one `<h1>`, and that it matches the title column (owner rule: title = H1);
- the `lang` attribute, `en-US`;
- JSON-LD, parsed rather than grepped: Article, FAQPage and BreadcrumbList are present, and the FAQ count equals the DB count;
- internal links that 404, guides no page links to, and links to unpublished slugs;
- every page in the sitemap returns 200 and is indexable, and every indexable page is in the sitemap.

Also fetch `robots.txt`, `llms.txt` if present, and the sitemap index.

### Phase 3 — Search visibility (first-party data)
- `gsc-page-coverage.ts 28` and `90`. Its stdout prints only the top 15 pages, so read its saved JSON, never sum the stdout.
- `gsc-url-inspection-sweep.ts`, which covers every never-shown guide. Run `pull-bing-queries.ts` for Bing.
- **Output per page:** shown or not, impressions, clicks, position, index state, and the page's age.
- Pages under 5 weeks old are listed as "too young to judge", never as problems. This applies the owner's "never judge young pages" rule.
- Read the dated experiments in `MEMORY.md` whose read date has passed. List them as "due for a read". The audit does not do the reads.

### Phase 4 — Content truth (the core of "no hallucination")
For every published guide and research page:
1. **Facts against ledgers.**
   - Every number, statute or code citation, and named portal in the body is matched against that page's `data/fact-ledgers/<slug>.json`.
   - Numbers missing from the ledger go on a "claims without a ledger quote" list. They are unverified, not wrong.
   - Pages with no ledger at all are listed separately.
2. **Spot verification at the source.**
   - For the 20 highest-impression pages (from Phase 3), open each cited primary source in the browser and confirm the quote still says that.
   - Any page whose ledger `readOn` date is more than 180 days old is checked the same way.
3. **Owner content rules**, each checked by a script or by reading:
   - no insurer named beside an underwriting verb;
   - a quick answer only on question titles;
   - no "Why this page" or other internal SEO notes on public pages;
   - report copy never implies findings about a specific house;
   - "Sponsored" appears on paid cards;
   - the only email address is hello@beforeregret.com;
   - no invented "we verified" claims;
   - none of the AI phrases the article gate rejects.
4. **External links:** 404, 5xx and timeouts only. 401 and 403 are not reported, because bot-protected `.gov` sites block scripts.
5. **Freshness:**
   - permit records past their re-check date (`effectiveStatus`);
   - Permit Pulse older than one month;
   - county guides whose `checkedOn` is more than 90 days old;
   - hurricane and seasonal guides whose time-bound wording has passed.

### Phase 5 — Product flows (browser; local no-DB build for anything that builds a report)
Test each flow on a phone-size screen (375×812) and on desktop. For each flow, record:
- console errors and failed network requests;
- every visible claim that can't be traced to data;
- one screenshot per screen.

The flows:
- **Homepage:** address search, then the two buttons, then the pop-up, then a quick report (local only).
- **Research tool:**
  - all three buying stages;
  - a researched county (Tampa, Dallas, Austin) and an unresearched one;
  - skip paths, Back and the summary, the report, and a reload mid-flow.
- **Inspection decoder:** search, and paste a paragraph. Confirm in the network log that nothing is sent, as the page promises.
- **Sunlight, walkthrough, the research studies, guides:** the FAQ accordion, the sponsored card, the related guides.
- **Advertise:** pricing pages and the pay-first checkout, up to the PayPal handoff only. Confirm `/pros` redirects.
- **Promises checked against behaviour:**
  - "Your answers stay on this device": the network log must show no answers sent.
  - "No sign-up": no login wall anywhere on the public path.
  - The funnel beacons carry only the event name and page.

### Phase 6 — Address gate and report correctness
- Sweep the server for any other rule that classifies a property by words in its address. Known lead: `resolvePropertyMetadata`'s `isMultiFamilyOrApartment` still matches street words such as "tower", "commons", "enclave", " ste" and "#". This is a lead, not yet confirmed as a visible bug.
- Run the gate on a set of public buildings chosen for risky street words: Trail, Park, Tower, Commons, Commercial, Industrial, Lake. Run it locally. Each case records the expected and the actual result.
- Check that the report engine's rules match what the tool shows:
  - every `PRIORITY_RULES` cost and lifespan has a source, or is listed as untraced (known: the tool hides costs for this reason);
  - `localizeContractDeadline` is applied everywhere "option period" can appear outside Texas.

### Phase 7 — Security and operations (read-only)
**Access and limits**
- Every `/api/admin/*` and write endpoint rejects a request with no credentials. Check this with a plain unauthenticated GET or POST, without the body that would cause a write.
- The rate limits on report generation and the address lookup are in place.

**Secrets**
- No secrets in client bundles: grep `dist/assets` for key patterns and for env names.
- `.env*` is not tracked by git.

**Dependencies and deploys**
- `npm audit --omit=dev`, report only, no `fix`.
- Vercel: no hourly cron (a memory note says one silently kills deploys).
- `vercel.json` is unchanged (the TTFB note).
- `/api/health` is OK.
- Error responses don't leak stack traces.

### Phase 8 — Speed and accessibility
**Speed**
- On the live site, measure TTFB (5 runs per page type, cold and warm) for: home, a guide, a research study, the tool.
- Read LCP and CLS from the browser Performance API.
- Record bundle sizes from the build output.
- Compare against the measured baseline in memory (2026-09-17). A change counts as a regression only if it's outside the earlier range.

**Accessibility**
- Every input has a label, buttons have names, and headings are in order (from `read_page`).
- Contrast is computed for the main text and button colours.
- Everything works with the keyboard alone in the tool and the pop-up.
- No external accessibility scanner is downloaded.

### Phase 9 — Measurement integrity
- `cta-click-report.ts`: every CTA id in code fires, and every id in the data exists in code.
- Look for test traffic in production counts, such as localhost referrers or the dates of the walk-throughs.
- The funnel events `research_details_done`, `research_first_solved` and `research_report_done` appear once per house.

### Phase 10 — Verification pass
Re-check every finding by a second route (rule 2). Each finding ends as **CONFIRMED**, **PLAUSIBLE** (reproduced once, the second route was inconclusive) or **DROPPED** (logged, with the reason).

### Phase 11 — Report
`docs/audits/2026-11-site-audit/report.md`:
1. **Summary:** counts by severity, plus the 10 most important confirmed findings in plain English.
2. **Findings**, with these severities:
   - **Critical:** wrong facts shown to buyers, broken core flow, legal or privacy promise broken, security.
   - **High:** pages not indexable, broken report sections, false refusals.
   - **Medium:** SEO hygiene, stale data.
   - **Low:** polish.

   Each finding states: evidence, a fix proposal (an exact diff or steps), the risk of the fix (ranking pages flagged), and effort.
3. **Not verified:** everything that couldn't be checked, with the reason.
4. **Leads not confirmed.**
5. **Due experiment reads.**

`findings.json` holds the same findings in machine-readable form, for "resolve it" batches. Fixes are grouped into batches the owner can approve one at a time.

## Order and stopping

**Order:** phases run in the order 0 → 11.

**Pausing and resuming**
- A blocked step, such as a dead API key or an expired GSC token, is logged as "not verified". The audit then moves on; it does not stop.
- The audit stops early only for a Critical security finding (for example, an exposed secret). In that case it reports immediately, with no fix attempted.

**When it's finished**
- The run ends when `report.md` is written and every finding is CONFIRMED, PLAUSIBLE or DROPPED.
- The final chat message gives the summary, the path to the report and the proposed fix batches. It does not apply anything.
