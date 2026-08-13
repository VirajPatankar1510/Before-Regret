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
];

function haystack(article: HomeArticle): string {
  return `${article.title} ${article.slug}`.toLowerCase();
}

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
 * The original-research set: county-ranked reference pages plus the comparison reports. These are
 * the pages built from real Census/FEMA data rather than written from research, so they carry the
 * authority weight on the homepage and get their own section.
 *
 * `reference` is the article_type the defect-library generator writes. The comparison reports are
 * stored as 'guide' (they predate a dedicated type) and are matched by the "ranking"/"oldest vs"
 * shape of their titles instead -- narrow enough not to sweep in ordinary guides.
 */
export function pickResearchPages(articles: HomeArticle[]): HomeArticle[] {
  return articles.filter((a) => {
    if ((a.articleType ?? 'guide') === 'reference') return true;
    const hay = haystack(a);
    return /ranking|oldest vs|county comparison/.test(hay);
  });
}

/** Event-reactive county coverage (FEMA declarations), newest first. */
export function pickCountyUpdates(articles: HomeArticle[], limit = 4): HomeArticle[] {
  return articles.filter((a) => a.articleType === 'news').slice(0, limit);
}

export interface CoverageStats {
  countyCount: number;
  stateCount: number;
  totalHousingUnits: number;
  totalPopulation: number;
  guideCount: number;
  researchCount: number;
}

// Callers only ever pass already-published rows (both the API route and the prerender query filter
// on status = 'published'), so every article counted here is live -- there's no draft to exclude.
export function computeCoverageStats(data: HomeData): CoverageStats {
  const states = new Set(data.counties.map((c) => c.stateAbbrev).filter(Boolean));
  return {
    countyCount: data.counties.length,
    stateCount: states.size,
    totalHousingUnits: data.counties.reduce((sum, c) => sum + (c.censusTotalUnits || 0), 0),
    totalPopulation: data.counties.reduce((sum, c) => sum + (c.population || 0), 0),
    guideCount: data.articles.length,
    researchCount: pickResearchPages(data.articles).length,
  };
}

/** Counties grouped by state, each group and the states themselves ordered by size. */
export function groupCountiesByState(counties: HomeCounty[]): Array<{ state: string; counties: HomeCounty[] }> {
  const byState = new Map<string, HomeCounty[]>();
  for (const county of counties) {
    const list = byState.get(county.stateAbbrev) ?? [];
    list.push(county);
    byState.set(county.stateAbbrev, list);
  }
  return Array.from(byState.entries())
    .map(([state, list]) => ({
      state,
      counties: list.sort((a, b) => (b.population || 0) - (a.population || 0)),
    }))
    .sort((a, b) => b.counties.length - a.counties.length || a.state.localeCompare(b.state));
}

/** "3.6M", "78.2M", "412K" -- compact enough for a stat tile without losing the magnitude. */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Aug 12, 2026", built from UTC parts rather than toLocaleDateString. The same component renders
 * once in Node (the build-time prerender) and again in the browser, and a locale- or timezone-
 * dependent format would silently disagree between the two.
 */
export function formatPublishedDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/**
 * County names arrive from the Census in caps ("LOS ANGELES"). Title-cases them for display while
 * preserving the hyphenated and multi-word forms ("Miami-Dade", "Palm Beach") that a naive
 * capitalize-first-letter pass would flatten.
 */
export function titleCaseCounty(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join('-')
    )
    .join(' ');
}
