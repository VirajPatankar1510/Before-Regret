import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Wrench, MapPin, Check } from 'lucide-react';
import { MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';

interface AdvertiseCompareProps {
  onNavigate: (path: string) => void;
}

// The shared funnel entry point for both ad products -- linked from GuideAdSlot.tsx's
// recruitment CTA and from /advertise generally, so a vendor arriving from either source (or a
// direct link) sees both options before committing to one. Neither checkout page (GuideAdsCheckout,
// Vendors) explains the other product; this is deliberately the only place that does, so that
// explanation lives in one spot instead of drifting out of sync across two pages.
export const AdvertiseCompare: React.FC<AdvertiseCompareProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-10">
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

        <div className="space-y-3 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Two ways to reach BeforeRegret's buyers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Both are self-serve, open to any business, and paid up front with no subscription. The
            difference is reach and targeting -- pick whichever matches how your business actually
            gets customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guide page ads */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">Guide Page Ads</h2>
              <p className="text-xs text-slate-500">Best for businesses with broad or multi-market reach</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              $7.99 <span className="text-sm font-normal text-slate-500">/ slot, 30 days</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 flex-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Shown on educational guide pages, not tied to any one ZIP code -- readers researching that guide's topic nationwide</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Any business, any guide -- pick as many guide pages as you want in one checkout</span>
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
              <span>Advertise on Guides</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ZIP-targeted report ads */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">ZIP-Targeted Report Ads</h2>
              <p className="text-xs text-slate-500">Best for businesses with a specific local service area</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              $29 <span className="text-sm font-normal text-slate-500">/ slot, 30 days</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 flex-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Shown inside the actual property report for one specific ZIP code -- the buyer researching that exact address sees you</span>
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

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-slate-600">
          <span className="font-bold text-slate-900">Not sure which one? </span>
          If you'd take a customer from anywhere, guide-page ads reach more people for less per slot.
          If you only serve one town or ZIP code, ZIP-targeted ads put you in front of someone
          researching that exact address instead of a general topic -- worth the higher price for that
          precision. Nothing stops you from buying both.
        </div>
      </div>
    </div>
  );
};
