import React, { useEffect, useState } from 'react';
import {
  Building2, ArrowLeft, Check, Sparkles, MapPin, Target,
  HelpCircle, Phone, ExternalLink, Megaphone, ChevronDown
} from 'lucide-react';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';
import { VendorSignupForm } from './VendorSignupForm';

interface VendorsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Do you verify businesses before listing them?',
    a: 'No -- this is self-serve. Business name, trade category, and contact details are self-reported at checkout, and you confirm they\'re accurate with a checkbox there, but nothing is independently verified on our end.',
  },
  {
    q: 'How many views or leads will I get?',
    a: "We don't guarantee a specific number of views, clicks, calls, or business outcomes -- visibility depends on how many reports get generated in your selected ZIP codes.",
  },
  {
    q: 'Can I cancel or get a refund?',
    a: "No refunds once payment completes. There's nothing to cancel either way -- it's a flat 30-day charge, not a subscription.",
  },
  {
    q: 'What happens when my placement expires?',
    a: 'Your slot reopens automatically for other vendors.',
  },
  {
    q: 'Can I edit my listing after I’ve paid?',
    a: 'Yes -- phone and website can be updated any time from My Placements. Business name and trade category are locked once purchased.',
  },
  {
    q: `Why only ${MAX_SLOTS_PER_ZIP_TRADE} businesses per ZIP and trade?`,
    a: "Keeps each slot meaningful instead of turning into a directory -- first come, first served, and a slot only opens up once someone's window expires or they're removed.",
  },
];

export const Vendors: React.FC<VendorsProps> = ({ onBackToHome, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleReturnHome = () => {
    if (onNavigate) onNavigate('/');
    else onBackToHome();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => (onNavigate ? onNavigate('/advertise') : handleReturnHome())}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Comparison</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
            Report Ads
          </span>
        </div>

        {/* Hero Banner */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-mono font-bold text-blue-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Local Business Placements</span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight">
              Put your business in front of people actively researching properties in your ZIP codes.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Your placement runs inside the actual property report someone is reading for that address -- not a banner they scroll past.
            </p>
          </div>
        </div>

        {/* Three Core Value Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Prominent, Not Buried</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Your placement appears near the top of every report generated for any of your ZIP codes -- right after the summary, not scattered in a directory or buried at the bottom of the page.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">High-Intent Audience</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Every report is generated by someone actively researching a specific address -- comparing homes, preparing an offer, or scheduling an inspection. That's a meaningfully higher-intent visitor than a generic display ad ever reaches.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Zip-Code Precision</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              You choose exactly which zip codes you appear in. No spend on areas outside your service territory.
            </p>
          </div>

        </div>

        {/* Visual Example of Sponsored Block */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Visual Placement Preview</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">How Placements Appear in Reports</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              This is exactly what your placement looks like inside a real report -- same component, same fields:
            </p>
          </div>

          {/* Mirrors SponsoredVendorCard.tsx exactly -- same fields, same layout, so this
              preview can never drift from what actually renders in a live report. */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-2xl mx-auto">
            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                <Megaphone className="w-3 h-3" />
                <span>Sponsored -- Roof Inspection</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Apex Roofing &amp; Inspection LLC</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                <Phone className="w-3.5 h-3.5" />
                <span>(512) 555-0100</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Trade Categories Available */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Available Trade Categories</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Any business in these categories can buy a placement -- trade and business details are self-reported
              at checkout, not independently verified by us.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-bold text-slate-800">
            {TRADE_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">Simple, Flat Pricing</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Three ZIP codes, one trade category, one price. No tiers, no subscription.
            </p>
          </div>

          <div className="max-w-sm mx-auto border-2 border-blue-600 rounded-2xl p-8 space-y-5 bg-white shadow-md text-center">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">Per Bundle, Per Trade</div>
            <div className="text-4xl font-black text-slate-900">$29 <span className="text-sm font-normal text-slate-500">for 3 ZIP codes / 30 days</span></div>
            <div className="text-xs text-slate-500">Less than $1/day, across all 3 ZIP codes</div>
            <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-200 text-left">
              <li className="flex items-center gap-2">✓ Pick any 3 ZIP codes at checkout, one trade category</li>
              <li className="flex items-center gap-2">✓ Only {MAX_SLOTS_PER_ZIP_TRADE} businesses shown per trade category, per ZIP</li>
              <li className="flex items-center gap-2">✓ First come, first served</li>
              <li className="flex items-center gap-2">✓ Pay once, no auto-renewal -- buy another window any time to keep your slots</li>
              <li className="flex items-center gap-2">✓ No refunds once payment completes</li>
            </ul>
          </div>
        </div>

        {/* Vendor Signup Form -- above the FAQ, so the primary action (claiming ZIPs) is what
            greets someone ready to buy, with the honest answers (no verification, no view
            guarantee, no refunds) right underneath for anyone who scrolls down still unsure. */}
        <VendorSignupForm />

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

        {/* Disclaimer / What is NOT Guaranteed */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Placement Performance Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            BeforeRegret does not guarantee a specific number of views, clicks, calls, or business outcomes from a sponsored placement. Placement visibility depends on report generation volume in your selected zip codes.
          </p>
        </div>

      </div>
    </div>
  );
};
