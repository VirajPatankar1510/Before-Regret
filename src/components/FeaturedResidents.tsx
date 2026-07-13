import React, { useState } from 'react';
import { Star, Clock, MessageSquare, ChevronRight, Filter, Eye } from 'lucide-react';
import { ExpertProfile, Neighborhood } from '../types';

interface FeaturedResidentsProps {
  experts: ExpertProfile[];
  localities: Neighborhood[];
  onSelectExpert: (expert: ExpertProfile) => void;
  selectedLocality: Neighborhood | null;
  onClearLocalityFilter: () => void;
}

export const FeaturedResidents: React.FC<FeaturedResidentsProps> = ({
  experts,
  localities,
  onSelectExpert,
  selectedLocality,
  onClearLocalityFilter,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'experience' | 'rating' | 'response'>('all');

  // Filter experts based on selected locality (if any) and active filter type
  const filteredExperts = experts.filter((exp) => {
    // Locality Filter
    if (selectedLocality && exp.localityId !== selectedLocality.id) {
      return false;
    }

    // Interactive Filter Option
    if (filterType === 'experience') {
      return exp.yearsLivingThere >= 8;
    }
    if (filterType === 'rating') {
      return exp.rating >= 4.8;
    }
    if (filterType === 'response') {
      return exp.responseRate >= 98;
    }

    return true;
  });

  return (
    <section className="bg-white py-16 sm:py-20 font-sans border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              {selectedLocality 
                ? `Local Experts in ${selectedLocality.name}` 
                : 'Featured Resident Experts'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-xl">
              {selectedLocality 
                ? `Talk directly to residents living in ${selectedLocality.name}, ${selectedLocality.city} who know the key facts.`
                : 'Browse resident experts in housing societies and apartments across Mumbai, Bengaluru, and Gurugram.'}
            </p>
          </div>

          {/* Active Filter Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter:</span>
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Residents
              </button>
              <button
                onClick={() => setFilterType('experience')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filterType === 'experience'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Residing 8+ Years"
              >
                Living 8+ Years
              </button>
              <button
                onClick={() => setFilterType('rating')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filterType === 'rating'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Top Rated (⭐4.8+)
              </button>
              <button
                onClick={() => setFilterType('response')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  filterType === 'response'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fast Response
              </button>
            </div>
            {selectedLocality && (
              <button
                onClick={onClearLocalityFilter}
                className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Clear Location Filter
              </button>
            )}
          </div>
        </div>

        {/* Experts Grid */}
        {filteredExperts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredExperts.map((expert) => {
              // Convert standard image urls to simple avatars to guarantee we don't display photos
              const avatarId = expert.fullName.charAt(0);
              const fallbackAvatarSeed = `https://api.dicebear.com/7.x/adventurer/svg?seed=${expert.fullName}&backgroundColor=b6e3f4`;

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
                          {expert.fullName}
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
                        <span className="font-medium text-slate-400">Residing Since:</span>
                        <span className="font-bold text-slate-700">{expert.memberSince.split(' ')[1] || '2016'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">Years Living There:</span>
                        <span className="font-mono font-black text-slate-700">{expert.yearsLivingThere} yrs</span>
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
                      <span>Ask {expert.fullName}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center max-w-xl mx-auto">
            <p className="text-sm font-semibold text-slate-600">No matching local experts found.</p>
            <p className="text-xs text-slate-400 mt-1">Please try modifying your search filters or click "Clear Location Filter" to view all resident experts.</p>
            <button
              onClick={() => {
                setFilterType('all');
                onClearLocalityFilter();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 uppercase tracking-wider cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
