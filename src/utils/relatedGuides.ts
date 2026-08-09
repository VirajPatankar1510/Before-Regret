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

// Picks `count` other guides to link as "Related Guides" on a guide page. Ranked by title-word
// overlap first; ties (including the common case of zero shared words, since many titles share
// nothing) fall back to most-recently-published so every guide still gets a full set of related
// links rather than an empty section -- an orphaned guide with no inbound internal links is the
// actual problem this exists to fix, so "somewhat related" always beats "no links at all".
export function pickRelatedGuides<T extends GuideSummary>(
  currentSlug: string,
  currentTitle: string,
  allGuides: T[],
  count = 4
): T[] {
  return allGuides
    .filter((g) => g.slug !== currentSlug)
    .map((g) => ({ guide: g, score: titleSimilarity(currentTitle, g.title) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.guide.publishedAt ? new Date(a.guide.publishedAt).getTime() : 0;
      const bTime = b.guide.publishedAt ? new Date(b.guide.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, count)
    .map((entry) => entry.guide);
}
