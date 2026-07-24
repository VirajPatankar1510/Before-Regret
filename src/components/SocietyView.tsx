import React from 'react';
import { Society, ResidentKnowledgeProfile } from '../types';
import { ArrowLeft, Building2, MapPin, ShieldCheck, Star, Clock, Layers, Lock, Unlock, CheckCircle } from 'lucide-react';

interface SocietyViewProps {
  society: Society;
  onBack: () => void;
  onSelectResidentProfile: (profile: ResidentKnowledgeProfile) => void;
  onUnlockProfile: (profile: ResidentKnowledgeProfile) => void;
  onUnlockTopicPrompt: (profile: ResidentKnowledgeProfile) => void;
  isProfileFullyUnlocked: (profileId: string) => boolean;
}

export const SocietyView: React.FC<SocietyViewProps> = ({
  society,
  onBack,
  onSelectResidentProfile,
  onUnlockProfile,
  onUnlockTopicPrompt,
  isProfileFullyUnlocked,
}) => {
  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-20">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Societies</span>
          </button>
          
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {society.city}
          </span>
        </div>
      </div>

      {/* Society Header Banner */}
      <section className="bg-white border-b border-[#E4E4E7] py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{society.locality}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {society.name}
            </h1>
            {society.description && (
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {society.description}
              </p>
            )}
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Resident Profiles</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {society.residentProfilesCount}
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Topics Available</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {society.totalTopicsAvailable}
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Last Updated</div>
              <div className="text-base font-bold text-slate-800 mt-1">
                {society.lastUpdated}
              </div>
            </div>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Verification</div>
              <div className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Authentic</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Resident Knowledge Profiles List */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Resident Knowledge Profiles
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Resident contributors offering structured, unvarnished society intelligence.
            </p>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {society.profiles.map((profile) => {
            const unlocked = isProfileFullyUnlocked(profile.id);

            return (
              <div
                key={profile.id}
                className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  
                  {/* Top Resident Header (NO personal names or photos) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        RES
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          Resident Contributor
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {profile.residentType} • {society.locality}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{profile.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Clean Spec Metrics Table */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#F7F9FC] p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Living Here</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {profile.yearsLiving} Years (Since {profile.livingSince})
                      </div>
                    </div>

                    <div className="bg-[#F7F9FC] p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Topics Answered</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {profile.topics.length} Topics
                      </div>
                    </div>

                    <div className="bg-[#F7F9FC] p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Updated</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {profile.lastUpdated}
                      </div>
                    </div>

                    <div className="bg-[#F7F9FC] p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Buyers Helped</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {profile.helpedBuyersCount} Buyers
                      </div>
                    </div>
                  </div>

                  {/* Topic Tags Preview */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Topics Covered:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.topics.map((t) => (
                        <span
                          key={t.id}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200/60"
                        >
                          {t.title}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {unlocked ? (
                    <button
                      onClick={() => onSelectResidentProfile(profile)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>View Unlocked Intelligence</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUnlockTopicPrompt(profile)}
                        className="py-3 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Unlock One Topic</span>
                        <span className="text-[#2563EB] font-bold">₹129</span>
                      </button>

                      <button
                        onClick={() => onUnlockProfile(profile)}
                        className="py-3 px-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Unlock className="w-3.5 h-3.5 text-white" />
                        <span>Unlock Everything</span>
                        <span className="font-bold text-white">₹399</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectResidentProfile(profile)}
                    className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
                  >
                    View Knowledge Profile Details →
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
};
