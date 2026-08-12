import { withDb, isDbConfigured } from './db.js';

// Real-money cost tracking for every Gemini call the app makes (property report generation,
// admin "Generate with AI", and the batch draft-article generator). Persisted to Postgres rather
// than kept in memory -- this app already has one bug from in-memory state not surviving across
// serverless instances (property reports themselves, flagged separately); a cost counter that
// silently resets whenever a request lands on a fresh instance would be actively misleading
// rather than just imprecise.
//
// Rates verified directly against https://ai.google.dev/gemini-api/docs/pricing (paid tier, per
// 1M tokens) rather than assumed from memory -- Gemini pricing has changed model-to-model within
// this same project already (3.6 Flash's output rate is 17% below 3.5 Flash's). Google bills
// "thinking" tokens at the output rate, which is easy to miss: measured on a real report
// generation call, thinking tokens (3,317) were nearly 3x the visible output (1,277). Both are
// included in the output-token count used for cost below.
const MODEL_PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'gemini-3.6-flash': { input: 1.50, output: 7.50 },
  'gemini-3.5-flash': { input: 1.50, output: 9.00 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
};

export type GeminiUsageSource = 'report_generation' | 'article_generation' | 'batch_draft_articles' | 'backlink_reply_generation' | 'county_event_generation' | 'county_comparison_generation';

export interface GeminiUsageMetadataLike {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
}

function estimateCostUsd(model: string, promptTokens: number, outputTokens: number): number | null {
  const rates = MODEL_PRICING_PER_MILLION_TOKENS[model];
  // Unknown model (e.g. someone sets GEMINI_MODEL to something not in the table above): log the
  // real token counts, but don't guess at a price. A wrong estimate silently shown as a real
  // number is worse than an honest "cost not available for this model" in the UI.
  if (!rates) return null;
  return (promptTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

/**
 * Records one Gemini call's token usage and estimated cost. Fire-and-forget by design: a logging
 * failure must never surface to the caller or affect the response already being sent back to a
 * real user -- this mirrors how attachSponsoredVendors/attachFindingSourceUrls treat their own
 * failures elsewhere in server.ts. Silently does nothing if usage is undefined (can happen if the
 * SDK response omitted it) or if the database isn't configured.
 */
export async function logGeminiUsage(
  source: GeminiUsageSource,
  model: string,
  usage: GeminiUsageMetadataLike | undefined
): Promise<void> {
  if (!usage || !isDbConfigured()) return;
  try {
    const promptTokens = usage.promptTokenCount ?? 0;
    const visibleOutputTokens = usage.candidatesTokenCount ?? 0;
    const thinkingTokens = usage.thoughtsTokenCount ?? 0;
    const billableOutputTokens = visibleOutputTokens + thinkingTokens;
    const totalTokens = usage.totalTokenCount ?? promptTokens + billableOutputTokens;
    const estimatedCost = estimateCostUsd(model, promptTokens, billableOutputTokens);

    await withDb((sql) => sql`
      INSERT INTO gemini_usage_log (
        source, model, prompt_tokens, output_tokens, thinking_tokens, total_tokens, estimated_cost_usd
      ) VALUES (
        ${source}, ${model}, ${promptTokens}, ${visibleOutputTokens}, ${thinkingTokens}, ${totalTokens}, ${estimatedCost}
      )
    `);
  } catch (err) {
    console.error('[gemini-usage] failed to log usage (non-fatal):', err);
  }
}

/** Whether a model has known, verified pricing -- used by the admin UI to show "cost unknown" honestly rather than a fabricated number. */
export function hasKnownPricing(model: string): boolean {
  return model in MODEL_PRICING_PER_MILLION_TOKENS;
}
