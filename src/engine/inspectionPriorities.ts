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

export type PriorityLevel = 'high' | 'medium' | 'lower';

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

export interface InspectionPrioritiesResult {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  priorities: InspectionPriority[];
}

interface EraRuleSet {
  /** Inclusive year range this rule set applies to. */
  minYear: number;
  maxYear: number;
  eraLabel: string;
  regionLabel: string;
  /** Lowercased county names this applies to. Region-specific rules (soil, etc.) live here. */
  counties: string[];
  priorities: InspectionPriority[];
}

// v1 covers exactly one era band in one county. Everything outside it returns null rather than
// guessing -- adding coverage is filling in this table, not writing new logic.
const ERA_RULE_SETS: EraRuleSet[] = [
  {
    minYear: 1960,
    maxYear: 1969,
    eraLabel: '1960s construction',
    regionLabel: 'Travis County, TX',
    counties: ['travis county'],
    priorities: [
      {
        id: 'lead_paint_disclosure',
        title: 'Confirm you received the federal lead-paint disclosure',
        priority: 'high',
        eraBasis:
          'Lead-based paint was not banned in US residential use until 1978. Federal law requires sellers of homes built before 1978 to give buyers a lead-based paint disclosure, an EPA-approved pamphlet, and the opportunity to conduct a lead assessment.',
        costToCheck: 'Free — it is legally required',
        typicalRepairCost: null,
        howToCheck:
          'Ask your agent to confirm the federal lead-based paint disclosure is in your paperwork. If it is missing, request it before your option period ends.',
      },
      {
        id: 'sewer_cast_iron',
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
        id: 'foundation_expansive_clay',
        title: 'Get the slab looked at by a structural engineer',
        priority: 'high',
        eraBasis:
          'Central Texas has widespread expansive clay soils that shrink and swell with moisture. Slabs from this era generally predate post-tensioned slab construction, which became common in Texas residential building later.',
        costToCheck: '$400 – $800 for a structural engineer evaluation',
        typicalRepairCost: 'Foundation repair $5,000 – $30,000+ depending on scope',
        howToCheck:
          'Hire a licensed structural engineer directly. This is a separate engagement from your general home inspection, and the engineer works for you, not the seller.',
      },
      {
        id: 'electrical_panel_wiring',
        title: 'Identify the panel brand and branch wiring type',
        priority: 'high',
        eraBasis:
          'Aluminum branch wiring was used in some US homes built roughly between 1965 and 1973; the Consumer Product Safety Commission has published on associated fire risk. Separately, certain electrical panel brands common in this era have documented breaker problems, and some insurance carriers decline to write policies on them.',
        costToCheck: 'Usually included in a general inspection — just ask them to note it. Dedicated electrician evaluation $150 – $350.',
        typicalRepairCost: 'Aluminum wiring remediation $2,000 – $8,000+; panel replacement $1,500 – $4,000',
        howToCheck:
          'Ask your inspector to record the panel brand and the branch wiring material in writing, then confirm insurability with your insurance agent before your option period ends.',
      },
      {
        id: 'galvanized_supply',
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
        id: 'asbestos_materials',
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
        id: 'radon_test',
        title: 'Radon test',
        priority: 'lower',
        eraBasis:
          'Radon levels are driven by local geology rather than construction era, so this is not specific to a home of this vintage. Central Texas generally shows lower predicted indoor radon than much of the country.',
        costToCheck: '$150 – $300',
        typicalRepairCost: 'Mitigation system $800 – $2,500',
        howToCheck:
          'EPA recommends that every home be tested for radon regardless of its predicted zone, and that guidance does not change here. This is ranked lower only because the items above are more specific to homes of this era — not as a recommendation against testing.',
      },
    ],
  },
];

/**
 * Returns the inspection priorities for a (year built, county) pair, or null when no rule set
 * covers it. Null is the correct, honest answer for the overwhelming majority of US addresses
 * right now -- callers must render nothing rather than falling back to generic filler.
 */
export function getInspectionPriorities(
  yearBuilt: number | null | undefined,
  county: string | null | undefined
): InspectionPrioritiesResult | null {
  if (!yearBuilt || !Number.isFinite(yearBuilt)) return null;

  const normalizedCounty = (county || '').toLowerCase().trim();
  if (!normalizedCounty) return null;

  const ruleSet = ERA_RULE_SETS.find(
    (rs) =>
      yearBuilt >= rs.minYear &&
      yearBuilt <= rs.maxYear &&
      rs.counties.includes(normalizedCounty)
  );
  if (!ruleSet) return null;

  return {
    yearBuilt,
    eraLabel: ruleSet.eraLabel,
    regionLabel: ruleSet.regionLabel,
    priorities: ruleSet.priorities,
  };
}

/** Shared validation for the user-supplied year-built input. */
export function isPlausibleYearBuilt(value: number): boolean {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(value) && value >= 1800 && value <= currentYear;
}
