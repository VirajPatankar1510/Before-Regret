import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  FileText, 
  Building2, 
  ShieldCheck, 
  ListChecks, 
  MapPin 
} from 'lucide-react';

export const SampleReportPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AT_A_GLANCE' | 'FINDINGS' | 'SELLER_QUESTIONS'>('AT_A_GLANCE');

  return (
    <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 tracking-tight">
          Sample Report Preview
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Explore how public record facts, missing permit trails, and seller verification questions are presented in an objective, easy-to-read layout.
        </p>
      </div>

      {/* PROMINENT MANDATORY SAMPLE DISCLAIMER BANNER */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 sm:p-5 text-amber-900 rounded-r-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-800 mr-2">Sample Report — Illustrative Example. Not a Real Property.</span>
            <span>Address: 123 Example Street, Anytown, TX 00000.</span>
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
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                123 Example Street, Anytown, TX 00000
              </h3>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3 font-mono">
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
              2. Confirmed Records vs. Gaps
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
                <h4 className="font-serif text-xl font-bold text-slate-900">
                  Public Record Status Overview
                </h4>
                <p className="text-xs text-slate-500">
                  Categorized status based on cross-referencing county tax, municipal building permit, FEMA hazard, and EPA databases.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CONFIRMED RECORD
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Low Flood Hazard Area
                  </div>
                  <p className="text-xs text-slate-600">
                    FEMA Rate Map confirms parcel sits in Zone X (outside 100-year flood zone).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    NO RECORD FOUND
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Roof Permit Unrecorded
                  </div>
                  <p className="text-xs text-slate-600">
                    No building permit on file for roof replacement in the digitized municipal archive.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CONFIRMED RECORD
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Zero Code Enforcement Violations
                  </div>
                  <p className="text-xs text-slate-600">
                    Municipal building department records show zero open code compliance cases.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CONFIRMED RECORD
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Active Municipal Sewer Service
                  </div>
                  <p className="text-xs text-slate-600">
                    City utility department records confirm active municipal wastewater connection.
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
                  Because digitized municipal records contain no roof permit history since 1984, verify shingle age directly with your licensed inspector and request contractor warranty receipts from the seller during the option period.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FINDINGS BREAKDOWN */}
          {activeTab === 'FINDINGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm border-b border-emerald-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed Public Records</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>Building Permit #2019-882:</strong> Central HVAC Heat Pump installation signed off in October 2019.
                  </li>
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>FEMA Map Panel #51059C0280E:</strong> Outside 100-year and 500-year flood hazard areas.
                  </li>
                  <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <strong>Tax Assessor Records:</strong> Parcel square footage matches listed dimensions; zero unrecorded acreage changes.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm border-b border-amber-100 pb-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Public Record Gaps (Needs Verification)</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>Roof Replacement Permit:</strong> Missing in municipal digitized logs. Verify installation date with inspector.
                  </li>
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>EPA Radon Zone 2:</strong> Moderate indoor radon potential. Request 48-hour continuous monitor test.
                  </li>
                  <li className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                    <strong>Sewer Lateral Connection:</strong> 1984 original connection. Recommend camera scope during inspection.
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 3: SELLER QUESTIONS */}
          {activeTab === 'SELLER_QUESTIONS' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-slate-900">
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
                    "Municipal permit archives show no recorded roof replacement permit since 1984. What year was the current roof installed, and do you have contractor receipts or transferable shingle warranties?"
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
                    "This address sits in EPA Radon Hazard Zone 2. Has an active indoor radon testing or sub-slab depressurization fan system been installed in the basement?"
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
