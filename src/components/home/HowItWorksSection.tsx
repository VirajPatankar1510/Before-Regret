import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <>
      {/* Dark band limited to the 3-step walkthrough -- the "how it works" mechanics. Kept as its
          own section (not a shared wrapper with the two cards below) specifically so the dark
          background doesn't bleed past the steps: those two cards are context/reassurance, not
          part of the process being illustrated, and reading as a fourth and fifth "step" inside
          the same dark block blurred that distinction. */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 relative overflow-hidden border-y border-slate-200">

        {/* Background ambient lighting */}
        
        

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How Before Regret Works
            </h2>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="font-sans text-base font-bold text-slate-900">
                Enter any US residential address
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Any single-family home, condo, townhouse, or multi-family parcel, across all 50 states.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="font-sans text-base font-bold text-slate-900">
                We validate and check what we can
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your address is validated against the US Census geocoder, and we run a live USGS seismic query for its coordinates. Everything else is era- and county-specific research, flagged for you to confirm at the source.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="font-sans text-base font-bold text-slate-900">
                Get Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exactly what to verify in person and what to ask the seller — ready before your option period closes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Independence statement, on a plain white band so it reads as reassurance after the
          process rather than a step within it.

          A second card, "Why not just check a listing site?", sat beside it until 2026-09-24 and
          was removed as a repeat: "What a Listing Won't Tell You" opens with the same argument
          directly under the hero, and the FAQ asks the same question -- which is the copy that
          feeds FAQPage schema, so that one is the version kept. Three statements of one point on
          a page this long read as padding, and the page is long mostly because of repeats like it. */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-blue-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Independence statement</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Before Regret isn't here to criticize builders, agents, or sellers — we believe transparency leads to better conversations and more confident decisions.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
