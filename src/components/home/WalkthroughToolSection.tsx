import React from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';

/**
 * Homepage entry point for /walkthrough/. Deliberately a small band, not a pitch.
 *
 * WHY IT SITS AFTER PRICING. The free tool and the paid report answer different questions -- "what
 * do I look at while I am standing here" versus "what is true of this address" -- but a free call
 * to action placed immediately above a price is still a competing ask at the exact moment the page
 * makes its one commercial request. After it, a visitor who is not ready to type an address has
 * somewhere useful to go instead of leaving.
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
  <section className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">

      <div className="flex-1">
        <div className="inline-flex items-center gap-2 text-blue-700 mb-1.5">
          <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider">Free tool · No sign-up</span>
        </div>
        <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Going to a viewing? Take this with you.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
          Tell us roughly when the house was built and what it sits on, and get a short list of
          things worth checking while you are standing there. Built for your phone. No address, no
          email, nothing sent anywhere.
        </p>
      </div>

      <ContentLink
        href="/walkthrough/"
        onNavigate={onNavigate}
        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm sm:text-base font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        Open the checklist
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </ContentLink>

    </div>
  </section>
);
