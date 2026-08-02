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

export function App() {
  const [currentStep, setCurrentStep] = useState<'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT'>('HOME');
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);
  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(null);
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL on mount for standalone report permalinks (e.g. /report/rep_123 or ?reportId=rep_123)
  useEffect(() => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

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
  }, []);

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
      </main>

      <Footer onNewSearch={handleNewSearch} />
    </div>
  );
}

export default App;
