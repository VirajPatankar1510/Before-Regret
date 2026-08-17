import React, { useEffect, useRef, useState } from 'react';
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
  const footerRef = useRef<HTMLElement>(null);

  // Gated on the footer actually scrolling near the viewport, not on browser idle time. The prior
  // requestIdleCallback version was a real improvement (it stopped this from blocking anything),
  // but PageSpeed's network dependency tree still showed it chained right after the JS bundle as
  // the site's longest critical path (1,416ms) -- because in a scripted Lighthouse run the main
  // thread has nothing else competing for it, requestIdleCallback fires within milliseconds of
  // load, which is indistinguishable from "fetch immediately" as far as the initial-navigation
  // trace is concerned. An IntersectionObserver ties the request to something a synthetic,
  // no-scroll page-load audit never does (scroll toward the footer), so it's absent from that
  // trace entirely, not just lower-priority within it -- and for the real visitors who never
  // scroll this far, the request now never fires at all.
  //
  // No SEO cost: these links have never existed in the static HTML. Effects don't run during
  // renderToString, and no prerender script renders Footer at all -- confirmed against the live
  // homepage, whose served HTML contains no footer guide links. They have always been
  // client-rendered after this fetch; this only changes when it starts.
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

    const node = footerRef.current;
    if (typeof IntersectionObserver === 'function' && node) {
      // 600px rootMargin: starts the fetch while the footer is still a comfortable scroll away,
      // so the links are populated well before a reader who does scroll this far actually arrives
      // -- not so late it reads as a pop-in, not so early it degenerates back into "fires on
      // basically every page load" the way idle time did.
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            loadGuides();
            observer.disconnect();
          }
        },
        { rootMargin: '600px 0px' }
      );
      observer.observe(node);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }

    // No IntersectionObserver (very old browsers only at this point) or no node to observe yet --
    // fall back to firing on load rather than never fetching at all.
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
    <footer ref={footerRef} className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
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
              Property research guides for US home buyers, built from public records. Know what to check before closing.
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
                <li><ContentLink href="/disclaimer" onNavigate={onNavigate} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Disclaimer</ContentLink></li>
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
          <p className="text-[11px] text-slate-400">
            This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau.
          </p>
        </div>

      </div>
    </footer>
  );
};
