// Inspection budget allocator -- NOT a property assessment.
//
// This module deliberately never asserts anything about a specific house. Every statement it
// produces is class-level ("homes of this era commonly used X"), sourced from published building
// science and federal disclosure law, and terminates at a licensed professional who can actually
// look at the property. That distinction is legal, not cosmetic: assessing the condition of a
// specific property is licensed activity in Texas (Occupations Code Ch. 1102), while helping a
// buyer decide how to spend a limited inspection budget is not.
//
// Rules therefore MUST follow these constraints -- they are the reason this feature is shippable:
//   1. eraBasis states what was COMMON in a construction era/region. Never "this house has...".
//   2. Costs are always ranges, never point estimates. Precision we haven't earned reads as a
//      professional opinion.
//   3. No aggregate "total exposure" figure is produced anywhere. Per-item ranges only -- the
//      buyer does their own arithmetic, so we never hand them a number to rely on.
//   4. Nothing is ever framed as "skip". Deprioritizing a health-related test is the one
//      recommendation direction with real downside, so lower-priority items still carry the
//      standing public-health guidance rather than a recommendation against them.
//
// Year built is USER-SUPPLIED and must be labeled as such everywhere it surfaces -- same honesty
// pattern as declaredPropertyType (see the Layer 3 self-declaration design in geoValidationGate).
// BeforeRegret has no assessor connection to verify it against.
//
// Rules carry their own applicability window rather than being grouped into era buckets. Most
// of what matters here is national building science with a real date range attached (lead paint
// banned 1978, polybutylene installed ~1978-1995, aluminum branch wiring ~1965-1973), so bucketing
// by decade would mean copying the same rule into several buckets and letting them drift apart.
// A rule with no `counties` applies in every US county -- this covers the whole country by
// default. Only genuinely local rules (expansive clay soil, foundation practice) name counties,
// gated to EXPANSIVE_SOIL_REGIONS below, and adding a county to that list is cheap. Anywhere
// outside that list gets foundation_type_general instead of a geology claim we can't back.

import { normalizeCountyKey } from '../utils/normalizeCounty.js';

export type PriorityLevel = 'high' | 'medium' | 'lower';

export const CURRENT_YEAR = new Date().getFullYear();

export interface InspectionPriority {
  id: string;
  title: string;
  priority: PriorityLevel;
  /** What was common in this construction era/region. Never a claim about the subject property. */
  eraBasis: string;
  /** What it costs to get a real answer. Range or "usually included in a general inspection". */
  costToCheck: string;
  /** Typical cost if the issue is present and needs work. Always a range. Null where N/A. */
  typicalRepairCost: string | null;
  /** The concrete next action, always routed to a licensed professional. */
  howToCheck: string;
}

interface PriorityRule extends InspectionPriority {
  /** Inclusive construction-year window in which this rule applies. */
  minYear: number;
  maxYear: number;
  /** Lowercased counties this is specific to. Omit for rules that apply everywhere covered. */
  counties?: string[];
}

export interface InspectionPrioritiesResult {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  priorities: InspectionPriority[];
}

// Counties with well-documented expansive clay soil, used to gate the foundation-specific rules
// below (never guessed at -- Texas Blackland Prairie and Gulf Coast clay geology is extensively
// published by Texas A&M AgriLife Extension, TSBPE materials, and county soil surveys). This is
// NOT a coverage gate for the whole engine: most rules below (federal disclosure law, national
// product recalls, plumbing material timelines, system age) apply everywhere in the US and are
// never filtered by this list. Only the three foundation/soil rules are region-specific, because
// they make a geology claim ("this area has expansive clay") that isn't true everywhere.
export const EXPANSIVE_SOIL_REGIONS: Record<string, { label: string }> = {
  // Austin metro
  'travis county': { label: 'Travis County, TX' },
  'williamson county': { label: 'Williamson County, TX' },
  'hays county': { label: 'Hays County, TX' },
  // Dallas-Fort Worth metro
  'dallas county': { label: 'Dallas County, TX' },
  'tarrant county': { label: 'Tarrant County, TX' },
  'collin county': { label: 'Collin County, TX' },
  'denton county': { label: 'Denton County, TX' },
  // San Antonio
  'bexar county': { label: 'Bexar County, TX' },
  // Houston / Gulf Coast
  'harris county': { label: 'Harris County, TX' },
  'fort bend county': { label: 'Fort Bend County, TX' },
  'montgomery county': { label: 'Montgomery County, TX' },
  // Waco (heart of the Blackland Prairie) and Killeen-Temple
  'mclennan county': { label: 'McLennan County, TX' },
  'bell county': { label: 'Bell County, TX' },
};

/** Title-cases a raw county string ("king county" -> "King County") for the fallback label. */
export function titleCaseCounty(county: string): string {
  return county
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/**
 * Region label shown in the UI when the county isn't one of the curated expansive-soil regions
 * above. Falls back gracefully rather than guessing at soil geology: echoes back whatever
 * county/state the requester gave us, or a generic "United States" label if neither is available.
 */
export function buildFallbackRegionLabel(county: string | null | undefined, state: string | null | undefined): string {
  const cleanCounty = (county || '').trim();
  const cleanState = (state || '').trim();
  if (cleanCounty && cleanState) return `${titleCaseCounty(cleanCounty)}, ${cleanState}`;
  if (cleanCounty) return titleCaseCounty(cleanCounty);
  if (cleanState) return cleanState;
  return 'the United States';
}

const PRIORITY_RULES: PriorityRule[] = [
  // --- Federal disclosure: free, legally mandated, so it leads for anything pre-1978 ---
  {
    id: 'lead_paint_disclosure',
    minYear: 1800,
    maxYear: 1977,
    title: 'Confirm you received the federal lead-paint disclosure',
    priority: 'high',
    eraBasis:
      'Lead-based paint was not banned in US residential use until 1978. Federal law requires sellers of homes built before 1978 to give buyers a lead-based paint disclosure, an EPA-approved pamphlet, and the opportunity to conduct a lead assessment.',
    costToCheck: 'Free — it is legally required',
    typicalRepairCost: null,
    howToCheck:
      'Ask your agent to confirm the federal lead-based paint disclosure is in your paperwork. If it is missing, request it before your option period ends.',
  },

  // --- Electrical ---
  {
    id: 'knob_and_tube',
    minYear: 1800,
    maxYear: 1955,
    title: 'Check for active knob-and-tube wiring',
    priority: 'high',
    eraBasis:
      'Knob-and-tube wiring was standard in US homes built before roughly 1950. It has no ground conductor, its insulation becomes brittle with age, and it is not rated to be buried in insulation. Many insurance carriers will not write a policy on a home with knob-and-tube still energized.',
    costToCheck: 'Usually included in a general inspection — ask them to note it explicitly. Dedicated electrician evaluation $150 – $350.',
    typicalRepairCost: 'Partial to whole-home rewire $8,000 – $30,000+',
    howToCheck:
      'Ask your inspector to confirm in writing whether any knob-and-tube is still energized, then confirm insurability with your insurance agent before your option period ends.',
  },
  {
    id: 'electrical_aluminum_wiring',
    minYear: 1965,
    maxYear: 1973,
    title: 'Identify the branch circuit wiring material',
    priority: 'high',
    eraBasis:
      'Aluminum branch wiring was used in some US homes built roughly between 1965 and 1973. The Consumer Product Safety Commission has published on the associated fire risk at connection points.',
    costToCheck: 'Usually included in a general inspection — ask them to note the wiring material. Dedicated electrician evaluation $150 – $350.',
    typicalRepairCost: 'Remediation with approved connectors or pigtailing $2,000 – $8,000+',
    howToCheck:
      'Ask your inspector to record the branch circuit wiring material in writing, then confirm insurability with your insurance agent before your option period ends.',
  },
  {
    id: 'electrical_panel_brand',
    minYear: 1950,
    maxYear: 1989,
    title: 'Record the electrical panel brand',
    priority: 'high',
    eraBasis:
      'Certain electrical panel brands installed between roughly the 1950s and the 1980s have documented breaker failure-to-trip problems. Some insurance carriers decline to write policies on homes that still have them.',
    costToCheck: 'Usually included in a general inspection — just ask them to record the brand',
    typicalRepairCost: 'Panel replacement $1,500 – $4,000',
    howToCheck:
      'Ask your inspector to record the panel brand and model in writing, then confirm insurability with your insurance agent before your option period ends.',
  },

  // --- Plumbing ---
  {
    id: 'sewer_cast_iron',
    minYear: 1800,
    maxYear: 1973,
    title: 'Scope the sewer line',
    priority: 'high',
    eraBasis:
      'Homes built before the early 1970s commonly used cast iron for drain, waste, and vent piping. Typical service life for cast iron drain lines is roughly 50 to 75 years, which puts homes of this era at or past that window.',
    costToCheck: '$300 – $500 for a camera scope',
    typicalRepairCost: 'Spot repair $1,500 – $5,000; full replacement $4,000 – $15,000+',
    howToCheck:
      'Book a sewer scope with a licensed plumber. This is usually a separate service — most general home inspections do not include it unless you ask.',
  },
  {
    id: 'galvanized_supply',
    minYear: 1800,
    maxYear: 1969,
    title: 'Check the water supply pipe material',
    priority: 'medium',
    eraBasis:
      'Galvanized steel supply piping was common in homes of this era. It corrodes from the inside out, which shows up as reduced water pressure and discolored water long before it leaks.',
    costToCheck: 'Usually included in a general inspection',
    typicalRepairCost: 'Whole-home repipe $4,000 – $15,000',
    howToCheck:
      'Ask your inspector to identify the supply pipe material where it is visible — typically at the water heater and under sinks.',
  },
  {
    id: 'polybutylene_supply',
    minYear: 1978,
    maxYear: 1996,
    title: 'Check whether the supply lines are polybutylene',
    priority: 'high',
    eraBasis:
      'Polybutylene supply piping was widely installed in US homes from the late 1970s through the mid-1990s. It was the subject of a major national class-action settlement after pipe and fittings were found to fail, and many insurance carriers now decline or surcharge policies on homes that still have it.',
    costToCheck: 'Usually included in a general inspection — ask them to identify the material in writing',
    typicalRepairCost: 'Whole-home repipe $4,000 – $15,000',
    howToCheck:
      'Ask your inspector to check at the water heater and main shutoff. Polybutylene is flexible and usually gray, sometimes blue or black. If it is present, confirm insurability with your agent before your option period ends.',
  },

  // --- Foundation: expansive clay soil geology, scoped to the documented Texas counties in
  // EXPANSIVE_SOIL_REGIONS above. Everywhere else gets the region-agnostic foundation_type_general
  // rule near the bottom of this list instead of a geology claim we can't back. ---
  {
    id: 'foundation_pre_posttension',
    minYear: 1800,
    maxYear: 1979,
    counties: Object.keys(EXPANSIVE_SOIL_REGIONS),
    title: 'Get the foundation looked at by a structural engineer',
    priority: 'high',
    eraBasis:
      'This region sits within the Texas Blackland Prairie / Gulf Coast expansive clay soil belt, where soils shrink and swell significantly with moisture. Foundations from this era generally predate post-tensioned slab construction, which became common in Texas residential building later.',
    costToCheck: '$400 – $800 for a structural engineer evaluation',
    typicalRepairCost: 'Foundation repair $5,000 – $30,000+ depending on scope',
    howToCheck:
      'Hire a licensed structural engineer directly. This is a separate engagement from your general home inspection, and the engineer works for you, not the seller.',
  },
  {
    id: 'foundation_posttension',
    minYear: 1980,
    maxYear: CURRENT_YEAR,
    counties: Object.keys(EXPANSIVE_SOIL_REGIONS),
    title: 'Watch for signs of slab movement',
    priority: 'medium',
    eraBasis:
      'This region sits within the Texas Blackland Prairie / Gulf Coast expansive clay soil belt, where soils shrink and swell significantly with moisture. Homes of this era are commonly built on post-tensioned slabs, which handle that movement better than older conventional slabs but cannot be cut or core-drilled without engineering review.',
    costToCheck: 'Included in a general inspection; $400 – $800 for a structural engineer if signs are present',
    typicalRepairCost: 'Foundation repair $5,000 – $30,000+ depending on scope',
    howToCheck:
      'Ask your inspector to note doors out of square, sloping floors, or diagonal cracking at wall corners. If any show up, bring in a licensed structural engineer before your option period ends.',
  },
  {
    id: 'pier_and_beam',
    minYear: 1800,
    maxYear: 1965,
    counties: Object.keys(EXPANSIVE_SOIL_REGIONS),
    title: 'Have someone physically enter the crawlspace',
    priority: 'medium',
    eraBasis:
      'Homes of this era in this region were commonly built on pier-and-beam foundations rather than slabs. That makes the structure accessible for inspection, but also leaves joists, sills, and piers exposed to moisture and pest damage.',
    costToCheck: 'Usually included in a general inspection when the crawlspace is accessible',
    typicalRepairCost: 'Pier or beam repair and releveling $3,000 – $15,000+',
    howToCheck:
      'Ask your inspector to physically enter the crawlspace rather than looking in from the access hatch, and to report on moisture, rot, and pier condition.',
  },
  // Region-agnostic fallback for everywhere outside the expansive-soil counties above -- this
  // doesn't assert a specific soil or foundation type, just that foundation issues are common,
  // expensive, and worth a direct answer, which is true everywhere. Excluded in soil regions
  // (see the soilRegion filter in getInspectionPriorities below) so a report never
  // shows this alongside the more specific rule it would otherwise duplicate.
  {
    id: 'foundation_type_general',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    title: 'Identify the foundation type and check for movement',
    priority: 'medium',
    eraBasis:
      'Foundation type and condition vary widely by region, era, and local soil and drainage conditions. Settling, moisture intrusion, and structural movement are among the most expensive issues to discover after closing, and they are not always obvious during a casual walkthrough.',
    costToCheck: 'Included in a general inspection',
    typicalRepairCost: 'Varies widely by cause and severity — from minor crack sealing to $30,000+ for major structural repair',
    howToCheck:
      'Ask your inspector to identify the foundation type and note any signs of cracking, settling, or moisture intrusion. If anything is flagged, bring in a licensed structural engineer before your option period ends.',
  },

  // --- Envelope & materials ---
  {
    id: 'asbestos_materials',
    minYear: 1800,
    maxYear: 1985,
    title: 'Test for asbestos only if you plan to renovate',
    priority: 'medium',
    eraBasis:
      'Asbestos was common in floor tile, tile mastic, ceiling texture, and pipe wrap in homes built before the early 1980s. Intact, undisturbed material is generally not considered a hazard — the risk comes from disturbing it.',
    costToCheck: '$200 – $600 for sampling and lab analysis',
    typicalRepairCost: 'Abatement varies widely by material and area',
    howToCheck:
      'If you plan to remodel, pull up flooring, or scrape ceilings, have a licensed asbestos consultant sample the materials first. If you are not disturbing anything, this is lower urgency.',
  },
  {
    id: 'eifs_stucco',
    minYear: 1990,
    maxYear: 2005,
    title: 'If the exterior is stucco, find out which kind',
    priority: 'medium',
    eraBasis:
      'Synthetic stucco (EIFS) was used on some homes built in the 1990s and early 2000s. Early barrier-type installations could trap water behind the cladding, causing sheathing and framing damage that is not visible from outside.',
    costToCheck: '$400 – $800 for a moisture survey by an EIFS-qualified inspector',
    typicalRepairCost: 'Varies widely; extensive sheathing replacement can exceed $10,000',
    howToCheck:
      'Ask your inspector whether the cladding is traditional hard-coat stucco or synthetic EIFS. If it is EIFS, consider a specialist moisture survey before your option period ends.',
  },

  // --- Applies to essentially any home old enough for systems to have cycled ---
  {
    id: 'systems_age',
    minYear: 1800,
    maxYear: CURRENT_YEAR - 12,
    title: 'Get the age of the roof, HVAC, and water heater in writing',
    priority: 'medium',
    eraBasis:
      'Major systems have finite service lives — roughly 15 to 25 years for a roof depending on material, 15 to 20 for HVAC equipment, and 8 to 12 for a conventional tank water heater. In a home of this age at least one of these is typically at or past its first replacement cycle.',
    costToCheck: 'Included in a general inspection — ask for the age and remaining life of each',
    typicalRepairCost: 'Roof $8,000 – $25,000+; HVAC $6,000 – $15,000; water heater $1,200 – $3,000',
    howToCheck:
      'Ask your inspector to record the manufacture date from the data plate on the furnace, condenser, and water heater, and to estimate remaining roof life.',
  },

  // --- Geology-driven, not era-driven; always ranked last ---
  {
    id: 'radon_test',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    title: 'Radon test',
    priority: 'lower',
    eraBasis:
      'Radon levels are driven by local geology rather than construction era, so this is not specific to a home of any particular vintage, and predicted levels vary significantly by county across the US.',
    costToCheck: '$150 – $300',
    typicalRepairCost: 'Mitigation system $800 – $2,500',
    howToCheck:
      'EPA recommends that every home be tested for radon regardless of its predicted zone, and that guidance does not change here. This is ranked lower only because the items above are more specific to homes of this era — not as a recommendation against testing.',
  },
];

const PRIORITY_ORDER: Record<PriorityLevel, number> = { high: 0, medium: 1, lower: 2 };

export function getEraLabel(yearBuilt: number): string {
  if (yearBuilt < 1950) return 'pre-1950 construction';
  if (yearBuilt >= 2020) return '2020s construction';
  const decade = Math.floor(yearBuilt / 10) * 10;
  return `${decade}s construction`;
}

/**
 * Returns the inspection priorities for a (year built, county, state) pair, or null when no rule
 * applies at all. Unlike the old version, this covers every US county: rules with no `counties`
 * restriction (federal disclosure law, national product recalls, plumbing material timelines,
 * system age) apply everywhere, and only the expansive-soil foundation rules are gated to the
 * counties in EXPANSIVE_SOIL_REGIONS where that geology claim is actually documented. Null means
 * callers render nothing -- never generic filler -- which in practice now only happens for an
 * implausible or missing year built.
 */
export function getInspectionPriorities(
  yearBuilt: number | null | undefined,
  county: string | null | undefined,
  state?: string | null
): InspectionPrioritiesResult | null {
  if (!yearBuilt || !Number.isFinite(yearBuilt)) return null;
  if (!isPlausibleYearBuilt(yearBuilt)) return null;

  // normalizeCountyKey, not a bare toLowerCase().trim() -- a geocoder returning "Travis" instead
  // of "Travis County" used to silently miss every county-gated rule below and quietly downgrade
  // the report to its generic form. See src/utils/normalizeCounty.ts for the measured impact.
  // Only the LOOKUP is normalized; buildFallbackRegionLabel below still receives the raw string so
  // a parish or borough is still displayed by its real name.
  const normalizedCounty = normalizeCountyKey(county);
  const soilRegion = EXPANSIVE_SOIL_REGIONS[normalizedCounty];

  let matched = PRIORITY_RULES.filter(
    (rule) =>
      yearBuilt >= rule.minYear &&
      yearBuilt <= rule.maxYear &&
      (!rule.counties || rule.counties.includes(normalizedCounty))
  );
  // Outside expansive-soil counties, foundation_type_general is the fallback. Inside them, the
  // more specific foundation_pre_posttension/foundation_posttension/pier_and_beam rules already
  // cover the topic, so drop the generic one to avoid showing two foundation items side by side.
  if (soilRegion) {
    matched = matched.filter((rule) => rule.id !== 'foundation_type_general');
  }
  if (matched.length === 0) return null;

  const regionLabel = soilRegion?.label || buildFallbackRegionLabel(county, state);

  // Stable sort by priority band, preserving the declaration order above within each band.
  const priorities = [...matched]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .map(({ minYear, maxYear, counties, ...priority }) => priority);

  return {
    yearBuilt,
    eraLabel: getEraLabel(yearBuilt),
    regionLabel,
    priorities,
  };
}

/** Shared validation for the user-supplied year-built input. */
export function isPlausibleYearBuilt(value: number): boolean {
  return Number.isInteger(value) && value >= 1800 && value <= CURRENT_YEAR;
}
