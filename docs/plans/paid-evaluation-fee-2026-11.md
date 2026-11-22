# Optional paid evaluation fee on Report Ads (scope, 2026-11-22)

Status: **BUILT 2026-11-22, not published** (options 1, 2, 5, 6, 7; owner: "build 1,2,5,6 and 7"). The four decisions below were not answered, so the build follows the recommendations: no $0, the "credited" box is offered, extras are changed outside the one-edit rule and logged, and the price stays $29.
Code: `src/data/vendorCardExtras.ts` (lists, wording, validation), `src/components/CardExtrasFields.tsx`, `src/components/ZipExtrasEditor.tsx`, `POST /api/my-ads/zip-order/:orderId/extras` in `src/server/myAdsApi.ts`, and columns `zip_ad_purchases.card_extras_json` / `card_extras_updated_at` plus table `zip_ad_card_extras_log` in `src/server/db.ts`.
**Terms:** clause 4.6 added 2026-11-22 (owner OK). Owner asked 2026-11-22: "scope the paid evaluation fee idea (but it should be optional)".
Source of the idea: the owner's "Inside the Truck" research (Desktop docx). Contractors resent free estimates for buyers who don't own the house yet; the quote becomes the buyer's bargaining chip for a seller credit.

## What it is

A business that buys a Report Ad may, **if it wants to**, add the price of its pre-closing evaluation. The card then shows one extra line under the business name:

> **Sponsored** · Local electrician
> **Smith Electric**
> Pre-closing evaluation: $195, credited toward the repair if you hire them
> License #12345 · [phone] · [Website]

The line sits directly under our own report text, which already tells the buyer what that check usually costs, e.g. "Dedicated electrician evaluation $150 – $350" from `costToCheck` in `src/engine/inspectionPriorities.ts`.

Leave the fields empty and the card looks exactly as it does today. **Nothing changes for a business that skips it.**

## Why it helps each side

- **The business:** buyers know before they call that this visit is paid. That screens out "free quote" callers.
- **The buyer:** a price up front instead of a surprise. It sits next to our range, so they can see whether it's typical.
- **Us:** it's the one feature lead sellers don't offer, and it makes our pitch concrete. "Your eval price shows next to the check" is better than "your name shows next to the check".

## Fields (structured, never free text)

| Field | Type | Rule |
|---|---|---|
| `eval_fee_usd` | whole dollars, optional | 25 to 2,000. Empty = line not shown. **$0 not allowed** (see "Decisions" 1) |
| `eval_fee_credited` | yes/no, optional | Only offered when a fee is entered. Adds "credited toward the repair if you hire them" |

**Why structured:** in 2026 we removed the free-text `tagline` field. Vendors filled it with licence and credential claims we then published as our own content (see the NOTE ON `tagline` in `src/server/db.ts`). A number plus a checkbox can't carry that kind of claim. The wording is ours and fixed.

## Which ads get it

- **Report Ads only**, for trades whose report item is a paid check: Electrician, Plumber, Sewer Scope, Foundation Repair, Roof Inspection, HVAC Inspection, Radon Testing, Chimney Sweep, Pest/Termite Control, Asbestos/Mold Abatement, Stucco & EIFS, Home Inspector, Well & Septic Services.
- **Not** the fixed-box trades (Moving Company, Real Estate Agent, Interior Designer), which have no evaluation to price.
- **Not** Topic Ads in v1. They are national, and a single price shown to readers in every state means little.

## Where it's set

- **My Placements → ad details** (`AdDetailsForm.tsx`), the same screen where details are completed after the pay-first checkout. Two optional inputs under the license number.
- **Changing it later** does NOT use up the one contact edit (`contact_edited` in `myAdsApi.ts`). The one-edit rule exists to stop a placement turning into a different business. A price change doesn't do that. Each change is stored with a timestamp, so we can see what a buyer was shown and when.

## Build list (about one day)

1. `src/server/db.ts`: add `eval_fee_usd INTEGER`, `eval_fee_credited BOOLEAN` and `eval_fee_updated_at TIMESTAMPTZ` to `zip_ad_orders` and `zip_ad_purchases`, using `ADD COLUMN IF NOT EXISTS` like `licence_number`.
2. `src/types.ts`: add `evalFeeUsd?: number` and `evalFeeCredited?: boolean` to `SponsoredVendor`.
3. `src/server/zipAdsApi.ts` `fetchActiveZipVendors`: map the two columns.
4. `src/server/myAdsApi.ts`: validate (integer 25 to 2,000 or empty; credited only with a fee) on the details/edit route, outside the one-edit counter.
5. `src/components/AdDetailsForm.tsx`: two optional inputs, with help text: "Shown to buyers next to the [check]. Leave empty to show no price."
6. `src/components/SponsoredVendorCard.tsx`: one line under the business name when the fee is set. It must fit on one phone line and print.
7. `src/components/AdvertiseCompare.tsx`: add the line to the example Report Ad card, plus one sentence: "Optional: show the price of your pre-closing evaluation."
8. Terms (`TermsConditions.tsx`): one clause. The advertiser sets the price and must honour it for the buyer while the ad runs. We don't verify it or take part in the transaction. **Owner and counsel to confirm the wording.**
9. Update the sample report and the outreach line. Batch 7 promised samples, so a sample with a fee shown is the best demo.

## What it can't do (be honest in pitches)

- We can't enforce the price or the credit. It's the advertiser's offer, like their phone number.
- We can't promise calls. Volume is still about 4 to 5 real reports a week nationally.
- There is no booking or payment through us. The research's "Paid Pre-Closing Evaluation Booking Pass" (taking the buyer's money, deadlines) is out of scope. It would make us a party to the transaction.

## Decisions for the owner

1. **Allow $0?** Recommend **no**. The point is a paid evaluation, and a $0 line reads as "free estimate", which is what these owners are trying to escape.
2. **Offer "credited toward the repair"?** Recommend **yes**. It's the most common way trades soften the fee.
3. **Price edits outside the one-edit rule?** Recommend **yes, logged**.
4. **Price of the ad:** no change. It stays $29 for 30 days and 3 ZIP codes. The fee line is included.

## How we'll know it worked

At current volume a click comparison won't be meaningful for months. The early signal is in the sales conversation:
- Do businesses fill it in when they buy?
- Does mentioning it get more "yes" replies to outreach?

Read after the first 5 Report Ad sales.

---

## More options to consider (ideas, 2026-11-22, NOT decided)

The owner asked for more niche customisation options a trade owner would love, usable as email hooks. Every option below follows the same rules as the fee:
- a fixed list, a number or a switch, never free text;
- it's the business's own statement about its own service, never a credential we'd appear to vouch for.

Pain points come from the "Inside the Truck" research.

| # | Option | Pain it solves | Shape | Effort |
|---|---|---|---|---|
| A | Paid evaluation price (above) | Buyers wanting a free quote to use as a bargaining chip | number + checkbox | ~1 day |
| B | "Does this exact job" ticks, matched to the report item | Being shown for "electrician" when they specialise | checkboxes from our list, one set per report item | ~1 day |
| C | Pause when booked solid, days added back | Paying for an ad while the crew can't take work | button in My Placements | ~1 day |
| D | "Has openings this week" switch, turns itself off after 7 days | Slow shoulder months (HVAC Mar–Apr, Sep–Oct) | on/off + auto-expiry | ~half day |
| E | Usual wait for a pre-closing visit | "Can you come tomorrow, our option period ends Friday" calls | dropdown: 1–2 days / this week / 1–2 weeks | ~half day |
| F | When someone answers + "texts OK" | Missed calls on the tools; voicemail tag | dropdown + checkbox | ~half day |
| G | Languages spoken | Buyers who'd rather talk in Spanish (LA, TX, FL) | checkboxes | ~2 hours |

Option B ticks per report item:
- **knob_and_tube:** "Knob-and-tube evaluations"; "Insurance letter for the electrical system".
- **electrical_panel_brand:** "Panel replacements"; "Insurance letter for the panel".
- **electrical_aluminum_wiring:** "COPALUM / AlumiConn repairs".
- **sewer_cast_iron:** "Camera inspection with the video file for the buyer"; "Locates and depth"; "Lining / trenchless repair".
- **polybutylene_supply / galvanized_supply:** "Whole-house repipes".
- **foundation_\*:** "Written evaluation for the buyer"; "Pier and beam"; "Slab".
- **roof_age:** "Roof condition letter for insurance".
- **radon_test:** "Continuous monitor (48-hour)"; "Mitigation systems".
- **termite_wdi_inspection:** "WDI report for the lender".

Each tick prints only beside the report item it belongs to.

**Left out on purpose:**
- "Licensed since", "family owned", "independent", "insured", "background-checked" and badges. These are credential claims we can't check, the same problem as the retired `tagline`.
- Logo or photo uploads: image moderation.
- Reviews and star ratings.
- Call-tracking numbers: cost, and they hide the business's own number.
- Booking or taking payment: it would make us a party to the transaction.

---

## Terms clause (owner approved 2026-11-22; added as 4.6, TERMS_VERSION 2026-11-22, unpublished)

> **Prices and services you show.** If your Report Ad shows a price for a visit, the jobs you do, how soon you can come out, when you answer, or the languages you speak, you choose them and they must be true. You must honor any price you show to a buyer who contacts you while your ad is running. We print these as you set them, do not check them, and are not part of any agreement between you and a buyer. We may remove an ad whose shown price or services are not honored, without a refund.

Adding it means bumping `TERMS_VERSION` in `src/data/legalVersions.ts`, as every Terms change does.

---

## 2026-11-22 additions (owner: "both, and fix 4.2 and 4.4. and publish")

- **Wider job lists:** 81 jobs across 13 trades (5 to 8 each), still services only.
- **"Suggest a service":** in My Placements → Add/Change extras. Up to 3 at a time, 3–60 characters each, no links, emails or phone numbers, and at most 10 unread per order. Suggestions are stored in `vendor_service_suggestions` and **never printed on an ad**. To review them:
  - read: `NODE_OPTIONS="--import=./scripts/lib/neon-curl.ts" npx tsx scripts/service-suggestions.ts`
  - for a real service: add it to `JOB_OPTIONS`, publish, then `APPLY=true … --mark <id> added`
  - for a claim (licensed, #1, certified, a price): `--mark <id> declined`
- **Terms (same TERMS_VERSION 2026-11-22):**
  - 4.2 now says one active vendor per trade per ZIP;
  - 4.4 points to the Sponsored label and the report's notice instead of a per-card "unverified" line (removed 2026-11-14);
  - the Report Ads FAQ was corrected the same way.

---

## 2026-11-22, later: cut back to three extras (owner)

Owner: "remove all the services options and Jobs you do. keep only Price of the pre-closing visit … with I credit it toward the work if they hire me checkbox. keep When someone answers the phone with customisable options, with Buyers can text this number checkbox."

**Removed:** the jobs lists, "Suggest a service" (route, script and table creation), the visit wait and languages. No business had used any of them.

**Kept:**
- the visit price, plus the "credited" checkbox;
- phone hours, now customisable: the business ticks days (Mon–Sun) and picks a from/to time, every half hour from 5 AM to 11 PM. The card prints e.g. "Answers Mon–Fri, 7 AM–6 PM";
- texts OK.

**Terms:** 4.6 narrowed to match, `TERMS_VERSION` 2026-11-22.2.

**Leftovers:**
- The `vendor_service_suggestions` table was already created on the live DB by the earlier deploy. It's empty and nothing reads or writes it now; it can be dropped by hand.
- Earlier sections of this doc describe the removed options as history.

---

## 2026-11-22, later still: per-trade price labels + license before payment (owner: "build it and publish")

- **Price labels:** the card no longer says "Pre-closing visit". Each trade has a fixed label (`EVAL_FEE_LABELS`), e.g. "Electrical evaluation: $195", "Radon test: $150", "Home inspection from $350".
- **"My price depends on the house":** prints "from $X", meaning $X is the lowest price they charge.
- **Home inspectors:** no "credited toward the work" option.
- **Terms:** 4.6 updated to match, `TERMS_VERSION` 2026-11-22.3.
- **License before payment on Report Ads** (owner): the /report-ads/ checkout asks for the license number before PayPal for trades that need one, and the server refuses a quick checkout without it. It's stored on the order and pre-filled on the details form. Topic Ads still ask for it after payment (open question to the owner).

## 2026-11-22 -- Topic Ads: business type + license before payment (built, not yet published)

Owner: "yes, do the same for topic ads". Same reason as the Report Ads change: a business with no
license number must find out before paying, not after.

- /topic-ads/ (GuideAdsCheckout.tsx): the trade dropdown is now "Your business type (required)" (it
  still sorts the article list). For trades where requiresLicenceNumber() is true a "Your license
  number" field appears under it. Buy now stays disabled until both are filled; the buy bar says what
  is missing. Both survive the sign-in round trip (stash).
- Server (guideAdsApi.readQuickBuyer): the quick checkout refuses an order with no valid trade, or
  with no license (3-60 chars) for a licensed trade. Both checkout inserts already stored the trade
  and license, and capture already copies them to guide_ad_purchases.
- After payment (myAdsApi /api/my-ads/details): a Topic Ad order that already has a trade is locked
  to it; only older orders bought without one pick it on the form. MyAdsPanel passes fixedTrade and
  the license as the prefill.
- Copy: Topic Ads FAQ, two AdvertiseCompare answers, Terms 4.1 (trade + license at checkout, both
  products). TERMS_VERSION 2026-11-22.4.
- Checked in the no-database preview: Electrician shows the license field, Chimney Sweep hides it.
  tsc clean, full build exit 0.

## 2026-11-22 -- /topic-ads/: relevant articles after picking a business type (LIVE a52e8d4)

Owner: "the list of articles disappear after selecting business type ... if there are no relevant
articles, choose the next best options." Cause: the sort used guessTradeCategoryFromTitle(), which
gives each title ONE trade, so most trades matched 0-2 articles and the rest were folded away.

New src/data/guideAdRelevance.ts: per-trade keywords (many-to-many, a sewer guide fits Sewer Scope
AND Plumber) plus a closest-first RELATED_TRADES list ('Home Inspector', the broad catch-all, last).
The checkout shows "Best for X", then "Also a good fit for X" (or "Closest matches for X" with a
one-line note when nothing names the trade), both open in one scroll box; the rest stay behind
"Show N other articles". Display order only; any business can still buy any open article.
Against the 148 open articles on 2026-11-22 every trade gets 17+ visible articles (e.g. Painter &
Flooring 1 best + 57 closest; Electrician 24 + 83). Checked in a local preview against the real
article list; tsc clean, build exit 0.

## 2026-11-22 -- Home inspector box on every report (built, not yet published)

Owner: "yes, build it", before an Instagram post selling one-inspector-per-ZIP. Before this, a Home
Inspector Report Ad sat only beside the pier_and_beam item (pre-1966 houses in 13 Texas counties), so
an inspector anywhere else would have paid and almost never been shown. Database checked first: no
Home Inspector order or purchase existed (the only Report Ad order was one unpaid Plumber order).

- Home Inspector joins FIXED_REPORT_SLOT_CATEGORIES; new PropertyReport.homeInspectorVendors, set in
  server.ts and kept by CLIENT_REPORT_FIELDS; rendered right after the inspection priorities.
- pier_and_beam no longer maps to a trade, so a report never shows the same inspector twice.
- offersEvaluation keeps the price for Home Inspector despite the fixed box ("Home inspection from
  $350"); still no "credited" option.
- Report Ads checkout shows "Where it shows:" for the chosen trade (reportAdPlacement()); the
  placement FAQs on /report-ads/ and /advertise/ now name the four fixed-box trades.
- Checked with a temporary sample vendor on a 1955 Austin report (removed before commit): one card,
  after "what to check", price + hours + texts + license. tsc clean, build exit 0.

Same session, owner: /advertise/ drops "Your license number prints on the listing...", the "Pay in a
minute, no sales call" heading and the trades paragraph; "Questions before you buy" is now
"Frequently asked questions". The how-it-works steps were corrected (license before paying).
