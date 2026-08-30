import fs from 'fs';
import path from 'path';

// Static HTML generator for /research/risk-without-price/ -- the national homeowners-insurance
// study.
//
// UNLIKE every other prerender script in this build, this one does NOT template off dist/shell.html
// and does NOT write its markup into <div id="root">. That is deliberate and load-bearing.
//
// src/main.tsx mounts with createRoot(), not hydrateRoot(), so React discards everything inside
// #root the instant the bundle boots. Every other prerendered page survives that because it has a
// real SPA route that re-renders the same content client-side. This page has no SPA route at all --
// it is a self-contained document with its own typography and its own inline stylesheet. Injected
// into the shell, it would render correctly for a crawler and then be wiped to a blank #root the
// moment a human's browser finished loading the bundle, which is the worst of both worlds.
//
// So this writes a complete standalone document with no app script tags. Vercel serves it by
// filesystem priority, ahead of vercel.json's catch-all SPA rewrite -- the same mechanism that
// makes '/' resolve to the real dist/index.html rather than the shell (see prerender-homepage.tsx).
//
// SOURCE OF TRUTH is docs/risk-without-price.html, which is also what gets published as the shared
// artifact. One file, two outputs, no drift: that file holds an inline <style> block plus the page
// markup, with no <head> of its own, because the artifact host supplies its own skeleton. This
// script supplies the skeleton for the website copy, and adds the two things the artifact does not
// need and must not have: crawlable site navigation, and real SEO metadata.
const SOURCE = path.join(process.cwd(), 'docs', 'risk-without-price.html');

const CANONICAL_URL = 'https://www.beforeregret.com/research/risk-without-price/';
const TITLE = 'Risk Without Price: what Americans actually pay to insure their homes vs. the risk they face';
const DESCRIPTION =
  'A study of 3,093 U.S. counties and 50.7 million mortgaged households. Which state a home sits in explains more than twice as much of its homeowners insurance premium as the natural-hazard risk the home actually faces.';
const OG_IMAGE = 'https://www.beforeregret.com/og-image.png';
const PUBLISHED = '2026-08-30';

// Dataset + ScholarlyArticle rather than plain Article. This page's whole claim on being cited is
// that it is a reproducible analysis of two named public datasets, and those are the types that say
// so in a way an answer engine can read. citation/isBasedOn name the actual sources so the
// provenance survives being quoted without the surrounding prose.
const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: 'Risk Without Price',
    alternativeHeadline:
      'State of residence explains more than twice as much of American homeowners insurance premiums as hazard risk does',
    description: DESCRIPTION,
    url: CANONICAL_URL,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    author: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
    publisher: {
      '@type': 'Organization',
      name: 'Before Regret',
      url: 'https://www.beforeregret.com/',
      logo: { '@type': 'ImageObject', url: 'https://www.beforeregret.com/logo-mark.png' },
    },
    image: OG_IMAGE,
    keywords:
      'homeowners insurance, premiums, natural hazard risk, FEMA National Risk Index, American Community Survey, rate regulation, property risk',
    isBasedOn: [
      {
        '@type': 'Dataset',
        name: 'American Community Survey 5-year estimates, 2023, table B25141 (Homeowners insurance costs by mortgage status)',
        creator: { '@type': 'Organization', name: 'U.S. Census Bureau' },
        url: 'https://api.census.gov/data/2023/acs/acs5',
      },
      {
        '@type': 'Dataset',
        name: 'FEMA National Risk Index, county table',
        creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
        url: 'https://hazards.fema.gov/nri/',
      },
      {
        '@type': 'Dataset',
        name: 'American Community Survey 5-year estimates, 2023, table B25077 (Median home value)',
        creator: { '@type': 'Organization', name: 'U.S. Census Bureau' },
        url: 'https://api.census.gov/data/2023/acs/acs5',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
      { '@type': 'ListItem', position: 2, name: 'Research', item: CANONICAL_URL },
    ],
  },
];

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// Plain HTML, styled off the study's own custom properties. StaticFooterLinks is not reusable here:
// it is Tailwind-classed, and this document never loads the app's stylesheet.
const SITE_NAV = `
<nav class="sitebar" aria-label="Before Regret">
  <a href="/" class="brand">Before&nbsp;Regret</a>
  <span class="sitebar-sep" aria-hidden="true">&#183;</span>
  <span class="sitebar-here">Research</span>
</nav>`;

const SITE_FOOTER = `
<nav class="sitelinks" aria-label="Site sections">
  <div>
    <h4>Before Regret</h4>
    <ul>
      <li><a href="/">Research a property</a></li>
      <li><a href="/guides/">Editorial guides</a></li>
      <li><a href="/about/">About &amp; methodology</a></li>
      <li><a href="/advertise/">Advertise with us</a></li>
    </ul>
  </div>
  <div>
    <h4>This study</h4>
    <ul>
      <li><a href="https://www.census.gov/programs-surveys/acs/" rel="noopener">U.S. Census Bureau, ACS</a></li>
      <li><a href="https://hazards.fema.gov/nri/" rel="noopener">FEMA National Risk Index</a></li>
      <li><a href="/support/">Corrections &amp; questions</a></li>
    </ul>
  </div>
</nav>`;

const EXTRA_CSS = `
.sitebar{max-width:1000px;margin:0 auto;padding:22px 0 0;display:flex;align-items:baseline;gap:10px;
  font-family:var(--mono);font-size:.74rem;letter-spacing:.14em;text-transform:uppercase}
.sitebar .brand{color:var(--ink);text-decoration:none;font-weight:600;border-bottom:1px solid var(--rule)}
.sitebar .brand:hover{border-bottom-color:var(--price)}
.sitebar-sep,.sitebar-here{color:var(--muted)}
.sitelinks{max-width:1000px;margin:0 auto;padding:44px 0 0;border-top:1px solid var(--rule);
  display:grid;grid-template-columns:1fr;gap:28px;font-family:var(--mono);font-size:.78rem}
@media(min-width:640px){.sitelinks{grid-template-columns:1fr 1fr}}
.sitelinks h4{margin:0 0 10px;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);font-weight:600}
.sitelinks ul{list-style:none;margin:0;padding:0}
.sitelinks li{margin:0 0 7px}
.sitelinks a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--rule)}
.sitelinks a:hover{border-bottom-color:var(--price);color:var(--price)}`;

async function run() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`[prerender-research] ${SOURCE} not found.`);
    process.exit(1);
  }
  const source = fs.readFileSync(SOURCE, 'utf8');

  // The source file is <title> + <link> font tags + <style> + markup. Split it so the head parts
  // go in the head and the markup goes in the body -- a <link> to a stylesheet inside <body> is
  // valid but a <title> there is not, and neither belongs in the middle of the document.
  const wrapIndex = source.indexOf('<div class="wrap">');
  if (wrapIndex === -1) {
    console.error('[prerender-research] could not find the document body in the source file.');
    process.exit(1);
  }
  const headParts = source.slice(0, wrapIndex).replace(/<title>[^<]*<\/title>\s*/i, '');

  // The source's own kicker reads "Before Regret - Research", which is exactly what SITE_NAV above
  // now says two lines higher. It has to stay in the source, because the artifact copy has no site
  // chrome and would otherwise be unattributed -- so it is swapped here rather than deleted there.
  // A dated byline is the more useful thing on the website copy anyway: this is a study of a fixed
  // data vintage, and a reader who cannot see when it was published cannot judge it.
  const kicker = /<p class="kicker">[\s\S]*?<\/p>/;
  const bodyMarkupRaw = source.slice(wrapIndex);
  if (!kicker.test(bodyMarkupRaw)) {
    console.error('[prerender-research] kicker not found -- the source layout changed; check before shipping.');
    process.exit(1);
  }
  const bodyMarkup = bodyMarkupRaw.replace(
    kicker,
    '<p class="kicker">Published 30 August 2026 &#183; Free to reproduce with attribution</p>'
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(DESCRIPTION)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(CANONICAL_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(CANONICAL_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(DESCRIPTION)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta property="article:published_time" content="${PUBLISHED}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(DESCRIPTION)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${headParts.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(JSON_LD)}</script>
</head>
<body>
${SITE_NAV}
${bodyMarkup.trim()}
${SITE_FOOTER}
</body>
</html>`;

  const outDir = path.join(process.cwd(), 'dist', 'research', 'risk-without-price');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

  // The machine-readable figures behind every number on the page. Published deliberately: the study
  // asks to be cited, and a citable study has to let someone check its arithmetic.
  const figuresSrc = path.join(process.cwd(), 'docs', 'data', 'risk-without-price-figures.json');
  if (fs.existsSync(figuresSrc)) {
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(figuresSrc, path.join(dataDir, 'risk-without-price-figures.json'));
  }

  console.log(`[prerender-research] Wrote static HTML for /research/risk-without-price/ (${Math.round(html.length / 1024)} KB)`);
}

run().catch((err) => {
  console.error('[prerender-research] failed:', err);
  process.exit(1);
});
