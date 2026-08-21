# Data Map

**What this is.** Every piece of personal data BeforeRegret holds, where it lives, who else
touches it, how long it stays, and how it gets deleted. Built 2026-08-21 by reading the live
database schema and the code paths that write to it — not by reading the Privacy Policy and
assuming it was accurate. Three discrepancies were found that way; they are recorded at the
bottom rather than quietly fixed, because the point of this document is to be checkable.

**Why it exists.** Three obligations depend on it. You cannot honour a deletion or access request
without knowing what you hold. You cannot answer "what was in the breach" without knowing what
each table contains. And the Privacy Policy's promises are only true if something enforces them —
this is the document that says which ones are enforced, by what code.

**Keeping it true.** Adding a column that holds personal data means adding a row here and, if it
needs one, a retention period with code behind it. A retention promise in the Privacy Policy with
no purge function is worse than no promise: it is a written statement of a practice that does not
exist. See `purgeExpiredReportRequestRecords` and `purgeExpiredIpRateLimitRecords` in
`src/server/db.ts` for the two that are enforced today, both on the daily cron in
`src/server/countyEventsApi.ts`.

---

## 1. Tables holding personal data

Row counts are approximate (from `pg_stat_user_tables`) and were current on 2026-08-21.

### `generated_reports` — report request records

| | |
|---|---|
| **What** | `formatted_address`, `city`, `state`, `zip_code`, `county`, `declared_property_type`, `declared_year_built`, `declared_unit_number`, `attested_accurate`, `clerk_user_id`, `ip_address`, `user_agent`, `is_paid`, `price_usd` |
| **Why** | Evidence of what was actually submitted if a report is later disputed (Terms §3.5, §3.6), and abuse investigation for the free-report allowance |
| **Where** | Neon Postgres (`us-east-2`) |
| **Retention** | **3 years** from request date |
| **Enforced by** | `purgeExpiredReportRequestRecords()` — `src/server/db.ts`, daily cron |
| **Disclosed** | Privacy Policy §7, "Report request records" |
| **Sensitivity** | **Highest on the site.** A specific street address tied to an IP, a user-agent and an account id is neither aggregated nor anonymous |

### `terms_acceptances` — clickwrap evidence

| | |
|---|---|
| **What** | `clerk_user_id`, `user_email`, `terms_version`, `context`, `ip_address`, `user_agent`, `accepted_at` |
| **Why** | Proof of which Terms revision a user agreed to, and when |
| **Retention** | For as long as the agreement could give rise to a claim — deliberately not a fixed period |
| **Enforced by** | Nothing automatic, by design. Deleting it would destroy the evidence it exists to create |
| **Disclosed** | Privacy Policy §7, "Terms acceptance records", plus the deletion carve-out |

### `arbitration_opt_outs` — opt-out ledger

| | |
|---|---|
| **What** | `user_email`, `clerk_user_id`, `terms_version`, `received_at`, `recorded_by`, `raw_message`, `notes` |
| **Why** | So a user's arbitration opt-out can be proven later by either side |
| **Retention** | Same basis as the acceptance record above |
| **Disclosed** | Privacy Policy §7, "Arbitration opt-out records" |
| **Note** | `raw_message` stores a copy of the user's own email. Whatever they wrote is in there — treat as free text that may contain anything |

### `transactions` — payment records

| | |
|---|---|
| **What** | `user_id`, `user_email`, `payer_name`, `property_address`, `paypal_order_id`, `paypal_capture_id`, `amount`, `currency`, `status`, `error_message` |
| **Why** | Order and refund history; tax and accounting records |
| **Retention** | Tax/accounting retention period |
| **Disclosed** | Privacy Policy §7 (vendor receipts) and the §7 deletion carve-out for payment records |
| **Never stored** | Card numbers, CVV, bank credentials. PayPal handles those entirely — we receive only identifiers and a success confirmation |

### `report_generation_ip_daily_cap` — free-report rate limit

| | |
|---|---|
| **What** | `ip_address`, `usage_date`, `call_count` |
| **Why** | Enforces the per-IP daily cap on Gemini report generation (real-money spend control) |
| **Retention** | **30 days** |
| **Enforced by** | `purgeExpiredIpRateLimitRecords()` — `src/server/db.ts`, daily cron |
| **Disclosed** | Privacy Policy §7, "Free-report limit records" |
| **Note** | Only ever read for `CURRENT_DATE`. The 30-day window exceeds the mechanism's need on purpose, to keep repeat-abuse patterns visible; see the comment on the constant |

### `guide_ad_orders` / `zip_ad_orders` — advertiser orders

| | |
|---|---|
| **What** | `business_name`, `contact_email`, `phone`, `website`, `licence_number`, `trade_category`, `clerk_user_id`, `terms_version`, `terms_accepted_at`, PayPal ids, amounts |
| **Why** | Fulfilling and renewing a paid placement; proof of the advertiser's Terms acceptance |
| **Retention** | Active placement plus tax retention |
| **Disclosed** | Privacy Policy §7, first paragraph |
| **Note** | Business contact data, but a sole trader's business phone and email are also personal data — treat them as such |

### `guide_ad_purchases` / `zip_ad_purchases` — live placements

| | |
|---|---|
| **What** | `business_name`, `phone`, `website`, `licence_number`, `trade_category`, `paid_through`, `active` |
| **Published** | **Publicly.** These fields render on guide pages and reports |
| **Disclosed** | Privacy Policy §5, "Vendor Business Information" |

---

## 2. Tables with no personal data

Recorded so a future reader does not have to re-derive it.

| Table | Contents |
|---|---|
| `articles` | Editorial content |
| `county_data` | Census/FEMA/NOAA county aggregates |
| `fema_declaration_events` | Public FEMA declaration records |
| `serp_research_briefs` | Competitive research on public search results |
| `gemini_usage_log` | Token counts and cost — no prompt content, no user identifier |
| `question_queue` | Admin-pasted article topic ideas. Admin-only route |
| `report_generation_daily_cap` | A date and a global counter |
| `ai_crawler_visits` | Bot user-agent and path. Writes **only** when the UA matches a known AI-crawler signature (`src/utils/detectAiCrawler.ts`) and stores **no IP**, so no human visitor can appear in it |

---

## 3. Processors — who else touches the data

| Processor | Receives | Notes |
|---|---|---|
| **Neon** | Everything in §1 | Database host, `us-east-2` |
| **Vercel** | Request logs (IP, user-agent), all served content | Application host; Edge Middleware runs the AI-crawler logger |
| **Clerk** | Email, name, profile photo, user id | Identity provider; holds the account record itself |
| **PayPal** | Payment details, payer name and email | We never see card data |
| **Google (Gemini API)** | **The searched address**, plus city/state/ZIP/county | Sent to write the report narrative. **No** user name, email, account id or IP is sent |
| **US Census Bureau geocoder** | **The searched address** | Validates the address is real and locatable before a report is generated. Nothing identifying the user is sent |

The last two are the ones most likely to surprise a reader, which is exactly why Privacy Policy §5
now names them explicitly.

Other `.gov` endpoints (EPA, USGS, NOAA, FEMA, city permit portals) are queried for **county- and
area-level** reference data only. No user data is sent to them.

---

## 4. Access control

| Surface | Control |
|---|---|
| Admin routes (`/api/admin/*`) | `requireAdmin` — `src/server/adminAuth.ts` |
| User-facing account data | Clerk JWT; `/api/my-ads` scopes every query to the caller's `clerk_user_id` |
| Database | Connection string in Vercel env vars; not committed. Neon enforces TLS |
| Report generation | Fails **closed** if the DB is unavailable (`reportGenerationLimiter.ts`) |

---

## 5. Deletion

**User request:** email `hello@beforeregret.com`; fulfilled within 14 business days (Privacy Policy §7).

**Carve-out, stated in the policy:** Terms acceptance records, report request records, and payment
records may be retained after other data is deleted, where needed to establish, exercise or defend
a legal claim, or to meet a tax or accounting obligation.

**Automatic:** the two purges named above, both on the daily cron.

> **Gap worth naming.** Fulfilling a deletion request today is a manual database operation. There
> is no scripted "delete everything for this user" path, so the work depends on someone
> remembering every table in §1. That is workable at current volume and will not stay workable.
> The tables to touch are: `generated_reports`, `terms_acceptances`, `arbitration_opt_outs`,
> `transactions`, `guide_ad_orders`, `zip_ad_orders`, and the two `*_purchases` tables — subject
> to the carve-out above.

---

## 6. What this exercise found

Three discrepancies between the Privacy Policy and the code. All three are fixed; they are kept
here because a data map that records only good news is not evidence of anything.

**1 — Visitor IPs were retained indefinitely, undisclosed.**
`report_generation_ip_daily_cap` stores raw IP addresses and had no purge, no retention period and
no paragraph in the Privacy Policy. The table is only ever read for `CURRENT_DATE`, so every older
row was personal data kept for no operating purpose. Nobody decided this; it was the default that
resulted from nobody deciding. *Fixed:* 30-day retention, enforced on the daily cron and stated in
§7.

**2 — No service providers were disclosed.**
§5 had no sub-processor paragraph at all, while asserting that consumer search queries are "NEVER
sold, rented, monetized, or shared" with advertisers, brokers or commercial vendors. That sentence
is true as written and scoped correctly — but a reader lands on it and concludes the address they
typed goes nowhere, when in fact it is sent to Google's Gemini API and the US Census geocoder.
Neither is a sale and neither is advertising, so nothing was false; it was incomplete in precisely
the direction a reader cares about. *Fixed:* §5 now names every processor and says plainly which
ones receive the address.

**3 — The policy claimed analytics that do not exist.**
§6 described "privacy-preserving analytics scripts" that "analyze page performance across zip
codes." There is no analytics script on this site — none — and no per-ZIP performance analysis to
describe. This error ran in the unusual direction of claiming *more* collection than happens,
which is not the dangerous direction, but it is still an inaccurate description of our own
practices in the document a regulator reads first. *Fixed:* §6 now states there is no tracking, and
names the two things that do happen (a Clerk sign-in cookie, and ordinary server logs).

The pattern across all three: none was a lie. Each was a place where the document had drifted from
the code, in the direction of whatever was easiest to leave unwritten. That is the normal failure
mode for a privacy policy, and re-running this exercise is the only thing that catches it.
