// Static HTML for /walkthrough/ -- the 20-Minute Walkthrough Checklist.
//
// Same reason as prerender-advertise.tsx: without this, the raw HTML at the URL is an empty
// <div id="root"> carrying the shell's default title, because WalkthroughRadar only sets its real
// head tags through applyHeadSeo() after React mounts. This page is meant to be shared and linked
// -- that is the entire argument for building it -- so it cannot be invisible to anything reading
// HTML without executing JS.
//
// WHAT GETS PRERENDERED IS THE SETUP SCREEN, and that is safe rather than lucky. WalkthroughRadar
// reads localStorage in a useEffect, never during render, so its first client render is always the
// setup screen too. The prerendered markup and the first client render therefore agree, and a
// returning visitor's saved answers appear on the following tick rather than causing a mismatch.
//
// The schema comes from WALKTHROUGH_JSON_LD in src/data/walkthroughChecks.ts, the same constant
// App.tsx passes to applyHeadSeo, rather than a second hand-kept copy.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WalkthroughRadar } from '../src/components/WalkthroughRadar';
import { WALKTHROUGH_JSON_LD, WALKTHROUGH_URL, WALKTHROUGH_CHECKS } from '../src/data/walkthroughChecks';
import { StaticFooterLinks, FooterGuideSummary } from '../src/components/StaticFooterLinks';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { modulePreloadTags } from './lib/routeChunkPreload.js';

// Must match src/App.tsx's applyHeadSeo call for pseoRoute.type === 'walkthrough' exactly.
const TITLE = 'The 20-Minute Walkthrough Checklist | BeforeRegret';
const DESCRIPTION =
  'A free phone checklist of what to physically look at during a house viewing, by decade built and foundation type. No sign-up and no address needed.';

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
    console.error('[prerender-walkthrough] dist/shell.html not found -- run scripts/prerender-homepage.tsx first.');
    process.exit(1);
  }
  const template = fs.readFileSync(shellPath, 'utf8');

  const footerGuides: FooterGuideSummary[] = isDbConfigured()
    ? ((await withDb((sql) => sql`
        SELECT slug, title FROM articles WHERE status = 'published' AND article_type = 'guide' ORDER BY published_at DESC LIMIT 4
      `)) as unknown as FooterGuideSummary[])
    : [];

  const bodyHtml = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(WalkthroughRadar),
      React.createElement(StaticFooterLinks, { guides: footerGuides })
    )
  );

  // The setup screen carries no checks, so a crawler reading this HTML would otherwise see a tool
  // with no content and no outgoing links. This block is what makes the page worth indexing: the
  // full check set as real text, and a link to the guide behind each one. It is inside a <noscript>
  // so it never double-renders for a person -- React replaces #root on mount -- while remaining
  // plain HTML for anything that does not execute JS.
  const zones = [...new Set(WALKTHROUGH_CHECKS.map((c) => c.zone))];
  const staticList = `<noscript><section>
    <h2>Everything this checklist can ask you to look at</h2>
    <p>Which of these you see depends on the decade the house was built and what it sits on. Each links to the guide explaining what the finding means.</p>
    ${zones.map((z) => `<h3>${escapeHtmlAttr(z)}</h3>
    <ul>
      ${WALKTHROUGH_CHECKS.filter((c) => c.zone === z).map((c) => `<li><strong>${escapeHtmlAttr(c.prompt)}</strong> Looking for: ${escapeHtmlAttr(c.lookingFor)} <a href="/guides/${c.guide}/">What this means</a></li>`).join('\n      ')}
    </ul>`).join('\n    ')}
  </section></noscript>`;

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(TITLE)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtmlAttr(DESCRIPTION)}"`);
  html = html.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="index, follow"');
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(WALKTHROUGH_URL)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(WALKTHROUGH_URL)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(TITLE)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(DESCRIPTION)}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(TITLE)}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(DESCRIPTION)}"`);

  const jsonLdScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(WALKTHROUGH_JSON_LD)}</script>`;
  html = html.replace('</head>', `${modulePreloadTags('walkthrough')}\n  ${jsonLdScript}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}${staticList}</div>`);

  // Asserted rather than assumed: a shell whose placeholders stop matching would silently produce a
  // page with the homepage's title and no schema, which is precisely the bug this script exists to
  // fix and would look like success in the build log.
  for (const [what, needle] of [
    ['title', `<title>${escapeHtmlAttr(TITLE)}</title>`],
    ['canonical', WALKTHROUGH_URL],
    ['schema', '"@type":"HowTo"'],
    ['rendered app', 'The 20-minute walkthrough checklist'],
    ['crawlable checks', 'Everything this checklist can ask you to look at'],
  ] as Array<[string, string]>) {
    if (!html.includes(needle)) throw new Error(`[prerender-walkthrough] ${what} missing from output`);
  }
  const guideLinks = (html.match(/href="\/guides\/[a-z0-9-]+\//g) || []).length;
  if (guideLinks < WALKTHROUGH_CHECKS.length) {
    throw new Error(`[prerender-walkthrough] only ${guideLinks} guide links in the static HTML, expected at least ${WALKTHROUGH_CHECKS.length}`);
  }

  const outDir = path.join(distPath, 'walkthrough');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`[prerender-walkthrough] Wrote /walkthrough/ with ${WALKTHROUGH_CHECKS.length} checks and ${guideLinks} guide links`);
}

run().catch((err) => {
  console.error('[prerender-walkthrough] Failed:', err);
  process.exit(1);
});
