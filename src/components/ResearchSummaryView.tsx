import React from 'react';
import { CheckCircle2, FileText, ArrowRight, MapPin } from 'lucide-react';
import { ResearchSummaryData } from '../types';

interface ResearchSummaryViewProps {
  summaryData: ResearchSummaryData;
  onGenerateReport: () => void;
}

export const ResearchSummaryView: React.FC<ResearchSummaryViewProps> = ({
  summaryData,
  onGenerateReport
}) => {
  const { address, priceRationale, includedCategories, publicSourcesList, totalSourcesSearched } = summaryData;

  // What this page promises is now derived from the sources actually assembled for THIS address,
  // not from a fixed list written once and never revisited.
  //
  // It used to render eleven hardcoded strings -- "Flood & environmental risks", "Property
  // records", "Planning & development" and so on -- regardless of address, and regardless of what
  // the report would actually contain. That overstated things in two directions at once: the list
  // read as data the product supplies, while the paragraph directly beneath it said there was no
  // live data connection and the report was a checklist of links. Two blocks on one screen
  // disagreeing about what the product does.
  //
  // includedCategories and publicSourcesList have been on this payload the whole time (see the
  // /api/property/research-summary handler) -- the component simply ignored them. Nothing new is
  // fetched here; the honest answer was already in the props.
  //
  // The fallback list is kept deliberately short and generic: if the server ever sends no
  // categories, showing three vague-but-true lines is better than showing eleven specific claims
  // that may not hold.
  const categories = includedCategories?.length
    ? includedCategories
    : ['Public records', 'Hazard and environmental data', 'What to verify before you sign'];

  // Counted from the list itself rather than trusting a separate number, so the heading and the
  // rows can never disagree.
  const sourceCount = publicSourcesList?.length ?? totalSourcesSearched ?? 0;

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

        {/* Headed "This report covers", not "This report includes". The old wording implied the
            product supplies these findings; what it actually supplies is a checklist pointing at
            each source. One word, and it stops the heading contradicting the pricing note below.

            The tick marks are gone with it. Green ticks on a page shown BEFORE anything has run
            read as work already completed, which was never true here -- these are the subjects the
            report will cover, not results. A neutral marker says the same thing without the
            implied claim. */}
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>This report covers:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          {sourceCount > 0 && (
            <p className="text-xs text-slate-400 pt-1">
              Assembled from {sourceCount} official public sources for {address.city ? `${address.city}, ` : ''}{address.state}.
              Two are checked live for this address; the rest are direct links to the government
              record so you can look them up yourself.
            </p>
          )}
        </div>

      </div>

      {/* Automatic Price Box */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Report Pricing
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>First report free</span>
              <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">then $14.99 / report</span>
            </div>
            <p className="text-xs text-slate-600 font-medium max-w-lg mt-1">
              {priceRationale || 'Your first property report is free. Each additional report is a one-time purchase of $14.99 -- no subscription, no recurring charges.'}
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

    </div>
  );
};
