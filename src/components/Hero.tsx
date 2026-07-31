import React from 'react';
import { 
  ShieldCheck, Search, Database, FileText, CheckCircle2, ArrowRight, 
  MapPin, Sparkles, Building2, Droplets, AlertTriangle, Car, ShieldAlert,
  ListChecks, HelpCircle, FileCheck2
} from 'lucide-react';
import { AddressSearchBox } from './AddressSearchBox';
import { PropertySearchResult } from '../types';

interface HeroProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectProperty }) => {
  return (
    <div className="space-y-16 pb-20">
      
      {/* Main Hero Search Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
        
        {/* Subtle background ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/15 border border-blue-400/30 rounded-full text-xs font-extrabold text-blue-300 tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Unbiased US Property Intelligence</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Discover what you might regret overlooking <span className="text-blue-400 underline decoration-blue-500/50 underline-offset-8">before buying</span> a property.
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              We research 27+ public data sources, organize findings into one easy-to-understand report, explain why each finding matters, and tell you what to verify before purchase.
            </p>
          </div>

          {/* Step 1 Search Box */}
          <div className="pt-2">
            <AddressSearchBox onSelectProperty={onSelectProperty} />
          </div>

          {/* 4 Quick Assurance Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>27 Public Data Sources</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Unbiased & Independent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Sales Pitch / No Broker Ads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Actionable Verification Advice</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3-Step Journey Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
            Simple 3-Step Process
          </h2>
          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How BeforeRegret Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-xl flex items-center justify-center border border-blue-100">
              1
            </div>
            <h4 className="text-lg font-bold text-slate-900">Search Property Address</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter any single-family home, condo, townhouse, or apartment address in the United States using OpenStreetMap search.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold text-xl flex items-center justify-center border border-emerald-100">
              2
            </div>
            <h4 className="text-lg font-bold text-slate-900">Live Public Record Scan</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our research engine scans 27 public databases including FEMA flood layers, EPA Superfund, USGS radon, municipal permit records, and state DOT projects.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center">
              3
            </div>
            <h4 className="text-lg font-bold text-slate-900">Get Actionable Report</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive a McKinsey-style property report complete with things to verify before buying, seller questions, and property visit walkthrough checklists.
            </p>
          </div>

        </div>
      </section>

      {/* Signature Feature Highlight Card */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden space-y-8">
          
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Signature Feature</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Things Worth Verifying Before You Buy
            </h3>
            <p className="text-sm text-slate-300">
              We don't dump raw numbers on you. Every public finding is translated directly into a practical, real-world action you can take before signing a contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Public Finding:</div>
              <div className="text-sm font-bold text-white">Road expansion planned 0.6 miles south in 2027.</div>
              <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-700">
                Action: Visit the property during peak 5-7 PM rush hour to observe baseline traffic flow.
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Public Finding:</div>
              <div className="text-sm font-bold text-white">Roof replacement permit missing since 2004.</div>
              <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-700">
                Action: Request roof repair receipts, warranty documentation, or a drone inspection.
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Public Finding:</div>
              <div className="text-sm font-bold text-white">Airport flight path within 8.2 miles.</div>
              <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-700">
                Action: Listen for flight noise during active morning and evening flight times.
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Public Finding:</div>
              <div className="text-sm font-bold text-white">Property built in 1984 (EPA Radon Zone 2).</div>
              <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-700">
                Action: Conduct a 48-hour continuous indoor radon test during option period.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Why BeforeRegret Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              We Are Your Property Research Assistant
            </h3>
            <p className="text-sm text-slate-600 font-medium">
              We do not replace home inspectors, lawyers, engineers, or real estate agents. We help you become much better informed before you purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <Droplets className="w-6 h-6 text-blue-600" />
              <div className="font-bold text-sm text-slate-900">Environmental Hazards</div>
              <p className="text-xs text-slate-600">FEMA flood layers, EPA Superfund sites, AQI, and USGS indoor radon hazard zones.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <div className="font-bold text-sm text-slate-900">Public Records & Permits</div>
              <p className="text-xs text-slate-600">Roof permits, HVAC installation records, electrical panel upgrades, and tax assessment history.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <Car className="w-6 h-6 text-blue-600" />
              <div className="font-bold text-sm text-slate-900">Planning & Infrastructure</div>
              <p className="text-xs text-slate-600">State DOT road expansion projects, commercial re-zoning proposals, and fiber availability.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <ListChecks className="w-6 h-6 text-blue-600" />
              <div className="font-bold text-sm text-slate-900">Seller Questions & Checklist</div>
              <p className="text-xs text-slate-600">Personalized seller interrogation questions and property visit walkthrough items.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
