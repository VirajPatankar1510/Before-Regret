// Resolves which image an article should declare in its Article/NewsArticle JSON-LD.
//
// WHY THIS EXISTS. Every one of the 159 guides declared the same schema image --
// https://www.beforeregret.com/hero-bg.jpg, the homepage background -- because that string was
// hardcoded in both scripts/prerender-guides.tsx and GuidePageView.tsx. Schema.org's `image` is
// meant to be the image representing THAT article, and it is what Google uses when it builds a
// rich result or a Discover card. Declaring a decorative site background for an article about
// stucco assemblies is not wrong enough to be a penalty, but it wastes the field entirely: every
// page claims to be represented by a photograph that has nothing to do with it.
//
// Now that guide bodies can carry real diagrams (see renderArticleMarkdown.tsx), an article with
// one has a genuinely correct answer available, and the fallback only applies to articles that
// still have no image of their own.
//
// Shared by the prerender and the client component deliberately. Those two have drifted before --
// most recently the county narrative rendered in the static HTML and vanished on hydration -- and
// a schema field that differs between what a crawler reads and what the page later says about
// itself is exactly the kind of inconsistency nobody notices until it matters.

/** The site background, used only by articles that carry no image of their own. */
export const DEFAULT_ARTICLE_IMAGE = 'https://www.beforeregret.com/hero-bg.jpg';

const SITE_ORIGIN = 'https://www.beforeregret.com';

/**
 * The first block-level markdown image in an article body, as an absolute URL, or null.
 *
 * Matches the same `![alt](src)` form the renderer treats as a block image, anchored to its own
 * line -- an image reference inside a paragraph is not a figure and should not become the thing
 * the article claims to be represented by.
 */
export function extractFirstArticleImage(bodyMarkdown: string): string | null {
  const match = bodyMarkdown.match(/^!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/m);
  if (!match) return null;
  const src = match[1];
  if (/^https?:\/\//i.test(src)) return src;
  // Schema.org wants an absolute URL; article markdown stores site-relative paths.
  return `${SITE_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** The image URL an article should declare, falling back to the site default. */
export function resolveArticleSchemaImage(bodyMarkdown: string): string {
  return extractFirstArticleImage(bodyMarkdown) || DEFAULT_ARTICLE_IMAGE;
}
