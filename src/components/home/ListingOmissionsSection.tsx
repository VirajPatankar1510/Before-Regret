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
  const categories = [
    {
      icon: ClipboardCheck,
      title: 'Inspection Budget Priorities',
      publicFinding: 'Which checks are worth paying for on a home of this decade and county — and roughly what each costs to check versus to fix.'
    },
    {
      icon: MessageCircleQuestion,
      title: 'Questions for the Seller',
      publicFinding: 'The exact wording to use, why each question matters for this property, and what a reassuring answer sounds like.'
    },
    {
      icon: Activity,
      title: 'Seismic Design Category',
      publicFinding: 'The ASCE 7-22 seismic design category engineers use, pulled live for this address’s coordinates.'
    },
    {
      icon: CheckSquare,
      title: 'Walkthrough Checklist',
      publicFinding: 'What to look at with your own eyes during the visit, in a list you can tick off on your phone.'
    },
    {
      icon: ExternalLink,
      title: 'What Still Needs Verification',
      publicFinding: 'Flood zone, permit history and similar records aren’t connected yet. We say so plainly and link you straight to the official source.'
    }
  ];

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 rounded-t-[2.5rem] py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
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
