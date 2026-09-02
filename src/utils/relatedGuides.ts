export const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'on', 'of', 'with', 'is', 'are',
  'your', 'you', 'how', 'what', 'why', 'can', 'do', 'does', 'this', 'that', 'it', 'its',
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

// Rough client-side heuristic: shared significant words as a fraction of the shorter title's word
// count. Originally written for SeoAdminPanel.tsx's near-duplicate warning (a *high* score there
// means "probably the same article"); reused here for a different purpose -- ranking every other
// guide by topical closeness to pick which ones to link as "Related Guides". No embeddings, no
// category/tag field on the articles table to key off instead (see src/server/db.ts) -- this is
// the cheapest signal available that's still better than a random or purely-recent pick.
export function titleSimilarity(a: string, b: string): number {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) shared++;
  });
  return shared / Math.min(wordsA.size, wordsB.size);
}

export interface GuideSummary {
  slug: string;
  title: string;
  publishedAt?: string | null;
}

// Topic taxonomy for related-guide ranking.
//
// WHY A TAXONOMY AND NOT JUST WORD OVERLAP. titleSimilarity above cannot learn that "Zinsco" and
// "Federal Pacific Stab-Lok" are the same subject -- their titles share zero significant words, so
// it scores them 0, identically to a pair with nothing in common. The same is true of Orangeburg
// vs. cast iron, polybutylene vs. galvanized, termites vs. WDO reports. Domain synonymy is exactly
// what a bag-of-words measure cannot see, and this library is full of it.
//
// The consequence was measurable. On 2026-09-02, across the 35 published guides, only 39% of
// "Related Guides" links pointed at a guide on the same subject; 61% jumped topic (plumbing ->
// permits, pest -> electrical). Because most title pairs score exactly 0, the sort was falling
// through to its recency tiebreak, which is topic-blind -- so the module was mostly linking
// whatever had been published most recently.
//
// That matters more here than on a normal site. With no inbound links from anywhere else, internal
// links are both the only way authority moves between pages AND the main way a crawler finds them
// at all -- and 26 of those 35 guides had no contextual in-body link pointing at them.
//
// Matched against "<slug> <title>" so a topic word present in either is enough. ORDER MATTERS:
// first match wins, and the specific defect is deliberately ranked above the transaction or
// insurance framing around it -- "get-home-insurance-aluminum-wiring" belongs with the other
// aluminum-wiring guides, not with the trampoline-and-pool insurance one. A guide matching nothing
// gets a null topic and simply falls back to the old behaviour rather than being forced into a
// bucket it does not belong in.
const GUIDE_TOPIC_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  // "What does X mean on my inspection report" -- a reader decoding a report wants the other
  // report-vocabulary guides next, so this is checked before the defect topics that its subject
  // matter would otherwise match (settlement cracking is structural, but the intent is the report).
  ['report-language', /\bmeans?\b[^.]*\breports?\b|not[- ]inspected|amateur[- ]workmanship|evidence[- ](of[- ])?prior[- ]repair/],
  ['electrical', /electric|wiring|panel|breaker|gfci|outlet|polarity|open[- ]ground|zinsco|federal[- ]pacific|stab[- ]lok|knob[- ](and[- ])?tube|aluminum|fuse|amp\b|split[- ]bus|romex/],
  ['plumbing', /plumb|\bpipes?\b|sewer|drain|water[- ]heater|\btpr\b|polybutylene|orangeburg|cast[- ]iron|galvanized|sump|septic|\bwell\b|backwater|slab[- ]leak|repipe/],
  ['roofing-exterior', /\broof|stucco|eifs|siding|chimney|flashing|gutter|flat[- ]roof/],
  ['hvac', /\bhvac\b|furnace|air[- ]condition|heat[- ]pump|\bducts?\b|boiler/],
  ['structural', /foundation|settl|\bcracks?\b|basement|retaining[- ]wall|structural|bowing|crawlspace|framing/],
  ['pests', /termite|\bwdo\b|wood[- ]destroying|\bpests?\b|rodent|carpenter[- ]ant/],
  ['environmental', /radon|asbestos|lead[- ]paint|\bmold\b|oil[- ]tank|underground[- ]storage|methane/],
  ['permits', /permit|unpermitted|code[- ]enforcement|zoning|violation/],
  ['insurance', /insur|clue[- ]report|carrier|\bpolicy\b|premium|uninsurable|4[- ]point/],
  ['transaction', /contingen|escrow|closing|\bseller\b|negotiat|apprais|walk[- ]away|\bhoa\b|earnest|disclosure|inspector/],
];

/** The topic bucket a guide belongs to, or null when nothing matches. Exported for testing. */
export function guideTopic(slug: string, title: string): string | null {
  const haystack = `${slug} ${title}`.toLowerCase();
  for (const [topic, pattern] of GUIDE_TOPIC_PATTERNS) {
    if (pattern.test(haystack)) return topic;
  }
  return null;
}

// Picks `count` other guides to link as "Related Guides" on a guide page. Ranked by topic bucket
// first, then title-word overlap, then most-recently-published.
//
// The topic match is a +1 bonus on a similarity score that is bounded to [0, 1], so it always
// outranks word overlap without ever excluding a cross-topic guide outright. That distinction is
// deliberate: a hard filter would leave a two-guide topic with a half-empty module, and an orphan
// with no inbound internal links is the actual problem this function exists to solve -- "related
// but not identical" still beats "no links at all". Within a topic the old title-overlap ordering
// still decides, so the closest guide on the subject is still picked first.
// A REJECTED ALTERNATIVE, RECORDED BECAUSE IT LOOKS OBVIOUSLY CORRECT AND IS NOT. Reserving the
// last slot for a guide from a different topic, to stop small topics being cut off, was tried and
// measured: it dropped same-topic linking from 74% back to 59% AND increased the number of guides
// receiving no module link from 2 to 3. It fails because the reserved slot goes to the
// highest-scoring outsider, which is the same handful of popular guides on every page -- it
// concentrates links rather than spreading them, while spending a quarter of the module to do it.
//
// Coverage is not this function's job and does not need to be. The /guides/ hub links all 35
// published guides, verified against production, so every guide already has an inbound link and a
// crawl path regardless of what this module picks. That frees the module to optimise purely for
// topical coherence, which is the thing it is uniquely able to signal.
export function pickRelatedGuides<T extends GuideSummary>(
  currentSlug: string,
  currentTitle: string,
  allGuides: T[],
  count = 4
): T[] {
  const currentTopic = guideTopic(currentSlug, currentTitle);
  return allGuides
    .filter((g) => g.slug !== currentSlug)
    .map((g) => {
      const sameTopic =
        currentTopic !== null && guideTopic(g.slug, g.title) === currentTopic;
      return {
        guide: g,
        score: titleSimilarity(currentTitle, g.title) + (sameTopic ? 1 : 0),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.guide.publishedAt ? new Date(a.guide.publishedAt).getTime() : 0;
      const bTime = b.guide.publishedAt ? new Date(b.guide.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, count)
    .map((entry) => entry.guide);
}
