// Builds the prompt for AI-drafted "what this FEMA declaration means for homes in this county"
// articles (see POST /api/admin/county-events/check). Same anti-fabrication posture as
// articleGenerator.ts, adapted for a specific, higher-stakes
// grounding requirement: every article here is triggered by a real disaster, so overclaiming
// urgency or certainty isn't just a style problem, it's the exact failure mode that would corrode
// the trust this site's whole $14.99 report depends on (see the "staleness and false urgency"
// seam identified when this feature was scoped). The one non-negotiable structural rule below --
// the declaration must be named and linked by its real number, not just "FEMA data" -- exists so
// a human reviewer can verify the trigger really happened in under a minute by clicking the link,
// and so can the reader.

import { Type, type Schema } from '@google/genai';
import { GuideReference } from '../types.js';

export const COUNTY_EVENT_SYSTEM_INSTRUCTION = `You are drafting an article for BeforeRegret, a US property research platform, about a real FEMA disaster declaration that just landed in a county BeforeRegret already covers with real federal data. The article is a draft for a human to review and publish themselves -- nothing you write is ever published automatically.

HARD RULES -- breaking any of these makes the output unusable:
1. Only use facts given to you in this prompt: the real declaration details, the real county risk/hazard/housing data, and the real inspection-priority and insurance-red-flag rules already computed for this county's dominant housing era. Never invent a casualty count, a dollar damage estimate, a specific address, or any detail about the disaster beyond what the declaration data actually states. The declaration data given to you does NOT include damage or casualty figures -- if you don't have a number, don't state one, even a vague one like "significant damage" implying a scale you don't actually know.
2. You must name the declaration by its real designation (the femaDeclarationString, e.g. "FM-5667-NV") and link it using the exact URL given to you, at least once, near the top of the article. This is the anchor that lets a reviewer verify the trigger is real by clicking one link. Never write "FEMA data" or "federal officials" without that specific link nearby.
3. Never make a claim about a specific property. Every statement about housing risk is class-level: "homes built in this county's dominant era commonly..." never "this house has...". This is the same rule the rest of this site's inspection-priority content already follows, and it applies here too.
4. Never state or imply personalized insurance, legal, or financial advice, and never predict what will happen to any particular homeowner. Frame findings as "some insurers have documented..." or "homes with X commonly face..." -- never "you will/won't be covered" or "your home is at risk."
5. Do not manufacture urgency beyond what the declaration itself supports. This is contextual analysis for buyers and owners in the area, not breaking-news alarm -- no countdown language, no "act now," no implying anyone is in immediate danger. If the declaration is for an incident that already happened and is being assessed (the normal case), say so plainly rather than writing as if the event is still unfolding.
6. Never invent a URL. The only links you may use are the declaration URL given to you, the county page URL given to you, and any guide URLs given to you -- and only cite a guide if it genuinely matches what a reader in this situation would need next. You may also cite an organization by its short bracket code from the approved list in the prompt, same convention as this site's other articles -- never write out a URL for one of those yourself.
7. Ground every housing-risk claim in the real county data and real inspection-priority/insurance-red-flag content given to you. Do not add building-science claims beyond what's provided -- if the given inspection priorities don't mention a system, don't invent a claim about it just because it seems plausible for the era.
8. Hedge appropriately -- "commonly," "often," "can," "may" -- never "always," "will," "guaranteed." No filler ("In today's world..."), no listicle padding, no AI self-reference.
9. End with one clear, concrete next step -- confirming insurance coverage, checking the county's real risk data, or similar -- never a generic "stay safe" close.`;

export interface FemaDeclarationContext {
  disasterNumber: number;
  femaDeclarationString: string;
  declarationTitle: string;
  incidentType: string;
  declarationDate: string;
  incidentBeginDate: string | null;
  declarationUrl: string;
}

export interface CountyEventCountyContext {
  countyName: string;
  stateAbbrev: string;
  countyUrl: string;
  femaRiskRating: string | null;
  femaRiskScore: number | null;
  femaHazards: Record<string, { rating: string; score: number | null }>;
  noaaEventCounts: Record<string, number>;
  noaaYearsCovered: string | null;
  radonZone: number | null;
  dominantEraLabel: string;
}

export interface EraInsightsContext {
  regionLabel: string;
  priorities: Array<{ title: string; priority: string; eraBasis: string }>;
  insuranceRedFlags: string[];
}

const FEMA_HAZARD_LABELS: Record<string, string> = {
  AVLN: 'Avalanche', CFLD: 'Coastal Flooding', CWAV: 'Cold Wave', DRGT: 'Drought',
  ERQK: 'Earthquake', HAIL: 'Hail', HWAV: 'Heat Wave', HRCN: 'Hurricane',
  ISTM: 'Ice Storm', LNDS: 'Landslide', LTNG: 'Lightning', IFLD: 'Inland Flooding',
  SWND: 'Strong Wind', TRND: 'Tornado', TSUN: 'Tsunami', VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire', WNTW: 'Winter Weather',
};

function buildCountyDataBlock(county: CountyEventCountyContext): string {
  const topHazards = Object.entries(county.femaHazards)
    .filter(([, v]) => v && typeof v.score === 'number')
    .sort((a, b) => (b[1].score as number) - (a[1].score as number))
    .slice(0, 3)
    .map(([code, v]) => `${FEMA_HAZARD_LABELS[code] || code} (${v.rating}, ${v.score?.toFixed(1)})`);

  const topNoaa = Object.entries(county.noaaEventCounts)
    .filter(([, n]) => typeof n === 'number' && n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${count} ${type}`);

  return `REAL COUNTY DATA -- ${county.countyName} County, ${county.stateAbbrev} (only use these numbers, never round differently or restate them as something they're not):
- FEMA National Risk Index: ${county.femaRiskRating ?? 'not available'}${county.femaRiskScore != null ? ` (${county.femaRiskScore.toFixed(1)} percentile)` : ''}
- Top-scored FEMA hazards: ${topHazards.length > 0 ? topHazards.join('; ') : 'not available'}
- NOAA recorded storm events${county.noaaYearsCovered ? ` (${county.noaaYearsCovered})` : ''}: ${topNoaa.length > 0 ? topNoaa.join('; ') : 'not available'}
- EPA radon zone: ${county.radonZone != null ? `Zone ${county.radonZone} of 3 (1 = highest potential)` : 'not available'}
- Dominant housing era (by Census-reported share of housing stock): ${county.dominantEraLabel}
- County page (the only county-level URL you may use): ${county.countyUrl}`;
}

function buildEraInsightsBlock(era: EraInsightsContext): string {
  const prioritiesList = era.priorities
    .map((p) => `- [${p.priority}] ${p.title}: ${p.eraBasis}`)
    .join('\n');
  const flagsList = era.insuranceRedFlags.length > 0
    ? era.insuranceRedFlags.map((f) => `- ${f}`).join('\n')
    : 'None of the era-specific rules for this county carry a documented insurance angle -- do not invent one.';

  return `REAL ERA-BASED INSPECTION PRIORITIES for ${era.regionLabel} (already computed by this site's inspection-priorities engine for the dominant construction era above -- ground any housing-risk-and-era claim in these, don't invent your own):
${prioritiesList}

REAL INSURANCE RED FLAGS already documented for this era/region:
${flagsList}`;
}

function buildGuidesBlock(guides: GuideReference[]): string {
  if (guides.length === 0) {
    return 'No guide list was available -- do not reference or link to any specific BeforeRegret guide by name.';
  }
  const list = guides.map((g) => `- "${g.title}" -- ${g.url}`).join('\n');
  return `REAL BEFOREREGRET GUIDES (the only guide URLs you may ever use, and only if genuinely relevant to a reader dealing with this declaration):
${list}`;
}

export function buildCountyEventPrompt(params: {
  declaration: FemaDeclarationContext;
  county: CountyEventCountyContext;
  era: EraInsightsContext;
  guides: GuideReference[];
  knownSourcesBlock: string;
}): string {
  const { declaration, county, era, guides, knownSourcesBlock } = params;
  return `REAL FEMA DECLARATION (the trigger for this article -- name and link it near the top exactly as instructed):
- Designation: ${declaration.femaDeclarationString} (disaster number ${declaration.disasterNumber})
- Title: ${declaration.declarationTitle}
- Incident type: ${declaration.incidentType}
- Declaration date: ${declaration.declarationDate}
- Incident begin date: ${declaration.incidentBeginDate ?? 'not given'}
- Declaration URL (the only URL for this specific declaration -- use exactly this): ${declaration.declarationUrl}

${buildCountyDataBlock(county)}

${buildEraInsightsBlock(era)}

${buildGuidesBlock(guides)}

Organizations you may cite by bracket code (e.g. "[FEMA]"), only when genuinely relevant to a specific claim -- never write a URL for one of these yourself:
${knownSourcesBlock}

Write one article: what this declaration means for homes in ${county.countyName} County, ${county.stateAbbrev}, grounded entirely in the real data above. Target 600-900 words -- shorter than this site's evergreen guides, since this is a timely contextual piece, not a comprehensive reference. Structure with markdown headers. Quick answer should be a 2-3 sentence direct summary of what just happened and what it means for the housing stock here, suitable for a search snippet.`;
}

export const COUNTY_EVENT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Specific, compelling headline under 65 characters, naming the county and the event.' },
    metaDescription: { type: Type.STRING, description: 'One to two sentences, under 160 characters.' },
    quickAnswer: { type: Type.STRING, description: 'The 2-3 sentence direct summary described in the instructions.' },
    bodyMarkdown: { type: Type.STRING, description: 'The full article body in markdown, 600-900 words, following all hard rules.' },
    sourcesUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Bracket codes from the approved organization list that were actually cited in the body, if any.',
    },
  },
  required: ['title', 'metaDescription', 'quickAnswer', 'bodyMarkdown', 'sourcesUsed'],
};
