import React from 'react';
import { Star, Clock, MessageSquare, ChevronRight, Eye } from 'lucide-react';
import { ExpertProfile, Neighborhood } from '../types';

interface FeaturedResidentsProps {
  experts: ExpertProfile[];
  localities: Neighborhood[];
  onSelectExpert: (expert: ExpertProfile) => void;
}

export const FeaturedResidents: React.FC<FeaturedResidentsProps> = ({
  experts,
  onSelectExpert,
}) => {
  return (
    <section className="bg-white py-16 sm:py-20 font-sans border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              Featured Resident Experts
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-xl">
              Browse resident experts in housing societies and apartments across Mumbai, Bengaluru, and Gurugram.
            </p>
          </div>
        </div>

        {/* Experts Grid */}
        {experts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experts.map((expert) => {
              // Convert standard image urls to simple avatars to guarantee we don't display photos
              const avatarId = expert.fullName.charAt(0);
              const fallbackAvatarSeed = `https://api.dicebear.com/9.x/adventurer/svg?seed=${expert.fullName}&backgroundColor=b6e3f4`;

              return (
                <div
                  key={expert.id}
                  onClick={() => onSelectExpert(expert)}
                  className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Header: Avatar, Location info */}
                    <div className="flex items-start gap-3.5 mb-4">
                      {/* Strictly No Profile Photo - Illustrated Avatar Only */}
                      <div className="relative shrink-0">
                        <img
                          src={fallbackAvatarSeed}
                          alt={expert.fullName}
                          className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-200 p-0.5"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {expert.fullName.split(' ')[0]}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                          {expert.localityName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {expert.city}
                        </p>
                      </div>
                    </div>

                    {/* Quick bio snippet */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {expert.bio}
                    </p>

                    {/* Key Attributes List */}
                    <div className="space-y-1.5 border-t border-b border-slate-200/40 py-3 mb-4 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">Residency:</span>
                        <span className="font-bold text-slate-700">
                          {expert.stillLivesThere !== false ? 'since' : 'for'} {expert.yearsLivingThere === 0 ? 'less than a year' : expert.yearsLivingThere >= 50 ? '50+ years' : `${expert.yearsLivingThere} years`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">Current Status:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded-md text-[9px] ${
                          expert.stillLivesThere !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {expert.stillLivesThere !== false ? '🟢 Currently Lives Here' : '⚪ Former Resident'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">Response Rate:</span>
                        <span className="font-bold text-emerald-600 font-mono">{expert.responseRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">Usually Replies:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {expert.responseTime.replace('Replies within ', '')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action CTA */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold text-xs sm:text-sm">★</span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">{expert.rating}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({expert.questionsAnsweredCount} answered)
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Starting At</p>
                        <p className="font-black text-slate-900 font-mono text-sm leading-none">
                          Rs. {expert.pricingPerQuery}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectExpert(expert);
                      }}
                      className="w-full bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Ask {expert.fullName.split(' ')[0]}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center max-w-xl mx-auto">
            <p className="text-sm font-semibold text-slate-600">No resident experts found.</p>
          </div>
        )}

      </div>
    </section>
  );
};
