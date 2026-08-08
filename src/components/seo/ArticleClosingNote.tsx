import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ArticleClosingNoteProps {
  onNavigate: (path: string) => void;
}

export const ArticleClosingNote: React.FC<ArticleClosingNoteProps> = ({ onNavigate }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-12 space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Get Your Free Property Report
        </h2>
        <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
          BeforeRegret pulls live seismic hazard data, validates the address, and builds era- and county-specific inspection priorities and seller questions into one report — with anything not yet independently verified clearly labeled, not guessed at.
        </p>
      </div>

      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 font-bold text-sm sm:text-base rounded-xl hover:bg-blue-50 transition-colors cursor-pointer shadow-lg"
      >
        <span>Get Your First Report Free</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <p className="text-xs sm:text-sm text-blue-100">
        No credit card required. Additional reports are $14.99 each.
      </p>
    </div>
  );
};
