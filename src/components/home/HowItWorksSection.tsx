import React from 'react';
import { Search, Database, FileText, ArrowRight, ShieldCheck, Building2, Layers, Cpu, Server, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white rounded-3xl max-w-6xl mx-auto shadow-2xl relative overflow-hidden my-12">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-12 sm:space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight">
            How BeforeRegret Works
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Public government records exist across thousands of fragmented municipal portals, county clerk archives, and federal registries. BeforeRegret synthesizes them into one clear, objective report in under 60 seconds.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                Enter any US residential address
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Search any single-family home, condo, townhouse, or multi-family parcel across all 50 US states using our street-level address lookup.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/60 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              <span>Street Address, City, State, ZIP</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                We pull from 20+ government databases
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Our engine aggregates municipal building permit archives, FEMA flood layers, EPA environmental databases, FAA noise contours, and tax assessor records.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/60 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Federal, State & Municipal Registries</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                Get one plain-language report
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                You get one plain-language report with what to verify and what to ask before you make an offer or sign a lease.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/60 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Confirmed Records & Seller Checklist</span>
            </div>
          </div>

        </div>

        {/* Pricing Subtext Line Immediately Below Steps */}
        <div className="text-center pt-2">
          <span className="inline-block px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-emerald-400">
            First report: Free. Additional reports: $14.99 each. No subscription.
          </span>
        </div>

        {/* Why Not Just Check Zillow? Synthesis Explanation */}
        <div className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-6 sm:p-8 space-y-4 text-slate-200">
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Why not just check Zillow?</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Listing portals are designed to help you find a home — not to surface problems with one. They show flood scores and school ratings. They don't show permit gaps, undigitized roof records, pending rezoning nearby, or radon zone classifications. We pull from 20+ separate government sources and synthesize them into one plain-language briefing. That synthesis — at the moment you're evaluating a specific address — is what you're getting.
          </p>
        </div>

        {/* Independence Statement */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3 text-slate-300">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Our Independence Statement</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            BeforeRegret isn't here to criticize builders, agents, or sellers. We believe greater transparency creates better conversations and more confident property decisions. Our role is to bring together public records and practical insights so every buyer can make a more informed decision — the details are always yours to verify.
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            We have no financial relationship with any builder, agent, lender, or listing portal. Reports are based entirely on public government data.
          </p>
        </div>



      </div>
    </section>
  );
};
