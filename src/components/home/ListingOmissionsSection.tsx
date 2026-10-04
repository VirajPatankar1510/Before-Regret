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

  // 2026-10-04 redesign: the heading "What a Listing Won't Tell You" moved to HouseXraySection (the
  // cutaway house), so this section now names what it is -- the report's contents. The five card
  // descriptions are unchanged.
  return (
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto home-reveal grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-brass">Your report</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">What&rsquo;s in your report</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
            One address, one clear page: what to ask, what to inspect, what to look at on the day, and what still has to be checked at the source.
          </p>
          <a href="/sample-report/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:gap-2.5 transition-all">
            See a sample report <span aria-hidden="true">&rarr;</span>
          </a>
          {/* 2026-10-04: the owner's kitchen photo -- the home the report is about. Lazy-loaded. */}
          <img
            src="/images/home/kitchen-1200.webp"
            srcSet="/images/home/kitchen-700.webp 700w, /images/home/kitchen-1200.webp 1200w"
            sizes="(min-width: 1024px) 40vw, 100vw"
            width={1200}
            height={900}
            loading="lazy"
            decoding="async"
            alt="A lived-in kitchen with white cabinets, a butcher-block counter and a window over the sink in warm morning light"
            className="mt-8 w-full rounded-3xl object-cover aspect-[4/3] shadow-sm border border-home-linen"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 border transition-all ${idx === categories.length - 1 ? 'bg-home-stone border-home-linen sm:col-span-2' : 'bg-white border-home-linen shadow-sm hover:shadow-md'}`}
              >
                <div className="w-11 h-11 rounded-2xl bg-home-sage text-home-moss flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-home-ink leading-snug">{cat.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{cat.publicFinding}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
