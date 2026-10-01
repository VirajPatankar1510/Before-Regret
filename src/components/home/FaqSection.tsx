import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';

// Exported so the build-time homepage prerenderer (scripts/prerender-homepage.tsx) can render the
// exact same Q&A text into static HTML, fully expanded, instead of duplicating it there and
// risking drift between what a crawler sees and what a real visitor sees post-hydration.
export const HOMEPAGE_FAQS: { q: string; a: string }[] = [
  // The first two are the entity definition, added 2026-10-01. Google reads "before regret" as
  // regret before death -- a US search for the phrase, and even for the domain, returned deathbed
  // regret articles -- and in September its AI Mode answered "what is this before regret website?"
  // by describing the relationship product this domain served until 2026-07-31. Nothing on the
  // homepage answered that question directly. The first answer is the same description as /about/
  // and the LinkedIn page; the second ties the phrase to buying a house. Every example in it is
  // something the site checks: sun hours (/sunlight/), permit history, and what an inspection
  // covers. They lead the list because the FAQ opens its first item by default.
  {
    q: 'What is Before Regret?',
    a: 'Before Regret is free property research for US home buyers. Enter any US address and you get the questions to ask the seller, what to inspect first for that home\'s age and county, and the earthquake risk for that exact address, with anything we haven\'t independently verified labeled as such.'
  },
  {
    q: 'Why is it called Before Regret?',
    a: 'Because the time to check a house is before you sign, while you can still ask, negotiate or walk away. Many of the things people come to regret about a home, like a bedroom that gets no winter sun, a renovation nobody got a permit for, or a problem the inspection was never asked to look at, can be checked beforehand. Before Regret exists for that window.'
  },
  {
    q: 'Is Before Regret a substitute for a licensed home inspection?',
    a: 'No. A physical home inspection evaluates the current physical and mechanical condition of a property — testing outlets, inspecting shingles, running plumbing. Before Regret combines live-checked data (like seismic hazard), cited public research on what matters for a home\'s era and region, and a plain-language summary. The two complement each other: Before Regret tells you exactly what to point your inspector at.'
  },
  {
    q: 'How does Before Regret compare to real estate listing sites?',
    a: 'Listing portals are built to help you find and fall in love with a home — seller photos, agent copy, MLS data. Before Regret is built the other way around: it starts from what a careful buyer or their inspector would actually want confirmed before signing, and is explicit about which parts come from a live source versus still on you to check.'
  },
  {
    q: 'Does a Before Regret report constitute legal, financial, or engineering advice?',
    a: 'No. Before Regret is a research assistant tool. Reports do not constitute formal legal title searches, legal opinions, structural engineering evaluations, or licensed financial appraisals. Every recommendation routes to a licensed professional as the next step — the report itself is never a substitute for one.'
  },
  {
    q: 'How quickly is the report generated?',
    a: 'Reports are generated instantly in your browser (typically under 60 seconds) once you enter a property address. You get immediate access to the interactive web report at a permanent link you can revisit, share, or export as a PDF anytime.'
  },
  {
    q: 'Are there any recurring subscription fees or hidden costs?',
    a: 'None. Your first report is 100% free with no credit card required. Additional reports are $14.99 each. No subscription, no auto-renewal, and no hidden charges ever.'
  }
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = HOMEPAGE_FAQS;

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            How this differs from a home inspection, and how we stay independent.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  id={`faq-trigger-${idx}`}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-sans text-lg font-bold text-slate-900 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    id={`faq-panel-${idx}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${idx}`}
                    className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-sans"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
