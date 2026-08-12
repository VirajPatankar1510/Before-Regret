// Builds the prompt for AI-drafted journalist source responses (the "Generate response" button
// in MediaRequestsAdminPanel.tsx -- see src/admin/media-requests). A journalist posts a query on
// Connectively/Qwoted/Featured asking for an expert source; a human on the BeforeRegret team pastes
// the real query text in here, gets a drafted response back, and reviews and submits it themselves
// under their own name. Nothing here is ever submitted automatically.
//
// Same anti-fabrication posture as backlinkReplyGenerator.ts, adjusted for a different output
// shape: a journalist wants a short, quotable, attributable soundbite they can paste directly into
// a story, not a forum-style conversational reply. The hard rules below are the same rules for the
// same reason -- only cite what's actually given, never invent a first-person story, never force a
// mention that isn't genuinely responsive to what was asked.

import { GuideReference, CountyContextForReply } from './backlinkReplyGenerator.js';

export const MEDIA_REQUEST_SYSTEM_INSTRUCTION = `You are drafting a response to a real journalist's source request for a real BeforeRegret team member to review, edit, and submit themselves, under their own name, on a real journalist-request platform (Connectively, Qwoted, Featured, or similar). The output is a draft for a human to approve -- nothing you write is ever submitted automatically.

HARD RULES -- breaking any of these makes the output unusable:
1. Only use facts given to you in this prompt: the real query text, the real county data block if one is provided, and the list of real BeforeRegret guides if one is provided. Never invent a statistic, a detail, or anything not actually in what you were given.
2. Never fabricate a first-person anecdote or a specific case BeforeRegret supposedly handled. This is a real data/research team answering from what it actually knows, not inventing a story to sound more relatable.
3. Answer the actual question in the query text. If the query is broad, pick the angle BeforeRegret's actual data (era-based inspection priorities, county-level FEMA/NOAA risk data, or the published guides) can genuinely speak to -- don't answer a generic version of the question when a specific, grounded answer is possible.
4. Never invent a URL. The only link you may use is a guide URL given to you in this prompt, and only if it's genuinely the best-supporting citation for the quote -- never force one in. Journalists often just want the quote and a name/title, not a link; a response with no link is a fine, complete answer.
5. Format the response as a ready-to-paste quote: a short, direct, quotable sentence or two first (the part a journalist would lift verbatim), then at most one short supporting paragraph with more detail if it genuinely adds something. Journalists skim dozens of these -- long, hedged, or over-qualified responses get skipped.
6. No "As an AI," no self-reference to being generated, no marketing language ("industry-leading," "cutting-edge"), no exclamation points. Write like a specific, informed person who actually knows this material.
7. Never state or imply certainty the data doesn't support. If the county data wasn't provided, or doesn't cover what's actually being asked, answer from the general, non-address-specific patterns the inspection-priorities engine and guides already document instead of guessing.
8. End with a one-line suggested attribution in the form "Name/Title, BeforeRegret (beforeregret.com)" as a separate field, not folded into the quote itself -- the human filling this in will replace the name/title placeholder with their own.`;

export function buildMediaRequestPrompt(params: {
  platform: string;
  outletName: string;
  queryText: string;
  topicSnippet: string;
  county: CountyContextForReply | null;
  guides: GuideReference[];
}): string {
  const { platform, outletName, queryText, topicSnippet, county, guides } = params;

  const countyBlock = county
    ? `REAL COUNTY DATA -- ${county.countyName} County, ${county.stateAbbrev} (only use these numbers, never round differently or restate them as something they're not):
- FEMA National Risk Index: ${county.femaRiskRating ?? 'not available'}${county.femaRiskScore != null ? ` (${county.femaRiskScore.toFixed(1)} percentile)` : ''}
- NOAA recorded storm events${county.noaaYearsCovered ? ` (${county.noaaYearsCovered})` : ''}: ${
        Object.entries(county.noaaEventCounts).filter(([, n]) => n > 0).map(([type, n]) => `${n} ${type}`).join('; ') || 'not available'
      }
- EPA radon zone: ${county.radonZone != null ? `Zone ${county.radonZone} of 3 (1 = highest potential)` : 'not available'}`
    : 'No county data available for this query -- do not reference specific FEMA/NOAA/EPA numbers, answer from general patterns instead.';

  const guidesBlock =
    guides.length > 0
      ? `REAL BEFOREREGRET GUIDES (the only guide URLs you may ever use):\n${guides.map((g) => `- "${g.title}" -- ${g.url}`).join('\n')}`
      : 'No guide list was available -- do not reference or link to any specific BeforeRegret guide by name.';

  return `PLATFORM: ${platform}
OUTLET: ${outletName || '(not given)'}

WHY THIS QUERY WAS FLAGGED AS RELEVANT (a note written before the query was read in full -- may be incomplete, defer to the actual query text below if they differ):
${topicSnippet || '(no note provided)'}

ACTUAL QUERY TEXT, PASTED BY A HUMAN WHO READ IT (this is the ground truth -- answer what's actually asked):
${queryText}

${countyBlock}

${guidesBlock}

Draft one source response to the actual query above, formatted as described in your instructions: a short quotable lead, at most one short supporting paragraph, and a separate one-line suggested attribution.`;
}
