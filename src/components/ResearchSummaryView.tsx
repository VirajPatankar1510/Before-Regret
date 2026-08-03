import React from 'react';
import { 
  CheckCircle2, FileText, ArrowRight, ShieldCheck, Database, 
  MapPin, AlertCircle, Sparkles, Lock, Layers, HelpCircle
} from 'lucide-react';
import { ResearchSummaryData, PropertySearchResult } from '../types';

interface ResearchSummaryViewProps {
  summaryData: ResearchSummaryData;
  onGenerateReport: () => void;
}

export const ResearchSummaryView: React.FC<ResearchSummaryViewProps> = ({
  summaryData,
  onGenerateReport
}) => {
  const { address, totalSourcesSearched, usefulSourcesFound, estimatedPages, price, priceRationale, publicSourcesList } = summaryData;

  const includedItems = [
    'Flood & environmental risks',
    'Natural hazards',
    'Property records',
    'Planning & development',
    'Government datasets',
    'Infrastructure',
    'Nearby essentials',
    'Buyer insights',
    'Property visit checklist',
    'Questions to ask the seller',
    'Things to verify before purchase'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      
      {/* Property Badge Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            <span>Target Property</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {address.displayName || address.formattedAddress}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {address.county ? `${address.county}, ` : ''}{address.city}, {address.state} {address.zipCode}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Research Checked</span>
        </div>
      </div>

      {/* Main Research Complete Hero Box */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
        
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Research Complete</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Property Public Record Findings
          </h2>
          <p className="text-base text-slate-300 max-w-2xl">
            We searched <strong className="text-white font-bold">{totalSourcesSearched} public data sources</strong> for this address. Information was found in <strong className="text-emerald-400 font-bold">{usefulSourcesFound} sources</strong>.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalSourcesSearched}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Data Sources Searched</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{usefulSourcesFound}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Sources With Useful Info</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{estimatedPages}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Estimated Report Length</div>
          </div>
        </div>

        {/* What This Report Includes Checklist */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>This Report Includes:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {includedItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Automatic Price Box */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Automatic Research Pricing
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight flex items-baseline gap-2">
              <span>$0</span>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">100% Free</span>
            </div>
            <p className="text-xs text-slate-600 font-medium max-w-lg mt-1">
              {priceRationale || 'Full public record property synthesis is completely free for home buyers and renters.'}
            </p>
          </div>

          <button
            onClick={onGenerateReport}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>View Report</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Public Data Sources Accordion / Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Public Data Sources Checked ({totalSourcesSearched})</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {usefulSourcesFound} Active Records Found
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {publicSourcesList.map((src) => (
            <div
              key={src.id}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                src.foundInfo
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{src.name}</div>
                <div className="text-[10px] opacity-75">{src.category}</div>
              </div>

              {src.foundInfo ? (
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] shrink-0">
                  Data Found
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-500 font-medium rounded text-[10px] shrink-0">
                  No Hazard
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
