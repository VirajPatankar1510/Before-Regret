// Builds the prompt for the per-county narrative that appears on a /county/<slug>/ page.
//
// WHY THIS EXISTS -- the measurement, not a hunch. Search Console's URL Inspection API reports
// the county pages as "Discovered - currently not indexed", while /, /guides/ and /counties/ are
// all "Submitted and indexed". So Google can crawl the site fine and has found these URLs; it has
// looked at them and declined. Diffing two unrelated county pages (Cook County IL vs Maricopa
// County AZ), with the place names normalised away, showed why: 591 identical words to 154 unique
// ones -- 79% boilerplate on a ~700-word page, where the "unique" part is almost entirely bare
// data labels ("Very High Winter Weather", "519 Hail 171 Flood 108"). One template, numbers
// swapped, 100 times. That is the scaled-content pattern, and 100 pages is 38% of the whole site.
//
// This generator's single job is to make the PROSE differ, not just the numbers. The data to do
// it honestly is already there and already on the page -- Cook's story is winter weather, tornado
// and pre-1950 housing stock; Maricopa's is heat, drought and post-1980 construction. Those are
// genuinely different articles about genuinely different places. The failure was never a lack of
// facts; it was wrapping every county's facts in one fixed narrative shell.
//
// Anti-fabrication posture is inherited wholesale from countyEventGenerator.ts, whose county-data
// and era-insight blocks this reuses rather than restating -- one source of truth for how a
// county's real numbers get described to a model.
import { Type, type Schema } from '@google/genai';
import {
  buildCountyDataBlock,
  buildEraInsightsBlock,
  type CountyEventCountyContext,
  type EraInsightsContext,
} from './countyEventGenerator.js';

export const COUNTY_NARRATIVE_SYSTEM_INSTRUCTION = `You are writing the analysis section of a county property-research page for BeforeRegret, a US property research platform. A home buyer looking at this county reads this to understand what actually matters HERE, as opposed to anywhere else in the country. Everything you write is a draft a human reviews before it goes live.

THE ONE THING THAT MATTERS MOST: this page is one of a hundred county pages, and the previous version of them was 79% identical to each other -- the same paragraphs with different numbers dropped in. That is why they are worth nothing to a reader and why search engines declined to index them. Your job is to write something that could ONLY have been written about this specific county. If a sentence you write would be equally true of a county two states away, delete it and write a different sentence.

HARD RULES -- breaking any of these makes the output unusable:
1. Only use facts given to you in this prompt: the real FEMA risk data, the real NOAA storm counts, the real EPA radon zone, the real Census-derived dominant housing era, and the real inspection-priority and insurance-red-flag rules computed for that era. Never invent a statistic, a dollar figure, a date, a local ordinance, a neighborhood name, or a historical event. If you do not have a number, do not imply one.
2. Lead with what is genuinely distinctive about THIS county -- the combination of its top hazards and its dominant housing era. Do not open with a generic scene-setter ("Buying a home is one of the biggest decisions..."), the county's name and population restated as a sentence, or anything that reads like an introduction to the topic of home buying in general.
3. There is NO fixed section order and no required section list. Let the county's own data decide the shape. A county whose defining facts are hurricane exposure and 1990s construction should read nothing like one defined by winter weather and pre-1950 housing -- different emphasis, different section headings, different length distribution between sections. Deliberately do not reach for the same headings you would write for a different county.
4. Never make a claim about a specific property or address. Every statement is class-level: "homes built in this county's dominant era commonly..." never "this house has...".
5. Never state or imply personalized insurance, legal, tax, or financial advice, and never predict any individual outcome. "Some insurers have documented declining coverage for X" -- never "you will not be able to insure this."
6. Never state a legal requirement as universal when the rule carries exceptions. Say who it actually binds. If a rule applies only to FHA-insured loans, only to landlords, only to paid contractors, or only in one state, say so in the same sentence that states the duty.
7. Hedge appropriately -- "commonly," "often," "can," "may" -- never "always," "will," "guaranteed."
8. Never invent a URL, and never write out a URL yourself. You may cite an organization by its short bracket code from the approved list given to you ([FEMA], [EPA], [NOAA], [HUD] etc.), and only where that organization is genuinely the authority for that specific claim.
9. Write like a researcher who knows this county, not like a template. Vary sentence length. No "In today's market," no "In conclusion," no listicle padding, no restating the data tables that already appear elsewhere on the page -- the reader can see the numbers; your job is to say what they MEAN together.
10. Ground every risk claim in the data given. If the inspection priorities given to you do not mention a building system, do not invent a claim about it.

LENGTH: 400-600 words of substantive analysis. Quality and specificity over length -- do not pad to hit a number.`;

export interface CountyNarrativeParams {
  county: CountyEventCountyContext;
  era: EraInsightsContext;
  /** Published guides the narrative may reference by title, for the human reviewer's benefit. */
  relatedGuideTitles: string[];
  approvedSourceCodes: string[];
}

export function buildCountyNarrativePrompt(params: CountyNarrativeParams): {
  systemInstruction: string;
  contents: string;
} {
  const { county, era, relatedGuideTitles, approvedSourceCodes } = params;

  const guidesBlock = relatedGuideTitles.length > 0
    ? `\n\nEXISTING GUIDES on this site whose subject matter may genuinely overlap this county's profile. Mention a topic only where this county's own data actually makes it relevant -- do not list them, and do not write out any URL:\n${relatedGuideTitles.map((t) => `- ${t}`).join('\n')}`
    : '';

  const contents = `Write the analysis section for the ${county.countyName} County, ${county.stateAbbrev} property-research page.

${buildCountyDataBlock(county)}

${buildEraInsightsBlock(era)}

APPROVED CITATION CODES (the only ones you may use, in square brackets): ${approvedSourceCodes.join(', ')}${guidesBlock}

Before writing, decide the single most distinctive thing about this county from the data above -- the interaction between its highest-scoring hazards and the era most of its housing was built in. Build the whole piece around that. Then write it as Markdown, using H2 headings (##) whose wording you choose to fit THIS county rather than a reusable set.`;

  return { systemInstruction: COUNTY_NARRATIVE_SYSTEM_INSTRUCTION, contents };
}

export const COUNTY_NARRATIVE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    // Not rendered as a page title -- the page already has an H1. This is the reviewer's summary
    // of the angle taken, which is also the fastest way for a human to spot two counties that came
    // back with the same story and send one of them back.
    angle: {
      type: Type.STRING,
      description: 'One sentence naming the distinctive county-specific angle this piece is built around.',
    },
    narrativeMarkdown: {
      type: Type.STRING,
      description: 'The analysis, 400-600 words of Markdown with ## headings chosen to fit this county.',
    },
  },
  required: ['angle', 'narrativeMarkdown'],
};
