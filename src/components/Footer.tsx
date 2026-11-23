import React, { useEffect, useRef, useState } from 'react';
import { ContentLink } from './home/ContentLink';
import { PREFERRED_SOURCE_URL, PREFERRED_SOURCE_LABEL } from '../data/preferredSource';
import { pickFooterGuides } from '../data/footerGuides';

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
          // from a list like that. pickFooterGuides keeps that filter and adds the part that was
          // missing: WHICH four, chosen by measured search performance rather than by whichever
          // four happened to be written most recently. See src/data/footerGuides.ts.
          //
          // It must stay the same call scripts/prerender-guides.tsx makes. These four links appear
          // on ~70 pages, so a served footer that disagrees with the hydrated one would swap the
          // site's strongest internal links on every page at mount.
          setGuides(pickFooterGuides(data.articles as GuideSummary[]));
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

  // 2026-11-23 (Apple-style pass 3): a quiet, small-type directory like apple.com's footer. The big logo,
  // the "Research a Property" button and the shield heading went; every link stayed (they are crawl paths,
  // see StaticFooterLinks.tsx), regrouped into four short columns with the legal links on the last line.
  const L = 'text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer block py-1';
  return (
    <footer ref={footerRef} className="bg-home-mist text-[12px] leading-[1.4] text-slate-500 px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="max-w-5xl mx-auto">

        {/* Required verbatim by the Census Bureau API's Terms of Service (Attribution section,
            census.gov/data/developers/about/terms-of-service.html): "should display the
            following notice prominently within the application." This is the one, site-wide
            place that notice lives. */}
        <div className="pb-4 border-b border-slate-300 space-y-2">
          <p>Before Regret: property research guides for US home buyers, built from public records.</p>
          <p>This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau.</p>
        </div>

        {/* Directory Links for pSEO & Legal */}
        {onNavigate && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 py-6 border-b border-slate-300">
            {guides.length > 0 && (
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-slate-900 mb-1.5">Guides</p>
                <ul>
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <ContentLink href={`/guides/${guide.slug}/`} onNavigate={onNavigate} className={L}>{guide.title}</ContentLink>
                    </li>
                  ))}
                  <li>
                    <ContentLink href="/guides/" onNavigate={onNavigate} className={L}>View all guides</ContentLink>
                  </li>
                </ul>
              </div>
            )}

            <div>
              <p className="font-semibold text-slate-900 mb-1.5">Explore</p>
              <ul>
                <li><button type="button" onClick={onNewSearch} className={`${L} text-left`}>Check an address</button></li>
                {/* Plain <a>, NOT ContentLink: /research/ and /sunlight/ are standalone static
                    documents (prerender-research.tsx, prerender-sunlight.tsx), not SPA routes.
                    ContentLink would preventDefault and hand the path to onNavigate, which has
                    nothing to render for them. ONE HUB LINK for research, not a list of studies:
                    /research/ lists every study and is in the sitemap. */}
                <li><a href="/research/" className={L}>Research &amp; Data</a></li>
                <li><a href="/sunlight/" className={L}>Sunlight by Room</a></li>
                <li><ContentLink href="/about/" onNavigate={onNavigate} className={L}>About &amp; Methodology</ContentLink></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-1.5">For Businesses</p>
              <ul>
                <li><ContentLink href="/advertise/" onNavigate={onNavigate} className={L}>Advertise With Us</ContentLink></li>
                {/* Vendors' sign-in door since the navbar's button stopped opening sign-in (2026-10-05). */}
                <li><ContentLink href="/my-ads/" onNavigate={onNavigate} className={L}>Manage My Ads</ContentLink></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-1.5">Support</p>
              <ul>
                <li><ContentLink href="/support/" onNavigate={onNavigate} className={L}>Customer Support</ContentLink></li>
                {/* External, so a plain <a> rather than ContentLink. See src/data/preferredSource.ts. */}
                <li><a href={PREFERRED_SOURCE_URL} target="_blank" rel="noopener noreferrer" className={L}>{PREFERRED_SOURCE_LABEL}</a></li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>© {new Date().getFullYear()} Before Regret. All rights reserved.</p>
          {onNavigate && (
            <ul className="flex flex-wrap items-center">
              {[
                ['/terms/', 'Terms of Service'],
                ['/privacy/', 'Privacy Policy'],
                ['/refunds/', 'Refund & Cancellation'],
                ['/disclaimer/', 'Disclaimer'],
                ['/accessibility/', 'Accessibility'],
              ].map(([href, label], i) => (
                <li key={href} className={i > 0 ? 'border-l border-slate-300 pl-2.5 ml-2.5' : ''}>
                  <ContentLink href={href} onNavigate={onNavigate} className="text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer block py-1">{label}</ContentLink>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </footer>
  );
};
