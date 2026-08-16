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
export const TERMS_VERSION = '2026-08-03';
