import type { CanonicalFinding } from '../types.js';

// BeforeRegret's first genuinely live, confirmed data source (as opposed to the honest "not yet
// verified" placeholders every other canonical finding still carries). USGS's ASCE 7-22 seismic
// design API is free, requires no API key, and was empirically verified before wiring this in --
// tested against San Francisco (SDC D, Ss 1.57g) and SeaTac, WA (SDC D, Ss 1.64g), both correctly
// high, versus Austin, TX (SDC A, Ss 0.064g), correctly minimal. FEMA's own flood-zone API
// (hazards.fema.gov / msc.fema.gov) was tried first and rejected: both the official service and
// an Esri Hub-hosted listing of the same dataset are blocked/require additional authorization
// from this deployment's network path, with no independently-hosted alternative found.
const USGS_DESIGN_MAPS_URL = 'https://earthquake.usgs.gov/ws/designmaps/asce7-22.json';

interface SeismicDesignData {
  sdc: string;
  ss: number;
  s1: number;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function describeSeismicDesignCategory(sdc: string): { headline: string; nextStep: string } {
  switch (sdc) {
    case 'A':
      return {
        headline: 'minimal seismic design requirements -- this area has very low earthquake risk',
        nextStep: 'This is a standard, low seismic-risk area. No special earthquake-related questions are needed beyond your normal due diligence.',
      };
    case 'B':
      return {
        headline: 'low seismic design requirements -- earthquake risk here is low',
        nextStep: 'This is a low seismic-risk area. No special earthquake-related questions are typically needed.',
      };
    case 'C':
      return {
        headline: 'moderate seismic design requirements',
        nextStep: 'Ask the seller whether the home has had any seismic retrofitting, especially if it was built before modern seismic codes.',
      };
    default:
      // D, E, F -- high through very high.
      return {
        headline: 'high seismic design requirements, indicating meaningfully elevated regional earthquake risk',
        nextStep: 'Ask the seller about any seismic retrofitting, foundation bolting, or soft-story reinforcement, and consider getting an earthquake insurance quote.',
      };
  }
}

/**
 * Checks: real-time seismic design values (USGS ASCE 7-22) for the given coordinate.
 * Calls: earthquake.usgs.gov -- free, no API key.
 * On failure: returns null -- never throws, never fabricates a value. The caller is expected to
 * fall back to an honest "not yet verified" finding rather than silently omitting the section.
 */
export async function fetchSeismicHazardFinding(lat: number, lon: number): Promise<CanonicalFinding | null> {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  try {
    const url = `${USGS_DESIGN_MAPS_URL}?latitude=${lat}&longitude=${lon}&riskCategory=II&siteClass=D&title=BeforeRegret`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.response?.data;
    if (!result || typeof result.sdc !== 'string' || typeof result.ss !== 'number' || typeof result.s1 !== 'number') {
      return null;
    }

    const seismic: SeismicDesignData = { sdc: result.sdc, ss: result.ss, s1: result.s1 };
    const { headline, nextStep } = describeSeismicDesignCategory(seismic.sdc);

    return {
      id: 'f_seismic',
      subject: 'Seismic Design Category (USGS)',
      category: 'Environment',
      status: 'CONFIRMED RECORD',
      summaryText: `USGS places this location in Seismic Design Category ${seismic.sdc} -- ${headline}.`,
      whatWeFound: `USGS's ASCE 7-22 seismic design tool places this location in Seismic Design Category ${seismic.sdc}, based on a mapped short-period spectral acceleration (Ss) of ${seismic.ss}g and a 1-second spectral acceleration (S1) of ${seismic.s1}g, for standard Site Class D soil conditions and Risk Category II construction.`,
      whyItMatters: 'Seismic Design Category determines how much earthquake-resistant construction a building at this site is required to meet under current building code -- higher categories (D, E, F) indicate meaningfully higher regional earthquake risk and stricter, often costlier, structural requirements for new construction and major renovations.',
      suggestedNextStep: nextStep,
      sourceAgency: 'U.S. Geological Survey (USGS)',
      lastUpdated: 'ASCE 7-22 seismic design values (live query)',
    };
  } catch (err) {
    console.warn('[Seismic Hazard] USGS lookup failed:', err);
    return null;
  }
}
