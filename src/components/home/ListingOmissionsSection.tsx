import React from 'react';
import {
  ClipboardCheck,
  MessageCircleQuestion,
  Activity,
  CheckSquare,
  ExternalLink
} from 'lucide-react';

export const ListingOmissionsSection: React.FC = () => {
  // Each card names what the paid report actually produces today. Address validation is a real
  // capability but reads as internal plumbing rather than something a buyer values on its own, so
  // it's left out here -- it still runs on every report, just not sold as a headline feature.
  //
  // TITLES ARE WHAT A BUYER WOULD SAY, NOT WHAT AN ENGINEER WOULD. Revised 2026-09-24: these were
  // "Inspection Budget Priorities" and "Seismic Design Category", and the seismic card led with
  // "The ASCE 7-22 seismic design category engineers use" -- a standard almost no home buyer has
  // heard of, promised third on a page read across a country where earthquake risk matters in only
  // some regions. The findings still name the standard where it is the real source, because the
  // content rules want a cited standard, but the headline is the question the buyer is asking.
  //
  // ORDER IS BY HOW MANY BUYERS IT HELPS. Seller questions and what to inspect first apply to every
  // house; earthquake risk applies to some. "What we can't check yet" stays last on purpose -- it is
  // the honest caveat, and it reads as one only after the reader has seen what IS covered.
  const categories = [
    {
      icon: MessageCircleQuestion,
      title: 'What to ask the seller',
      publicFinding: 'The exact wording to use, why each question matters for this property, and what a reassuring answer sounds like.'
    },
    {
      icon: ClipboardCheck,
      title: 'What to inspect first',
      publicFinding: 'Which inspections are worth paying for on a home of this age and county, and roughly what each costs to check versus to fix.'
    },
    {
      icon: CheckSquare,
      title: 'What to look at during the visit',
      publicFinding: 'A list of things to check with your own eyes on the day, that you can tick off on your phone.'
    },
    {
      icon: Activity,
      title: 'Earthquake risk for this address',
      publicFinding: 'The seismic design category engineers use (ASCE 7-22), pulled live from the USGS for this exact address.'
    },
    {
      icon: ExternalLink,
      title: 'What we can’t check yet',
      publicFinding: 'Flood zone, permit history and similar records aren’t connected yet. We say so plainly and link you straight to the official source.'
    }
  ];

  return (
    <section className="bg-white border-b border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            What a Listing Won't Tell You
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Listings are written to sell the home. This report is written to tell you what to check, what to ask, and what nobody has verified yet.
          </p>
        </div>

        {/* 5 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="font-sans text-lg font-bold text-slate-900 leading-snug">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {cat.publicFinding}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
