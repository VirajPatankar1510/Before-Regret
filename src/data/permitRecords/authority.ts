// Which local government most likely handles building permits for a point (Layer 0 of
// docs/plans/permit-coverage-usa-2026-11.md). Pure module, no imports: safe for server and client.
//
// THE RULE (tested on public buildings 2026-11-18, see the plan doc):
//   1. inside an ACTIVE incorporated place (FUNCSTAT "A")        -> that city / town / village
//   2. else inside an ACTIVE county subdivision (FUNCSTAT "A")   -> that town or township (New England, NJ, ...)
//   3. else                                                       -> the county
// Census Designated Places are statistical (FUNCSTAT "S") and never a government: East Los Angeles and Kendall
// carry the mailing cities "Los Angeles" and "Miami" but are unincorporated. The mailing city is NEVER used.
//
// This names the GOVERNMENT, not who actually runs permits there (some towns contract the county or a private
// agency), so anything built on it must say "most likely" until the jurisdiction itself is verified.

export type AuthorityKind = 'place' | 'subdivision' | 'county';

export interface PermitAuthority {
  kind: AuthorityKind;
  /** Display name, e.g. "Clearwater city", "Lexington town", "Los Angeles County". */
  name: string;
  /** Name without the legal suffix, e.g. "Clearwater", "Lexington". */
  baseName: string;
  geoid: string;
  /** 5-digit state+county FIPS of the county containing the point. */
  countyFips: string;
  countyName: string;
}

interface CensusGeo {
  NAME?: string;
  BASENAME?: string;
  GEOID?: string;
  FUNCSTAT?: string;
}

/** `geographies` object from the Census geocoder (layers: Incorporated Places, County Subdivisions, Counties). */
export function authorityFromCensus(geographies: Record<string, CensusGeo[] | undefined> | null | undefined): PermitAuthority | null {
  const county = geographies?.['Counties']?.[0];
  if (!county?.GEOID || !county.NAME) return null;
  const base = { countyFips: county.GEOID, countyName: county.NAME };
  const active = (g: CensusGeo | undefined): g is CensusGeo => !!g && g.FUNCSTAT === 'A' && !!g.NAME && !!g.GEOID;

  const place = (geographies?.['Incorporated Places'] || []).find(active);
  if (place) return { kind: 'place', name: place.NAME!, baseName: place.BASENAME || place.NAME!, geoid: place.GEOID!, ...base };

  const sub = (geographies?.['County Subdivisions'] || []).find(active);
  if (sub) return { kind: 'subdivision', name: sub.NAME!, baseName: sub.BASENAME || sub.NAME!, geoid: sub.GEOID!, ...base };

  return { kind: 'county', name: county.NAME, baseName: county.BASENAME || county.NAME, geoid: county.GEOID, ...base };
}

/** Plain-English label: "the City of Clearwater", "Lexington town", "Los Angeles County". */
export function authorityLabel(a: PermitAuthority): string {
  const m = /^(.*) (city|town|village|borough|township|municipality)$/i.exec(a.name);
  if (a.kind === 'county') return a.name;
  if (m) {
    const [, n, t] = m;
    const type = t.toLowerCase();
    return type === 'city' ? `the City of ${n}` : `the ${type[0].toUpperCase()}${type.slice(1)} of ${n}`;
  }
  return a.name;
}

/** Lower-case comparison keys for matching our database's jurisdiction names against Census names. */
export function nameKeys(name: string): string[] {
  const clean = (s: string) =>
    s.toLowerCase()
      .replace(/^(city|town|village|borough|township) of /, '')
      .replace(/\bsaint\b/g, 'st.')
      .replace(/\bst\b(?!\.)/g, 'st.')
      .replace(/\s+/g, ' ')
      .trim();
  const keys = new Set<string>([clean(name)]);
  const stripped = /^(.*) (city|town|village|borough|township|municipality)$/i.exec(name);
  if (stripped) keys.add(clean(stripped[1]));
  return [...keys];
}
