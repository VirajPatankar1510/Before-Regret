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
export const TERMS_VERSION = '2026-08-18';
