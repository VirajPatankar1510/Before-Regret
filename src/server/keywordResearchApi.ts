import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth.js';
import { isSearchConsoleConfigured, fetchTopSearchQueries } from './searchConsoleService.js';
import { isBingKeywordResearchConfigured, fetchRelatedKeywords } from './bingKeywordService.js';
import { fetchAutocompleteKeywords } from './googleAutocompleteService.js';

// Admin-only keyword research for the article editor's "Topic" field.
//
// This used to return the FIRST configured source and stop. It now queries all three in parallel
// and returns them together, because they answer three genuinely different questions and picking
// one silently discards the other two:
//
//   searchConsole -- queries this site ALREADY ranks for, with position. The highest-value source,
//                    because a query sitting at position 11 is a page-two result that small
//                    improvements can move onto page one, which is far cheaper than earning a new
//                    ranking from nothing. Correcting an earlier comment in this file: this was
//                    described as structurally empty on a young domain. That is no longer true --
//                    it returns real rows with real positions, and it is now the primary source.
//   autocomplete  -- real Google phrasings, no volume, no credentials. The only source that
//                    suggests queries this site has no history for, which is what "what should I
//                    write next" actually needs. Richest in the question-shaped long tail.
//   bing          -- interest independent of this site, from Bing's much smaller share of US
//                    search, so it is thin on long-tail property queries. Kept as a cross-check,
//                    demoted from primary.
//
// Every source degrades independently: one failing returns its own error string while the others
// still return rows, so the tool never goes dark because a single upstream had a bad day.
export function registerKeywordResearchRoutes(app: Express) {
  app.get('/api/admin/keyword-research', requireAdmin, async (req: Request, res: Response) => {
    const seedTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    // Modifier expansion adds 26 extra upstream requests. Worth it for deliberate topic research,
    // not for an incidental lookup, so it is opt-in via ?modifiers=1.
    const includeModifiers = req.query.modifiers === '1';

    const [searchConsole, autocomplete, bing] = await Promise.all([
      (async () => {
        if (!isSearchConsoleConfigured()) return { configured: false as const, rows: [] };
        try {
          return { configured: true as const, rows: await fetchTopSearchQueries(seedTerm || undefined) };
        } catch (err: any) {
          console.error('[keyword-research] Search Console query failed:', err);
          return { configured: true as const, rows: [], error: 'Search Console query failed.' };
        }
      })(),
      (async () => {
        if (!seedTerm) return { configured: true as const, rows: [] };
        try {
          return { configured: true as const, rows: await fetchAutocompleteKeywords(seedTerm, { includeModifiers }) };
        } catch (err: any) {
          console.error('[keyword-research] Autocomplete query failed:', err);
          return { configured: true as const, rows: [], error: 'Autocomplete lookup failed.' };
        }
      })(),
      (async () => {
        if (!isBingKeywordResearchConfigured()) return { configured: false as const, rows: [] };
        try {
          return { configured: true as const, rows: await fetchRelatedKeywords(seedTerm) };
        } catch (err: any) {
          console.error('[keyword-research] Bing query failed:', err);
          return { configured: true as const, rows: [], error: 'Bing keyword research failed.' };
        }
      })(),
    ]);

    res.json({
      success: true,
      seedTerm,
      // Retained so existing callers that read `configured` keep working: true when at least one
      // source produced something usable.
      configured: searchConsole.configured || bing.configured || autocomplete.rows.length > 0,
      sources: { searchConsole, autocomplete, bing },
    });
  });
}
