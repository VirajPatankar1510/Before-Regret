// Google's Preferred Sources deeplink. Shared by Footer.tsx (the client app) and
// StaticFooterLinks.tsx (the prerendered pages), the same way legacyUrls.ts is shared between the
// 410 handler and its audit script: two renderings of one link must not be able to disagree about
// where it points.
//
// WHAT THIS IS. Preferred Sources lets a reader mark a site as one they want weighted more heavily
// in Google Search -- a "preferred" badge in Top Stories, and more prominence in AI Mode and AI
// Overviews. Google requires no markup, structured data, or feeds for eligibility, and this site is
// already eligible: verified 2026-08-27 by signing in to the tool, where beforeregret.com appears
// and can be selected.
//
// WHY A PLAIN LINK AND NOT GOOGLE'S BUTTON. Google offers a JavaScript widget that renders an
// official "add as preferred source" button. It is declined deliberately: it is a third-party
// script on every page, and GA4/GTM were removed from this site in August 2026 for exactly that
// weight (147.5 KiB transferred for pageviews and nothing else). A single <a href> costs nothing
// and does the same job.
//
// WHY THE DEEPLINK SPECIFICALLY IS WORTH HAVING. Not because the feature is a priority -- it is a
// loyalty amplifier and this site has almost no readers yet. It is here because it routes around a
// real defect found while checking eligibility: Google's own source-preferences tool CANNOT FIND
// THIS SITE BY NAME.
//
//     "beforeregret.com"                 -> found
//     "Before Regret"                    -> No results
//     "before regret property research"  -> No results
//
// Only the exact domain string resolves. So a reader who wanted to add this site, and typed the
// brand name the way a person naturally would, would be told it does not exist. This URL skips the
// broken name lookup entirely and lands them on a working, pre-filled result.
//
// That failure is the same one the brand SERP shows (beforeregret.com is not in the top 10 for
// "beforeregret") and it is NOT a markup bug -- the Organization JSON-LD in index.html already
// declares name "Before Regret", alternateName "BeforeRegret", and a sameAs pointing at a real,
// populated LinkedIn company page. Google simply has not accepted the name/domain association yet,
// which is an authority problem that more markup cannot fix. Do not "fix" it by editing the schema.
export const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=beforeregret.com';

/** Footer label. Phrased as what the reader gets, not as a request for a favour. */
export const PREFERRED_SOURCE_LABEL = 'Prefer us on Google';
