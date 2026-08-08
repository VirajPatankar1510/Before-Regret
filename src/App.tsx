import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ResearchProgressView } from './components/ResearchProgressView';
import { ResearchSummaryView } from './components/ResearchSummaryView';
import { PropertyReportView } from './components/PropertyReportView';
import { Vendors } from './components/Vendors';
import { ReportGatingModal } from './components/ReportGatingModal';
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

// pSEO Components -- the fabricated-stats ZIP/city/state/topic/compare surface (36 live URLs)
// was fully removed; only the hand-written editorial guides remain.
import { GuidePageView } from './components/seo/GuidePageView';
import { CountyPageView } from './components/seo/CountyPageView';
import { SeoAdminPanel } from './components/seo/SeoAdminPanel';
import { AdminGate } from './components/admin/AdminGate';
import { applyHeadSeo } from './utils/headSeo';

// Legal & Policy Components
import { ContactUs } from './components/ContactUs';
import { TermsConditions } from './components/TermsConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { RefundPolicy } from './components/RefundPolicy';

// Payment Components
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentCancelled } from './components/PaymentCancelled';

export function App() {
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
    type: 'admin' | 'guide' | 'county' | 'support' | 'terms' | 'privacy' | 'refunds' | 'vendors' | 'paymentSuccess' | 'paymentCancelled' | 'notFound' | 'none';
    guideSlug?: string;
    countySlug?: string;
  }>({ type: 'none' });

  // Function to resolve current URL path to route
  const resolveRouteFromPath = (pathname: string) => {
    // Normalize path trailing slash
    const path = pathname.endsWith('/') ? pathname : `${pathname}/`;

    if (path === '/vendors/' || path.startsWith('/vendors') || path.startsWith('/advertise')) {
      if (path.startsWith('/advertise')) {
        try {
          window.history.replaceState({}, '', '/vendors');
        } catch (e) {}
      }
      setPseoRoute({ type: 'vendors' });
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
    }

    if (path.startsWith('/county/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        setPseoRoute({ type: 'county', countySlug: parts[1] });
        setCurrentStep('PSEO');
        return true;
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check URL on mount for standalone report permalinks & pSEO routes
  useEffect(() => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // Try resolving pSEO route first
    if (resolveRouteFromPath(pathname)) {
      return;
    }

    // No pSEO route matched -- if we're sitting at the root path, make sure we actually land on
    // the homepage rather than a stale non-HOME step restored from a prior page's sessionStorage
    // (e.g. the user was on /vendors, then hard-navigated straight to the bare domain).
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
      setIsLoading(true);
      fetch(`/api/insights/${reportIdFromUrl}`)
        .then((res) => {
          if (!res.ok) {
            return fetch(`/api/report/${reportIdFromUrl}`);
          }
          return res;
        })
        .then((res) => {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            return res.json();
          }
          throw new Error('Non-JSON response from report permalink');
        })
        .then((data) => {
          if (data && data.success && data.report) {
            setReport(data.report);
            setCurrentStep('REPORT');
          } else {
            throw new Error('Invalid report payload');
          }
        })
        .catch((err) => {
          console.warn('Could not load report from API permalink, generating viewable report:', err);
          const fallback = createFallbackReport(null, null);
          setReport(fallback);
          setCurrentStep('REPORT');
        })
        .finally(() => setIsLoading(false));
    } else if (!isRoot) {
      // No pSEO route matched, not the homepage, and no report permalink found here -- this is a
      // genuinely unrecognized URL. Render an honest 404 instead of silently falling back to the
      // homepage (a "soft 404" that used to leave dead/removed URLs indexable under `index, follow`).
      setPseoRoute({ type: 'notFound' });
      setCurrentStep('PSEO');
    }

    // Handle browser popstate
    const handlePopState = () => {
      const popPathname = window.location.pathname;
      if (!resolveRouteFromPath(popPathname)) {
        if (popPathname === '/') {
          setCurrentStep('HOME');
          setPseoRoute({ type: 'none' });
        } else if (!popPathname.startsWith('/insights/') && !popPathname.startsWith('/report/')) {
          setPseoRoute({ type: 'notFound' });
          setCurrentStep('PSEO');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set SEO metadata for top-level non-pSEO routes (Homepage, Support, Legal, Report, Admin)
  useEffect(() => {
    if (currentStep === 'HOME' && pseoRoute.type === 'none') {
      applyHeadSeo({
        title: 'BeforeRegret — Property Research from 20+ Public Records',
        description: 'Free, address-based public record synthesis for US homebuyers and renters. Uncover FEMA flood zones, municipal permits, radon levels, noise, and broadband.',
        canonicalUrl: 'https://www.beforeregret.com/',
        robotsDirective: 'index, follow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'Before Regret',
            'url': 'https://www.beforeregret.com',
            'logo': 'https://www.beforeregret.com/favicon.svg',
            'parentOrganization': {
              '@type': 'Organization',
              'name': 'Atmostellar'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'BeforeRegret',
            'url': 'https://www.beforeregret.com',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': 'https://www.beforeregret.com/?address={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
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
    } else if (pseoRoute.type === 'vendors') {
      applyHeadSeo({
        title: 'Local Business Placements | BeforeRegret',
        description: 'Vendor marketplace for home inspectors, contractors, and specialists to reach property buyers.',
        canonicalUrl: 'https://www.beforeregret.com/vendors/',
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
      const res = await fetch('/api/property/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSummaryData = summaryData || createFallbackSummary(selectedProperty);
  const activeReport = report || createFallbackReport(selectedProperty, activeSummaryData);

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col antialiased relative">
      <Navbar
        onNewSearch={handleNewSearch}
        currentStep={currentStep}
        selectedAddress={selectedProperty?.displayName || selectedProperty?.formattedAddress}
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

      <main className="flex-1">
        {currentStep === 'HOME' && (
          <Hero onSelectProperty={handleSelectProperty} />
        )}

        {currentStep === 'RESEARCHING' && (
          selectedProperty ? (
            <ResearchProgressView
              property={selectedProperty}
              onComplete={handleResearchProgressComplete}
            />
          ) : (
            <Hero onSelectProperty={handleSelectProperty} />
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
            {pseoRoute.type === 'admin' && (
              <AdminGate>
                <SeoAdminPanel onNavigate={handleNavigate} />
              </AdminGate>
            )}
            {pseoRoute.type === 'guide' && pseoRoute.guideSlug && (
              <GuidePageView guideSlug={pseoRoute.guideSlug} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'county' && pseoRoute.countySlug && (
              <CountyPageView countySlug={pseoRoute.countySlug} onNavigate={handleNavigate} />
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
            {pseoRoute.type === 'paymentSuccess' && (
              <PaymentSuccess />
            )}
            {pseoRoute.type === 'paymentCancelled' && (
              <PaymentCancelled />
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
      </main>

      <Footer onNewSearch={handleNewSearch} onNavigate={handleNavigate} />

      <ReportGatingModal
        isOpen={isGatingModalOpen}
        onClose={() => setIsGatingModalOpen(false)}
        targetAddress={selectedProperty?.formattedAddress || selectedProperty?.displayName || 'Selected Address'}
        onConfirmAndGenerate={handleConfirmAndGenerateReport}
      />
    </div>
  );
}

export default App;
