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
export const TERMS_VERSION = '2026-08-18.2';
