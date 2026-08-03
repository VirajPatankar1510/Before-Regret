import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ResearchProgressView } from './components/ResearchProgressView';
import { ResearchSummaryView } from './components/ResearchSummaryView';
import { PropertyReportView } from './components/PropertyReportView';
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

// pSEO Components
import { ZipHubView } from './components/seo/ZipHubView';
import { TopicDeepPageView } from './components/seo/TopicDeepPageView';
import { CityHubView } from './components/seo/CityHubView';
import { StateHubView } from './components/seo/StateHubView';
import { GuidePageView } from './components/seo/GuidePageView';
import { ZipComparePageView } from './components/seo/ZipComparePageView';
import { SeoAdminPanel } from './components/seo/SeoAdminPanel';
import { TopicSlug } from './types/seoTypes';
import { applyHeadSeo } from './utils/headSeo';

// Legal & Policy Components
import { ContactUs } from './components/ContactUs';
import { TermsConditions } from './components/TermsConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { RefundPolicy } from './components/RefundPolicy';

export function App() {
  const [currentStep, setCurrentStep] = useState<'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT' | 'PSEO'>('HOME');
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);
  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(null);
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active PSEO / Legal Route State
  const [pseoRoute, setPseoRoute] = useState<{
    type: 'admin' | 'state' | 'city' | 'zip' | 'topic' | 'guide' | 'compare' | 'support' | 'terms' | 'privacy' | 'refunds' | 'none';
    stateSlug?: string;
    citySlug?: string;
    zipCode?: string;
    topicSlug?: TopicSlug;
    guideSlug?: string;
    compareSlug?: string;
  }>({ type: 'none' });

  // Function to resolve current URL path to route
  const resolveRouteFromPath = (pathname: string) => {
    // Normalize path trailing slash
    const path = pathname.endsWith('/') ? pathname : `${pathname}/`;

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

    if (path.startsWith('/compare/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        setPseoRoute({ type: 'compare', compareSlug: parts[1] });
        setCurrentStep('PSEO');
        return true;
      }
    }

    if (path.startsWith('/state/')) {
      const parts = path.split('/').filter(Boolean); // ['state', 'texas', 'austin', '78701', 'flood-risk']
      if (parts.length === 2) {
        // /state/{state}/
        setPseoRoute({ type: 'state', stateSlug: parts[1] });
        setCurrentStep('PSEO');
        return true;
      }
      if (parts.length === 3) {
        // /state/{state}/{city}/
        setPseoRoute({ type: 'city', stateSlug: parts[1], citySlug: parts[2] });
        setCurrentStep('PSEO');
        return true;
      }
      if (parts.length === 4) {
        // /state/{state}/{city}/{zip}/
        setPseoRoute({ type: 'zip', stateSlug: parts[1], citySlug: parts[2], zipCode: parts[3] });
        setCurrentStep('PSEO');
        return true;
      }
      if (parts.length >= 5) {
        // /state/{state}/{city}/{zip}/{topic}/
        setPseoRoute({ 
          type: 'topic', 
          stateSlug: parts[1], 
          citySlug: parts[2], 
          zipCode: parts[3], 
          topicSlug: parts[4] as TopicSlug 
        });
        setCurrentStep('PSEO');
        return true;
      }
    }

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

    let reportIdFromUrl: string | null = null;

    if (pathname.startsWith('/report/')) {
      reportIdFromUrl = pathname.replace('/report/', '').trim();
    } else if (searchParams.get('reportId')) {
      reportIdFromUrl = searchParams.get('reportId');
    }

    if (reportIdFromUrl && reportIdFromUrl.length > 0) {
      setIsLoading(true);
      fetch(`/api/report/${reportIdFromUrl}`)
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
    }

    // Handle browser popstate
    const handlePopState = () => {
      if (!resolveRouteFromPath(window.location.pathname)) {
        if (window.location.pathname === '/') {
          setCurrentStep('HOME');
          setPseoRoute({ type: 'none' });
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
        canonicalUrl: 'https://beforeregret.com/',
        robotsDirective: 'index, follow',
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'Before Regret',
            'url': 'https://beforeregret.com',
            'logo': 'https://beforeregret.com/favicon.svg',
            'parentOrganization': {
              '@type': 'Organization',
              'name': 'Atmostellar'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'BeforeRegret',
            'url': 'https://beforeregret.com',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': 'https://beforeregret.com/?address={search_term_string}'
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
        canonicalUrl: 'https://beforeregret.com/support/',
        robotsDirective: 'index, follow',
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
                  'text': 'BeforeRegret synthesizes records directly from 25+ government portals including FEMA, EPA, USGS, USDA, U.S. DOT, FCC, and local municipal building departments.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Are reports one-time flat fee or subscription based?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'All BeforeRegret executive property research reports are backed by a one-time flat fee ($19 to $29 depending on data coverage) with lifetime access.'
                }
              }
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Support & FAQ', 'item': 'https://beforeregret.com/support/' }
            ]
          }
        ]
      });
    } else if (pseoRoute.type === 'terms') {
      applyHeadSeo({
        title: 'Terms of Service | BeforeRegret Property Intelligence',
        description: 'Terms of service and user agreement for BeforeRegret public record property research and automated synthesis tools.',
        canonicalUrl: 'https://beforeregret.com/terms/',
        robotsDirective: 'index, follow'
      });
    } else if (pseoRoute.type === 'privacy') {
      applyHeadSeo({
        title: 'Privacy Policy | BeforeRegret Property Intelligence',
        description: 'Privacy policy detailing data handling, user anonymity, and secure public record lookup protocols at BeforeRegret.',
        canonicalUrl: 'https://beforeregret.com/privacy/',
        robotsDirective: 'index, follow'
      });
    } else if (pseoRoute.type === 'refunds') {
      applyHeadSeo({
        title: 'Refund Policy & Satisfaction Guarantee | BeforeRegret',
        description: 'BeforeRegret refund policy and customer support commitments for property research report orders.',
        canonicalUrl: 'https://beforeregret.com/refunds/',
        robotsDirective: 'index, follow'
      });
    } else if (currentStep === 'REPORT') {
      applyHeadSeo({
        title: `Property Research Report | ${report?.propertyInfo?.address || 'Subject Property'}`,
        description: 'Private, verified multi-hazard public record research synthesis for subject property.',
        canonicalUrl: `https://beforeregret.com/report/${report?.id || 'private'}`,
        robotsDirective: 'noindex, nofollow'
      });
    } else if (pseoRoute.type === 'admin') {
      applyHeadSeo({
        title: 'PSEO Operations & Indexing Control Panel | BeforeRegret',
        description: 'Internal administration interface for pSEO dataset management, indexation monitoring, and Search Console integration.',
        canonicalUrl: 'https://beforeregret.com/admin/seo',
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

  // Step 3 -> Step 4: Generate Full Report
  const handleGenerateReport = async () => {
    if (!selectedProperty && !summaryData?.address) {
      // Create default property if none selected
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
          usefulSourcesCount: summaryData?.usefulSourcesFound || 18,
          price: summaryData?.price || 29
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
              window.history.pushState({ reportId: json.report.id }, '', `/report/${json.report.id}`);
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
    try {
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
              Cross-referencing 25+ government, environmental, and public record databases...
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
            onGenerateReport={handleGenerateReport}
          />
        )}

        {currentStep === 'REPORT' && (
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleGenerateReport}>
            <PropertyReportView
              report={activeReport}
              onNewSearch={handleNewSearch}
            />
          </ErrorBoundary>
        )}

        {currentStep === 'PSEO' && (
          <>
            {pseoRoute.type === 'admin' && (
              <SeoAdminPanel onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'state' && pseoRoute.stateSlug && (
              <StateHubView stateSlug={pseoRoute.stateSlug} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'city' && pseoRoute.stateSlug && pseoRoute.citySlug && (
              <CityHubView stateSlug={pseoRoute.stateSlug} citySlug={pseoRoute.citySlug} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'zip' && pseoRoute.stateSlug && pseoRoute.citySlug && pseoRoute.zipCode && (
              <ZipHubView 
                stateSlug={pseoRoute.stateSlug} 
                citySlug={pseoRoute.citySlug} 
                zipCode={pseoRoute.zipCode} 
                onNavigate={handleNavigate} 
              />
            )}
            {pseoRoute.type === 'topic' && pseoRoute.stateSlug && pseoRoute.citySlug && pseoRoute.zipCode && pseoRoute.topicSlug && (
              <TopicDeepPageView 
                stateSlug={pseoRoute.stateSlug} 
                citySlug={pseoRoute.citySlug} 
                zipCode={pseoRoute.zipCode} 
                topicSlug={pseoRoute.topicSlug} 
                onNavigate={handleNavigate} 
              />
            )}
            {pseoRoute.type === 'guide' && pseoRoute.guideSlug && (
              <GuidePageView guideSlug={pseoRoute.guideSlug} onNavigate={handleNavigate} />
            )}
            {pseoRoute.type === 'compare' && pseoRoute.compareSlug && (
              <ZipComparePageView slug={pseoRoute.compareSlug} onNavigate={handleNavigate} />
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
          </>
        )}
      </main>

      <Footer onNewSearch={handleNewSearch} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
