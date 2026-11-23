import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';
import { reportCtaClick } from '../../utils/ctaClickBeacon';

interface ArticleClosingNoteProps {
  onNavigate?: (path: string) => void;
}

// The free-report call to action at the foot of every guide. 2026-10-04: restyled to the
// homepage's navy closing panel. 2026-11-23: light, like the rest of the Apple-style pass. 2026-10-14: the earthquake-risk line came out (the USGS seismic
// section was removed from reports on 2026-10-10), and clicks are now counted (ctaClickBeacon.ts).
export const ArticleClosingNote: React.FC<ArticleClosingNoteProps> = ({ onNavigate }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white text-home-ink p-8 sm:p-12 space-y-6">
      <div className="relative space-y-3">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-home-ink leading-tight tracking-[-0.02em]">
          Get Your Free Property Report
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          Before Regret builds one report for any US address: the questions to ask the seller, what to inspect first for a home of its age and county, and what the neighborhood's public data shows — with anything not yet independently verified clearly labeled, not guessed at.
        </p>
      </div>

      <ContentLink
        href="/"
        onNavigate={onNavigate}
        onClickTrack={() => reportCtaClick('guide_closing_report')}
        className="relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-bold text-sm sm:text-base rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <span>Check an address</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </ContentLink>

      <p className="relative text-xs sm:text-sm text-slate-500">
        Free, with no sign-up and no credit card.
      </p>
    </div>
  );
};
