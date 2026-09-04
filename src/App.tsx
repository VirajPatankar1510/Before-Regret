import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Loader2 } from 'lucide-react';
import {
  PropertySearchResult,
  ResearchSummaryData,
  PropertyReport
} from './types';
import { createFallbackSummary, createFallbackReport } from './utils/reportFallback';
import { useAuth } from './context/AuthContext';

import { applyHeadSeo } from './utils/headSeo';
import { routeChunkLoaders } from './routeChunks';
// Not a new dependency on the homepage's bundle: Hero.tsx (rendered by this file, never lazy)
// already imports FaqSection, so this module is in the homepage graph regardless.
import { HOMEPAGE_FAQS } from './components/home/FaqSection';

// --- Route-level code splitting ------------------------------------------------------------
// Everything below is pulled out of the initial bundle, because none of it can appear on a
// visitor's first paint. Measured against the real production build: the single entry chunk was
// 1,157 kB raw / 237 kB gzip, and PageSpeed reported ~94 KiB of it as never executed on the
// homepage -- almost entirely the two admin panels (2,373 lines between them, behind a login
// nobody but the operator ever passes) plus the checkout and post-search report views.
//
// What is deliberately NOT lazy here: Navbar, Hero, Footer. Those are on the homepage's own first
// paint, so splitting them would only add a round trip to the page this exists to speed up.
//
// The guide/county/legal page views below WERE in that same exempt list, for a reason that was
// correct as written: their prerendered HTML lives inside <div id="root">, and main.tsx mounts
// with createRoot().render(), which discards that markup and re-renders -- so a lazy chunk would
// have swapped a visitor's prerendered article for a spinner mid-load. They are split now only
// because main.tsx awaits the current route's chunk before mounting (see src/routeChunks.ts), so
// React never mounts into a state where those components are missing and the Suspense boundary is
// never reached for them. Without that await this would be a regression, not an optimization.
const ResearchProgressView = lazy(() => import('./components/ResearchProgressView').then((m) => ({ default: m.ResearchProgressView })));
const ResearchSummaryView = lazy(() => import('./components/ResearchSummaryView').then((m) => ({ default: m.ResearchSummaryView })));
const PropertyReportView = lazy(() => import('./components/PropertyReportView').then((m) => ({ default: m.PropertyReportView })));
const ReportGatingModal = lazy(() => import('./components/ReportGatingModal').then((m) => ({ default: m.ReportGatingModal })));
const Vendors = lazy(() => import('./components/Vendors').then((m) => ({ default: m.Vendors })));
const GuideAdsCheckout = lazy(() => import('./components/GuideAdsCheckout').then((m) => ({ default: m.GuideAdsCheckout })));
const GuideAdsCheckoutSuccess = lazy(() => import('./components/GuideAdsCheckoutSuccess').then((m) => ({ default: m.GuideAdsCheckoutSuccess })));
const ZipAdsCheckoutSuccess = lazy(() => import('./components/ZipAdsCheckoutSuccess').then((m) => ({ default: m.ZipAdsCheckoutSuccess })));
const AdvertiseCompare = lazy(() => import('./components/AdvertiseCompare').then((m) => ({ default: m.AdvertiseCompare })));
const MyAdsPanel = lazy(() => import('./components/MyAdsPanel').then((m) => ({ default: m.MyAdsPanel })));
const SeoAdminPanel = lazy(() => import('./components/seo/SeoAdminPanel').then((m) => ({ default: m.SeoAdminPanel })));
const AdminGate = lazy(() => import('./components/admin/AdminGate').then((m) => ({ default: m.AdminGate })));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess').then((m) => ({ default: m.PaymentSuccess })));
const PaymentCancelled = lazy(() => import('./components/PaymentCancelled').then((m) => ({ default: m.PaymentCancelled })));

// The nine prerendered route views. These go through routeChunkLoaders rather than a bare
// import() so this file and main.tsx's pre-mount await resolve the identical module specifier --
// if the two ever drifted apart, main.tsx would dutifully warm one chunk while lazy() requested a
// different one, and the flash these are ordered around would come straight back.
const GuidePageView = lazy(() => routeChunkLoaders.guide().then((m) => ({ default: m.GuidePageView })));
const GuidesIndexView = lazy(() => routeChunkLoaders.guidesIndex().then((m) => ({ default: m.GuidesIndexView })));
const AboutMethodology = lazy(() => routeChunkLoaders.about().then((m) => ({ default: m.AboutMethodology })));
const ContactUs = lazy(() => routeChunkLoaders.support().then((m) => ({ default: m.ContactUs })));
const TermsConditions = lazy(() => routeChunkLoaders.terms().then((m) => ({ default: m.TermsConditions })));
const PrivacyPolicy = lazy(() => routeChunkLoaders.privacy().then((m) => ({ default: m.PrivacyPolicy })));
const RefundPolicy = lazy(() => routeChunkLoaders.refunds().then((m) => ({ default: m.RefundPolicy })));
const Disclaimer = lazy(() => routeChunkLoaders.disclaimer().then((m) => ({ default: m.Disclaimer })));
const Accessibility = lazy(() => routeChunkLoaders.accessibility().then((m) => ({ default: m.Accessibility })));

/** Shown only while a split chunk above is in flight -- never on a prerendered landing page. */
const RouteChunkFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
  </div>
);

export function App() {
  const { getToken } = useAuth();

  // Session state restoration to continue where left off after auth login/signup
  const [currentStep, setCurrentStep] = useState<'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT' | 'PSEO'>(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_session_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentStep) {
          return parsed.currentStep;
        }
      }
    } catch (e) {}
    return 'HOME';
  });

  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_session_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.selectedProperty) {
          return parsed.selectedProperty;
        }
      }
    } catch (e) {}
    return null;
  });

  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_session_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.summaryData) {
          return parsed.summaryData;
        }
      }
    } catch (e) {}
    return null;
  });

  const [report, setReport] = useState<PropertyReport | null>(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_session_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.report) {
          return parsed.report;
        }
      }
    } catch (e) {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGatingModalOpen, setIsGatingModalOpen] = useState(false);

  // Synchronize active session state with sessionStorage
  useEffect(() => {
    try {
      if (currentStep !== 'HOME' || selectedProperty || summaryData || report) {
        sessionStorage.setItem('beforeregret_session_state', JSON.stringify({
          currentStep,
          selectedProperty,
          summaryData,
          report
        }));
      } else {
        sessionStorage.removeItem('beforeregret_session_state');
      }
    } catch (e) {}
  }, [currentStep, selectedProperty, summaryData, report]);

  // Active PSEO / Legal Route State
  const [pseoRoute, setPseoRoute] = useState<{
    type: 'admin' | 'guidesIndex' | 'guide' | 'countiesIndex' | 'county' | 'about' | 'support' | 'terms' | 'privacy' | 'refunds' | 'disclaimer' | 'accessibility' | 'vendors' | 'vendorsSuccess' | 'guideAds' | 'guideAdsSuccess' | 'advertiseCompare' | 'myAds' | 'paymentSuccess' | 'paymentCancelled' | 'notFound' | 'reportUnavailable' | 'none';
    guideSlug?: string;
    // 'reportUnavailable' only. A report permalink is the link people actually SHARE, so the two
    // reasons it can fail need different words: a generic "404 — Page Not Found" tells someone who
    // was sent a link that the site is broken, and tells someone hitting a transient database blip
    // that their report is gone. Neither is true.
    reportFailure?: 'not_found' | 'unavailable';
  }>({ type: 'none' });

  // Function to resolve current URL path to route
  const resolveRouteFromPath = (pathname: string) => {
    // Normalize path trailing slash
    const path = pathname.endsWith('/') ? pathname : `${pathname}/`;

    // Checked before the generic /report-ads match below, same reasoning as /topic-ads/success
    // above -- PayPal's return redirect must land on the capture page, not the checkout form.
    if (path === '/report-ads/success/' || path.startsWith('/report-ads/success')) {
      setPseoRoute({ type: 'vendorsSuccess' });
      setCurrentStep('PSEO');
      return true;
    }
    if (path === '/report-ads/' || path.startsWith('/report-ads')) {
      setPseoRoute({ type: 'vendors' });
      setCurrentStep('PSEO');
      return true;
    }

    // /report-ads and /topic-ads are two structurally different products (per-ZIP-and-trade slots
    // vs. per-guide-page slots) with their own checkout flows -- kept as separate routes so
    // neither page has to explain the other. /advertise is deliberately neither: it's the shared
    // funnel entry point (linked from GuideAdSlot.tsx's recruitment CTA and from outside links)
    // that compares both before sending the vendor to whichever checkout fits. Checked before the
    // two checkout routes below since /advertise no longer aliases straight to topic-ads.
    if (path === '/advertise/' || path.startsWith('/advertise')) {
      setPseoRoute({ type: 'advertiseCompare' });
      setCurrentStep('PSEO');
      return true;
    }

    // The vendor placement manager -- checked here rather than folded into either checkout route,
    // since a vendor with both a topic ad and a report ad needs one place that covers both.
    if (path === '/my-ads/' || path.startsWith('/my-ads')) {
      setPseoRoute({ type: 'myAds' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/topic-ads/success/' || path.startsWith('/topic-ads/success')) {
      setPseoRoute({ type: 'guideAdsSuccess' });
      setCurrentStep('PSEO');
      return true;
    }
    if (path === '/topic-ads/' || path.startsWith('/topic-ads')) {
      setPseoRoute({ type: 'guideAds' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/about/' || path.startsWith('/about')) {
      setPseoRoute({ type: 'about' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/support/' || path.startsWith('/support')) {
      setPseoRoute({ type: 'support' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/terms/' || path.startsWith('/terms')) {
      setPseoRoute({ type: 'terms' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/privacy/' || path.startsWith('/privacy')) {
      setPseoRoute({ type: 'privacy' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/refunds/' || path.startsWith('/refunds') || path.startsWith('/refund-policy')) {
      setPseoRoute({ type: 'refunds' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/disclaimer/' || path.startsWith('/disclaimer')) {
      setPseoRoute({ type: 'disclaimer' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/accessibility/' || path.startsWith('/accessibility')) {
      setPseoRoute({ type: 'accessibility' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/payment-success/' || path.startsWith('/payment-success')) {
      setPseoRoute({ type: 'paymentSuccess' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path === '/payment-cancelled/' || path.startsWith('/payment-cancelled')) {
      setPseoRoute({ type: 'paymentCancelled' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path.startsWith('/admin/seo')) {
      setPseoRoute({ type: 'admin' });
      setCurrentStep('PSEO');
      return true;
    }

    if (path.startsWith('/guides/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        setPseoRoute({ type: 'guide', guideSlug: parts[1] });
        setCurrentStep('PSEO');
        return true;
      }
      // Exact /guides/ (no slug) -- the hub every guide should be reachable from. Checked after
      // the slug case above only for readability; parts.length distinguishes them unambiguously.
      setPseoRoute({ type: 'guidesIndex' });
      setCurrentStep('PSEO');
      return true;
    }

    // /state/* and /compare/* routes (city/state/zip hubs, topic pages, zip comparisons) were
    // removed along with the fabricated per-ZIP dataset they rendered. Old URLs in those two
    // trees fall through to `return false` below, which the caller treats as "no route matched."

    return false;
  };

  const handleNavigate = (targetPath: string) => {
    try {
      window.history.pushState({}, '', targetPath);
    } catch (e) {
      console.warn('pushState unavailable:', e);
    }

    if (!resolveRouteFromPath(targetPath)) {
      if (targetPath === '/') {
        setCurrentStep('HOME');
        setPseoRoute({ type: 'none' });
      } else if (!targetPath.startsWith('/insights/') && !targetPath.startsWith('/report/')) {
        setPseoRoute({ type: 'notFound' });
        setCurrentStep('PSEO');
      }
    }
    // Instant, not smooth -- a route change can swap in a page of very different height (e.g. a
    // long guide article collapsing to the much shorter homepage). A smooth scroll animates
    // toward 0 over several hundred ms; if React commits the new, shorter page mid-animation, the
    // browser clamps the in-flight scroll position against the new page's (smaller) max scroll
    // instead of reaching 0, landing the reader somewhere in the middle of the new page instead of
    // at the top.
    window.scrollTo(0, 0);
  };

  // The report currently in state, readable from inside the mount effect's popstate listener.
  // That listener is registered once with [] deps, so it closes over the FIRST render's `report`
  // forever; without this ref it would always look like there is no report loaded and refetch on
  // every Back press.
  const reportRef = useRef<PropertyReport | null>(null);
  useEffect(() => { reportRef.current = report; }, [report]);

  // Loads a report permalink (/insights/:id, /report/:id, ?reportId=). Extracted so that the mount
  // effect and the popstate handler go through exactly one implementation -- they used to differ,
  // and that difference WAS the back-button bug: popstate skipped /insights/ entirely, so pressing
  // Back from a guide to a report changed the URL and left the guide on screen.
  const loadReportById = (id: string) => {
    setIsLoading(true);
    // The retry against /api/report/:id that used to sit here has been dropped: server.ts serves
    // /api/insights, /api/report and /api/reports from one handler, so the "fallback" was a second
    // request to the same code guaranteed to give the same answer.
    fetch(`/api/insights/${id}`)
      .then((res) => {
        // 503 means we could not reach the database, which is not the same as "this report does
        // not exist" -- telling someone their report is gone when the truth is "we can't look
        // right now" is its own kind of wrong answer, so it gets a distinct, retryable message.
        if (res.status === 503) throw new Error('REPORT_UNAVAILABLE');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) return res.json();
        throw new Error('REPORT_NOT_FOUND');
      })
      .then((data) => {
        if (data && data.success && data.report) {
          setReport(data.report);
          setPseoRoute({ type: 'none' });
          setCurrentStep('REPORT');
        } else {
          throw new Error('REPORT_NOT_FOUND');
        }
      })
      .catch((err) => {
        // Previously this called createFallbackReport(null, null) and rendered the result, which
        // with no property argument invents "1204 Oakridge Dr, Austin, TX 78701" -- a specific
        // street address the visitor never searched, presented as their report. A report we cannot
        // load is now a 404 page, which is the honest answer and the only safe one: this permalink
        // is the thing people share, and a shared link that quietly shows the wrong property is
        // worse than one that plainly says it expired.
        console.warn('Could not load report from permalink:', err);
        setPseoRoute({
          type: 'reportUnavailable',
          reportFailure: err?.message === 'REPORT_UNAVAILABLE' ? 'unavailable' : 'not_found',
        });
        setCurrentStep('PSEO');
      })
      .finally(() => setIsLoading(false));
  };

  // Check URL on mount for standalone report permalinks & pSEO routes
  useEffect(() => {
    // Handle browser popstate.
    //
    // This used to do NOTHING for /insights/ and /report/ paths -- the else-if explicitly excluded
    // them -- which meant pressing Back onto a report permalink moved the URL and left the
    // previous page rendered. Reproduced on production 2026-09-04: from a report, click through to
    // /about/, press Back, and the address bar reads /insights/rep_... while the About page is
    // still on screen.
    //
    // That was one of two back-button bugs found the same day. The other -- see the IIFE below --
    // meant this listener was never registered at all when the app booted on a pSEO route, so
    // fixing only this one would have left Back broken for anyone arriving from search.
    const handlePopState = () => {
      const popPathname = window.location.pathname;
      if (resolveRouteFromPath(popPathname)) return;

      if (popPathname === '/') {
        setCurrentStep('HOME');
        setPseoRoute({ type: 'none' });
        return;
      }

      const permalink = popPathname.match(/^\/(?:insights|report)\/([^/]+)\/?$/);
      if (permalink) {
        const id = permalink[1];
        // Already in state -- the common case, since Back usually returns to the report the user
        // just came from. Re-render it directly rather than refetching, so the view snaps back
        // instead of flashing a loading state for something we are already holding.
        if (reportRef.current && reportRef.current.id === id) {
          setPseoRoute({ type: 'none' });
          setCurrentStep('REPORT');
        } else {
          loadReportById(id);
        }
        return;
      }

      setPseoRoute({ type: 'notFound' });
      setCurrentStep('PSEO');
    };
    window.addEventListener('popstate', handlePopState);

    // Resolve whatever route the app booted on.
    //
    // WRAPPED IN AN IIFE ON PURPOSE. This block returns early in several places -- most commonly
    // the very first check, `if (resolveRouteFromPath(pathname)) return`, which fires for every
    // guide page, /guides/, /about/, /advertise/ and every other pSEO route. Those returns used to
    // exit the EFFECT, and the popstate listener was registered after them, so on any of those
    // routes the listener was never attached at all: pressing Back changed the URL and left the
    // previous view on screen. That is most of the site's search landing pages. Reproduced
    // 2026-09-04: load /guides/, click into a guide, press Back -- the URL returns to /guides/ and
    // the guide is still rendered. Registering the listener above this block, and confining the
    // early returns to the IIFE, is the fix.
    (() => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // Try resolving pSEO route first
    if (resolveRouteFromPath(pathname)) {
      return;
    }

    // No pSEO route matched -- if we're sitting at the root path, make sure we actually land on
    // the homepage rather than a stale non-HOME step restored from a prior page's sessionStorage
    // (e.g. the user was on /report-ads, then hard-navigated straight to the bare domain).
    const isRoot = pathname === '/';
    if (isRoot) {
      setPseoRoute({ type: 'none' });
      // Clerk sign-in does a full page reload back to this path, so whatever research the user had
      // in flight is restored from sessionStorage by the useState initializers above and must
      // survive. Only drop steps that can't actually render here: 'PSEO' (pseoRoute isn't persisted
      // alongside currentStep, so it would paint a blank page) and any step whose backing data is
      // missing. 'RESEARCHING' collapses to 'SUMMARY' because the progress animation that would
      // have advanced it isn't running after a reload.
      setCurrentStep((prev) => {
        if (prev === 'PSEO') return 'HOME';
        if (prev === 'REPORT') return report ? 'REPORT' : 'HOME';
        if (prev === 'RESEARCHING' || prev === 'SUMMARY') return summaryData ? 'SUMMARY' : 'HOME';
        return prev;
      });
    }

    let reportIdFromUrl: string | null = null;

    if (pathname.startsWith('/insights/')) {
      reportIdFromUrl = pathname.replace('/insights/', '').trim().replace(/\/$/, '');
    } else if (pathname.startsWith('/report/')) {
      reportIdFromUrl = pathname.replace('/report/', '').trim().replace(/\/$/, '');
      try {
        window.history.replaceState({}, '', `/insights/${reportIdFromUrl}`);
      } catch (e) {}
    } else if (searchParams.get('reportId')) {
      reportIdFromUrl = searchParams.get('reportId');
    }

    if (reportIdFromUrl && reportIdFromUrl.length > 0) {
      loadReportById(reportIdFromUrl);
    } else if (!isRoot) {
      // No pSEO route matched, not the homepage, and no report permalink found here -- this is a
      // genuinely unrecognized URL. Render an honest 404 instead of silently falling back to the
      // homepage (a "soft 404" that used to leave dead/removed URLs indexable under `index, follow`).
      setPseoRoute({ type: 'notFound' });
      setCurrentStep('PSEO');
    }

    })();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set SEO metadata for top-level non-pSEO routes (Homepage, Support, Legal, Report, Admin)
  useEffect(() => {
    // window.location.pathname === '/' is not redundant with the state check below -- on the very
    // first render of ANY deep link (e.g. /guides/some-slug/), currentStep/pseoRoute still hold
    // their default HOME/'none' values, because the mount effect above that corrects them (via
    // resolveRouteFromPath) runs in the same commit but schedules its setState calls for the NEXT
    // render, not this one. Without this guard, this effect fires once on that first render and
    // overwrites the correct, statically-prerendered canonical/title (see
    // scripts/prerender-guides.tsx) with the homepage's, for every single deep-linked page --
    // invisible to a plain curl (no JS involved) but very much what Google's JS-rendering
    // pipeline sees, which is exactly the "user-declared canonical: homepage" Search Console was
    // reporting for guide URLs.
    if (currentStep === 'HOME' && pseoRoute.type === 'none' && window.location.pathname === '/') {
      applyHeadSeo({
        // Kept in sync with dist/index.html's own static <title>/<meta description> (see
        // scripts/prerender-homepage.tsx) -- this client-side call was still overwriting that
        // honest static copy back to the old "20+ Public Records" overclaim on every real visit,
        // since it runs on mount regardless of what the static HTML already says.
        title: 'Before Regret — Know What to Check Before You Sign',
        description: 'Search any US address for free -- live seismic hazard data, address validation, inspection priorities, and seller questions -- nothing fabricated.',
        canonicalUrl: 'https://www.beforeregret.com/',
        robotsDirective: 'index, follow',
        // FAQPage, NOT Organization/WebSite. Those two used to be re-declared here, which was a
        // duplicate: index.html already carries them globally, unmarked, in the raw HTML of every
        // page (see the long comment on that block), and headSeo.ts deliberately leaves an
        // unmarked block alone. Confirmed live in the rendered DOM before this fix -- two separate
        // Organization + WebSite groups, one from the template and one appended here on mount.
        //
        // Emitting the homepage FAQ here also repairs a second, quieter loss: headSeo.ts strips
        // every [data-seo="prerendered"] block on mount, which included the FAQPage that
        // scripts/prerender-homepage.tsx bakes in -- so a JS-executing crawler saw the homepage's
        // FAQ schema disappear and nothing replace it. Built from the same HOMEPAGE_FAQS array the
        // visible accordion and the prerender script both read, so all three cannot disagree.
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: HOMEPAGE_FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        }
      });
    } else if (pseoRoute.type === 'about') {
      // Deliberately index, follow -- unlike support/terms/privacy/refunds below, this page is
      // the whole point of the E-E-A-T/trust exercise, so it needs to actually be crawlable and
      // linked, not just present. See AboutMethodology.tsx for why it's process-transparency
      // content rather than a fabricated author bio.
      applyHeadSeo({
        title: 'How We Research and Write BeforeRegret | Methodology',
        description: 'How BeforeRegret verifies live data, writes AI-assisted guides under a fixed set of sourcing rules, and handles corrections.',
        canonicalUrl: 'https://www.beforeregret.com/about/',
        robotsDirective: 'index, follow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            'name': 'How we research and write this site',
            'url': 'https://www.beforeregret.com/about/',
            'isPartOf': { '@type': 'WebSite', 'name': 'Before Regret', 'url': 'https://www.beforeregret.com/' }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'About & Methodology', 'item': 'https://www.beforeregret.com/about/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'support') {
      applyHeadSeo({
        title: 'BeforeRegret Support & Property Research FAQ',
        description: 'Frequently asked questions regarding BeforeRegret public property record research, data sources, municipal permit checks, and report coverage.',
        canonicalUrl: 'https://www.beforeregret.com/support/',
        robotsDirective: 'noindex, nofollow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'Where does BeforeRegret source its property hazard data?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'BeforeRegret runs a live USGS seismic hazard check and validates your address against U.S. Census records automatically. The rest of the report is a curated, address-specific checklist linking directly to the real FEMA, EPA, USDA, U.S. DOT, FCC, and local municipal sources you would otherwise have to track down yourself -- clearly labeled as not yet independently verified until you check them.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Are reports one-time flat fee or subscription based?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Your first BeforeRegret property report is free. Additional reports are a one-time flat fee of $14.99 each -- there is no subscription or recurring charge for consumer reports.'
                }
              }
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Support & FAQ', 'item': 'https://www.beforeregret.com/support/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'terms') {
      applyHeadSeo({
        title: 'Terms of Service | BeforeRegret Property Intelligence',
        description: 'Terms of service and user agreement for BeforeRegret public record property research and automated synthesis tools.',
        canonicalUrl: 'https://www.beforeregret.com/terms/',
        robotsDirective: 'noindex, nofollow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Terms of Service', 'item': 'https://www.beforeregret.com/terms/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'privacy') {
      applyHeadSeo({
        title: 'Privacy Policy | BeforeRegret Property Intelligence',
        description: 'Privacy policy detailing data handling, user anonymity, and secure public record lookup protocols at BeforeRegret.',
        canonicalUrl: 'https://www.beforeregret.com/privacy/',
        robotsDirective: 'noindex, nofollow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Privacy Policy', 'item': 'https://www.beforeregret.com/privacy/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'refunds') {
      applyHeadSeo({
        title: 'Refund Policy & Satisfaction Guarantee | BeforeRegret',
        description: 'BeforeRegret refund policy and customer support commitments for property research report orders.',
        canonicalUrl: 'https://www.beforeregret.com/refunds/',
        robotsDirective: 'noindex, nofollow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Refund Policy', 'item': 'https://www.beforeregret.com/refunds/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'disclaimer') {
      applyHeadSeo({
        title: 'Disclaimer | BeforeRegret',
        description: 'Site-wide disclaimer covering professional advice, third-party government data, AI-generated content, and sponsored placements on BeforeRegret.',
        canonicalUrl: 'https://www.beforeregret.com/disclaimer/',
        robotsDirective: 'noindex, nofollow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Disclaimer', 'item': 'https://www.beforeregret.com/disclaimer/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'accessibility') {
      // indexable, unlike the other legal pages: the point of an accessibility statement is that
      // someone looking for how to report a barrier can actually find it, including via search.
      applyHeadSeo({
        title: 'Accessibility Statement | BeforeRegret',
        description: 'How BeforeRegret approaches accessibility, what is in place, known limitations, and how to report a barrier.',
        canonicalUrl: 'https://www.beforeregret.com/accessibility/',
        robotsDirective: 'index, follow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Accessibility Statement', 'item': 'https://www.beforeregret.com/accessibility/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'vendors') {
      applyHeadSeo({
        title: 'Report Ads | BeforeRegret',
        description: 'Vendor marketplace for home inspectors, contractors, and specialists to reach property buyers.',
        canonicalUrl: 'https://www.beforeregret.com/report-ads/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'vendorsSuccess') {
      applyHeadSeo({
        title: 'Payment Confirmation | BeforeRegret',
        description: 'ZIP-targeted vendor ad slot payment confirmation.',
        canonicalUrl: 'https://www.beforeregret.com/report-ads/success/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'advertiseCompare') {
      // Indexable on purpose, unlike the two checkout pages it routes to (topic-ads, report-ads
      // below stay noindex, nofollow -- payment flows with nothing for a searcher to find). This
      // is the actual acquisition page: someone searching "advertise on beforeregret" or "list my
      // business beforeregret" should be able to find it directly, not only reach it via a link
      // buried in a guide's ad slot. See scripts/prerender-advertise.tsx for the matching
      // build-time static render -- these values must stay in sync with that file by hand.
      applyHeadSeo({
        title: 'Advertise With Us | BeforeRegret',
        description: 'Compare Topic Ads and Report Ads to find the right fit for your business.',
        canonicalUrl: 'https://www.beforeregret.com/advertise/',
        robotsDirective: 'index, follow'
      });
    } else if (pseoRoute.type === 'guideAds') {
      applyHeadSeo({
        title: 'Topic Ads | BeforeRegret',
        description: 'Self-serve topic-based ad placements on BeforeRegret -- $7.99 per slot, 30 days, open to any business.',
        canonicalUrl: 'https://www.beforeregret.com/topic-ads/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'guideAdsSuccess') {
      applyHeadSeo({
        title: 'Payment Confirmation | BeforeRegret',
        description: 'Guide ad slot payment confirmation.',
        canonicalUrl: 'https://www.beforeregret.com/topic-ads/success/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'myAds') {
      applyHeadSeo({
        title: 'My Placements | BeforeRegret',
        description: 'Manage your BeforeRegret ad placements.',
        canonicalUrl: 'https://www.beforeregret.com/my-ads/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (currentStep === 'REPORT') {
      applyHeadSeo({
        title: `Property Insights | ${report?.propertyInfo?.address || 'Subject Property'}`,
        description: 'Private multi-hazard public record research synthesis for subject property.',
        canonicalUrl: `https://www.beforeregret.com/report/${report?.id || 'private'}`,
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'admin') {
      applyHeadSeo({
        title: 'PSEO Operations & Indexing Control Panel | BeforeRegret',
        description: 'Internal administration interface for pSEO dataset management, indexation monitoring, and Search Console integration.',
        canonicalUrl: 'https://www.beforeregret.com/admin/seo',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'notFound') {
      applyHeadSeo({
        title: 'Page Not Found | BeforeRegret',
        description: 'The page you requested does not exist or may have been moved.',
        canonicalUrl: 'https://www.beforeregret.com/',
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'reportUnavailable') {
      applyHeadSeo({
        title: 'Report Not Available | BeforeRegret',
        description: 'This property report link is no longer available.',
        canonicalUrl: 'https://www.beforeregret.com/',
        robotsDirective: 'noindex, nofollow'
      });
    }
  }, [currentStep, pseoRoute.type, report?.id, report?.propertyInfo?.address]);

  // Step 1 -> Step 2: User selects property address
  const handleSelectProperty = async (property: PropertySearchResult) => {
    setSelectedProperty(property);
    setCurrentStep('RESEARCHING');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Pre-populate summary data with high-quality fallback immediately
    const fallbackSummary = createFallbackSummary(property);
    setSummaryData(fallbackSummary);

    // Fetch research summary data in background while animation plays
    try {
      const res = await fetch('/api/property/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property)
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.blocked) {
          // The address validation gate rejected this address -- skip straight to the report
          // screen's rejection message instead of running the research/summary steps for an
          // address that will never be able to generate a report.
          setReport({
            id: `rep_blocked_${Date.now()}`,
            isNonResidential: true,
            rejectionReason: json.rejectionReason,
            blockedAtLayer: json.blockedAtLayer,
            headerInfo: { address: property.formattedAddress || property.displayName },
            propertyInfo: { address: property.formattedAddress || property.displayName, city: property.city, state: property.state, zipCode: property.zipCode, county: property.county || '', propertyType: 'Not Verified', estimatedSqFt: 0 },
            leadWidgets: []
          } as unknown as PropertyReport);
          setCurrentStep('REPORT');
          return;
        }
        if (json && json.data) {
          setSummaryData(json.data);
          return;
        }
      }
      console.warn(`Research API returned non-JSON or status ${res.status}. Keeping client fallback summary.`);
    } catch (err) {
      console.warn('Failed to fetch research summary from server, using client fallback:', err);
      setSummaryData(fallbackSummary);
    }
  };

  // Step 2 completes -> Step 3: Show Research Summary
  const handleResearchProgressComplete = () => {
    if (!summaryData && selectedProperty) {
      setSummaryData(createFallbackSummary(selectedProperty));
    }
    setCurrentStep('SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 -> Step 4: Open Gating Modal or Trigger Full Report Generation
  const handleOpenGatingModal = () => {
    setIsGatingModalOpen(true);
  };

  const handleConfirmAndGenerateReport = async (userEmail: string, isPaid: boolean) => {
    setIsGatingModalOpen(false);

    if (!selectedProperty && !summaryData?.address) {
      const defaultProp: PropertySearchResult = {
        placeId: 'default_prop',
        formattedAddress: '1204 Oakridge Dr, Austin, TX 78701',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        county: 'Travis County',
        country: 'United States',
        lat: 30.2672,
        lon: -97.7431,
        propertyType: 'Single Family Residential',
        displayName: '1204 Oakridge Dr, Austin, TX 78701'
      };
      setSelectedProperty(defaultProp);
    }

    const activeProperty = selectedProperty || summaryData?.address || {
      placeId: 'default_prop',
      formattedAddress: '1204 Oakridge Dr, Austin, TX 78701',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      county: 'Travis County',
      country: 'United States',
      lat: 30.2672,
      lon: -97.7431,
      propertyType: 'Single Family Residential',
      displayName: '1204 Oakridge Dr, Austin, TX 78701'
    };

    setIsLoading(true);

    try {
      // Best-effort only -- see optionalVerifiedUserId in server.ts. ReportGatingModal already
      // requires Clerk sign-in before this function can ever be reached, so a token is normally
      // available; a null here just means the audit row this call feeds (generated_reports, see
      // db.ts) is saved without an attributable user rather than the request being blocked.
      const authToken = await getToken().catch(() => null);
      const res = await fetch('/api/property/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          address: activeProperty.formattedAddress || activeProperty.displayName,
          city: activeProperty.city,
          state: activeProperty.state,
          zipCode: activeProperty.zipCode,
          county: activeProperty.county,
          propertyType: activeProperty.propertyType,
          declaredPropertyType: activeProperty.declaredPropertyType,
          unitNumber: activeProperty.unitNumber,
          yearBuilt: activeProperty.yearBuilt,
          usefulSourcesCount: summaryData?.usefulSourcesFound || 18,
          price: isPaid ? 14.99 : 0,
          // ReportGatingModal requires assent before onConfirmAndGenerate is ever called -- the
          // real "I agree" checkbox on the paid path, the click-to-generate passive notice on the
          // free path (see that file's own comment on why the free path deliberately has no
          // checkbox). By the time this fetch fires, that assent has already happened.
          attestedAccurate: true,
          userEmail: userEmail,
          isPaid: isPaid
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.report) {
          setReport(json.report);
          setCurrentStep('REPORT');
          if (json.report.id) {
            try {
              window.history.pushState({ reportId: json.report.id }, '', `/insights/${json.report.id}`);
            } catch (e) {
              console.warn('pushState not allowed or failed:', e);
            }
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      throw new Error(`Report API returned status ${res.status} or non-JSON payload`);
    } catch (err) {
      console.warn('Server report generation unavailable, utilizing client report generator:', err);
      const fallbackReport = createFallbackReport(activeProperty, summaryData);
      setReport(fallbackReport);
      setCurrentStep('REPORT');
      if (fallbackReport.id) {
        try {
          window.history.pushState({ reportId: fallbackReport.id }, '', `/insights/${fallbackReport.id}`);
        } catch (e) {}
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to Step 1
  const handleNewSearch = () => {
    setSelectedProperty(null);
    setSummaryData(null);
    setReport(null);
    setCurrentStep('HOME');
    setPseoRoute({ type: 'none' });
    try {
      sessionStorage.removeItem('beforeregret_session_state');
      sessionStorage.removeItem('beforeregret_map_draft');
      window.history.pushState({}, '', '/');
    } catch (e) {
      // Ignore if iframe location is restricted
    }
    // Instant, not smooth -- same reasoning as handleNavigate above: this can also land on HOME
    // from a much taller page (a report or guide article), and a smooth scroll risks getting
    // clamped mid-animation once React commits the shorter page.
    window.scrollTo(0, 0);
  };

  const activeSummaryData = summaryData || createFallbackSummary(selectedProperty);
  const activeReport = report || createFallbackReport(selectedProperty, activeSummaryData);

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col relative">
      <Navbar
        onNewSearch={handleNewSearch}
        currentStep={currentStep}
        selectedAddress={selectedProperty?.displayName || selectedProperty?.formattedAddress}
        onNavigate={handleNavigate}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md shadow-2xl space-y-4 flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center text-blue-400 animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Synthesizing Executive Report
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Checking live seismic hazard data and validating this address against U.S. Census records...
            </p>
          </div>
        </div>
      )}

      {/* One boundary around every route branch. Suspends only when a branch that actually uses a
          lazy chunk renders -- the eager landing pages (Hero, guide, county, legal) never trip it,
          so their prerendered HTML is never swapped for a spinner. */}
      <main className="flex-1">
       <Suspense fallback={<RouteChunkFallback />}>
        {currentStep === 'HOME' && (
          <Hero onSelectProperty={handleSelectProperty} onNavigate={handleNavigate} />
        )}

        {currentStep === 'RESEARCHING' && (
          selectedProperty ? (
            <ResearchProgressView
              property={selectedProperty}
              onComplete={handleResearchProgressComplete}
            />
          ) : (
            <Hero onSelectProperty={handleSelectProperty} onNavigate={handleNavigate} />
          )
        )}

        {currentStep === 'SUMMARY' && (
          <ResearchSummaryView
            summaryData={activeSummaryData}
            onGenerateReport={handleOpenGatingModal}
          />
        )}

        {currentStep === 'REPORT' && (
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleOpenGatingModal}>
            <PropertyReportView
              report={activeReport}
              onNewSearch={handleNewSearch}
            />
          </ErrorBoundary>
        )}

        {currentStep === 'PSEO' && (
          <>
            {pseoRoute.type === 'vendors' && (
              <Vendors onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'vendorsSuccess' && (
              <ZipAdsCheckoutSuccess onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'advertiseCompare' && (
              <AdvertiseCompare onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'guideAds' && (
              <GuideAdsCheckout onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'guideAdsSuccess' && (
              <GuideAdsCheckoutSuccess onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'myAds' && (
              <MyAdsPanel onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'admin' && (
              <AdminGate>
                <SeoAdminPanel onNavigate={handleNavigate} />
              </AdminGate>
            )}
            {pseoRoute.type === 'guidesIndex' && (
              <GuidesIndexView onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'guide' && pseoRoute.guideSlug && (
              <GuidePageView guideSlug={pseoRoute.guideSlug} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'about' && (
              <AboutMethodology onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'support' && (
              <ContactUs onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'terms' && (
              <TermsConditions onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'privacy' && (
              <PrivacyPolicy onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'refunds' && (
              <RefundPolicy onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'disclaimer' && (
              <Disclaimer onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'accessibility' && (
              <Accessibility onBackToHome={handleNewSearch} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'paymentSuccess' && (
              <PaymentSuccess />
            )}
            {pseoRoute.type === 'paymentCancelled' && (
              <PaymentCancelled />
            )}
            {pseoRoute.type === 'reportUnavailable' && (
              <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                {pseoRoute.reportFailure === 'unavailable' ? (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">We couldn't load this report</h1>
                    <p className="text-slate-600 mb-8">
                      Something went wrong on our side, not with your link. Please refresh in a moment
                      &mdash; if it keeps happening, email{' '}
                      <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>{' '}
                      with this link and we'll find your report.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">This report link isn't available</h1>
                    <p className="text-slate-600 mb-3">
                      We couldn't find a saved report for this link. Reports created before
                      21 August 2026 weren't stored, so their links no longer open.
                    </p>
                    <p className="text-slate-600 mb-8">
                      If you paid for this report, email{' '}
                      <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>{' '}
                      with the address you researched and we'll sort it out.
                    </p>
                  </>
                )}
                <button
                  onClick={() => handleNavigate('/')}
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Research an address
                </button>
              </div>
            )}
            {pseoRoute.type === 'notFound' && (
              <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">404 — Page Not Found</h1>
                <p className="text-slate-600 mb-8">
                  The page you're looking for doesn't exist or may have been moved.
                </p>
                <button
                  onClick={() => handleNavigate('/')}
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            )}
          </>
        )}
       </Suspense>
      </main>

      <Footer onNewSearch={handleNewSearch} onNavigate={handleNavigate} />

      {/* Its own boundary with a null fallback, not the shared spinner: this modal is closed on
          first paint, and its chunk is fetched the moment isOpen flips. A visible fallback here
          would flash a spinner over the page behind it for no reason. */}
      {isGatingModalOpen && (
        <Suspense fallback={null}>
          <ReportGatingModal
            isOpen={isGatingModalOpen}
            onClose={() => setIsGatingModalOpen(false)}
            targetAddress={selectedProperty?.formattedAddress || selectedProperty?.displayName || 'Selected Address'}
            onConfirmAndGenerate={handleConfirmAndGenerateReport}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
