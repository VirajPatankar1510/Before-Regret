import React from 'react';
import { Search, ArrowUp } from 'lucide-react';

interface ClosingCtaSectionProps {
  onScrollToSearch: () => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({ onScrollToSearch }) => {
  return (
    // 2026-11-23 (owner, Apple-style pass): the navy panel and porch-door photo became a light, centred
    // close -- headline, one line, one blue pill. Words unchanged.
    <section className="bg-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto home-reveal">
        <p className="text-base sm:text-lg font-semibold text-slate-500">Don&rsquo;t buy a house blind.</p>
        <h2 className="mt-3 font-serif text-4xl sm:text-6xl font-semibold text-home-ink tracking-[-0.025em] [text-wrap:balance]">
          Touring a house this week?
        </h2>
        <p className="mt-5 text-lg sm:text-xl text-slate-500 leading-relaxed">
          Run the address before you go. You&rsquo;ll walk in knowing what to look at.
        </p>
        <button
          onClick={onScrollToSearch}
          className="mt-10 inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-full transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span>Check an address</span>
          <ArrowUp className="w-4 h-4 ml-1" />
        </button>
      </div>
    </section>
  );
};
