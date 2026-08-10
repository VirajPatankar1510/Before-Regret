// Bing Webmaster keyword research. Unlike Google Search Console (see searchConsoleService.ts),
// this reports real search interest in a term regardless of whether this site has any existing
// content or impressions for it -- that's the actual "what should I write about next" signal the
// admin panel needs. Search Console structurally can't answer that for a brand-new site with no
// impression history yet: it only ever surfaces queries tied to impressions this site *already*
// has, so on a domain this young it comes back empty no matter what you type.
//
// Microsoft's own docs for this legacy endpoint don't show a concrete request/response example.
// The exact shape below is confirmed against a real recorded API interaction from
// github.com/merj/bing-webmaster-tools's integration test cassettes (GET, plain YYYY-MM-DD dates,
// a top-level "d" array wrapper), not guessed from the interface signature alone.
//
// Setup: get a free API key from Bing Webmaster Tools (bing.com/webmasters) for the verified
// beforeregret.com property -- Settings -> API access. Set BING_WEBMASTER_API_KEY.

const ENDPOINT = 'https://ssl.bing.com/webmaster/api.svc/json/GetRelatedKeywords';

export interface BingKeywordRow {
  query: string;
  impressions: number;
  broadImpressions: number;
}

export function isBingKeywordResearchConfigured(): boolean {
  return Boolean(process.env.BING_WEBMASTER_API_KEY);
}

// 90 days, matching searchConsoleService.ts's window for consistency between the two sources.
export async function fetchRelatedKeywords(seedTerm: string): Promise<BingKeywordRow[]> {
  const apiKey = process.env.BING_WEBMASTER_API_KEY!;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const url = `${ENDPOINT}?${new URLSearchParams({
    q: seedTerm,
    country: 'us',
    language: 'en-US',
    startDate: iso(startDate),
    endDate: iso(endDate),
    apikey: apiKey,
  })}`;

  const res = await fetch(url, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bing keyword research failed (${res.status}): ${body}`);
  }

  // "d" is the classic ASP.NET/WCF JSON wrapper this legacy API still uses -- not a typo, and not
  // something to unwrap further. A term with zero related search activity returns d: [] with a
  // clean 200, not an error.
  const json = (await res.json()) as { d?: Array<{ Query: string | null; Impressions: number; BroadImpressions: number }> };
  const rows = (json.d || [])
    .filter((r): r is { Query: string; Impressions: number; BroadImpressions: number } => Boolean(r.Query))
    .map((r) => ({ query: r.Query, impressions: r.Impressions, broadImpressions: r.BroadImpressions }));

  return rows.sort((a, b) => b.impressions - a.impressions);
}
