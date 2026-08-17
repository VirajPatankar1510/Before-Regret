import React from 'react';
import { ShieldCheck, Layers } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <>
      {/* Dark band limited to the 3-step walkthrough -- the "how it works" mechanics. Kept as its
          own section (not a shared wrapper with the two cards below) specifically so the dark
          background doesn't bleed past the steps: those two cards are context/reassurance, not
          part of the process being illustrated, and reading as a fourth and fifth "step" inside
          the same dark block blurred that distinction. */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white relative overflow-hidden">

        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How BeforeRegret Works
            </h2>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="font-sans text-base font-bold text-white">
                Enter any US residential address
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Any single-family home, condo, townhouse, or multi-family parcel, across all 50 states.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="font-sans text-base font-bold text-white">
                We validate and check what we can
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your address is validated against the US Census geocoder, and we run a live USGS seismic query for its coordinates. Everything else is era- and county-specific research, flagged for you to confirm at the source.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="font-sans text-base font-bold text-white">
                Get Report
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Exactly what to verify in person and what to ask the seller — ready before your option period closes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Why Not Just Check a Listing Site? + Independence Statement -- separated onto a plain
          white band so they read as reassurance sitting after the process, not as steps within it. */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Why not just check a listing site?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Listing portals help you find a home — not flag problems with one. This report starts from what a careful buyer or their inspector would actually want to know before signing.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-blue-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Independence statement</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              BeforeRegret isn't here to criticize builders, agents, or sellers — we believe transparency leads to better conversations and more confident decisions.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
