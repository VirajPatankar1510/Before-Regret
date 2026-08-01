import React from 'react';
import { Check, ShieldCheck, Download, Share2, FileCheck2, Database } from 'lucide-react';

export const PricingSection: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 tracking-tight">
          Plain, Transparent Pricing
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          One flat price per property report. No subscriptions, no hidden fees, and no recurring charges.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl relative max-w-2xl mx-auto space-y-8">
        
        {/* Top Badge */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Single Property Research Report
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Full Public Record Synthesis
            </h3>
          </div>
          <div className="text-right">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              $29
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              One-time payment
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            What's Included in Every $29 Report:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>25+ Public Databases</strong> aggregated across federal, state, and county registries</span>
            </div>

            <div className="flex items-start gap-[12px]">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Categorized Findings Matrix</strong> (Verified, Needs Verification, Era Expectations)</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Permit Archive Trail</strong> for roof, HVAC, plumbing, and structural changes</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Environmental Overlay</strong> (FEMA flood zones, EPA Superfund, FAA noise maps)</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span><strong>Tailored Seller Questions</strong> & home walkthrough checklist items</span>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
