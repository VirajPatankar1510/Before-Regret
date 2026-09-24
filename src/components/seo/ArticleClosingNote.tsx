import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';

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
          Before Regret builds one report for any US address: the questions to ask the seller, what to inspect first for a home of its age and county, and earthquake risk for the exact location — with anything not yet independently verified clearly labeled, not guessed at.
        </p>
      </div>

      <ContentLink
        href="/"
        onNavigate={onNavigate}
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 font-bold text-sm sm:text-base rounded-xl hover:bg-blue-50 transition-colors cursor-pointer shadow-lg"
      >
        <span>Check an address</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </ContentLink>

      <p className="text-xs sm:text-sm text-blue-100">
        No credit card required. Additional reports are $14.99 each.
      </p>
    </div>
  );
};
