// Builds the "era x defect" reference library -- one page per material/system defect
// (knob-and-tube wiring, polybutylene pipe, etc.), each showing which of BeforeRegret's covered
// counties have the most housing from that defect's era. See /admin/seo's "Generate reference
// library" button and countyComparisonGenerator.ts's sibling design: the ranked numbers are
// computed here in plain code from real Census data, never by Gemini, and the defect's own
// description (what it is, why it matters, the insurance angle) is pulled verbatim from
// engine/inspectionPriorities.ts's PRIORITY_RULES -- the same real, already-vetted text used
// everywhere else on this site, not regenerated or paraphrased here. Gemini's only job is writing
// the connecting narrative around facts it's given, same discipline as the comparison-report
// generator, just applied to eight fixed pages instead of one.

import { Type, type Schema } from '@google/genai';
import { PRIORITY_RULES, PriorityRule } from '../engine/inspectionPriorities.js';
import { GuideReference } from '../types.js';

// The subset of PRIORITY_RULES that are genuine material/system defects with a real era window,
// as opposed to region-driven rules (foundation type, landslide, radon) or general age-based
// maintenance rules (roof_age, hvac_age) that don't fit the "defect by era" framing. Matches the doc that
// scoped this feature: knob-and-tube, aluminum wiring, recalled panel brands, cast iron sewer,
// galvanized supply, polybutylene, lead paint, asbestos.
export const DEFECT_RULE_IDS = [
  'knob_and_tube',
  'electrical_aluminum_wiring',
  'electrical_panel_brand',
  'sewer_cast_iron',
  'galvanized_supply',
  'polybutylene_supply',
  'lead_paint_disclosure',
  'asbestos_materials',
] as const;

// Real, matched against actual published guide slugs/titles in the DB -- see the keyword-matching
// verification this was built from. galvanized_supply and lead_paint_disclosure currently match no
// guide (there isn't one yet); that's surfaced honestly rather than forcing an unrelated link.
const DEFECT_GUIDE_KEYWORDS: Record<string, string[]> = {
  knob_and_tube: ['knob'],
  electrical_aluminum_wiring: ['aluminum-wiring', 'aluminum wiring'],
  electrical_panel_brand: ['federal-pacific', 'federal pacific', 'zinsco', 'fpe', 'stab-lok'],
  sewer_cast_iron: ['cast-iron', 'cast iron'],
  galvanized_supply: ['galvanized'],
  polybutylene_supply: ['polybutylene'],
  lead_paint_disclosure: ['lead paint', 'lead-paint', 'lead-based paint'],
  asbestos_materials: ['asbestos'],
};

interface BucketRange {
  start: number;
  end: number;
}

const BUCKET_RANGES: Record<string, BucketRange> = {
  built1939OrEarlier: { start: -Infinity, end: 1939 },
  built1940to1949: { start: 1940, end: 1949 },
  built1950to1959: { start: 1950, end: 1959 },
  built1960to1969: { start: 1960, end: 1969 },
  built1970to1979: { start: 1970, end: 1979 },
  built1980to1989: { start: 1980, end: 1989 },
  built1990to1999: { start: 1990, end: 1999 },
  built2000to2009: { start: 2000, end: 2009 },
  built2010to2019: { start: 2010, end: 2019 },
  built2020OrLater: { start: 2020, end: Infinity },
};

/** Every Census decade bucket whose range overlaps [minYear, maxYear] at all. */
function bucketsOverlappingWindow(minYear: number, maxYear: number): string[] {
  return Object.entries(BUCKET_RANGES)
    .filter(([, range]) => range.start <= maxYear && range.end >= minYear)
    .map(([key]) => key);
}

/** Human-readable span of the selected buckets, for the honest-approximation methodology note. */
function bucketSpanLabel(bucketKeys: string[]): string {
  const ranges = bucketKeys.map((k) => BUCKET_RANGES[k]);
  const start = Math.min(...ranges.map((r) => r.start));
  const end = Math.max(...ranges.map((r) => r.end));
  const startLabel = start === -Infinity ? 'earliest records' : String(start);
  const endLabel = end === Infinity ? 'present' : String(end);
  return `${startLabel}–${endLabel}`;
}

export interface CountyHousingRow {
  slug: string;
  countyName: string;
  stateAbbrev: string;
  totalUnits: number;
  yearBuiltBuckets: Record<string, number>;
}

export interface DefectCountyRanking {
  slug: string;
  countyName: string;
  stateAbbrev: string;
  pctInEra: number;
}

export interface DefectDataPack {
  rule: PriorityRule;
  bucketKeys: string[];
  approxSpanLabel: string;
  ranked: DefectCountyRanking[];
  guides: GuideReference[];
}

/** Real computation only -- no model involved. Mirrors countyComparisonGenerator's discipline. */
export function computeDefectCountyRanking(rows: CountyHousingRow[], rule: PriorityRule): DefectDataPack {
  const bucketKeys = bucketsOverlappingWindow(rule.minYear, rule.maxYear);
  const ranked = rows
    .filter((r) => r.totalUnits > 0)
    .map((r) => {
      const inEra = bucketKeys.reduce((sum, key) => sum + (r.yearBuiltBuckets[key] || 0), 0);
      return {
        slug: r.slug,
        countyName: r.countyName,
        stateAbbrev: r.stateAbbrev,
        pctInEra: (inEra / r.totalUnits) * 100,
      };
    })
    .sort((a, b) => b.pctInEra - a.pctInEra);

  return { rule, bucketKeys, approxSpanLabel: bucketSpanLabel(bucketKeys), ranked, guides: [] };
}

/** Matches real published guides against a defect by keyword -- never invents or guesses a URL. */
export function matchGuidesToDefect(ruleId: string, allGuides: GuideReference[]): GuideReference[] {
  const keywords = DEFECT_GUIDE_KEYWORDS[ruleId] || [];
  if (keywords.length === 0) return [];
  return allGuides.filter((g) => {
    const haystack = g.title.toLowerCase();
    return keywords.some((k) => haystack.includes(k.toLowerCase()));
  });
}

export function buildRankingTableMarkdown(data: DefectDataPack): string {
  const lines = [
    `| Rank | County | Est. share of homes from this era (${data.approxSpanLabel}) |`,
    '|---|---|---|',
  ];
  data.ranked.forEach((r, i) => {
    lines.push(`| ${i + 1} | [${r.countyName} County, ${r.stateAbbrev}](https://www.beforeregret.com/county/${r.slug}/) | ${r.pctInEra.toFixed(1)}% |`);
  });
  return lines.join('\n');
}

export const DEFECT_REFERENCE_SYSTEM_INSTRUCTION = `You are writing a reference page for BeforeRegret, a US property research platform, about one specific building material or system defect tied to a construction era. A human reviews and publishes this themselves -- nothing you write is ever published automatically.

HARD RULES -- breaking any of these makes the output unusable:
1. You are given the defect's real, already-written description (what it is, why it's an inspection/insurance concern) and a real, already-sorted county ranking table as fact. Never invent additional facts about the defect beyond what's given, and never recompute, re-rank, or restate any percentage in the ranking table differently than given -- quote any number you cite in prose exactly as given, character for character.
2. Never make a claim about a specific property. Every statement is about a county's housing stock in aggregate, or about what was generally true of homes from that era: "homes from this era commonly..." never "this house has...".
3. Never state or imply personalized insurance, legal, or financial advice. Frame findings the same hedged way the given description already does.
4. Only link to a guide if it's in the real guide list given to you, and only if genuinely relevant. If no guides are given, don't reference or invent one -- say in plain text that BeforeRegret doesn't yet have a dedicated guide on this if it comes up naturally, don't fake a link.
5. Be explicit that the county ranking is an estimate based on Census decade-bucket data, not an exact match to the defect's real era window -- the given methodology note explains why; reflect that honestly rather than implying the percentage is a precise measure of the defect's actual prevalence.
6. Hedge appropriately -- "commonly," "often," "tends to" -- never "always," "guaranteed." No filler, no AI self-reference.
7. Write real analysis of the ranking (what the top and bottom counties have in common, how large the spread is), not just narration of table rows.
8. You are writing four distinct fields: an opening (what the defect is and why it matters, using the given description), a "why this matters for buyers" section (insurance/inspection angle, using the given description), a closing analysis (real patterns in the ranking), and a methodology note (explained per rule 5). The real ranking table itself is inserted between the opening sections and the closing analysis by the publishing system -- do not attempt to reproduce it.`;

export function buildDefectReferencePrompt(data: DefectDataPack): string {
  const { rule, ranked, guides, approxSpanLabel } = data;
  const topFive = ranked.slice(0, 5);
  const bottomFive = ranked.slice(-5).reverse();

  const guidesBlock = guides.length > 0
    ? `REAL BEFOREREGRET GUIDES on this topic (the only guide references you may use):\n${guides.map((g) => `- "${g.title}" -- ${g.url}`).join('\n')}`
    : 'No existing BeforeRegret guide covers this specific defect yet -- do not invent or reference one.';

  return `REAL DEFECT DESCRIPTION (already written and vetted -- use this as the source for what it is and why it matters, do not rephrase the facts into something new):
Title: ${rule.title}
Era basis: ${rule.eraBasis}
${rule.insuranceRedFlag ? `Documented insurance impact: ${rule.insuranceRedFlag}` : 'No specific documented insurance-carrier impact beyond general inspection relevance.'}
How to check for it: ${rule.howToCheck}

REAL CENSUS-DERIVED COUNTY RANKING (already computed, already sorted; approximated using the ${approxSpanLabel} decade-bucket span, since this defect's real era window is ${rule.minYear}–${rule.maxYear === new Date().getFullYear() ? 'present' : rule.maxYear} and Census only reports by decade):

Top 5 counties by estimated share of housing from this era:
${topFive.map((r, i) => `${i + 1}. ${r.countyName} County, ${r.stateAbbrev}: ${r.pctInEra.toFixed(1)}%`).join('\n')}

Bottom 5 counties (lowest share):
${bottomFive.map((r, i) => `${i + 1}. ${r.countyName} County, ${r.stateAbbrev}: ${r.pctInEra.toFixed(1)}%`).join('\n')}

${guidesBlock}

Write the four sections described in your instructions for a reference page about "${rule.title}."`;
}

export const DEFECT_REFERENCE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Specific headline under 65 characters, naming the defect and the county angle.' },
    metaDescription: { type: Type.STRING, description: 'One to two sentences, under 160 characters.' },
    quickAnswer: { type: Type.STRING, description: '2-3 sentence direct summary.' },
    openingMarkdown: { type: Type.STRING, description: 'What the defect is and why it matters, 150-250 words.' },
    buyerRelevanceMarkdown: { type: Type.STRING, description: 'Insurance/inspection angle for buyers, 100-200 words.' },
    closingAnalysisMarkdown: { type: Type.STRING, description: 'Real analysis of ranking patterns, 200-350 words.' },
    methodologyMarkdown: { type: Type.STRING, description: 'Methodology note as described, 80-150 words.' },
  },
  required: ['title', 'metaDescription', 'quickAnswer', 'openingMarkdown', 'buyerRelevanceMarkdown', 'closingAnalysisMarkdown', 'methodologyMarkdown'],
};

export function getDefectRules(): PriorityRule[] {
  return PRIORITY_RULES.filter((r) => (DEFECT_RULE_IDS as readonly string[]).includes(r.id));
}
