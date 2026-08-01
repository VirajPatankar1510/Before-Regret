import React from 'react';
import { 
  Waves, 
  Plane, 
  FileCheck, 
  Radio, 
  Building, 
  ShieldAlert
} from 'lucide-react';

export const ListingOmissionsSection: React.FC = () => {
  const categories = [
    {
      icon: Waves,
      title: 'FEMA Flood Zone & Watershed Overlay',
      publicFinding: 'Properties situated in 100-year flood zones or subject to recent FEMA flood map revisions require mandatory flood insurance ($2,000–$5,000+/yr), which rarely appears on listing sheets.',
      source: 'FEMA Flood Map Service Center (MSC) & NFIP Rate Archives'
    },
    {
      icon: Plane,
      title: 'FAA Flight Path & Airport Noise Contours',
      publicFinding: 'FAA 65+ DNL noise contour lines and low-altitude arrival tracks directly impact acoustic peace and long-term resale liquidity, yet are never mentioned in broker marketing.',
      source: 'Federal Aviation Administration (FAA) Noise Compatibility Maps'
    },
    {
      icon: FileCheck,
      title: 'Municipal Permit Archives & Unpermitted Additions',
      publicFinding: 'Missing building department permits for major roof replacements, room additions, or electrical panel work expose buyers to uninsurable hazards or forced municipal remediation.',
      source: 'Municipal & County Building Permit Registries'
    },
    {
      icon: ShieldAlert,
      title: 'EPA Environmental Proximity & Superfund Buffers',
      publicFinding: 'Active EPA Superfund NPL boundaries, Toxic Release Inventory (TRI) facilities, or underground fuel storage tank leaks within 1.5 miles of parcel boundaries.',
      source: 'EPA Envirofacts & USGS Geological Soil Hazard Maps'
    },
    {
      icon: Radio,
      title: 'FCC Broadband Infrastructure Reality',
      publicFinding: 'Listing claims of "high-speed internet" often mask legacy copper or fixed-wireless limits. Official FCC fabric maps disclose true fiber-to-the-home ISP options.',
      source: 'Federal Communications Commission (FCC) National Broadband Map'
    },
    {
      icon: Building,
      title: 'Zoning & Municipal Development Pipeline',
      publicFinding: 'City planning commission filings for upcoming multi-lane highway expansions, commercial re-zoning proposals, or high-density residential developments adjacent to the neighborhood.',
      source: 'County Land Records & State Dept of Transportation (DOT) STIP Pipelines'
    }
  ];

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 tracking-tight">
            What a Listing Won't Tell You
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Real estate portals display seller marketing photos and agent copy. BeforeRegret cross-references official public record archives to uncover the physical, legal, and environmental realities of the parcel.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 shrink-0">
                    <Icon className="w-5 h-5 text-slate-800" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {cat.publicFinding}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Public Source: {cat.source}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
