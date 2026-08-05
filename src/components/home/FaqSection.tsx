import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is BeforeRegret a substitute for a licensed home inspection?',
      a: 'No. A physical home inspection evaluates the current physical and mechanical condition of a property (testing electrical outlets, inspecting roof shingles, testing HVAC operation, running plumbing faucets). BeforeRegret synthesizes historical public filings, municipal building permits, FEMA flood map layers, EPA environmental proximity hazards, and county tax assessor records. The two complement each other: BeforeRegret highlights historical permit gaps and environmental hazards so you know exactly what to tell your inspector to examine.'
    },
    {
      q: 'How does BeforeRegret compare to free real estate listing sites?',
      a: 'Free real estate portals display seller-provided marketing descriptions, agent photo galleries, and MLS listings designed to market the home. BeforeRegret independently aggregates municipal building permit departments, FEMA flood zone maps, EPA Superfund registries, FAA airport noise contours, and county clerk archives into an unbiased, buyer-focused report.'
    },
    {
      q: 'How does BeforeRegret handle properties with limited digitized records or rural addresses?',
      a: 'BeforeRegret automatically queries federal datasets (FEMA flood MSC, EPA Envirofacts, USGS radon, FCC broadband, FAA flight paths) and state DOT transportation plans for every US address. If a local municipality or rural township does not maintain a digitized online building permit archive, our engine explicitly flags those municipal systems as "Needs Verification" and provides exact questions for your inspector or seller to verify in person.'
    },
    {
      q: 'Does a BeforeRegret report constitute legal, financial, or engineering advice?',
      a: 'No. BeforeRegret is a public-record research assistant tool. Reports do not constitute formal legal title searches, legal opinions, structural engineering evaluations, or licensed financial appraisals. BeforeRegret provides objective public record summaries and suggested questions to help buyers conduct thorough pre-purchase inquiries.'
    },
    {
      q: 'How quickly is the report generated?',
      a: 'Reports are generated instantly in your browser (typically under 60 seconds) once you enter a property address. You receive immediate, unrestricted access to the interactive web report and a downloadable, print-ready PDF with no payment or credit card required.'
    },
    {
      q: 'Are there any recurring subscription fees or hidden costs?',
      a: 'None. Your first report is 100% free with no credit card required. Additional reports are $14.99 each. No subscription, no auto-renewal, and no hidden charges ever.'
    }
  ];

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Understand how public record synthesis works, how it differs from physical inspections, and how we protect your independence.
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
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-lg font-bold text-slate-900 cursor-pointer hover:bg-slate-50/80 transition-colors"
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
