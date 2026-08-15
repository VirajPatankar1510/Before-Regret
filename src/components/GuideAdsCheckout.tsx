import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, CheckSquare, Square, Lock, Search } from 'lucide-react';
import { TRADE_CATEGORIES } from '../data/sponsoredVendors';
import { guessTradeCategoryFromTitle } from '../data/guideAdCategoryGuess';
import { useAuth } from '../context/AuthContext';

interface GuideRow {
  articleId: number;
  slug: string;
  title: string;
  taken: boolean;
}

interface GuideAdsCheckoutProps {
  onNavigate: (path: string) => void;
}

// Self-serve, open-market vendor ad checkout for guide pages -- $7.99 per guide, one slot each,
// flat 30-day window, no auto-renewal, any business can select any guide. See
// src/server/guideAdsApi.ts. Deliberately its own page rather than folded into Vendors.tsx: that
// page is a different, older, interest-capture-only flow (a human follows up manually, no
// payment happens there) -- this one takes real payment immediately, and mixing the two very
// different flows on one page would confuse both.
//
// The guide list and business form render regardless of sign-in state -- only the final "Continue
// to PayPal" step requires it. Gating the whole page behind sign-in used to mean a vendor clicking
// GuideAdSlot.tsx's "Are you in the X business?" CTA landed on a login screen instead of the thing
// they clicked, before ever seeing what's for sale.
export const GuideAdsCheckout: React.FC<GuideAdsCheckoutProps> = ({ onNavigate }) => {
  const { user, loading: authLoading, triggerClerkSignIn, requestClerkLoad } = useAuth();

  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pricePerSlot, setPricePerSlot] = useState(7.99);
  const [slotDurationDays, setSlotDurationDays] = useState(30);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill from MyAdsPanel.tsx's "Renew" button, if that's how the vendor got here -- stashed in
  // sessionStorage rather than a URL param since it also carries the previous business details,
  // not just which guide to re-select. Read once and cleared immediately so a later plain visit
  // to this page (or a back-button return) doesn't silently resurrect stale form state.
  useEffect(() => {
    const raw = sessionStorage.getItem('br_renew_guide_ads');
    if (!raw) return;
    sessionStorage.removeItem('br_renew_guide_ads');
    try {
      const renew = JSON.parse(raw) as { articleIds: number[]; businessName: string; tradeCategory: string; phone: string; website: string | null; tagline: string | null };
      setSelected(new Set(renew.articleIds));
      setBusinessName(renew.businessName || '');
      setTradeCategory(renew.tradeCategory || '');
      setPhone(renew.phone || '');
      setWebsite(renew.website || '');
      setTagline(renew.tagline || '');
    } catch { /* malformed stash, ignore */ }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch('/api/guide-ads/slots')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setGuides(data.guides);
          if (typeof data.pricePerSlotUsd === 'number') setPricePerSlot(data.pricePerSlotUsd);
          if (typeof data.slotDurationDays === 'number') setSlotDurationDays(data.slotDurationDays);
        } else {
          setLoadError(data?.error || 'Could not load available placements.');
        }
      })
      .catch(() => setLoadError('Could not reach the server.'));
  }, []);

  // Only loads Clerk once the vendor is actually ready to check out -- browsing the guide list
  // and filling in the business form shouldn't pull in the auth chunk before it's needed.
  const handleSignInClick = () => {
    requestClerkLoad();
    triggerClerkSignIn();
  };

  const toggleSlot = (articleId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  };

  // Guides matching the vendor's own selected trade float to the top -- with 88+ guides and no
  // search-as-you-select affordance otherwise, a roofer had to scroll an alphabetical wall of
  // titles to find the handful actually relevant to their trade. Falls back to plain alphabetical
  // (the order the server already returns) once no trade is chosen yet or nothing searched.
  const visibleGuides = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = guides ? guides.filter((g) => !query || g.title.toLowerCase().includes(query)) : [];
    if (!tradeCategory) return filtered;
    const matched: GuideRow[] = [];
    const rest: GuideRow[] = [];
    for (const g of filtered) {
      (guessTradeCategoryFromTitle(g.title) === tradeCategory ? matched : rest).push(g);
    }
    return [...matched, ...rest];
  }, [guides, search, tradeCategory]);

  const selectedCount = selected.size;
  const total = selectedCount * pricePerSlot;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!businessName.trim()) return setSubmitError('Enter your business name.');
    if (!tradeCategory) return setSubmitError('Choose a business type.');
    if (!phone.trim()) return setSubmitError('Enter a phone number for readers to call.');
    if (selectedCount === 0) return setSubmitError('Select at least one guide below.');
    if (!user) return setSubmitError('Sign in to complete your purchase.');

    const contactEmail = user.email || `${user.uid}@beforeregret.com`;

    setSubmitting(true);
    try {
      const res = await fetch('/api/guide-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tradeCategory,
          phone: phone.trim(),
          website: website.trim() || undefined,
          tagline: tagline.trim() || undefined,
          contactEmail,
          slots: Array.from(selected),
          clerkUserId: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data?.takenArticleIds) {
          setSubmitError('One or more guides you picked were just taken by someone else -- refresh the page and try again.');
        } else {
          setSubmitError(data?.error || 'Could not start checkout.');
        }
        setSubmitting(false);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setSubmitError('Could not reach the server.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => onNavigate('/advertise')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Comparison</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
            Topic Ads
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Get your phone number in front of people researching this exact problem
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            ${pricePerSlot.toFixed(2)} per guide, {slotDurationDays} days, no subscription and no auto-renewal --
            pick as many guides as you want below, pay once, and your business shows up there until it expires.
            Any business can advertise on any guide. This buys a fixed placement, not impressions or clicks --
            we don't track or guarantee how many people see it.
          </p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Your business</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text" placeholder="Business name" value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
              <select
                value={tradeCategory} onChange={(e) => setTradeCategory(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Business type...</option>
                {TRADE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="tel" placeholder="Phone number readers will call" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm sm:col-span-2"
              />
              <input
                type="url" placeholder="Website (optional)" value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm sm:col-span-2"
              />
              <input
                type="text" placeholder="One-line tagline shown next to your number (optional)" value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm sm:col-span-2"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">Choose where you appear</h2>
              {tradeCategory && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                  Guides matching {tradeCategory} shown first
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" placeholder="Search guide titles..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {loadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{loadError}</span>
              </div>
            )}
            {!guides && !loadError && (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}

            {guides && guides.length === 0 && (
              <p className="text-xs text-slate-500 py-4">No placements available yet -- check back soon.</p>
            )}

            {guides && guides.length > 0 && visibleGuides.length === 0 && (
              <p className="text-xs text-slate-500 py-4">No guides match "{search}".</p>
            )}

            {visibleGuides.length > 0 && (
              <div className="divide-y divide-slate-100 -mx-1 max-h-[28rem] overflow-y-auto">
                {visibleGuides.map((g) => {
                  const isSelected = selected.has(g.articleId);
                  return (
                    <button
                      type="button"
                      key={g.articleId}
                      disabled={g.taken}
                      onClick={() => toggleSlot(g.articleId)}
                      className={`w-full px-1 py-3 flex items-center justify-between gap-3 text-left transition-colors ${
                        g.taken ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm text-slate-800 min-w-0 flex-1">{g.title}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 ${
                          g.taken
                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>{g.taken ? 'Taken' : isSelected ? 'Selected' : 'Select'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total</div>
              <div className="text-2xl font-black">${total.toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{selectedCount} guide{selectedCount === 1 ? '' : 's'} selected</div>
            </div>

            {!authLoading && user ? (
              <button
                type="submit"
                disabled={submitting || selectedCount === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Continue to PayPal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignInClick}
                disabled={authLoading}
                className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-60 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Sign In to Pay</span>
              </button>
            )}
          </div>

          {!authLoading && user && (
            <p className="text-xs text-slate-500 -mt-2">
              Signed in as <span className="font-semibold text-slate-700">{user.email || user.displayName}</span> --
              we use your account email for your receipt and to manage your placements in{' '}
              <button type="button" onClick={() => onNavigate('/my-ads')} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                My Placements
              </button>.
            </p>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
