// Single source of truth for which Gemini model the app calls. Previously the model name was
// hardcoded in three separate places (server.ts's report generation, articlesApi.ts's admin
// "Generate with AI" route, and scripts/generate-draft-articles.ts), which meant switching models
// -- something you actually need to do when one model's quota is exhausted, since Gemini quota is
// per-project-PER-MODEL -- required editing three files and redeploying.
//
// Override with the GEMINI_MODEL environment variable. Verified working alternatives at time of
// writing, in rough order of capability: gemini-3.6-flash (default), gemini-3.5-flash,
// gemini-2.5-flash.
//
// NOTE ON QUOTA: a Gemini Advanced / Google One AI Premium subscription grants Pro models in the
// consumer chat app at gemini.google.com -- it grants NO API quota. The API tier is set by whether
// billing is enabled on the Cloud project behind GEMINI_API_KEY, and is entirely separate. If
// requests come back 429 with a quota metric containing "free_tier", that project is on the free
// tier (20 requests/day/model) regardless of any consumer subscription on the same Google account.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * True when an error from @google/genai is a quota-exhaustion 429 rather than a transient fault.
 * Worth distinguishing because the two need opposite advice: a transient error is worth retrying
 * immediately, a daily-quota error is not retryable until the quota window resets.
 */
export function isQuotaError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  const message = String((err as { message?: string })?.message ?? err ?? '');
  return message.includes('RESOURCE_EXHAUSTED') || message.includes('exceeded your current quota');
}
