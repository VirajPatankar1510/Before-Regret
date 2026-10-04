import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';

interface ArticleClosingNoteProps {
  onNavigate?: (path: string) => void;
}

// The free-report call to action at the foot of every guide. 2026-10-04: restyled to the
// homepage's navy closing panel; the words are unchanged.
export const ArticleClosingNote: React.FC<ArticleClosingNoteProps> = ({ onNavigate }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-home-navy text-white p-8 sm:p-12 space-y-6 shadow-xl">
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="relative space-y-3">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-tight">
          Get Your Free Property Report
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          Before Regret builds one report for any US address: the questions to ask the seller, what to inspect first for a home of its age and county, and earthquake risk for the exact location — with anything not yet independently verified clearly labeled, not guessed at.
        </p>
      </div>

      <ContentLink
        href="/"
        onNavigate={onNavigate}
        className="relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-home-navy font-bold text-sm sm:text-base rounded-xl hover:bg-home-stone transition-colors cursor-pointer shadow-lg"
      >
        <span>Check an address</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </ContentLink>

      <p className="relative text-xs sm:text-sm text-slate-400">
        No credit card required. Additional reports are $14.99 each.
      </p>
    </div>
  );
};
