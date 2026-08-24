import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth.js';
import { isSearchConsoleConfigured, fetchTopSearchQueries } from './searchConsoleService.js';
import { isBingKeywordResearchConfigured, fetchRelatedKeywords } from './bingKeywordService.js';
import { fetchAutocompleteKeywords } from './googleAutocompleteService.js';
import { isSerperConfigured, fetchSerperResults } from './serperService.js';
import { classifyDomain, scoreResults, bandFor } from './serpDifficulty.js';

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

    // Flat merged list, deduplicated by query text. This exists because the admin panel renders a
    // single ranked list and sorts it on click -- returning only the structured `sources` object
    // silently emptied that list, since it reads `data.rows`. Merging here rather than reshaping
    // the UI keeps one ranking pass over all three sources, which is what an editor actually wants:
    // the best phrasing regardless of which upstream happened to surface it.
    //
    // First writer wins on a duplicate, and the order below is the precedence: Search Console rows
    // carry real impressions and a live position and are strictly more informative than the same
    // string arriving from a source that knows neither. Autocomplete rows report impressions 0
    // because that is the truth -- Google's suggest endpoint returns no volume at all, and a
    // fabricated number here would flow straight into the panel's ranking as if it were measured.
    const merged = new Map<string, Record<string, unknown>>();
    const add = (rows: any[], source: string) => {
      for (const r of rows) {
        const key = String(r.query || '').trim().toLowerCase();
        if (!key || merged.has(key)) continue;
        merged.set(key, {
          query: r.query,
          impressions: typeof r.impressions === 'number' ? r.impressions : 0,
          clicks: r.clicks,
          ctr: r.ctr,
          position: r.position,
          broadImpressions: r.broadImpressions,
          source,
          isQuestion: r.isQuestion === true,
        });
      }
    };
    add(searchConsole.rows, 'search-console');
    add(autocomplete.rows, 'autocomplete');
    add(bing.rows, 'bing');

    res.json({
      success: true,
      seedTerm,
      // Retained so existing callers that read `configured` keep working: true when at least one
      // source produced something usable.
      configured: searchConsole.configured || bing.configured || autocomplete.rows.length > 0,
      rows: [...merged.values()],
      sources: { searchConsole, autocomplete, bing },
    });
  });

  // Difficulty for ONE query, scored from who actually ranks. See serpDifficulty.ts for what the
  // number means and, more importantly, what it does not.
  //
  // Deliberately a separate on-demand endpoint rather than a field on every keyword-research row.
  // Each check costs one Serper credit, and the route above routinely returns 100+ autocomplete
  // rows -- scoring them all would spend a hundred credits on a lookup the editor did not ask for,
  // every time they research a topic. One explicit click, one credit.
  app.get('/api/admin/serp-difficulty', requireAdmin, async (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.status(400).json({ success: false, error: 'Pass ?q=<query>.' });
      return;
    }
    if (!isSerperConfigured()) {
      res.json({ success: false, configured: false, error: 'SERPER_API_KEY is not set. Free tier at serper.dev gives 2500 queries with no card.' });
      return;
    }
    try {
      const results = await fetchSerperResults(query, { num: 10 });
      const scored = results.map((r) => ({
        position: r.position,
        domain: r.domain,
        verdict: classifyDomain(r.domain),
      }));
      // An empty result set is an absence of evidence, not a mid-range score. Returning 50 here
      // would rank it alongside genuinely-measured neutral SERPs, which is exactly the wrong
      // conclusion to invite.
      if (scored.length === 0) {
        res.json({ success: true, configured: true, query, score: null, band: null, results: [] });
        return;
      }
      const score = scoreResults(scored);
      res.json({
        success: true,
        configured: true,
        query,
        score,
        band: bandFor(score),
        results: scored.map((s) => ({ position: s.position, domain: s.domain, label: s.verdict.label, kind: s.verdict.kind })),
      });
    } catch (err: any) {
      console.error('[serp-difficulty] lookup failed:', err);
      res.json({ success: false, configured: true, error: err?.message || 'SERP lookup failed.' });
    }
  });
}
