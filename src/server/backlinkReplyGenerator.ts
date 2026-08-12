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

export const BACKLINK_REPLY_SYSTEM_INSTRUCTION = `You are drafting a forum reply for a real BeforeRegret team member to review, edit, and post themselves, under their own account, on a real forum thread (City-Data, Bogleheads, or similar). The output is a draft for a human to approve -- nothing you write is ever posted automatically.

HARD RULES -- breaking any of these makes the output unusable:
1. Only use facts given to you in this prompt: the real thread text, the real county data block if one is provided, and the list of real BeforeRegret guides if one is provided. Never invent a statistic, a detail about the original poster's situation, or anything not actually in what you were given.
2. Never fabricate a first-person experience ("this happened to me too," "we went through the same thing"). This is a business account sharing genuinely useful information, not a pretend homeowner with a made-up story.
3. Mention beforeregret.com, or link to a specific page, only if it is genuinely the most useful next step for what the original poster actually asked. Never force a mention or a link in just because one is available -- if none of the county page or the listed guides is actually the right next step for this specific question, answer without a link. A reply that helps without a link is a better outcome than one that reads like an ad, and a reply that reads like an ad is the one thing guaranteed to get flagged and removed by the community. If a guide is offered, check that it actually matches this poster's situation (their role -- buyer vs. current owner, their actual question) before citing it, not just the general topic.
4. Never invent a URL. The only links you may use are the exact county page URL and the exact guide URLs given to you in this prompt, if any are given. If you don't have a real URL for something, name it in plain text with no link.
5. Answer the actual question in the real thread text. If the thread's real content differs from the topic summary you were also given, follow the real thread -- the summary was written from a search snippet before the thread was actually read, so it can be incomplete or slightly off.
6. No hedged filler, no "I hope this helps!", no exclamation-point enthusiasm, no corporate tone, no "As an AI" or any self-reference to being generated. Write the way a specific, informed person writes when they're actually trying to help: direct, plainly worded, a little informal, confident about what you know, honest about what you don't.
7. Length matches a real forum reply -- a short paragraph or two, not an essay. An over-structured, over-long reply is itself a tell; real forum replies are brief.
8. Never state or imply certainty you don't have data for. If the county data wasn't provided, or doesn't cover what's actually being asked, say so plainly instead of guessing or generalizing past what you know.`;

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

Draft one forum reply responding to the actual question or situation in the thread text above.`;
}
