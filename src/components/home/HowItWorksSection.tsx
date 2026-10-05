import React from 'react';
import { ShieldCheck, Search, ScanLine, FileCheck2 } from 'lucide-react';

// 2026-10-04 redesign: same three steps and the same independence statement, word for word, set as
// an illustrated sequence on a warm band instead of three identical white cards.
const STEPS = [
    { title: 'Enter any US residential address', body: "Any single-family home, condo, townhouse, or multi-family parcel, across all 50 states." },
    { title: 'We validate and check what we can', body: "Your address is validated against the US Census geocoder, and we run a live USGS seismic query for its coordinates. Everything else is era- and county-specific research, flagged for you to confirm at the source." },
    { title: 'Get Report', body: "Exactly what to verify in person and what to ask the seller — ready before your inspection deadline." }
];
const ICONS = [Search, ScanLine, FileCheck2];

export const HowItWorksSection: React.FC = () => (
  <section className="bg-home-stone border-y border-home-linen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto home-reveal">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-brass">Three steps</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">How Before Regret Works</h2>
      </div>

      <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        <div aria-hidden="true" className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px bg-gradient-to-r from-home-oak/0 via-home-oak/60 to-home-oak/0" />
        {STEPS.map((step, i) => {
          const Icon = ICONS[i];
          return (
            <li key={step.title} className="relative rounded-3xl bg-white border border-home-linen p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-home-navy text-white flex items-center justify-center shadow-md">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-serif text-4xl font-semibold text-home-oak/70 tabular-nums">{i + 1}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl font-semibold text-home-ink leading-snug">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 mx-auto max-w-3xl rounded-2xl bg-white/70 border border-home-linen px-5 py-4 flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-home-moss shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-bold text-home-ink">Independence statement. </span>
          Before Regret isn't here to criticize builders, agents, or sellers — we believe transparency leads to better conversations and more confident decisions.
        </p>
      </div>
    </div>
  </section>
);
