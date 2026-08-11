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

// Deliberately not a ranked or numbered list -- an earlier numbered "pillar" version put
// insurance first and gave it by far the most specific named examples (Federal Pacific/Zinsco
// panels, polybutylene, aluminum wiring, knob-and-tube), which is exactly what a lot of this
// site's *existing* article corpus is titled. Combined with the existingTitlesBlock below
// (which necessarily lists that same insurance-heavy corpus so new topics don't duplicate it),
// that's a strong pull toward insurance framing regardless of what topic was actually typed in --
// confirmed as a real, reported bug: topics with nothing to do with insurance kept coming back
// insurance-framed. The fix has two parts: this list is now flat and explicitly open-ended
// (covers the full pre-purchase research space BeforeRegret is actually about, not six fixed
// buckets), and the instruction below tells the model directly not to default to insurance or to
// treat the existing-titles list as a style guide.
const CONTENT_SCOPE = `BeforeRegret covers anything a home buyer should research or check before closing -- the full pre-purchase research space, not one narrow angle. Illustrative areas, not an exhaustive list and none of them a default:
- Insurance blockers: specific systems/materials (old electrical panels, polybutylene pipe, aluminum wiring, knob-and-tube) some insurers have documented declining or surcharging.
- Permit and records research: how to check permit history, code violations, certificate of occupancy, or property records for a specific city or county.
- Era-specific inspection priorities: what matters most for a home built in a specific decade.
- What a general home inspection won't cover: sewer scope, structural engineer review, asbestos sampling, EIFS moisture survey -- and why each needs its own appointment.
- Seller disclosure and negotiation: specific questions a buyer should ask, and how to read gaps in a disclosure.
- Location-specific regulatory quirks: county- or city-specific requirements (septic transfer permits, well inspections, flood zone rules) that vary by jurisdiction and most buyers don't know exist.
- Cost after closing: property tax reassessment mechanics, insurance deductible structure, era-based utility and maintenance costs.
- Regret-native content: what buyers commonly say afterward they wish they'd checked before closing.
- Any other area genuinely related to researching a property before buying it, even if it isn't listed above.`;

export function buildArticlePrompt(
  topicSeed: string,
  existingTitles: string[] = [],
  exactTitle: string = '',
  relatedKeywords: string[] = []
): { systemInstruction: string; contents: string } {
  const trimmedTopic = topicSeed.trim();
  const trimmedExactTitle = exactTitle.trim();

  // Two distinct modes, not one input doing double duty. The original version always told the
  // model to "refine" whatever was typed into the single title/topic field -- so an already-
  // specific, already-good title like "Buying a house with Zinsco panel" still got rewritten into
  // whatever angle the model's pillar bias favored (almost always the insurance-blocker framing,
  // since that pillar's examples name Zinsco/FPE panels directly). Exact-title mode below is the
  // fix: when the writer already knows the exact headline they want, the model is told to use it
  // verbatim and write the rest of the article for that specific question -- not to "improve" it.
  const topicInstruction = trimmedExactTitle
    ? `The exact title for this article is: "${trimmedExactTitle}"\n\nUse this exact wording as the title -- verbatim, character for character. Do not rephrase it, generalize it, "optimize" it, or reframe it into a different question or a different angle (e.g. don't turn a wiring-type question into an insurance or mortgage question unless the given title already says insurance or mortgage). Your TITLE: line in the output must match this text exactly. Write the META, QUICK_ANSWER, and full article body specifically and only for this exact title.`
    : trimmedTopic
    ? `Topic seed given by the writer: "${trimmedTopic}"\n\nRefine this into the single best specific, long-tail angle -- the exact question a worried buyer would actually type into Google -- rather than writing broadly about the general subject. Stay on the topic given: do not reframe it into an insurance angle, a cost angle, or any other area unless the topic seed itself is already about that. If the existing-titles list further below happens to be dominated by one framing (e.g. insurance-blocker titles), that reflects this site's past output, not a house style to imitate -- it has no bearing on the angle for this topic.`
    : `No topic was given. ${CONTENT_SCOPE}\n\nPick whichever area (or a genuinely related one not listed) has the least existing coverage relative to how useful it would be to a buyer -- not the first one in the list above, and not an insurance angle by default just because that framing is common in this site's existing archive.`;

  // Duplicate-content guard: without this, nothing stops the same topic being generated twice
  // under a different headline. The model is the only thing that can judge topical overlap here
  // (there's no embedding search or similarity index in this app) -- so it just gets told
  // directly what already exists and instructed to route around it. In exact-title mode the
  // title itself is fixed above, so "pick a different angle" would directly contradict that --
  // the instruction there is about keeping the *body* original, not the headline.
  //
  // The trailing sentence in both branches below is the other half of the insurance-drift fix:
  // this list is necessarily dominated by whatever this site has published most of so far (in
  // practice, a lot of insurance-blocker titles), and without an explicit caveat the model reads
  // that concentration as an implicit style guide -- "this is what a BeforeRegret article looks
  // like" -- and drifts toward it regardless of the actual topic, even though "don't duplicate
  // these" says nothing about tone or framing. Confirmed as the real cause of a reported bug
  // where unrelated topics kept coming back insurance-framed.
  const existingTitlesBlock = existingTitles.length > 0
    ? trimmedExactTitle
      ? `\n\nArticles that already exist on this site (published or in draft), including anything you or a previous attempt already wrote for this exact title -- do not reuse their specific examples, structure, or wording. The title above is fixed regardless; write genuinely original analysis for it even if a similar piece exists. This list is only a do-not-repeat check, never a style guide -- ignore whatever framing dominates it:\n${existingTitles.map((t) => `- ${t}`).join('\n')}`
      : `\n\nArticles that already exist on this site (published or in draft), including anything a previous attempt at this same topic already produced -- do not write about the same specific angle as any of these. Pick a genuinely different angle or a different specific question if the given topic seed overlaps with one of them. This list is only a do-not-repeat check, never a style guide -- if it's dominated by one framing (e.g. insurance), that's this site's past output, not a pattern to carry into an unrelated topic:\n${existingTitles.map((t) => `- ${t}`).join('\n')}`
    : '';

  const sourcesListBlock = KNOWN_SOURCES.map((s) => `${s.key} = ${s.name}`).join('\n');

  // Additive only -- never touches topicInstruction, existingTitlesBlock, the hard rules, or the
  // output format below. Real search phrases from live Bing/Search Console data (see
  // src/server/keywordResearchApi.ts), passed through so the article's own vocabulary matches how
  // people actually search this topic, not just the one seed phrase chosen as the title angle. A
  // suggestion, not a requirement -- forcing in a phrase that doesn't fit the specific angle above
  // would just be keyword-stuffing, which HARD RULE 6 (write like a real person, no listicle
  // padding) already prohibits.
  const relatedKeywordsBlock = relatedKeywords.length > 0
    ? `\n\nReal related search phrases people actually use around this topic (from live Bing/Search Console data, ranked by real search interest) -- weave in the ones that genuinely fit naturally into the article's headers, quick answer, or body wording, in the vocabulary real searchers use. Skip any that don't fit the specific angle above rather than forcing them in, and never list them out mechanically or stuff them in just to include them:\n${relatedKeywords.map((k) => `- ${k}`).join('\n')}`
    : '';

  const contents = `${topicInstruction}${existingTitlesBlock}${relatedKeywordsBlock}

SEO approach for this article:
- Target ONE specific, long-tail search query. Long-tail (specific, lower-competition, high buyer-intent) is what a newer site can realistically rank for -- not a broad head term.
- Structure with markdown headers (## for sections) and short paragraphs (2-4 sentences) so it's scannable.
- For emphasis, use **double asterisks** only. Never use a single asterisk (*like this*) for italics or as a label -- it won't render correctly.
- Never draw an ASCII-art box or flowchart (lines of +---+, |, or arrows) inside a \`\`\` code fence for a sequence of steps or options -- confirmed on two published articles: it required horizontal scrolling to read on a phone, since a fixed-width diagram can't reflow to a narrow screen the way text can. Use a numbered list for a sequence of steps, or a bulleted list with a bold label per item for a set of named options -- both convey the same structure and read naturally on any screen. A \`\`\` code fence is for genuine code only. For real tabular data (e.g. comparing several named things across the same few attributes), a real GFM markdown table (a header row, a \`|---|---|\` separator row, then data rows) is supported and renders correctly, including on mobile.
- Target 1,200-1,800 words: long enough to fully and specifically answer the question, never padded to hit a number.
- Demonstrate real expertise with specific mechanisms, eras, and regulations.
- End with one clear, concrete next step the reader can act on today.

Quick answer: write a 2-3 sentence direct, self-contained answer to the exact question the title asks -- the kind of summary Google could lift directly into a featured snippet or AI Overview. Lead with the concrete answer in the first few words -- "Yes, you can get homeowners insurance with polybutylene plumbing, but it's often difficult" not "Obtaining insurance can be difficult." Being concrete is about clarity, not certainty: still hedge the specifics in the rest of the sentence, but don't open with a vague qualifier when a direct answer is possible. It must follow the same hard rules as the rest of the article (hedged, no invented figures, no personalized advice) and should make sense read completely on its own, without the rest of the article.

Citations: when a specific claim rests on one of these organizations, cite it inline immediately after the sentence, in square brackets, like this: "...has documented breaker failure-to-trip issues [CPSC]." That's it -- just the bracketed code, no extra punctuation or formatting. You may cite an organization ONLY by its short code from this approved list below, and only when it's genuinely relevant to a specific claim -- not on every paragraph. Do not use any organization not on this list, and never write a URL yourself -- the code is all that's needed, the real link is added separately, both inline and in a references list at the end.
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
