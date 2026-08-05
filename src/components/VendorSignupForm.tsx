import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE } from '../data/sponsoredVendors';

type Stage = 'checking-form' | 'checking' | 'available' | 'full' | 'submitting' | 'success' | 'error';

interface SlotAvailability {
  slotsTotal: number;
  slotsTaken: number;
  slotsRemaining: number;
  available: boolean;
}

// No self-serve payment yet -- v1 is a real, honest interest-capture form: check live slot
// availability for a (ZIP, trade) pair, and if open, collect contact info. A human follows up
// to complete billing manually. See /api/vendor-slots and /api/vendor-interest in server.ts.
export const VendorSignupForm: React.FC = () => {
  const [stage, setStage] = useState<Stage>('checking-form');
  const [tradeCategory, setTradeCategory] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const checkAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeCategory || !/^\d{5}$/.test(zipCode)) {
      setCheckError('Pick a business type and enter a valid 5-digit ZIP code.');
      return;
    }
    setCheckError(null);
    setStage('checking');
    try {
      const res = await fetch(`/api/vendor-slots?zip=${encodeURIComponent(zipCode)}&tradeCategory=${encodeURIComponent(tradeCategory)}`);
      const data = await res.json();
      if (!res.ok) {
        setCheckError(data?.error || 'Could not check availability. Please try again.');
        setStage('checking-form');
        return;
      }
      setAvailability(data);
      setStage(data.available ? 'available' : 'full');
    } catch (err) {
      setCheckError('Could not check availability. Please try again.');
      setStage('checking-form');
    }
  };

  const submitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrors([]);
    setStage('submitting');
    try {
      const res = await fetch('/api/vendor-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, tradeCategory, zipCode, phone, email, website, tagline }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitErrors(data?.errors || ['Something went wrong. Please try again.']);
        setStage(data?.available === false ? 'full' : 'available');
        return;
      }
      setSuccessMessage(data.message);
      setStage('success');
    } catch (err) {
      setSubmitErrors(['Something went wrong. Please try again.']);
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

      {(stage === 'available' || stage === 'submitting') && availability && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-800 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{availability.slotsRemaining} of {availability.slotsTotal} slots open for {tradeCategory} in ZIP {zipCode}</span>
          </div>

          <form onSubmit={submitInterest} className="space-y-3">
            <input
              type="text" required placeholder="Business name" value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel" required placeholder="Phone" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="email" required placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
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
              <ul className="text-xs text-red-600 font-medium space-y-0.5">
                {submitErrors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            )}

            <button
              type="submit"
              disabled={stage === 'submitting'}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {stage === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Reserve This Slot</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              No payment yet -- we'll reach out within 24 hours to complete setup. $29/month, less than $1/day. First come, first served; no refunds once billing starts.
            </p>
          </form>
        </div>
      )}

      {stage === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
        </div>
      )}
    </div>
  );
};
