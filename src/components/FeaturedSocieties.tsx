import React from 'react';
import { Society } from '../types';
import { ArrowRight, Building2, MapPin, Users, BookOpen, Clock } from 'lucide-react';

interface FeaturedSocietiesProps {
  societies: Society[];
  onSelectSociety: (society: Society) => void;
}

export const FeaturedSocieties: React.FC<FeaturedSocietiesProps> = ({
  societies,
  onSelectSociety,
}) => {
  return (
    <section id="browse-societies" className="py-16 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Browse Societies
            </h2>
            <p className="text-sm text-slate-500 font-normal">
              Explore active resident knowledge profiles across top residential hubs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {societies.map((society) => (
            <div
              key={society.id}
              onClick={() => onSelectSociety(society)}
              className="group bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Minimal Building Illustration Banner */}
                <div className="h-32 w-full bg-slate-900/95 relative overflow-hidden flex items-center justify-center p-6 text-white group-hover:bg-slate-900 transition-colors">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-blue-400 group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
                        {society.locality}
                      </div>
                      <div className="text-sm font-bold text-slate-200">
                        {society.city}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors tracking-tight">
                      {society.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{society.locality}, {society.city}</span>
                    </div>
                  </div>

                  {/* Cards Key Metrics Required by Prompt */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <div className="bg-[#F7F9FC] p-2.5 rounded-xl text-center border border-[#E4E4E7]/60">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Profiles</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {society.residentProfilesCount}
                      </div>
                    </div>

                    <div className="bg-[#F7F9FC] p-2.5 rounded-xl text-center border border-[#E4E4E7]/60">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Topics</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {society.totalTopicsAvailable}
                      </div>
                    </div>

                    <div className="bg-[#F7F9FC] p-2.5 rounded-xl text-center border border-[#E4E4E7]/60">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Updated</div>
                      <div className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                        {society.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2563EB] group-hover:bg-blue-50/50 transition-colors">
                <span>View Resident Profiles</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
