import React, { useRef } from 'react';
import { AddressSearchBox } from './AddressSearchBox';
import { PropertySearchResult } from '../types';
import { ListingOmissionsSection } from './home/ListingOmissionsSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { SampleReportPreview } from './home/SampleReportPreview';
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
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
        
        {/* Ambient background lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Main Risk-Framed Headline & Subhead */}
          <div className="space-y-4">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15]">
              Could You Regret Moving Here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              BeforeRegret synthesizes 25+ government databases into one objective public-record report — so you uncover missing permits, flood risks, and environmental hazards before making an offer.
            </p>
          </div>

          {/* Search Box Container (Preserved Untouched) */}
          <div ref={searchBoxRef} id="address-search-box" className="pt-2">
            <AddressSearchBox onSelectProperty={onSelectProperty} />
          </div>

          {/* Subtext */}

        </div>
      </section>

      {/* 2. WHAT A LISTING WON'T TELL YOU */}
      <ListingOmissionsSection />

      {/* 3. HOW IT WORKS & DATA SYNTHESIS WORKFLOW */}
      <HowItWorksSection />

      {/* 4. SAMPLE REPORT PREVIEW (With Prominent Fictional Property Disclaimer) */}
      <SampleReportPreview />

      {/* 5. PLAIN, TRANSPARENT PRICING */}
      <PricingSection onScrollToSearch={handleScrollToSearch} />

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 7. CLOSING CALL TO ACTION */}
      <ClosingCtaSection onScrollToSearch={handleScrollToSearch} />

    </div>
  );
};
