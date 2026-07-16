import React from 'react';
import { Star, Clock, MessageSquare, ChevronRight, Eye } from 'lucide-react';
import { ExpertProfile, Neighborhood } from '../types';
import { ResidentAvatar } from './ResidentAvatar';

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
              const repliesInHours = expert.responseTime.toLowerCase().includes('1 hour') 
                ? '1h' 
                : expert.responseTime.toLowerCase().includes('2 hours') 
                  ? '2h' 
                  : expert.responseTime.toLowerCase().includes('3 hours') 
                    ? '3h' 
                    : '4h';

              return (
                <div
                  key={expert.id}
                  onClick={() => onSelectExpert(expert)}
                  className="bg-white border border-slate-200 hover:border-blue-600 rounded-xl p-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Header: Avatar, Location info */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <ResidentAvatar name={expert.fullName} className="w-11 h-11" />
                        {expert.stillLivesThere !== false && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-tight truncate">
                          {expert.fullName.split(' ')[0]}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-bold truncate leading-tight mt-0.5">
                          {expert.localityName.split(',')[0]} • {expert.city}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                          Living here since {new Date().getFullYear() - (expert.yearsLivingThere || 5)}
                        </p>
                      </div>
                    </div>

                    {/* Primary Value Proposition: Ask me about tags */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100/60">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Ask me about</span>
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-slate-600 font-semibold">
                        {expert.expertiseTags.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-blue-500/80"></span>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Trust Signals Block */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100/60 space-y-1.5">
                      {/* Live Status Badge */}
                      {expert.stillLivesThere !== false && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/40 px-1.5 py-0.5 rounded-md w-fit">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span>Current Resident</span>
                        </div>
                      )}

                      {/* Compact parameters list */}
                      <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500 font-semibold">
                        <span className="text-slate-800 font-bold flex items-center gap-0.5">⭐ {expert.rating}</span>
                        <span className="text-slate-300 font-normal">•</span>
                        <span>{expert.questionsAnsweredCount} Answers</span>
                        <span className="text-slate-300 font-normal">•</span>
                        <span>Lives Here {expert.yearsLivingThere} Years</span>
                        <span className="text-slate-300 font-normal">•</span>
                        <span>Replies in {repliesInHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action CTA */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Starts at</p>
                      <p className="font-extrabold text-slate-900 font-mono text-sm mt-0.5 leading-none">
                        ₹{expert.pricingPerQuery}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectExpert(expert);
                      }}
                      className="px-3 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Ask Before You Decide</span>
                      <span className="text-xs font-bold">→</span>
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
