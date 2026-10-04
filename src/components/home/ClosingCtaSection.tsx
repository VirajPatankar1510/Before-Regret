import React from 'react';
import { Search, ArrowUp, ShieldCheck } from 'lucide-react';

interface ClosingCtaSectionProps {
  onScrollToSearch: () => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({ onScrollToSearch }) => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto home-reveal">
      {/* 2026-10-04: the owner's porch-door photo beside the same closing copy. Lazy-loaded -- it is
          the last thing on the page and must never compete with the hero for bandwidth. */}
      <div className="bg-home-navy text-white rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr]">
        <img
          src="/images/home/porch-door-900.webp"
          srcSet="/images/home/porch-door-560.webp 560w, /images/home/porch-door-900.webp 900w"
          sizes="(min-width: 768px) 40vw, 100vw"
          width={900}
          height={1125}
          loading="lazy"
          decoding="async"
          alt="A deep green front door with brass hardware on a weathered wooden porch, lit by late afternoon sun"
          className="w-full h-64 md:h-full object-cover"
        />
        <div className="p-8 sm:p-14 flex flex-col justify-center text-center md:text-left space-y-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
            Researching a home you're about to tour?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Run the address before your walkthrough — it takes 60 seconds and you'll know exactly what to look for.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4 pt-2">
          <button
            onClick={onScrollToSearch}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>Check an address</span>
            <ArrowUp className="w-4 h-4 ml-1" />
          </button>
        </div>
        </div>

      </div>
    </section>
  );
};
