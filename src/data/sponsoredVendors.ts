// First come, first served: at most this many active sponsors per (ZIP, trade category) pair.
// Single source of truth -- Vendors.tsx, zipAdsApi.ts, and the checkout UI all reference this
// rather than hardcoding the number separately, so they can never quietly drift out of sync
// (the pre-existing landing page copy claimed "3 vendors per category" before this was wired up).
export const MAX_SLOTS_PER_ZIP_TRADE = 2;

// Shared between the checkout form's dropdown and the server-side validation on submission, so
// the two can't silently diverge (a category typed on one side but not recognized on the other).
//
// Deliberately excludes trades whose licensing carries real advertiser-side legal exposure beyond
// ordinary trade licensing: 'Insurance Agent' (selling/servicing insurance requires a state
// insurance license, actively enforced by state insurance departments), 'Real Estate Attorney'
// (unauthorized practice of law), and 'Foundation Engineer' (actual structural/foundation
// engineering is stamped work done by a state-licensed Professional Engineer -- a stricter
// regime than the contractor-tier trades below). This app never verifies any vendor's license for
// any category (self-serve, no license-number field anywhere in checkout) and makes no
// "verified"/"licensed"/"certified" claim about any listed business -- so the categories offered
// are deliberately limited to ordinary contractor/trade-tier licensing (same tier as Electrician,
// already listed), where that self-attestation model carries the least exposure. Foundation- and
// seismic-related findings/priorities that used to point at 'Foundation Engineer' now point at
// 'General Contractor' instead (seismic retrofit and foundation repair work is typically performed
// by a licensed contractor, not a stamping engineer) rather than being dropped outright.
export const TRADE_CATEGORIES = [
  'Roof Inspection',
  'HVAC Inspection',
  'Sewer Scope',
  'Radon Testing',
  'Electrician',
  'Home Inspector',
  'General Contractor',
  'Asbestos/Mold Abatement',
  'Pest/Termite Control',
  'Chimney Sweep',
  'Well & Septic Services',
  'Moving Company',
] as const;

// Matches a specific report finding's trade category, not just its ZIP. Report findings today
// are a small, fixed set (see validateAndFixReportContradictions in server.ts) -- this maps each
// finding id to whichever paid trade category it's actually relevant to, so a report can carry a
// separate, contextual vendor match per finding instead of one generic slot for the whole report.
// f_code (municipal code enforcement) has no natural trade match and is deliberately omitted --
// not every finding needs an ad slot. f_flood is deliberately unmatched too, now that 'Insurance
// Agent' has been dropped from TRADE_CATEGORIES -- there's no lower-exposure substitute for an
// insurance product, so this finding goes without a matched category rather than mismatching it
// to an unrelated trade.
export const FINDING_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  f_roof: 'Roof Inspection',
  f_elec: 'Electrician',
  f_hvac: 'HVAC Inspection',
  f_seismic: 'General Contractor',
};

// Same pattern as FINDING_TRADE_CATEGORY, for the era-based inspection priority items (see
// engine/inspectionPriorities.ts). lead_paint_disclosure (a free, legally-required document
// check, not a paid trade service) is deliberately left unmatched. asbestos_materials now maps to
// 'Asbestos/Mold Abatement' -- left unmatched originally because that category didn't exist yet;
// it's a direct fit now that it does. chimney_level2 and termite_wdi_inspection are new rules
// (see inspectionPriorities.ts) written specifically to give Chimney Sweep and Pest/Termite
// Control a real report location -- both categories previously had no matching content anywhere.
export const PRIORITY_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  knob_and_tube: 'Electrician',
  electrical_aluminum_wiring: 'Electrician',
  electrical_panel_brand: 'Electrician',
  sewer_cast_iron: 'Sewer Scope',
  galvanized_supply: 'Home Inspector',
  polybutylene_supply: 'Home Inspector',
  foundation_pre_posttension: 'General Contractor',
  foundation_posttension: 'General Contractor',
  pier_and_beam: 'Home Inspector',
  eifs_stucco: 'Home Inspector',
  systems_age: 'Home Inspector',
  radon_test: 'Radon Testing',
  asbestos_materials: 'Asbestos/Mold Abatement',
  chimney_level2: 'Chimney Sweep',
  termite_wdi_inspection: 'Pest/Termite Control',
};

// Same pattern again, for the Seller Questions script (see engine/sellerQuestions.ts). Only
// septic_seller has a real trade match today -- the rest of that script's questions (permit
// history, flood history, HOA, etc.) don't correspond to a licensed trade a vendor here sells.
export const SELLER_QUESTION_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  septic_seller: 'Well & Septic Services',
};

// Moving Company is deliberately NOT matched here or anywhere in FINDING_TRADE_CATEGORY /
// PRIORITY_TRADE_CATEGORY above -- unlike every other category, it isn't tied to a specific
// defect or inspection topic, it's relevant to literally every buyer regardless of what the
// report finds. It gets its own fixed, always-checked report slot instead (see
// PropertyReport.movingCompanyVendors in types.ts and the render in PropertyReportView.tsx),
// positioned once near the top of the report rather than competing for a topic-relevant spot it
// doesn't have.
