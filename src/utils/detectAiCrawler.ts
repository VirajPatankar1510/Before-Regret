// Pure, zero-dependency AI-crawler User-Agent matcher. Deliberately its own file with no imports
// from db.ts or anything Node-specific: this is imported both by src/server/aiCrawlerLog.ts
// (normal Node/Express runtime) and by middleware.ts (Vercel Edge Middleware, a restricted V8
// isolate that cannot run the Neon driver's schema-ensuring code or anything else in db.ts's
// import chain) -- a bundler failing to tree-shake an unused branch out of the edge bundle would
// be a production-breaking risk not worth taking for a few duplicated lines.
//
// Matched by a substring in the User-Agent header against each bot's real, documented identifier
// -- verified against each vendor's own published crawler list, not guessed:
//   - GPTBot, OAI-SearchBot, ChatGPT-User -- OpenAI. GPTBot trains models; OAI-SearchBot and
//     ChatGPT-User fetch live pages for a ChatGPT answer/citation, which is the closer signal to
//     "we got cited" than GPTBot's training crawl.
//   - ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai -- Anthropic. anthropic-ai is the
//     older identifier some tooling still reports; kept for coverage.
//   - PerplexityBot, Perplexity-User -- Perplexity's crawl and live-answer fetch, respectively.
//   - Google-Extended -- Google's separate AI-training/Gemini crawler. Distinct from the regular
//     Googlebot (already tracked via Search Console, so deliberately excluded here to keep this
//     table specific to the AI-answer-engine question rather than duplicating existing data).
//   - CCBot -- Common Crawl, whose corpus feeds many third-party LLM training sets even though it
//     isn't an AI company's own crawler.
//   - Bytespider -- ByteDance (Doubao and other ByteDance AI products).
//   - Amazonbot -- Amazon (Alexa+/AI features).
//   - Applebot-Extended -- Apple's separate AI-training crawler, distinct from the regular
//     Applebot that powers Siri/Spotlight search (same exclusion reasoning as Google-Extended).
//   - meta-externalagent -- Meta AI.
//   - cohere-ai -- Cohere.
//   - DuckAssistBot -- DuckDuckGo's AI-assist feature.
//   - YouBot -- You.com.
// A canonical name is returned (not the raw header) so a report can group by bot without
// re-parsing every row.
const AI_CRAWLER_SIGNATURES: Array<{ match: string; name: string }> = [
  { match: 'OAI-SearchBot', name: 'OpenAI (search)' },
  { match: 'ChatGPT-User', name: 'OpenAI (ChatGPT live fetch)' },
  { match: 'GPTBot', name: 'OpenAI (GPTBot training)' },
  { match: 'Claude-SearchBot', name: 'Anthropic (search)' },
  { match: 'Claude-User', name: 'Anthropic (Claude live fetch)' },
  { match: 'ClaudeBot', name: 'Anthropic (ClaudeBot training)' },
  { match: 'anthropic-ai', name: 'Anthropic (legacy UA)' },
  { match: 'Perplexity-User', name: 'Perplexity (live fetch)' },
  { match: 'PerplexityBot', name: 'Perplexity (crawl)' },
  { match: 'Google-Extended', name: 'Google (AI training)' },
  { match: 'CCBot', name: 'Common Crawl' },
  { match: 'Bytespider', name: 'ByteDance' },
  { match: 'Amazonbot', name: 'Amazon' },
  { match: 'Applebot-Extended', name: 'Apple (AI training)' },
  { match: 'meta-externalagent', name: 'Meta AI' },
  { match: 'cohere-ai', name: 'Cohere' },
  { match: 'DuckAssistBot', name: 'DuckDuckGo AI' },
  { match: 'YouBot', name: 'You.com' },
];

export function detectAiCrawler(userAgent: string): string | null {
  for (const { match, name } of AI_CRAWLER_SIGNATURES) {
    if (userAgent.includes(match)) return name;
  }
  return null;
}
