// Publishes /sunlight/ -- the free daylight tool.
//
// Same contract as the research studies: scripts/build-sunlight-tool.ts emits docs/sunlight.html as
// a fragment (<style> then <div class="wrap">), this slices at that div, wraps it in the site
// chrome, and writes a fully static page. No React, no hydration -- the calculator is inline JS and
// works the moment the HTML arrives.
//
// It is NOT under /research/ and is deliberately absent from the STUDIES array and the llms.txt
// research section: it is a tool, not a study, and advertising it as original research would
// misdescribe it. It is also not a guide -- see the header of build-sunlight-tool.ts for why the
// write-guide pipeline rejected it, correctly.
import fs from 'node:fs';
import path from 'node:path';
import {
  OG_IMAGE, SITE_NAV, ANALYTICS_BEACON, siteFooter, EXTRA_CSS,
  escapeHtmlAttr, escapeJsonForScriptTag, readSiteEntityLd,
} from './lib/site-chrome.js';

// This page is not a study, so it does not get the studies' source column.
const FOOTER = siteFooter({
  heading: 'This tool',
  links: [
    { href: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/', text: 'U.S. Census Bureau Gazetteer', external: true },
    { href: 'https://gml.noaa.gov/grad/solcalc/', text: 'NOAA Solar Calculator', external: true },
    { href: '/support/', text: 'Corrections &amp; questions' },
  ],
});

const URL_ = 'https://www.beforeregret.com/sunlight/';
const TITLE = 'Which Direction Should a House Face? Check Any Room';
const DESC =
  'Pick a county and the way a window faces, and see exactly when direct sun reaches that room. Computed from solar geometry. Free, no sign-up.';

function run(): void {
  if (TITLE.length > 60) { console.error(`[prerender-sunlight] TITLE is ${TITLE.length} chars, over 60.`); process.exit(1); }
  if (DESC.length < 70 || DESC.length > 155) { console.error(`[prerender-sunlight] DESC is ${DESC.length} chars, budget 70-155.`); process.exit(1); }

  const SRC = path.join(process.cwd(), 'docs', 'sunlight.html');
  if (!fs.existsSync(SRC)) {
    console.error('[prerender-sunlight] docs/sunlight.html missing -- run scripts/build-sunlight-tool.ts.');
    process.exit(1);
  }
  const source = fs.readFileSync(SRC, 'utf8');
  const wrap = source.indexOf('<div class="wrap">');
  if (wrap === -1) { console.error('[prerender-sunlight] sunlight.html has no document body.'); process.exit(1); }

  // The calculator is the page. Shipping the prose without it would be a page that promises a tool
  // and does not have one, which is worse than not shipping.
  for (const required of ['sl-data', 'sl-county', 'sl-verdict', 'function sunPos']) {
    if (!source.includes(required)) {
      console.error(`[prerender-sunlight] emitted page is missing ${required}; refusing to build.`);
      process.exit(1);
    }
  }

  const head = source.slice(0, wrap).replace(/<title>[^<]*<\/title>\s*/i, '');
  const body = source.slice(wrap);
  const distPath = path.join(process.cwd(), 'dist');

  const LD = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Sunlight by room',
      url: URL_,
      description:
        'Computes when direct sunlight reaches a given window of a house, for any of 566 US counties, on the solstices and equinoxes. Uses the NOAA solar position algorithm and US Census Gazetteer county coordinates.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      inLanguage: 'en-US',
      creator: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
      publisher: { '@type': 'Organization', name: 'Before Regret', url: 'https://www.beforeregret.com/' },
      image: OG_IMAGE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Before Regret', item: 'https://www.beforeregret.com/' },
        { '@type': 'ListItem', position: 2, name: 'Sunlight by room', item: URL_ },
      ],
    },
  ];

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttr(TITLE)}</title>
  <meta name="description" content="${escapeHtmlAttr(DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${escapeHtmlAttr(URL_)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Before Regret">
  <meta property="og:url" content="${escapeHtmlAttr(URL_)}">
  <meta property="og:title" content="${escapeHtmlAttr(TITLE)}">
  <meta property="og:description" content="${escapeHtmlAttr(DESC)}">
  <meta property="og:image" content="${escapeHtmlAttr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(TITLE)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(DESC)}">
  <meta name="twitter:image" content="${escapeHtmlAttr(OG_IMAGE)}">
${head.trim()}
  <style>${EXTRA_CSS}</style>
${readSiteEntityLd(distPath)}
  <script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(LD)}</script>
</head>
<body>
${SITE_NAV}
${body.trim()}
${FOOTER}
${ANALYTICS_BEACON}
</body>
</html>`;

  const outDir = path.join(distPath, 'sunlight');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`[prerender-sunlight] Wrote /sunlight/ (${Math.round(html.length / 1024)} KB)`);
}

run();
