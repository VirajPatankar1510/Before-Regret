import React, { useEffect } from 'react';
import { ArrowLeft, Accessibility as AccessibilityIcon, Keyboard, Eye, AlertTriangle, Mail, ListChecks } from 'lucide-react';

interface AccessibilityProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

// Public accessibility statement.
//
// Two reasons this page exists, and the honesty of its wording is load-bearing for both.
//
// First, it is genuinely useful: someone using a screen reader or keyboard-only navigation needs a
// route to report a barrier, and needs to know what to expect when they do.
//
// Second, it is the cheapest available mitigation for ADA Title III web-accessibility claims, which
// are filed in volume against US-facing commercial sites. What deters a demand letter is evidence of
// an ongoing, good-faith remediation process with a real contact -- not a conformance badge. Which
// is exactly why this page must NOT claim full WCAG conformance: no independent audit has been done,
// automated tooling detects only a fraction of real barriers, and an overstated conformance claim is
// itself a deceptive-practice exposure and hands a plaintiff a documented misstatement. Everything
// asserted below is limited to what has actually been verified (Lighthouse's automated checks pass
// at 100 on the homepage) and is explicit that automated passing is not the same as conformance.
//
// If a real audit is ever commissioned, this is the page that changes -- and only then does the
// language move from "we aim for" to a stated conformance level.
export const Accessibility: React.FC<AccessibilityProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/');
              else onBackToHome();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>
          <span className="text-xs font-mono text-slate-500">Last Revised: August 17, 2026</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">

          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Property research guides for US home buyers, built from public records.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Accessibility Statement
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Before Regret</strong> (beforeregret.com), operated by <strong>Atmostellar</strong>,
              is intended to be usable by everyone, including people who use screen readers,
              keyboard-only navigation, screen magnification, or other assistive technology. This page
              explains what we have done, what we know is imperfect, and how to tell us when
              something on this site does not work for you.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Found a barrier? Tell us and we will fix it</span>
            </div>
            <p className="leading-relaxed">
              Email <a href="mailto:hello@beforeregret.com" className="font-bold underline">hello@beforeregret.com</a>{' '}
              with the subject line <strong>"Accessibility"</strong>. Describe the page and what went
              wrong, and include the assistive technology and browser you were using if you know
              them. <strong>We acknowledge every report within 5 business days</strong> and will tell
              you what we can fix, how, and roughly when. If something blocks you from information
              you need right now, say so and we will send you that information directly by email in a
              format that works for you, rather than leaving you waiting on a code change.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <AccessibilityIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span>1. The standard we work toward</span>
              </h2>
              <p>
                We aim to meet the{' '}
                <a
                  href="https://www.w3.org/WAI/WCAG21/quickref/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-bold"
                >
                  Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
                </a>. We treat that as the target we build against and measure ourselves by.
              </p>
              <p>
                <strong>We are deliberately not claiming to have fully achieved it.</strong> No
                independent accessibility audit of this site has been carried out, and we would rather
                tell you that plainly than publish a conformance badge we cannot stand behind. Our
                automated accessibility checks currently pass without errors, but automated tools only
                detect a minority of real accessibility problems -- they cannot judge whether a link's
                text makes sense out of context, whether a reading order is logical, or whether a
                custom control behaves the way a screen reader user expects. Those need human testing,
                and where we have not done it we do not claim it.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-400 shrink-0" />
                <span>2. What is in place today</span>
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Semantic structure.</strong> Pages use real headings, lists, and landmark regions rather than styled text, so assistive technology can present an outline and let you skip between sections.</li>
                <li><strong>Keyboard operability.</strong> Interactive controls are reachable and operable by keyboard, and focus is visible when you move through them.</li>
                <li><strong>Text alternatives.</strong> Meaningful images carry alternative text, and images that are purely decorative are hidden from assistive technology instead of being announced as noise.</li>
                <li><strong>Colour and contrast.</strong> Body text and interface text are set against backgrounds chosen for contrast, and we never rely on colour alone to carry meaning -- risk levels and statuses are always also stated in words.</li>
                <li><strong>Zoom and reflow.</strong> Layouts are responsive and reflow rather than breaking or requiring horizontal scrolling when text is enlarged.</li>
                <li><strong>Reduced motion.</strong> Animation is minimal and respects the operating-system "reduce motion" preference.</li>
                <li><strong>Readable form fields.</strong> Inputs are labelled, and font sizes on mobile inputs are set to avoid forced zoom on focus.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>3. Known limitations, stated honestly</span>
              </h2>
              <p>
                These are areas we already know are weaker. Listing them is not an excuse -- it tells
                you what to expect and shows what we are working on:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>The interactive map.</strong> Address selection uses a visual map component
                  from a third-party library. Map interaction is inherently visual and is the least
                  accessible part of this site. <strong>You never have to use the map:</strong> the
                  address search box accepts a typed address and works without touching it. If the map
                  is a barrier for you, email us the address and we will send the research back to
                  you directly.
                </li>
                <li>
                  <strong>Data-dense report sections.</strong> Property reports contain comparison
                  tables and grouped findings. We believe these are navigable, but they have not been
                  tested end-to-end with every major screen reader, and complex data presentation is
                  where problems most often hide.
                </li>
                <li>
                  <strong>Third-party components.</strong> Sign-in and payment steps are handled by
                  external providers whose interfaces we do not control and cannot directly fix. If you
                  hit a barrier in one of those, tell us -- we will both raise it with the provider and
                  find another way to get you what you need.
                </li>
                <li>
                  <strong>No independent audit yet.</strong> Our testing to date is automated tooling
                  plus our own manual keyboard checks, not a formal third-party assessment.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>4. Using this site without a mouse</span>
              </h2>
              <p>
                Every task on this site -- searching an address, generating a report, reading a guide,
                buying a placement -- is designed to be completable by keyboard. <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Tab</kbd>{' '}
                moves forward, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Shift + Tab</kbd>{' '}
                moves back, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Enter</kbd>{' '}
                or <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Space</kbd>{' '}
                activates, and <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Esc</kbd>{' '}
                closes dialogs. If you find a control you cannot reach or operate this way, that is a
                bug on our side -- please report it.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                <span>5. How we handle what you report</span>
              </h2>
              <p>
                Accessibility problems are treated as functional defects, not cosmetic requests. When
                you report one we acknowledge it within 5 business days, fix what can be fixed
                quickly, and give you a realistic timeframe for anything larger. Where a fix will take
                time, we will offer you a way to get the same information in the meantime. Barriers
                affecting a third-party component are raised with that provider, and we will tell you
                honestly when something is outside our control rather than leaving you without an
                answer.
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">6. Contact</h2>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Atmostellar (Operating Entity for Before Regret)</p>
                <p>Mumbai, Maharashtra, India</p>
                <p>
                  Accessibility contact:{' '}
                  <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>{' '}
                  (subject line "Accessibility")
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                This statement applies to beforeregret.com and was last reviewed on the date shown at
                the top of this page. It is reviewed whenever a significant change is made to the site.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
