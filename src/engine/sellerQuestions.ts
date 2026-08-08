// Seller question script generator -- NOT a verification tool.
//
// This module never claims to know what a seller will say, and never treats a seller's answer as
// confirmed once given. Every question here exists because it's the kind of thing buyers commonly
// report regretting not asking, and every `whyAsking` is a class-level statement about the era,
// region, or property type -- never a claim about the specific house or its actual seller. Same
// legal posture as inspectionPriorities.ts: this helps a buyer decide what to ask, it does not
// assess the property or verify anyone's answer, so it stays out of licensed-inspection territory.
//
// Deliberately reuses the era/region helpers from inspectionPriorities.ts (CURRENT_YEAR,
// EXPANSIVE_SOIL_REGIONS, titleCaseCounty, buildFallbackRegionLabel, getEraLabel,
// isPlausibleYearBuilt) rather than keeping a second copy -- the foundation question below is
// gated to the exact same soil-region counties as the foundation inspection-priority items, and
// letting those two lists drift apart would be worse than the small coupling.
import {
  CURRENT_YEAR,
  EXPANSIVE_SOIL_REGIONS,
  buildFallbackRegionLabel,
  getEraLabel,
  isPlausibleYearBuilt,
} from './inspectionPriorities.js';
import { normalizeCountyKey } from '../utils/normalizeCounty.js';

export type QuestionPriority = 'high' | 'medium' | 'lower';

export type DeclaredPropertyType = 'single_family' | 'condo_or_multifamily' | 'other';

export interface SellerQuestion {
  id: string;
  /** Exact wording to ask, in the buyer's voice. */
  question: string;
  /** Era/region/property-type basis for asking. Class-level only, never a claim about this house. */
  whyAsking: string;
  /** What a reassuring vs. a follow-up-worthy answer sounds like. Never "this means X is true". */
  whatToListenFor: string;
  priority: QuestionPriority;
}

interface QuestionRule extends SellerQuestion {
  /** Inclusive construction-year window in which this question applies. */
  minYear: number;
  maxYear: number;
  /** Restricts to specific declared property types. Omit to apply to all types. */
  propertyTypes?: DeclaredPropertyType[];
  /** Lowercased counties this is specific to. Omit for questions that apply everywhere. */
  counties?: string[];
}

export interface SellerQuestionsResult {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  questions: SellerQuestion[];
}

const QUESTION_RULES: QuestionRule[] = [
  // --- Universal: applies to essentially any purchase, any era ---
  {
    id: 'permit_history_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    priority: 'high',
    question:
      'Were any additions, conversions, or major renovations done to this home, and were they permitted?',
    whyAsking:
      'Unpermitted work is one of the most commonly reported post-closing regrets. It can affect insurability, resale value, and in some cases has to be redone to code before it can be legally finished.',
    whatToListenFor:
      'A specific answer naming the work and its permit status is reassuring. A vague answer, or "I\'m not sure," is worth following up on with your agent before your option period ends.',
  },
  {
    id: 'flood_history_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    priority: 'medium',
    question: 'Has the property ever flooded, or had a water-damage insurance claim filed?',
    whyAsking:
      'Many states require sellers to disclose known flood history. Past flooding can affect future insurance cost and eligibility even for a home that is not in a mapped flood zone today.',
    whatToListenFor:
      'A clear "no," or a fully disclosed and repaired past incident, are both workable answers. A vague or evasive answer is worth asking your agent to pursue in writing.',
  },
  {
    id: 'septic_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    priority: 'lower',
    question:
      "If the home is on a septic system, when was it last pumped or inspected, and is there a diagram of the drain field?",
    whyAsking:
      'Septic issues are expensive to diagnose after the fact and are not part of a standard home inspection. This only matters if the home is not on municipal sewer.',
    whatToListenFor:
      "Recent service records and a drain field diagram are reassuring. If the seller isn't sure whether the home is on septic at all, confirm with your agent -- it changes what you need to check.",
  },

  // --- Era-gated: mirrors the year windows in inspectionPriorities.ts ---
  {
    id: 'lead_paint_seller',
    minYear: 1800,
    maxYear: 1977,
    priority: 'high',
    question: 'Has lead-based paint ever been tested for or remediated in this home?',
    whyAsking:
      'Homes built before 1978 may contain lead-based paint, and federal law requires sellers to disclose any known lead-based paint hazards.',
    whatToListenFor:
      'A specific answer with test or remediation records is reassuring. "Not that I know of" is common and not alarming on its own -- it just means you are relying on the standard disclosure paperwork rather than a confirmed test.',
  },
  {
    id: 'polybutylene_seller',
    minYear: 1978,
    maxYear: 1996,
    priority: 'high',
    question: 'Do you know what material the water supply lines are, and has the home ever had a full repipe?',
    whyAsking:
      'Homes built in this era sometimes used polybutylene supply piping, the subject of a major national class-action settlement after widespread failures. Many insurance carriers now decline or surcharge coverage on homes that still have it.',
    whatToListenFor:
      'Copper or PEX with documentation is reassuring. "Not sure" means your inspector should identify the material directly -- confirm before your option period ends, since it can affect insurability.',
  },
  {
    id: 'panel_seller',
    minYear: 1950,
    maxYear: 1989,
    priority: 'high',
    question: 'Do you know the brand of the electrical panel, and has it ever been evaluated by a licensed electrician?',
    whyAsking:
      'Certain panel brands installed roughly between the 1950s and 1980s have documented breaker failure-to-trip issues, and some insurance carriers decline to write policies on homes that still have them.',
    whatToListenFor:
      "A named brand with an electrician's sign-off is reassuring. If the seller doesn't know, ask your inspector to record the brand directly.",
  },
  {
    id: 'sewer_seller',
    minYear: 1800,
    maxYear: 1973,
    priority: 'medium',
    question: 'Has the sewer line ever been scoped with a camera? If so, when, and what did it show?',
    whyAsking:
      'Homes of this era commonly used cast iron drain lines, which have a typical service life of roughly 50 to 75 years -- putting a home this old at or past that window.',
    whatToListenFor:
      'A recent scope with no major findings is reassuring. No scope on record just means it hasn\'t been checked -- a camera scope by a licensed plumber is the only way to actually know.',
  },
  {
    id: 'systems_age_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR - 12,
    priority: 'medium',
    question: 'What year were the roof, HVAC system, and water heater last replaced? Do you have receipts or permits?',
    whyAsking:
      'Major systems have finite service lives -- roughly 15 to 25 years for a roof, 15 to 20 for HVAC, 8 to 12 for a water heater -- and a home of this age is old enough that at least one is typically due.',
    whatToListenFor:
      "Specific years with receipts are reassuring. A vague answer means your inspector should estimate remaining life directly from the equipment's data plates.",
  },

  // --- Region-gated: same EXPANSIVE_SOIL_REGIONS list as the foundation inspection items ---
  {
    id: 'foundation_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    counties: Object.keys(EXPANSIVE_SOIL_REGIONS),
    priority: 'high',
    question: 'Has the foundation ever been repaired, releveled, or had any warranty work performed? Is there paperwork?',
    whyAsking:
      'This region sits within the Texas Blackland Prairie / Gulf Coast expansive clay soil belt, where foundation movement is a well-documented regional issue.',
    whatToListenFor:
      "Paperwork with an engineer's sign-off and a transferable warranty is reassuring. \"Not that I know of\" in this region is worth a direct follow-up with a structural engineer.",
  },

  // --- Property-type gated: the one dimension inspectionPriorities.ts doesn't use ---
  {
    id: 'hoa_seller',
    minYear: 1800,
    maxYear: CURRENT_YEAR,
    propertyTypes: ['condo_or_multifamily'],
    priority: 'high',
    question:
      'Can I get the last two years of HOA or association meeting minutes, the reserve study, and any pending special assessments?',
    whyAsking:
      'Undisclosed special assessments and underfunded reserves are among the most commonly reported regrets for condo and HOA purchases, and neither is something a general home inspection covers.',
    whatToListenFor:
      'A funded reserve study and no pending assessments are reassuring. Reluctance to share minutes, or a "special assessment vote coming up," is worth investigating before you close.',
  },
];

const PRIORITY_ORDER: Record<QuestionPriority, number> = { high: 0, medium: 1, lower: 2 };

/**
 * Returns the seller-question script for a (year built, county, state, declared property type)
 * combination, or null when nothing applies. Follows the same fail-closed shape as
 * getInspectionPriorities: a missing/implausible year built returns null rather than a generic
 * fallback list, and property-type-gated questions simply don't fire when the type is unknown
 * (never guessed at).
 */
export function getSellerQuestions(
  yearBuilt: number | null | undefined,
  county: string | null | undefined,
  state: string | null | undefined,
  declaredPropertyType: DeclaredPropertyType | null | undefined
): SellerQuestionsResult | null {
  if (!yearBuilt || !Number.isFinite(yearBuilt)) return null;
  if (!isPlausibleYearBuilt(yearBuilt)) return null;

  // Same normalization as inspectionPriorities.ts -- these two must gate on identical county keys
  // or the foundation question and the foundation priority items drift apart.
  const normalizedCounty = normalizeCountyKey(county);
  const soilRegion = EXPANSIVE_SOIL_REGIONS[normalizedCounty];

  const matched = QUESTION_RULES.filter(
    (rule) =>
      yearBuilt >= rule.minYear &&
      yearBuilt <= rule.maxYear &&
      (!rule.counties || rule.counties.includes(normalizedCounty)) &&
      (!rule.propertyTypes || (declaredPropertyType != null && rule.propertyTypes.includes(declaredPropertyType)))
  );
  if (matched.length === 0) return null;

  const regionLabel = soilRegion?.label || buildFallbackRegionLabel(county, state);

  const questions = [...matched]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .map(({ minYear, maxYear, counties, propertyTypes, ...question }) => question);

  return {
    yearBuilt,
    eraLabel: getEraLabel(yearBuilt),
    regionLabel,
    questions,
  };
}
