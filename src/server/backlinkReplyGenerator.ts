// Builds the prompt for AI-drafted forum replies (the "Generate reply" button in
// BacklinksAdminPanel.tsx). This is not a "make it undetectable" prompt, and deliberately so:
// what actually makes a reply read as genuinely human is the same thing that makes it a good
// answer -- specific, honest about what it doesn't know, proportionate in length, no forced
// pitch. Optimizing directly for "evade AI-detection" would mean optimizing for deception (both
// of the forum's own community-content rules and of whoever reads the reply), which is a
// different goal than optimizing for quality, and this site's whole editorial voice throughout
// articleGenerator.ts already rejects that same shortcut for the same reason. So this prompt asks
// for the honest version of the same output: something a specific, informed person would actually
// write, because it's true and useful, not something engineered to pass a detector.

import { Type, type Schema } from '@google/genai';

// The literal token the model inserts into `reply` in place of a link to a guide that doesn't
// exist yet. Deliberately loud and bracketed so it can't be mistaken for real prose if an admin
// forgets to replace it before posting -- and so the UI can reliably detect it client-side to
// warn on copy, and substitute a real URL into it with a plain string replace (no API call).
export const NEW_GUIDE_URL_PLACEHOLDER = '[[NEW_GUIDE_URL]]';

export const BACKLINK_REPLY_SYSTEM_INSTRUCTION = `You are drafting a forum reply for a real BeforeRegret team member to review, edit, and post themselves, under their own account, on a real forum thread (City-Data, Bogleheads, or similar). The output is a draft for a human to approve -- nothing you write is ever posted automatically.

HARD RULES -- breaking any of these makes the output unusable:
1. Only use facts given to you in this prompt: the real thread text, the real county data block if one is provided, and the list of real BeforeRegret guides if one is provided. Never invent a statistic, a detail about the original poster's situation, or anything not actually in what you were given.
2. Never fabricate a first-person experience ("this happened to me too," "we went through the same thing"). This is a business account sharing genuinely useful information, not a pretend homeowner with a made-up story.
3. Mention beforeregret.com, or link to a specific page, only if it is genuinely the most useful next step for what the original poster actually asked. Never force a mention or a link in just because one is available -- if none of the county page, the listed guides, or a new guide (see rule 9) is actually the right next step for this specific question, answer without a link. A reply that helps without a link is a better outcome than one that reads like an ad, and a reply that reads like an ad is the one thing guaranteed to get flagged and removed by the community. If a guide is offered, check that it actually matches this poster's situation (their role -- buyer vs. current owner, their actual question) before citing it, not just the general topic.
4. Never invent a URL. The only links you may use are the exact county page URL and the exact guide URLs given to you in this prompt, if any are given, or the placeholder token described in rule 9. If you don't have a real URL for something, name it in plain text with no link.
5. Answer the actual question in the real thread text. If the thread's real content differs from the topic summary you were also given, follow the real thread -- the summary was written from a search snippet before the thread was actually read, so it can be incomplete or slightly off.
6. No hedged filler, no "I hope this helps!", no exclamation-point enthusiasm, no corporate tone, no "As an AI" or any self-reference to being generated. Write the way a specific, informed person writes when they're actually trying to help: direct, plainly worded, a little informal, confident about what you know, honest about what you don't.
7. Length matches a real forum reply -- a short paragraph or two, not an essay. An over-structured, over-long reply is itself a tell; real forum replies are brief.
8. Never state or imply certainty you don't have data for. If the county data wasn't provided, or doesn't cover what's actually being asked, say so plainly instead of guessing or generalizing past what you know.
9. There are exactly three ways this can end, and you must pick the right one:
   a. An existing guide from the list genuinely matches the poster's situation -> cite it by its real title and use its real URL in "reply", exactly as given to you. Set "suggestedGuideTitle" to null.
   b. No existing guide matches, but a specific, real guide on this exact topic would genuinely be the best next step for this poster -- not a vague "we should write about this someday," but a gap specific enough that a person could write that guide today. In this case, write "reply" so that where the link would naturally go, you insert the literal text ${NEW_GUIDE_URL_PLACEHOLDER} (that exact token, nothing else -- no URL, no guide name repeated as a fake link) as if it already were the link. Then set "suggestedGuideTitle" to a real, specific, SEO-style title for that guide, under 60 characters, written in the same style as the titles in the real guide list you were given (e.g. "Can You Get Home Insurance with Polybutylene Plumbing?" or "Are Manufactured Homes a Bad Investment?") -- not a vague topic label like "Plumbing Guide."
   c. Neither an existing guide nor a new one is genuinely the right next step (the county page might still be relevant on its own, or nothing is). Write "reply" with no guide link and no placeholder token. Set "suggestedGuideTitle" to null.
   Only ever use case (b) when the gap is real and specific -- not for every thread that happens to lack a matching guide. Most replies should land in (a) or (c).`;

export interface GuideReference {
  title: string;
  url: string;
}

export interface CountyContextForReply {
  countyName: string;
  stateAbbrev: string;
  femaRiskRating: string | null;
  femaRiskScore: number | null;
  femaHazards: Record<string, { rating: string; score: number | null }>;
  noaaEventCounts: Record<string, number>;
  noaaYearsCovered: string | null;
  radonZone: number | null;
  countyUrl: string;
}

const FEMA_HAZARD_LABELS: Record<string, string> = {
  AVLN: 'Avalanche', CFLD: 'Coastal Flooding', CWAV: 'Cold Wave', DRGT: 'Drought',
  ERQK: 'Earthquake', HAIL: 'Hail', HWAV: 'Heat Wave', HRCN: 'Hurricane',
  ISTM: 'Ice Storm', LNDS: 'Landslide', LTNG: 'Lightning', IFLD: 'Inland Flooding',
  SWND: 'Strong Wind', TRND: 'Tornado', TSUN: 'Tsunami', VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire', WNTW: 'Winter Weather',
};

function buildCountyContextBlock(county: CountyContextForReply): string {
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
- County page (the only URL you may use for this county): ${county.countyUrl}`;
}

function buildGuidesBlock(guides: GuideReference[]): string {
  if (guides.length === 0) {
    return 'No guide list was available for this generation -- do not reference or link to any specific BeforeRegret guide by name.';
  }
  const list = guides.map((g) => `- "${g.title}" -- ${g.url}`).join('\n');
  return `REAL BEFOREREGRET GUIDES (the only guide URLs you may ever use -- do not invent a URL for a guide not in this list, and do not cite one that doesn't genuinely match the poster's actual situation just because the general topic overlaps):
${list}`;
}

export function buildBacklinkReplyPrompt(params: {
  threadTitle: string;
  threadUrl: string;
  topicSnippet: string;
  threadText: string;
  county: CountyContextForReply | null;
  guides: GuideReference[];
}): string {
  const { threadTitle, threadUrl, topicSnippet, threadText, county, guides } = params;
  return `THREAD: "${threadTitle}" (${threadUrl})

WHY THIS THREAD WAS FLAGGED AS RELEVANT (a note written before the thread was read in full -- may be incomplete, defer to the actual thread text below if they differ):
${topicSnippet || '(no note provided)'}

ACTUAL THREAD TEXT, PASTED BY A HUMAN WHO READ IT (this is the ground truth -- answer what's actually here):
${threadText}

${county ? buildCountyContextBlock(county) : 'No county data available for this thread -- do not reference specific FEMA/NOAA/EPA numbers.'}

${buildGuidesBlock(guides)}

Draft one forum reply responding to the actual question or situation in the thread text above. Return it as the structured "reply" / "suggestedGuideTitle" output described in your instructions -- pick exactly one of the three cases (existing guide, new guide with placeholder, or no guide) for how the link is handled.`;
}

// Gemini structured-output schema for this call -- the first use of responseSchema/
// responseMimeType in this codebase (every other Gemini call site returns free-form text).
// Forcing this shape means the placeholder/title split can't come back malformed or missing.
export const BACKLINK_REPLY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description: `The full forum reply text. Contains the literal token ${NEW_GUIDE_URL_PLACEHOLDER} in place of a link only in the "new guide" case described in the instructions -- otherwise contains a real URL or no link at all.`,
    },
    suggestedGuideTitle: {
      type: Type.STRING,
      nullable: true,
      description: 'A real, specific guide title under 60 characters, present only when "reply" contains the new-guide placeholder token. Null in every other case.',
    },
  },
  required: ['reply', 'suggestedGuideTitle'],
};
