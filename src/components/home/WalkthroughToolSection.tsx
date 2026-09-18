import React from 'react';
import { ClipboardCheck, Sunrise, ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';

/**
 * Homepage entry point for the free tools. Deliberately a small band, not a pitch.
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
 * WHY TWO CARDS AND NOT A LONGER BAND. /sunlight/ joined it and the obvious move was to add a
 * second row, which would have doubled the height of the one block on this page that earns its
 * place by being short. Two compact cards in a grid cost roughly the height of the old single row
 * on desktop, and the section keeps one job: here are the things you can use without paying or
 * signing up. If a third tool ever lands, the grid takes it; a fourth means this becomes its own
 * page and the homepage gets a link to that instead.
 *
 * ONE ContentLink AND ONE PLAIN <a>, WHICH IS NOT AN INCONSISTENCY. /walkthrough/ is an SPA route,
 * so ContentLink correctly intercepts it and hands the path to onNavigate. /sunlight/ is a
 * standalone static document (scripts/prerender-sunlight.tsx) with no route in the app -- passing
 * it through ContentLink would preventDefault, call onNavigate with a path it cannot render, and
 * blank the page. Same reasoning as the research links in Footer.tsx.
 *
 * A DELIBERATE TWIN: rendered by both src/components/Hero.tsx and scripts/prerender-homepage.tsx,
 * at the same position in both, or the static and client renders disagree.
 */

interface WalkthroughToolSectionProps {
  onNavigate?: (path: string) => void;
}

const CARD =
  'flex flex-col rounded-xl bg-white border border-blue-200 p-5 shadow-sm';
const CTA =
  'mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors';

export const WalkthroughToolSection: React.FC<WalkthroughToolSectionProps> = ({ onNavigate }) => (
  <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-blue-50/70 border-y border-blue-200">
    <div className="max-w-4xl mx-auto">

      <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-1 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider">Free tools · No sign-up</span>
      </div>
      <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-5">
        Two things you can use before you buy
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            <h3 className="font-sans text-lg font-extrabold text-slate-900">Viewing checklist</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed flex-1">
            Tell us roughly when the house was built and what it sits on, and get a short list of
            things worth checking while you are standing there.
          </p>
          <ContentLink href="/walkthrough/" onNavigate={onNavigate} className={CTA}>
            Open the checklist
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </ContentLink>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-2">
            <Sunrise className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            <h3 className="font-sans text-lg font-extrabold text-slate-900">Sunlight by room</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed flex-1">
            Pick a county and the way a window faces, and see when direct sun actually reaches that
            room &mdash; including the mornings you will never see at a midday viewing.
          </p>
          <a href="/sunlight/" className={CTA}>
            Check a room
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

      </div>
    </div>
  </section>
);
