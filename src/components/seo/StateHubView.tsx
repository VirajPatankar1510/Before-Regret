import React, { useEffect } from 'react';
import { VALIDATED_MARKETS } from '../../data/seoDataset';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, MapPin, Building, ArrowRight } from 'lucide-react';

interface StateHubViewProps {
  stateSlug: string;
  onNavigate: (path: string) => void;
}

export const StateHubView: React.FC<StateHubViewProps> = ({ stateSlug, onNavigate }) => {
  const stateName = stateSlug === 'texas' ? 'Texas' : stateSlug.toUpperCase();
  const stateMarkets = VALIDATED_MARKETS.filter(m => m.state === stateSlug.toLowerCase());

  const canonicalUrl = `https://beforeregret.com/state/${stateSlug}/`;

  useEffect(() => {
    applyHeadSeo({
      title: `${stateName} Real Estate Hazard & Property Intelligence Hub | BeforeRegret`,
      description: `Statewide property research directory for ${stateName}. Access city and zip-level hazard snapshots, FEMA flood zone maps, and building permit registries.`,
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': `${stateName} Hub`, 'item': canonicalUrl }
          ]
        }
      ]
    });
  }, [stateName, canonicalUrl]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold capitalize">{stateName} Hub</span>
        </div>
      </div>

      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="inline-block px-2.5 py-1 bg-blue-600 text-white font-mono text-xs font-bold rounded-lg">
            STATE HUB
          </div>
          <h1 className="text-3xl font-extrabold">{stateName} Municipal Property Hazard Directory</h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Select a municipality below to browse zip-code hazard snapshots, flood risk profiles, and building permit datasets.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* State Overview Prose */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Statewide Environmental & Municipal Property Risk Infrastructure in {stateName}
          </h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
            <p>
              Navigating real estate due diligence in {stateName} requires an understanding of distinct state-level regulatory frameworks, watershed divisions, and municipal reporting standards. Environmental hazards—such as expansive soil conditions, coastal and riverine flood basins, and varying local building code adoption—mandate a data-driven approach prior to making property acquisition decisions.
            </p>
            <p>
              BeforeRegret aggregates multi-jurisdictional spatial data to provide home buyers and tenants with unvarnished, objective intelligence. Select a validated municipal market below to explore city-wide directories and individual postal code hazard profiles.
            </p>
          </div>
        </section>

        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pt-2">
          <Building className="w-5 h-5 text-blue-600" />
          <span>Validated Municipal Markets in {stateName}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stateMarkets.map(m => (
            <div 
              key={m.city}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 transition-all shadow-sm space-y-3 group cursor-pointer"
              onClick={() => onNavigate(`/state/${stateSlug}/${m.city}/`)}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-slate-900 group-hover:text-blue-600">
                  {m.cityName}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  m.phase === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Phase {m.phase} Market
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official municipal permit feeds, FEMA layers, and broadband infrastructure active.
              </p>
              <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <span>Browse {m.cityName} Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
