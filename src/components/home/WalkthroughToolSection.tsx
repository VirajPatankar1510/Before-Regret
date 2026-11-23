import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ContentLink } from './ContentLink';
import stats from '../../data/homeStats.json';

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
 * 2026-11-18 (owner: simplify the homepage): the separate "numbers behind the house" research section was folded in
 * here as the third card, as foreseen above. Its figure still comes from src/data/homeStats.json (built from the
 * study files), never typed here.
 *
 * A DELIBERATE TWIN: rendered by both src/components/Hero.tsx and scripts/prerender-homepage.tsx,
 * at the same position in both, or the static and client renders disagree.
 */

interface WalkthroughToolSectionProps {
  onNavigate?: (path: string) => void;
}

const CARD =
  'flex flex-col rounded-3xl bg-white p-6';
const CTA =
  'mt-4 inline-flex items-center gap-1 text-[17px] text-blue-600 hover:underline underline-offset-2';

export const WalkthroughToolSection: React.FC<WalkthroughToolSectionProps> = ({ onNavigate }) => (
  <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-home-mist">
    <div className="max-w-6xl mx-auto">

      <div className="max-w-3xl mx-auto text-center mb-14">
        {/* Copy sheet H21 (2026-11-23): the "Free. No sign-up required." label went; the heading now says it. */}
        <h2 className="font-serif text-4xl sm:text-6xl font-semibold text-home-ink tracking-[-0.025em] [text-wrap:balance]">
          More ways to check. All free.
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className={CARD}>
          <h3 className="mb-2 font-serif text-2xl font-semibold text-home-ink tracking-[-0.01em]">Viewing checklist</h3>
          <p className="text-[17px] text-slate-600 leading-relaxed flex-1">
            Tell us roughly when it was built and what it sits on. Get a short list to check while
            you&rsquo;re standing there.
          </p>
          <ContentLink href="/walkthrough/" onNavigate={onNavigate} className={CTA}>
            Open the checklist
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </ContentLink>
        </div>

        <div className={CARD}>
          <h3 className="mb-2 font-serif text-2xl font-semibold text-home-ink tracking-[-0.01em]">Sunlight by room</h3>
          <p className="text-[17px] text-slate-600 leading-relaxed flex-1">
            Pick a county and the way a window faces. See when direct sun actually reaches that room,
            including the mornings you&rsquo;ll never see at a midday viewing.
          </p>
          <a href="/sunlight/" className={CTA}>
            Check a room
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
        <div className={CARD}>
          <h3 className="mb-2 font-serif text-2xl font-semibold text-home-ink tracking-[-0.01em]">Our own research</h3>
          <p className="text-[17px] text-slate-600 leading-relaxed flex-1">
            We dig through public federal data and publish every figure for free. One finding:{' '}
            {stats.outsideZone.sharePct}% of federal flood insurance claims were paid on homes outside
            the high-risk flood zone.{' '}
            <ContentLink href={stats.outsideZone.href} onNavigate={onNavigate} className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2">
              See the study
            </ContentLink>
          </p>
          <ContentLink href="/research/" onNavigate={onNavigate} className={CTA}>
            See all research
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </ContentLink>
        </div>

      </div>
    </div>
  </section>
);
