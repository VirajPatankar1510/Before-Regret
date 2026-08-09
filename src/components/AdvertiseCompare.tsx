import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Wrench, MapPin, Check, Megaphone, Phone, ShieldCheck, CreditCard, XCircle } from 'lucide-react';
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
export const AdvertiseCompare: React.FC<AdvertiseCompareProps> = ({ onNavigate }) => {
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-mono font-bold text-blue-300">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Self-Serve Vendor Advertising</span>
          </div>

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

        {/* Two products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* National Ads */}
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
              <h2 className="font-serif text-xl font-bold text-slate-900">National Ads</h2>
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
              onClick={() => onNavigate('/guide-ads')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise Nationally</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ZIP-Targeted Report Ads */}
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
              <h2 className="font-serif text-xl font-bold text-slate-900">ZIP-Targeted Report Ads</h2>
              <p className="text-xs text-slate-500">Best for businesses with a specific local service area</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              $29 <span className="text-sm font-normal text-slate-500">/ slot, 30 days</span>
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
                <span>Shown inside the actual property report for one specific ZIP code -- whoever is researching that exact address sees you</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>One ZIP code, one trade category per slot -- at most {MAX_SLOTS_PER_ZIP_TRADE} businesses shown per pair</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Higher intent, tighter targeting -- a good fit if you only work within a specific ZIP code or metro area</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('/vendors')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise by ZIP Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick-scan comparison table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="font-serif text-xl font-bold text-slate-900">Side by side</h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2 font-semibold"> </th>
                  <th className="py-2 px-2 font-semibold text-blue-700">National Ads</th>
                  <th className="py-2 px-2 font-semibold text-emerald-700">ZIP-Targeted Report Ads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Price</td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">$7.99 / slot</td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">$29 / slot</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Duration</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Where it appears</td>
                  <td className="py-2.5 px-2 text-slate-700">Educational articles, sitewide</td>
                  <td className="py-2.5 px-2 text-slate-700">Inside the report for one ZIP code</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Targeting</td>
                  <td className="py-2.5 px-2 text-slate-700">By topic, nationwide</td>
                  <td className="py-2.5 px-2 text-slate-700">By ZIP code + trade category</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Best for</td>
                  <td className="py-2.5 px-2 text-slate-700">Wide or multi-market service area</td>
                  <td className="py-2.5 px-2 text-slate-700">One specific ZIP code or metro area</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-slate-600">
          <span className="font-bold text-slate-900">Not sure which one? </span>
          If you'd take a customer from anywhere, National Ads reach more people for less per slot.
          If you only serve one town or ZIP code, ZIP-Targeted Report Ads put you in front of someone
          researching that exact address instead of a general topic -- worth the higher price for that
          precision. Nothing stops you from buying both.
        </div>
      </div>
    </div>
  );
};
