import React, { useState } from 'react';
import { ExpertProfile, Review, Neighborhood } from '../types';
import { pricingPlans } from '../data';
import { ChevronLeft, Clock, ShieldCheck, Check, ArrowRight, MessageSquare, Heart, Award, Star, ThumbsUp, MapPin } from 'lucide-react';

interface ResidentProfileProps {
  expert: ExpertProfile;
  locality: Neighborhood;
  reviews: Review[];
  onBack: () => void;
  onSelectPackage: (packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT') => void;
  onStartInquiry: () => void;
  savedExperts: string[];
  onToggleSaveExpert: (expertId: string) => void;
}

export const ResidentProfile: React.FC<ResidentProfileProps> = ({
  expert,
  locality,
  reviews,
  onBack,
  onSelectPackage,
  onStartInquiry,
  savedExperts,
  onToggleSaveExpert,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'QUICK' | 'BUNDLE' | 'LIVE_CHAT'>('QUICK');
  const isSaved = savedExperts.includes(expert.id);

  // Filter reviews matching current expert
  const expertReviews = reviews.filter((rev) => rev.expertId === expert.id);

  const activePlan = pricingPlans.find((p) => p.id === selectedPlanId) || pricingPlans[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Back button and Save action */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-blue-600" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => onToggleSaveExpert(expert.id)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isSaved
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{isSaved ? 'Saved Expert' : 'Save Resident'}</span>
        </button>
      </div>

      {/* Fiverr Gig Title Header */}
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-xl sm:text-3xl font-display font-black tracking-tight text-slate-900 leading-tight">
          I will consult you on {locality.name}'s water hours, maid rates, and actual society guidelines
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-700 font-mono">
              {expert.fullName.split(' ')[0].charAt(0)}
            </div>
            <span className="font-bold text-slate-800">{expert.fullName.split(' ')[0]}</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600 font-bold">
            Local Resident
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-bold text-amber-500 font-mono">
            ⭐ {expert.rating} <span className="text-slate-400 font-normal">({expert.questionsAnsweredCount} answers)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-sm">
            {expert.responseTime}
          </span>
        </div>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Gig/Profile details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cover / Society Information Card */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xs">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)]"></div>
            
            <div className="relative z-10">
              <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 border border-blue-500 rounded uppercase tracking-widest font-mono">
                Resident Locality
              </span>
              <h2 className="text-2xl font-display font-black tracking-tight mt-3">
                {locality.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {locality.apartmentName || 'Apartment Complex'} • {locality.city}, {locality.state} - {locality.pincode}
              </p>
            </div>
          </div>

          {/* Detailed Address, Landmarks & Pincode Mapping Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span>Registered Pincode & Landmark Details</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verified address mapping and landmarks for {locality.name}
                </p>
              </div>
              <div className="px-3 py-1 bg-slate-100 text-slate-850 rounded-full font-mono font-bold text-[11px] tracking-wide self-start sm:self-auto flex items-center gap-1 border">
                <span>PIN:</span>
                <span className="text-blue-600">{locality.pincode || "Not Set"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Detailed Resident Address</h4>
                <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {locality.detailedAddress || `${locality.name}, ${locality.city}, ${locality.state}`}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Key Landmark & Navigation Guide</h4>
                <p className="text-xs font-bold text-blue-800 leading-relaxed bg-blue-50/30 p-3 rounded-xl border border-blue-100/30">
                  📍 {locality.landmarks || "No specific landmarks registered yet. Ask the resident expert directly."}
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/40 text-[11px] text-amber-800 leading-relaxed flex items-start gap-3">
              <span className="text-sm shrink-0 mt-0.5">💡</span>
              <p>
                <b>Honest Local Verification:</b> Since satellite maps often miss Indian sub-localities and exact gates, our expert residents list detailed navigation rules, security cabin positions, and nearby transit cues above for absolute accuracy.
              </p>
            </div>
          </div>

          {/* About the Expert Profile Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8">
            <h3 className="font-display font-black text-slate-900 text-lg mb-6">
              About The Resident Expert
            </h3>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100 mb-6">
              <img
                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${expert.fullName}&backgroundColor=b6e3f4`}
                alt={expert.fullName}
                className="w-16 h-16 rounded-full object-cover bg-slate-50 border border-slate-200 p-1 shadow-2xs"
                referrerPolicy="no-referrer"
              />
              <div className="text-center sm:text-left flex-1">
                <h4 className="font-bold text-slate-900 text-base">{expert.fullName.split(' ')[0]}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Residing in {locality.name} since {expert.memberSince.split(' ')[1] || '2016'} ({expert.yearsLivingThere === 0 ? 'less than a year' : expert.yearsLivingThere >= 50 ? '50+ years' : `${expert.yearsLivingThere} years`})
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <span className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-0.5 border border-slate-200 rounded-md">
                    ⭐ {expert.rating} Stars
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 border border-blue-100/50 rounded-md">
                    {expert.experienceLevel}
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-100 rounded-md">
                    {expert.responseRate}% Response Speed
                  </span>
                </div>
              </div>
            </div>

            {/* Structured attributes */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Languages Spoken</span>
                <strong className="text-slate-800">{expert.languages.join(', ')}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Availability hours</span>
                <strong className="text-slate-800 font-mono">{expert.availability}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Total repeat buyers</span>
                <strong className="text-slate-800 font-mono">{expert.repeatBuyersCount} buyers</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Knowledge Areas</span>
                <strong className="text-slate-800">Bylaws, Water crisis, Maid logistics</strong>
              </div>
            </div>

            {/* Bio text */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              {expert.bio}
            </p>

            {/* Topics they know best */}
            <div>
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">
                Topics I Know Best
              </h4>
              <div className="flex flex-wrap gap-2">
                {expert.expertiseTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-100 border border-slate-200/60 text-slate-700 text-xs px-3 py-1 rounded-full font-sans transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Past Resident Answers Feedback (Reviews) */}
          <div className="space-y-6">
            <h3 className="font-display font-black text-slate-900 text-lg">
              Consulting Reviews from Buyers
            </h3>

            {expertReviews.length > 0 ? (
              <div className="space-y-4">
                {expertReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all shadow-3xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 font-mono">
                          {rev.buyerName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{rev.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-mono text-xs font-black">
                        ⭐ {rev.rating}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold font-mono mt-3.5 pt-2.5 border-t border-slate-50">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Protected Purchase Transaction</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border border-dashed border-slate-200">
                No customer consult reviews posted for {expert.fullName.split(' ')[0]} yet. Be the first to ask!
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Sticky Tabbed Fiverr-style Pricing Box */}
        <div className="lg:col-span-1 sticky top-24 z-30">
          
          <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            
            {/* 3 Fiverr-Style Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 text-center text-[10px] sm:text-xs font-bold font-sans bg-slate-50">
              <button
                onClick={() => {
                  setSelectedPlanId('QUICK');
                  onSelectPackage('QUICK');
                }}
                className={`py-3.5 border-r border-slate-200 cursor-pointer transition-colors ${
                  selectedPlanId === 'QUICK'
                    ? 'bg-white text-blue-600 border-b-2 border-b-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => {
                  setSelectedPlanId('BUNDLE');
                  onSelectPackage('BUNDLE');
                }}
                className={`py-3.5 border-r border-slate-200 cursor-pointer transition-colors ${
                  selectedPlanId === 'BUNDLE'
                    ? 'bg-white text-blue-600 border-b-2 border-b-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => {
                  setSelectedPlanId('LIVE_CHAT');
                  onSelectPackage('LIVE_CHAT');
                }}
                className={`py-3.5 cursor-pointer transition-colors ${
                  selectedPlanId === 'LIVE_CHAT'
                    ? 'bg-white text-blue-600 border-b-2 border-b-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live Chat
              </button>
            </div>

            {/* Tab Details Render */}
            <div className="p-6">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h4 className="font-bold text-slate-800 text-sm tracking-tight">
                  {activePlan.title}
                </h4>
                <span className="text-xl font-black text-slate-900 font-mono">
                  Rs. {activePlan.price}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {activePlan.description}
              </p>

              {/* SLA Time details */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-5 font-mono">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>
                  {selectedPlanId === 'QUICK' && '24 Hours Delivery'}
                  {selectedPlanId === 'BUNDLE' && 'Priority Messaging Support'}
                  {selectedPlanId === 'LIVE_CHAT' && 'Scheduled 30-Min Real-time Session'}
                </span>
              </div>

              {/* Features List Checklist */}
              <div className="space-y-2.5 mb-6">
                {activePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 font-bold" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Order Button */}
              <button
                onClick={onStartInquiry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:shadow-md"
              >
                <span>Continue (Rs. {activePlan.price})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-slate-400 text-center mt-3 font-mono">
                Payment Protected • 100% Satisfaction Guarantee
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
