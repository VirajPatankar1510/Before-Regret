import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ClipboardEdit, CreditCard, MapPin, ClipboardList } from 'lucide-react';
import { MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';
import { VendorSignupForm } from './VendorSignupForm';
import { SponsoredVendorCard } from './SponsoredVendorCard';

interface VendorsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'What do I fill in after paying?',
    a: 'Your business name, a phone number readers can call, and your website if you have one. You add them in My Ads right after PayPal, and your ad goes live as soon as you save them. If your trade needs a license number, we ask for it before you pay, so you can finish without getting stuck.',
  },
  {
    q: 'Can my ad show my price?',
    a: "Yes, if you want it to. Trades that do a check before closing can show their price for it (for example \"Electrical evaluation: $195\" or \"Home inspection from $350\"), so buyers know before they call that it isn't a free quote, and whether it is credited toward the work. Any Report Ad can also show the days and hours someone answers the phone, and whether buyers can text. All of it is optional, and you can change it any time in My Ads without using up your one contact edit.",
  },
  {
    q: 'When do my 30 days start?',
    a: 'When your ad goes live, which is when you save your business details. Until then your 3 ZIP codes are held for you. If details are never added, the hold ends 30 days after payment and the ZIP codes reopen.',
  },
  {
    q: 'Where does my ad appear?',
    a: 'Inside the property report someone runs for an address in one of your ZIP codes, beside the report item that matches your trade, so where it lands depends on what the report covers for that house. Home inspectors, movers, real estate agents and interior designers get their own box on every report in their ZIP codes instead. A home inspector\'s sits right after the list of what to check.',
  },
  {
    q: MAX_SLOTS_PER_ZIP_TRADE === 1 ? 'Why only one business per ZIP and trade?' : `Why only ${MAX_SLOTS_PER_ZIP_TRADE} businesses per ZIP and trade?`,
    a: MAX_SLOTS_PER_ZIP_TRADE === 1
      ? 'So the business shown is the only one in its trade for that ZIP, not one of a list. First come, first served: a ZIP opens again when the current ad ends.'
      : 'So each slot means something instead of turning into a directory. First come, first served: a slot opens again when an ad ends.',
  },
  {
    q: 'How many views or leads will I get?',
    a: "We don't guarantee views, clicks, calls or business outcomes. It depends on how many reports people run in your ZIP codes.",
  },
  {
    q: 'Do you verify businesses?',
    a: "No. Your details are self-reported. Every ad is labeled Sponsored, and the report tells readers that sponsored listings are paid placements whose details we don't verify. Your license number prints on the ad exactly as you enter it, so readers can check it themselves.",
  },
  {
    q: 'Is this a subscription? Can I get a refund?',
    a: "It's a single flat charge for 30 days. Nothing bills you again automatically. There are no refunds once payment completes.",
  },
];

const EXAMPLE_VENDOR = {
  id: 'example',
  zipCode: '00000',
  businessName: 'Example Plumbing Co.',
  tradeCategory: 'Plumber',
  phone: '(512) 555-0100',
  active: true,
  // Shows the optional extras (src/data/vendorCardExtras.ts) so advertisers see what they can add.
  cardExtras: {
    evalFeeUsd: 175,
    evalFeeCredited: true,
    phoneHours: { days: ['mon', 'tue', 'wed', 'thu', 'fri'] as Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri'>, from: 7 * 60, to: 18 * 60 },
    textsOk: true,
  },
};

// /report-ads/ -- REBUILT 2026-11-15 after the owner's vendor survey said the old page was long and
// hard to follow before PayPal. The buy box now sits in the hero, beside the price and the three
// steps; a vendor can choose, check and pay without scrolling. The explanations that used to come
// first (three value cards, a pricing table, a disclaimer box) are folded into short FAQ answers
// below, which keep every honest statement the old page made: no verification, no view guarantee,
// no refunds, one business per ZIP and trade.
export const Vendors: React.FC<VendorsProps> = ({ onBackToHome, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    { icon: MapPin, t: 'Pick your trade and 3 ZIP codes' },
    { icon: CreditCard, t: 'Pay with PayPal' },
    { icon: ClipboardEdit, t: 'Add your details. You’re live.' },
  ];

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink">
      <section className="relative overflow-hidden bg-home-navy text-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,28rem)] gap-8 lg:gap-12 items-start">
          <div>
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/advertise/') : onBackToHome())}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All ad options
            </button>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-home-oak">Report Ads · for local trades</p>
            <h1 className="mt-3 font-serif text-[2rem] leading-[1.1] sm:text-5xl font-semibold tracking-[-0.01em] [text-wrap:balance]">
              {/* "Own" is literal only while one business per trade per ZIP is the rule. */}
              {MAX_SLOTS_PER_ZIP_TRADE === 1
                ? 'Own your trade in the home reports for your ZIP codes'
                : 'Put your business in the home reports for your ZIP codes'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              <span className="font-semibold text-white">$29 for 3 ZIP codes</span>, 30 days. No subscription.
            </p>
            <ol className="mt-6 space-y-2.5">
              {steps.map(({ icon: Icon, t }, i) => (
                <li key={t} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="w-7 h-7 rounded-full bg-home-oak text-home-navy text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <Icon className="w-4 h-4 text-home-oak shrink-0" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="text-home-ink">
            <VendorSignupForm />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <section className="rounded-3xl bg-white border border-home-linen p-5 sm:p-7">
          <h2 className="font-serif text-xl font-semibold">How your ad looks</h2>
          <p className="mt-1 text-sm text-slate-600">Inside a property report, beside the item that matches your trade. Example business:</p>
          <div className="mt-4 rounded-2xl border border-home-linen bg-home-stone/60 p-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-home-brass">
              <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> Inspection priority
            </div>
            <div aria-hidden="true" className="mt-2 space-y-2">
              <div className="h-2 rounded-full bg-home-linen w-full" />
              <div className="h-2 rounded-full bg-home-linen w-4/5" />
            </div>
            <div className="mt-4 pointer-events-none select-none" role="img" aria-label="Example Report Ad: a plumber's listing with a visit price, phone hours and a phone number inside a property report">
              <div aria-hidden="true" inert>
                <SponsoredVendorCard vendor={EXAMPLE_VENDOR} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-home-linen p-5 sm:p-7">
          <h2 className="font-serif text-xl font-semibold">Questions</h2>
          <div className="mt-3 divide-y divide-home-linen">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {isOpen && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
