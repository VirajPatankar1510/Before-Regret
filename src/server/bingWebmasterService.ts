// Bing Webmaster Tools site data -- the counterpart to searchConsoleService.ts.
//
// WHY BOTH. Everything diagnosed on this site so far has come from one source, and Google is not a
// neutral referee of its own indexing decisions: when it reports a page as "Discovered - currently
// not indexed" there is no way to tell from inside Google whether the page is weak or whether the
// site is simply too new to be worth the crawl. Bing indexes independently, on its own schedule
// and its own thresholds, and it is generally faster to index small new sites. So a page Bing has
// indexed and Google has not is evidence about GOOGLE, not about the page -- which is exactly the
// distinction this project keeps needing and cannot get from Search Console alone.
//
// The API is the same legacy ASP.NET/WCF service as bingKeywordService.ts: GET requests, apikey in
// the query string, every response wrapped in a top-level "d". Dates come back in .NET's
// "/Date(1786431600000-0700)/" format rather than ISO, which is why parseDotNetDate exists.
//
// Set BING_WEBMASTER_API_KEY (bing.com/webmasters -> Settings -> API access) for the verified
// beforeregret.com property.

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

export function isBingWebmasterConfigured(): boolean {
  return Boolean(process.env.BING_WEBMASTER_API_KEY);
}

/** "/Date(1786431600000-0700)/" -> Date. Returns null rather than an Invalid Date on a surprise. */
export function parseDotNetDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /\/Date\((-?\d+)/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function call<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.BING_WEBMASTER_API_KEY!;
  const url = `${BASE}/${method}?${new URLSearchParams({ apikey: apiKey, ...params })}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bing ${method} failed (${res.status}): ${text.slice(0, 300)}`);
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`Bing ${method} returned non-JSON: ${text.slice(0, 200)}`); }
  // The API can return HTTP 200 with an error object in the body -- checked explicitly, because
  // treating that as success would surface an error payload as if it were data.
  if (json?.ErrorCode) throw new Error(`Bing ${method} error ${json.ErrorCode}: ${json.Message}`);
  return json.d as T;
}

export interface BingTrafficPoint { date: Date | null; impressions: number; clicks: number; }
export interface BingQueryRow {
  query: string; impressions: number; clicks: number;
  avgImpressionPosition: number; avgClickPosition: number;
}
export interface BingPageRow {
  page: string; impressions: number; clicks: number;
  avgImpressionPosition: number; avgClickPosition: number;
}
export interface BingCrawlPoint {
  date: Date | null; crawledPages: number; inIndex: number; inLinks: number;
  code2xx: number; code301: number; code302: number; code4xx: number; code5xx: number;
  blockedByRobotsTxt: number; allOtherCodes: number;
}
export interface BingSubmissionQuota { dailyQuota: number; monthlyQuota: number; }

export async function fetchBingSites(): Promise<Array<{ url: string; isVerified: boolean }>> {
  const d = await call<any[]>('GetUserSites');
  return (d || []).map((s) => ({ url: s.Url, isVerified: Boolean(s.IsVerified) }));
}

export async function fetchBingTraffic(siteUrl: string): Promise<BingTrafficPoint[]> {
  const d = await call<any[]>('GetRankAndTrafficStats', { siteUrl });
  return (d || [])
    .map((r) => ({ date: parseDotNetDate(r.Date), impressions: r.Impressions ?? 0, clicks: r.Clicks ?? 0 }))
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

export async function fetchBingQueries(siteUrl: string): Promise<BingQueryRow[]> {
  const d = await call<any[]>('GetQueryStats', { siteUrl });
  return (d || [])
    .map((r) => ({
      query: r.Query, impressions: r.Impressions ?? 0, clicks: r.Clicks ?? 0,
      avgImpressionPosition: r.AvgImpressionPosition ?? -1, avgClickPosition: r.AvgClickPosition ?? -1,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

export async function fetchBingPages(siteUrl: string): Promise<BingPageRow[]> {
  const d = await call<any[]>('GetPageStats', { siteUrl });
  return (d || [])
    .map((r) => ({
      page: r.Query, // GetPageStats reuses the QueryStats shape; "Query" holds the URL path here
      impressions: r.Impressions ?? 0, clicks: r.Clicks ?? 0,
      avgImpressionPosition: r.AvgImpressionPosition ?? -1, avgClickPosition: r.AvgClickPosition ?? -1,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

export async function fetchBingCrawlStats(siteUrl: string): Promise<BingCrawlPoint[]> {
  const d = await call<any[]>('GetCrawlStats', { siteUrl });
  return (d || [])
    .map((r) => ({
      date: parseDotNetDate(r.Date),
      crawledPages: r.CrawledPages ?? 0, inIndex: r.InIndex ?? 0, inLinks: r.InLinks ?? 0,
      code2xx: r.Code2xx ?? 0, code301: r.Code301 ?? 0, code302: r.Code302 ?? 0,
      code4xx: r.Code4xx ?? 0, code5xx: r.Code5xx ?? 0,
      blockedByRobotsTxt: r.BlockedByRobotsTxt ?? 0, allOtherCodes: r.AllOtherCodes ?? 0,
    }))
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

export async function fetchBingSubmissionQuota(siteUrl: string): Promise<BingSubmissionQuota> {
  const d = await call<any>('GetUrlSubmissionQuota', { siteUrl });
  return { dailyQuota: d?.DailyQuota ?? 0, monthlyQuota: d?.MonthlyQuota ?? 0 };
}
