import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, CheckSquare, Square, Lock } from 'lucide-react';
import { TRADE_CATEGORIES } from '../data/sponsoredVendors';
import { useAuth } from '../context/AuthContext';

interface GuideRow {
  articleId: number;
  slug: string;
  title: string;
  topTaken: boolean;
  bottomTaken: boolean;
}

interface SlotKey {
  articleId: number;
  position: 'top' | 'bottom';
}

function slotKeyString(s: SlotKey): string {
  return `${s.articleId}:${s.position}`;
}

interface GuideAdsCheckoutProps {
  onNavigate: (path: string) => void;
}

// Self-serve, open-market vendor ad checkout for guide pages -- $7.99 per (guide, position)
// slot, flat 30-day window, no auto-renewal, any business can select any guide. See
// src/server/guideAdsApi.ts. Deliberately its own page rather than folded into Vendors.tsx: that
// page is a different, older, interest-capture-only flow (a human follows up manually, no
// payment happens there) -- this one takes real payment immediately, and mixing the two very
// different flows on one page would confuse both.
export const GuideAdsCheckout: React.FC<GuideAdsCheckoutProps> = ({ onNavigate }) => {
  const { user, loading: authLoading, triggerClerkSignIn, requestClerkLoad } = useAuth();

  // A dedicated checkout page, not a modal opened from Navbar -- someone can land here directly
  // (a shared link, the /advertise comparison page), so this is often the first thing on the page
  // that needs real auth state. Without this call nothing else on this path loads Clerk anymore.
  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pricePerSlot, setPricePerSlot] = useState(7.99);
  const [slotDurationDays, setSlotDurationDays] = useState(30);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const toggleSlot = (key: SlotKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = slotKeyString(key);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selectedSlots: SlotKey[] = useMemo(
    () =>
      Array.from(selected).map((k: string) => {
        const [articleId, position] = k.split(':');
        return { articleId: Number(articleId), position: position as 'top' | 'bottom' };
      }),
    [selected]
  );
  const total = selectedSlots.length * pricePerSlot;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!user) return setSubmitError('Please sign in first.');
    if (!businessName.trim()) return setSubmitError('Enter your business name.');
    if (!tradeCategory) return setSubmitError('Choose a business type.');
    if (!phone.trim()) return setSubmitError('Enter a phone number for readers to call.');
    if (selectedSlots.length === 0) return setSubmitError('Select at least one ad slot below.');

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
          slots: selectedSlots,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data?.takenSlots) {
          setSubmitError('One or more slots you picked were just taken by someone else -- refresh the page and try again.');
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
            ${pricePerSlot.toFixed(2)} per slot, {slotDurationDays} days, no subscription and no auto-renewal --
            pick as many placements as you want below, pay once, and your business shows up there until it expires.
            Any business can advertise on any page.
          </p>
        </div>

        {authLoading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs font-medium">Checking your account…</p>
          </div>
        )}

        {!authLoading && !user && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold border border-blue-100">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Sign-In Required</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-slate-900">Sign in to buy a placement</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              We use your account email for your receipt and to manage your placements -- no separate email field needed.
            </p>
            <button
              type="button"
              onClick={() => triggerClerkSignIn()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In / Sign Up</span>
            </button>
          </div>
        )}

        {!authLoading && user && (
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Your business</h2>
              <span className="text-xs text-slate-500">Signed in as <span className="font-semibold text-slate-700">{user.email || user.displayName}</span></span>
            </div>
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
            <h2 className="text-sm font-bold text-slate-900">Choose where you appear</h2>

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

            {guides && guides.length > 0 && (
              <div className="divide-y divide-slate-100 -mx-1">
                {guides.map((g) => (
                  <div key={g.articleId} className="px-1 py-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-slate-800 min-w-0 flex-1">{g.title}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {(['top', 'bottom'] as const).map((position) => {
                        const taken = position === 'top' ? g.topTaken : g.bottomTaken;
                        const key: SlotKey = { articleId: g.articleId, position };
                        const isSelected = selected.has(slotKeyString(key));
                        return (
                          <button
                            type="button"
                            key={position}
                            disabled={taken}
                            onClick={() => toggleSlot(key)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              taken
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-600 border-blue-600 text-white cursor-pointer'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 cursor-pointer'
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            <span className="capitalize">{position}</span>
                            {taken && <span className="ml-1">(taken)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total</div>
              <div className="text-2xl font-black">${total.toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{selectedSlots.length} slot{selectedSlots.length === 1 ? '' : 's'} selected</div>
            </div>
            <button
              type="submit"
              disabled={submitting || selectedSlots.length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Continue to PayPal</span>
            </button>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
};
