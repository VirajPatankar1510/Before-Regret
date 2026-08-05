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
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Simple, Transparent Pricing
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          No subscriptions, no hidden fees, and no recurring charges. Pay only when you need a report.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        
        {/* Card 1: First Report Free */}
        <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 shadow-lg relative flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">First Report</span>
                <h3 className="font-sans text-xl font-bold text-slate-900">Free Trial Report</h3>
              </div>
              <div className="text-3xl font-black text-blue-600">$0</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              1 free report per verified email address. No credit card required.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Full 20+ public database synthesis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Instant web link delivery at /insights/</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>No credit card or payment required</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGoToMap}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            Claim Your Free Report
          </button>
        </div>

        {/* Card 2: Additional Reports $14.99 */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 shadow-lg relative flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Additional Reports</span>
                <h3 className="font-sans text-xl font-bold text-white">Pay-As-You-Go</h3>
              </div>
              <div className="text-3xl font-black text-white">$14.99 <span className="text-xs font-normal text-slate-400">/ report</span></div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              For subsequent address lookups. Pay only when you research a new home.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Full 20+ public database synthesis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>No subscription. No auto-renewal.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Permanent web link at /insights/</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGoToMap}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            Search an Address
          </button>
        </div>

      </div>

    </section>
  );
};

