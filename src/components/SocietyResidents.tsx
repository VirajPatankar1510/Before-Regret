import React from 'react';
import { ExpertProfile, Neighborhood, Review } from '../types';
import { ResidentAvatar } from './ResidentAvatar';
import { ChevronLeft, Star, ShieldCheck, Clock, Award, CheckCircle2, MessageSquare } from 'lucide-react';

interface SocietyResidentsProps {
  locality: Neighborhood;
  experts: ExpertProfile[];
  reviews: Review[];
  onBack: () => void;
  onSelectExpert: (expert: ExpertProfile) => void;
}

export const SocietyResidents: React.FC<SocietyResidentsProps> = ({
  locality,
  experts,
  reviews,
  onBack,
  onSelectExpert,
}) => {
  // Filter experts belonging to this locality
  const matchedExperts = experts.filter((e) => {
    if ((locality as any).isGrouped && (locality as any).groupedIds) {
      return (locality as any).groupedIds.includes(e.localityId) ||
             (locality as any).groupedNames.some((name: string) => e.localityName.toLowerCase().includes(name.toLowerCase()));
    }
    return e.localityId === locality.id || e.localityName.toLowerCase().includes(locality.name.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-sans">
      {/* Back navigation and header */}
      <div className="mb-10">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-200/50 cursor-pointer mb-6"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-100 mb-3">
              🏘️ {locality.society || 'Gated Society'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
              Resident Guides for {locality.name}
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              We found <strong className="text-slate-800 font-bold">{matchedExperts.length} verified residents</strong> living in {locality.name}, {locality.city}. Select a resident to get honest, unfiltered insights on water supply, maintenance, committee rules, and neighborhood life.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shrink-0 hidden md:block">
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Locality details</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{locality.city}, {locality.state}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Pincode: {locality.pincode}</p>
          </div>
        </div>
      </div>

      {/* Grid listing the matched experts */}
      {matchedExperts.length === 0 ? (
        <div className="p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center max-w-xl mx-auto">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-display font-black text-slate-800 text-lg">No Resident Guides Registered Here</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            While we located this area on the map, no resident guides have registered under this exact locality yet.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matchedExperts.map((expert) => {
            // Calculate expert reviews and average rating
            const expertReviews = reviews.filter((r) => r.expertId === expert.id);
            const totalConsultations = expert.questionsAnsweredCount || expertReviews.length || 0;
            const hasReviews = expertReviews.length > 0;
            const avgRating = hasReviews 
              ? (expertReviews.reduce((sum, r) => sum + r.rating, 0) / expertReviews.length).toFixed(1)
              : null;

            return (
              <div
                key={expert.id}
                className="bg-white border-2 border-slate-100 rounded-3xl shadow-xs hover:shadow-md hover:border-blue-600/40 transition-all duration-300 p-6 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 group-hover:bg-blue-600 transition-colors" />

                <div>
                  {/* Top: Avatar & Name details */}
                  <div className="flex items-start gap-4">
                    <ResidentAvatar name={expert.fullName} className="w-14 h-14" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                          {expert.fullName}
                        </h3>
                        {expert.trustScore && expert.trustScore >= 90 && (
                          <span className="inline-flex" title="Highly Trusted Resident">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>{expert.experienceLevel || 'Resident Expert'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Living there for {expert.yearsLivingThere} {expert.yearsLivingThere === 1 ? 'year' : 'years'}
                      </p>
                    </div>
                  </div>

                  {/* Rating summary */}
                  <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl w-fit">
                    {avgRating ? (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span className="text-xs font-bold text-slate-800">{avgRating}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md font-mono">
                        NEW RESIDENT
                      </span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {totalConsultations} {totalConsultations === 1 ? 'consultation' : 'consultations'}
                    </span>
                  </div>

                  {/* Headline & Bio */}
                  <p className="mt-4 text-xs font-bold text-slate-800 italic leading-relaxed border-l-2 border-slate-200 pl-3">
                    "{expert.listingHeadline || `Long-term resident in ${locality.name}`}"
                  </p>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {expert.bio}
                  </p>

                  {/* Badges/Tags */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {expert.expertiseTags && expert.expertiseTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {expert.ownerOrTenant && (
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                        {expert.ownerOrTenant}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Pricing & Action button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-mono">Consultation Fee</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      ₹{expert.pricingPerQuery} <span className="text-xs text-slate-500 font-normal">/ query</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectExpert(expert)}
                    className="flex-1 max-w-[150px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 group-hover:bg-blue-600 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    <span>Consult</span>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
