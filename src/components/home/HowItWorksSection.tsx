import React from 'react';
import { ShieldCheck, Layers } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
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
              Verified against Census records, live seismic hazard data, and era- and county-specific research.
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

        {/* Why Not Just Check a Listing Site? + Independence Statement, side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-5 space-y-2 text-slate-200">
            <h3 className="font-sans text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Why not just check a listing site?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Listing portals help you find a home — not flag problems with one. This report starts from what a careful buyer or their inspector would actually want to know before signing.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 text-slate-300">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Independence statement</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              BeforeRegret isn't here to criticize builders, agents, or sellers — we believe transparency leads to better conversations and more confident decisions.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
