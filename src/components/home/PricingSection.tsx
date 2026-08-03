import React from 'react';
import { Check, ShieldCheck, Download, Sparkles, FileCheck2, Database, Gift, MapPin, ArrowUp } from 'lucide-react';

interface PricingSectionProps {
  onScrollToSearch?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onScrollToSearch }) => {
  const handleGoToMap = () => {
    if (onScrollToSearch) {
      onScrollToSearch();
    } else {
      const el = document.getElementById('address-search-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="what-we-found" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 tracking-tight">
          100% Free Property Research Reports
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Consumer property research reports are completely free for home buyers and renters. No credit card required, no subscriptions, and no hidden fees.
        </p>
      </div>

      {/* Free Report Card */}
      <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 sm:p-12 shadow-xl relative max-w-2xl mx-auto space-y-8">
        
        {/* Top Badge */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Consumer Property Report</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Full Public Record Synthesis
            </h3>
          </div>
          <div className="text-right">
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight">
              $0
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
              100% Free Forever
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            What's Included in Every Free Report:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>25+ Public Databases</strong> aggregated across federal, state, and county registries</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Two-Tier Record Matrix</strong> (Confirmed Records & Needs Inspection)</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Permit Archive Trail</strong> for roof, HVAC, plumbing, and structural changes</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Environmental Overlay</strong> (FEMA flood zones, EPA Superfund, FAA noise maps)</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Tailored Seller Questions</strong> & home walkthrough checklist items</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Instant Web & PDF Access</strong> with zero payment or credit card required</span>
            </div>

          </div>
        </div>

        {/* Mission Statement & CTA to Map */}
        <div className="pt-6 border-t border-slate-200/80 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-2xl">
            BeforeRegret isn't here to criticize builders, agents, consultants, brokers or sellers. We believe greater transparency creates better conversations and more confident property decisions. Our role is to bring together public records and practical, everyday insights so every buyer can make a more informed decision.
          </p>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleGoToMap}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <MapPin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Explore Property Map</span>
              <ArrowUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};

