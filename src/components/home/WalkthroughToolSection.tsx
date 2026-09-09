import React from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';
import { WALKTHROUGH_CHECKS } from '../../data/walkthroughChecks';

/**
 * Homepage entry point for /walkthrough/.
 *
 * WHY IT SITS AFTER PRICING RATHER THAN BEFORE IT. The free tool and the paid report answer
 * different questions -- "what do I look at while I am standing here" versus "what is true of this
 * address" -- but a free call to action placed immediately above a price is still a competing ask
 * at the exact moment the page is making its one commercial request. Putting it after means a
 * visitor who is not ready to type an address has somewhere useful to go instead of leaving, which
 * is the actual job of this block.
 *
 * WHY IT SHOWS REAL CHECKS RATHER THAN DESCRIBING ITSELF. "A helpful checklist for your viewing"
 * is a claim; "read the brand name on the breaker box, because some brands get an insurance
 * application declined outright" is the thing itself. Three real examples in the visitor's own
 * words do more than a paragraph of positioning, and they are lifted verbatim from
 * walkthroughChecks.ts rather than written fresh, so the homepage cannot end up promising a check
 * the tool does not contain.
 *
 * A DELIBERATE TWIN: rendered by both src/components/Hero.tsx and
 * scripts/prerender-homepage.tsx, at the same position in both, or the static and client renders
 * disagree. Same discipline as every other homepage section.
 */

// Derived from the real check set by id, not copied.
//
// The first version of this hand-copied three prompts as strings, and the drift guard in
// scripts/assert-walkthrough-checks.ts caught one on its very first run: the polybutylene prompt
// had been typed from memory and lost its second sentence. Detecting drift is worse than making it
// impossible, so the ids are the source of truth and the text is read off the check.
//
// The trio is hand-PICKED rather than sliced, because the point is the three most immediately
// understandable checks and "the first three in file order" is not that. The guard now only has to
// confirm the ids still exist.
const SAMPLE_IDS = ['panel-brand', 'green-stripe', 'polybutylene'] as const;

/** Exported so the build assertion can confirm each id still resolves to a real check. */
export const HOMEPAGE_WALKTHROUGH_SAMPLE_IDS: ReadonlyArray<string> = SAMPLE_IDS;

const SAMPLES = SAMPLE_IDS.map((id) => {
  const check = WALKTHROUGH_CHECKS.find((c) => c.id === id);
  if (!check) throw new Error(`[WalkthroughToolSection] no check with id "${id}"`);
  return { prompt: check.prompt, why: check.whyItMatters };
});

interface WalkthroughToolSectionProps {
  onNavigate?: (path: string) => void;
}

export const WalkthroughToolSection: React.FC<WalkthroughToolSectionProps> = ({ onNavigate }) => (
  <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-center">

        <div className="lg:col-span-2">
          <div className="inline-flex items-center gap-2 text-blue-700 mb-3">
            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">Free tool · No sign-up</span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Going to a viewing? Take this with you.
          </h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            You get maybe twenty minutes inside a house you might spend a decade paying for, and most
            of it disappears looking at the kitchen. Tell us roughly when the house was built and what
            it sits on, and you get a short list of things worth actually checking while you are
            standing there.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Built for your phone. No address, no email, nothing sent anywhere.
          </p>

          <ContentLink
            href="/walkthrough/"
            onNavigate={onNavigate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Open the walkthrough checklist
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </ContentLink>
        </div>

        <div className="lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            A few of the things it asks you to look at
          </p>
          <ul className="space-y-3">
            {SAMPLES.map((s) => (
              <li key={s.prompt} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="font-semibold text-slate-900 leading-snug">{s.prompt}</p>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Which ones you get depends on the age of the house and whether it has a basement, a crawl
            space, or a slab.
          </p>
        </div>

      </div>
    </div>
  </section>
);
