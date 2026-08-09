// First come, first served: at most this many active sponsors per (ZIP, trade category) pair.
// Single source of truth -- Vendors.tsx, zipAdsApi.ts, and the checkout UI all reference this
// rather than hardcoding the number separately, so they can never quietly drift out of sync
// (the pre-existing landing page copy claimed "3 vendors per category" before this was wired up).
export const MAX_SLOTS_PER_ZIP_TRADE = 2;

// Shared between the checkout form's dropdown and the server-side validation on submission, so
// the two can't silently diverge (a category typed on one side but not recognized on the other).
export const TRADE_CATEGORIES = [
  'Roof Inspection',
  'HVAC Inspection',
  'Sewer Scope',
  'Radon Testing',
  'Foundation Engineer',
  'Electrician',
  'Home Inspector',
  'Insurance Agent',
  'Real Estate Attorney',
  'Moving Company',
] as const;

// Matches a specific report finding's trade category, not just its ZIP. Report findings today
// are a small, fixed set (see validateAndFixReportContradictions in server.ts) -- this maps each
// finding id to whichever paid trade category it's actually relevant to, so a report can carry a
// separate, contextual vendor match per finding instead of one generic slot for the whole report.
// f_code (municipal code enforcement) has no natural trade match and is deliberately omitted --
// not every finding needs an ad slot.
export const FINDING_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  f_roof: 'Roof Inspection',
  f_elec: 'Electrician',
  f_hvac: 'HVAC Inspection',
  f_flood: 'Insurance Agent',
  f_seismic: 'Foundation Engineer',
};

// Same pattern as FINDING_TRADE_CATEGORY, for the era-based inspection priority items (see
// engine/inspectionPriorities.ts). lead_paint_disclosure (a free, legally-required document
// check, not a paid trade service) and asbestos_materials (no trade category fits well -- it's a
// specialist consultant, not one of the ten listed trades) are deliberately left unmatched.
export const PRIORITY_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  knob_and_tube: 'Electrician',
  electrical_aluminum_wiring: 'Electrician',
  electrical_panel_brand: 'Electrician',
  sewer_cast_iron: 'Sewer Scope',
  galvanized_supply: 'Home Inspector',
  polybutylene_supply: 'Home Inspector',
  foundation_pre_posttension: 'Foundation Engineer',
  foundation_posttension: 'Foundation Engineer',
  pier_and_beam: 'Home Inspector',
  eifs_stucco: 'Home Inspector',
  systems_age: 'Home Inspector',
  radon_test: 'Radon Testing',
};
