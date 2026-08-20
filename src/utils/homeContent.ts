// Shared homepage content model -- the single source of truth for how the published library is
// grouped and ranked on the homepage.
//
// Imported by BOTH src/components/Hero.tsx (client render) and scripts/prerender-homepage.tsx
// (static crawler-facing render). That's the whole reason this is a plain, dependency-free module
// with no React and no Node imports: the two renders have to agree exactly. When they didn't, the
// static HTML advertised an "Editorial Guides" section that the booted client then replaced with
// nothing -- a crawler and a human saw different pages.
//
// Nothing here fabricates or rewrites content. Cluster titles are editorial framing written by
// hand; every guide title, slug, and count comes from real published rows.

export interface HomeArticle {
  slug: string;
  title: string;
  /** The article's real meta description -- shown verbatim as card copy, never paraphrased. */
  metaDescription?: string | null;
  articleType?: string | null;
  publishedAt?: string | null;
}

export interface HomeCounty {
  slug: string;
  countyName: string;
  stateAbbrev: string;
  population: number | null;
  censusTotalUnits: number | null;
}

// county_data stores county_name all-caps (the form FEMA/NOAA/Census use for matching, e.g. "LOS
// ANGELES"), so every reader-facing use has to title-case it. The same helper with the same
// override map already lives inline in CountiesIndexView.tsx and CountyPageView.tsx; this is the
// homepage's copy, placed here (not imported from a component) so BOTH Hero.tsx and
// scripts/prerender-homepage.tsx -- which must render byte-identical county links -- share one
// definition without either pulling in a React component. The two overrides are the only US
// counties in the covered set whose correct casing isn't a plain word-initial-caps of the
// lowercased form.
const COUNTY_TITLE_CASE_OVERRIDES: Record<string, string> = {
  DUPAGE: 'DuPage',
  DEKALB: 'DeKalb',
};

export function formatCountyName(value: string): string {
  if (COUNTY_TITLE_CASE_OVERRIDES[value]) return COUNTY_TITLE_CASE_OVERRIDES[value];
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

/**
 * Every covered county, sorted for a reader-facing A-Z directory: by formatted name, then state as
 * a tiebreaker (two "Orange County"s in different states sort together but stay deterministic).
 * Used by the homepage county-links section so the crawler-facing static render and the booted
 * client render agree on order, same contract as buildGuideClusters/pickResearchPages above.
 */
export function sortCountiesForDirectory(counties: HomeCounty[]): HomeCounty[] {
  return [...counties].sort((a, b) => {
    const an = formatCountyName(a.countyName);
    const bn = formatCountyName(b.countyName);
    if (an !== bn) return an.localeCompare(bn);
    return a.stateAbbrev.localeCompare(b.stateAbbrev);
  });
}

export interface HomeData {
  articles: HomeArticle[];
  counties: HomeCounty[];
}

export interface GuideCluster {
  id: string;
  /** Buyer-voice framing of the situation, not a topic label -- see note below. */
  title: string;
  blurb: string;
  guides: HomeArticle[];
}

// Cluster definitions, evaluated in array order -- first match wins, so the order encodes
// precedence, not preference. The rules match on lowercased "title + slug" so a guide is caught
// whether the signal lives in its headline or its URL.
//
// Precedence is deliberately by *the buyer's actual worry*, not by subject matter. "Can You Get
// Home Insurance with Aluminum Wiring?" mentions a material, but the person searching it is
// worried about being denied coverage -- so `insurance` outranks `materials`. Same reasoning puts
// `permits` above everything (a permit search is its own errand) and `hiring` above `scope` (both
// mention "home inspector", but choosing one is a different moment than wondering what one covers).
interface ClusterRule {
  id: string;
  title: string;
  blurb: string;
  match: RegExp;
}

const CLUSTER_RULES: ClusterRule[] = [
  {
    id: 'permits',
    title: 'Pulling the paper trail',
    blurb: 'Permit history, open violations, and prior claims — where the records live in specific counties, and how to read them.',
    match: /permit|violation|clue-report|clue report/,
  },
  {
    id: 'insurance',
    title: 'Worried it won’t be insurable',
    blurb: 'The wiring, plumbing, roofs, and panels that make carriers hesitate — and what actually fails a 4-point.',
    match: /insurance|insurable|4-point|four-point/,
  },
  {
    id: 'materials',
    title: 'Buying an older home',
    blurb: 'Knob-and-tube, polybutylene, cast iron, asbestos, lead paint — what era built it in, and what it costs to live with.',
    match: /knob|polybutylene|cast-iron|cast iron|asbestos|aluminum-wiring|aluminum wiring|zinsco|federal pacific|stab-lok|fpe|lead-paint|lead paint|oil tank|oil-tank|eifs|radon/,
  },
  {
    id: 'decoder',
    title: 'Your report says something odd',
    blurb: 'Inspector shorthand translated into plain English — what the phrase means, and whether it’s worth renegotiating over.',
    match: /mean on|mean\?|reverse polarity|tpr valve|amateur workmanship|prior repair|not inspected/,
  },
  {
    id: 'hiring',
    title: 'Choosing (or doubting) an inspector',
    blurb: 'How to vet one, why your agent’s referral isn’t automatically right, and what to do when something gets missed.',
    match: /ask a home inspector|before you hire|recommended by|pre-listing|after closing|substitute/,
  },
  {
    id: 'scope',
    title: 'What an inspection actually covers',
    blurb: 'The gap between what buyers assume is included and what a standard inspection really touches.',
    match: /home inspection|home inspector|sewer scope|inspection check|inspection test/,
  },
  {
    id: 'mechanics',
    title: 'The parts nobody explains',
    blurb: 'Reassessments after closing, listings that stay “active” under contract, and what moves prices on a street.',
    match: /property tax|tax bill|tax assessment|under contract|data center/,
  },
  // --- Appended below, deliberately AFTER every rule above ---------------------------------
  // These were added to classify the ~50 guides the original seven never matched. Appending
  // rather than inserting is the whole point: first-match-wins means anything already
  // classified keeps its cluster, so this cannot silently re-file existing content. Verified
  // against the live corpus at the time: 0 reassignments, 0 evergreen guides left unclustered.
  {
    id: 'negotiation',
    title: 'The report came back bad',
    blurb: 'Repair requests, credits, holdbacks and walking away — what you can actually ask for, and what it costs you to ask.',
    match: /contingency|walk away|escrow holdback|repair request|price credit|appraiser|appraisal|fha|lender|back out|seller/,
  },
  {
    id: 'plumbing',
    title: 'Pipes, septic and water',
    blurb: 'Supply lines, drains, septic and wells — the systems that are expensive precisely because they are buried.',
    match: /orangeburg|galvanized|septic|shared well|well pump|slab leak|water heater|drain line|backwater|plumbing/,
  },
  {
    id: 'electrical',
    title: 'Panels, breakers and amps',
    blurb: 'Whether the service is big enough, and which panel and breaker faults inspectors and insurers actually act on.',
    match: /amp service|breaker|fuse box|electrical panel|split-bus|split bus|outlet|gfci|wiring/,
  },
  {
    id: 'pests',
    title: 'Termites and wood damage',
    blurb: 'WDO reports, active infestations, and telling real termite damage from ordinary rot before it blocks financing.',
    match: /termite|wdo|pest|wood rot|wood-destroying|rodent/,
  },
  {
    id: 'ownership',
    title: 'What it costs once it’s yours',
    blurb: 'HOAs, escrow shortages, lease structures and renovation reality — the bills that arrive after the keys do.',
    match: /hoa|land lease|escrow shortage|homebuyer loan|square footage|renovation cost|hvac|system age|roof leak|roof certification/,
  },
  {
    id: 'structure',
    title: 'Cracks and foundations',
    blurb: 'When movement is cosmetic settling, when it needs a structural engineer, and what prior repairs mean for you.',
    match: /foundation|structural engineer|retaining wall|bowing/,
  },
  {
    id: 'countydata',
    title: 'County risk data and alerts',
    blurb: 'FEMA declarations and county-level rankings built from Census, FEMA, EPA and NOAA records.',
    match: /fema|declaration|county risk|risk analysis|ranking|housing stock|by county|across us counties/,
  },
];

// Widened from HomeArticle to just the two fields it reads, so the guides-index page can classify
// its own lighter row shape (slug/title/metaDescription/publishedAt, no articleType) through the
// exact same rules the homepage clusters by. One taxonomy, two consumers.
//
// Appends a de-hyphenated copy of the whole string rather than replacing hyphens in place, and
// that distinction is load-bearing. The rules above are a mix of spaced patterns ("home
// inspector", "recommended by") and hyphenated ones ("4-point", "cast-iron"), while slugs are
// always hyphenated -- so the original single-form haystack silently failed to match spaced
// patterns against slugs, despite the comment above the rules claiming a guide is caught "whether
// the signal lives in its headline or its URL". Measured against the live corpus: three guides
// were missed purely because of that. Naively replacing hyphens with spaces fixes those three but
// BREAKS two others, because "4-point" in a slug becomes "4 point" and then matches neither
// "4-point" nor "four-point". Keeping both forms in the haystack is the only version that gains
// matches without losing any -- verified: +3 matched, 0 regressions, 0 cluster reassignments.
function haystack(article: { title: string; slug: string }): string {
  const base = `${article.title} ${article.slug}`.toLowerCase();
  return `${base} ${base.replace(/-/g, ' ')}`;
}

/** The cluster id a single guide falls into, or null if no rule matches it. */
export function classifyGuideTopic(article: { title: string; slug: string }): string | null {
  const hay = haystack(article);
  return CLUSTER_RULES.find((r) => r.match.test(hay))?.id ?? null;
}

/**
 * Id + title for every cluster, in the same precedence order the rules are evaluated in. Exists so
 * a filter UI can offer the same topics the homepage groups by without duplicating the labels --
 * if a cluster is ever renamed or reordered, both move together.
 *
 * Note this exposes ALL rules, unlike buildGuideClusters, which drops clusters below minSize. A
 * filter chip that finds two guides is still a useful filter; a homepage card promising a topic
 * and delivering two links is not, which is why only the latter has a floor.
 */
export const GUIDE_CLUSTER_META: { id: string; title: string }[] = CLUSTER_RULES.map((r) => ({
  id: r.id,
  title: r.title,
}));

/** Evergreen buyer guides only -- excludes event-reactive news and the data-reference rankings. */
export function isEvergreenGuide(article: HomeArticle): boolean {
  return (article.articleType ?? 'guide') === 'guide';
}

/**
 * Groups evergreen guides into buyer-situation clusters. Clusters with fewer than `minSize`
 * guides are dropped rather than padded -- a card promising a topic and delivering one link
 * reads thinner than not showing the card at all.
 */
export function buildGuideClusters(articles: HomeArticle[], minSize = 3): GuideCluster[] {
  // Research pages get their own section, so they're held out here -- otherwise a data-ranking
  // page could headline the research section and reappear as an ordinary link inside a cluster.
  const researchSlugs = new Set(pickResearchPages(articles).map((a) => a.slug));

  const buckets = new Map<string, HomeArticle[]>();
  for (const article of articles) {
    if (!isEvergreenGuide(article) || researchSlugs.has(article.slug)) continue;
    const hay = haystack(article);
    const rule = CLUSTER_RULES.find((r) => r.match.test(hay));
    if (!rule) continue;
    const list = buckets.get(rule.id) ?? [];
    list.push(article);
    buckets.set(rule.id, list);
  }

  return CLUSTER_RULES.map((rule) => ({
    id: rule.id,
    title: rule.title,
    blurb: rule.blurb,
    guides: buckets.get(rule.id) ?? [],
  }))
    .filter((cluster) => cluster.guides.length >= minSize)
    .sort((a, b) => b.guides.length - a.guides.length);
}

/**
 * The original-research set: county-ranked reference pages plus the comparison report(s). These
 * are the pages built from real Census/FEMA data rather than written from research, so they carry
 * the authority weight on the homepage and get their own section.
 *
 * `reference` is the article_type the defect-library generator writes; `comparison` is the county-
 * comparison generator's (see countyComparisonApi.ts). The title-shape regex is kept only as a
 * fallback for the one comparison report published before that type existed (stored as 'guide') --
 * narrow enough not to sweep in ordinary guides.
 */
export function pickResearchPages(articles: HomeArticle[]): HomeArticle[] {
  return articles.filter((a) => {
    const type = a.articleType ?? 'guide';
    if (type === 'reference' || type === 'comparison') return true;
    const hay = haystack(a);
    return /ranking|oldest vs|county comparison/.test(hay);
  });
}

