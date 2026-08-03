import React, { useEffect } from 'react';
import { ZIP_PSEO_DATASET, VALIDATED_MARKETS } from '../../data/seoDataset';
import { evaluateZipUniqueness } from '../../utils/seoUniquenessEvaluator';
import { applyHeadSeo } from '../../utils/headSeo';
import { MapPin, ChevronRight, Layers, ArrowRight, ShieldCheck, Building, AlertTriangle } from 'lucide-react';

interface CityHubViewProps {
  stateSlug: string;
  citySlug: string;
  onNavigate: (path: string) => void;
}

export const CityHubView: React.FC<CityHubViewProps> = ({
  stateSlug,
  citySlug,
  onNavigate
}) => {
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const stateName = stateSlug === 'texas' ? 'Texas' : stateSlug.toUpperCase();

  const cityZips = Object.values(ZIP_PSEO_DATASET).filter(
    z => z.city.toLowerCase() === citySlug.toLowerCase()
  );

  // Re-run the real uniqueness gate live rather than trusting the dataset's
  // static uniquenessScore/isDataSparse fields, so a stale or hand-edited
  // score can never bypass the Stage 2 threshold.
  const publishedZips = cityZips.filter(z => !z.isDataSparse && evaluateZipUniqueness(z).passed);
  const heldBackZips = cityZips.filter(z => z.isDataSparse || !evaluateZipUniqueness(z).passed);

  // Market-scope gate: a city hub is only indexable once its market has
  // completed validation, independent of whether any individual zip inside
  // it happens to pass the uniqueness gate.
  const marketInfo = VALIDATED_MARKETS.find(
    m => m.city.toLowerCase() === citySlug.toLowerCase() && m.state === stateSlug.toLowerCase()
  );
  const isMarketValidated = marketInfo?.isValidated ?? false;

  const canonicalUrl = `https://beforeregret.com/state/${stateSlug}/${citySlug}/`;

  useEffect(() => {
    applyHeadSeo({
      title: `${cityName}, ${stateName} Property Hazard & Zip Code Research Hub | BeforeRegret`,
      description: `Comprehensive real estate hazard intelligence directory for ${cityName}, ${stateName}. Access zip-level flood zones, radon readings, building permits, and gigabit fiber availability.`,
      canonicalUrl,
      robotsDirective: isMarketValidated ? 'index, follow' : 'noindex, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'Place',
          'name': `${cityName}, ${stateName}`,
          'description': `Property research and hazard directory for ${cityName}, ${stateName}.`
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': stateName, 'item': `https://beforeregret.com/state/${stateSlug}/` },
            { '@type': 'ListItem', 'position': 3, 'name': `${cityName} Hub`, 'item': canonicalUrl }
          ]
        }
      ]
    });
  }, [cityName, stateName, canonicalUrl, stateSlug, isMarketValidated]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/`)} className="capitalize hover:text-blue-600">{stateName}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{cityName} Hub</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white font-mono text-xs font-bold rounded-lg">
              CITY HUB
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
              {cityName}, {stateName}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">
            {cityName}, {stateName} Neighborhood & Zip Code Research Hub
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Aggregate snapshot of postal jurisdictions across {cityName}. Select a zip code below to view granular parcel hazard layers, flood zones, and municipal permit histories.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Overview Prose Section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Understanding Property Risk & Local Micro-Climates in {cityName}, {stateName}
          </h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
            <p>
              Evaluating real estate in {cityName} requires analyzing hyper-local environmental hazards, municipal permit enforcement trends, and utility infrastructure that vary dramatically from one zip code to the next. Because municipal boundaries encompass diverse terrain—ranging from low-lying alluvial floodplains to rocky limestone ridges—blanket generalizations about {cityName} real estate often obscure critical parcel-level liabilities.
            </p>
            <p>
              Our automated research engine continuously ingests public data feeds from the Federal Emergency Management Agency (FEMA), municipal building permit registries, the U.S. Geological Survey (USGS), and the Federal Communications Commission (FCC). Below is our index of zip codes within {cityName}, each backed by 800+ words of granular explanatory prose and traceable source evidence.
            </p>
          </div>
        </section>
        
        {/* Zip Code Hubs Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Zip Code Layers for {cityName} ({publishedZips.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedZips.map(z => (
              <div 
                key={z.zipCode}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-all shadow-sm flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-mono text-xs font-extrabold rounded-lg">
                      ZIP {z.zipCode}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Public Dataset
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {z.neighborhoodName}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 font-medium">
                    <div>FEMA Flood: <strong>{z.floodZone}</strong></div>
                    <div>Permit Activity: <strong>{z.recentPermitsCount12mo} permits ({z.permitActivityLevel})</strong></div>
                    <div>Fiber Internet: <strong>{z.fiberCoveragePercent}% Coverage</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${z.zipCode}/`)}
                  className="w-full py-2 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <span>Explore {z.zipCode} Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Zips Notice */}
        {heldBackZips.length > 0 && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span>Additional Postal Codes Under Verification ({heldBackZips.length} Area ZIPs)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The following postal codes in {cityName} are currently undergoing active dataset cross-referencing against municipal permit archives and environmental mapping layers prior to publication:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {heldBackZips.map(hz => (
                <span key={hz.zipCode} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-mono text-xs rounded-lg">
                  ZIP {hz.zipCode} ({hz.neighborhoodName}) — Integration Pending
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
