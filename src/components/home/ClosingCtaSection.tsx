import React from 'react';
import { Search, ArrowUp, ShieldCheck } from 'lucide-react';

interface ClosingCtaSectionProps {
  onScrollToSearch: () => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({ onScrollToSearch }) => {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 text-center space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Check public records before signing
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Search any US address to verify flood risk, permits, noise, and environment before you make an offer or sign a lease. Your first report is free.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onScrollToSearch}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>Search Address Now</span>
            <ArrowUp className="w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </section>
  );
};
