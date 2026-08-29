import React, { useEffect } from 'react';
import { ArrowLeft, Radar, ShieldCheck, BookOpen, FlagTriangleRight, Bot, ListChecks } from 'lucide-react';

interface AboutMethodologyProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

// Honest disclosure of who publishes this site and how its content is actually produced --
// deliberately NOT a fabricated founder bio or an AI-generated "author" persona. See the
// conversation that led here: a fake named author with a fake photo would be a false E-E-A-T
// signal, and a discoverable one (reverse image search on an AI face is now trivial). This page
// exists to earn the same trust signal honestly -- specific, checkable claims about process,
// sourcing, and correction, not a manufactured personal-expertise story. Every claim below has to
// stay true to the actual code, not just read well: see ARTICLE_SYSTEM_INSTRUCTION in
// src/server/articleGenerator.ts for the rules described in "How articles are written."
export const AboutMethodology: React.FC<AboutMethodologyProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goTo = (path: string) => {
    if (onNavigate) onNavigate(path);
    else onBackToHome();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => goTo('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">

          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">About BeforeRegret</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How we research and write this site
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              BeforeRegret is a property research product owned and operated by <strong>Atmostellar</strong>. This
              page explains, specifically and honestly, what's a live data check, what's AI-assisted writing, what
              rules that writing has to follow, and how to tell us when something's wrong.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radar className="w-4 h-4 text-blue-600" />
              <span>What's a live check versus a curated link</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every property report runs two live lookups against the address you enter: a USGS seismic hazard
              query and a U.S. Census Bureau address/neighborhood validation. Those are shown under <strong>Checked live for this
              address</strong> because a real API call ran for that specific address. Everything else in a report -- FEMA flood data, EPA
              records, local permit and code-enforcement portals -- is a curated link straight to the actual
              government or municipal source, clearly labeled as <strong>not yet independently verified</strong> until
              you open it and check yourself. We don't blur that distinction: a report never presents a link as
              though it were a live result.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>How the editorial guides are written</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The guides in our <button onClick={() => goTo('/guides/')} className="text-blue-600 hover:underline font-semibold cursor-pointer">Editorial Guides</button> section
              are drafted with AI assistance (Google's Gemini) and reviewed before publishing. We're not hiding that,
              and we don't think AI-assisted drafting is itself the problem -- vague, uncited, unreviewed AI output
              is. So the drafting model works under a specific, non-negotiable set of rules for every article:
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 pl-1">
              <li className="flex gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                {/* The example here was "the federal lead-paint disclosure law took effect in 1978",
                    which is wrong, and wrong in a way that mattered: it sat inside the no-invented-
                    facts principle as the illustration of an acceptable fact. 1978 is when CPSC
                    banned residential lead paint; the disclosure rule (Section 1018 of Title X)
                    took effect in 1996, which is why it applies to pre-1978 housing. Corrected
                    2026-08-26 after an outside audit caught it. */}
                <span><strong>No invented statistics.</strong> A specific percentage, dollar figure, or study result is never stated unless it's traceable to a real, named source. General facts of public record ("residential lead-based paint was banned in 1978, and the federal disclosure rule for pre-1978 housing took effect in 1996") are fine; a fabricated number attached to them is not.</span>
              </li>
              <li className="flex gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No claims about your specific house.</strong> Guides describe what's common for homes of an era, region, or system type -- never "this house has X," since no guide is written with knowledge of any one property.</span>
              </li>
              <li className="flex gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Citations are name-only, from a hand-verified list.</strong> The model can cite an organization (FEMA, CPSC, NAR, HUD, and others) by short code, but it never writes the link itself -- the real URL is looked up from a list we maintain and check by hand, so a citation can never point to a broken or invented page.</span>
              </li>
              <li className="flex gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No personalized advice.</strong> Findings are framed as "some insurers have documented X," never "you will or won't be covered" -- and every actionable recommendation routes to a licensed inspector, engineer, or other professional as the actual next step, not to the article itself.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Sources</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every guide that cites a claim lists its real sources at the bottom of the article, linked directly
              to the government or industry organization named -- never a third-party summary of it. Reports link
              to the primary government source for each hazard or record type (FEMA, USGS, EPA, USDA, U.S. DOT,
              FCC, and local municipal portals) rather than to a paraphrase of it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>What this site is not</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              BeforeRegret is a research and discovery tool, not a home inspection, a structural engineering
              report, a legal title search, a property valuation, or professional financial or insurance advice.
              Nothing on this site establishes an advisory relationship between you and Atmostellar. Confirm
              anything that matters to your decision with a licensed professional before you rely on it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FlagTriangleRight className="w-4 h-4 text-blue-600" />
              <span>Found something wrong?</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If a link is broken, a fact is out of date, or a report doesn't match what you find at the source,
              tell us directly through the{' '}
              <button onClick={() => goTo('/support')} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                data discrepancy flag on our Support page
              </button>{' '}
              rather than assuming it's correct. We'd rather hear about it than have it sit uncorrected.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
