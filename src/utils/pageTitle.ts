// Bing Webmaster Tools (and Google, less strictly) flags <title> tags over ~70 characters as
// likely to get truncated or rewritten in search results. Guide titles are deliberately long,
// natural-language questions (see src/server/articleGenerator.ts's prompt), so a fixed
// " | BeforeRegret Guides" suffix pushed most of them over that budget -- an audit after Bing
// flagged one published guide found 26 more of 30 guides on the exact same pattern. Dropping the
// suffix only when there's room for it keeps the branding where it fits, and guarantees
// compliance for every future guide title too, rather than relying on a human (or Bing) to catch
// it after the fact.
export function buildPageTitle(baseTitle: string, suffix: string, maxLength = 70): string {
  const withSuffix = `${baseTitle}${suffix}`;
  return withSuffix.length <= maxLength ? withSuffix : baseTitle;
}
