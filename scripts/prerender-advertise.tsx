// Static HTML generator for /advertise -- a real, confirmed-live gap that a live Ahrefs crawl
// surfaced: the raw HTML at this URL had an empty <div id="root">, the homepage's own <title>
// (shell.html's baked-in default, never overwritten because AdvertiseCompare only carries its real
// title/description/canonical through applyHeadSeo() after React mounts), and zero outgoing links
// -- not a metadata bug, the entire page was invisible to anything reading raw HTML rather than
// executing JS. Same root cause and same fix shape as scripts/prerender-legal-pages.tsx's own
// history for /about, /support, /terms, /privacy, /refunds (see that file's top comment for the
// full confirmed-live detail); this is a standalone script rather than folded into that one
// because AdvertiseCompare's props shape (`onNavigate`, no `onBackToHome`) genuinely differs from
// the five components that file already handles, and this project's convention is one script per
// page-type (prerender-guides / -counties / -homepage / -legal-pages) rather than one script
// covering every static route regardless of shape.
//
// UNLIKE the five legal pages, this one is deliberately INDEXABLE ('index, follow'). It used to be
// 'noindex, nofollow' -- a considered choice, revisited and reversed for this fix: /advertise is
// the actual vendor-acquisition page (see AdvertiseCompare.tsx's own top comment), and someone
// searching "advertise on beforeregret" or "list my business beforeregret" could not previously
// find it at all. The two checkout pages it routes to, /topic-ads and /report-ads, stay
// 'noindex, nofollow' on purpose -- payment flows with nothing for a searcher to find -- and are
// out of scope for this script.
//
// Title/description/canonical/robots below must match src/App.tsx's applyHeadSeo() call for
// pseoRoute.type === 'advertiseCompare' exactly -- kept in sync by hand, the same discipline
// prerender-legal-pages.tsx already relies on for its own five pages.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvertiseCompare, ADVERTISE_FAQ_ITEMS } from '../src/components/AdvertiseCompare';
import { StaticFooterLinks, FooterGuideSummary } from '../src/components/StaticFooterLinks';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { modulePreloadTags } from './lib/routeChunkPreload.js';

const TITLE = 'Advertise With Us | BeforeRegret';
const DESCRIPTION = 'Compare Topic Ads and Report Ads to find the right fit for your business.';
const CANONICAL_URL = 'https://www.beforeregret.com/advertise/';

const BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'Advertise With Us', item: CANONICAL_URL },
  ],
};

// Built from the same ADVERTISE_FAQ_ITEMS the live component renders, not a hand-copied second
// list -- prerender-legal-pages.tsx's support-page FAQPage schema is a separate hardcoded literal
// next to its component's own FAQ content, which is a drift risk avoided here by sharing the
// source array instead. See ADVERTISE_FAQ_ITEMS's own comment in AdvertiseCompare.tsx.
const FAQ_JSON_LD: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ADVERTISE_FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

const JSON_LD = [BREADCRUMB, FAQ_JSON_LD];

const noop = () => {};

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function run() {
  const distPath = path.join(process.cwd(), 'dist');
  const shellPath = path.join(distPath, 'shell.html');
  if (!fs.existsSync(shellPath)) {
    console.error('[prerender-advertise] dist/shell.html not found -- run scripts/prerender-homepage.tsx first.');
    process.exit(1);
  }
  // Templated off the pristine shell, not dist/index.html -- same reasoning as every other
  // prerender script: index.html has already been overwritten with real homepage content by this
  // point in the build, while shell.html still carries the correct base <head> boilerplate (fonts,
  // GTM, favicon) with an empty #root to build on top of.
  const template = fs.readFileSync(shellPath, 'utf8');

  // Same evergreen-guides selection every other prerender script uses for StaticFooterLinks, so a
  // visitor (or an AI answer engine reading the raw HTML) who lands here has a path to the rest of
  // the site rather than a dead end.
  const footerGuides: FooterGuideSummary[] = isDbConfigured()
    ? ((await withDb((sql) => sql`
        SELECT slug, title FROM articles WHERE status = 'published' AND article_type = 'guide' ORDER BY published_at DESC LIMIT 4
      `)) as unknown as FooterGuideSummary[])
    : [];

  const bodyHtml = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(AdvertiseCompare, { onNavigate: noop }),
      React.createElement(StaticFooterLinks, { guides: footerGuides })
    )
  );

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(TITLE)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtmlAttr(DESCRIPTION)}"`);
  html = html.replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="index, follow"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(CANONICAL_URL)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(CANONICAL_URL)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(TITLE)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(DESCRIPTION)}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(TITLE)}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(DESCRIPTION)}"`);

  const jsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(JSON_LD)}</script>`;
  html = html.replace('</head>', `${modulePreloadTags('advertise')}\n  ${jsonLdScript}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  const outDir = path.join(distPath, 'advertise');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

  console.log('[prerender-advertise] Wrote static HTML for /advertise/');
}

run().catch((err) => {
  console.error('[prerender-advertise] Failed:', err);
  process.exit(1);
});
