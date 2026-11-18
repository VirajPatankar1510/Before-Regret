import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';

// Exported so the build-time homepage prerenderer (scripts/prerender-homepage.tsx) can render the
// exact same Q&A text into static HTML, fully expanded, instead of duplicating it there and
// risking drift between what a crawler sees and what a real visitor sees post-hydration.
// The entity definition, added 2026-10-01. Google reads "before regret" as regret before death -- a
// US search for the phrase, and even for the domain, returned deathbed-regret articles -- and in
// September its AI Mode answered "what is this before regret website?" by describing the
// relationship product this domain served until 2026-07-31. Nothing on the homepage answered that
// question directly. The first answer is the same description as /about/ and the LinkedIn page; the
// second ties the phrase to buying a house, and every example in it is something the site checks:
// sun hours (/sunlight/), permit history, what an inspection covers.
//
// ALWAYS VISIBLE, NOT IN THE ACCORDION (moved 2026-10-02). They first went in as the top two
// accordion items, but the accordion below unmounted every closed answer, so after hydration the
// "why the name" answer -- the one written for the brand -- existed only in JSON-LD and in the
// prerender, not in the page Google renders. Rendered by HomepageDefinitions, which both this
// component and scripts/prerender-homepage.tsx import, so the two cannot drift.
export const HOMEPAGE_DEFINITIONS: { q: string; a: string }[] = [
  {
    q: 'What is Before Regret?',
    a: 'Before Regret is free property research for US home buyers. Enter any US address and you get the questions to ask the seller, what to inspect first for that home\'s age and county, and what public data shows about its neighborhood, with anything we haven\'t independently verified labeled as such.'
  },
  {
    q: 'Why is it called Before Regret?',
    a: 'Because the time to check a house is before you sign, while you can still ask, negotiate or walk away. Many of the things people come to regret about a home, like a bedroom that gets no winter sun, a renovation nobody got a permit for, or a problem the inspection was never asked to look at, can be checked beforehand. Before Regret exists for that window.'
  },
];

/** Hook-free, so the prerender can render the identical markup. */
export const HomepageDefinitions: React.FC = () => (
  <div className="grid gap-4 sm:grid-cols-2">
    {HOMEPAGE_DEFINITIONS.map((d) => (
      <div key={d.q} className="bg-white border border-home-linen rounded-3xl p-6 shadow-sm">
        <h3 className="font-sans text-lg font-bold text-slate-900">{d.q}</h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">{d.a}</p>
      </div>
    ))}
  </div>
);

// 2026-11-18 (owner: simplify the homepage, new voice): four plain answers. "How does Before Regret compare to
// real estate listing sites?" was dropped -- the cutaway section above makes the same point. The two
// definitions above stay word for word.
export const HOMEPAGE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Is Before Regret a substitute for a licensed home inspection?',
    a: 'No. A home inspector physically checks the house: outlets, shingles, plumbing. We don\'t. Before Regret gives you live public data about the neighborhood, research on what\'s common for a home of that age and region, and a plain-language list of what to point your inspector at. Use both.'
  },
  {
    q: 'Does a Before Regret report constitute legal, financial, or engineering advice?',
    a: 'No. Before Regret is a research tool. A report isn\'t a title search, a legal opinion, a structural engineering evaluation or an appraisal. When something needs a licensed professional, the report says so.'
  },
  {
    q: 'How quickly is the report generated?',
    a: 'Usually within a minute of confirming the address. The report opens at its own link, so you can come back to it, share it or save it as a PDF.'
  },
  {
    q: 'Does a report cost anything?',
    a: 'No. Every report is free. No account, no credit card, nothing to subscribe to.'
  }
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = HOMEPAGE_FAQS;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-home-stone border-t border-home-linen">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">
            Questions people ask
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            The short answers.
          </p>
        </div>

        <HomepageDefinitions />

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-white border border-home-linen rounded-2xl overflow-hidden transition-all shadow-sm"
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

                {/* Closed answers stay in the DOM, hidden, rather than unmounting. Unmounted, they
                    vanished from the page Google renders after hydration -- only the open answer
                    survived -- even though the prerender shows every answer expanded. Text in a
                    collapsed but present panel is indexed normally. */}
                <div
                  id={`faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${idx}`}
                  hidden={!isOpen}
                  className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-sans"
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
