import React, { useEffect, useState } from 'react';
import { ChevronRight, Search, Loader2, Phone, Globe, MapPin, Wrench, ArrowRight, BadgeCheck } from 'lucide-react';
import { TRADE_CATEGORIES } from '../data/sponsoredVendors';
import { ContentLink } from './home/ContentLink';
import { SponsoredVendorCards } from './SponsoredVendorCard';
import type { SponsoredVendor } from '../types';
import { applyHeadSeo } from '../utils/headSeo';

// Find a Pro (owner decisions, 2026-10-18): a free directory where businesses list themselves and buyers
// search by ZIP and trade. Paid Report Ads for the searched ZIP appear first (featured); free listings
// follow. Free listings are never shown inside property reports -- that space belongs to paid vendors.
// Server side: src/server/proListingsApi.ts.

export interface ProListing {
  slug: string;
  businessName: string;
  tradeCategory: string;
  zipCodes: string[];
  city: string | null;
  state: string | null;
  phone: string;
  website: string | null;
  licenceNumber: string | null;
  description: string | null;
  listedSince: string;
  /** Complete listing (80+ character description): open to Google. Otherwise noindex. */
  indexable?: boolean;
}

interface Props { onNavigate: (path: string) => void }

const Crumbs: React.FC<Props & { here: string; mid?: boolean }> = ({ onNavigate, here, mid }) => (
  <div className="border-b border-home-linen bg-white/70">
    <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      {mid && (
        <>
          <ContentLink href="/pros/" onNavigate={onNavigate} className="hover:text-home-ink">Find a Pro</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        </>
      )}
      <span className="text-home-ink font-semibold">{here}</span>
    </nav>
  </div>
);

const Disclosure: React.FC = () => (
  <p className="text-[11px] text-slate-500 leading-relaxed">
    Listings are created by the businesses themselves. Details are supplied by the business and not verified by
    Before Regret -- <a href="/disclaimer/" className="underline hover:text-slate-700">check any licence yourself</a> before you hire.
    Wrong details, or a listing for your business that you didn't make? Write to{' '}
    <a href="mailto:hello@beforeregret.com" className="underline hover:text-slate-700">hello@beforeregret.com</a>.
  </p>
);

const area = (l: ProListing) => [l.city, l.state].filter(Boolean).join(', ');

/** One free listing, as it appears in the directory. Neutral styling on purpose: featured (paid) cards are amber. */
export const ProListingCard: React.FC<{ listing: ProListing; onNavigate: (p: string) => void }> = ({ listing, onNavigate }) => (
  <article className="bg-white border border-home-linen rounded-2xl p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-full bg-home-stone flex items-center justify-center">
          <Wrench className="w-4 h-4 text-home-moss" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{listing.tradeCategory}</div>
          <ContentLink href={`/pros/${listing.slug}/`} onNavigate={onNavigate} className="block text-base font-bold text-slate-900 hover:text-blue-700">
            {listing.businessName}
          </ContentLink>
          {area(listing) && (
            <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />Serves {area(listing)}</div>
          )}
          {listing.licenceNumber && <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Licence #{listing.licenceNumber}</div>}
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
        <a href={`tel:${listing.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
          <Phone className="w-3.5 h-3.5" aria-hidden="true" /><span>{listing.phone}</span>
        </a>
        {listing.website && (
          <a href={listing.website} target="_blank" rel="nofollow ugc noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
            <Globe className="w-3 h-3" aria-hidden="true" /><span>Website</span>
          </a>
        )}
      </div>
    </div>
    {listing.description && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{listing.description}</p>}
  </article>
);

const JoinBox: React.FC<Props & { line?: string }> = ({ onNavigate, line }) => (
  <div className="rounded-2xl border border-home-linen bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div className="font-serif text-lg font-semibold text-home-ink">Are you a pro?</div>
      <p className="text-sm text-slate-600 mt-1">{line || 'Get your business listed free, so buyers in your area can find you.'}</p>
    </div>
    <ContentLink href="/pros/join/" onNavigate={onNavigate} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-home-navy hover:opacity-90 text-white text-sm font-bold rounded-xl shrink-0">
      <span>Get listed free</span><ArrowRight className="w-4 h-4" aria-hidden="true" />
    </ContentLink>
  </div>
);

export const FindAProHub: React.FC<Props> = ({ onNavigate }) => {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [zip, setZip] = useState(params.get('zip') || '');
  const [trade, setTrade] = useState(params.get('trade') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ zip: string; area: { city: string; state: string } | null; featured: SponsoredVendor[]; listings: ProListing[] } | null>(null);

  const search = async (z: string, t: string) => {
    setError(null);
    if (!/^\d{5}$/.test(z)) { setError('Enter a 5-digit ZIP code.'); return; }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ zip: z, ...(t ? { trade: t } : {}) }).toString();
      window.history.replaceState(null, '', `/pros/?${qs}`);
      const res = await fetch(`/api/pros?${qs}`);
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data?.error || 'Could not search right now.'); setResult(null); return; }
      setResult({ zip: z, area: data.area, featured: data.featured || [], listings: data.listings || [] });
    } catch {
      setError('Could not search right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (/^\d{5}$/.test(zip)) search(zip, trade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const where = result?.area ? `${result.area.city}, ${result.area.state}` : result ? `ZIP ${result.zip}` : '';
  const total = result ? result.featured.length + result.listings.length : 0;

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink">
      <Crumbs onNavigate={onNavigate} here="Find a Pro" />
      <section className="bg-home-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-oak">Find a Pro</p>
          <h1 className="mt-3 font-serif text-[2.1rem] leading-[1.1] sm:text-5xl font-semibold [text-wrap:balance]">
            Local pros for the house you&apos;re buying
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Inspectors, contractors and specialists who serve the area, for the checks and quotes you need before closing.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); search(zip, trade); }}
            className="mt-7 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3 max-w-3xl"
          >
            <input
              type="text" inputMode="numeric" placeholder="ZIP code" aria-label="ZIP code" value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="px-4 py-3 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-home-oak"
            />
            <select
              value={trade} onChange={(e) => setTrade(e.target.value)} aria-label="Type of pro"
              className="px-4 py-3 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-home-oak"
            >
              <option value="">Any type of pro</option>
              {TRADE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-home-oak hover:opacity-90 text-home-navy text-sm font-bold rounded-xl disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}<span>Search</span>
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {result && total > 0 && (
          <>
            <h2 className="font-serif text-2xl font-semibold">Pros serving {where}{trade ? ` -- ${trade}` : ''}</h2>
            {result.featured.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4" />Featured</div>
                <SponsoredVendorCards vendors={result.featured} />
              </div>
            )}
            {result.listings.length > 0 && (
              <div className="space-y-3">
                {result.featured.length > 0 && <div className="text-xs font-bold uppercase tracking-wider text-slate-500">More pros in the area</div>}
                {result.listings.map((l) => <ProListingCard key={l.slug} listing={l} onNavigate={onNavigate} />)}
              </div>
            )}
            <Disclosure />
            <JoinBox onNavigate={onNavigate} line={`Serve ${where}? Get your business listed free.`} />
          </>
        )}

        {result && total === 0 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-home-linen bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">No pros listed for {where}{trade ? ` (${trade})` : ''} yet</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Find a Pro is new, and businesses are adding themselves area by area. In the meantime, the free report for the
                house tells you what to check and what to ask the seller.
              </p>
              <ContentLink href="/" onNavigate={onNavigate} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
                <span>Get a free report for the address</span><ArrowRight className="w-4 h-4" />
              </ContentLink>
            </div>
            <JoinBox onNavigate={onNavigate} line={`Serve ${where}? Be the first pro listed there -- it's free.`} />
          </div>
        )}

        {!result && !loading && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Search by ZIP', 'Enter the ZIP of the house you are buying, and pick a type of pro if you like.'],
                ['Call them directly', 'Every listing shows a phone number. No forms, no middleman, no fees for you.'],
                ['Check them yourself', 'Listings are written by the businesses. Verify any licence with your state before you hire.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-white border border-home-linen p-5">
                  <div className="font-bold text-home-ink">{t}</div>
                  <p className="mt-1 text-slate-600 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
            <JoinBox onNavigate={onNavigate} />
          </div>
        )}
      </section>
    </div>
  );
};

export const ProProfile: React.FC<Props & { slug: string }> = ({ onNavigate, slug }) => {
  // server.ts writes the listing into the page (window.__PRO_LISTING__) so it renders at once.
  const injected = typeof window !== 'undefined' ? (window as unknown as { __PRO_LISTING__?: ProListing }).__PRO_LISTING__ : undefined;
  const [listing, setListing] = useState<ProListing | null | undefined>(injected && injected.slug === slug ? injected : undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (listing && listing.slug === slug) return;
    let cancelled = false;
    fetch(`/api/pros/listing/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setListing(d?.success ? d.listing : null); })
      .catch(() => { if (!cancelled) setListing(null); });
    return () => { cancelled = true; };
  }, [slug]);

  // This page owns its head tags (App.tsx deliberately leaves the proProfile route alone): a COMPLETE
  // listing is open to Google, anything else is noindex -- the same rule server.ts applies to the raw HTML.
  useEffect(() => {
    if (listing === undefined) return;
    if (!listing) {
      applyHeadSeo({ title: 'Listing not available | Find a Pro | Before Regret', description: 'This Find a Pro listing is not available.', canonicalUrl: `https://www.beforeregret.com/pros/${slug}/`, robotsDirective: 'noindex, nofollow' });
      return;
    }
    const where = area(listing);
    applyHeadSeo({
      title: `${listing.businessName} -- ${listing.tradeCategory}${where ? ` in ${where}` : ''} | Find a Pro`,
      description: (listing.description || `${listing.businessName}, ${listing.tradeCategory.toLowerCase()}${where ? ` serving ${where}` : ''}. Listed in Find a Pro on Before Regret.`).slice(0, 155),
      canonicalUrl: `https://www.beforeregret.com/pros/${listing.slug}/`,
      robotsDirective: listing.indexable ? 'index, follow' : 'noindex, nofollow',
    });
  }, [listing, slug]);

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink">
      <Crumbs onNavigate={onNavigate} here={listing?.businessName || 'Listing'} mid />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {listing === undefined && <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}
        {listing === null && (
          <div className="rounded-2xl border border-home-linen bg-white p-8 text-center space-y-3">
            <h1 className="font-serif text-2xl font-semibold">This listing isn&apos;t available</h1>
            <p className="text-sm text-slate-600">It may have been removed by the business.</p>
            <ContentLink href="/pros/" onNavigate={onNavigate} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
              <span>Search Find a Pro</span><ArrowRight className="w-4 h-4" />
            </ContentLink>
          </div>
        )}
        {listing && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-home-linen p-6 sm:p-8 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-home-moss">{listing.tradeCategory}</div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">{listing.businessName}</h1>
              {area(listing) && (
                <p className="text-sm text-slate-600 inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" aria-hidden="true" />Serves {area(listing)} (ZIP {listing.zipCodes.join(', ')})</p>
              )}
              {listing.description && <p className="text-base text-slate-700 leading-relaxed">{listing.description}</p>}
              {listing.licenceNumber && <p className="text-xs text-slate-500 font-mono">Licence #{listing.licenceNumber}</p>}
              <div className="flex flex-wrap gap-3 pt-1">
                <a href={`tel:${listing.phone}`} className="inline-flex items-center gap-2 px-5 py-3 bg-home-navy text-white text-sm font-bold rounded-xl hover:opacity-90">
                  <Phone className="w-4 h-4" aria-hidden="true" /><span>{listing.phone}</span>
                </a>
                {listing.website && (
                  <a href={listing.website} target="_blank" rel="nofollow ugc noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-home-linen text-sm font-semibold rounded-xl hover:bg-home-stone">
                    <Globe className="w-4 h-4" aria-hidden="true" /><span>Visit website</span>
                  </a>
                )}
              </div>
              <Disclosure />
            </div>
            <div className="rounded-2xl bg-white border border-home-linen p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-serif text-lg font-semibold">Buying a house in this area?</div>
                <p className="text-sm text-slate-600 mt-1">Get a free report on what to check, ask and verify before you buy.</p>
              </div>
              <ContentLink href="/" onNavigate={onNavigate} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shrink-0">
                <span>Get a free report</span><ArrowRight className="w-4 h-4" />
              </ContentLink>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
