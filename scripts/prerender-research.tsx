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
// Written to match how people actually phrase this in search -- "homeowners insurance rates by
// state", "average home insurance cost" -- rather than restating the headline finding a second
// time. The page's own data answers those queries; the description is where a searcher finds out
// that it does. There is deliberately no <meta name="keywords">: Google dropped support for it in
// 2009 and it does nothing but tell competitors what you are targeting.
const DESCRIPTION =
  'Homeowners insurance rates by state and by county, measured from what households report paying. Across 3,093 U.S. counties and 50.7 million mortgaged households, state of residence explains more than twice as much of the premium as the natural-hazard risk a home actually faces.';
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
    // description is REQUIRED on a nested Dataset and license is recommended -- Google's Rich
    // Results Test flagged all three of these as one critical plus one non-critical issue each
    // when they carried only name/creator/url. Both source agencies are US federal, so their
    // output is a government work rather than a licensed dataset; usa.gov/government-works is the
    // canonical statement of that and was checked to resolve before being used here.
    isBasedOn: [
      {
        '@type': 'Dataset',
        name: 'American Community Survey 5-year estimates, 2023, table B25141 (Homeowners insurance costs by mortgage status)',
        description:
          'Annual homeowners insurance costs reported by owner-occupied households, tabulated by mortgage status into twelve annual-cost bands, for every county in the United States. Five-year period estimates, so figures are centred near 2021 rather than describing a single year.',
        creator: { '@type': 'Organization', name: 'U.S. Census Bureau' },
        url: 'https://api.census.gov/data/2023/acs/acs5',
        license: 'https://www.usa.gov/government-works',
        isAccessibleForFree: true,
      },
      {
        '@type': 'Dataset',
        name: 'FEMA National Risk Index, county table',
        description:
          'Expected annual loss to buildings, population and agriculture from eighteen natural hazards, reported per hazard and in total, for every county in the United States, alongside composite risk scores and ratings.',
        creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
        url: 'https://hazards.fema.gov/nri/',
        license: 'https://www.usa.gov/government-works',
        isAccessibleForFree: true,
      },
      {
        '@type': 'Dataset',
        name: 'American Community Survey 5-year estimates, 2023, table B25077 (Median home value)',
        description:
          'Median value of owner-occupied housing units for every county in the United States. Five-year period estimates, used here as a control variable rather than as a headline figure.',
        creator: { '@type': 'Organization', name: 'U.S. Census Bureau' },
        url: 'https://api.census.gov/data/2023/acs/acs5',
        license: 'https://www.usa.gov/government-works',
        isAccessibleForFree: true,
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
  // FAQPage. Every question here is phrased the way Google Autocomplete says people actually type
  // it, and every answer is a figure this study computed -- no rounding, no restating, no claim the
  // page does not make. The answer text MUST stay a faithful summary of the visible "What this
  // study answers" section: Google requires structured data to reflect on-page content, and an
  // answer that drifts from the text is a manual-action risk, not a clever shortcut.
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which state has the highest homeowners insurance rates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Florida, at a household-weighted median of $2,012 a year, followed by Louisiana ($1,877), Oklahoma ($1,807), Texas ($1,767) and Colorado ($1,717). These are ACS 5-year 2023 figures centred near 2021 and do not reflect the 2023-2025 increases.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which state has the lowest homeowners insurance rates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Utah, at $855 a year, then Nevada ($896), Idaho ($903), Oregon ($912) and Maine ($914). The spread between the most and least expensive state is about 2.4 times.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the average homeowners insurance premium in the United States?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The household-weighted median across 3,093 counties is $1,317 a year for mortgaged owner-occupied homes. That is what households report paying in the American Community Survey, not a quoted rate for a model home.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do homeowners insurance rates reflect actual risk?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Only weakly. Across 3,093 counties, FEMA's modelled hazard risk explains 20% of the variation in what people pay, while state of residence alone explains 44% - more than twice as much. Counties facing the same modelled hazard differ in price by a median of 2.3 times.",
        },
      },
      {
        '@type': 'Question',
        name: 'Why does homeowners insurance not cover flood damage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Flood is excluded from standard HO-3 policies and requires separate NFIP or private cover. Inland flooding alone accounts for 59.2% of FEMA's modelled annual building loss in the United States, and earthquake - also excluded - a further 16.1%. In total 76.5% of modelled building loss falls outside the policy most homeowners buy.",
        },
      },
      {
        '@type': 'Question',
        name: 'How many US homes face earthquake risk without earthquake cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In the 158 counties FEMA scores at or above 95 for earthquake risk, 22,030,850 homes - 57% of the housing stock there - were built before 1980, predating the substantially strengthened seismic provisions of the 1976 Uniform Building Code. US codes had carried seismic requirements since 1927 and modernised them in 1961, and adoption varied by jurisdiction, so age is a proxy for seismic design rather than proof any particular house is unsafe. Standard policies exclude earthquake in all of them.',
        },
      },
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

  // ---- /research/risk-without-price/embed/ ---------------------------------------------------
  // The target of the iframe snippet the study offers. Built by lifting the lookup's own CSS,
  // markup, script and dataset out of the source rather than by keeping a second copy, so the
  // embed cannot drift away from the page it came from. Every extraction below asserts, because a
  // silent miss here would ship an empty iframe to somebody else's site.
  const cssStart = source.indexOf('/* --- County lookup');
  const cssEnd = source.indexOf('.lk-tools{');
  const secStart = source.indexOf('<section class="spine" id="lookup">');
  const secEnd = source.indexOf('</section>', secStart);
  const dataStart = source.indexOf('<script id="county-data"');
  const dataEnd = source.indexOf('</script>', source.indexOf('</script>', dataStart) + 1);
  if (cssStart < 0 || cssEnd < 0 || secStart < 0 || secEnd < 0 || dataStart < 0 || dataEnd < 0) {
    console.error('[prerender-research] could not locate the lookup widget for the embed build.');
    process.exit(1);
  }
  const lookupCss = source.slice(cssStart, cssEnd);
  // Drop the embed/cite tool block from the embedded copy: offering an embed button inside an
  // embed is noise, and the citation belongs on the study page it points at.
  const lookupMarkup = source
    .slice(secStart, secEnd + '</section>'.length)
    .replace(/<div class="lk-tools">[\s\S]*?<div class="lk-panel" id="lkCite">[\s\S]*?<\/div>\s*/, '')
    // The study page can afford four lines explaining the peer-set filter. Inside somebody else's
    // article, vertical space is the scarcest thing there is, so the disclosure is compressed to a
    // single clause rather than dropped -- an unstated filter would be the dishonest saving here.
    .replace(
      /<p class="lk-intro">[\s\S]*?<\/p>/,
      '<p class="lk-intro">Type a county or state to see what its mortgaged homeowners report paying, ' +
      'and what counties facing the same modelled hazard pay. Comparison ranges use counties with at ' +
      'least 5,000 mortgaged households.</p>'
    );
  const lookupScript = source.slice(dataStart, dataEnd + '</script>'.length);
  const rootVars = source.slice(source.indexOf(':root{'), source.indexOf('*{box-sizing:border-box}'));

  const embedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>County homeowners insurance lookup &mdash; Before Regret</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtmlAttr(CANONICAL_URL)}">
${headParts.trim()}
  <style>
${rootVars}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);margin:0;padding:16px;
  font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
.spine{max-width:680px;margin:0 auto}
h3{font-family:var(--mono);font-size:.78rem;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin:0}
p{margin:0}
${lookupCss}
.embed-credit{max-width:680px;margin:14px auto 0;font-family:var(--mono);font-size:.7rem;
  color:var(--muted);text-align:right}
.embed-credit a{color:var(--price)}
  </style>
</head>
<body>
${lookupMarkup}
<p class="embed-credit"><a href="${escapeHtmlAttr(CANONICAL_URL)}" target="_blank" rel="noopener">Risk Without Price</a> &mdash; Before Regret</p>
${lookupScript}
<script>
/* Reports its own height to the embedding page. Needed because the widget is 531px collapsed and
   1210px expanded on a phone, so no single iframe height is right -- a fixed one either clips the
   result or leaves a hole above it. The host's listener is optional: without it the fallback
   height in the snippet still renders a usable tool, it just does not follow the content. */
(function(){
  function post(){
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    try { parent.postMessage({ beforeRegretEmbedHeight: h }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
  window.addEventListener('load', post);
  setTimeout(post, 60);
})();
</script>
</body>
</html>`;

  const embedDir = path.join(outDir, 'embed');
  fs.mkdirSync(embedDir, { recursive: true });
  fs.writeFileSync(path.join(embedDir, 'index.html'), embedHtml, 'utf8');


  // ---- /research/risk-without-cover/ ----------------------------------------------------------
  // The companion flood-coverage study. Same standalone-document contract as above and the same
  // reasoning for it: no SPA route, so it must not be injected into the shell. It needs no embed
  // build, because its value is the finding rather than a widget other sites would host.
  const COVER_SRC = path.join(process.cwd(), 'docs', 'risk-without-cover.html');
  if (fs.existsSync(COVER_SRC)) {
    const coverSource = fs.readFileSync(COVER_SRC, 'utf8');
    const cWrap = coverSource.indexOf('<div class="wrap">');
    if (cWrap === -1) {
      console.error('[prerender-research] risk-without-cover.html has no document body.');
      process.exit(1);
    }
    const cHead = coverSource.slice(0, cWrap).replace(/<title>[^<]*<\/title>\s*/i, '');
    const cBody = coverSource.slice(cWrap);
    const COVER_URL = 'https://www.beforeregret.com/research/risk-without-cover/';
    const COVER_TITLE =
      'Risk Without Cover: how few homes in US flood zones actually carry flood insurance';
    const COVER_DESC =
      'Flood insurance take-up by county. Across 2,304 US counties and 3.75 million homes inside FEMA-mapped flood zones, the median county covers 15% of them, and take-up does not track flood risk.';
    const COVER_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'Risk Without Cover',
        alternativeHeadline:
          'In the typical US county fewer than one in six homes in a mapped flood zone carries flood insurance, and take-up does not track flood risk',
        description: COVER_DESC,
        url: COVER_URL,
        datePublished: '2026-08-31',
        dateModified: '2026-08-31',
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
          'flood insurance, NFIP, flood zone, Special Flood Hazard Area, take-up rate, FEMA National Risk Index, homeowners insurance',
        isBasedOn: [
          {
            '@type': 'Dataset',
            name: 'FEMA OpenFEMA, NFIP residential penetration rates',
            description:
              'Residential structures inside Special Flood Hazard Areas and National Flood Insurance Program contracts in force within them, reported for every county in the United States.',
            creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
            url: 'https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates',
            license: 'https://www.usa.gov/government-works',
            isAccessibleForFree: true,
          },
          {
            '@type': 'Dataset',
            name: 'FEMA National Risk Index, county table',
            description:
              'Expected annual loss to buildings from inland and coastal flooding, per county, used here as the measure of how much flood risk a county actually faces.',
            creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
            url: 'https://hazards.fema.gov/nri/',
            license: 'https://www.usa.gov/government-works',
            isAccessibleForFree: true,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
          { '@type': 'ListItem', position: 2, name: 'Research', item: COVER_URL },
        ],
      },
    ];

    const coverHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(COVER_TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(COVER_DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(COVER_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(COVER_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(COVER_TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(COVER_DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(COVER_TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(COVER_DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${cHead.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(COVER_LD)}</script>
</head>
<body>
${SITE_NAV}
${cBody.trim()}
${SITE_FOOTER}
</body>
</html>`;
    const coverDir = path.join(process.cwd(), 'dist', 'research', 'risk-without-cover');
    fs.mkdirSync(coverDir, { recursive: true });
    fs.writeFileSync(path.join(coverDir, 'index.html'), coverHtml, 'utf8');
    console.log(`[prerender-research] Wrote static HTML for /research/risk-without-cover/ (${Math.round(coverHtml.length / 1024)} KB)`);
  }

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
