// Builds the prompt for AI-assisted article drafting (see the "Generate with AI" button in
// SeoAdminPanel.tsx). Two things from the original ask are deliberately NOT implemented here,
// and it's worth saying why up front:
//
// - "DSR" / competition score: there is no way for Gemini (or anything without a live crawl of
//   the search results and a backlink index) to know a real keyword's difficulty. Any number it
//   produced here would be invented, the same problem as the fabricated per-ZIP stats removed
//   earlier this session. Instead of a fake score, the prompt encodes the *strategy* a real score
//   would inform: pick one specific, long-tail angle rather than a broad head term, because
//   long-tail is what a new, low-authority site can realistically rank for.
// - Plagiarism checking: nothing here calls a plagiarism-detection API (none is wired up). The
//   prompt instructs the model to write original analysis rather than paraphrase a source, but
//   that's a writing instruction, not a guarantee -- there's no automated check behind it.

// Citations are the other place an LLM commonly fabricates: asked for a source URL, it will often
// invent a plausible-looking one, or misattribute a real claim to the wrong report. Rather than
// trust Gemini's own URLs, it only ever gets to CITE BY NAME from the hand-verified list in
// src/data/knownSources.ts (shared with the client so rendering uses the same lookup) -- the
// actual link comes from there, not from the model, so a citation can never point to a broken or
// invented page. If a real source isn't in that list, the model is instructed to name the agency
// in plain text with no link rather than invent one.
import { KNOWN_SOURCES } from '../data/knownSources.js';

export const ARTICLE_SYSTEM_INSTRUCTION = `You are an expert SEO content writer for BeforeRegret, a US property research platform that helps home buyers avoid regret after closing. You write articles that read as original work by an experienced researcher -- never as AI-generated boilerplate, a keyword-stuffed listicle, or a corporate brochure.

HARD RULES -- breaking any of these makes the output unusable:
1. Never invent a specific statistic, percentage, dollar figure, or study result. Only state facts that are well-established public record (e.g. "the federal lead-paint disclosure law took effect in 1978" is fine; a specific percentage of homes affected is not, unless you can name the real source it came from).
2. Never make a claim about a specific property. Every statement is class-level: "homes built in this era commonly..." never "this house has...".
3. Never state or imply personalized insurance, legal, or financial advice. Frame findings as "some insurers have documented declining coverage for X" -- never "you will/won't be covered."
4. Every actionable recommendation routes to a licensed professional (inspector, structural engineer, plumber, electrician, insurance agent) as the next step. The article itself is never a substitute for one.
5. Hedge appropriately -- "commonly," "often," "can," "may" -- never "always," "will," "guaranteed."
6. Vary sentence length and structure like a real person writing. No "In today's fast-paced world," no "In conclusion," no listicle padding, no filler sentences added just to hit a word count.
7. Write only original analysis and explanation in your own words. Do not paraphrase or lift structure from any specific existing article.
8. Never invent a URL or a specific report/study to attribute a claim to. You may only cite an organization by its short code from the approved list given to you -- never write out a URL yourself.`;

const PILLAR_STRATEGY = `BeforeRegret's content strategy has six pillars. If no specific topic is given, pick the single best angle from these:
1. Insurance blockers -- specific things (Federal Pacific/Zinsco panels, polybutylene pipe, aluminum wiring, knob-and-tube) that some insurers have documented declining or surcharging.
2. Era guides -- what matters most for a home built in a specific decade (pairs with BeforeRegret's Inspection Budget Priorities feature).
3. What a general inspection won't cover -- sewer scope, structural engineer review, asbestos sampling, EIFS moisture survey -- and why each needs a separate appointment.
4. Seller question scripts -- specific questions a buyer should ask, by topic.
5. Regret-native content -- what buyers commonly say they wish they'd checked before closing.
6. Cost after closing -- property tax reassessment mechanics, insurance deductible structure, era-based utility costs.`;

export function buildArticlePrompt(
  topicSeed: string,
  existingTitles: string[] = []
): { systemInstruction: string; contents: string } {
  const trimmedTopic = topicSeed.trim();

  const topicInstruction = trimmedTopic
    ? `Topic seed given by the writer: "${trimmedTopic}"\n\nRefine this into the single best specific, long-tail angle -- the exact question a worried buyer would actually type into Google -- rather than writing broadly about the general subject.`
    : `No topic was given. ${PILLAR_STRATEGY}\n\nPick the single best long-tail angle within that pillar -- not the pillar name itself as a title.`;

  // Duplicate-content guard: without this, nothing stops the same topic being generated twice
  // under a different headline. The model is the only thing that can judge topical overlap here
  // (there's no embedding search or similarity index in this app) -- so it just gets told
  // directly what already exists and instructed to route around it.
  const existingTitlesBlock = existingTitles.length > 0
    ? `\n\nArticles that already exist on this site (published or in draft) -- do not write about the same specific angle as any of these. Pick a genuinely different angle, a different pillar, or a different specific question if the given topic seed overlaps with one of them:\n${existingTitles.map((t) => `- ${t}`).join('\n')}`
    : '';

  const sourcesListBlock = KNOWN_SOURCES.map((s) => `${s.key} = ${s.name}`).join('\n');

  const contents = `${topicInstruction}${existingTitlesBlock}

SEO approach for this article:
- Target ONE specific, long-tail search query. Long-tail (specific, lower-competition, high buyer-intent) is what a newer site can realistically rank for -- not a broad head term.
- Structure with markdown headers (## for sections) and short paragraphs (2-4 sentences) so it's scannable.
- Target 1,200-1,800 words: long enough to fully and specifically answer the question, never padded to hit a number.
- Demonstrate real expertise with specific mechanisms, eras, and regulations.
- End with one clear, concrete next step the reader can act on today.

Quick answer: write a 2-3 sentence direct, self-contained answer to the exact question the title asks -- the kind of summary Google could lift directly into a featured snippet or AI Overview. It must follow the same hard rules as the rest of the article (hedged, no invented figures, no personalized advice) and should make sense read completely on its own, without the rest of the article.

Citations: you may cite an organization ONLY by its short code from this approved list, and only when it's genuinely relevant to a claim you're making. Do not use any organization not on this list, and never write a URL yourself -- the code is all that's needed, the real link is added separately.
${sourcesListBlock}

Return your response in EXACTLY this format, with nothing before or after it:

TITLE: <specific, compelling headline, ideally under 65 characters>
META: <one to two sentences, under 160 characters, written to make someone click through from a Google search result>
QUICK_ANSWER: <the 2-3 sentence direct answer described above, on one line>
SOURCES: <comma-separated short codes from the approved list that you actually cited in the article, or NONE if you didn't cite any>
---
<the full article body in markdown, starting immediately after this line. Open with 1-2 sentences stating the real stakes -- what it costs someone to get this wrong -- before any background or definition.>`;

  return { systemInstruction: ARTICLE_SYSTEM_INSTRUCTION, contents };
}
