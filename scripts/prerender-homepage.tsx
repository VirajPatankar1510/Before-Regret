import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListingOmissionsSection } from '../src/components/home/ListingOmissionsSection';
import { HowItWorksSection } from '../src/components/home/HowItWorksSection';
import { PricingSection } from '../src/components/home/PricingSection';
import { ClosingCtaSection } from '../src/components/home/ClosingCtaSection';
import { HOMEPAGE_FAQS } from '../src/components/home/FaqSection';
import { withDb, isDbConfigured } from '../src/server/db.js';

interface HomepageGuideLink {
  slug: string;
  title: string;
}

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

function HomeStaticBody({ guides }: { guides: HomepageGuideLink[] }) {
  return (
    <div className="space-y-0 pb-16">
      <section className="relative min-h-[40vh] flex flex-col justify-center text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Could you regret moving here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              Search any US residential address. Get the checks that actually matter for a home of its age and county, the exact questions to ask the seller, and a clear list of what to verify before you sign.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your first report is free. No credit card required.
          </p>
        </div>
      </section>

      <ListingOmissionsSection />
      <HowItWorksSection />
      <PricingSection onScrollToSearch={noop} />

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

      {guides.length > 0 && (
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                Editorial Guides
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                What inspectors flag, what insurers deny, and what to ask before you sign.
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <a
                    href={`/guides/${guide.slug}/`}
                    className="block px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-blue-700 hover:border-blue-300 font-medium"
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="text-center">
              <a href="/guides/" className="inline-block font-bold text-blue-700 hover:text-blue-800">
                View all guides →
              </a>
            </div>
          </div>
        </section>
      )}

      <ClosingCtaSection onScrollToSearch={noop} />
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

  let guides: HomepageGuideLink[] = [];
  if (isDbConfigured()) {
    const rows = (await withDb((sql) => sql`
      SELECT slug, title FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 6
    `)) as unknown as HomepageGuideLink[];
    guides = rows;
  }

  const bodyHtml = renderToStaticMarkup(<HomeStaticBody guides={guides} />);
  const faqScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(buildFaqJsonLd())}</script>`;

  const html = template
    .replace('</head>', `${faqScript}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  fs.writeFileSync(templatePath, html, 'utf8');
  console.log('[prerender-homepage] Wrote dist/shell.html (empty, for dead-URL fallback) and overwrote dist/index.html with real homepage content');
}

run().catch((err) => {
  console.error('[prerender-homepage] Failed:', err);
  process.exit(1);
});
