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
5. Hedge appropriately -- "commonly," "often," "can," "may" -- never "always," "will," "guaranteed." This includes numbers: if a figure genuinely varies by lender, insurer, or provider (a down payment percentage, an interest rate premium, a deductible), describe it qualitatively ("often requires a significantly larger down payment") rather than stating a specific range as if it were a fixed rule -- a precise-looking number implies a precision the underlying reality doesn't have.
6. Vary sentence length and structure like a real person writing. No "In today's fast-paced world," no "In conclusion," no listicle padding, no filler sentences added just to hit a word count.
7. Write only original analysis and explanation in your own words. Do not paraphrase or lift structure from any specific existing article.
8. Never invent a URL or a specific report/study to attribute a claim to. You may only cite an organization by its short code from the approved list given to you -- never write out a URL yourself. Precision matters as much as existence: only attach a citation when that specific organization is the actual, correct authority for that specific claim -- not merely the closest-sounding or most plausible agency on the list. A federal regulator's general subject-matter area (e.g. CFPB covers consumer lending disclosures and servicing) does not make it the right citation for a claim that actually belongs to a different body (e.g. Fannie Mae/Freddie Mac's non-warrantable-property underwriting rules, which are not a government agency and are not on this list at all). Confirmed as a real, published mistake: a claim about GSE mortgage underwriting treatment of HOA litigation was cited to [CFPB], which does not set or publish that standard. When no organization on the approved list is a precise match for a claim, state the claim in plain text with no citation bracket -- an uncited true statement is correct; a citation to the wrong authority is not, even if the organization itself is real and on the list.
9. When a counterparty in the transaction (a landowner, seller, HOA, lender, or any vendor -- inspector, contractor, agent, attorney) uses a standard, legal, disclosed practice, describe its financial mechanism and consequence to the buyer -- never editorialize it as deception or bad intent. Words like "trap," "landmine," or a section header like "Why the Purchase Price Is Deceptive" assume the counterparty meant to harm the reader; a disclosed rent-escalation clause or a standard contract term is a real risk to explain, not a scheme to expose. Confirmed as a real, published mistake: an article on land-lease apartments titled a section "The Escalation Clause Trap" and called standard reappraisal clauses "financial landmines," which a landowner could reasonably read as an accusation of bad faith for using a disclosed, legal term. State the risk plainly and let the facts carry the warning.`;

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

// The model's own SOURCES: header line is not reliable enough to trust as-is -- confirmed live:
// asked to test gemini-2.5-flash's output quality, it cited [CPSC] inline in the body (correctly
// -- that's the exact breaker failure-to-trip claim the system instruction above names as the
// worked example) but left SOURCES: empty, which would have silently dropped CPSC from the
// rendered "Sources" list. The inline citation still would have rendered as a working link
// regardless (renderArticleMarkdown.tsx's parseInline resolves any [CODE] bracket it finds
// directly from the body, independent of this list) -- but the reference list at the bottom of
// the article would have been incomplete despite a citation actually being used.
// Rather than trust two independent statements of the same fact to stay in sync, derive the
// source list directly from what the body actually cites -- the SOURCES: header line is still
// requested in the prompt above (it doesn't hurt, and may reinforce the citation habit) but its
// value is intentionally unused for this.
// Narrow tripwire for HARD RULE 9 (above) failing to hold -- catches literal recurrence of the
// exact adversarial-counterparty phrasing already confirmed live on the land-lease article
// ("The Escalation Clause Trap," "financial landmines," "the purchase price is deceptive"), not
// a general accusatory-tone detector. Deliberately does NOT flag words like "red flag,"
// "predatory," "dangerous," or "ripped off" -- those are legitimate, intended language when an
// article is actually about spotting a bad actor (a corner-cutting contractor, a licensing
// violation; see the "How to Hire a [Vendor] Without Getting Ripped Off" / "[Vendor] Red Flags"
// article series), and banning them here would fight that intended style. This only catches the
// narrower case rule 9 addresses: a STANDARD, DISCLOSED practice (a lease clause, a fee
// structure) described as if it were designed in bad faith.
const ADVERSARIAL_COUNTERPARTY_PATTERNS: RegExp[] = [
  /financial landmines?/i,
  /\b(?:is|are|as)\s+deceptive\b/i,
  /financial trap/i,
  /\b(?:clause|contract|lease)\s+trap\b/i,
  /\bdangerous provisions?\b/i,
];

/** Returns the matched phrases, or an empty array if none of the confirmed bad patterns recur. */
export function findAdversarialCounterpartyFraming(bodyMarkdown: string): string[] {
  const hits: string[] = [];
  for (const pattern of ADVERSARIAL_COUNTERPARTY_PATTERNS) {
    const match = bodyMarkdown.match(pattern);
    if (match) hits.push(match[0]);
  }
  return hits;
}

export function extractCitedSourceCodes(bodyMarkdown: string): string[] {
  const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));
  const found = new Set<string>();
  for (const match of bodyMarkdown.matchAll(/\[([A-Z]+)\]/g)) {
    if (knownKeys.has(match[1])) found.add(match[1]);
  }
  return Array.from(found);
}

export function buildArticlePrompt(
  topicSeed: string,
  existingTitles: string[] = [],
  exactTitle: string = '',
  relatedKeywords: string[] = [],
  additionalTopic: string = '',
  additionalTopicExact: boolean = false,
  serpBrief: string = '',
  additionalTopicContent: string = ''
): { systemInstruction: string; contents: string } {
  const trimmedTopic = topicSeed.trim();
  const trimmedExactTitle = exactTitle.trim();
  const trimmedAdditionalTopic = additionalTopic.trim();

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

  // "Additional topic/question to cover" -- a second, narrower ask layered on top of whichever
  // mode above chose the article's actual title and angle. This does NOT change the title or the
  // article's main angle; it requires one genuine ## subheading somewhere in the body that covers
  // a specific thing the writer wants covered (a question their own audience keeps asking, a
  // competitor angle, a regulatory wrinkle) that the model might not otherwise think to include.
  //
  // Two modes, mirroring exact-title vs topic-seed above for the same reason: sometimes the writer
  // already has the exact subheading phrasing they want (a real, verified question, a specific
  // term their audience searches), and "refining" it would replace their specific input with the
  // model's guess. Other times they only know the underlying topic and want the model to phrase it
  // as an SEO-shaped question, the same treatment the main title gets in topic-seed mode.
  //
  // The no-thin-content instruction below is deliberately specific about WHY, not just THAT: this
  // site's real content-quality gate (contentAudit.ts, run by the article-faqs skill and the admin
  // panel's own audit button) flags any article under 500 words as thin, and a subheading added
  // only to check a box -- one throwaway sentence, no real mechanism or specific -- is exactly the
  // kind of padding that produces a thin article, or a padded one that hits the word count without
  // saying anything. Telling the model the actual downstream check gives it a concrete standard to
  // write against instead of a vague "make it good" instruction.
  // Duplicate-content guard for THIS field specifically, reusing the same existing-titles list
  // existingTitlesBlock above already put in front of the model -- not a separate lookup, just a
  // pointer back to it. Needed because the additional topic is a full, specific question in its
  // own right, and without this the model has no reason to connect "one of the articles you just
  // told me not to duplicate" with "the subheading question you're about to write," even when
  // they're the same question. The client-side admin UI catches the obvious case (the phrase
  // itself scores as near-duplicate against an existing title) before Generate is even clickable;
  // this is the prompt-level backstop for a subtler overlap the UI's word-overlap heuristic
  // might miss -- a differently-worded existing article covering the same underlying question.
  const additionalTopicDuplicateGuard = existingTitles.length > 0
    ? ' If this specific question is already the subject of one of the existing articles listed above, do not just restate that article -- either cover it from a genuinely different angle or depth than that piece does, consistent with the original-analysis requirement in HARD RULE 7.'
    : '';

  const additionalTopicBlock = trimmedAdditionalTopic
    ? additionalTopicExact
      ? `\n\nThe article must also include one dedicated subheading -- an H2-level Markdown heading, formatted the same way as this article's other section headings -- placed wherever it fits the article's natural flow, using this EXACT wording as the subheading text -- verbatim, character for character, not rephrased, reworded, or "optimized": "${trimmedAdditionalTopic}"\n\nThat section must genuinely and specifically cover it: real mechanisms, real specifics, hedged the same as HARD RULE 5 requires everywhere else -- not one throwaway sentence added just to check a box. This site's content-quality check flags any article under 500 words as thin content, and a padded or superficial subsection here is exactly the kind of writing that produces that failure, so treat this subsection as needing the same depth and specificity as any other section, not an afterthought. This subheading is IN ADDITION to the article's normal structure and does not replace or change the title, angle, or any other section required elsewhere in this prompt.${additionalTopicDuplicateGuard}`
      : `\n\nThe article must also include one dedicated subheading -- an H2-level Markdown heading, formatted the same way as this article's other section headings -- placed wherever it fits the article's natural flow, that specifically covers this topic/question -- phrase the subheading itself as the specific, searchable long-tail question a reader would actually type (the same standard the main title uses), refining the wording below into the best subheading phrasing for it rather than repeating it verbatim if a better phrasing exists, and weave in genuinely relevant SEO keywords naturally rather than stuffing them: "${trimmedAdditionalTopic}"\n\nThat section must genuinely and specifically cover it: real mechanisms, real specifics, hedged the same as HARD RULE 5 requires everywhere else -- not one throwaway sentence added just to check a box. This site's content-quality check flags any article under 500 words as thin content, and a padded or superficial subsection here is exactly the kind of writing that produces that failure, so treat this subsection as needing the same depth and specificity as any other section, not an afterthought. This subheading is IN ADDITION to the article's normal structure and does not replace or change the title, angle, or any other section required elsewhere in this prompt.${additionalTopicDuplicateGuard}`
    : '';

  // Optional reference material for that ONE subheading, pasted directly by the writer -- distinct
  // from additionalTopicExact above, which only ever controls the subheading's WORDING. This
  // controls its FACTUAL BASIS: without it, the model has to research or generalize the subheading
  // from nothing but the question itself, which is exactly how a padded, vague subsection happens.
  // Gated on trimmedAdditionalTopic being present too -- pasted content with no subheading to
  // attach it to has nowhere to go and is silently ignored rather than surfaced as a confusing
  // half-applied instruction.
  //
  // Deliberately NOT treated like a KNOWN_SOURCES citation and NOT treated like the SERP brief
  // below. It differs from both: unlike the SERP brief (a model's summary of unverified third-party
  // pages), this is text the writer chose to paste in themselves, so the model is told to actually
  // use it as fact rather than hold it at arm's length. Unlike a KNOWN_SOURCES entry, it has no
  // registered [CODE], so nothing drawn from it may be attributed with a bracket citation -- HARD
  // RULE 8 only permits citing the codes in that list, and this material was never checked against
  // it. Scoped hard to the one subheading so a writer pasting reference material for a narrow
  // point can't accidentally rewrite the rest of the article around it.
  const trimmedAdditionalTopicContent = additionalTopicContent.trim();
  const additionalTopicReferenceBlock = trimmedAdditionalTopic && trimmedAdditionalTopicContent
    ? `\n\nReference material for that subheading specifically, supplied directly by the writer (not retrieved from the web, not checked against KNOWN_SOURCES):\n"""\n${trimmedAdditionalTopicContent}\n"""\n\nUse this as the factual basis for that one subheading only -- draw the real mechanism, figures, and specifics for that section from it rather than inventing or generalizing your own. Do not attach a [CODE] citation to anything drawn from it, since it did not come through this site's known-sources list. Do not repeat, reference, or draw on it anywhere else in the article outside that one subheading. If it conflicts with something else already established in this prompt, note the conflict within that subheading's own text rather than silently picking one side.`
    : '';

  // Competitive brief from the pre-generation SERP research pass (see serpResearch.ts and the
  // /api/admin/articles/serp-research route). Optional -- an empty string leaves this prompt
  // byte-for-byte identical to what it was before the feature existed.
  //
  // The framing below is doing most of the work here, and every clause of it is load-bearing:
  //
  // - It is STRATEGY input, not SOURCE material. The brief is a model's summary of third-party
  //   commercial pages. Nothing in it is verified, and the pages it summarises are frequently
  //   insurer marketing and contractor lead-gen posts. If a figure from one of them were treated as
  //   a fact, this feature would become the single largest fabrication vector in the whole app --
  //   it would launder an unverified competitor claim into a published article that looks
  //   researched. HARD RULES 1 and 8 already forbid that; this says so again at the point of
  //   temptation, because the temptation is created right here and nowhere else.
  // - It must not become a template. "Here is what the top pages do" is a direct invitation to
  //   mirror their structure and paraphrase their coverage, which is exactly what HARD RULE 7
  //   forbids and, separately, what would guarantee the result is one more near-identical page in a
  //   set of near-identical pages -- the opposite of the point.
  // - Gaps are candidates, not a checklist. A gap the brief names may exist because the question is
  //   genuinely unanswerable, or answerable only with a specific figure this site cannot verify, or
  //   only with personalized advice HARD RULE 3 forbids. Filling such a gap "because the brief said
  //   nobody covers it" is how an article ends up making the one claim it has no business making.
  //   Some gaps are moats, not openings.
  const serpBriefBlock = serpBrief
    ? `\n\nCOMPETITIVE BRIEF -- what is already ranking for this query. This came from a live Google Search pass run just before this request. Read it as strategy, under these limits:

${serpBrief}

How to use that brief:
- It is competitive intelligence about COVERAGE and ANGLE only. It is NOT a source. Nothing in it is verified: the pages it describes are largely commercial (insurer marketing, contractor lead-generation), and the brief itself is a summary of them, not a checked record. Do not repeat any statistic, dollar figure, percentage, date, or study result that appears in it. HARD RULES 1 and 8 apply to it in full -- a number is not citable because a competitor published it, and none of these pages may be cited at all.
- Do not mirror their structure, reuse their section order, or paraphrase their explanations. HARD RULE 7 still binds. The point of knowing what they did is to write something different and better, not to produce a smoother version of the same page.
- Beat the consensus answer at its own job. The reader arriving from search has, in effect, already been given that answer. The article earns the click and the ranking by being more specific, more directly useful, and more honest about the parts the consensus answer smooths over -- especially where it hedges into saying nothing, or answers a general question when the reader's real question is narrower.
- The gaps are candidates, not a checklist. Cover the ones this site can genuinely answer within the hard rules. Deliberately skip any gap that could only be filled by inventing a figure, by giving personalized insurance/legal/financial advice, or by making a claim about a specific property -- a gap can exist precisely because it cannot honestly be filled, and the right move there is to say clearly why the question doesn't have a general answer and what the reader should ask a licensed professional instead. That explanation is itself more useful than the confident non-answer the competing pages give.
- Own the pre-purchase angle. Where those pages are written for someone who already owns the home and has a problem now, this article is for someone deciding whether to buy. That difference in reader is usually the single largest real gap available, and it does not require a single unverifiable claim to exploit.`
    : '';

  const contents = `${topicInstruction}${existingTitlesBlock}${relatedKeywordsBlock}${additionalTopicBlock}${additionalTopicReferenceBlock}${serpBriefBlock}

SEO approach for this article:
- Target ONE specific, long-tail search query. Long-tail (specific, lower-competition, high buyer-intent) is what a newer site can realistically rank for -- not a broad head term.
- Structure with markdown headers (## for sections) and short paragraphs (2-4 sentences) so it's scannable.
- For emphasis, use **double asterisks** only. Never use a single asterisk (*like this*) for italics or as a label -- it won't render correctly.
- Never put a \`\`\` code fence around anything except genuine code -- not a sequence of steps, not a set of named options, and not a comparison table, regardless of whether you draw it with +---+ box-art or plain | pipe characters. Confirmed on three published articles now: a fixed-width block inside a code fence renders as a monospace box that requires horizontal scrolling on a phone and (for the box-art case) loses all its syntax-highlighting color, rendering flat black-and-white even though the rest of the page is in color -- both are real, published defects, not a style preference. Each structure has one correct markdown form and no other: a sequence of steps is a numbered list; a set of named options is a bullet list with a bold label per item; a comparison across several named things and the same few attributes (a table, full stop -- if you are about to write column headers and rows, this is what you are making) is a real GFM markdown table: a header row, a \`|---|---|\` separator row, then data rows, with NO \`\`\` fence around any part of it. If you catch yourself typing a \`\`\` fence and the content inside is not a programming language, stop and rewrite it as one of the three markdown forms above instead.
- Target ${trimmedAdditionalTopic ? '1,500-2,100' : '1,200-1,800'} words: long enough to fully and specifically answer the question, never padded to hit a number.${trimmedAdditionalTopic ? ' This range is widened from the usual 1,200-1,800 specifically to give the required additional subheading below its own real room -- do not hit it by shrinking or thinning any other section, and do not treat the extra length as a license to pad either; earn it with genuine depth in the additional subsection.' : ''}
- Demonstrate real expertise with specific mechanisms, eras, and regulations.
- End with one clear, concrete next step the reader can act on today.

Quick answer: write a 2-3 sentence direct, self-contained answer to the exact question the title asks -- the kind of summary Google could lift directly into a featured snippet or AI Overview. Lead with the concrete answer in the first few words -- "Yes, you can get homeowners insurance with polybutylene plumbing, but it's often difficult" not "Obtaining insurance can be difficult." Being concrete is about clarity, not certainty: still hedge the specifics in the rest of the sentence, but don't open with a vague qualifier when a direct answer is possible. It must follow the same hard rules as the rest of the article (hedged, no invented figures, no personalized advice) and should make sense read completely on its own, without the rest of the article. Confirmed live: Google frequently shows this Quick Answer as the actual search-result snippet instead of the META text below -- that's normal snippet-generation behavior, not something META can override, so this is worth writing for that placement specifically. State the direct answer clearly (that's what earns the featured-snippet/AI-Overview placement), but stop there -- leave the specific mechanism, numbers, or step-by-step process to the article body. A snippet that already tells the full story gives someone no reason to click through even when it wins the placement.${serpBrief ? ' This is the single sentence-for-sentence place where the competitive brief above matters most: the consensus answer it quotes is what currently occupies that placement, so write this Quick Answer to be a strictly better candidate for it -- answering the same question more directly, or answering the narrower question the searcher actually had, without borrowing its wording and without asserting anything the hard rules would not otherwise allow.' : ''}

Citations: when a specific claim rests on one of these organizations, cite it inline immediately after the sentence, in square brackets, like this: "...has documented breaker failure-to-trip issues [CPSC]." That's it -- just the bracketed code, no extra punctuation or formatting. You may cite an organization ONLY by its short code from this approved list below, and only when it's genuinely relevant to a specific claim -- not on every paragraph. Do not use any organization not on this list, and never write a URL yourself -- the code is all that's needed, the real link is added separately, both inline and in a references list at the end.
${sourcesListBlock}

Return your response in EXACTLY this format, with nothing before or after it:

TITLE: <specific, compelling headline, no more than 58 characters -- Google truncates titles around 60 characters on a typical results page, and this site's own published titles confirmed it live (roughly a third were being cut off at the old 65-character ceiling). Exact-title mode above overrides this entirely -- that title is used verbatim regardless of length.>
META: <one to two sentences, under 160 characters, written to make someone click through from a Google search result>
QUICK_ANSWER: <the 2-3 sentence direct answer described above, on one line>
SOURCES: <comma-separated short codes from the approved list that you actually cited in the article, or NONE if you didn't cite any>
---
<the full article body in markdown, starting immediately after this line. Open with 1-2 sentences stating the real stakes -- what it costs someone to get this wrong -- before any background or definition.>`;

  return { systemInstruction: ARTICLE_SYSTEM_INSTRUCTION, contents };
}
