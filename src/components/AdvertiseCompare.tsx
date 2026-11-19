import React, { useEffect } from 'react';
import { ArrowRight, ChevronRight, CreditCard, MapPin, Newspaper, Check, ClipboardList, ClipboardEdit, MousePointerClick } from 'lucide-react';
import { MAX_SLOTS_PER_ZIP_TRADE, TRADE_CATEGORIES, LICENCE_EXEMPT_CATEGORIES, canBuyReportAd, slotsPerZipPhrase } from '../data/sponsoredVendors';
import { ContentLink } from './home/ContentLink';
import { SponsoredVendorCard } from './SponsoredVendorCard';
import { GuideAdVendorCard } from './GuideAdSlot';
import stats from '../data/homeStats.json';

interface AdvertiseCompareProps {
  onNavigate: (path: string) => void;
}

// /advertise/ -- the one page that explains both ad products, linked from GuideAdSlot's recruitment
// card and from the footer. Neither checkout page (/topic-ads, /report-ads) explains the other
// product; this is deliberately the only place that does. Rendered by the live app AND by
// scripts/prerender-advertise.tsx, the same component both ways, so they cannot drift.
//
// 2026-10-04 REDESIGN, at the owner's direction, in the homepage's design system. THE PRODUCT
// MODEL IS THE OWNER'S, corrected on 2026-10-03 and not to be re-derived from older comments in
// src/server/adPricing.ts: REPORT ADS ARE THE LOCAL PRODUCT (ZIP-targeted, inside the property
// report for an address in the vendor's ZIPs). TOPIC ADS HAVE NO LOCATION TARGETING -- every reader
// of the article sees the ad wherever they are, county guides included -- so they are pitched to
// businesses that serve a wide area, never as the local option. The previous page told local trades
// to "start with a county guide" in five places; all five are gone.
//
// Rules this copy keeps, each learned the hard way:
// - NO COUNTS OF GUIDES, ZIPS OR READERS. A hand-typed "32 county guides" sat on this page for
//   weeks after the prune took the real figure to 11. Product names describe the inventory at any
//   size and cannot go stale.
// - NO AUDIENCE OR VIEW FIGURES, and no self-deprecating ones either (the owner removed "this site
//   is new and its traffic is still small" -- it read as a reason to leave). Guide views cannot be
//   measured: those pages are served from a cache that never reaches this server.
// - NO CLICK-REPORTING PROMISE. Clicks are recorded (adClicksApi.ts) but My Ads does not
//   show them to the vendor, so the page cannot offer it.
// - Report Ads appear only beside a report item that matches the trade, and items apply by house
//   age; the plumber example states its era ranges, read from the engine via homeStats.json rather
//   than typed here.
// - The example ads are the REAL components (SponsoredVendorCard, GuideAdVendorCard) with an
//   obviously fictional business, made inert, so the preview is what a reader actually sees.
// - Every link is a ContentLink / <a href>, so the static HTML carries real outgoing links.

const era = (id: string) => stats.eraRules.find((r) => r.id === id);
const GALV = era('galvanized_supply');
const PB = era('polybutylene_supply');
const PLUMBER_ERAS = GALV && PB ? `${GALV.minYear}–${GALV.maxYear} and ${PB.minYear}–${PB.maxYear}` : '';

// Exported so scripts/prerender-advertise.tsx builds this page's FAQPage JSON-LD from the same
// array the page renders -- one source, no hand-copied twin.
export const ADVERTISE_FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Which one is right for a local business?',
    a: `Report Ads. You choose 3 ZIP codes and your trade, and your listing appears inside the property report someone runs for an address in those ZIP codes. Topic Ads have no location targeting: everyone reading the article sees the ad, wherever they are, which suits a business that serves a wide area rather than a few neighborhoods.`,
  },
  {
    q: 'Where exactly does a Report Ad appear?',
    a: `Beside the item in the report that matches your trade. A plumber's listing, for example, sits beside the report's water supply pipe checks, and those checks appear on reports for houses built ${PLUMBER_ERAS}, so that is where a plumber is shown. Moving companies are the exception: their listing has a fixed spot right below the address, on reports for addresses in their ZIP codes. ${MAX_SLOTS_PER_ZIP_TRADE === 1 ? 'Only one business per trade is shown in each ZIP code, first come, first served.' : `Up to ${MAX_SLOTS_PER_ZIP_TRADE} businesses can hold the same ZIP code and trade at once.`}`,
  },
  {
    q: 'Do I need to be licensed or verified to advertise?',
    a: "No -- we don't check your credentials before your placement goes live. Every trade category except chimney sweeping and interior design requires a license, registration, or certification number when you add your business details after paying; it prints on your ad exactly as you type it, but we don't verify it with any licensing board. Every placement tells readers its details are advertiser-supplied and unverified, and that includes chimney sweep and interior designer listings, which carry that same notice with no number since those categories don't require one. Your business name, trade category, and contact details work the same way: you enter them, confirm they're accurate with a checkbox, and that's the only check that happens.",
  },
  {
    q: 'How many people will see my ad?',
    // Never invent an audience figure, and never reintroduce self-deprecating copy (owner,
    // 2026-10-03). Both statements below are true and checkable.
    // The last sentence is true because /out/ tags every forwarded click (src/server/adClicksApi.ts);
    // the card links carry noreferrer, so without that tag our visits would arrive as "direct".
    a: "We don't guarantee a number, and we won't make one up. A Report Ad is seen by whoever runs a report for an address in your ZIP codes. A Topic Ad is seen by everyone who reads that article. What you're buying is a fixed spot for 30 days. Website visits we send you show up in your own analytics as coming from beforeregret, so you can count them yourself.",
  },
  {
    q: 'What website can I list?',
    a: "Your business's own website, and only that. Link shorteners, link-in-bio pages, redirects and tracking links are not accepted, when you add your details or when you edit a listing later. Readers click through trusting the page, so the link has to go straight to you. We add a 'beforeregret' tag to the link when a reader clicks it, so those visits show up in your analytics. The website is optional; a phone number alone is fine.",
  },
  {
    q: 'What do I fill in, and when?',
    a: 'Before paying, only what you are buying: the articles, or your trade and 3 ZIP codes. After paying with PayPal you add your business name, phone number, website if you have one, and license number if your trade needs one, in My Ads. Your ad goes live as soon as you save them.',
  },
  {
    q: 'When do my 30 days start?',
    a: 'When your ad goes live, which is when you save your business details. Until then your spot is held for you. If details are never added, the hold ends 30 days after payment and the spot reopens.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. You sign in with your email when you buy, so that only you can add and manage your ad details in My Ads afterwards.',
  },
  {
    q: 'Can I cancel or get a refund?',
    a: "No refunds once payment completes. There's nothing to cancel either way -- it's a single flat charge for a fixed 30-day window, not a subscription, so nothing bills you again automatically.",
  },
  {
    q: 'What happens when my placement expires?',
    a: 'It simply stops showing and the slot reopens for other businesses. While it is still running you can renew it from My Ads; once it has ended, you can buy it again there if the slot is still free.',
  },
  {
    q: 'Can I edit my listing after I’ve paid?',
    a: 'Yes, once. From My Ads you can change your phone, website and license number one time per placement, so check them before you save. Business name and trade category are locked once purchased, since those define what was sold.',
  },
];

const EXAMPLE_REPORT_VENDOR = {
  id: 'example',
  zipCode: '00000',
  businessName: 'Example Plumbing Co.',
  tradeCategory: 'Plumber',
  phone: '(512) 555-0100',
  active: true,
};

// A wide-area business on an article about the problem it solves (Topic Ads are not the local
// product). The title in the mockup below is live guide #331's.
const EXAMPLE_TOPIC_VENDOR = {
  businessName: 'Example Stucco Inspections',
  tradeCategory: 'Stucco & EIFS',
  phone: '(512) 555-0100',
};

/** A real ad card, made inert: no taps, no tab stops, no dialling, no click beacons from a demo.
 *  `inert` takes the card's links out of the keyboard order too, which aria-hidden alone does not. */
const Inert: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div role="img" aria-label={label} className="pointer-events-none select-none">
    <div aria-hidden="true" inert>{children}</div>
  </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode; tone?: string }> = ({ children, tone = 'text-home-brass' }) => (
  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${tone}`}>{children}</p>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2.5">
    <Check className="w-4 h-4 text-home-moss shrink-0 mt-0.5" aria-hidden="true" />
    <span>{children}</span>
  </li>
);

export const AdvertiseCompare: React.FC<AdvertiseCompareProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink">
      {/* Breadcrumbs -- the same two steps as the BreadcrumbList schema. */}
      <div className="border-b border-home-linen bg-white/70">
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-home-ink font-semibold">Advertise With Us</span>
        </nav>
      </div>

      {/* Hero: the vendor's question first -- which of the two fits my business. */}
      <section className="relative overflow-hidden bg-home-navy text-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <Eyebrow tone="text-home-oak">Advertise with Before Regret</Eyebrow>
            <h1 className="mt-4 font-serif text-[2.3rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-semibold tracking-[-0.01em] [text-wrap:balance]">
              Put your business where home buyers do their research
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Pick a placement and pay with PayPal in about a minute. Add your business details
              after, and your ad goes live. 30 days, no subscription.
            </p>
            {/* A vendor who has never heard of the site needs to know what it is before anything
                else, and the honest proof we can offer is the report itself, not a traffic figure. */}
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Before Regret is a free research site for home buyers. They type in an address and get a
              report on what to check, ask and verify before they buy.{' '}
              <ContentLink href="/" onNavigate={onNavigate} className="font-semibold text-home-oak underline underline-offset-4 hover:text-white">
                Run one on a street you serve →
              </ContentLink>{' '}
              and you'll see where your listing would sit.
            </p>
            <ol className="mt-7 flex flex-wrap gap-2.5 text-xs font-semibold text-slate-200">
              {[
                { icon: MousePointerClick, t: 'Choose' },
                { icon: CreditCard, t: 'Pay with PayPal' },
                { icon: ClipboardEdit, t: 'Add your details. You’re live.' },
              ].map(({ icon: Icon, t }, i) => (
                <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  <span className="w-4 h-4 rounded-full bg-home-oak text-home-navy text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                  <Icon className="w-3.5 h-3.5 text-home-oak" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ol>
          </div>

          {/* The fork. Each card goes straight to its checkout (owner, 2026-11-15: read the banner,
              click, buy). The sections below still explain both for anyone who scrolls. */}
          <div className="grid grid-cols-1 gap-4">
            <ContentLink href="/report-ads/" onNavigate={onNavigate} className="group block rounded-3xl bg-white text-home-ink p-6 sm:p-7 shadow-xl hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-home-moss">
                  <MapPin className="w-4 h-4" aria-hidden="true" /> I serve specific ZIP codes
                </span>
                <ArrowRight className="w-5 h-5 text-home-oak transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
              <div className="mt-3 font-serif text-2xl font-semibold">Report Ads</div>
              <div className="mt-1 text-sm text-slate-600">$29 for 3 ZIP codes, 30 days</div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-home-navy px-4 py-2.5 text-sm font-bold text-white">Buy now</div>
            </ContentLink>
            <ContentLink href="/topic-ads/" onNavigate={onNavigate} className="group block rounded-3xl bg-white/10 border border-white/15 text-white p-6 sm:p-7 hover:bg-white/15 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-home-oak">
                  <Newspaper className="w-4 h-4" aria-hidden="true" /> I serve a wide area
                </span>
                <ArrowRight className="w-5 h-5 text-home-oak transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
              <div className="mt-3 font-serif text-2xl font-semibold">Topic Ads</div>
              <div className="mt-1 text-sm text-slate-300">$9.99 per article, 30 days</div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-home-navy">Buy now</div>
            </ContentLink>
          </div>
        </div>
      </section>

      {/* Report Ads -- the local product. */}
      <section id="report-ads" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <Eyebrow tone="text-home-moss">For local trades</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold tracking-tight">Report Ads</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
              When someone runs a property report for an address in one of your ZIP codes, your
              listing appears inside it, beside the item that matches your trade.
            </p>
            <div className="mt-6 font-serif text-4xl font-semibold text-home-navy">
              $29 <span className="font-sans text-base font-medium text-slate-500">for 3 ZIP codes, 30 days</span>
            </div>
            <ul className="mt-6 space-y-3 text-[15px] text-slate-700 leading-relaxed">
              <Bullet>Choose any 3 US ZIP codes and one trade per bundle.</Bullet>
              <Bullet>{slotsPerZipPhrase()}, first come, first served.</Bullet>
              <Bullet>Shown beside the report item for your trade, so placement depends on what the report covers for that house.</Bullet>
              <Bullet>Your license number prints on the listing, with a line telling readers it is advertiser-supplied.</Bullet>
            </ul>
            <ContentLink
              href="/report-ads/"
              onNavigate={onNavigate}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-home-navy hover:bg-home-ink text-white text-sm font-bold rounded-xl shadow-lg transition-colors"
            >
              Buy now: choose ZIP codes <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </ContentLink>
          </div>

          {/* A slice of a report, with the real Report Ad card in it. */}
          <figure className="rounded-3xl bg-white border border-home-linen shadow-sm p-5 sm:p-7">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inside a property report</div>
            <div className="mt-3 rounded-2xl border border-home-linen bg-home-stone/60 p-4 sm:p-5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-home-brass">
                <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> Inspection priority
              </div>
              <div className="mt-1.5 text-base font-bold text-home-ink">{GALV?.title}</div>
              <div aria-hidden="true" className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-home-linen w-full" />
                <div className="h-2 rounded-full bg-home-linen w-4/5" />
              </div>
              <div className="mt-4">
                <Inert label="Example Report Ad: a plumber's listing with a phone number, beside the supply pipe check">
                  <SponsoredVendorCard vendor={EXAMPLE_REPORT_VENDOR} />
                </Inert>
              </div>
            </div>
            <figcaption className="mt-3 text-xs text-slate-500 leading-relaxed">
              Example business. This is the same card readers see in a report.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Topic Ads -- the wide-area product. */}
      <section id="topic-ads" className="scroll-mt-24 bg-white border-y border-home-linen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <figure className="order-2 lg:order-1 rounded-3xl bg-home-stone border border-home-linen p-5 sm:p-7">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On a guide article</div>
            <div className="mt-3 rounded-2xl bg-white border border-home-linen p-4 sm:p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-home-brass">Guide</div>
              <div className="mt-1.5 font-serif text-xl font-semibold text-home-ink leading-snug">Should You Buy a House With EIFS? What to Check First</div>
              <div aria-hidden="true" className="mt-3 rounded-xl border border-home-linen p-3 space-y-2">
                <div className="h-2 rounded-full bg-home-sage w-24" />
                <div className="h-2 rounded-full bg-home-linen w-full" />
                <div className="h-2 rounded-full bg-home-linen w-11/12" />
              </div>
              <div className="mt-4">
                <Inert label="Example Topic Ad: a stucco inspection firm's listing with a phone number, under the article's quick answer">
                  <GuideAdVendorCard vendor={EXAMPLE_TOPIC_VENDOR} />
                </Inert>
              </div>
            </div>
            <figcaption className="mt-3 text-xs text-slate-500 leading-relaxed">
              Example business. This is the same card readers see under the article's quick answer.
            </figcaption>
          </figure>

          <div className="order-1 lg:order-2">
            <Eyebrow>For businesses that serve a wide area</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold tracking-tight">Topic Ads</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
              Your listing on an article about the problem your business solves, directly under the
              article's quick answer. Everyone who reads that article sees it, wherever they are.
            </p>
            <div className="mt-6 font-serif text-4xl font-semibold text-home-navy">
              $9.99 <span className="font-sans text-base font-medium text-slate-500">per article, 30 days</span>
            </div>
            <ul className="mt-6 space-y-3 text-[15px] text-slate-700 leading-relaxed">
              <Bullet>One advertiser per article. While it is yours, nobody else appears on that page.</Bullet>
              <Bullet>No location targeting: the ad shows to every reader of the article, county guides included.</Bullet>
              <Bullet>Pick as many articles as you like in one checkout, each for 30 days.</Bullet>
            </ul>
            <ContentLink
              href="/topic-ads/"
              onNavigate={onNavigate}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-home-navy text-home-navy hover:bg-home-stone text-sm font-bold rounded-xl transition-colors"
            >
              Buy now: choose articles <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </ContentLink>
          </div>
        </div>
      </section>

      {/* How buying works -- a real sequence, so the numbers mean something. */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Pay in a minute, no sales call</h2>
          <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: 'Choose', b: 'Your trade and 3 ZIP codes for a Report Ad, or the articles you want for Topic Ads.' },
              { t: 'Pay with PayPal', b: 'Sign in with your email and pay once. No subscription, nothing renews automatically.' },
              { t: 'Add your details', b: 'Business name, phone and license number, in My Ads. Your ad goes live, and your 30 days start.' },
            ].map((s, i) => (
              <li key={s.t} className="rounded-3xl bg-white border border-home-linen p-6 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-home-navy text-white font-bold text-sm flex items-center justify-center">{i + 1}</div>
                <div className="mt-4 text-base font-bold text-home-ink">{s.t}</div>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trades. Both checkouts sell to these categories only. */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>Who can advertise</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Trades we list</h2>
          <p className="mt-4 max-w-2xl text-base text-slate-700 leading-relaxed">
            Both ad types are open to businesses in these trades, except those marked Topic Ads only:
            no report section covers them yet, so a Report Ad would have nowhere to show. Every trade
            except {[...LICENCE_EXEMPT_CATEGORIES].map((c) => c.toLowerCase()).join(' and ')} asks for a
            license, registration or certification number when you add your details.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {TRADE_CATEGORIES.map((c) => (
              <li key={c} className="rounded-full bg-white border border-home-linen px-4 py-2 text-sm font-semibold text-home-ink">
                {c}
                {!canBuyReportAd(c) && <span className="ml-1.5 text-xs font-medium text-slate-500">· Topic Ads only</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ, open: the honest answers a business wants before paying. */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Questions before you buy</h2>
          <div className="mt-6 divide-y divide-home-linen">
            {ADVERTISE_FAQ_ITEMS.map((item) => (
              <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-base font-bold text-home-ink">{item.q}</h3>
                <p className="mt-2 text-[15px] text-slate-700 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing: both doors again, and the real mailbox. */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden max-w-6xl mx-auto rounded-[2rem] bg-home-navy text-white p-8 sm:p-14 shadow-2xl">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Ready when you are</h2>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Questions first? Email <a href="mailto:hello@beforeregret.com" className="text-home-oak underline underline-offset-2 hover:text-white">hello@beforeregret.com</a>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
              <ContentLink href="/report-ads/" onNavigate={onNavigate} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-home-navy font-bold text-sm rounded-xl hover:bg-home-stone transition-colors">
                Report Ads: choose ZIP codes <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </ContentLink>
              <ContentLink href="/topic-ads/" onNavigate={onNavigate} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors">
                Topic Ads: choose articles <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </ContentLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
