import React from 'react';
import { UnlockedPurchase, Society } from '../types';
import { BookOpen, ArrowLeft, CheckCircle2, Building2, ChevronRight, Unlock } from 'lucide-react';

interface KnowledgeLibraryProps {
  purchases: UnlockedPurchase[];
  societies: Society[];
  onBack: () => void;
  onSelectSociety: (society: Society) => void;
}

export const KnowledgeLibrary: React.FC<KnowledgeLibraryProps> = ({
  purchases,
  societies,
  onBack,
  onSelectSociety,
}) => {
  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-20">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <span className="text-xs font-mono font-semibold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Unlocked Knowledge Library
          </span>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b border-[#E4E4E7] py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] font-mono uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Your Due Diligence Vault</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Unlocked Society Knowledge
          </h1>
          <p className="text-sm text-slate-500 font-normal">
            Access your unlocked resident intelligence anytime across devices.
          </p>
        </div>
      </section>

      {/* Library Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {purchases.length === 0 ? (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Unlock className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Unlocked Knowledge Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Search any residential society on the homepage to unlock verified resident insights on water, parking, noise, and hidden costs.
            </p>
            <div className="pt-2">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Browse Featured Societies
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((purchase) => {
              const matchedSociety = societies.find(s => s.id === purchase.societyId) || societies[0];

              return (
                <div
                  key={purchase.id}
                  onClick={() => onSelectSociety(matchedSociety)}
                  className="bg-white border border-[#E4E4E7] rounded-2xl p-6 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-200">
                        {purchase.type === 'FULL_PROFILE' ? 'Complete Profile Unlocked' : 'Topic Unlocked'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Unlocked {purchase.unlockedAt}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {purchase.societyName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Paid ₹{purchase.pricePaid} • Verified Resident Intelligence
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                    <span>Open Unlocked Insights</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
