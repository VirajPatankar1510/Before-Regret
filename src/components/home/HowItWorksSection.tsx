import React from 'react';
import { ShieldCheck, Search, ScanLine, FileCheck2, Check } from 'lucide-react';

// 2026-10-04 redesign: three steps and the independence statement as an illustrated sequence.
// 2026-11-18 (owner: simplify the homepage): this section now also carries what's in the report and that
// it's free -- the separate "What's in your report" and pricing sections were merged in here, so a visitor
// reads how it works, what they get and what it costs in one place. Copy follows docs/brand/voice-guide.md.
const STEPS = [
    { title: 'Type an address.', body: "A single-family home, or a condo or multifamily unit with its unit number." },
    { title: "We check what's public. And tell you what isn't.", body: "We confirm the address with the U.S. Census geocoder and pull the neighborhood's Census profile. The rest is research based on the home's age and county, and we flag what to verify yourself." },
    { title: 'Walk in knowing what to ask.', body: "What to look at and what to ask the seller. Ready before your next showing, offer or inspection." }
];
const ICONS = [Search, ScanLine, FileCheck2];

// What a report contains. Area-level, never findings about the house (voice guide rule 7). The records line
// says "or how to find the right office" because some report links fall back to a general office finder.
const IN_THE_REPORT = [
  { title: 'What to ask the seller', body: 'The questions worth asking, and what a reassuring answer sounds like.' },
  { title: 'What to inspect first', body: 'Which inspections are worth paying for on a home of that age and county, and roughly what each costs to check versus fix.' },
  { title: 'A checklist for the visit', body: 'What to look at while you’re there, ready to tick off on your phone.' },
  { title: 'The neighborhood in numbers', body: 'Typical home age, owner costs and home values for the census tract, from the U.S. Census Bureau.' },
  { title: 'Where to look up records', body: 'Flood zone, permit history and code enforcement, with links to where each is kept or how to find the right office.' },
];

export const HowItWorksSection: React.FC = () => (
  <section className="bg-white py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto home-reveal">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-base sm:text-lg font-semibold text-slate-500">How it works</p>
        <h2 className="mt-3 font-serif text-4xl sm:text-6xl font-semibold text-home-ink tracking-[-0.025em] [text-wrap:balance]">Three steps. That&rsquo;s it.</h2>
      </div>

      <ol className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        <div aria-hidden="true" className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px bg-gradient-to-r from-slate-300/0 via-slate-300 to-slate-300/0" />
        {STEPS.map((step, i) => {
          const Icon = ICONS[i];
          return (
            <li key={step.title} className="relative rounded-3xl bg-home-mist p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-serif text-4xl font-semibold text-slate-300 tabular-nums">{i + 1}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl font-semibold text-home-ink leading-snug">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 rounded-3xl bg-home-mist p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-home-ink">What&rsquo;s in your report</h3>
          <p className="text-sm font-semibold text-slate-500">$0. No sign-up required.</p>
        </div>
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {IN_THE_REPORT.map((item) => (
            <li key={item.title} className="flex gap-3">
              <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-home-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate-600">Run it on every house you like.</p>
      </div>

      <div className="mt-8 mx-auto max-w-3xl rounded-2xl bg-home-mist px-5 py-4 flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-bold text-home-ink">Better questions. Better decisions. </span>
          We&rsquo;re not here to knock builders, agents or sellers. Just to help you ask better questions.
        </p>
      </div>
    </div>
  </section>
);
