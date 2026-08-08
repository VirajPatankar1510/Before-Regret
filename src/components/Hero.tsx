import React, { useRef } from 'react';
import { AddressSearchBox } from './AddressSearchBox';
import { PropertySearchResult } from '../types';
import { ListingOmissionsSection } from './home/ListingOmissionsSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { PricingSection } from './home/PricingSection';
import { FaqSection } from './home/FaqSection';
import { ClosingCtaSection } from './home/ClosingCtaSection';

interface HeroProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectProperty }) => {
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const handleScrollToSearch = () => {
    if (searchBoxRef.current) {
      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-0 pb-16">

      {/* 1. HERO SECTION (Address Search Container Untouched) */}
      {/* min-h-[85vh]: background-attachment: fixed positions relative to the viewport, not this
          section, so the section needs to be close to viewport height for bg-center's cover-fit
          math to land the image the way it would in a normal (non-fixed) section -- otherwise a
          short section only ever windows into a narrow, arbitrary slice of the fixed image, and
          there's no scroll distance left to actually feel the parallax. flex centering keeps the
          content vertically centered now that the section is taller than its content. */}
      <section className="relative min-h-[85vh] flex flex-col justify-center text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">

        {/* Background image -- real photograph of a suburban street at dusk (public/hero-bg.png,
            2.28:1, replaces the earlier corrupted file). Sky is already near-black at the top
            (where the headline sits), so the overlay is kept light there and only slightly
            heavier toward the bottom -- just enough for the free-report subtext to stay
            readable, while letting the house row show through clearly rather than washing it
            out. The search bar has its own solid card background (see AddressSearchBox.tsx), so
            it doesn't depend on this overlay for contrast. bg-fixed anchors the image
            to the viewport rather than this section, so it stays put while the section's own
            content scrolls over it -- the section's overflow-hidden + rounded corners clip it to
            a fixed "window," giving a parallax feel without a scroll-listener. Mobile browsers
            (especially iOS Safari) are notoriously unreliable with background-attachment: fixed
            on a non-body element inside an overflow-hidden container -- rather than degrading to
            a normal static background, several of them fail to paint it at all. bg-scroll below
            md is the safe default there; the parallax only kicks in from md up, where desktop
            browsers handle it correctly. */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/25 to-slate-950/50" />

        {/* Ambient background lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">

          {/* Main Risk-Framed Headline & Subhead */}
          <div className="space-y-4">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Could you regret moving here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              Search any US residential address. Get the checks that actually matter for a home of its age and county, the exact questions to ask the seller, and a clear list of what to verify before you sign.
            </p>
          </div>

          {/* Search Box Container */}
          <div ref={searchBoxRef} id="address-search-box" className="pt-2">
            <AddressSearchBox onSelectProperty={onSelectProperty} />
          </div>

          {/* Subtext */}
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your first report is free. No credit card required.
          </p>

        </div>
      </section>

      {/* 2. WHAT A LISTING WON'T TELL YOU */}
      <ListingOmissionsSection />

      {/* 3. HOW IT WORKS & DATA SYNTHESIS WORKFLOW */}
      <HowItWorksSection />

      {/* 4. PLAIN, TRANSPARENT PRICING */}
      <PricingSection onScrollToSearch={handleScrollToSearch} />

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 6. CLOSING CALL TO ACTION */}
      <ClosingCtaSection onScrollToSearch={handleScrollToSearch} />

    </div>
  );
};
