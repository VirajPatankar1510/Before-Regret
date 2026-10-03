import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Wrench, MapPin, Check, Megaphone, Phone, ShieldCheck, CreditCard, ListChecks, Zap, ChevronDown, Users, FileX, Target } from 'lucide-react';
import { MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';
import { ContentLink } from './home/ContentLink';

interface AdvertiseCompareProps {
  onNavigate: (path: string) => void;
}

// The shared funnel entry point for both ad products -- linked from GuideAdSlot.tsx's
// recruitment CTA and from /advertise generally, so a vendor arriving from either source (or a
// direct link) sees both options before committing to one. Neither checkout page (GuideAdsCheckout,
// Vendors) explains the other product; this is deliberately the only place that does, so that
// explanation lives in one spot instead of drifting out of sync across two pages.
//
// Copy here deliberately avoids two things: (1) calling site visitors "BeforeRegret's buyers" or
// any other possessive/owned-audience phrasing, and any unsupported superlative ("highest-intent
// ... in the market") -- both read as a specific, checkable claim about audience size or quality
// that this app has no data to back up, which is the kind of thing that gets a deceptive-advertising
// complaint. Describe the actual mechanism (someone reading a guide, or a report for one address)
// instead. (2) The term "guide page" -- it's this codebase's internal name for the underlying
// content type, not something a vendor buying an ad slot needs to know; the vendor just needs to
// know their ad reaches someone reading an article vs. someone pulling a report on one address.
//
// The national-vs-local framing on this page was rewritten when county guides became their own
// $29 tier (see src/server/adPricing.ts). It previously described Topic Ads as "nationwide reach"
// at one flat price, which meant a local contractor -- the exact buyer the county guides exist for
// -- read the cheaper product as irrelevant to them and was steered toward Report Ads instead.
// That is the wrong recommendation on the facts: Report Ads render inside property reports, and
// the guide pages are where the readers actually are. Keep both prices visible on the Topic Ads
// card; a single headline price is what caused the misread.
//
// This page is now prerendered (scripts/prerender-advertise.tsx) and indexable -- an Ahrefs crawl
// found it had neither: no static render meant a crawler saw an empty <div id="root">, the
// homepage's own <title>, and zero outgoing links, and the client code separately set
// 'noindex, nofollow'. Both are fixed. That second fact is why the "Return to Home" button and
// both product CTAs below are ContentLink, not <button onClick>: a button has no href and is
// invisible to anything reading raw HTML, which is exactly what made "no outgoing links" true even
// once real content exists. ContentLink renders a genuine <a href> always and only intercepts the
// click for SPA routing when onNavigate is supplied -- the same component Footer.tsx and the
// homepage's content sections already use for this identical reason.
//
// DO NOT PUT A COUNT OF GUIDES IN THIS PAGE'S COPY. It said "32 county guides" and "119 national
// guides" for weeks after the 2026-09-02 prune took the real figures to 11 and 38 -- so a page
// selling ad placements was advertising roughly three times the inventory that existed. Nobody
// could actually buy a removed page (guideAdsApi.ts filters to status='published'), so the cost was
// credibility rather than a broken sale, but a vendor who clicked through would have found a third
// of what was promised.
//
// The figures were not wrong when written; they went stale, and a hand-typed number on a sales page
// has no way of noticing. Three separate places carried the county figure and a fourth phrasing
// ("there are 32 of them") survived a count-based grep -- it was only caught by reading the
// rendered page. So the numbers are gone rather than corrected: "county guides" and "national
// guides" describe the products accurately at any inventory level and cannot drift.
//
// If a specific figure ever seems worth the persuasion, derive it at build time from
// status='published' in scripts/prerender-advertise.tsx. Do not retype one here.
//
// Exported so scripts/prerender-advertise.tsx can build this page's FAQPage JSON-LD directly from
// this array rather than a hand-copied duplicate -- the same drift risk buildCountyMeta in
// prerender-counties.tsx was written to avoid, here avoided by sharing the source instead.
// REWRITTEN 2026-10-03 at the owner's direction: "more professional ... easy to understand ... should
// not feel overwhelming. Think from the vendor's perspective." The page is now ordered the way a
// tradesperson decides: (1) what this is, in one sentence; (2) the problems they already have with
// home-service advertising, and how this answers each; (3) two placements, three points each, with one
// plain recommendation; (4) three setup steps; (5) answers to the questions that block a purchase.
// The comparison table and the long "Not sure which one?" paragraph were removed -- they repeated the
// cards and were most of what made the page feel heavy.
//
// Tone rule, also from the owner: professional, never self-deprecating. The old FAQ line "This site is
// new and its traffic is still small, which is what the price reflects" was true but read as a reason
// to leave. It is replaced by what is ALSO true and more useful: we do not sell or quote impressions,
// why we cannot count views, what the buyer gets instead, and how to measure the result themselves.
// Nothing here may claim an audience size, a past advertiser, a result, or a ranking. The only
// audience facts used are checkable: people reach these articles from Google and Bing, and AI
// assistants such as ChatGPT fetch them when answering questions (ai_crawler_visits, 2026-10-03).
//
// The "problems" section describes common vendor experiences generically. It never names a lead
// marketplace or makes a claim about any specific company.

export const ADVERTISE_FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'How many people will see my ad?',
    // Professional and true: no impression count is sold or quoted, the reason is stated, and the
    // buyer is told how to measure results. The old answer's "traffic is still small" line is gone
    // (see the note at the top of this file); nothing here implies a size in either direction.
    a: "We don't sell impressions, so we don't quote them. Our articles are delivered through a global content network, which means we can't count individual page views precisely, and we won't put a number in front of you that we can't stand behind. What you buy is specific: a fixed placement on the article you choose, exclusive to you for 30 days, at one flat price. The simplest way to judge it is by the calls and website visits it brings, so use a phone number or link you can track.",
  },
  {
    q: 'Where do readers come from?',
    a: 'People find our articles through Google and Bing when they search for things like a county permit lookup or a specific plumbing, electrical or roofing problem. AI assistants such as ChatGPT also fetch our articles when answering questions on these topics.',
  },
  {
    q: 'Do I need to be licensed or verified?',
    a: "No approval process is needed. Licensed trades enter their licence or registration number at checkout (chimney sweeps excepted), and it appears on your listing exactly as entered. Every listing is labelled as advertiser-supplied, because we don't verify details with licensing boards.",
  },
  {
    q: 'Is there a contract, and can I get a refund?',
    a: 'There is no contract. Each placement is one charge for a fixed 30-day term and never renews on its own, so there is nothing to cancel. Because your slot is reserved for you the moment you pay, payments are non-refundable.',
  },
  {
    q: 'Can I change my listing after I pay?',
    a: 'Yes. You can update your phone number and website at any time from My Placements. Your business name and trade category stay fixed, because they define the placement you bought.',
  },
  {
    q: 'What happens after 30 days?',
    a: 'Your placement ends and the slot becomes available again. If you want to keep it, simply buy it again.',
  },
];

const PROBLEMS: Array<{ icon: React.ElementType; problem: string; answer: string }> = [
  {
    icon: Users,
    problem: 'Shared leads',
    answer: 'With pay-per-lead services, the same customer can be sent to several businesses at once. On a Topic Ad you are the only advertiser on that article.',
  },
  {
    icon: FileX,
    problem: 'Contracts and renewals',
    answer: 'No contract, no subscription, no auto-renewal. You pay once for 30 days and decide later whether to continue.',
  },
  {
    icon: Target,
    problem: 'Ads that reach the wrong people',
    answer: 'Your listing sits next to the exact problem a reader is looking into, such as an old sewer line, a fuse box or a permit question in your county.',
  },
];

export const AdvertiseCompare: React.FC<AdvertiseCompareProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <ContentLink
            href="/"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </ContentLink>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
            For local businesses
          </span>
        </div>

        {/* Hero: what this is, in one sentence, plus three reassurances. */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-4 max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight">
              Be the business people see when they research a home problem in your trade
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Place your business on the articles homeowners and buyers read about permits,
              plumbing, wiring and roofs. One advertiser per article, one flat price, no contract.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { icon: CreditCard, label: 'One flat price, no contract' },
              { icon: ShieldCheck, label: 'Only advertiser on your article' },
              { icon: Zap, label: 'Live within minutes' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* The vendor's problems first, each with the answer. */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Advertising that works the way your business does</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROBLEMS.map(({ icon: Icon, problem, answer }) => (
              <div key={problem} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{problem}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two placements, three points each. */}
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Choose your placement</h2>
            <p className="text-sm text-slate-600">Working in one metro? Start with your county&rsquo;s permit guide.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic Ads */}
            <div className="bg-white border-2 border-blue-600 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col relative">
              <span className="absolute -top-3 left-6 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2.5 py-1 rounded-full">
                Recommended for local trades
              </span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">Topic Ads</h3>
                  <p className="text-xs text-slate-500">Your business on an article you choose</p>
                </div>
              </div>
              {/* Both prices stay visible: a single headline price once made local contractors
                  think this product was not for them (see the git history of this file). */}
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900">$29 <span className="text-sm font-normal text-slate-500">county guide / 30 days</span></div>
                <div className="text-lg font-bold text-slate-700">$7.99 <span className="text-sm font-normal text-slate-500">national guide / 30 days</span></div>
              </div>
              <div className="relative bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-r-xl p-3">
                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Ad</span>
                <div className="flex items-start gap-2.5 pr-8">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Plumber · example</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Example Plumbing Co.</div>
                    <div className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> (512) 555-0100</div>
                  </div>
                </div>
              </div>
              <ul className="text-sm text-slate-600 space-y-2.5 flex-1">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /><span><strong className="text-slate-900">County guides</strong> reach people looking up permits and records in your county.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /><span><strong className="text-slate-900">National guides</strong> reach people researching one specific problem, wherever they are.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /><span>You are the only advertiser on the article for the full 30 days.</span></li>
              </ul>
              <ContentLink
                href="/topic-ads"
                onNavigate={onNavigate}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <span>Choose an article</span>
                <ArrowRight className="w-4 h-4" />
              </ContentLink>
            </div>

            {/* Report Ads */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">Report Ads</h3>
                  <p className="text-xs text-slate-500">Your business inside property reports for your ZIP codes</p>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">$29 <span className="text-sm font-normal text-slate-500">3 ZIP codes / 30 days</span></div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400"><Megaphone className="w-2.5 h-2.5" /><span>Sponsored · Plumbing · example</span></div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">Example Plumbing Co.</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg"><Phone className="w-2.5 h-2.5" />(512) 555-0100</span>
              </div>
              <ul className="text-sm text-slate-600 space-y-2.5 flex-1">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span>Shown when someone pulls a report on an address in one of your 3 ZIP codes.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span>One trade per bundle, with at most {MAX_SLOTS_PER_ZIP_TRADE} businesses per ZIP code and trade.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span>Best if you only work in a few specific ZIP codes.</span></li>
              </ul>
              <ContentLink
                href="/report-ads"
                onNavigate={onNavigate}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <span>Choose ZIP codes</span>
                <ArrowRight className="w-4 h-4" />
              </ContentLink>
            </div>
          </div>
        </section>

        {/* Three steps. */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Set up in three steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: ListChecks, step: '1', title: 'Pick your placement', body: 'Choose an article or three ZIP codes.' },
              { icon: CreditCard, step: '2', title: 'Add your details', body: 'Business name, phone and trade. Pay once with PayPal.' },
              { icon: Zap, step: '3', title: 'Go live', body: 'Your listing appears within minutes and runs for 30 days.' },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center relative">
                  <Icon className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50">{step}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Questions before buying. Answers stay in the DOM when collapsed (hidden, not unmounted),
            so the prerendered HTML and the FAQPage schema both carry the full text. */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-1">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4">Common questions</h2>
          {ADVERTISE_FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="border-t border-slate-100 first:border-t-0 py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-900">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <p hidden={!isOpen} className="text-sm text-slate-600 leading-relaxed mt-2">{item.a}</p>
              </div>
            );
          })}
        </section>

        <div className="text-center space-y-3 pb-4">
          <p className="text-sm text-slate-600">Questions before you buy? Email <a className="font-semibold text-blue-700" href="mailto:hello@beforeregret.com">hello@beforeregret.com</a></p>
        </div>
      </div>
    </div>
  );
};
