import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Lock, X } from 'lucide-react';
import { TRADE_CATEGORIES, MAX_SLOTS_PER_ZIP_TRADE, requiresLicenceNumber } from '../data/sponsoredVendors';
import { useAuth } from '../context/AuthContext';

const ZIPS_PER_BUNDLE = 3;

interface BundlePricing {
  pricePerBundleUsd: number;
  slotDurationDays: number;
}

// Real self-serve checkout: pick a trade category and ZIPS_PER_BUNDLE distinct ZIP codes, check
// live availability for each (which now also reflects other vendors' in-progress holds -- see
// zipAdsApi.ts's countActiveOrHeldSlots), collect business details, then redirect to PayPal for
// actual payment. The checkout submission itself atomically claims all 3 ZIPs as a short-lived
// hold before any payment happens, ticket-booking-app style, so a ZIP picked here can't be sold
// to someone else while this vendor is mid-checkout at PayPal. See src/server/zipAdsApi.ts.
export const VendorSignupForm: React.FC = () => {
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();

  // A dedicated checkout page, same reasoning as GuideAdsCheckout.tsx -- someone can land here
  // directly without ever touching Navbar's Sign In button, so this needs its own trigger.
  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

  const [tradeCategory, setTradeCategory] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<BundlePricing | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [attestedAccurate, setAttestedAccurate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  // Checks one ZIP against live availability (real purchases + other vendors' in-progress holds)
  // and adds it to the selection if open. tradeCategoryOverride exists only for the prefill effect
  // below, which calls this right after setTradeCategory -- reading the tradeCategory state
  // variable there would still see the pre-update value due to how state updates batch, so that
  // one caller passes the value directly instead of relying on the closure.
  const addZip = async (rawZip: string, tradeCategoryOverride?: string) => {
    const trade = tradeCategoryOverride ?? tradeCategory;
    const zip = rawZip.trim();
    setCheckError(null);
    if (!trade) {
      setCheckError('Choose a business type first.');
      return;
    }
    if (!/^\d{5}$/.test(zip)) {
      setCheckError('Enter a 5-digit ZIP code.');
      return;
    }
    if (selectedZips.includes(zip)) {
      setCheckError('You already added that ZIP code.');
      return;
    }
    if (selectedZips.length >= ZIPS_PER_BUNDLE) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/zip-ads/slots?zip=${encodeURIComponent(zip)}&tradeCategory=${encodeURIComponent(trade)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckError(data?.error || 'Could not check availability. Please try again.');
        return;
      }
      if (!data.available) {
        setCheckError(`Both slots for ${trade} in ZIP ${zip} are already taken -- try a different ZIP.`);
        return;
      }
      setSelectedZips((prev) => (prev.includes(zip) ? prev : [...prev, zip]));
      setZipInput('');
      setPricing((prev) => prev ?? { pricePerBundleUsd: data.pricePerBundleUsd, slotDurationDays: data.slotDurationDays });
    } catch {
      setCheckError('Could not check availability. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const removeZip = (zip: string) => {
    setSelectedZips((prev) => prev.filter((z) => z !== zip));
    setCheckError(null);
  };

  const handleAddZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addZip(zipInput);
  };

  // Prefill from MyAdsPanel.tsx's Expired-section "Buy again" -- a lapsed bundle's ZIPs may have
  // been bought by someone else in the meantime, so every stashed ZIP is re-checked for real here
  // rather than trusted; only the ones still open get carried into the selection, up to
  // ZIPS_PER_BUNDLE. Same stash-then-clear pattern as GuideAdsCheckout.tsx's renewal prefill.
  useEffect(() => {
    const raw = sessionStorage.getItem('br_renew_zip_ad');
    if (!raw) return;
    sessionStorage.removeItem('br_renew_zip_ad');
    try {
      const stash = JSON.parse(raw) as {
        zipCodes: string[]; tradeCategory: string; businessName: string; phone: string; website: string | null;
      };
      setTradeCategory(stash.tradeCategory || '');
      setBusinessName(stash.businessName || '');
      setPhone(stash.phone || '');
      setWebsite(stash.website || '');
      (async () => {
        for (const zip of (stash.zipCodes || []).slice(0, ZIPS_PER_BUNDLE)) {
          await addZip(zip, stash.tradeCategory);
        }
      })();
    } catch { /* malformed stash, ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrors([]);
    if (!user) return setSubmitErrors(['Please sign in first.']);
    if (!businessName.trim()) return setSubmitErrors(['Enter your business name.']);
    if (!phone.trim()) return setSubmitErrors(['Enter a phone number for readers to call.']);
    if (selectedZips.length !== ZIPS_PER_BUNDLE) return setSubmitErrors([`Select ${ZIPS_PER_BUNDLE} ZIP codes first.`]);
    // Same rule as the server enforces (requiresLicenceNumber) -- checked here only so the vendor
    // sees the problem before being sent to PayPal, never as the actual gate.
    if (requiresLicenceNumber(tradeCategory) && licenceNumber.trim().length < 3) {
      return setSubmitErrors([`A licence, registration, or certification number is required for ${tradeCategory}.`]);
    }
    if (!attestedAccurate) return setSubmitErrors(['Tick the confirmation box to accept the Terms of Service before continuing.']);

    const contactEmail = user.email || `${user.uid}@beforeregret.com`;

    setSubmitting(true);
    // Verified session token, not the raw uid -- see clerkAuth.ts; the server no longer trusts a
    // client-sent clerkUserId for who an order gets attributed to.
    const token = await getToken();
    if (!token) {
      setSubmitErrors(['Your session has expired -- please sign in again.']);
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/zip-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tradeCategory,
          zipCodes: selectedZips,
          phone: phone.trim(),
          website: website.trim() || undefined,
          licenceNumber: licenceNumber.trim() || undefined,
          contactEmail,
          attestedAccurate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitErrors(data?.errors || [data?.error || 'Could not start checkout. Please try again.']);
        // Lost the race on one of the 3 (someone else's hold or purchase landed first) -- clear
        // the selection rather than let a resubmit retry the exact same, now partly-taken set.
        if (res.status === 409) setSelectedZips([]);
        setSubmitting(false);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setSubmitErrors(['Could not reach the server. Please try again.']);
      setSubmitting(false);
    }
  };

  const ready = selectedZips.length === ZIPS_PER_BUNDLE;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Check Availability</div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">Claim Your {ZIPS_PER_BUNDLE} ZIP Codes</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Only {MAX_SLOTS_PER_ZIP_TRADE} businesses per trade category are shown per ZIP code, first come first served.
        </p>
      </div>

      <div className="space-y-3">
        <select
          value={tradeCategory}
          onChange={(e) => setTradeCategory(e.target.value)}
          disabled={selectedZips.length > 0}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">Select your business type...</option>
          {TRADE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {selectedZips.length > 0 && (
          <ul className="space-y-2">
            {selectedZips.map((zip) => (
              <li key={zip} className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>ZIP {zip}</span>
                </span>
                <button type="button" onClick={() => removeZip(zip)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer" aria-label={`Remove ZIP ${zip}`}>
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!ready && (
          <form onSubmit={handleAddZipSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="ZIP code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={checking || !tradeCategory}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shrink-0"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Check &amp; Add ZIP ({selectedZips.length} of {ZIPS_PER_BUNDLE})</span>
            </button>
          </form>
        )}
        {checkError && (
          <p className="flex items-start gap-1.5 text-xs text-red-600 font-medium">
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{checkError}</span>
          </p>
        )}
      </div>

      {ready && authLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs font-medium">Checking your account…</p>
        </div>
      )}

      {ready && !authLoading && !user && (
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

      {ready && !authLoading && user && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-emerald-800 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{tradeCategory} in ZIP {selectedZips.join(', ')} -- all {ZIPS_PER_BUNDLE} open</span>
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
            {/* Rendered only for categories that need one, so the licence-exempt trade never sees a
                field it cannot honestly fill. The helper text states plainly that the number is
                published and unverified -- a vendor should know their number will appear in the ad
                before they type it, and should not read the request as us vouching for it. */}
            {tradeCategory && requiresLicenceNumber(tradeCategory) && (
              <div className="space-y-1.5">
                <input
                  type="text" required placeholder="State licence / registration number"
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                  Required for {tradeCategory}. This is <strong>shown in your ad</strong> exactly as
                  you type it. We do not verify it with any licensing board -- you are confirming it
                  is current and correct (Terms 4.4). Movers may enter a USDOT or MC number.
                </p>
              </div>
            )}
            <label className="flex items-start gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox" checked={attestedAccurate}
                onChange={(e) => setAttestedAccurate(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-blue-600 cursor-pointer"
              />
              <span>
                I confirm the details above are accurate, that I'm authorized to advertise this
                business, and that I hold any licenses and insurance my trade requires. I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Terms of Service</a>,
                which include a binding individual arbitration agreement and class action waiver
                (Section 7) that I may opt out of within 30 days.
              </span>
            </label>

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
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Continue to PayPal -- ${(pricing?.pricePerBundleUsd ?? 29).toFixed(0)}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              ${(pricing?.pricePerBundleUsd ?? 29).toFixed(0)} flat for {ZIPS_PER_BUNDLE} ZIP codes, {pricing?.slotDurationDays ?? 30} days, no subscription and no auto-renewal.
              First come, first served; each slot reopens automatically once it expires unless you buy another {pricing?.slotDurationDays ?? 30}-day window.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};
