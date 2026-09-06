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
const TITLE = 'Homeowners insurance rates by state and county: US data';
// Written to match how people actually phrase this in search -- "homeowners insurance rates by
// state", "average home insurance cost" -- rather than restating the headline finding a second
// time. The page's own data answers those queries; the description is where a searcher finds out
// that it does. There is deliberately no <meta name="keywords">: Google dropped support for it in
// 2009 and it does nothing but tell competitors what you are targeting.
const DESCRIPTION =
  'What US households report paying to insure their homes, by state and county, free to reuse. 3,093 counties and 50.7 million mortgaged households.';
const OG_IMAGE = 'https://www.beforeregret.com/og-image.png';
const PUBLISHED = '2026-08-30';

// Dataset + ScholarlyArticle rather than plain Article. This page's whole claim on being cited is
// that it is a reproducible analysis of two named public datasets, and those are the types that say
// so in a way an answer engine can read. citation/isBasedOn name the actual sources so the
// provenance survives being quoted without the surrounding prose.
// Display budget, asserted rather than trusted: this was over when the check was added, so
// the page was being truncated in results. buildPageTitle guards the guides; nothing guarded these.
if (TITLE.length > 60) { console.error(`[prerender-research] TITLE is ${TITLE.length} chars, over 60.`); process.exit(1); }
if (DESCRIPTION.length > 155) { console.error(`[prerender-research] DESCRIPTION is ${DESCRIPTION.length} chars, over 155.`); process.exit(1); }

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
// On a STUDY page "Research" is a link up to the index; on the index itself it is the current page
// and stays plain text. Splitting them is what gives /research/ four inbound links from the studies
// -- before this the word was inert on every page and the index had no inbound links at all.
const SITE_NAV = `
<nav class="sitebar" aria-label="Before Regret">
  <a href="/" class="brand">Before&nbsp;Regret</a>
  <span class="sitebar-sep" aria-hidden="true">&#183;</span>
  <a href="/research/" class="brand">Research</a>
</nav>`;

const SITE_NAV_INDEX = `
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
  const bodyMarkupKicker = bodyMarkupRaw.replace(
    kicker,
    '<p class="kicker">Published 30 August 2026 &#183; Free to reproduce with attribution</p>'
  );

  // Press kit. This study's figures JSON has shipped to /research/data/ since it was written, but
  // nothing on the page ever pointed at it -- a download nobody can find is a download nobody uses.
  //
  // The CSV here is STATE level, not county. Unlike the other three studies, this one's underlying
  // table is a scatter of anonymous (risk, premium) pairs with no county names attached, so there
  // is no county file to publish. Shipping the 51 state rows and saying so is better than implying
  // a county breakdown exists.
  const rwpKitIdx = bodyMarkupKicker.indexOf('<div class="cite">');
  if (rwpKitIdx < 0) {
    console.error('[prerender-research] could not find the risk-without-price cite block.');
    process.exit(1);
  }
  const rwpKitEnd = bodyMarkupKicker.indexOf('</section>', rwpKitIdx);
  if (rwpKitEnd < 0) {
    console.error('[prerender-research] risk-without-price cite block is not inside a section.');
    process.exit(1);
  }

// A newsroom block: the exhibits as files a reporter can actually use, and a citation sentence
// they can paste without having to work out how to name us.
//
// WHY THE CHART FILES EXIST AT ALL. The exhibits on these pages are inline <svg> whose colours
// come from CSS custom properties on the page. Saved or copied out of the page they render
// colourless, so until now a reporter could read a chart here but could not take one. The .png and
// .svg exports are written by scripts/render-research-charts.py.
//
// The citation line is deliberately a plain sentence with the source named inside it. A reporter
// under deadline will paste it as-is; if it said only "BeforeRegret" they would have to go and
// find out what the underlying data was, and most would simply not cite at all.
function newsroomBlock(opts: {
  title: string; url: string; source: string; published: string;
  sentence: string; charts: Array<{ file: string; label: string }>;
}): string {
  const links = opts.charts.map((c) =>
    `<a href="/research/data/${c.file}.png" download>${c.label} (PNG)</a> &#183; <a href="/research/data/${c.file}.svg" download>SVG</a>`
  ).join('<br>');
  return `
<h3 style="margin-top:2.2em">The charts, as files</h3>
<p>Every exhibit on this page as a high-contrast image, free to reuse with credit. The PNG drops
straight into a document or a slide; the SVG stays sharp at any size.</p>
<p style="margin-top:.7em">${links}</p>

<h3 style="margin-top:2.2em">Cite this</h3>
<p style="margin-top:.7em;font-size:.95rem">${opts.sentence}</p>
<p style="margin-top:.7em;font-size:.9rem;color:var(--muted)">${escapeHtmlAttr(opts.title)}, BeforeRegret, ${opts.published}. Source: ${opts.source}. ${escapeHtmlAttr(opts.url)}</p>
`;
}

  const rwpKit = `
<h3 style="margin-top:2.2em">The data</h3>
<p>Every figure on this page, and the state table behind the charts: 51 rows with the county count, median premium and modelled risk index for each.</p>
<p style="margin-top:.7em"><a href="/research/data/risk-without-price-by-state.csv" download>risk-without-price-by-state.csv</a> &#183; <a href="/research/data/risk-without-price-figures.json">the full figures as JSON</a></p>
<p style="margin-top:.9em;font-size:.9rem;color:var(--muted)">There is no county-level file for this study. The analysis runs on 3,093 county observations, but they are held as anonymous risk-and-premium pairs rather than a named table, so a county breakdown would have to be reconstructed rather than published. The state file and the JSON together contain every number quoted above.</p>
${newsroomBlock({ title: 'Risk Without Price', url: `${escapeHtmlAttr(CANONICAL_URL)}`, source: 'Census ACS &#183; FEMA National Risk Index', published: '30 August 2026',
  sentence: 'Across 3,093 US counties, modelled hazard explains part of what homeowners pay for insurance, but two counties facing the same modelled risk can differ by more than double, according to an analysis of Census and FEMA National Risk Index data by BeforeRegret.',
  charts: [{ file: 'risk-without-price-exhibit-1', label: 'Exhibit 1' }, { file: 'risk-without-price-exhibit-2', label: 'Exhibit 2' }, { file: 'risk-without-price-exhibit-3', label: 'Exhibit 3' }, { file: 'risk-without-price-exhibit-4', label: 'Exhibit 4' }, { file: 'risk-without-price-exhibit-5', label: 'Exhibit 5' }] })}
<h3 style="margin-top:2.2em">Embed the county lookup</h3>
<p>Free to use on any site. It sizes itself to its content and carries its own credit line.</p>
<div class="code" style="margin-top:.7em">&lt;iframe src="${escapeHtmlAttr(CANONICAL_URL)}embed/" width="100%" height="620" style="border:1px solid #ddd" title="County homeowners insurance lookup" loading="lazy"&gt;&lt;/iframe&gt;</div>
`;
  const bodyMarkup = bodyMarkupKicker.slice(0, rwpKitEnd) + rwpKit + bodyMarkupKicker.slice(rwpKitEnd);

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
    const cBodyRaw = coverSource.slice(cWrap);
    const COVER_URL = 'https://www.beforeregret.com/research/risk-without-cover/';

    // Press kit, matching the other three studies.
    const coverKitIdx = cBodyRaw.indexOf('<div class="cite">');
    if (coverKitIdx < 0) {
      console.error('[prerender-research] could not find the risk-without-cover cite block.');
      process.exit(1);
    }
    const coverKitEnd = cBodyRaw.indexOf('</section>', coverKitIdx);
    if (coverKitEnd < 0) {
      console.error('[prerender-research] risk-without-cover cite block is not inside a section.');
      process.exit(1);
    }
    const coverKit = `
<h3 style="margin-top:2.2em">The data</h3>
<p>Flood insurance take-up for 2,304 counties: how many homes sit inside a mapped flood zone, how many NFIP policies are in force, and the resulting rate.</p>
<p style="margin-top:.7em"><a href="/research/data/flood-takeup-by-county.csv" download>flood-takeup-by-county.csv</a> &#183; <a href="/research/data/flood-takeup.json">the full figures as JSON</a></p>
<p style="margin-top:.9em;font-size:.9rem;color:var(--muted)">The take-up column counts NFIP policies only. Private flood insurance has grown and is not in this file, so true coverage is higher than these numbers by an amount the data cannot measure. Read a low figure as "NFIP coverage is low here", not as "these homes are uninsured".</p>
${newsroomBlock({ title: 'Risk Without Cover', url: `${escapeHtmlAttr(COVER_URL)}`, source: 'FEMA NFIP &#183; Census ACS', published: '31 August 2026',
  sentence: 'In the typical US county, roughly one home in seven inside a mapped flood zone carries an NFIP flood policy, and take-up does not track flood risk, according to an analysis of FEMA and Census data by BeforeRegret.',
  charts: [{ file: 'risk-without-cover-exhibit-1', label: 'Exhibit 1' }, { file: 'risk-without-cover-exhibit-2', label: 'Exhibit 2' }] })}
<h3 style="margin-top:2.2em">Embed the county lookup</h3>
<p>Free to use on any site. It sizes itself to its content and carries its own credit line.</p>
<div class="code" style="margin-top:.7em">&lt;iframe src="${escapeHtmlAttr(COVER_URL)}embed/" width="100%" height="680" style="border:1px solid #ddd" title="Flood insurance take-up by county" loading="lazy"&gt;&lt;/iframe&gt;</div>
`;
    const cBody = cBodyRaw.slice(0, coverKitEnd) + coverKit + cBodyRaw.slice(coverKitEnd);
    const COVER_TITLE =
      'Flood insurance take-up by county: NFIP data';
    const COVER_DESC =
      'How few homes inside FEMA-mapped flood zones carry flood insurance, by county, free to reuse. In the median county, about one home in seven.';

    // Display budget, asserted rather than trusted: this was over when the check was added, so
    // the page was being truncated in results. buildPageTitle guards the guides; nothing guarded these.
    if (COVER_TITLE.length > 60) { console.error(`[prerender-research] COVER_TITLE is ${COVER_TITLE.length} chars, over 60.`); process.exit(1); }
    if (COVER_DESC.length > 155) { console.error(`[prerender-research] COVER_DESC is ${COVER_DESC.length} chars, over 155.`); process.exit(1); }

    const COVER_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'Risk Without Cover',
        alternativeHeadline:
          'In the typical US county fewer than one in six homes in a mapped flood zone carries flood insurance, and coverage rates track state of residence more closely than modelled flood risk',
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
              'Expected annual loss to buildings from inland and coastal flooding, per county, used here as the modelled measure of a county\'s flood risk.',
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

    // ---- /research/risk-without-cover/embed/ ---------------------------------------------------
    const cCssStart = coverSource.indexOf('.lk-eyebrow{');
    const cCssEnd = coverSource.indexOf('.pull{');
    const cMarkStart = coverSource.indexOf('<div class="lookup">');
    const cMarkEnd = coverSource.indexOf('</section>', cMarkStart);
    const cDataStart = coverSource.indexOf('<script id="flood-data" type="application/json">');
    const cDataEnd = coverSource.indexOf('</script>', cDataStart);
    const cJsStart = coverSource.indexOf('<script>', cDataEnd);
    const cRootStart = coverSource.indexOf(':root{');
    const cRootEnd = coverSource.indexOf('*{box-sizing:border-box}');
    if (
      cCssStart < 0 || cCssEnd < 0 || cMarkStart < 0 || cMarkEnd < 0 ||
      cDataStart < 0 || cDataEnd < 0 || cJsStart < 0 || cRootStart < 0 || cRootEnd < 0
    ) {
      console.error('[prerender-research] could not locate the cover lookup widget for the embed build.');
      process.exit(1);
    }
    const cLookupCss = coverSource.slice(cCssStart, cCssEnd);
    const cLookupMarkup = coverSource.slice(cMarkStart, cMarkEnd).trim();
    const cDataScript = coverSource.slice(cDataStart, cDataEnd + '</script>'.length);
    const cJsScript = coverSource.slice(cJsStart);
    const cRootVars = coverSource.slice(cRootStart, cRootEnd);

    // UNLIKE the other three widgets, this one carries no caveat of its own -- it was written to sit
    // among the study's own paragraphs, which qualify it at length. An embed has no such context,
    // and an unqualified take-up percentage is genuinely misleading: the figure counts NFIP policies
    // only, so a low number reads as "these homes are uninsured" when what it means is "NFIP
    // coverage is low here". The caveat below is the study's own wording from "What this cannot
    // tell you", not a new claim written for the embed.
    const coverEmbedCaveat =
      '<p class="lk-caveat">Counts NFIP policies only. Private flood insurance has grown and is not ' +
      'included, so true coverage is higher than these figures by an amount this data cannot ' +
      'measure. Flood maps are also imperfect: a county with high take-up inside the mapped zone may ' +
      'still have most of its exposed homes uncovered.</p>';

    const coverEmbedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flood insurance take-up by county &mdash; Before Regret</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtmlAttr(COVER_URL)}">
${cHead.trim()}
  <style>
${cRootVars}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);margin:0;padding:16px;
  font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
.lookup{max-width:680px;margin:0 auto}
h3{font-family:var(--mono);font-size:.78rem;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin:0}
h4{margin:0}
p{margin:0}
${cLookupCss}
.embed-credit{max-width:680px;margin:14px auto 0;font-family:var(--mono);font-size:.7rem;
  color:var(--muted);text-align:right}
.embed-credit a{color:var(--accent,#b4451f)}
  </style>
</head>
<body>
${cLookupMarkup}
${coverEmbedCaveat}
<p class="embed-credit"><a href="${escapeHtmlAttr(COVER_URL)}" target="_blank" rel="noopener">Risk Without Cover</a> &mdash; Before Regret</p>
${cDataScript}
${cJsScript}
<script>
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
    if (!coverEmbedHtml.includes('lk-caveat')) {
      console.error('[prerender-research] cover embed lost its caveat; refusing to build.');
      process.exit(1);
    }
    const coverEmbedDir = path.join(coverDir, 'embed');
    fs.mkdirSync(coverEmbedDir, { recursive: true });
    fs.writeFileSync(path.join(coverEmbedDir, 'index.html'), coverEmbedHtml, 'utf8');
    console.log(`[prerender-research] Wrote /research/risk-without-cover/embed/ (${Math.round(coverEmbedHtml.length / 1024)} KB)`);
  }

  // ---- /research/outside-the-zone/ --------------------------------------------------------------
  // Third study in the series, and the sequel the flood study asked for: risk-without-cover's own
  // limitations section conceded that "a large share of flood damage happens outside" mapped zones
  // without being able to measure it. This measures it from the claims file. Same standalone-document
  // contract as the two above.
  //
  // docs/outside-the-zone.html is GENERATED (see the build script kept with the study's analysis),
  // not hand-edited -- it inlines ~76KB of county data for its lookup and renders a 47-state chart
  // from the same figures, so the prose and the data cannot be allowed to drift apart by hand.
  const ZONE_SRC = path.join(process.cwd(), 'docs', 'outside-the-zone.html');
  if (fs.existsSync(ZONE_SRC)) {
    const zoneSource = fs.readFileSync(ZONE_SRC, 'utf8');
    const zWrap = zoneSource.indexOf('<div class="wrap">');
    if (zWrap === -1) {
      console.error('[prerender-research] outside-the-zone.html has no document body.');
      process.exit(1);
    }
    const zHead = zoneSource.slice(0, zWrap).replace(/<title>[^<]*<\/title>\s*/i, '');
    const zBodyRaw = zoneSource.slice(zWrap);
    const ZONE_URL = 'https://www.beforeregret.com/research/outside-the-zone/';

    // Press kit, same contract as the dam study's: the county table as a spreadsheet, and an embed
    // whose credit line survives a copy desk. See the dam block below for the full reasoning.
    const zoneKitIdx = zBodyRaw.indexOf('<div class="cite">');
    if (zoneKitIdx < 0) {
      console.error('[prerender-research] could not find the outside-the-zone cite block.');
      process.exit(1);
    }
    const zoneKitEnd = zBodyRaw.indexOf('</section>', zoneKitIdx);
    if (zoneKitEnd < 0) {
      console.error('[prerender-research] outside-the-zone cite block is not inside a section.');
      process.exit(1);
    }
    const zoneKit = `
<h3 style="margin-top:2.2em">The data</h3>
<p>The full county table, 1,921 rows, one per US county with a classifiable claims history. The same numbers as the lookup above.</p>
<p style="margin-top:.7em"><a href="/research/data/outside-the-zone-by-county.csv" download>outside-the-zone-by-county.csv</a> &#183; <a href="/research/data/flood-outside-zone.json">the full figures as JSON</a></p>
<p style="margin-top:.9em;font-size:.9rem;color:var(--muted)">Three things to know before you quote the file. The county rows total 2,487,348 classifiable claims rather than the 2,578,413 counted nationally, because not every claim on record carries a county that can be matched; the national and state figures on this page are not built up from the county table. The take-up column is blank for 263 counties rather than zero &#8212; blank means no rate is published for that county, including the 22 where the computed rate exceeded 100%, which the source attributes to structure-count errors, and reading a blank as a zero would invert what it means.</p>
<p style="margin-top:.7em;font-size:.9rem;color:var(--muted)">And six names appear twice, because they are genuinely two places: Baltimore MD, St. Louis MO, and Fairfax, Richmond, Franklin and Roanoke in Virginia each exist as both an independent city and a separate county. The two rows are different jurisdictions with different claims histories. The file does not say which is which, so if you are writing about one of those six, check the count against the source before you publish rather than picking a row.</p>
${newsroomBlock({ title: 'Outside the Zone', url: `${escapeHtmlAttr(ZONE_URL)}`, source: 'FEMA NFIP claims &#183; 1,921 counties', published: '1 September 2026',
  sentence: 'More than one paid NFIP flood claim in four came from outside the mapped high-risk flood zone, and in Texas it was about half, according to an analysis of FEMA claims data by BeforeRegret.',
  charts: [{ file: 'outside-the-zone-exhibit-1', label: 'Exhibit 1' }, { file: 'outside-the-zone-exhibit-2', label: 'Exhibit 2' }] })}
<h3 style="margin-top:2.2em">Embed the county lookup</h3>
<p>Free to use on any site. It sizes itself to its content and carries its own credit line.</p>
<div class="code" style="margin-top:.7em">&lt;iframe src="${escapeHtmlAttr(ZONE_URL)}embed/" width="100%" height="640" style="border:1px solid #ddd" title="Flood claims outside the mapped high-risk zone, by county" loading="lazy"&gt;&lt;/iframe&gt;</div>
`;
    const zBody = zBodyRaw.slice(0, zoneKitEnd) + zoneKit + zBodyRaw.slice(zoneKitEnd);
    const ZONE_TITLE =
      'NFIP flood claims paid outside the flood zone, by county';
    const ZONE_DESC =
      'More than one paid NFIP flood claim in four went to a property outside the mapped high-risk zone. County data for 1,921 counties, free to reuse.';

    // Display budget, asserted rather than trusted: this was over when the check was added, so
    // the page was being truncated in results. buildPageTitle guards the guides; nothing guarded these.
    if (ZONE_TITLE.length > 60) { console.error(`[prerender-research] ZONE_TITLE is ${ZONE_TITLE.length} chars, over 60.`); process.exit(1); }
    if (ZONE_DESC.length > 155) { console.error(`[prerender-research] ZONE_DESC is ${ZONE_DESC.length} chars, over 155.`); process.exit(1); }

    const ZONE_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'Outside the Zone',
        alternativeHeadline:
          'More than one in four US flood insurance claims was paid on a property whose policy was rated outside the high-risk flood zone',
        description: ZONE_DESC,
        url: ZONE_URL,
        datePublished: '2026-09-01',
        dateModified: '2026-09-01',
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
          'flood insurance, NFIP, flood zone, Special Flood Hazard Area, flood claims, FEMA, flood map, homeowners insurance',
        isBasedOn: [
          {
            '@type': 'Dataset',
            name: 'FEMA OpenFEMA, NFIP redacted claims',
            description:
              'Every claim paid by the National Flood Insurance Program, each carrying the flood zone the policy was rated in, the county, the year of loss, and the amounts paid on building and contents.',
            creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
            url: 'https://www.fema.gov/api/open/v2/FimaNfipClaims',
            license: 'https://www.usa.gov/government-works',
            isAccessibleForFree: true,
          },
          {
            '@type': 'Dataset',
            name: 'FEMA OpenFEMA, NFIP residential penetration rates',
            description:
              'Residential structures and National Flood Insurance Program contracts in force, inside and outside Special Flood Hazard Areas, reported for every county in the United States.',
            creator: { '@type': 'Organization', name: 'Federal Emergency Management Agency' },
            url: 'https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates',
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
          { '@type': 'ListItem', position: 2, name: 'Research', item: ZONE_URL },
        ],
      },
    ];

    const zoneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(ZONE_TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(ZONE_DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(ZONE_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(ZONE_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(ZONE_TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(ZONE_DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(ZONE_TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(ZONE_DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${zHead.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(ZONE_LD)}</script>
</head>
<body>
${SITE_NAV}
${zBody.trim()}
${SITE_FOOTER}
</body>
</html>`;
    const zoneDir = path.join(process.cwd(), 'dist', 'research', 'outside-the-zone');
    fs.mkdirSync(zoneDir, { recursive: true });
    fs.writeFileSync(path.join(zoneDir, 'index.html'), zoneHtml, 'utf8');
    console.log(`[prerender-research] Wrote static HTML for /research/outside-the-zone/ (${Math.round(zoneHtml.length / 1024)} KB)`);

    // ---- /research/outside-the-zone/embed/ -----------------------------------------------------
    // Same construction and the same reasoning as the dam embed below: lifted from the source so it
    // cannot drift, asserts every extraction, and refuses to build without the widget's caveat.
    const zCssStart = zoneSource.indexOf('.lk-eyebrow{');
    const zCssEnd = zoneSource.indexOf('.pull{');
    const zMarkStart = zoneSource.indexOf('<div class="lookup">');
    const zMarkEnd = zoneSource.indexOf('</header>');
    const zDataStart = zoneSource.indexOf('<script type="application/json" id="zone-data">');
    const zDataEnd = zoneSource.indexOf('</script>', zDataStart);
    const zJsStart = zoneSource.indexOf('<script>', zDataEnd);
    const zRootStart = zoneSource.indexOf(':root{');
    const zRootEnd = zoneSource.indexOf('*{box-sizing:border-box}');
    if (
      zCssStart < 0 || zCssEnd < 0 || zMarkStart < 0 || zMarkEnd < 0 ||
      zDataStart < 0 || zDataEnd < 0 || zJsStart < 0 || zRootStart < 0 || zRootEnd < 0
    ) {
      console.error('[prerender-research] could not locate the zone lookup widget for the embed build.');
      process.exit(1);
    }
    const zLookupCss = zoneSource.slice(zCssStart, zCssEnd);
    const zLookupMarkup = zoneSource.slice(zMarkStart, zMarkEnd).trim();
    const zDataScript = zoneSource.slice(zDataStart, zDataEnd + '</script>'.length);
    const zJsScript = zoneSource.slice(zJsStart);
    const zRootVars = zoneSource.slice(zRootStart, zRootEnd);

    // A percentage lifted out of its study and dropped into someone else's article is the most
    // misreadable number here: without the caveat, "100%" reads as a prediction about a county
    // rather than a description of the claims already on its record.
    if (!zLookupMarkup.includes('lk-caveat')) {
      console.error('[prerender-research] zone embed is missing its lk-caveat disclaimer; refusing to build.');
      process.exit(1);
    }

    const zoneEmbedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flood claims outside the mapped zone, by county &mdash; Before Regret</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtmlAttr(ZONE_URL)}">
${zHead.trim()}
  <style>
${zRootVars}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);margin:0;padding:16px;
  font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
.lookup{max-width:680px;margin:0 auto}
h3{font-family:var(--mono);font-size:.78rem;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin:0}
h4{margin:0}
p{margin:0}
${zLookupCss}
.embed-credit{max-width:680px;margin:14px auto 0;font-family:var(--mono);font-size:.7rem;
  color:var(--muted);text-align:right}
.embed-credit a{color:var(--accent,#b4451f)}
  </style>
</head>
<body>
${zLookupMarkup}
<p class="embed-credit"><a href="${escapeHtmlAttr(ZONE_URL)}" target="_blank" rel="noopener">Outside the Zone</a> &mdash; Before Regret</p>
${zDataScript}
${zJsScript}
<script>
/* Reports its own height to the embedding page; the widget grows once a county is selected. */
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
    const zoneEmbedDir = path.join(zoneDir, 'embed');
    fs.mkdirSync(zoneEmbedDir, { recursive: true });
    fs.writeFileSync(path.join(zoneEmbedDir, 'index.html'), zoneEmbedHtml, 'utf8');
    console.log(`[prerender-research] Wrote /research/outside-the-zone/embed/ (${Math.round(zoneEmbedHtml.length / 1024)} KB)`);
  }

  // ---- /research/high-hazard-dams/ ------------------------------------------------------------
  // Fourth study. Deliberately NOT another "the official category does not predict the outcome"
  // finding like the three above -- this one reads three of the inventory's own columns together
  // (hazard class, condition, emergency plan) rather than testing one dataset against another.
  //
  // docs/high-hazard-dams.html is GENERATED, same contract as outside-the-zone.html.
  const DAM_SRC = path.join(process.cwd(), 'docs', 'high-hazard-dams.html');
  if (fs.existsSync(DAM_SRC)) {
    const damSource = fs.readFileSync(DAM_SRC, 'utf8');
    const dWrap = damSource.indexOf('<div class="wrap">');
    if (dWrap === -1) {
      console.error('[prerender-research] high-hazard-dams.html has no document body.');
      process.exit(1);
    }
    const dHead = damSource.slice(0, dWrap).replace(/<title>[^<]*<\/title>\s*/i, '');
    const dBodyRaw = damSource.slice(dWrap);
    const DAM_URL = 'https://www.beforeregret.com/research/high-hazard-dams/';

    // The press kit, injected into the study's own "Cite it, check it, take it apart" section.
    //
    // Both halves exist because of how a story actually gets written. A reporter needs the county
    // table as a spreadsheet to find their own patch and check our arithmetic, and an editor needs
    // something that carries attribution through the copy desk -- an embedded widget keeps its
    // credit line, a sentence with a URL in it frequently does not. Building the files without
    // linking them here would have been the same as not building them.
    const damKitIdx = dBodyRaw.indexOf('<div class="cite">');
    if (damKitIdx < 0) {
      console.error('[prerender-research] could not find the dam study cite block to attach the press kit to.');
      process.exit(1);
    }
    const damKitSectionEnd = dBodyRaw.indexOf('</section>', damKitIdx);
    if (damKitSectionEnd < 0) {
      console.error('[prerender-research] dam cite block is not inside a section.');
      process.exit(1);
    }
    const damKit = `
<h3 style="margin-top:2.2em">The data</h3>
<p>The full county table, 2,274 rows, one per US county with at least one dam classified high hazard potential. The same numbers as the lookup above.</p>
<p style="margin-top:.7em"><a href="/research/data/high-hazard-dams-by-county.csv" download>high-hazard-dams-by-county.csv</a> &#183; <a href="/research/data/dams-high-hazard.json">the full figures as JSON</a></p>
<p style="margin-top:.9em;font-size:.9rem;color:var(--muted)">If you total the county file it comes to 16,931 high-hazard dams, not the 17,049 quoted above, and that difference is in the records rather than in the arithmetic: 37 of them are not placed in one of the 50 states, and a further 81 carry no county. Every national figure on this page counts all 17,049. The 636 dams rated poor or unsatisfactory with no emergency action plan appear as 635 in the county file for the same reason.</p>
${newsroomBlock({ title: 'High-Hazard Dams by County', url: `${escapeHtmlAttr(DAM_URL)}`, source: 'USACE National Inventory of Dams', published: '1 September 2026',
  sentence: 'Of 17,049 US dams classified high hazard potential, about one in six carries a condition rating of poor or unsatisfactory, and 636 of those have no emergency action plan on file, according to an analysis of the National Inventory of Dams by BeforeRegret.',
  charts: [{ file: 'high-hazard-dams-exhibit-1', label: 'Exhibit 1' }, { file: 'high-hazard-dams-exhibit-2', label: 'Exhibit 2' }] })}
<h3 style="margin-top:2.2em">Embed the county lookup</h3>
<p>Free to use on any site. It sizes itself to its content and carries its own credit line.</p>
<div class="code" style="margin-top:.7em">&lt;iframe src="${escapeHtmlAttr(DAM_URL)}embed/" width="100%" height="620" style="border:1px solid #ddd" title="High-hazard dams by county" loading="lazy"&gt;&lt;/iframe&gt;</div>
`;
    const dBody = dBodyRaw.slice(0, damKitSectionEnd) + damKit + dBodyRaw.slice(damKitSectionEnd);
    // Metadata is worded to the same standard as the page body: it reports what the inventory
    // RECORDS, attributes every assessment to the regulating agency, and never characterises any
    // dam as dangerous or any agency as negligent. A headline is the part most likely to be quoted
    // out of context, so it carries the "as recorded" framing rather than relying on the body to
    // supply it.
    const DAM_TITLE =
      'High-hazard dams by county: condition and emergency plans';
    const DAM_DESC =
      'US dams rated high hazard potential, by county, free to reuse. 2,791 are rated poor or unsatisfactory and 636 of those have no emergency action plan.';

    // Display budget, asserted rather than trusted: this was over when the check was added, so
    // the page was being truncated in results. buildPageTitle guards the guides; nothing guarded these.
    if (DAM_TITLE.length > 60) { console.error(`[prerender-research] DAM_TITLE is ${DAM_TITLE.length} chars, over 60.`); process.exit(1); }
    if (DAM_DESC.length > 155) { console.error(`[prerender-research] DAM_DESC is ${DAM_DESC.length} chars, over 155.`); process.exit(1); }

    const DAM_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'High-Hazard Dams by County',
        alternativeHeadline:
          'Condition assessments and emergency action plan status recorded for the 17,049 US dams classified high hazard potential, summarised by county',
        description: DAM_DESC,
        url: DAM_URL,
        datePublished: '2026-09-01',
        dateModified: '2026-09-01',
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
          'dam safety, National Inventory of Dams, high hazard potential dam, emergency action plan, USACE, infrastructure, flood risk',
        isBasedOn: [
          {
            '@type': 'Dataset',
            name: 'US Army Corps of Engineers, National Inventory of Dams',
            description:
              'Every dam in the National Inventory of Dams with its hazard potential classification, condition assessment, emergency action plan status, year completed, and location.',
            creator: { '@type': 'Organization', name: 'US Army Corps of Engineers' },
            url: 'https://nid.sec.usace.army.mil/',
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
          { '@type': 'ListItem', position: 2, name: 'Research', item: DAM_URL },
        ],
      },
    ];

    const damHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(DAM_TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(DAM_DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(DAM_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(DAM_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(DAM_TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(DAM_DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(DAM_TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(DAM_DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${dHead.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(DAM_LD)}</script>
</head>
<body>
${SITE_NAV}
${dBody.trim()}
${SITE_FOOTER}
</body>
</html>`;
    const damDir = path.join(process.cwd(), 'dist', 'research', 'high-hazard-dams');
    fs.mkdirSync(damDir, { recursive: true });
    fs.writeFileSync(path.join(damDir, 'index.html'), damHtml, 'utf8');
    console.log(`[prerender-research] Wrote static HTML for /research/high-hazard-dams/ (${Math.round(damHtml.length / 1024)} KB)`);

    // ---- /research/high-hazard-dams/embed/ ----------------------------------------------------
    // Built for reporters, and the reason is mechanical rather than decorative: an editor will
    // strip an inline URL out of copy, but will not strip the attribution inside a chart they have
    // already embedded. An embed is the link most likely to survive a copy edit, which is the
    // whole point of pitching the study in the first place.
    //
    // Lifted from the source page rather than rewritten, exactly as the risk-without-price embed
    // above is, so the two cannot drift apart. Every extraction asserts: a silent miss here ships
    // an empty iframe onto somebody else's site, where nobody would tell us.
    const dCssStart = damSource.indexOf('.lk-eyebrow{');
    const dCssEnd = damSource.indexOf('.pull{');
    const dMarkStart = damSource.indexOf('<div class="lookup">');
    const dMarkEnd = damSource.indexOf('</header>');
    const dDataStart = damSource.indexOf('<script type="application/json" id="dam-data">');
    const dDataEnd = damSource.indexOf('</script>', dDataStart);
    const dJsStart = damSource.indexOf('<script>', dDataEnd);
    const dRootStart = damSource.indexOf(':root{');
    const dRootEnd = damSource.indexOf('*{box-sizing:border-box}');
    if (
      dCssStart < 0 || dCssEnd < 0 || dMarkStart < 0 || dMarkEnd < 0 ||
      dDataStart < 0 || dDataEnd < 0 || dJsStart < 0 || dRootStart < 0 || dRootEnd < 0
    ) {
      console.error('[prerender-research] could not locate the dam lookup widget for the embed build.');
      process.exit(1);
    }
    const dLookupCss = damSource.slice(dCssStart, dCssEnd);
    const dLookupMarkup = damSource.slice(dMarkStart, dMarkEnd).trim();
    const dDataScript = damSource.slice(dDataStart, dDataEnd + '</script>'.length);
    const dJsScript = damSource.slice(dJsStart);
    const dRootVars = damSource.slice(dRootStart, dRootEnd);

    // The caveat travels with the widget, always. Inside somebody else's article a bare county
    // count reads as a danger ranking, which is precisely what the classification is not -- "high
    // hazard potential" describes what is downstream of a dam, not how likely it is to fail. The
    // study page can rely on surrounding paragraphs to establish that; an embed cannot rely on
    // anything around it, so if the caveat is ever refactored out of the source this build stops
    // rather than quietly shipping the number without it.
    if (!dLookupMarkup.includes('lk-caveat')) {
      console.error('[prerender-research] dam embed is missing its lk-caveat disclaimer; refusing to build.');
      process.exit(1);
    }

    const damEmbedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>High-hazard dams by county &mdash; Before Regret</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtmlAttr(DAM_URL)}">
${dHead.trim()}
  <style>
${dRootVars}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);margin:0;padding:16px;
  font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
.lookup{max-width:680px;margin:0 auto}
h3{font-family:var(--mono);font-size:.78rem;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin:0}
h4{margin:0}
p{margin:0}
${dLookupCss}
.embed-credit{max-width:680px;margin:14px auto 0;font-family:var(--mono);font-size:.7rem;
  color:var(--muted);text-align:right}
.embed-credit a{color:var(--accent,#b4451f)}
  </style>
</head>
<body>
${dLookupMarkup}
<p class="embed-credit"><a href="${escapeHtmlAttr(DAM_URL)}" target="_blank" rel="noopener">High-Hazard Dams by County</a> &mdash; Before Regret</p>
${dDataScript}
${dJsScript}
<script>
/* Reports its own height to the embedding page: the widget grows once a county is selected, so no
   single iframe height is correct. The host's listener is optional -- without it the fallback
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
    const damEmbedDir = path.join(damDir, 'embed');
    fs.mkdirSync(damEmbedDir, { recursive: true });
    fs.writeFileSync(path.join(damEmbedDir, 'index.html'), damEmbedHtml, 'utf8');
    console.log(`[prerender-research] Wrote /research/high-hazard-dams/embed/ (${Math.round(damEmbedHtml.length / 1024)} KB)`);
  }

  // The machine-readable figures behind every number on the page. Published deliberately: the study
  // asks to be cited, and a citable study has to let someone check its arithmetic.
  const figuresSrc = path.join(process.cwd(), 'docs', 'data', 'risk-without-price-figures.json');
  if (fs.existsSync(figuresSrc)) {
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(figuresSrc, path.join(dataDir, 'risk-without-price-figures.json'));

    const rwp = JSON.parse(fs.readFileSync(figuresSrc, 'utf8')) as {
      states?: Array<{ st: string; n: number; prem: number; ins: number }>;
    };
    const rwpStates = rwp.states || [];
    if (rwpStates.length === 0) {
      console.error('[prerender-research] risk-without-price-figures.json has no state rows.');
      process.exit(1);
    }
    const rwpMissing = rwpStates.filter(
      (s) => typeof s.st !== 'string' || typeof s.n !== 'number' || typeof s.prem !== 'number' || typeof s.ins !== 'number'
    );
    if (rwpMissing.length > 0) {
      console.error(`[prerender-research] risk-without-price state rows changed shape: ${JSON.stringify(rwpMissing[0])}`);
      process.exit(1);
    }
    const rwpCsv =
      ['state,counties_analysed,median_annual_premium_usd,modelled_risk_index']
        .concat(rwpStates.map((s) => `${s.st},${s.n},${s.prem},${s.ins}`))
        .join('\n') + '\n';
    fs.writeFileSync(path.join(dataDir, 'risk-without-price-by-state.csv'), rwpCsv, 'utf8');
    console.log(`[prerender-research] Wrote risk-without-price-by-state.csv (${rwpStates.length} states)`);
  }

  // Risk Without Cover's figures, which had never shipped at all -- the page linked nothing and the
  // JSON stayed in docs/. County table, 2,304 rows.
  const takeupSrc = path.join(process.cwd(), 'docs', 'data', 'flood-takeup.json');
  if (fs.existsSync(takeupSrc)) {
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(takeupSrc, path.join(dataDir, 'flood-takeup.json'));

    const tk = JSON.parse(fs.readFileSync(takeupSrc, 'utf8')) as {
      cols?: string[];
      counties?: Array<Array<string | number | null>>;
    };
    const tkExpected = ['county', 'st', 'takeup', 'pol', 'homes', 'rate'];
    const tkCols = tk.cols || [];
    if (tkCols.length !== tkExpected.length || tkCols.some((c, i) => c !== tkExpected[i])) {
      console.error(`[prerender-research] flood-takeup.json columns changed: ${JSON.stringify(tkCols)}`);
      process.exit(1);
    }
    const tkRows = tk.counties || [];
    if (tkRows.length === 0) {
      console.error('[prerender-research] flood-takeup.json has no county rows.');
      process.exit(1);
    }
    // Column names spell out that take-up is NFIP-only. The whole study rests on that limit, and a
    // header reading plain "takeup" invites a reader to treat it as all flood insurance.
    const tkHeader = [
      'county',
      'state',
      'nfip_takeup_rate_inside_mapped_zone_pct',
      'nfip_policies_in_force',
      'homes_inside_mapped_zone',
      'modelled_flood_risk_index',
    ];
    const tkEsc = (v: string | number | null) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const tkCsv = [tkHeader.join(','), ...tkRows.map((r) => r.map(tkEsc).join(','))].join('\n') + '\n';
    fs.writeFileSync(path.join(dataDir, 'flood-takeup-by-county.csv'), tkCsv, 'utf8');
    console.log(`[prerender-research] Wrote flood-takeup-by-county.csv (${tkRows.length} counties)`);
  }

  // Same contract for the third study: it invites checking, so the figures behind it ship too --
  // as JSON, and as the county table in the format a newsroom actually opens.
  const zoneFigures = path.join(process.cwd(), 'docs', 'data', 'flood-outside-zone.json');
  if (fs.existsSync(zoneFigures)) {
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(zoneFigures, path.join(dataDir, 'flood-outside-zone.json'));

    const zone = JSON.parse(fs.readFileSync(zoneFigures, 'utf8')) as {
      countyCols?: string[];
      counties?: Array<Array<string | number | null>>;
    };
    const zoneExpected = ['county', 'st', 'claims', 'share', 'paidOutside', 'takeupSfha'];
    const zCols = zone.countyCols || [];
    if (zCols.length !== zoneExpected.length || zCols.some((c, i) => c !== zoneExpected[i])) {
      console.error(`[prerender-research] flood-outside-zone.json columns changed: ${JSON.stringify(zCols)}`);
      process.exit(1);
    }
    const zRows = zone.counties || [];
    if (zRows.length === 0) {
      console.error('[prerender-research] flood-outside-zone.json has no county rows; refusing to write an empty CSV.');
      process.exit(1);
    }
    const zHeader = [
      'county',
      'state',
      'classifiable_claims',
      'pct_of_claims_paid_outside_mapped_zone',
      'paid_on_out_of_zone_claims_usd',
      'takeup_rate_inside_mapped_zone_pct',
    ];
    // A null take-up rate becomes an EMPTY CELL, never a zero. 263 of the 1,921 counties have no
    // published rate -- including 22 the source suppresses because the computed value exceeded
    // 100%, which it attributes to structure-count errors. Writing 0 there would turn "we do not
    // know" into "nobody in this county is insured", which is the opposite claim and the kind of
    // error that gets printed.
    const zEsc = (v: string | number | null) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const zCsv = [zHeader.join(','), ...zRows.map((r) => r.map(zEsc).join(','))].join('\n') + '\n';
    fs.writeFileSync(path.join(dataDir, 'outside-the-zone-by-county.csv'), zCsv, 'utf8');
    const blanks = zRows.filter((r) => r[5] === null || r[5] === undefined).length;
    console.log(
      `[prerender-research] Wrote outside-the-zone-by-county.csv (${zRows.length} counties, ${blanks} with no take-up rate)`
    );
  }

  // The dam study's figures, as JSON and as CSV.
  //
  // CSV IS NOT REDUNDANT WITH THE JSON. A reporter on deadline opens a spreadsheet; they do not
  // parse a nested object to find the county they are writing about. The county table is the part
  // of this study anyone local actually wants -- 2,274 rows, one per county -- so it ships in the
  // format that is one double-click from a sortable sheet. Column names are spelled out rather
  // than kept as the page's internal short keys, because a header row is documentation for
  // somebody who will never read this file.
  const damFigures = path.join(process.cwd(), 'docs', 'data', 'dams-high-hazard.json');
  if (fs.existsSync(damFigures)) {
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(damFigures, path.join(dataDir, 'dams-high-hazard.json'));

    const dam = JSON.parse(fs.readFileSync(damFigures, 'utf8')) as {
      nidUpdated?: string;
      countyCols?: string[];
      counties?: Array<Array<string | number>>;
    };
    const expectedCols = ['county', 'st', 'high', 'bad', 'noEap', 'both', 'unrated'];
    const cols = dam.countyCols || [];
    // Assert the shape rather than trusting it: this file is regenerated upstream, and a silently
    // reordered column would publish a CSV whose headers describe the wrong numbers -- the single
    // worst failure mode for a dataset whose whole purpose is to be quoted.
    if (cols.length !== expectedCols.length || cols.some((c, i) => c !== expectedCols[i])) {
      console.error(`[prerender-research] dams-high-hazard.json columns changed: ${JSON.stringify(cols)}`);
      process.exit(1);
    }
    const rows = dam.counties || [];
    if (rows.length === 0) {
      console.error('[prerender-research] dams-high-hazard.json has no county rows; refusing to write an empty CSV.');
      process.exit(1);
    }
    const header = [
      'county',
      'state',
      'high_hazard_dams',
      'condition_poor_or_unsatisfactory',
      'no_emergency_action_plan_on_file',
      'both_poor_condition_and_no_plan',
      'condition_not_rated',
    ];
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n') + '\n';
    fs.writeFileSync(path.join(dataDir, 'high-hazard-dams-by-county.csv'), csv, 'utf8');
    console.log(
      `[prerender-research] Wrote high-hazard-dams-by-county.csv (${rows.length} counties, NID ${dam.nidUpdated || 'unknown'})`
    );
  }

  console.log(`[prerender-research] Wrote static HTML for /research/risk-without-price/ (${Math.round(html.length / 1024)} KB)`);

  // ---- /research/ ------------------------------------------------------------------------------
  // The index, which did not exist until 2026-09-02: /research/ answered 404 while four studies sat
  // underneath it. Journalists trim URLs, so anyone reading one study who wanted to see the others
  // hit a dead page. The four also linked to nothing and received only a footer link, so they were
  // isolated from each other.
  //
  // Written as a real page rather than a link list. The pitch is "here is a body of work", and one
  // URL that shows four studies with their methods, datasets and embeds makes that case in a way
  // four scattered links cannot. It is also the URL a journalist would cite for the research in
  // general rather than for one finding.
  //
  // Head reuses headParts (fonts + the shared study stylesheet) so the index cannot drift away from
  // the pages it lists.
  // ---- /research/allegheny-storm-premium/ -----------------------------------------------------
  // Fifth study, and the first regional one. The four above are national; this reads one county
  // against the other ninety-nine and argues about the outlier it finds.
  //
  // It exists because the programmatic alternative was already tried and failed on this exact data:
  // 100 templated county pages, 82 Search Console impressions and zero clicks over six months,
  // retired 2026-08-26 (see county_data.page_enabled and legacyUrls.ts). Filling one shape a
  // hundred times does not produce a hundred studies. So the series rule is that a county gets a
  // piece only when it is a genuine outlier on a specific cross-tabulation, and each piece makes a
  // different argument -- otherwise it is the county pages again with better typography.
  //
  // docs/allegheny-storm-premium.html is GENERATED by scripts/build-allegheny-study.ts, same
  // contract as outside-the-zone.html and high-hazard-dams.html: prose lives in the builder, every
  // figure is interpolated from docs/data/storm-and-premium-figures.json, and the builder asserts
  // its own headline ("third stormiest, sixth cheapest") against the data before it will write.
  //
  // No embed widget yet, and STUDIES says embed:false rather than implying one exists. The other
  // four carry a lookup because an embed's credit line survives a copy edit where an inline URL
  // often does not; this one should get the same treatment before it is pitched widely.
  const ALG_SRC = path.join(process.cwd(), 'docs', 'allegheny-storm-premium.html');
  if (fs.existsSync(ALG_SRC)) {
    const algSource = fs.readFileSync(ALG_SRC, 'utf8');
    const aWrap = algSource.indexOf('<div class="wrap">');
    if (aWrap === -1) {
      console.error('[prerender-research] allegheny-storm-premium.html has no document body.');
      process.exit(1);
    }
    const aHead = algSource.slice(0, aWrap).replace(/<title>[^<]*<\/title>\s*/i, '');
    const aBody = algSource.slice(aWrap);
    const ALG_URL = 'https://www.beforeregret.com/research/allegheny-storm-premium/';
    const ALG_TITLE = 'Pittsburgh storm and home insurance data (Allegheny County)';
    const ALG_DESC = 'Storm and home insurance statistics for Pittsburgh and Allegheny County, free to reuse. Third-highest severe weather count of 100 US counties.';


    if (ALG_TITLE.length > 60) { console.error(`[prerender-research] ALG_TITLE is ${ALG_TITLE.length} chars, over the 60-char display budget.`); process.exit(1); }
    if (ALG_DESC.length > 155) { console.error(`[prerender-research] ALG_DESC is ${ALG_DESC.length} chars, over 155.`); process.exit(1); }

    const ALG_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'Third Stormiest, Sixth Cheapest',
        alternativeHeadline: 'Storm frequency and insurance price have come apart in Allegheny County, and the reason is what the policy excludes',
        description: ALG_DESC,
        url: ALG_URL,
        datePublished: '2026-09-06',
        dateModified: '2026-09-06',
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        author: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        publisher: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        spatialCoverage: {
          '@type': 'AdministrativeArea',
          name: 'Allegheny County, Pennsylvania',
          identifier: '42003',
        },
        citation: [
          'NOAA National Centers for Environmental Information, Storm Events Database, 2015-2024',
          'US Census Bureau, American Community Survey 5-year, table B25141',
          'US Environmental Protection Agency, Map of Radon Zones',
          'US Census Bureau, 2023 Gazetteer Files',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Storm frequency, housing age and reported insurance cost across 100 US counties',
        description: 'County-level severe weather counts by event type (NOAA Storm Events 2015-2024), housing units by construction era, EPA radon zone, land area, and the distribution of what mortgaged households report paying for homeowners insurance (ACS B25141).',
        url: ALG_URL,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://www.beforeregret.com/research/data/storm-and-premium-counties.csv' },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://www.beforeregret.com/research/data/storm-and-premium-figures.json' },
        ],
      },
    ];

    const algHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(ALG_TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(ALG_DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(ALG_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(ALG_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(ALG_TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(ALG_DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(ALG_TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(ALG_DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${aHead.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(ALG_LD)}</script>
</head>
<body>
${SITE_NAV}
${aBody.trim()}
${SITE_FOOTER}
</body>
</html>`;
    const algDir = path.join(process.cwd(), 'dist', 'research', 'allegheny-storm-premium');
    fs.mkdirSync(algDir, { recursive: true });
    fs.writeFileSync(path.join(algDir, 'index.html'), algHtml, 'utf8');
    console.log(`[prerender-research] Wrote static HTML for /research/allegheny-storm-premium/ (${Math.round(algHtml.length / 1024)} KB)`);

    // The county file and figures, published because the study asks to be cited and a citable
    // study has to let a reporter check its arithmetic against the same rows.
    const dataDir = path.join(process.cwd(), 'dist', 'research', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    // yearbuilt.json publishes too: the North Texas study's central claim is a concentration
    // figure derived from these decade buckets, and a reporter who cannot recompute it from the
    // published files cannot check it. It was generated and left unpublished on the first pass.
    for (const f of ['storm-and-premium-counties.csv', 'storm-and-premium-figures.json', 'storm-and-premium-yearbuilt.json']) {
      const src = path.join(process.cwd(), 'docs', 'data', f);
      if (!fs.existsSync(src)) {
        console.error(`[prerender-research] ${f} is missing -- run scripts/analyse-storm-and-premium.ts.`);
        process.exit(1);
      }
      fs.copyFileSync(src, path.join(dataDir, f));
    }
    console.log('[prerender-research] Published storm-and-premium county CSV + figures JSON');

    // ---- /research/allegheny-storm-premium/embed/ ---------------------------------------------
    // Unlike the other four embeds, this one is not sliced back out of the study document. Those
    // extract markup and CSS with indexOf() against the study's exact internals (".lk-eyebrow{",
    // "</header>", ".pull{"), so a cosmetic edit upstream can ship an empty iframe onto someone
    // else's site -- a failure nobody would report to us. build-allegheny-study.ts emits the widget
    // once, from the same data as the page, and this copies the finished file.
    const ALG_EMBED_SRC = path.join(process.cwd(), 'docs', 'allegheny-storm-premium.embed.html');
    if (!fs.existsSync(ALG_EMBED_SRC)) {
      console.error('[prerender-research] allegheny embed missing -- run scripts/build-allegheny-study.ts.');
      process.exit(1);
    }
    const algEmbed = fs.readFileSync(ALG_EMBED_SRC, 'utf8');
    // The caveat and the credit are the two things that must never be lost in transit: one keeps a
    // count of reports from reading as a hazard ranking, the other is why the embed exists at all.
    for (const required of ['lk-caveat', 'embed-credit', 'alg-data']) {
      if (!algEmbed.includes(required)) {
        console.error(`[prerender-research] allegheny embed is missing ${required}; refusing to build.`);
        process.exit(1);
      }
    }
    const algEmbedDir = path.join(algDir, 'embed');
    fs.mkdirSync(algEmbedDir, { recursive: true });
    fs.writeFileSync(path.join(algEmbedDir, 'index.html'), algEmbed, 'utf8');
    console.log(`[prerender-research] Wrote /research/allegheny-storm-premium/embed/ (${Math.round(algEmbed.length / 1024)} KB)`);
  }

  // ---- /research/north-texas-roof-age/ --------------------------------------------------------
  // Fifth study, and the first regional one. The four above are national; this reads one county
  // against the other ninety-nine and argues about the outlier it finds.
  //
  // It exists because the programmatic alternative was already tried and failed on this exact data:
  // 100 templated county pages, 82 Search Console impressions and zero clicks over six months,
  // retired 2026-08-26 (see county_data.page_enabled and legacyUrls.ts). Filling one shape a
  // hundred times does not produce a hundred studies. So the series rule is that a county gets a
  // piece only when it is a genuine outlier on a specific cross-tabulation, and each piece makes a
  // different argument -- otherwise it is the county pages again with better typography.
  //
  // docs/north-texas-roof-age.html is GENERATED by scripts/build-north-texas-study.ts, same
  // contract as outside-the-zone.html and high-hazard-dams.html: prose lives in the builder, every
  // figure is interpolated from docs/data/storm-and-premium-figures.json, and the builder asserts
  // its own headline ("third stormiest, sixth cheapest") against the data before it will write.
  //
  // No embed widget yet, and STUDIES says embed:false rather than implying one exists. The other
  // four carry a lookup because an embed's credit line survives a copy edit where an inline URL
  // often does not; this one should get the same treatment before it is pitched widely.
  const NTX_SRC = path.join(process.cwd(), 'docs', 'north-texas-roof-age.html');
  if (fs.existsSync(NTX_SRC)) {
    const ntxSource = fs.readFileSync(NTX_SRC, 'utf8');
    const nWrap = ntxSource.indexOf('<div class="wrap">');
    if (nWrap === -1) {
      console.error('[prerender-research] north-texas-roof-age.html has no document body.');
      process.exit(1);
    }
    const nHead = ntxSource.slice(0, nWrap).replace(/<title>[^<]*<\/title>\s*/i, '');
    const nBody = ntxSource.slice(nWrap);
    const NTX_URL = 'https://www.beforeregret.com/research/north-texas-roof-age/';
    const NTX_TITLE = 'Dallas-Fort Worth hail data: Collin and Denton counties';
    const NTX_DESC = 'Hail and housing-age statistics for Collin and Denton counties near Dallas-Fort Worth, free to reuse. 638 hailstorms recorded, 2015 to 2024.';


    if (NTX_TITLE.length > 60) { console.error(`[prerender-research] NTX_TITLE is ${NTX_TITLE.length} chars, over the 60-char display budget.`); process.exit(1); }
    if (NTX_DESC.length > 155) { console.error(`[prerender-research] NTX_DESC is ${NTX_DESC.length} chars, over 155.`); process.exit(1); }

    const NTX_LD = [
      {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: 'Built Together, Due Together',
        alternativeHeadline: 'Half the housing in two North Texas counties went up in one twenty-year window, in the heaviest hail corridor in the country',
        description: NTX_DESC,
        url: NTX_URL,
        datePublished: '2026-09-06',
        dateModified: '2026-09-06',
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        author: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        publisher: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        spatialCoverage: [
          { '@type': 'AdministrativeArea', name: 'Collin County, Texas', identifier: '48085' },
          { '@type': 'AdministrativeArea', name: 'Denton County, Texas', identifier: '48121' },
        ],
        citation: [
          'US Census Bureau, American Community Survey 5-year, year structure built',
          'NOAA National Centers for Environmental Information, Storm Events Database, 2015-2024',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Storm frequency, housing age and reported insurance cost across 100 US counties',
        description: 'County-level severe weather counts by event type (NOAA Storm Events 2015-2024), housing units by construction era, EPA radon zone, land area, and the distribution of what mortgaged households report paying for homeowners insurance (ACS B25141).',
        url: NTX_URL,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://www.beforeregret.com/research/data/storm-and-premium-counties.csv' },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://www.beforeregret.com/research/data/storm-and-premium-figures.json' },
        ],
      },
    ];

    const ntxHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(NTX_TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(NTX_DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(NTX_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(NTX_URL)}">
  <meta property="og:title" content="${escapeHtmlAttr(NTX_TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(NTX_DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(NTX_TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(NTX_DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${nHead.trim()}
  <style>${EXTRA_CSS}</style>
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(NTX_LD)}</script>
</head>
<body>
${SITE_NAV}
${nBody.trim()}
${SITE_FOOTER}
</body>
</html>`;
    const ntxDir = path.join(process.cwd(), 'dist', 'research', 'north-texas-roof-age');
    fs.mkdirSync(ntxDir, { recursive: true });
    fs.writeFileSync(path.join(ntxDir, 'index.html'), ntxHtml, 'utf8');
    console.log(`[prerender-research] Wrote static HTML for /research/north-texas-roof-age/ (${Math.round(ntxHtml.length / 1024)} KB)`);

    // ---- /research/north-texas-roof-age/embed/ ---------------------------------------------
    // Unlike the other four embeds, this one is not sliced back out of the study document. Those
    // extract markup and CSS with indexOf() against the study's exact internals (".lk-eyebrow{",
    // "</header>", ".pull{"), so a cosmetic edit upstream can ship an empty iframe onto someone
    // else's site -- a failure nobody would report to us. build-north-texas-study.ts emits the widget
    // once, from the same data as the page, and this copies the finished file.
    const NTX_EMBED_SRC = path.join(process.cwd(), 'docs', 'north-texas-roof-age.embed.html');
    if (!fs.existsSync(NTX_EMBED_SRC)) {
      console.error('[prerender-research] north-texas embed missing -- run scripts/build-north-texas-study.ts.');
      process.exit(1);
    }
    const ntxEmbed = fs.readFileSync(NTX_EMBED_SRC, 'utf8');
    // The caveat and the credit are the two things that must never be lost in transit: one keeps a
    // count of reports from reading as a hazard ranking, the other is why the embed exists at all.
    for (const required of ['lk-caveat', 'embed-credit', 'alg-data']) {
      if (!ntxEmbed.includes(required)) {
        console.error(`[prerender-research] north-texas embed is missing ${required}; refusing to build.`);
        process.exit(1);
      }
    }
    const ntxEmbedDir = path.join(ntxDir, 'embed');
    fs.mkdirSync(ntxEmbedDir, { recursive: true });
    fs.writeFileSync(path.join(ntxEmbedDir, 'index.html'), ntxEmbed, 'utf8');
    console.log(`[prerender-research] Wrote /research/north-texas-roof-age/embed/ (${Math.round(ntxEmbed.length / 1024)} KB)`);
  }


  const STUDIES: Array<{ url: string; title: string; standfirst: string; finding: string; source: string; data: string[]; embed: boolean; published: string; }> = [
    {
      url: '/research/risk-without-price/',
      title: 'Risk Without Price',
      standfirst: 'Whether US homeowners insurance premiums track the modelled risk of the county they cover.',
      finding: 'Across 3,093 counties, modelled hazard explains part of what people pay, but two counties facing the same modelled risk can differ by more than double.',
      source: 'Census ACS &middot; FEMA National Risk Index',
      data: ['risk-without-price-by-state.csv', 'risk-without-price-figures.json'],
      embed: true,
      published: '30 August 2026',
    },
    {
      url: '/research/risk-without-cover/',
      title: 'Risk Without Cover',
      standfirst: 'Flood is excluded from standard homeowners policies. How many people bought the separate one?',
      finding: 'In the typical county, roughly one home in seven inside a mapped flood zone carries an NFIP policy, and take-up does not track flood risk.',
      source: 'FEMA NFIP &middot; Census ACS',
      data: ['flood-takeup-by-county.csv', 'flood-takeup.json'],
      embed: true,
      published: '31 August 2026',
    },
    {
      url: '/research/outside-the-zone/',
      title: 'Outside the Zone',
      standfirst: 'The flood map decides who is required to buy insurance. What happens to everyone else?',
      finding: 'More than one paid flood claim in four came from outside the mapped high-risk zone. In Texas it was about half.',
      source: 'FEMA NFIP claims &middot; 1,921 counties',
      data: ['outside-the-zone-by-county.csv', 'flood-outside-zone.json'],
      embed: true,
      published: '1 September 2026',
    },
    {
      url: '/research/high-hazard-dams/',
      title: 'High-Hazard Dams by County',
      standfirst: 'What the national dam inventory records about condition and emergency planning, read together.',
      finding: 'Of 17,049 dams classified high hazard potential, about one in six carries a condition rating of poor or unsatisfactory. 636 of those also have no emergency action plan on file.',
      source: 'USACE National Inventory of Dams',
      data: ['high-hazard-dams-by-county.csv', 'dams-high-hazard.json'],
      embed: true,
      published: '1 September 2026',
    },
    {
      url: '/research/north-texas-roof-age/',
      title: 'Built Together, Due Together',
      standfirst: 'Half the housing in two North Texas counties went up inside one twenty-year window, in the heaviest hail corridor in the country.',
      finding: 'Screening all 100 counties for both concentrated construction and heavy hail leaves three standing, and two of them share a border. Roofs there do not age one house at a time.',
      source: 'Census ACS year built &middot; NOAA Storm Events',
      data: ['storm-and-premium-counties.csv', 'storm-and-premium-figures.json', 'storm-and-premium-yearbuilt.json'],
      embed: true,
      published: '6 September 2026',
    },
    {
      url: '/research/allegheny-storm-premium/',
      title: 'Third Stormiest, Sixth Cheapest',
      standfirst: 'Allegheny County records more severe weather than almost anywhere, and insures for less than almost anywhere. Why those are the same fact.',
      finding: 'Across the 100 most populous counties, recorded storm frequency and the share of households paying top-band premiums are effectively unrelated (Spearman -0.101). Allegheny is the extreme case: 3rd highest storm count, 6th lowest share paying over $3,000.',
      source: 'NOAA Storm Events &middot; Census ACS B25141 &middot; EPA radon zones',
      data: ['storm-and-premium-counties.csv', 'storm-and-premium-figures.json', 'storm-and-premium-yearbuilt.json'],
      embed: true,
      published: '6 September 2026',
    },
  ];
  const INDEX_URL = 'https://www.beforeregret.com/research/';
  const indexCards = STUDIES.map((s) => `
    <article class="rcard">
      <h2><a href="${s.url}">${s.title}</a></h2>
      <p class="rcard-stand">${s.standfirst}</p>
      <p class="rcard-find">${s.finding}</p>
      <p class="rcard-meta">${s.source} &middot; published ${s.published}</p>
      <p class="rcard-meta">Data: ${s.data.map((f) => `<a href="/research/data/${f}">${f}</a>`).join(' &middot; ')}${s.embed ? ' &middot; embeddable lookup' : ''}</p>
    </article>`).join('\n');

  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Research &mdash; Before Regret</title>
  <meta name="description" content="Six original analyses of US public housing-risk data: insurance pricing against modelled risk, flood insurance take-up, flood claims paid outside the mapped zone, the condition and emergency planning status of high-hazard dams, storm frequency against what households actually pay to insure, and synchronised housing construction under hail. Every figure downloadable, every method published.">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(INDEX_URL)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(INDEX_URL)}">
  <meta property="og:title" content="Research &mdash; Before Regret">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
${headParts.trim()}
  <style>${EXTRA_CSS}
.rhead{max-width:1000px;margin:0 auto;padding:44px 0 0}
.rhead h1{font-family:var(--disp);font-size:clamp(2rem,5vw,3rem);line-height:1.06;margin:.3em 0 0}
.rhead p{max-width:64ch;margin:1em 0 0}
.rlist{max-width:1000px;margin:0 auto;padding:14px 0 0;display:grid;grid-template-columns:1fr;gap:0}
.rcard{padding:30px 0;border-top:1px solid var(--rule)}
.rcard h2{font-family:var(--disp);font-size:clamp(1.35rem,2.6vw,1.8rem);line-height:1.15;margin:0}
.rcard h2 a{color:var(--ink);text-decoration:none;border-bottom:2px solid var(--rule)}
.rcard h2 a:hover{border-bottom-color:var(--price);color:var(--price)}
.rcard-stand{margin:.55em 0 0;color:var(--muted);max-width:66ch}
.rcard-find{margin:.7em 0 0;max-width:66ch}
.rcard-meta{margin:.7em 0 0;font-family:var(--mono);font-size:.72rem;color:var(--muted)}
.rcard-meta a{color:var(--muted);border-bottom:1px solid var(--rule);text-decoration:none}
.rcard-meta a:hover{color:var(--price);border-bottom-color:var(--price)}
.rnote{max-width:1000px;margin:0 auto;padding:34px 0 0;border-top:1px solid var(--rule)}
.rnote h3{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 .7em}
.rnote p{max-width:66ch;margin:0 0 .8em}
  </style>
</head>
<body>
${SITE_NAV_INDEX}
<div class="wrap">
  <header class="rhead">
    <!-- No "Before Regret / Research" kicker here: the nav directly above already says exactly
         that, and on this page it would read twice in three lines. The study pages carry a dated
         byline in this slot instead, which is why it does not repeat there. -->
    <h1>Research</h1>
    <p>Four analyses of US public housing-risk data, each built from named federal files and published with the figures behind it. They exist because the questions were ours before they were anyone else's: we kept needing numbers that nobody had put together, so we put them together.</p>
  </header>
  <div class="rlist">
${indexCards}
  </div>
  <section class="rnote">
    <h3>For journalists</h3>
    <p>Every study publishes its county or state table as a CSV, its full figures as JSON, and an interactive county lookup you can embed on your own site. All of it is free to use with attribution, and the embeds carry their own credit line, so nothing needs to be asked for.</p>
    <p>Each study also states what it cannot tell you, and where its own totals do not reconcile. If a number here does not match something you have, that section is the first place to look, and if it still does not add up we would rather hear from you than not.</p>
    <p>Corrections, questions and data requests: <a href="mailto:hello@beforeregret.com">hello@beforeregret.com</a>.</p>
  </section>
</div>
${SITE_FOOTER}
</body>
</html>`;
  const indexDir = path.join(process.cwd(), 'dist', 'research');
  fs.mkdirSync(indexDir, { recursive: true });
  fs.writeFileSync(path.join(indexDir, 'index.html'), indexHtml, 'utf8');
  console.log(`[prerender-research] Wrote /research/ index listing ${STUDIES.length} studies`);
}

run().catch((err) => {
  console.error('[prerender-research] failed:', err);
  process.exit(1);
});
