import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';
import { Logo } from './Logo';
import { ContentLink } from './home/ContentLink';

interface FooterProps {
  onNewSearch: () => void;
  onNavigate?: (path: string) => void;
}

interface GuideSummary {
  slug: string;
  title: string;
  articleType?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNewSearch, onNavigate }) => {
  const [guides, setGuides] = useState<GuideSummary[]>([]);

  // Deferred to idle rather than fired on mount. PageSpeed's network dependency tree showed this
  // request as the tail of the homepage's longest critical chain (HTML -> JS bundle -> /api/guides,
  // 1,810ms max latency) -- it can't start until the whole JS bundle has downloaded and executed,
  // and then competes for bandwidth during the page's most contended window, all for four links in
  // a footer that is below the fold on every viewport.
  //
  // No SEO cost: these links have never existed in the static HTML. Effects don't run during
  // renderToString, and no prerender script renders Footer at all -- confirmed against the live
  // homepage, whose served HTML contains no footer guide links. They have always been
  // client-rendered after this fetch; this only changes when it starts. Same requestIdleCallback +
  // load-event fallback shape as the deferred gtag loader in index.html.
  useEffect(() => {
    let cancelled = false;

    const loadGuides = () => {
      if (cancelled) return;
      fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.articles)) {
          // Evergreen guides only -- /api/guides returns every published article newest-first,
          // which now includes timely FEMA county-event pieces and data-comparison reports
          // alongside the evergreen "how to" guides this list was built to showcase. A footer
          // that mixes "Does Buying a House Reset Property Tax Assessment" with "FEMA Declaration
          // DR-4906-WA" reads as incoherent -- a first-time visitor can't tell what the site is
          // from a list like that. Filtering to article_type = 'guide' keeps this list what it
          // was meant to be: a first impression of the evergreen editorial content.
          setGuides(data.articles.filter((a: GuideSummary) => (a.articleType ?? 'guide') === 'guide').slice(0, 4));
        }
      })
        .catch(() => {});
    };

    // Read off a local rather than testing `'requestIdleCallback' in window` directly -- that form
    // narrows `window` itself to never in the branch below, where it's still needed.
    // 3s timeout, not the 4s used for gtag: these are real navigation links a reader might
    // actually want, so they should never be held back long on a page that simply stays busy.
    const idle: ((cb: () => void, opts?: { timeout: number }) => number) | undefined =
      (window as any).requestIdleCallback;
    if (idle) {
      const handle = idle(loadGuides, { timeout: 3000 });
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback?.(handle);
      };
    }

    // Safari has no requestIdleCallback. If the load event already fired (the common case for a
    // client-side route change into a page that mounts Footer), listening for it would never fire
    // again -- so run on the next tick instead.
    if (document.readyState === 'complete') {
      const timer = setTimeout(loadGuides, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    window.addEventListener('load', loadGuides);
    return () => {
      cancelled = true;
      window.removeEventListener('load', loadGuides);
    };
  }, []);

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 shrink-0" />
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight block">Before Regret</span>
                <span className="text-[10px] font-medium text-slate-400">Check it before you sign it.</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Expert property research guides for US home buyers. Uncover what matters before closing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNewSearch}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Research a Property</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Directory Links for pSEO & Legal */}
        {onNavigate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400 pb-6 border-b border-slate-900">
            {guides.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Editorial Guides</span>
                </div>
                <ul className="space-y-2">
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <ContentLink href={`/guides/${guide.slug}/`} onNavigate={onNavigate} className="hover:text-white cursor-pointer block py-1.5">{guide.title}</ContentLink>
                    </li>
                  ))}
                  <li>
                    <ContentLink href="/guides/" onNavigate={onNavigate} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">View all guides →</ContentLink>
                  </li>
                  <li>
                    <ContentLink href="/counties/" onNavigate={onNavigate} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">View all counties →</ContentLink>
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Legal & Support Policies</span>
              </div>
              <ul className="space-y-2">
                <li><ContentLink href="/about" onNavigate={onNavigate} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">About & Methodology</ContentLink></li>
                <li><ContentLink href="/advertise" onNavigate={onNavigate} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">Advertise With Us</ContentLink></li>
                <li><ContentLink href="/support" onNavigate={onNavigate} className="hover:text-white cursor-pointer font-medium text-slate-300 block py-1.5">Customer Support</ContentLink></li>
                <li><ContentLink href="/terms" onNavigate={onNavigate} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Terms of Service</ContentLink></li>
                <li><ContentLink href="/privacy" onNavigate={onNavigate} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Privacy Policy</ContentLink></li>
                <li><ContentLink href="/refunds" onNavigate={onNavigate} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Refund & Cancellation</ContentLink></li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 space-y-1.5">
          <p>© {new Date().getFullYear()} Before Regret. All rights reserved.</p>
          {/* Required verbatim by the Census Bureau API's Terms of Service (Attribution section,
              census.gov/data/developers/about/terms-of-service.html): "should display the
              following notice prominently within the application." Several published pages
              already draw on this API (county housing-age/insurance-cost comparisons, the era x
              defect reference library) -- this is the one, site-wide place that notice lives,
              rather than repeating it on every page that happens to use Census data. */}
          <p className="text-[11px] text-slate-500">
            This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau.
          </p>
        </div>

      </div>
    </footer>
  );
};
