import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutMethodology } from '../src/components/AboutMethodology';
import { ContactUs } from '../src/components/ContactUs';
import { TermsConditions } from '../src/components/TermsConditions';
import { PrivacyPolicy } from '../src/components/PrivacyPolicy';
import { RefundPolicy } from '../src/components/RefundPolicy';

// Static HTML generator for About, Support, Terms, Privacy, and Refunds -- the one class of route
// on this domain that had NO build-time prerendering and no client-side-only content either: they
// were falling through vercel.json's catch-all rewrite straight to dist/shell.html, the pristine,
// pre-Vite-build index.html template.
//
// That was a real, confirmed-live bug, not a theoretical one: shell.html carries the *homepage's*
// static <title>, a <meta name="robots" content="index, follow">, and <link rel="canonical"
// href="https://www.beforeregret.com/">, baked in at build time -- because those are just the
// source index.html's sane SPA-wide defaults, written on the assumption that App.tsx's
// applyHeadSeo() would always override them client-side before anything mattered. It does, but
// only once React boots and re-renders; the raw HTML Googlebot fetches first (and may act on
// before ever executing JS) claims to be the homepage, permits indexing, and has zero visible
// content. Confirmed live via curl: /refund-policy, /about/, /terms/, /privacy/, and /support/ all
// returned the identical shell with the homepage's own title and canonical -- exactly the kind of
// signal that can make Google surface a secondary URL instead of '/' for a branded query.
//
// Fix mirrors scripts/prerender-guides.tsx and scripts/prerender-homepage.tsx: write a real,
// self-contained HTML file with the correct per-page title/description/canonical/robots baked in
// from the first byte, at a literal path Vercel's filesystem-priority static serving picks up
// before the rewrite is ever consulted (the same mechanism that already makes '/' resolve to the
// real dist/index.html instead of the shell -- see that script's comments for the confirmed-live
// detail on why rewrites lose to an existing file).
//
// Unlike the guide/county/homepage scripts, this one reuses the real page components directly
// (AboutMethodology, ContactUs, TermsConditions, PrivacyPolicy, RefundPolicy) rather than writing
// parallel "Static" twins: all five are pure, prop-driven, side-effect-free React (their one
// `useEffect` is `window.scrollTo(0, 0)`, which simply never fires under renderToStaticMarkup --
// React only runs effects in a browser commit, not during SSR), so there's no drift risk between
// what a crawler sees and what a real visitor's browser renders. Their internal "Return to Home"
// buttons render inert here (onClick handlers aren't serialized to static HTML, and these pages
// have no other outbound links worth preserving as crawlable <a href>s) -- an accepted, minor
// trade-off given four of these five pages are also being marked noindex.

interface LegalPageConfig {
  outputPath: string;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index, follow' | 'noindex, nofollow';
  jsonLd: Record<string, any>[];
  Component: React.FC<{ onBackToHome: () => void; onNavigate?: (path: string) => void }>;
}

const noop = () => {};

const ABOUT_BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'About & Methodology', item: 'https://www.beforeregret.com/about/' },
  ],
};

const SUPPORT_BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'Support & FAQ', item: 'https://www.beforeregret.com/support/' },
  ],
};

const TERMS_BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://www.beforeregret.com/terms/' },
  ],
};

const PRIVACY_BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://www.beforeregret.com/privacy/' },
  ],
};

const REFUNDS_BREADCRUMB: Record<string, any> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
    { '@type': 'ListItem', position: 2, name: 'Refund Policy', item: 'https://www.beforeregret.com/refunds/' },
  ],
};

// Values copied verbatim from src/App.tsx's applyHeadSeo() calls for each pseoRoute.type, which
// remain the source of truth for the client render -- kept in sync by hand, the same discipline
// scripts/prerender-guides.tsx and scripts/prerender-homepage.tsx already rely on for their own
// hand-copied values.
const PAGES: LegalPageConfig[] = [
  {
    outputPath: 'about',
    title: 'How We Research and Write BeforeRegret | Methodology',
    description: 'How BeforeRegret verifies live data, writes AI-assisted guides under a fixed set of sourcing rules, and handles corrections.',
    canonicalUrl: 'https://www.beforeregret.com/about/',
    robots: 'index, follow',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'How we research and write this site',
        url: 'https://www.beforeregret.com/about/',
        isPartOf: { '@type': 'WebSite', name: 'BeforeRegret', url: 'https://www.beforeregret.com/' },
      },
      ABOUT_BREADCRUMB,
    ],
    Component: AboutMethodology,
  },
  {
    outputPath: 'support',
    title: 'BeforeRegret Support & Property Research FAQ',
    description: 'Frequently asked questions regarding BeforeRegret public property record research, data sources, municipal permit checks, and report coverage.',
    canonicalUrl: 'https://www.beforeregret.com/support/',
    robots: 'noindex, nofollow',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Where does BeforeRegret source its property hazard data?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'BeforeRegret runs a live USGS seismic hazard check and validates your address against U.S. Census records automatically. The rest of the report is a curated, address-specific checklist linking directly to the real FEMA, EPA, USDA, U.S. DOT, FCC, and local municipal sources you would otherwise have to track down yourself -- clearly labeled as not yet independently verified until you check them.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are reports one-time flat fee or subscription based?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Your first BeforeRegret property report is free. Additional reports are a one-time flat fee of $14.99 each -- there is no subscription or recurring charge for consumer reports.',
            },
          },
        ],
      },
      SUPPORT_BREADCRUMB,
    ],
    Component: ContactUs,
  },
  {
    outputPath: 'terms',
    title: 'Terms of Service | BeforeRegret Property Intelligence',
    description: 'Terms of service and user agreement for BeforeRegret public record property research and automated synthesis tools.',
    canonicalUrl: 'https://www.beforeregret.com/terms/',
    robots: 'noindex, nofollow',
    jsonLd: [TERMS_BREADCRUMB],
    Component: TermsConditions,
  },
  {
    outputPath: 'privacy',
    title: 'Privacy Policy | BeforeRegret Property Intelligence',
    description: 'Privacy policy detailing data handling, user anonymity, and secure public record lookup protocols at BeforeRegret.',
    canonicalUrl: 'https://www.beforeregret.com/privacy/',
    robots: 'noindex, nofollow',
    jsonLd: [PRIVACY_BREADCRUMB],
    Component: PrivacyPolicy,
  },
  {
    outputPath: 'refunds',
    title: 'Refund Policy & Satisfaction Guarantee | BeforeRegret',
    description: 'BeforeRegret refund policy and customer support commitments for property research report orders.',
    canonicalUrl: 'https://www.beforeregret.com/refunds/',
    robots: 'noindex, nofollow',
    jsonLd: [REFUNDS_BREADCRUMB],
    Component: RefundPolicy,
  },
  // Legacy alias -- App.tsx's client router still treats any /refund-policy* path as the 'refunds'
  // type (see the `path.startsWith('/refund-policy')` check), but nothing before this script ever
  // gave that literal path its own static file, so it fell through to the same broken shell as
  // every other unmatched route. Identical content and meta to 'refunds' above; canonical still
  // points at /refunds/ so this URL never competes with it for indexing even though it's noindexed
  // either way.
  {
    outputPath: 'refund-policy',
    title: 'Refund Policy & Satisfaction Guarantee | BeforeRegret',
    description: 'BeforeRegret refund policy and customer support commitments for property research report orders.',
    canonicalUrl: 'https://www.beforeregret.com/refunds/',
    robots: 'noindex, nofollow',
    jsonLd: [REFUNDS_BREADCRUMB],
    Component: RefundPolicy,
  },
];

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function applyHeadReplacements(template: string, page: LegalPageConfig): string {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(page.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtmlAttr(page.description)}"`
  );
  html = html.replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="${page.robots}"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(page.canonicalUrl)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(page.canonicalUrl)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(page.title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(page.description)}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(page.title)}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(page.description)}"`);

  const jsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(page.jsonLd)}</script>`;
  html = html.replace('</head>', `${jsonLdScript}\n  </head>`);

  return html;
}

async function run() {
  const distPath = path.join(process.cwd(), 'dist');
  const shellPath = path.join(distPath, 'shell.html');
  if (!fs.existsSync(shellPath)) {
    console.error('[prerender-legal-pages] dist/shell.html not found -- run scripts/prerender-homepage.tsx first.');
    process.exit(1);
  }
  // Deliberately templated off shell.html, not dist/index.html: by this point in the build,
  // index.html has already been overwritten with real homepage content, and starting from the
  // homepage's markup would mean stripping it back out. shell.html is still the pristine,
  // empty-#root Vite template with the correct base <head> boilerplate (fonts, GTM, favicon) --
  // exactly what these pages need to build on top of, same as every other prerender script.
  const template = fs.readFileSync(shellPath, 'utf8');

  for (const page of PAGES) {
    const bodyHtml = renderToStaticMarkup(
      React.createElement(page.Component, { onBackToHome: noop })
    );
    const html = applyHeadReplacements(template, page).replace(
      '<div id="root"></div>',
      `<div id="root">${bodyHtml}</div>`
    );
    const outDir = path.join(distPath, page.outputPath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  }

  console.log(`[prerender-legal-pages] Wrote static HTML for ${PAGES.length} page(s): ${PAGES.map((p) => `/${p.outputPath}/`).join(', ')}`);
}

run().catch((err) => {
  console.error('[prerender-legal-pages] Failed:', err);
  process.exit(1);
});
