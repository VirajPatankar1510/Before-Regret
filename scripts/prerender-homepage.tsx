import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Check } from 'lucide-react';
import { ListingOmissionsSection } from '../src/components/home/ListingOmissionsSection';
import { HowItWorksSection } from '../src/components/home/HowItWorksSection';
import { PricingSection } from '../src/components/home/PricingSection';
import { ClosingCtaSection } from '../src/components/home/ClosingCtaSection';
import { HOMEPAGE_FAQS } from '../src/components/home/FaqSection';
import { GuideCardsSection } from '../src/components/home/GuideCardsSection';
import { WalkthroughToolSection } from '../src/components/home/WalkthroughToolSection';
import { HeroPanel } from '../src/components/home/HeroPanel';
import { BookPromoCard } from '../src/components/BookPromo';
import { StaticFooterLinks, FooterGuideSummary } from '../src/components/StaticFooterLinks';
import { isDbConfigured } from '../src/server/db.js';
import { loadHomepageData } from '../src/server/homepageApi.js';
import { HomeData, buildGuideClusters, pickResearchPages } from '../src/utils/homeContent.js';

const EMPTY_HOME_DATA: HomeData = { articles: [], counties: [] };

// Static HTML generator for the homepage, run after `vite build` alongside
// scripts/prerender-guides.tsx.
//
// Overwrites dist/index.html in place with real content, and preserves the original empty-#root
// shell as dist/shell.html for dead URLs. This is the opposite of the first version of this
// script, which wrote to a separate dist/home.html and added a `{"source": "/", "destination":
// "/home.html"}` rewrite in vercel.json -- that rewrite never fired in production, because Vercel
// resolves the exact path '/' to an existing static file (dist/index.html) via filesystem
// priority *before* consulting `rewrites` at all (confirmed live). Since dist/index.html already
// exists and always will, the only way to put real content at '/' is to put it in that literal
// file. vercel.json's catch-all was changed to point unmatched paths at the new dist/shell.html
// instead, so dead URLs (which the client-side 404 fix in src/App.tsx handles at the JS layer)
// keep getting an empty, non-homepage shell rather than the real homepage content injected here.
//
// Deliberately skips AddressSearchBox (the actual interactive search UI) -- it's a heavy,
// browser-dependent component (geocoding calls, map tiles, etc.) with no reason to exist in a
// static crawler-facing shell. A real browser loads the same JS bundle referenced in this file
// and boots the normal interactive homepage on top via createRoot() (not hydrateRoot() -- see
// src/main.tsx), so there's no mismatch risk from this simplified markup being replaced.

function noop() {}

function HomeStaticBody({ data }: { data: HomeData }) {
  // Same derivations the client runs in src/components/Hero.tsx, from the same shared module in
  // src/utils/homeContent.ts -- that's what guarantees the crawler-facing HTML and the booted app
  // show the same clusters, in the same order, with the same counts.
  const clusters = buildGuideClusters(data.articles);
  const research = pickResearchPages(data.articles);

  return (
    <div className="space-y-0 pb-16">
      {/* Same component the client renders, so the static and mounted heroes cannot disagree
          about height. No searchBox prop: AddressSearchBox needs client state, and HeroPanel
          substitutes a non-interactive replica of identical height. */}
      <HeroPanel />

      <ListingOmissionsSection />
      <HowItWorksSection />
      <PricingSection onScrollToSearch={noop} />

      {/* Same order and position as src/components/Hero.tsx. No onNavigate is passed, so
          ContentLink renders plain crawlable <a href> markup here -- the point of prerendering
          this section: its guide card links get picked up from the domain's strongest page. */}
      {/* Mirrors src/components/Hero.tsx's position exactly -- see that file's comment. */}
      <WalkthroughToolSection />
      <GuideCardsSection
        clusters={clusters}
        research={research}
        totalGuides={data.articles.length}
      />

      {/* Same position as src/components/Hero.tsx (section 5b). No onNavigate is passed, so every
          county link renders as a plain crawlable <a href> -- the point of prerendering this: 100
          county pages get a direct inbound link from the domain's strongest page instead of only a
          third-hop path through the footer's /counties/ hub link. See CountyLinksSection.tsx. */}

      {/* Same position as src/components/Hero.tsx: after the guide library, before the FAQ.
          Below the hero search and the pricing section on purpose -- the homepage's job is turning
          an address lookup into a report, and the book must not compete with that. */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <BookPromoCard />
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              How this differs from a home inspection, and how we stay independent.
            </p>
          </div>
          <div className="space-y-4">
            {HOMEPAGE_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="w-full p-6 text-left font-sans text-lg font-bold text-slate-900">{faq.q}</div>
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-sans">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClosingCtaSection onScrollToSearch={noop} />

      {/* This link -- specifically /counties/, and every guide/legal link alongside it -- was
          entirely absent from the homepage's static HTML before this. Real Search Console data
          found 106 URLs stuck in "Discovered - currently not indexed," heavily concentrated in the
          county section, which had no path in from the one page every crawl of this domain starts
          at. See StaticFooterLinks.tsx for the full story -- this was a known, considered gap in
          the code ("no SEO cost") that real index-coverage data proved wrong. */}
      <StaticFooterLinks
        guides={data.articles
          .filter((a) => (a.articleType ?? 'guide') === 'guide')
          .slice(0, 4)
          .map((a): FooterGuideSummary => ({ slug: a.slug, title: a.title }))}
      />
    </div>
  );
}

function buildFaqJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// Inlines the ENTIRE built stylesheet into the homepage and removes its <link>, so the homepage
// ships with zero render-blocking stylesheet requests.
//
// This replaces an earlier attempt that inlined only the .hero-bg background-image rule. That
// attempt did nothing measurable, and the reason is worth recording so it isn't repeated: the LCP
// element is
//   <div class="hero-bg absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed">
// inside a section carrying min-h-[85vh] flex flex-col justify-center. Every one of those layout
// utilities lives in the built stylesheet, not in the hand-inlined snippet -- so the browser had
// the image URL early but not the rules giving the element its ~690px of height. An element with
// no computed size cannot paint and cannot become an LCP candidate, so the early URL bought
// nothing. Above-the-fold markup needs its LAYOUT rules inlined, not just its paint rules.
//
// Why the whole file rather than a critical subset: this is Tailwind v4 output -- 71 @property
// registrations, 5 cascade @layers, 33 :where() wrappers, 73 @supports blocks. A hand-rolled
// subset extractor across that is very easy to get subtly wrong, and the failure mode is silent
// visual breakage across the highest-traffic page rather than a build error. The whole file is
// 76KB raw but only ~13KB gzipped, against a homepage already ~24KB gzipped, and inlining removes
// a full request round trip that Lighthouse measured as 150ms of render-blocking on Slow 4G.
// Correctness beats the last few KB here.
//
// Deliberately homepage-only. Guide and county pages (235 of them) keep the external stylesheet so
// it stays cacheable across a browsing session; only the single highest-value entry point trades
// cacheability for a faster first paint.
//
// Honest scope note: this targets FCP and the render-blocking round trip. It does NOT address the
// ~1.6s "element render delay", which is React's createRoot() discarding the prerendered DOM and
// re-mounting the hero (see the comment in src/main.tsx that says so outright). That needs
// hydrateRoot and a prerender that matches what React renders -- a separate, larger change.
function inlineStylesheet(html: string, distPath: string): string {
  const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="(\/assets\/index-[^"]+\.css)"[^>]*>/);
  if (!linkMatch) {
    throw new Error('[prerender-homepage] Could not find the main stylesheet <link> in dist/index.html.');
  }
  const cssPath = path.join(distPath, linkMatch[1]);
  const css = fs.readFileSync(cssPath, 'utf8');
  // </style> inside CSS content would terminate the tag early. Tailwind output has no reason to
  // contain it, but a content: "..." string legitimately could, so this is escaped rather than
  // assumed safe.
  const safeCss = css.replace(/<\/style>/gi, '<\\/style>');
  return html.replace(linkMatch[0], `<style>${safeCss}</style>`);
}

async function run() {
  const distPath = path.join(process.cwd(), 'dist');
  const templatePath = path.join(distPath, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender-homepage] dist/index.html not found -- run `vite build` first.');
    process.exit(1);
  }
  // dist/index.html at this point is still the pristine, empty-#root file vite build produced --
  // scripts/prerender-guides.tsx (which runs before this script) only reads it as a template, it
  // never writes to it. Preserve that pristine copy as dist/shell.html *before* overwriting
  // dist/index.html below: Vercel resolves the exact path '/' to dist/index.html via its own
  // filesystem-priority static serving, before rewrites are even consulted (confirmed live -- a
  // `{"source": "/", "destination": "/home.html"}` rewrite never fired, because a real file
  // already existed at '/'). So the real content has to live at dist/index.html itself, and the
  // dead-URL catch-all needs a *different* file to point to instead -- see vercel.json.
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(path.join(distPath, 'shell.html'), template, 'utf8');

  // Reuses the exact loader GET /api/homepage serves, rather than a second hand-written query, so
  // the build-time content and the runtime fallback can't drift apart in either shape or filtering.
  const data: HomeData = isDbConfigured() ? await loadHomepageData() : EMPTY_HOME_DATA;

  const bodyHtml = renderToStaticMarkup(<HomeStaticBody data={data} />);
  const faqScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(buildFaqJsonLd())}</script>`;

  // Hand the same dataset to the client so React's first paint already has it -- see useHomeData()
  // in src/components/Hero.tsx. Without this the booted app would briefly render the content
  // sections empty and then pop them in once /api/homepage resolved, undoing the whole point of
  // prerendering them.
  //
  // Injected at the END OF <body>, not into <head>, and that placement is the whole point of this
  // comment. This blob is the single largest thing on the homepage -- 134 articles + 100 counties,
  // ~58KB, 59% of the total HTML at time of writing -- and it grows with every article published.
  // In <head> it sat entirely BEFORE the hero markup in byte order, so the parser had to stream and
  // chew through ~70KB before it even reached the LCP element (measured: hero-bg div at byte 69,972
  // of 100,003). Desktop hides that completely; under Lighthouse's mobile profile (4x CPU slowdown,
  // Slow 4G) it showed up as 1,790ms of "element render delay" -- the dominant slice of a 4.5s LCP,
  // and the reason an earlier attempt at inlining the hero's critical CSS moved nothing: the
  // bottleneck was never the CSS rule, it was the parser's distance to the element.
  //
  // Safe at end-of-body because nothing reads it during parse. useHomeData() reads it from inside a
  // useState lazy initializer (so: at React mount), and the app bundle is <script type="module">,
  // which is deferred and therefore executes only after the document is fully parsed. A plain
  // <script> like this one executes the moment the parser hits it, which is still strictly before
  // any deferred module. Even if that ordering ever broke, useHomeData falls back to
  // GET /api/homepage rather than rendering empty.
  const preloadScript = `<script>window.__PRELOADED_HOME__=${escapeJsonForScriptTag(data)}</script>`;

  // The hero preload hints that used to live here are gone with the photograph. HeroPanel paints
  // no image at all now, so the LCP element is the headline: text, present in this static HTML, and
  // painting as soon as the inlined stylesheet lands. Preloading files nothing renders would have
  // been the exact opposite of what the hint existed for.
  const heroPreload = '';

  // preloadScript is deliberately NOT in this <head> group -- see its own comment above. faqScript
  // stays in <head>: it's JSON-LD for crawlers, small, and belongs with the other metadata.
  // inlineStylesheet runs last so it operates on the finished document and can't be undone by a
  // later replace re-introducing the <link>.
  // heroPreload goes at the TOP of <head>, not the bottom, and that ordering is load-bearing once
  // the stylesheet is inlined below: inlining puts ~76KB of CSS into <head>, and anything after it
  // is 76KB further from the preload scanner. Injected at the end of <head> (as it was before this
  // change) the image preload landed at byte ~83,000 instead of ~7,900, which would have given back
  // the resource-load-delay improvement measured the day before (410ms -> 220ms) to buy a smaller
  // saving elsewhere. First bytes of <head> is the only correct home for it.
  const html = inlineStylesheet(
    template
      .replace('<head>', `<head>\n    ${heroPreload}`)
      .replace('</head>', `${faqScript}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
      .replace('</body>', `  ${preloadScript}\n  </body>`),
    distPath
  );

  // Both assertions guard against a silent no-op shipping to production: a missed preload injection
  // renders the content sections empty until /api/homepage resolves (the exact flash the preload
  // exists to prevent), and a surviving stylesheet <link> means the homepage still blocks render on
  // a request this whole change exists to remove. Failing the build is the cheaper outcome.
  if (!html.includes('__PRELOADED_HOME__')) {
    console.error('[prerender-homepage] Failed to inject __PRELOADED_HOME__ -- no </body> in the template?');
    process.exit(1);
  }
  if (/<link[^>]*rel="stylesheet"[^>]*\/assets\/index-[^"]+\.css/.test(html)) {
    console.error('[prerender-homepage] Stylesheet <link> survived inlining -- the homepage would still block render.');
    process.exit(1);
  }

  fs.writeFileSync(templatePath, html, 'utf8');
  console.log(
    `[prerender-homepage] Wrote dist/shell.html (empty, for dead-URL fallback) and overwrote dist/index.html ` +
      `with real homepage content (${data.articles.length} published pages, ${data.counties.length} counties)`
  );
}

run().catch((err) => {
  console.error('[prerender-homepage] Failed:', err);
  process.exit(1);
});
