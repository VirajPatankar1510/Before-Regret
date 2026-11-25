// How researchers, editors and students would look for each study's data (owner request, 2026-11-25).
//
// Two uses, both at build time in prerender-research.tsx:
//  1. derivedDataset() merges `keywords`, `alternateName`, `measurementTechnique` and `isBasedOn` into the
//     study's schema.org Dataset. Google Dataset Search reads those fields; it is where a researcher
//     typing "county-level NFIP claims dataset" or the source file's own name looks first.
//  2. researcherBlock() renders a short visible "Data at a glance" box: unit of analysis, geography key,
//     period, source files by their official names, licence. Researchers search by the source
//     dataset's name and by the unit ("by county", "FIPS"); this puts those words on the page as
//     plain documentation, never as a keyword list (spam policy, and the owner's no-SEO-notes rule).
//
// EVIDENCE NOTE. The phrases below are HYPOTHESES about researcher wording, not measured demand: our own
// Search Console showed 11 disclosed queries to /research/ pages in 16 months, all buyer questions
// (pull of 2026-11-25). No search volume is claimed anywhere. Every fact in `glance` is copied from the
// study's own method section or source line; change it there first.

export type ResearcherMeta = {
  /** Other names a researcher might give this dataset. */
  alternateName: string[];
  /** Researcher-style search phrases (hypotheses). */
  keywords: string[];
  /** One sentence on how the figures were derived. */
  measurementTechnique: string;
  /** Source datasets by their official names. */
  isBasedOn: string[];
  glance: { what: string; unit: string; key: string; period: string };
};

export const RESEARCHER_META: Record<string, ResearcherMeta> = {
  'risk-without-price': {
    alternateName: ['Homeowners insurance premiums vs natural hazard risk by county', 'ACS B25141 insurance cost and FEMA National Risk Index, county-level'],
    keywords: ['homeowners insurance premiums by county dataset', 'home insurance cost vs climate risk data', 'ACS B25141 homeowners insurance', 'FEMA National Risk Index expected annual loss county', 'insurance pricing and hazard risk research', 'property insurance affordability data', 'county-level homeowners insurance cost CSV'],
    measurementTechnique: 'County median annual insurance cost interpolated from ACS 5-year 2023 table B25141 cost bands, compared with FEMA National Risk Index expected annual building loss per dollar of building exposure for nine perils: wildfire, hurricane wind, tornado, hail, severe wind, lightning, winter weather, ice storm and volcanic activity.',
    isBasedOn: ['U.S. Census Bureau, American Community Survey 5-year 2023, table B25141', 'FEMA National Risk Index, county table'],
    glance: { what: 'What mortgaged homeowners report paying to insure their homes, set against FEMA-modelled hazard loss, for every county.', unit: 'County, summarised by state in the CSV', key: 'State abbreviation', period: 'ACS 5-year estimates, 2023 release' },
  },
  'risk-without-cover': {
    alternateName: ['NFIP take-up rate inside the Special Flood Hazard Area by county', 'Flood insurance coverage gap by county'],
    keywords: ['NFIP take-up rate by county', 'flood insurance penetration rate data', 'NfipResidentialPenetrationRates', 'flood insurance coverage gap dataset', 'Special Flood Hazard Area insurance uptake', 'county flood insurance participation CSV', 'flood risk vs flood insurance research'],
    measurementTechnique: 'NFIP residential contracts in force inside the Special Flood Hazard Area divided by residential structures there, per county, set against FEMA National Risk Index inland and coastal flood expected annual building loss per dollar of exposure; counties with more policies than structures are dropped as denominator errors.',
    isBasedOn: ['FEMA OpenFEMA, NfipResidentialPenetrationRates', 'FEMA National Risk Index, county table'],
    glance: { what: 'The share of homes inside FEMA-mapped flood zones that carry National Flood Insurance Program policies, county by county.', unit: 'County', key: 'County name and state (no FIPS column)', period: 'Policies in force as of 3 August 2026' },
  },
  'outside-the-zone': {
    alternateName: ['NFIP flood claims outside the Special Flood Hazard Area by county', 'Flood insurance claims by flood zone'],
    keywords: ['NFIP claims outside SFHA', 'flood claims outside flood zone data', 'FimaNfipClaims analysis', 'NFIP claims by flood zone county', 'X zone flood claims dataset', 'flood damage outside 100-year floodplain research', 'county-level flood insurance claims CSV'],
    measurementTechnique: 'Every FEMA NFIP claim classified by the flood zone its policy was rated in (A and V zones inside the Special Flood Hazard Area; B, C and X outside); zone D and missing zones reported separately and excluded from shares.',
    isBasedOn: ['FEMA OpenFEMA, FimaNfipClaims', 'FEMA OpenFEMA, NfipResidentialPenetrationRates'],
    glance: { what: 'How many National Flood Insurance Program claims, and how many dollars, were paid on buildings rated outside the high-risk flood zone, by county.', unit: 'County (counties with at least 25 classifiable claims)', key: 'County name and state (no FIPS column)', period: 'Claims from the 1970s to 2026' },
  },
  'high-hazard-dams': {
    alternateName: ['High hazard potential dams by county', 'National Inventory of Dams high-hazard dams, condition and emergency action plans by county'],
    keywords: ['high hazard potential dams by county', 'National Inventory of Dams data', 'NID dam condition assessment dataset', 'dams without emergency action plan data', 'dam safety county-level CSV', 'unsatisfactory condition dams list research', 'dam hazard classification statistics'],
    measurementTechnique: 'Counts of dams with High hazard potential classification in the US Army Corps of Engineers National Inventory of Dams, by county, with condition assessment (Poor or Unsatisfactory) and emergency action plan status (explicit No).',
    isBasedOn: ['US Army Corps of Engineers, National Inventory of Dams'],
    glance: { what: 'Every county with a high-hazard-potential dam, with the inventory’s condition ratings and emergency-plan status.', unit: 'County', key: 'County name and state (no FIPS column)', period: 'National Inventory of Dams, updated 28 August 2026' },
  },
  'allegheny-storm-premium': {
    alternateName: ['Severe weather events vs homeowners insurance cost, 100 most populous US counties', 'NOAA Storm Events and ACS insurance cost by county'],
    keywords: ['NOAA Storm Events by county dataset', 'severe weather events vs insurance cost', 'Allegheny County severe weather data', 'homeowners insurance cost 100 largest counties', 'storm frequency and home insurance premiums research', 'county severe weather counts 2015-2024'],
    measurementTechnique: 'County-tagged NOAA Storm Events Database entries for 2015 to 2024, set against the share of mortgaged households in ACS insurance cost bands, for the 100 most populous counties.',
    isBasedOn: ['NOAA, Storm Events Database', 'U.S. Census Bureau, American Community Survey'],
    glance: { what: 'Severe weather reports and what mortgaged households pay to insure their homes, for the 100 most populous US counties.', unit: 'County (100 most populous)', key: 'Five-digit county FIPS (geoid)', period: 'Storm events 2015 to 2024' },
  },
  'north-texas-roof-age': {
    alternateName: ['Housing age concentration and hail events, Dallas-Fort Worth and 100 US counties', 'Roof age cohorts and NOAA hail reports by county'],
    keywords: ['hail events by county NOAA', 'housing age by decade built county', 'Dallas-Fort Worth hail data', 'roof replacement cohort housing age research', 'year structure built and hail exposure', 'Tarrant County Collin County hail counts'],
    measurementTechnique: 'Largest combined share of housing units in two adjacent decades of construction (ACS 5-year, year structure built), set against county-tagged NOAA Storm Events hail entries for 2015 to 2024.',
    isBasedOn: ['U.S. Census Bureau, American Community Survey 5-year, year structure built', 'NOAA, Storm Events Database'],
    glance: { what: 'How bunched each county’s housing is by construction decade, against its recorded hail, for 100 counties in 31 states.', unit: 'County (100 counties)', key: 'Five-digit county FIPS (geoid)', period: 'Hail entries 2015 to 2024' },
  },
  'raise-or-remove': {
    alternateName: ['FEMA buyouts vs home elevations, single-family homes', 'Hazard Mitigation Assistance acquisition and elevation decisions by state and ZIP'],
    keywords: ['FEMA buyout data', 'HMA mitigated properties analysis', 'acquisition and demolition vs elevation FEMA', 'managed retreat data by state', 'FEMA flood buyouts by ZIP code', 'Hazard Mitigation Assistance Mitigated Properties dataset', 'home elevation grants research'],
    measurementTechnique: 'Single-family records in FEMA’s Hazard Mitigation Assistance Mitigated Properties file where the action was acquisition and demolition or elevation, counted by state, ZIP code and grant fiscal year.',
    isBasedOn: ['FEMA OpenFEMA, Hazard Mitigation Assistance Mitigated Properties'],
    glance: { what: 'Where FEMA-funded flood mitigation demolished single-family homes and where it raised them instead.', unit: 'State and ZIP code', key: 'State; five-digit ZIP code', period: 'Grant fiscal years 1996 to 2025' },
  },
  'oldest-housing': {
    alternateName: ['Pre-1940 housing share by county', 'Housing units by year structure built, ACS B25034, every county'],
    keywords: ['housing age by county dataset', 'pre-1940 housing stock data', 'ACS B25034 year structure built county', 'median year built by county', 'old housing stock research', 'oldest housing counties United States', 'housing built before 1940 by county CSV'],
    measurementTechnique: 'Share of housing units built in 1939 or earlier and before 1960, and median year built, from ACS 5-year table B25034, with margins of error kept and unreliable estimates flagged.',
    isBasedOn: ['U.S. Census Bureau, American Community Survey 5-year 2020-2024, table B25034'],
    glance: { what: 'The share of each county’s housing built before 1940, with margins of error and median year built.', unit: 'County (50 states and DC)', key: 'Five-digit county FIPS (geoid)', period: 'ACS 5-year estimates, 2020 to 2024' },
  },
  'built-to-code': {
    alternateName: ['New single-family houses permitted under current vs outdated building codes by county', 'Census Building Permits Survey joined to FEMA BCAT building code adoption'],
    keywords: ['building code adoption by county data', 'FEMA BCAT data analysis', 'International Residential Code adoption by jurisdiction', 'building permits by permit office Census', 'hazard-resistant building codes research', 'new construction under outdated building codes', 'Building Permits Survey place-level data'],
    measurementTechnique: 'New single-family units in the 2025 Census Building Permits Survey annual place files, joined by permit office to FEMA Building Code Adoption Tracking ratings, summed to county.',
    isBasedOn: ['U.S. Census Bureau, Building Permits Survey, 2025 annual place files', 'FEMA Building Code Adoption Tracking (BCAT)'],
    glance: { what: 'How many new houses each county permitted under hazard-resistant, current building codes, and how many under old, weakened or no codes.', unit: 'County and permit office', key: 'Five-digit county FIPS; Census six-digit permit office ID', period: 'Permits issued in 2025; code ratings as of 30 September 2026' },
  },
  'fema-aid-gap': {
    alternateName: ['FEMA Individuals and Households Program homeowner aid by county and disaster', 'IHP housing assistance vs FEMA verified loss, owners'],
    keywords: ['FEMA individual assistance data by county', 'Individuals and Households Program analysis', 'HousingAssistanceOwners OpenFEMA', 'FEMA IHP approval rate', 'FEMA verified loss vs assistance', 'disaster aid to homeowners dataset', 'FEMA housing assistance by disaster CSV'],
    measurementTechnique: 'Every row of OpenFEMA Housing Assistance Program Data (Owners) v2 joined to Disaster Declarations Summaries by disaster number, summed by county, disaster and incident type; approved-amount bins not used because they disagree with dollar totals.',
    isBasedOn: ['FEMA OpenFEMA, Individuals and Households Program - Housing Assistance Program Data - Owners, v2', 'FEMA OpenFEMA, Disaster Declarations Summaries, v2'],
    glance: { what: 'What FEMA approved for homeowners after major disasters, against the damage its inspectors recorded, by county and by disaster.', unit: 'County; disaster by state', key: 'State and county as reported to FEMA (no FIPS column); FEMA disaster number', period: 'Major disasters declared 2002 to 2026' },
  },
  'mortgage-denied-collateral': {
    alternateName: ['HMDA mortgage denials citing collateral by county', 'Home purchase loan denial reasons, HMDA 2024'],
    keywords: ['HMDA denial reasons by county', 'mortgage denial collateral data', 'HMDA denial_reason collateral analysis', 'appraisal-related mortgage denials data', 'home purchase loan denial rates by county', 'HMDA 2024 loan application register analysis', 'mortgage denials by tract median housing age'],
    measurementTechnique: 'Every 2024 HMDA home-purchase record with action taken originated, approved but not accepted, or denied, counted by denial reason (up to four per denial); shares use denials that gave reasons, excluding partially exempt code 1111.',
    isBasedOn: ['FFIEC, Home Mortgage Disclosure Act data, 2024 nationwide loan/application records'],
    glance: { what: 'How often a 2024 home-purchase mortgage was denied with the property itself (collateral) as a reason, by county and state.', unit: 'County and state (first-lien, owner-occupied, single-unit applications)', key: 'Five-digit county FIPS; state abbreviation', period: 'Applications decided in 2024' },
  },
  'permit-pulse': {
    alternateName: ['Monthly building permits by county, single-family vs multifamily', 'Census Building Permits Survey county trends'],
    keywords: ['building permits by county monthly data', 'Census Building Permits Survey county', 'single-family vs multifamily permits by county', 'housing permits by state', 'residential construction trends county-level', 'housing starts proxy county data CSV'],
    measurementTechnique: 'Year-to-date permitted housing units by structure size from the Census Building Permits Survey county files, compared with the same months a year earlier, rebuilt monthly.',
    isBasedOn: ['U.S. Census Bureau, Building Permits Survey, county files'],
    glance: { what: 'Permitted new housing units by county, houses against apartments, year to date against the year before.', unit: 'County', key: 'Five-digit county FIPS', period: 'Rebuilt monthly; check the date on the page' },
  },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const RESEARCHER_CSS = `
  .rdata{border:1px solid #ded9cf;background:#fbfaf7;padding:1.1rem 1.2rem;margin:2.4rem 0 0;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;color:#2e2e2e}
  .rdata h2{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.11em;text-transform:uppercase;color:#6f5a3a;margin:0 0 .6rem;padding:0;border:0}
  .rdata p{margin:0 0 .7rem}
  .rdata dl{display:grid;grid-template-columns:9rem 1fr;gap:.35rem .9rem;margin:0}
  .rdata dt{font-weight:700;color:#4a4a4a}
  .rdata dd{margin:0}
  @media(max-width:560px){.rdata dl{grid-template-columns:1fr}.rdata dd{margin-bottom:.4rem}}`;

/** The visible "Data at a glance" box. Files are the Dataset's own distribution files. */
export function researcherBlock(slug: string, files: string[]): string {
  const m = RESEARCHER_META[slug];
  if (!m) throw new Error(`[researcher-meta] no entry for ${slug}`);
  const fileLinks = files.map((f) => `<a href="/research/data/${f}">${f}</a>`).join(' &middot; ');
  return `<section class="rdata" id="data-at-a-glance">
    <h2>Data at a glance</h2>
    <p>${esc(m.glance.what)}</p>
    <dl>
      <dt>Unit of analysis</dt><dd>${esc(m.glance.unit)}</dd>
      <dt>Geography key</dt><dd>${esc(m.glance.key)}</dd>
      <dt>Period</dt><dd>${esc(m.glance.period)}</dd>
      <dt>Source data</dt><dd>${m.isBasedOn.map(esc).join('; ')}</dd>
      <dt>Method</dt><dd>${esc(m.measurementTechnique)}</dd>
      <dt>Files</dt><dd>${fileLinks}</dd>
      <dt>Licence</dt><dd>CC BY 4.0, free to reuse with credit to Before Regret</dd>
    </dl>
  </section>`;
}
