import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNewSearch: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNewSearch }) => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
                BR
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">BeforeRegret</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Helping property buyers discover what they might regret overlooking before purchasing a property in the United States.
            </p>
          </div>

          <button
            onClick={onNewSearch}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Research a Property</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BeforeRegret. All rights reserved. US Public Records Property Research Assistant.</p>
          <div className="flex items-center gap-4">
            <span>27 Public Data Sources</span>
            <span>•</span>
            <span>100% Unbiased</span>
            <span>•</span>
            <span>US Public Records</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
