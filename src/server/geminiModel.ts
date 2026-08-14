// Single source of truth for which Gemini model(s) the app calls. Previously the model name was
// hardcoded in three separate places (server.ts's report generation, articlesApi.ts's admin
// "Generate with AI" route, and scripts/generate-draft-articles.ts), which meant switching models
// -- something you actually need to do when one model's quota is exhausted, since Gemini quota is
// per-project-PER-MODEL -- required editing three files and redeploying.
//
// NOTE ON QUOTA: a Gemini Advanced / Google One AI Premium subscription grants Pro models in the
// consumer chat app at gemini.google.com -- it grants NO API quota. The API tier is set by whether
// billing is enabled on the Cloud project behind GEMINI_API_KEY, and is entirely separate. If
// requests come back 429 with a quota metric containing "free_tier", that project is on the free
// tier (20 requests/day/model) regardless of any consumer subscription on the same Google account.

// GEMINI_MODEL: the free property report's PRIMARY model (server.ts calls it directly, first),
// and content generation's LAST-RESORT fallback (see CONTENT_GENERATION_MODELS below) -- it's the
// single highest-volume, most user-facing Gemini call this app makes, so report generation always
// gets first claim on this model's 20/day free-tier allowance, tried before either of content
// generation's two dedicated models ever touch it. If this model's quota is exhausted for the
// report route specifically, that route already degrades gracefully to fallbackReport (a real,
// non-AI report) rather than needing a model fallback of its own.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const CONTENT_GENERATION_DEDICATED_MODELS: string[] = process.env.GEMINI_CONTENT_MODELS
  ? process.env.GEMINI_CONTENT_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
  : ['gemini-3.5-flash', 'gemini-2.5-flash'];

// CONTENT_GENERATION_MODELS: the full cascade every OTHER Gemini call in this codebase uses, via
// generateContentWithFallback/generateContentStreamWithFallback below -- articles, comparison
// reports, backlink replies, etc. Two dedicated tiers first (each with its own separate 20/day
// free-tier allowance, so content generation gets 40/day before ever touching GEMINI_MODEL), then
// GEMINI_MODEL itself appended as a third, last-resort tier once both dedicated models are
// exhausted for the day.
//
// That third tier is a deliberate trade, not an oversight: the stricter version of this design
// kept GEMINI_MODEL fully isolated so content generation could never eat into the report's quota
// at all. This trades a sliver of that isolation for content generation actually finishing on a
// heavy day instead of failing outright at 40 calls -- report generation still always tries
// GEMINI_MODEL FIRST (server.ts calls it directly, never through this cascade), so it only ever
// finds that quota already spent if content generation alone burned through 60 combined calls
// (40 dedicated + up to 20 of GEMINI_MODEL's own) before the report request landed. And even then,
// the report route's existing fallbackReport degrade means the real-world cost of that edge case
// is "one visitor's report is less AI-polished," never a failure. Comma-separated override via
// GEMINI_CONTENT_MODELS for the two dedicated tiers; GEMINI_MODEL is always appended last unless
// the override already ends with it.
export const CONTENT_GENERATION_MODELS: string[] = CONTENT_GENERATION_DEDICATED_MODELS.includes(GEMINI_MODEL)
  ? CONTENT_GENERATION_DEDICATED_MODELS
  : [...CONTENT_GENERATION_DEDICATED_MODELS, GEMINI_MODEL];

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

export interface ModelFallbackResult<T> {
  result: T;
  /** Which model in the chain actually succeeded -- log this, not the chain's first entry. */
  model: string;
}

/**
 * Tries `attempt(model)` for each model in `models`, in order, cascading to the next ONLY on a
 * quota-exhaustion error. Any other error (a bad request, a network fault, a content-policy
 * rejection) is assumed to fail identically on every model in the chain -- there's no reason to
 * think a different model fixes a malformed prompt -- so it's rethrown immediately rather than
 * silently burning through the whole chain on a request that was never going to succeed. Rethrows
 * the last model's error once every model in the chain is quota-exhausted.
 */
async function withModelFallback<T>(
  models: string[],
  attempt: (model: string) => Promise<T>
): Promise<ModelFallbackResult<T>> {
  let lastErr: unknown;
  for (const model of models) {
    try {
      return { result: await attempt(model), model };
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}

interface GenerateContentClient {
  models: { generateContent: (params: any) => Promise<any> };
}

/** generateContent with automatic cascade through CONTENT_GENERATION_MODELS on quota exhaustion. */
export async function generateContentWithFallback(
  ai: GenerateContentClient,
  params: { contents: any; config?: any },
  models: string[] = CONTENT_GENERATION_MODELS
): Promise<ModelFallbackResult<any>> {
  return withModelFallback(models, (model) => ai.models.generateContent({ ...params, model }));
}

interface GenerateContentStreamClient {
  models: { generateContentStream: (params: any) => Promise<any> };
}

/**
 * generateContentStream with the same cascade, applied only to STARTING the stream. A quota 429
 * from this SDK surfaces on that initial call, before any chunk has been yielded -- never mid-
 * stream -- so cascading here can't produce a response that's partly one model's output and
 * partly another's, and can't retry after a caller has already written partial text downstream.
 */
export async function generateContentStreamWithFallback(
  ai: GenerateContentStreamClient,
  params: { contents: any; config?: any },
  models: string[] = CONTENT_GENERATION_MODELS
): Promise<ModelFallbackResult<AsyncGenerator<any>>> {
  return withModelFallback(models, (model) => ai.models.generateContentStream({ ...params, model }));
}

/** Shared copy for the "every fallback model is quota-exhausted" 429 response, used across every
 * admin content-generation route so the six call sites don't hand-maintain six near-identical
 * strings that all need to change together if the chain itself ever changes. */
export function contentQuotaExhaustedMessage(models: string[] = CONTENT_GENERATION_MODELS): string {
  return `Gemini's daily free-tier quota is used up on every fallback model (${models.join(', ')}). Retrying won't help until they reset tomorrow, or enable billing on the Gemini API project to remove the cap entirely.`;
}
