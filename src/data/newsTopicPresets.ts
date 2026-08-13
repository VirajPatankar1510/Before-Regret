// Curated categories for the article editor's "Latest news coverage" search (see
// src/server/newsCoverageApi.ts and SeoAdminPanel.tsx) -- what's actually relevant to a
// homebuyer, not just federal disaster declarations or structural defects. FEMA/OpenFEMA stays
// the one source treated as ground truth for facts an article states (see
// femaDeclarationsService.ts); everything here is topic *inspiration* only, same trust boundary
// as TOPIC_SEEDS in scripts/generate-draft-articles.ts. Each query is deliberately one concrete
// phrase or a short OR-group, not a broad single word -- a query like "insurance" alone would
// return mostly noise unrelated to home buying.
//
// Deliberately broader than "things that go wrong with a house" -- market conditions,
// affordability, and local development drive far more home-buyer search volume and reader
// interest than defects and disclosures alone, so the category list is the actual reach strategy
// here, not just a defect checklist. `category` groups the chips in the editor UI so a wide list
// stays scannable instead of one undifferentiated wall of buttons.
export interface NewsTopicPreset {
  label: string;
  category: string;
  query: string;
}

export const NEWS_TOPIC_PRESETS: NewsTopicPreset[] = [
  // --- Market & affordability -- the highest-search-volume territory for anyone buying a house,
  // and has nothing to do with defects or disasters. ---
  { label: 'Mortgage rates & affordability', category: 'Market & affordability', query: 'mortgage rates housing affordability' },
  { label: 'Housing market predictions', category: 'Market & affordability', query: 'housing market forecast predictions' },
  { label: 'First-time homebuyer programs', category: 'Market & affordability', query: 'first-time homebuyer down payment assistance' },
  { label: 'Institutional investors buying homes', category: 'Market & affordability', query: 'institutional investors buying single family homes' },
  { label: 'Housing supply shortage', category: 'Market & affordability', query: 'housing supply shortage new construction' },
  { label: 'Remote work relocation trends', category: 'Market & affordability', query: 'remote work relocation housing market' },

  // --- Local development & value drivers -- the "why is this neighborhood changing" stories. ---
  { label: 'Data centers & property values', category: 'Local development', query: 'data center property values' },
  { label: 'School redistricting', category: 'Local development', query: 'school redistricting property value' },
  { label: 'Zoning changes', category: 'Local development', query: 'zoning change property value' },
  { label: 'New transit & property values', category: 'Local development', query: 'new transit line property values' },
  { label: 'Major employer relocation', category: 'Local development', query: 'major employer relocation housing market' },
  { label: 'HOA disputes', category: 'Local development', query: 'HOA lawsuit homeowners' },

  // --- Insurance & climate risk -- distinct from a single FEMA declaration: carriers pulling out
  // of entire markets, not just one storm. ---
  { label: 'Insurance non-renewal', category: 'Insurance & climate risk', query: 'home insurance non-renewal' },
  { label: 'Insurers leaving high-risk states', category: 'Insurance & climate risk', query: 'insurance company leaving state high risk' },
  { label: 'Wildfire insurance crisis', category: 'Insurance & climate risk', query: 'wildfire insurance crisis' },
  { label: 'Flood insurance rates', category: 'Insurance & climate risk', query: 'flood insurance rates rising' },
  { label: 'Condo special assessments', category: 'Insurance & climate risk', query: 'condo special assessment building' },

  // --- Property costs -- ongoing ownership cost stories, not a one-time purchase decision. ---
  { label: 'Property tax increases', category: 'Property costs', query: 'property tax reassessment increase' },
  { label: 'Rising utility costs', category: 'Property costs', query: 'rising utility costs homeowners' },

  // --- Disclosure & legal -- the site's original core, kept intact. ---
  { label: 'Home inspection lawsuits', category: 'Disclosure & legal', query: 'home inspection lawsuit' },
  { label: 'Lead paint disclosure', category: 'Disclosure & legal', query: 'lead paint disclosure' },
  { label: 'Radon disclosure', category: 'Disclosure & legal', query: 'radon disclosure' },
  { label: 'Mold disclosure lawsuits', category: 'Disclosure & legal', query: 'mold disclosure lawsuit' },
  { label: 'Septic & well water', category: 'Disclosure & legal', query: 'septic system OR well water contamination' },
  { label: 'Squatter rights law', category: 'Disclosure & legal', query: 'squatter rights law homeowner' },
  { label: 'Short-term rental regulation', category: 'Disclosure & legal', query: 'short-term rental ban Airbnb regulation' },

  // --- Structural & mechanical -- unchanged. ---
  { label: 'Aluminum wiring', category: 'Structural & mechanical', query: 'aluminum wiring' },
  { label: 'Polybutylene pipe', category: 'Structural & mechanical', query: 'polybutylene pipe' },
  { label: 'FPE / Zinsco panels', category: 'Structural & mechanical', query: 'FPE panel OR Zinsco panel' },
  { label: 'Knob and tube wiring', category: 'Structural & mechanical', query: 'knob and tube wiring' },
  { label: 'Asbestos', category: 'Structural & mechanical', query: 'asbestos insulation home' },
  { label: 'Foundation issues', category: 'Structural & mechanical', query: 'foundation crack lawsuit' },
];
