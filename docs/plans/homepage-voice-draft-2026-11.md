# Homepage in the new voice: draft for owner approval (2026-11-18, revision 2)

Follows `docs/brand/voice-guide.md` (Level 1: friendly and conversational). **Nothing here is live.** Copy only; no layout changes. Revision 2 folds in the owner's review of revision 1, with each factual line checked against the code on 2026-11-18.

## What stays word for word

| Element | Why it stays |
|---|---|
| H1: "Before Regret: Know what to check, ask and verify before you buy a home." | Owner's line (2026-10-10); the owner chose to keep it. |
| The paragraph under the H1 ("Before Regret is a free property research tool for US home buyers…") | It is the sentence AI answers quote for "what is Before Regret". |
| The homepage `<title>` and meta description | Set by the owner; a separate decision. |
| FAQ answers | They feed the FAQPage schema and are answer-engine text. |
| "What a listing won't tell you" cards (house cutaway) | Already in the voice. |

## Final copy

| Where | Now (live) | Proposed |
|---|---|---|
| Hero, under the search box, line 1 | Every report is free. | Every report is free. |
| Hero, under the search box, line 2 | No sign-up. No credit card. | No email. No account. Just the research you need before you buy. |
| Search button (sitewide address box) | Get My Free Report | Get the free report |
| How it works, eyebrow / heading | Three steps / How Before Regret Works | Three steps / Here's how it works |
| Step 1 | **Enter any US residential address.** Any single-family home, condo, townhouse, or multi-family parcel, across all 50 states. | **Type in the address.** A single-family home, or a condo or multifamily unit with its unit number. |
| Step 2 | **We validate and check what we can.** Your address is validated against the US Census geocoder, and we pull the live Census profile of its neighborhood. Everything else is era- and county-specific research, flagged for you to confirm at the source. | **We check what we can, and tell you what we couldn't.** We confirm the address with the U.S. Census geocoder and pull its neighborhood's Census profile. The rest is research based on the home's age and county. We'll flag what you should verify yourself using the original sources. |
| Step 3 | **Get Report.** Exactly what to verify in person and what to ask the seller — ready before your inspection deadline. | **Get your report.** What to look at in person and what to ask the seller, ready before your next showing, offer or inspection. |
| Independence note | **Independence statement.** Before Regret isn't here to criticize builders, agents, or sellers — we believe transparency leads to better conversations and more confident decisions. | **Good information makes everyone better prepared.** We're not here to knock builders, agents or sellers. We're here to help you ask better questions and make more informed decisions. |
| Pricing heading | Free for Home Buyers | Good research shouldn't cost you a fortune. |
| Pricing subline | No sign-up, no card, no subscription. Check every house you're considering. | Every report is free. No sign-up, no credit card, no subscription. Use it for every house you're considering. |
| Pricing card title | Free, no sign-up | $0. Every report, every house. |
| Closing section, eyebrow (new) | (none) | Don't buy a house blind. |
| Closing heading | Researching a home you're about to tour? | Touring a house this week? |
| Closing line | Run the address before your walkthrough — it takes 60 seconds and you'll know exactly what to look for. | Run the address before you go. You'll walk in knowing what to look at. |
| Closing button | Check an address | Check an address (unchanged) |

## Why each factual line reads the way it does (checked 2026-11-18)

- **Step 1.** The search form offers three property types: Single-Family Home, Condo / Multifamily (a unit number is required) and Other, which is refused (`src/components/AddressSearchBox.tsx`, `docs/ADDRESS_VALIDATION_GATE.md`). "Townhouse" is not a form option, so it is dropped. The geographic claim is dropped too: the gate accepts every state code (plus some territories), but addresses can still be refused when the Census geocoder can't match them or when they sit on federal or protected land. Coverage has never been tested state by state. Step 2 already tells people we'll say what we couldn't check.
- **Step 2.** True as written: Layer 1 of the address gate uses the Census geocoder, and `src/engine/neighborhoodContext.ts` pulls the Census profile.
- **Step 3.** "Before your inspection deadline" was dropped from the H1 on 2026-10-10 because it read as only for buyers already under contract (see the comment in `HeroPanel.tsx`). "Before your next showing, offer or inspection" covers every stage and is concrete. The FAQ says reports usually generate within a minute.
- **Line 2.** "No email. No account." is true for the report: the report flow has no email field. The contact form asks for an email only so we can reply.
- **Pricing subline.** "Every report" rather than "This report", which has no clear referent on the homepage.
- No "no catch" (we carry sponsored placements), no "60 seconds" (never timed), no competitor comparisons.

## How we'd measure

**Available today:**

| Metric | Source |
|---|---|
| Homepage report-button clicks (unique visitors per day) | `cta_clicks` via `scripts/cta-click-report.ts` |
| Homepage visits | Vercel Analytics (dashboard; prerendered pages never reach our server, so our own tables can't count views) |
| Reports generated per day | `generated_reports` (not tied to the page the visitor came from) |

**Not tracked today, needs a small code change if wanted:** clicks by device and by traffic source. `cta_clicks` stores only page, button, day and a visitor hash. Vercel Analytics shows devices and referrers for page views, but its numbers can't be joined to our click table. A device-class column (phone / tablet / desktop, no other data) would be a small, privacy-safe addition.

**Method:** 28 days before vs. 28 days after, with both windows written down. This copy changes several lines at once, so the read tells us whether the bundle worked, not which line did. Avoid launching it in the same weeks as the research tool or the Permit Records Finder, or the effects mix.
