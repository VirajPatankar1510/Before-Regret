import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Wrench, MapPin, Check, Megaphone, Phone, ShieldCheck, CreditCard, XCircle, ListChecks, Zap, ChevronDown } from 'lucide-react';
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
// Exported so scripts/prerender-advertise.tsx can build this page's FAQPage JSON-LD directly from
// this array rather than a hand-copied duplicate -- the same drift risk buildCountyMeta in
// prerender-counties.tsx was written to avoid, here avoided by sharing the source instead.
export const ADVERTISE_FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Do I need to be licensed or verified to advertise?',
    a: "No -- we don't check your credentials before your placement goes live. Every trade category except chimney sweeping requires a licence, registration, or certification number at checkout; it prints on your ad exactly as you type it, but we don't verify it with any licensing board. Every placement tells readers its details are advertiser-supplied and unverified, and that includes chimney listings, which carry that same notice with no number since that category doesn't require one. Your business name, trade category, and contact details work the same way: you enter them, confirm they're accurate with a checkbox at checkout, and that's the only check that happens.",
  },
  {
    q: 'How many people will see my ad?',
    // Rewritten when click tracking shipped. The old answer ("we don't track impressions, clicks,
    // or leads") became false about clicks the moment /out/ started counting them, and leaving it
    // would have understated the one piece of evidence a vendor gets. The impressions half is still
    // true and still stated plainly: guide pages are served from a CDN, so views genuinely cannot
    // be measured here, and a page that claimed otherwise would be inventing a number in our own
    // favour. Deliberately does not promise a volume -- see the traffic sentence.
    a: "We report clicks, not impressions. Every time a reader taps your phone number or your website link we count it (once per person per day, bots excluded), and you'll see the running total on your My Placements page -- so at the end of 30 days you have a real number rather than a guess. We can't report how many times a page was viewed: guide pages are served from a cache that never touches our server, so any view count we showed you would be made up. We also don't guarantee a volume. This site is new and its traffic is still small; you're buying a fixed placement and an honest count of what it did.",
  },
  {
    q: 'Can I cancel or get a refund?',
    a: "No refunds once payment completes. There's nothing to cancel either way -- it's a single flat charge for a fixed 30-day window, not a subscription, so nothing bills you again automatically.",
  },
  {
    q: 'What happens when my placement expires?',
    a: "It simply stops showing and the slot reopens for other vendors.",
  },
  {
    q: 'Can I edit my listing after I’ve paid?',
    a: 'Yes -- phone and website can be changed any time from My Placements. Business name and trade category are locked once purchased, since those define what was sold.',
  },
  {
    q: 'Can I buy both Topic Ads and Report Ads?',
    a: "Yes. They reach people at different moments -- someone reading an article about a problem, versus someone pulling a report on one address -- so some vendors run both. If you only want one and you work a single metro, start with a county guide: it is the placement with readers already researching your area.",
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
          <ContentLink
            href="/"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </ContentLink>
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
              Put your number on the article your next customer is already reading -- including
              32 county guides covering permit lookups in the largest US metros. Self-serve, paid
              once, live within minutes, and we send you a real click count at the end of 30 days.
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
            { icon: ListChecks, step: '1', title: 'Pick a plan', body: 'Topic Ads put you on an article you choose -- a county permit guide if you work one metro, a national guide if you do not. Report Ads target 3 ZIP codes inside property reports.' },
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
                National or county
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">Topic Ads</h2>
              <p className="text-xs text-slate-500">Pick the exact articles your customers are reading</p>
            </div>
            {/* Two prices shown, not one. This card described a single flat rate until county
                guides became their own tier -- a local contractor reading "nationwide reach,
                $7.99" concluded this product wasn't for them and went to Report Ads, which is
                the opposite of the right answer now that 32 county guides exist. */}
            <div className="text-3xl font-black text-slate-900">
              $7.99 <span className="text-sm font-normal text-slate-500">/ national guide</span>
            </div>
            <div className="-mt-3 text-2xl font-black text-emerald-700">
              $29 <span className="text-sm font-normal text-slate-500">/ county guide, 30 days</span>
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
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">32 county guides</strong> cover permit lookups in the largest US metros -- Cook, Los Angeles, Maricopa, Harris, Miami-Dade and more. Everyone reading one is researching that county.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>119 national guides cover a single problem for readers anywhere -- a good fit if you serve many cities</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Any business, any article -- pick as many placements as you want in one checkout</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>One advertiser per article. When it's yours, nobody else appears on that page.</span>
              </li>
            </ul>
            <ContentLink
              href="/topic-ads"
              onNavigate={onNavigate}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise by Topic</span>
              <ArrowRight className="w-4 h-4" />
            </ContentLink>
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
            <ContentLink
              href="/report-ads"
              onNavigate={onNavigate}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Advertise by ZIP Code</span>
              <ArrowRight className="w-4 h-4" />
            </ContentLink>
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
                  <td className="py-2.5 px-2 font-bold text-slate-900">$7.99 national<br /><span className="text-emerald-700">$29 county</span></td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">$29 / 3 ZIPs</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Duration</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                  <td className="py-2.5 px-2 text-slate-700">30 days, no auto-renewal</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Where it appears</td>
                  <td className="py-2.5 px-2 text-slate-700">On the guide article you pick</td>
                  <td className="py-2.5 px-2 text-slate-700">Inside the report, for each of 3 ZIP codes</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Targeting</td>
                  <td className="py-2.5 px-2 text-slate-700">By article — county-specific or national</td>
                  <td className="py-2.5 px-2 text-slate-700">By ZIP code + trade category</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-slate-500 font-medium">Best for</td>
                  <td className="py-2.5 px-2 text-slate-700">Any service area — pick county guides if local</td>
                  <td className="py-2.5 px-2 text-slate-700">Up to 3 specific ZIP codes or a metro area</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-slate-600">
          {/* This used to send anyone with a local service area to Report Ads. That was written
              before county guides existed and is no longer the honest recommendation: Report Ads
              appear inside property reports, and the county guides are the placement with readers
              already researching a specific metro. Recommending by where the readers actually are
              matters more here than product symmetry. */}
          <span className="font-bold text-slate-900">Not sure which one? </span>
          If you work one metro, start with a <span className="font-semibold text-emerald-700">county guide</span> --
          it's the placement where every reader is researching that county, and there are 32 of them
          covering the largest US metros. If you'd take a customer from anywhere, a national guide reaches
          readers on one specific problem for $7.99. Report Ads are worth adding once you want to reach
          people pulling a full report on an exact address, rather than reading about a problem. Nothing
          stops you from buying more than one.
        </div>

        {/* FAQ -- closes the page on the honest answers a vendor would actually want before
            paying (no verification gate, no view guarantee, no refunds) rather than ending
            abruptly on the comparison table. */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-1">
          <h2 className="font-serif text-xl font-bold text-slate-900 mb-4">Questions before you buy</h2>
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
