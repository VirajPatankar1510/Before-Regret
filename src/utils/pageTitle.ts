// Google's actual results-page display budget is closer to 60 characters (Bing's own guidance
// tolerates up to ~70, which is where this constant used to sit) -- a title under 70 could still
// get silently truncated or rewritten specifically on Google, the search engine this site's
// traffic actually depends on. Guide titles are deliberately long, natural-language questions
// (see src/server/articleGenerator.ts's prompt, itself already targeting 58 chars for the raw
// title), so a fixed " | BeforeRegret Guides" suffix pushes most of them over budget -- an audit
// after Bing flagged one published guide found 26 more of 30 guides on the exact same pattern.
// Dropping the suffix only when there's room for it keeps the branding where it fits, and
// guarantees compliance for every future guide title too, rather than relying on a human (or a
// search engine) to catch it after the fact.
export const TITLE_SUFFIX_MAX_LENGTH = 60;

export function buildPageTitle(baseTitle: string, suffix: string, maxLength = TITLE_SUFFIX_MAX_LENGTH): string {
  const withSuffix = `${baseTitle}${suffix}`;
  return withSuffix.length <= maxLength ? withSuffix : baseTitle;
}
