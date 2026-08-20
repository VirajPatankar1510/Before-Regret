import crypto from 'crypto';

// Google Search Console keyword research -- real queries Google already shows impressions for on
// this site, scoped to a seed term via the API's own "contains" filter. Deliberately hand-rolled
// JWT service-account auth via Node's built-in crypto (RFC 7523 JWT-bearer grant) instead of the
// `googleapis` package: that package bundles hundreds of unrelated API clients for one endpoint
// call, and this project already prefers a small amount of protocol-level code over a heavy
// dependency (see the TOTP implementation in adminAuth.ts for the same tradeoff).
//
// Setup this depends on (one-time, done by whoever owns the Search Console property -- Claude
// cannot do this, it requires their Google login):
//   1. Google Cloud Console -> create/select a project -> enable "Google Search Console API".
//   2. Create a Service Account, generate a JSON key.
//   3. In Search Console (Settings -> Users and permissions) for this property, add the service
//      account's email as a user with "Restricted" (read-only) access.
//   4. Set GSC_SERVICE_ACCOUNT_EMAIL, GSC_SERVICE_ACCOUNT_PRIVATE_KEY (the PEM, with literal \n
//      for newlines), and GSC_SITE_URL (the exact property string shown in Search Console --
//      either "https://www.beforeregret.com/" for a URL-prefix property or "sc-domain:
//      beforeregret.com" for a Domain property) as env vars, locally and in the production host.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export interface SearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** One row of the `page` dimension: a full canonical URL, not a slug. */
export interface SearchConsolePageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function isSearchConsoleConfigured(): boolean {
  return Boolean(
    process.env.GSC_SERVICE_ACCOUNT_EMAIL &&
    process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GSC_SITE_URL
  );
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Exchanges the service account's private key for a short-lived OAuth access token. Not cached
// across calls -- this is an admin-only, low-frequency tool (a founder occasionally checking
// topic ideas), not a hot path worth the complexity of token-expiry bookkeeping.
async function getAccessToken(): Promise<string> {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }));
  const signInput = `${header}.${claims}`;
  const signature = base64url(crypto.createSign('RSA-SHA256').update(signInput).sign(privateKey));
  const jwt = `${signInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Search Console token exchange failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

// Real search queries Google already shows impressions for on this site, over the last 90 days
// (GSC's own data lag means the most recent ~2-3 days never have data yet, which is fine here --
// this is topic research, not live monitoring). When seedTerm is given, scoped to queries
// containing it via the API's own filter rather than fetching everything and filtering
// client-side, since the API caps rows per request and the seed-matching rows could easily be
// pushed out of an unfiltered top-N by unrelated high-volume queries.
export async function fetchTopSearchQueries(seedTerm?: string): Promise<SearchConsoleQueryRow[]> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const accessToken = await getAccessToken();

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const trimmedSeed = seedTerm?.trim();
  const body: Record<string, unknown> = {
    startDate: iso(startDate),
    endDate: iso(endDate),
    dimensions: ['query'],
    rowLimit: 50,
  };
  if (trimmedSeed) {
    body.dimensionFilterGroups = [
      { filters: [{ dimension: 'query', operator: 'contains', expression: trimmedSeed }] },
    ];
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Search Console query failed (${res.status}): ${errBody}`);
  }

  const json = (await res.json()) as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
  const rows = (json.rows || []).map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  // The API's default sort is by clicks -- re-sorted by impressions here, since a query with real
  // search interest but a low ranking (few clicks) is exactly the useful signal for topic
  // research, and clicks-first ordering buries it under queries the site already ranks well for.
  return rows.sort((a, b) => b.impressions - a.impressions);
}

/**
 * Per-URL performance over a window, using the `page` dimension.
 *
 * Answers a question nothing else in this codebase can: which individual pages earn any search
 * impressions at all. fetchTopSearchQueries above reports what the SITE ranks for in aggregate,
 * which says nothing about whether a given one of ~250 published URLs has ever been shown.
 *
 * THE IMPORTANT PROPERTY, and the reason callers must not treat this as a page list: Search
 * Console only returns rows for pages that had at least one impression in the window. A page with
 * zero impressions is not a row with zeroes -- it is ABSENT. So the interesting set (pages Google
 * has never shown to anyone) can only be found by subtracting these rows from the site's own list
 * of published URLs. See scripts/gsc-page-coverage.ts, which does exactly that.
 *
 * Paginates because the default rowLimit is far below the number of URLs this site publishes, and
 * a silently truncated response would read as "these pages have no impressions" -- the same
 * absence that genuinely means zero. Two different facts must not collapse into one.
 */
export async function fetchPagePerformance(days: number = 90): Promise<SearchConsolePageRow[]> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const accessToken = await getAccessToken();

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const PAGE_SIZE = 5000; // well under the API's 25000 ceiling, comfortably above this site's URL count
  const rows: SearchConsolePageRow[] = [];

  for (let startRow = 0; ; startRow += PAGE_SIZE) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: iso(startDate),
          endDate: iso(endDate),
          dimensions: ['page'],
          rowLimit: PAGE_SIZE,
          startRow,
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Search Console page query failed (${res.status}): ${errBody}`);
    }

    const json = (await res.json()) as {
      rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }>;
    };
    const batch = json.rows || [];
    for (const r of batch) {
      rows.push({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    }
    if (batch.length < PAGE_SIZE) break;
  }

  return rows.sort((a, b) => b.impressions - a.impressions);
}

export interface UrlInspectionResult {
  url: string;
  coverageState: string;
  verdict: string;
  indexed: boolean;
  lastCrawlTime: string | null;
  pageFetchState: string | null;
  robotsTxtState: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  error?: string;
}

/**
 * A different API from the two above -- searchanalytics/searchAnalytics reports what already
 * happened (impressions, clicks), which is silent about a URL Google has never shown to anyone
 * and never crawled. This is the only endpoint that answers "does Google know this URL exists,
 * has it been crawled, and is it actually indexed right now" for one specific URL on demand --
 * the same check the Search Console UI's own "URL Inspection" tool runs, exposed as an API so a
 * whole candidate list can be swept without clicking through the UI one URL at a time.
 *
 * Same service-account JWT auth as the two functions above and the same readonly scope -- an
 * inspection is a read, it changes nothing on the property, so no broader scope is needed.
 *
 * Deliberately swallows a per-URL failure into the returned row's `error` field rather than
 * throwing, so one bad URL (a typo, a URL outside this property) can't abort a whole sweep of
 * dozens of others -- the caller decides what to do with a partial-failure row instead of losing
 * every result after it.
 */
export async function fetchUrlInspection(url: string): Promise<UrlInspectionResult> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const accessToken = await getAccessToken();

  try {
    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        url, coverageState: 'ERROR', verdict: 'ERROR', indexed: false,
        lastCrawlTime: null, pageFetchState: null, robotsTxtState: null,
        googleCanonical: null, userCanonical: null,
        error: `${res.status}: ${errBody.slice(0, 300)}`,
      };
    }

    const json = await res.json() as {
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          lastCrawlTime?: string;
          pageFetchState?: string;
          robotsTxtState?: string;
          googleCanonical?: string;
          userCanonical?: string;
        };
      };
    };
    const r = json.inspectionResult?.indexStatusResult;
    return {
      url,
      coverageState: r?.coverageState ?? 'UNKNOWN',
      verdict: r?.verdict ?? 'UNKNOWN',
      // "Submitted and indexed" is the one coverage state that actually means "on Google" --
      // every other state (Discovered, Crawled but not indexed, URL is unknown to Google, etc.)
      // means it is not, regardless of what the coarser PASS/NEUTRAL verdict says.
      indexed: r?.coverageState === 'Submitted and indexed',
      lastCrawlTime: r?.lastCrawlTime ?? null,
      pageFetchState: r?.pageFetchState ?? null,
      robotsTxtState: r?.robotsTxtState ?? null,
      googleCanonical: r?.googleCanonical ?? null,
      userCanonical: r?.userCanonical ?? null,
    };
  } catch (err) {
    return {
      url, coverageState: 'ERROR', verdict: 'ERROR', indexed: false,
      lastCrawlTime: null, pageFetchState: null, robotsTxtState: null,
      googleCanonical: null, userCanonical: null,
      error: String((err as Error)?.message ?? err),
    };
  }
}
