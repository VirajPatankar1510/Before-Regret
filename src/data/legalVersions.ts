// Single source of truth for which revision of the Terms a vendor actually agreed to at checkout.
//
// Why this exists: Terms 4.4 has the vendor warrant that they hold valid state/local licenses and
// liability insurance for their trade. That warranty is only worth what it can be proven to be --
// and until this constant existed, nothing recorded that any vendor had ever affirmatively agreed
// to anything. The checkout checkbox was validated server-side and then discarded, which is a
// browsewrap posture: enforceable only if you can show the vendor had reasonable notice, with no
// record either way.
//
// Storing the version string alongside a timestamp on the order row turns that into clickwrap with
// a receipt: for any given order you can answer "which exact text did this vendor accept, and
// when". Bump this string in the SAME commit that changes the substance of TermsConditions.tsx,
// and update "Last Revised" there to match -- a version that silently lags the text it names is
// worse than no version at all, because it attests to the wrong document.
// 2026-08-17: added Section 7 (binding individual arbitration + class action waiver, FAA-governed,
// with a 30-day opt-out). A substantive change, hence a new version rather than an edit in place --
// anyone whose acceptance is on file against an earlier string did NOT agree to arbitration, and
// this constant is what makes that distinction provable per-user.
// 2026-08-18: narrowed 3.6 (it previously purported to bar chargebacks and correction requests,
// contradicting 3.4 two paragraphs above it, which expressly preserved them); added 3.7 (FCRA
// prohibited uses), 6.2 (liability that cannot lawfully be limited), 7.2A (a court, not the
// arbitrator, decides formation), 7.6(c) (public injunctive relief carve-out), and a General
// Provisions entire-agreement/precedence clause. Replaced the bare "modify at any time" clause
// with a prospective one that promises material changes will not apply retroactively -- a promise
// that is only keepable BECAUSE this constant is recorded per acceptance. Nearly every change is
// a narrowing in the user's favour, but 9's modification clause now binds the company, so it is a
// substantive revision either way and gets its own version string.
// 2026-08-18.2: reworked Section 7 after a clause-by-clause review of the arbitration and
// choice-of-law provisions. Renumbered it (the 7.2A stopgap was already compounding), and:
//   - 7.5  Atmostellar pays AAA fees for consumer claims <= $10k. A ~$225 consumer filing fee
//          against a $14.99 product is a deterrent rather than a forum, which is the
//          effective-vindication problem in its plainest form.
//   - 7.6  Atmostellar pays any award or judgment within 30 days without the user having to
//          enforce it. This is the important one. 8.4 says there is no US entity and no US
//          assets, so before this paragraph a consumer who WON had to enforce in India -- New
//          York Convention for an award, fresh suit under CPC s.13 for a US judgment, since the
//          US is not a s.44A reciprocating territory. Either costs multiples of the 6.1 cap. An
//          uncollectable remedy is the substantive half of unconscionability and would have put
//          the whole of Section 7 at risk.
//   - 7.7  reconciled against 7.8: a claim excluded under 7.8 no longer trips the
//          non-severability trigger. Those two paragraphs previously gave opposite answers for a
//          mixed claim seeking damages plus public injunctive relief -- a defect introduced by
//          the 2026-08-18 revision's own McGill carve-out.
//   - 7.4  the custom mass-arbitration protocol is gone, replaced by one sentence adopting the
//          AAA Mass Arbitration Supplementary Rules. See the deletion note in
//          TermsConditions.tsx for why it was net-negative at this site's size.
//   - 7.9  now states that opt-outs are recorded -- newly true, see arbitration_opt_outs in
//          src/server/db.ts. Do not weaken that sentence while the table exists, and do not drop
//          the table while the sentence does.
// Every change here either binds Atmostellar (7.5, 7.6) or widens a user's options (7.8), so
// nobody is disadvantaged by the new version -- but they are substantive promises and must be
// attributable to a revision, hence a distinct string rather than editing 2026-08-18 in place.
// 2026-10-05: consumer reports made free (owner decision). Rewrote 2 (services), 3.1 (reports are
// free, daily generation limits) and 3.4 (no report purchases; earlier purchases stay under the
// version in effect then). A substantive change to what a consumer is agreeing to, hence a new string.
// 2026-10-14: 4.4 names Interior Designer as a second license-exempt category beside Chimney Sweep
// (owner decision). It changes which vendors must supply a number, so it gets its own string.
// 2026-10-18: added 4.6 (free Find a Pro listings: who may list, what is published, never shown in
// reports, 4.4 warranties apply, removal at Atmostellar's discretion). New obligations for a new kind of
// vendor, hence a new string.
// 2026-11-15: removed 4.6 (free Find a Pro listings) with the feature itself (owner decision). No
// listing was ever live apart from the owner's own removed test, so nobody loses a right they relied on.
// 2026-11-15 (second revision that day): pay-first vendor checkout (owner decision after a vendor
// survey). 4.1 now says business details may be supplied after payment, that a placement shows and
// its 30 days start only once they are, and that an unclaimed hold lapses 30 days after payment; 4.4's
// license number is due "before the placement goes live" instead of "at checkout". Changes what a
// vendor agrees to, hence a new string.
// 2026-11-19: 3.6 no longer offers a report refund as a remedy for an inaccurate input (site audit F11). Reports have
// been free since 2026-10-05 and 3.4 already says there is no report purchase to refund, so the two paragraphs
// contradicted each other. Removes a remedy nobody could use; still a change to the text, hence a new string.
// 2026-11-19 (second revision that day): 4.1's Topic Ad price is $9.99 per slot, up from $7.99 (owner
// decision). The price a vendor agrees to pay is substance, hence a new string.
// 2026-11-22: added 4.6 (optional Report Ad extras: visit price, jobs, visit wait, phone window, texts,
// languages; the vendor must honor any price it shows; we don't check them; owner decision). A new
// obligation for vendors, hence a new string.
// Same revision: 4.2 now says one active vendor per trade per ZIP (the cap has been 1 since 2026-11-01;
// the text still said two), and 4.4 no longer says every ad carries an "unverified" line on its face
// (removed from the card 2026-11-14); it now points to the Sponsored label and the report's own notice.
// 2026-11-22 (second revision that day): 4.6 narrowed to what a Report Ad can still show after the
// owner removed jobs, visit wait and languages: the visit price (+ credited), phone days and hours,
// and texts OK. Changes what a vendor warrants, hence a new string.
export const TERMS_VERSION = '2026-11-22.2';
