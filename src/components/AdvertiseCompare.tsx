import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Wrench, MapPin, Check, Megaphone, Phone, ShieldCheck, CreditCard, XCircle, ListChecks, Zap, ChevronDown } from 'lucide-react';
import { MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';

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
// know their ad reaches nationwide readers of educational content vs. one ZIP code's report.
const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Do I need to be licensed or verified to advertise?',
    a: 'No license or credential check happens before your placement goes live -- business name, trade category, and contact details are self-reported at checkout. Nothing gates you from buying a placement in any category listed.',
  },
  {
    q: 'How many people will see my ad?',
    a: "We don't track or guarantee impressions, clicks, or leads for either product -- you're buying a fixed placement for the 30-day window, not a performance number. Click through to a live guide or report to see your listing yourself.",
  },
  {
    q: 'Can I cancel or get a refund?',
    a: "No refunds once payment completes. There's nothing to cancel either way -- it's a single flat charge for a fixed 30-day window, not a subscription, so nothing bills you again automatically.",
  },
  {
    q: 'What happens when my placement expires?',
    a: "It simply stops showing and the slot reopens for other vendors. No reminder email is sent before that happens right now -- check My Placements or come back here to buy another window if you want to stay live.",
  },
  {
    q: 'Can I edit my listing after I’ve paid?',
    a: 'Yes -- phone, website, and tagline can be changed any time from My Placements. Business name and trade category are locked once purchased, since those define what was sold.',
  },
  {
    q: 'Can I buy both Topic Ads and Report Ads?',
    a: "Yes, nothing stops you from buying both -- they reach different audiences (nationwide by topic vs. your selected ZIP codes), so some vendors run both at once.",
  },
];

export const AdvertiseCompare: React.FC<AdvertiseCompareProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
            Advertise With Us
          </span>
        </div>

        {/* Hero */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight">
              Two ways to put your business in front of people researching a property
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              One reaches readers nationwide, the other reaches someone looking at one specific
              address. Both are self-serve, paid once, and live within minutes -- pick whichever
              matches how your business actually finds customers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              No subscription
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Self-serve checkout
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              No auto-renewal
            </span>
          </div>
        </div>

        {/* How it works -- the page used to cut straight from the hero into the two pricing
            cards, which read as a spec sheet rather than something that walks a vendor toward a
            decision. Three steps, no jargon, sets up why the two cards below are worth reading. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: ListChecks, step: '1', title: 'Pick a plan', body: 'Topic Ads reach readers nationwide by subject. Report Ads target 3 ZIP codes and one trade. Compare both below.' },
            { icon: CreditCard, step: '2', title: 'Add your business', body: 'Business name, phone, and trade category -- pay once through PayPal, no account setup beyond that.' },
            { icon: Zap, step: '3', title: "You're live", body: 'Your placement goes live within minutes and runs for a flat 30-day window, no auto-renewal.' },
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="flex items-start gap-3 sm:flex-col sm:items-start sm:gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center relative">
                <Icon className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50">{step}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic Ads */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                Nationwide reach
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">Topic Ads</h2>
              <p className="text-xs text-slate-500">Best for businesses with broad or multi-market reach</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              $7.99 <span className="text-sm font-normal text-slate-500">/ slot, 30 days</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example placement</div>
              <div className="relative bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-r-xl p-3">
                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Ad
                </span>
                <div className="flex items-start gap-2.5 pr-8">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Electrician</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Example Electric Co.</div>
                    <div className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> (512) 555-0100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 flex-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Shown on educational articles across the whole site, not tied to any one ZIP code -- readers nationwide researching that specific topic</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Any business, any topic -- pick as many placements as you want in one checkout</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Lowest cost per slot -- a good fit if you serve customers across many cities or the whole country</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('/topic-ads')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise by Topic</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Report Ads */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Hyper-local
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">Report Ads</h2>
              <p className="text-xs text-slate-500">Best for businesses with a specific local service area</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              $29 <span className="text-sm font-normal text-slate-500">/ 3 ZIP codes, 30 days</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example placement</div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    <Megaphone className="w-2.5 h-2.5" />
                    <span>Sponsored · Roof Inspection</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">Example Roofing LLC</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                  <Phone className="w-2.5 h-2.5" />
                  (512) 555-0100
                </span>
              </div>
            </div>

            <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 flex-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Shown inside the actual property report for each of your 3 chosen ZIP codes -- whoever is researching an address there sees you</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Three ZIP codes, one trade category per bundle -- at most {MAX_SLOTS_PER_ZIP_TRADE} businesses shown per ZIP and trade pair</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Higher intent, tighter targeting -- a good fit if you only work within a specific set of ZIP codes or a metro area</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('/report-ads')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise by ZIP Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick-scan comparison table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="font-serif text-xl font-bold text-slate-900">Comparison</h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2 font-semibold"> </th>
                  <th className="py-2 px-2 font-semibold text-blue-700">Topic Ads</th>
                  <th className="py-2 px-2 font-semibold text-emerald-700">Report Ads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Price</td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">$7.99 / slot</td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">$29 / 3 ZIPs</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Duration</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Where it appears</td>
                  <td className="py-2.5 px-2 text-slate-700">Educational articles, sitewide</td>
                  <td className="py-2.5 px-2 text-slate-700">Inside the report, for each of 3 ZIP codes</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Targeting</td>
                  <td className="py-2.5 px-2 text-slate-700">By topic, nationwide</td>
                  <td className="py-2.5 px-2 text-slate-700">By ZIP code + trade category</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Best for</td>
                  <td className="py-2.5 px-2 text-slate-700">Wide or multi-market service area</td>
                  <td className="py-2.5 px-2 text-slate-700">Up to 3 specific ZIP codes or a metro area</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-slate-600">
          <span className="font-bold text-slate-900">Not sure which one? </span>
          If you'd take a customer from anywhere, Topic Ads reach more people for less per slot.
          If you only serve a few towns or ZIP codes, Report Ads put you in front of someone
          researching an exact address there instead of a general topic -- worth the higher price for that
          precision. Nothing stops you from buying both.
        </div>

        {/* FAQ -- closes the page on the honest answers a vendor would actually want before
            paying (no verification gate, no view guarantee, no refunds) rather than ending
            abruptly on the comparison table. */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-1">
          <h2 className="font-serif text-xl font-bold text-slate-900 mb-4">Questions before you buy</h2>
          {FAQ_ITEMS.map((item, idx) => {
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
                {isOpen && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
