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

// The free tier's per-model daily cap, used to show "X calls left today" in the admin usage panel
// (see the /api/admin/gemini-usage route in articlesApi.ts). This is Google's documented free-tier
// number, not something read back from a live quota-check API -- @google/genai doesn't expose
// remaining quota, so "remaining" there is always DAILY_FREE_TIER_LIMIT_PER_MODEL minus however
// many calls this app's own gemini_usage_log recorded against that model today. That's exact for
// this app's own traffic, but would overstate what's left if the same API key is also used
// elsewhere outside this codebase, and doesn't apply at all once billing is enabled on the project
// (there's no cap to count down from at that point).
export const DAILY_FREE_TIER_LIMIT_PER_MODEL = 20;

// GEMINI_MODEL: the free property report's PRIMARY model -- the single highest-volume, most
// user-facing Gemini call this app makes, so it gets first claim on the best available model's
// 20/day free-tier allowance. Also content generation's LAST-RESORT fallback tier (see
// CONTENT_GENERATION_MODELS below).
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const CONTENT_GENERATION_DEDICATED_MODELS: string[] = process.env.GEMINI_CONTENT_MODELS
  ? process.env.GEMINI_CONTENT_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
  : ['gemini-3.5-flash', 'gemini-2.5-flash'];

// Both routes now cascade through the SAME three models, in opposite priority order -- each
// prefers its own "home" model first, then falls through to the other route's models rather than
// failing outright once its preferred tier is exhausted for the day. Every model has its own
// separate 20/day free-tier allowance, so between them the two routes share a combined pool of up
// to 60 calls/day rather than being hard-walled into 20 (report) and 40 (content) that can never
// borrow from each other.
//
// This is a deliberate trade, not an oversight: a stricter version of this design kept the two
// pools fully isolated so neither route could ever eat into the other's quota. That's safer in
// theory but wastes real capacity in practice -- on a day where content generation runs light,
// its spare quota would otherwise just go unused while a report request that same day degrades to
// the non-AI fallbackReport for lack of an available model. Letting both routes reach for
// whatever's actually free that day uses the full 60-call pool instead of an artificially
// partitioned slice of it. The asymmetry that's preserved is priority, not access: report
// generation still tries GEMINI_MODEL first and only reaches for the other two after its own is
// exhausted, so on a normal day (well under 20 report requests) the two pools behave exactly as if
// they were still isolated -- this only changes behavior once one side's preferred tier actually
// runs out.
//
// REPORT_GENERATION_MODELS: GEMINI_MODEL first, then the two content-dedicated models as
// fallback -- used by server.ts's report route via generateContentWithFallback. Only reaches its
// second or third tier once GEMINI_MODEL's own 20/day is exhausted; falls through to the existing
// non-AI fallbackReport only if all three are exhausted (or erroring for some other reason).
export const REPORT_GENERATION_MODELS: string[] = CONTENT_GENERATION_DEDICATED_MODELS.includes(GEMINI_MODEL)
  ? [GEMINI_MODEL, ...CONTENT_GENERATION_DEDICATED_MODELS.filter((m) => m !== GEMINI_MODEL)]
  : [GEMINI_MODEL, ...CONTENT_GENERATION_DEDICATED_MODELS];

// CONTENT_GENERATION_MODELS: the two content-dedicated models first, GEMINI_MODEL as fallback --
// used by every OTHER Gemini call in this codebase (articles, comparison reports, county events,
// etc.) via generateContentWithFallback/generateContentStreamWithFallback below. Mirror
// image of REPORT_GENERATION_MODELS above -- same three models, opposite priority order.
export const CONTENT_GENERATION_MODELS: string[] = CONTENT_GENERATION_DEDICATED_MODELS.includes(GEMINI_MODEL)
  ? CONTENT_GENERATION_DEDICATED_MODELS
  : [...CONTENT_GENERATION_DEDICATED_MODELS, GEMINI_MODEL];

/**
 * True when an error from @google/genai is a quota-exhaustion 429 rather than a transient fault.
 * Worth distinguishing because the two need opposite advice: a transient error is worth retrying
 * immediately, a daily-quota error is not retryable until the quota window resets. Kept narrow
 * (429 only) because this is also what call sites read to choose the specific "quota exhausted,
 * retrying won't help until tomorrow" user-facing message -- see contentQuotaExhaustedMessage.
 */
export function isQuotaError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  const message = String((err as { message?: string })?.message ?? err ?? '');
  return message.includes('RESOURCE_EXHAUSTED') || message.includes('exceeded your current quota');
}

// Broader than isQuotaError -- this is what decides whether the fallback chain below cascades to
// the next model. Confirmed live, two different failures in a row on the exact same title/prompt,
// neither a quota error: a raw "fetch failed" / ETIMEDOUT (the TLS read to Gemini never
// completed) and a genuine 503 "this model is currently experiencing high demand" from Gemini
// itself. Both are exactly as safe to retry against a different model as a 429 is -- nothing
// about the request caused either, so a different model's endpoint has just as good a chance of
// succeeding -- but neither matched isQuotaError, so withModelFallback used to rethrow
// immediately on the FIRST model instead of trying the other two, surfacing a generic "AI
// generation failed" to the user for what was really a one-model, one-moment blip.
/**
 * A 200 response carrying no usable text. Confirmed live on gemini-2.5-flash with the Google
 * Search grounding tool enabled: finishReason STOP, no error, and candidates[0].content.parts
 * undefined entirely -- the identical request had returned a full 7,800-character answer minutes
 * earlier. Nothing about it looks like a failure to the SDK, so it reaches the call site as a
 * perfectly successful response that happens to say nothing.
 *
 * Call sites that can detect this throw it so the cascade below treats it like any other transient
 * per-model fault. That matters more than it sounds: retrying the SAME model was the obvious first
 * fix and it does not work (reported live -- the user saw the empty result twice in a row). Moving
 * to the next model does, because the models fail independently.
 */
export class EmptyModelResponseError extends Error {
  constructor(public readonly model: string) {
    super(`${model} returned a response with no text content`);
    this.name = 'EmptyModelResponseError';
  }
}

function isTransientModelError(err: unknown): boolean {
  if (err instanceof EmptyModelResponseError) return true;
  if (isQuotaError(err)) return true;
  const status = (err as { status?: number })?.status;
  if (status === 503) return true;
  const message = String((err as { message?: string })?.message ?? err ?? '');
  if (message.includes('UNAVAILABLE') || message.includes('overloaded') || message === 'fetch failed') return true;
  // Raw Node/undici network failures never reach @google/genai's own error wrapping -- they throw
  // a plain TypeError('fetch failed') with the real reason on .cause, one level down.
  const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
  const transientNetworkCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);
  return Boolean(causeCode && transientNetworkCodes.has(causeCode));
}

export interface ModelFallbackResult<T> {
  result: T;
  /** Which model in the chain actually succeeded -- log this, not the chain's first entry. */
  model: string;
}

/**
 * Tries `attempt(model)` for each model in `models`, in order, cascading to the next ONLY on a
 * transient error (quota exhaustion, a 503/"high demand" response, or a network-level failure
 * reaching Gemini at all). Any other error (a bad request, a content-policy rejection) is assumed
 * to fail identically on every model in the chain -- there's no reason to think a different model
 * fixes a malformed prompt -- so it's rethrown immediately rather than silently burning through
 * the whole chain on a request that was never going to succeed. Rethrows the last model's error
 * once every model in the chain has failed.
 */
async function withModelFallback<T>(
  models: string[],
  attempt: (model: string) => Promise<T>,
  onAttemptError?: (model: string, err: unknown) => void
): Promise<ModelFallbackResult<T>> {
  let lastErr: unknown;
  for (const model of models) {
    try {
      return { result: await attempt(model), model };
    } catch (err) {
      lastErr = err;
      onAttemptError?.(model, err);
      if (!isTransientModelError(err)) throw err;
    }
  }
  throw lastErr;
}

interface GenerateContentClient {
  models: { generateContent: (params: any) => Promise<any> };
}

/**
 * generateContent with automatic cascade through CONTENT_GENERATION_MODELS on quota exhaustion.
 *
 * onAttemptError sees every failed model in the chain, not just the last one. Without it, a chain
 * where the first model is quota-exhausted and the second returns an empty response surfaces only
 * the second failure -- so the user is told "empty response" when the actionable fact is that
 * their daily quota is gone. Which failure a caller reports changes what the user does next, so
 * the caller needs all of them, not the survivor.
 */
export async function generateContentWithFallback(
  ai: GenerateContentClient,
  params: { contents: any; config?: any },
  models: string[] = CONTENT_GENERATION_MODELS,
  onAttemptError?: (model: string, err: unknown) => void
): Promise<ModelFallbackResult<any>> {
  return withModelFallback(models, (model) => ai.models.generateContent({ ...params, model }), onAttemptError);
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
