// Serper.dev -- Google SERP results with real positions, on a free tier.
//
// WHY THIS EXISTS ALONGSIDE dataForSeoService.ts. Both answer the same question ("who actually
// ranks for this query, and where"), which scripts/organic-difficulty.ts needs and its original
// Gemini-grounding source cannot provide -- grounding returns domains with no rank attached, so a
// forum thread at #1 and one at #9 score identically.
//
// The difference is cost and commitment. DataForSEO requires a verified account with a $50 minimum
// deposit before the API answers at all. Serper gives 2500 queries on signup with no card, which is
// more than 20x this project's entire candidate keyword list -- so it is the right default for
// research at this scale, and DataForSEO stays the option for when backlink data (which Serper does
// not offer) actually becomes the bottleneck.
//
// SOURCE NOTE, worth being straight about: Serper's own API reference could not be retrieved when
// this was written (the docs URL returns a cookie wall). The request and response shape below is
// the one every independent client implementation agrees on -- endpoint, X-API-KEY header, `q`/`gl`/
// `hl`/`num` body, and an `organic` array carrying title/link/position. It is parsed defensively for
// that reason: `position` falls back to array index, and the domain is derived from the URL rather
// than trusted as its own field, so a shape difference degrades rather than throws. If results ever
// look wrong, verify against the live API before assuming the caller is at fault.
//
// Read-only: performs searches, writes nothing anywhere.
const ENDPOINT = 'https://google.serper.dev/search';

export function isSerperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

export interface SerperOrganicResult {
  position: number;
  domain: string;
  url: string;
  title: string;
}

/** Host without protocol or www, or '' when the URL is unparseable -- callers filter those out
 *  rather than classifying an empty domain. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Live Google organic results for one query, with positions.
 *
 * Defaults to the US/English because every keyword this project researches is a US property-buying
 * query; a default-locale SERP would silently answer a different question. One request = one credit
 * against the free 2500.
 */
export async function fetchSerperResults(
  query: string,
  opts: { country?: string; language?: string; num?: number } = {}
): Promise<SerperOrganicResult[]> {
  if (!isSerperConfigured()) throw new Error('SERPER_API_KEY is not set.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: opts.country ?? 'us',
      hl: opts.language ?? 'en',
      num: opts.num ?? 10,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    // 403 here is nearly always an exhausted or invalid key rather than a malformed request, and
    // saying so beats making the caller read a raw upstream body to work that out.
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Serper rejected the API key (HTTP ${res.status}). Check SERPER_API_KEY and remaining credits: ${body}`);
    }
    throw new Error(`Serper search failed (HTTP ${res.status}): ${body}`);
  }

  const json = (await res.json()) as { organic?: Array<Record<string, unknown>> };
  const organic = json.organic ?? [];

  return organic
    .map((r, idx) => {
      const url = String(r.link ?? '');
      return {
        // Serper numbers organic results from 1, but fall back to array order rather than emitting
        // a 0 that positionWeight() would then treat as "no position known".
        position: Number(r.position ?? idx + 1),
        domain: hostOf(url),
        url,
        title: String(r.title ?? ''),
      };
    })
    .filter((r) => r.domain);
}
