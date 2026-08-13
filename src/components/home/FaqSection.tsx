import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';

// Exported so the build-time homepage prerenderer (scripts/prerender-homepage.tsx) can render the
// exact same Q&A text into static HTML, fully expanded, instead of duplicating it there and
// risking drift between what a crawler sees and what a real visitor sees post-hydration.
export const HOMEPAGE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Is BeforeRegret a substitute for a licensed home inspection?',
    a: 'No. A physical home inspection evaluates the current physical and mechanical condition of a property — testing outlets, inspecting shingles, running plumbing. BeforeRegret combines live-checked data (like seismic hazard), cited public research on what matters for a home\'s era and region, and a plain-language summary. The two complement each other: BeforeRegret tells you exactly what to point your inspector at.'
  },
  {
    q: 'How does BeforeRegret compare to real estate listing sites?',
    a: 'Listing portals are built to help you find and fall in love with a home — seller photos, agent copy, MLS data. BeforeRegret is built the other way around: it starts from what a careful buyer or their inspector would actually want confirmed before signing, and is explicit about which parts come from a live source versus still on you to check.'
  },
  {
    q: 'Does a BeforeRegret report constitute legal, financial, or engineering advice?',
    a: 'No. BeforeRegret is a research assistant tool. Reports do not constitute formal legal title searches, legal opinions, structural engineering evaluations, or licensed financial appraisals. Every recommendation routes to a licensed professional as the next step — the report itself is never a substitute for one.'
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
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-sans text-lg font-bold text-slate-900 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-sans">
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
