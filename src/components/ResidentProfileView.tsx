import React from 'react';
import { ResidentKnowledgeProfile, TopicKnowledge } from '../types';
import { ArrowLeft, ShieldCheck, Star, Users, Clock, Lock, Unlock, CheckCircle2, FileText, Sparkles, AlertTriangle } from 'lucide-react';

interface ResidentProfileViewProps {
  profile: ResidentKnowledgeProfile;
  onBack: () => void;
  onUnlockTopic: (profile: ResidentKnowledgeProfile, topic: TopicKnowledge) => void;
  onUnlockAll: (profile: ResidentKnowledgeProfile) => void;
  onOpenTopicModal: (topic: TopicKnowledge) => void;
  isTopicUnlocked: (profileId: string, topicId: string) => boolean;
  isFullyUnlocked: boolean;
}

export const ResidentProfileView: React.FC<ResidentProfileViewProps> = ({
  profile,
  onBack,
  onUnlockTopic,
  onUnlockAll,
  onOpenTopicModal,
  isTopicUnlocked,
  isFullyUnlocked,
}) => {
  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-24">
      
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Resident List</span>
          </button>
          
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {profile.societyName}, {profile.city}
          </span>
        </div>
      </div>

      {/* Resident Profile Header */}
      <section className="bg-white border-b border-[#E4E4E7] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Resident Knowledge Profile</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {profile.societyName} Resident Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Structured data and unvarnished facts directly from a {profile.residentType.toLowerCase()}.
              </p>
            </div>

            {!isFullyUnlocked && (
              <button
                onClick={() => onUnlockAll(profile)}
                className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Unlock className="w-4 h-4 text-white" />
                <span>Unlock Everything</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-white text-xs">₹399</span>
              </button>
            )}
          </div>

          {/* Three Key Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7] text-center sm:text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Living Here Since</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {profile.livingSince} ({profile.yearsLiving} Yrs)
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7] text-center sm:text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Helped Buyers</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {profile.helpedBuyersCount}
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7] text-center sm:text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Rating</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 flex items-center justify-center sm:justify-start gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{profile.rating.toFixed(1)}</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Topic List Cards Container */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Topic Breakdown ({profile.topics.length} Topics)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Unlock individual topics for ₹129 or unlock all for ₹399.
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            Freshness: {profile.lastUpdated}
          </span>
        </div>

        {/* Topic Cards List */}
        <div className="space-y-4">
          {profile.topics.map((topic) => {
            const unlocked = isFullyUnlocked || isTopicUnlocked(profile.id, topic.id);

            return (
              <div
                key={topic.id}
                className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-2xs hover:border-slate-300 transition-all duration-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {topic.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {topic.readingTime}
                      </span>
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                        Updated {topic.lastUpdated}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {topic.title}
                    </h3>
                  </div>

                  {/* Single Topic Unlock CTA Button */}
                  <div className="shrink-0">
                    {unlocked ? (
                      <button
                        onClick={() => onOpenTopicModal(topic)}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Read Unlocked Insight</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockTopic(profile, topic)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Unlock</span>
                        <span className="text-[#2563EB] font-bold">₹129</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Topic Summary / Content Preview */}
                <div className="p-4 bg-[#F7F9FC] rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed relative">
                  {unlocked ? (
                    <div className="space-y-2">
                      <p className="font-normal text-slate-800">{topic.summary}</p>
                      <button
                        onClick={() => onOpenTopicModal(topic)}
                        className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>View complete structured Q&A breakdown</span> →
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Blurred teaser */}
                      <p className="filter blur-[3px] select-none text-slate-400 leading-relaxed">
                        Resident confirms that water pressure drops slightly during summer, but internal hydro-pneumatic pumps maintain steady flow. Parking slots are stenciled and RFID boom barriers are strictly enforced.
                      </p>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-lg">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                          <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                          Unlock this topic to read complete insight
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Unlock Everything CTA Banner */}
        {!isFullyUnlocked && (
          <div className="mt-12 bg-slate-900 text-white rounded-2xl p-8 text-center space-y-4 shadow-xl border border-slate-800">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Unlock All {profile.topics.length} Topics for {profile.societyName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-normal leading-relaxed">
              Get complete, unvarnished resident intelligence on water, parking, noise, internet, security, maintenance, and hidden costs in a single unlock.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onUnlockAll(profile)}
                className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-white" />
                <span>Unlock Everything for ₹399</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              One-time payment • Lifetime access to updated society intelligence
            </p>
          </div>
        )}

      </section>

    </div>
  );
};
