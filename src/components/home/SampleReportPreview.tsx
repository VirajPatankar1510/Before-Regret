import React, { useState } from 'react';
import {
  AlertTriangle,
  HelpCircle,
  Info
} from 'lucide-react';

export const SampleReportPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AT_A_GLANCE' | 'FINDINGS' | 'SELLER_QUESTIONS'>('AT_A_GLANCE');

  return (
    <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Sample Report Preview
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          See exactly how records, open items, and seller questions are laid out in a real report.
        </p>
      </div>

      {/* PROMINENT MANDATORY SAMPLE DISCLAIMER BANNER */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 sm:p-5 text-amber-900 rounded-r-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-800 mr-2">Sample Report — Illustrative Example. Not a Real Property.</span>
            <span>Address: 123 Example Street, Anytown, TX 00000. BeforeRegret does not yet have a live, verified data connection for any address — this preview shows the actual current format.</span>
          </div>
        </div>
      </div>

      {/* Main Report Preview Card Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-lg overflow-hidden">
        
        {/* Sample Report Top Header Strip */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                BeforeRegret Property Synthesis
              </div>
              <h3 className="font-sans text-2xl sm:text-3xl font-bold text-white">
                123 Example Street, Anytown, TX 00000
              </h3>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3 font-sans font-medium">
                <span>Fairfax County</span>
                <span>•</span>
                <span>Built: 1984</span>
                <span>•</span>
                <span>Single-Family Residence</span>
                <span>•</span>
                <span>2,450 Sq Ft</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block bg-blue-600/30 border border-blue-400/40 text-blue-300 text-xs px-3 py-1 rounded-full font-mono">
                Report #BR-2026-DEMO
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('AT_A_GLANCE')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'AT_A_GLANCE'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. At a Glance Matrix
            </button>
            <button
              onClick={() => setActiveTab('FINDINGS')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'FINDINGS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Found vs. Not Yet Verified
            </button>
            <button
              onClick={() => setActiveTab('SELLER_QUESTIONS')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'SELLER_QUESTIONS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3. Questions for the Seller
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: AT A GLANCE */}
          {activeTab === 'AT_A_GLANCE' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans text-xl font-bold text-slate-900">
                  Public Record Status Overview
                </h4>
                <p className="text-xs text-slate-500">
                  BeforeRegret does not yet have a live, verified data connection to county tax, municipal building permit, FEMA hazard, or EPA databases for any address. Each item below links to the official source so you can check it yourself.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    NOT YET VERIFIED
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Flood Hazard Zone
                  </div>
                  <p className="text-xs text-slate-600">
                    No live connection to the FEMA flood hazard layer yet. Look up the official zone yourself at the FEMA Flood Map Service Center.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    NOT YET VERIFIED
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Roof Replacement Permit
                  </div>
                  <p className="text-xs text-slate-600">
                    No live connection to this jurisdiction's permit archive yet. Check the municipal permit portal directly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    NOT YET VERIFIED
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Code Enforcement Standing
                  </div>
                  <p className="text-xs text-slate-600">
                    No live connection to municipal code enforcement records yet. Check the code enforcement portal directly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    NOT YET VERIFIED
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Municipal Sewer Connection
                  </div>
                  <p className="text-xs text-slate-600">
                    No live connection to the municipal utility authority yet. Check with the local water/sewer authority directly.
                  </p>
                </div>

              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Primary Recommendation to Verify Before Contract Expiration
                </div>
                <div className="text-sm font-bold text-white">
                  Inspect Shingle Condition & Ask for Roof Replacement Receipts
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Since BeforeRegret hasn't yet independently verified permit records for this jurisdiction, confirm roof age directly with your licensed inspector and request contractor warranty receipts from the seller during the option period.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FINDINGS BREAKDOWN */}
          {activeTab === 'FINDINGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-sm border-b border-slate-200 pb-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>Not Yet Verified — Check These Yourself</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>Building Permit Archive:</strong> No live connection to this jurisdiction's permit records yet. Link provided to the official portal.
                  </li>
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>FEMA Flood Hazard Map:</strong> No live connection to the FEMA NFHL yet. Look up the official flood zone yourself.
                  </li>
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>Tax Assessor Records:</strong> No live connection to the county assessor yet. Check the parcel record directly.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm border-b border-amber-100 pb-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Worth Verifying (Priority Items)</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>Roof Replacement Permit:</strong> Not yet independently verified. Verify installation date with your inspector and ask the seller for receipts.
                  </li>
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>Indoor Radon Levels:</strong> No live connection to EPA radon zone data yet. Request a 48-hour continuous monitor test regardless.
                  </li>
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>Sewer Lateral Connection:</strong> Not yet independently verified. Recommend a camera scope during inspection.
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 3: SELLER QUESTIONS */}
          {activeTab === 'SELLER_QUESTIONS' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-sans text-xl font-bold text-slate-900">
                  Tailored Seller Interrogation Questions
                </h4>
                <p className="text-xs text-slate-500">
                  Use these exact questions during attorney review, offer negotiation, or seller disclosure review.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    1. Roof Replacement & Warranty Records
                  </div>
                  <p className="text-slate-600">
                    "We haven't yet verified a roof replacement permit in the municipal archive for this address. What year was the current roof installed, and do you have contractor receipts or transferable shingle warranties?"
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    2. Unpermitted Renovation History
                  </div>
                  <p className="text-slate-600">
                    "Have any electrical panel modifications, basement finishing, or plumbing alterations occurred during your ownership that did not require or receive municipal permit sign-offs?"
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    3. Radon Mitigation System
                  </div>
                  <p className="text-slate-600">
                    "We don't yet have a live connection to EPA radon zone data for this address. Has any indoor radon testing or a sub-slab depressurization fan system been installed in the basement?"
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar inside Preview */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center text-xs text-slate-500 font-medium">
          Objective Public Record Synthesis — No Condition Judgments or Price Valuations.
        </div>

      </div>

    </section>
  );
};
