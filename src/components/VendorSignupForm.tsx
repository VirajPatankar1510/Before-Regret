import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';
import { useAuth } from '../context/AuthContext';

type Stage = 'checking-form' | 'checking' | 'available' | 'full' | 'submitting';

interface SlotAvailability {
  slotsTotal: number;
  slotsTaken: number;
  slotsRemaining: number;
  available: boolean;
  pricePerSlotUsd: number;
  slotDurationDays: number;
}

// Real self-serve checkout: check live slot availability for a (ZIP, trade) pair, collect
// business details, then redirect to PayPal for actual payment. See src/server/zipAdsApi.ts.
// Replaces the old interest-capture-only version of this form, which only logged a submission to
// console and asked a human to follow up manually -- no payment ever happened there.
export const VendorSignupForm: React.FC = () => {
  const { user, triggerClerkSignIn } = useAuth();

  const [stage, setStage] = useState<Stage>('checking-form');
  const [tradeCategory, setTradeCategory] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  const checkAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeCategory || !/^\d{5}$/.test(zipCode)) {
      setCheckError('Pick a business type and enter a valid 5-digit ZIP code.');
      return;
    }
    setCheckError(null);
    setStage('checking');
    try {
      const res = await fetch(`/api/zip-ads/slots?zip=${encodeURIComponent(zipCode)}&tradeCategory=${encodeURIComponent(tradeCategory)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckError(data?.error || 'Could not check availability. Please try again.');
        setStage('checking-form');
        return;
      }
      setAvailability(data);
      setStage(data.available ? 'available' : 'full');
    } catch {
      setCheckError('Could not check availability. Please try again.');
      setStage('checking-form');
    }
  };

  const startCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrors([]);
    if (!user) return setSubmitErrors(['Please sign in first.']);
    if (!businessName.trim()) return setSubmitErrors(['Enter your business name.']);
    if (!phone.trim()) return setSubmitErrors(['Enter a phone number for readers to call.']);

    const contactEmail = user.email || `${user.uid}@beforeregret.com`;

    setStage('submitting');
    try {
      const res = await fetch('/api/zip-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tradeCategory,
          zipCode,
          phone: phone.trim(),
          website: website.trim() || undefined,
          tagline: tagline.trim() || undefined,
          contactEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitErrors(data?.errors || [data?.error || 'Could not start checkout. Please try again.']);
        setStage('available');
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setSubmitErrors(['Could not reach the server. Please try again.']);
      setStage('available');
    }
  };

  const resetSearch = () => {
    setStage('checking-form');
    setAvailability(null);
    setCheckError(null);
    setSubmitErrors([]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Check Availability</div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">Claim Your ZIP Code</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Only {MAX_SLOTS_PER_ZIP_TRADE} businesses per trade category are shown per ZIP code, first come first served.
        </p>
      </div>

      {(stage === 'checking-form' || stage === 'checking') && (
        <form onSubmit={checkAvailability} className="flex flex-col sm:flex-row gap-3">
          <select
            value={tradeCategory}
            onChange={(e) => setTradeCategory(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select your business type...</option>
            {TRADE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            placeholder="ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="sm:w-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={stage === 'checking'}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shrink-0"
          >
            {stage === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check Availability</span>
          </button>
        </form>
      )}
      {checkError && <p className="text-xs text-red-600 font-medium">{checkError}</p>}

      {stage === 'full' && availability && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Both slots taken for {tradeCategory} in ZIP {zipCode}</span>
          </div>
          <p className="text-xs text-red-700">
            {availability.slotsTaken} of {availability.slotsTotal} slots are currently filled. Try a different ZIP code or business type.
          </p>
          <button onClick={resetSearch} className="text-xs font-bold text-red-800 underline cursor-pointer">
            Check another ZIP
          </button>
        </div>
      )}

      {(stage === 'available' || stage === 'submitting') && availability && !user && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold border border-blue-100">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sign-In Required</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Sign in to buy this slot</h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            We use your account email for your receipt and to manage your placement -- no separate email field needed.
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

      {(stage === 'available' || stage === 'submitting') && availability && user && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-800 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{availability.slotsRemaining} of {availability.slotsTotal} slots open for {tradeCategory} in ZIP {zipCode}</span>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>Signed in as <span className="font-semibold text-slate-700">{user.email || user.displayName}</span></span>
          </div>

          <form onSubmit={startCheckout} className="space-y-3">
            <input
              type="text" required placeholder="Business name" value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="tel" required placeholder="Phone readers will call" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="url" placeholder="Website (optional)" value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text" placeholder="Short tagline for your listing (optional)" value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />

            {submitErrors.length > 0 && (
              <ul className="text-xs text-red-600 font-medium space-y-0.5 flex flex-col">
                {submitErrors.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={stage === 'submitting'}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {stage === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Continue to PayPal -- ${availability.pricePerSlotUsd.toFixed(0)}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              ${availability.pricePerSlotUsd.toFixed(0)} flat for {availability.slotDurationDays} days, no subscription and no auto-renewal. First come, first served; slot reopens automatically once it expires unless you buy another {availability.slotDurationDays}-day window.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};
