// Single normalizer for every county-keyed lookup in the app. Three separate call sites
// (server.ts's LOCAL_JURISDICTION_SOURCES, inspectionPriorities.ts's EXPANSIVE_SOIL_REGIONS and
// rule.counties, sellerQuestions.ts's equivalent) each independently did
// `(county || '').toLowerCase().trim()`, which is an exact-string match against a free-text field
// supplied by a third-party geocoder.
//
// That was genuinely fragile, and the failure mode is the dangerous kind: it fails SILENTLY and
// degrades to a plausible-looking generic report rather than erroring. Verified on a real report
// for the same address, same year built, changing only the county string:
//
//   county="Travis"         -> 8 priorities, generic "Identify the foundation type",
//                              no crawlspace item, 4x generic usa.gov permit links
//   county="Travis County"  -> 9 priorities, "Get the foundation looked at by a structural
//                              engineer" (the expansive-clay rule), crawlspace item present,
//                              real Austin permit portal links
//
// Nothing in the output signals which version you got. LocationIQ currently returns the
// "Travis County" form so production is fine today, but any drift -- a different geocoder path, a
// manually typed county, "Travis Co.", an all-caps value -- silently strips the county-specific
// content that is most of what distinguishes a paid report from a generic one.
//
// Canonical key form is lowercase WITH the "county" suffix ("travis county"), matching the
// existing lookup tables so no table data had to change.
//
// Louisiana parishes and Alaska boroughs use the same convention in those tables if/when they are
// added, so they normalize the same way rather than being special-cased here.

const SUFFIXES_TO_STRIP = [
  'county',
  'co.',
  'co',
  'parish',
  'borough',
  'census area',
  'municipality',
  'city and borough',
];

/**
 * Normalizes a raw county string to the canonical lookup key used by every county-keyed table.
 * "Travis" / "travis county" / "TRAVIS CO." / " Travis County " all -> "travis county".
 * Returns '' for empty/invalid input so callers get a clean miss rather than a partial match.
 */
export function normalizeCountyKey(rawCounty?: string | null): string {
  if (!rawCounty || typeof rawCounty !== 'string') return '';

  // Strip punctuation early so "Co." and "Co" collapse to the same token, and collapse any
  // internal whitespace runs so "Fort  Bend" matches "Fort Bend".
  let value = rawCounty
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!value) return '';

  // Remove a trailing designator if present, so the base name is all that's left. Longest
  // suffixes are checked first ("city and borough" before "borough") so a longer designator isn't
  // partially consumed by a shorter one that happens to be its own suffix.
  for (const suffix of [...SUFFIXES_TO_STRIP].sort((a, b) => b.length - a.length)) {
    const normalizedSuffix = suffix.replace(/[.]/g, '').trim();
    if (value === normalizedSuffix) return ''; // input was only the word "county" -- not a real name
    if (value.endsWith(` ${normalizedSuffix}`)) {
      value = value.slice(0, -(normalizedSuffix.length + 1)).trim();
      break;
    }
  }

  if (!value) return '';

  return `${value} county`;
}
