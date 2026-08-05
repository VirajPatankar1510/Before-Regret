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
      title: 'Flood Zone',
      publicFinding: 'Is this address inside a mapped federal flood hazard area?',
      source: 'FEMA Flood Map Service Center (MSC)'
    },
    {
      icon: FileCheck,
      title: 'Permit History',
      publicFinding: 'Was that finished basement or garage conversion ever inspected?',
      source: 'Municipal & County Building Department Archives'
    },
    {
      icon: Plane,
      title: 'Airport Noise',
      publicFinding: 'Does this street sit under an active flight arrival corridor?',
      source: 'FAA Noise Compatibility Maps & Flight Corridors'
    },
    {
      icon: ShieldAlert,
      title: 'Radon Zone',
      publicFinding: "What's the EPA-classified radon baseline for this zip code?",
      source: 'EPA Indoor Radon Zones & Geological Maps'
    },
    {
      icon: Radio,
      title: 'Broadband',
      publicFinding: 'Is fiber service confirmed at this specific address or just nearby?',
      source: 'FCC National Broadband Fabric Registry'
    },
    {
      icon: Building,
      title: 'Development Pipeline',
      publicFinding: 'Is there a rezoning petition filed within half a mile?',
      source: 'Municipal Planning & Zoning Filings'
    }
  ];

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            What a Listing Won't Tell You
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Real estate portals show seller marketing photos and agent copy. BeforeRegret checks the physical, legal, and environmental record instead.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-800" />
                  </div>
                  <h3 className="font-sans text-lg font-bold text-slate-900 leading-snug">
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
