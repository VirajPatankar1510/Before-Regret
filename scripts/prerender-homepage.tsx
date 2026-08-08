import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListingOmissionsSection } from '../src/components/home/ListingOmissionsSection';
import { HowItWorksSection } from '../src/components/home/HowItWorksSection';
import { PricingSection } from '../src/components/home/PricingSection';
import { ClosingCtaSection } from '../src/components/home/ClosingCtaSection';
import { HOMEPAGE_FAQS } from '../src/components/home/FaqSection';

// Static HTML generator for the homepage, run after `vite build` alongside
// scripts/prerender-guides.tsx. Writes to dist/home.html -- deliberately NOT dist/index.html.
//
// dist/index.html is also what vercel.json's catch-all rewrite serves for every *unmatched*
// path, including dead URLs that the client-side 404 fix (src/App.tsx) now handles at the JS
// layer. If real homepage content were baked into that same shared file, a crawler hitting a
// dead URL without executing JS would see real homepage content again -- reintroducing the exact
// soft-404 problem that fix addresses, at the static layer instead of the JS layer. Writing to a
// separate file and adding a dedicated `{"source": "/", "destination": "/home.html"}` rewrite
// (checked before the catch-all in vercel.json) gives the real homepage a real static file
// without touching what dead paths resolve to.
//
// Deliberately skips AddressSearchBox (the actual interactive search UI) -- it's a heavy,
// browser-dependent component (geocoding calls, map tiles, etc.) with no reason to exist in a
// static crawler-facing shell. A real browser loads the same JS bundle referenced in this file
// and boots the normal interactive homepage on top via createRoot() (not hydrateRoot() -- see
// src/main.tsx), so there's no mismatch risk from this simplified markup being replaced.

function noop() {}

function HomeStaticBody() {
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
  const template = fs.readFileSync(templatePath, 'utf8');

  const bodyHtml = renderToStaticMarkup(<HomeStaticBody />);
  const faqScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(buildFaqJsonLd())}</script>`;

  const html = template
    .replace('</head>', `${faqScript}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  fs.writeFileSync(path.join(distPath, 'home.html'), html, 'utf8');
  console.log('[prerender-homepage] Wrote dist/home.html');
}

run().catch((err) => {
  console.error('[prerender-homepage] Failed:', err);
  process.exit(1);
});
