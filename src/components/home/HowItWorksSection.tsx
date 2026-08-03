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
                Enter Any US Address
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
                Query 25+ Public Databases
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Our engine aggregates municipal building permit archives, FEMA flood layers, EPA environmental databases, FAA noise contours, and tax assessor records.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/60 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Federal, State & County Registries</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                Get Objective Fact Report
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receive a categorized report distinguishing confirmed records from missing permit trails, complete with tailored questions to ask the seller.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/60 text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Confirmed Records & Seller Checklist</span>
            </div>
          </div>

        </div>



      </div>
    </section>
  );
};
