import React from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';

/**
 * Homepage entry point for /walkthrough/. Deliberately a small band, not a pitch.
 *
 * WHY IT SITS DIRECTLY BELOW THE HERO. It used to sit below the pricing block, on the reasoning
 * that a free call to action above a price competes with the page's one commercial ask. That
 * concern is real and it was the wrong trade: a tool nobody scrolls far enough to find converts
 * nobody at all. High on the page, a visitor who is not ready to type an address meets something
 * they can use in one tap.
 *
 * It is also the only ACCENTED block on the homepage. Everything else is white or slate-50, so a
 * blue-tinted band with a blue rule reads as the one thing on the page asking to be noticed --
 * which is the whole point of moving it, and cheaper than making it physically larger.
 *
 * WHY IT NO LONGER SHOWS EXAMPLE CHECKS. It used to carry a three-card column of real prompts. That
 * made the block roughly the size of a full section for something that is a side door, and pushed
 * the guide library further down a homepage that already has plenty to scroll. The examples are one
 * tap away on the tool itself, which is where they are useful anyway.
 *
 * A DELIBERATE TWIN: rendered by both src/components/Hero.tsx and scripts/prerender-homepage.tsx,
 * at the same position in both, or the static and client renders disagree.
 */

interface WalkthroughToolSectionProps {
  onNavigate?: (path: string) => void;
}

export const WalkthroughToolSection: React.FC<WalkthroughToolSectionProps> = ({ onNavigate }) => (
  <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-blue-50/70 border-y border-blue-200">
    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">

      <div className="flex-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-1 mb-3">
          <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Free tool · No sign-up</span>
        </div>
        <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Going to a viewing? Take this with you.
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
          Tell us roughly when the house was built and what it sits on, and get a short list of
          things worth checking while you are standing there.
        </p>
      </div>

      <ContentLink
        href="/walkthrough/"
        onNavigate={onNavigate}
        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
      >
        Open the checklist
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </ContentLink>

    </div>
  </section>
);
