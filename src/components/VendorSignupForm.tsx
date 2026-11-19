import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { REPORT_AD_TRADE_CATEGORIES } from '../data/sponsoredVendors';
import { useAuth } from '../context/AuthContext';

const ZIPS_PER_BUNDLE = 3;
const PRICE_USD = 29;

type ZipState = 'empty' | 'checking' | 'open' | 'taken' | 'invalid' | 'duplicate' | 'error';

// The Report Ads checkout box. REBUILT 2026-11-15 after the owner's vendor survey: the old form
// asked for the trade, then each ZIP one at a time through an "add" button, then sign-in, then a
// business-details form, a license field and a legal checkbox, all before PayPal. Now it asks only
// for what defines the slot -- the trade and 3 ZIP codes, checked live as they're typed -- and the
// button pays. The business details are added after payment in My Ads (AdDetailsForm.tsx,
// POST /api/my-ads/details), where the same rules are enforced.
//
// The checkout write still atomically claims all 3 ZIPs as a short hold before PayPal, so a ZIP
// shown as open here can't be sold to someone else mid-checkout (see zipAdsApi.ts).
const AUTH_STASH_KEY = 'br_pending_zip_signup';
const RENEW_STASH_KEY = 'br_renew_zip_ad';
const PAYPAL_STASH_KEY = 'br_paypal_return_zip_ad';

type Stash = { zipCodes?: string[]; tradeCategory?: string; autoBuy?: boolean };

const STATE_TEXT: Record<ZipState, string> = {
  empty: '',
  checking: 'Checking…',
  open: 'Available',
  taken: 'Taken. Try another ZIP.',
  invalid: 'Not a US ZIP code',
  duplicate: 'Already entered',
  error: 'Could not check',
};

export const VendorSignupForm: React.FC = () => {
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();

  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

  const [tradeCategory, setTradeCategory] = useState('');
  const [zips, setZips] = useState<string[]>(['', '', '']);
  const [zipStates, setZipStates] = useState<ZipState[]>(['empty', 'empty', 'empty']);
  const [submitting, setSubmitting] = useState(false);
  // 'auth': back from sign-in, continue only if signed in. 'click': Buy now pressed while the
  // account was still loading, so carry on as soon as it has.
  const [resumeBuy, setResumeBuy] = useState<'auth' | 'click' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guards against an older availability answer landing after a newer one for the same box.
  const checkSeq = useRef([0, 0, 0]);

  const setZipState = (i: number, s: ZipState) => setZipStates((prev) => prev.map((v, j) => (j === i ? s : v)));

  const checkZip = async (i: number, zip: string, trade: string, all: string[]) => {
    const seq = ++checkSeq.current[i];
    if (zip.length < 5) return setZipState(i, 'empty');
    if (all.some((z, j) => j !== i && z === zip)) return setZipState(i, 'duplicate');
    if (!trade) return setZipState(i, 'empty');
    setZipState(i, 'checking');
    try {
      const res = await fetch(`/api/zip-ads/slots?zip=${encodeURIComponent(zip)}&tradeCategory=${encodeURIComponent(trade)}`);
      const data = await res.json();
      if (seq !== checkSeq.current[i]) return;
      if (res.status === 400) return setZipState(i, 'invalid');
      if (!res.ok || !data.success) return setZipState(i, 'error');
      setZipState(i, data.available ? 'open' : 'taken');
    } catch {
      if (seq === checkSeq.current[i]) setZipState(i, 'error');
    }
  };

  const recheckAll = (trade: string, all: string[]) => all.forEach((z, i) => checkZip(i, z, trade, all));

  const onZipChange = (i: number, raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, 5);
    const next = zips.map((z, j) => (j === i ? value : z));
    setZips(next);
    setError(null);
    // Re-check every box: a change in one can create or clear a duplicate in another.
    recheckAll(tradeCategory, next);
  };

  const onTradeChange = (trade: string) => {
    setTradeCategory(trade);
    setError(null);
    recheckAll(trade, zips);
  };

  // Restore after a real navigation (sign-in redirect, PayPal cancel, "Buy again" in My Ads).
  useEffect(() => {
    const restore = (raw: string): Stash => {
      const stash = JSON.parse(raw) as Stash;
      const trade = stash.tradeCategory || '';
      const restored = [0, 1, 2].map((i) => (stash.zipCodes || [])[i] || '');
      setTradeCategory(trade);
      setZips(restored);
      // Re-checked, not trusted: a ZIP can be bought by someone else while the vendor was away.
      recheckAll(trade, restored);
      return stash;
    };
    const paypalRaw = sessionStorage.getItem(PAYPAL_STASH_KEY);
    sessionStorage.removeItem(PAYPAL_STASH_KEY);
    const params = new URLSearchParams(window.location.search);
    if (paypalRaw && params.has('token')) {
      try {
        restore(paypalRaw);
        setNotice('Your PayPal checkout was cancelled and nothing was charged. Your ZIP codes are filled back in.');
      } catch { /* malformed stash, ignore */ }
      params.delete('token');
      const rest = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
      return;
    }
    const authRaw = sessionStorage.getItem(AUTH_STASH_KEY);
    if (authRaw) {
      sessionStorage.removeItem(AUTH_STASH_KEY);
      try {
        const stash = restore(authRaw);
        if (stash.autoBuy) setResumeBuy('auth');
      } catch { /* malformed stash, ignore */ }
      return;
    }
    const renewRaw = sessionStorage.getItem(RENEW_STASH_KEY);
    if (!renewRaw) return;
    sessionStorage.removeItem(RENEW_STASH_KEY);
    try { restore(renewRaw); } catch { /* malformed stash, ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = Boolean(tradeCategory) && zipStates.every((s) => s === 'open');
  const stillChecking = zipStates.some((s) => s === 'checking');

  const buy = async () => {
    setError(null);
    setNotice(null);
    if (!tradeCategory) return setError('Choose your business type first.');
    if (!ready) return setError(`Enter ${ZIPS_PER_BUNDLE} different ZIP codes that show as available.`);
    if (authLoading) {
      setResumeBuy('click');
      return;
    }
    if (!user) {
      sessionStorage.setItem(AUTH_STASH_KEY, JSON.stringify({ zipCodes: zips, tradeCategory, autoBuy: true } satisfies Stash));
      triggerClerkSignIn();
      return;
    }
    setSubmitting(true);
    const token = await getToken();
    if (!token) {
      setError('Your session has expired -- please sign in again.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/zip-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quick: true,
          acceptedTerms: true,
          tradeCategory,
          zipCodes: zips,
          contactEmail: user.email || `${user.uid}@beforeregret.com`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError((data?.errors && data.errors[0]) || data?.error || 'Could not start checkout. Please try again.');
        // Lost the race on one of the 3: re-check them all so the taken one shows as taken.
        if (res.status === 409) recheckAll(tradeCategory, zips);
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem(PAYPAL_STASH_KEY, JSON.stringify({ zipCodes: zips, tradeCategory } satisfies Stash));
      window.location.href = data.approvalUrl;
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  // Back from sign-in with autoBuy: continue to PayPal once the account loads and all 3 ZIPs re-check as open.
  useEffect(() => {
    if (!resumeBuy || authLoading || stillChecking) return;
    if (zipStates.some((s) => s === 'empty')) return;
    const why = resumeBuy;
    setResumeBuy(null);
    if (ready && (user || why === 'click')) buy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeBuy, authLoading, user, ready, stillChecking, zipStates]);

  return (
    <div className="bg-white rounded-3xl border border-home-linen shadow-xl p-5 sm:p-7">
      <label htmlFor="report-ad-trade" className="block text-sm font-bold">1. Your business type</label>
      <select
        id="report-ad-trade"
        value={tradeCategory}
        onChange={(e) => onTradeChange(e.target.value)}
        className="mt-2 w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base sm:text-sm"
      >
        <option value="">Choose…</option>
        {REPORT_AD_TRADE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <p className="mt-5 text-sm font-bold">2. Your {ZIPS_PER_BUNDLE} ZIP codes</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
        {zips.map((zip, i) => {
          const s = zipStates[i];
          const good = s === 'open';
          const bad = s === 'taken' || s === 'invalid' || s === 'duplicate' || s === 'error';
          return (
            <div key={i}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="ZIP"
                aria-label={`ZIP code ${i + 1}`}
                aria-describedby={`zip-state-${i}`}
                value={zip}
                onChange={(e) => onZipChange(i, e.target.value)}
                className={`w-full px-3 py-3 border rounded-xl text-base text-center tabular-nums tracking-wider ${
                  good ? 'border-home-moss bg-home-sage/40' : bad ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
              />
              <p id={`zip-state-${i}`} className={`mt-1 min-h-[1rem] text-[11px] leading-tight flex items-start gap-1 ${good ? 'text-home-moss' : bad ? 'text-rose-600' : 'text-slate-500'}`}>
                {s === 'checking' && <Loader2 className="w-3 h-3 animate-spin shrink-0" aria-hidden="true" />}
                {good && <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />}
                {bad && <XCircle className="w-3 h-3 shrink-0" aria-hidden="true" />}
                <span>{zip.length === 5 && !tradeCategory ? 'Choose a type first' : STATE_TEXT[s]}</span>
              </p>
            </div>
          );
        })}
      </div>

      {notice && <p role="status" className="mt-3 text-xs text-home-navy bg-home-sage/40 rounded-xl p-3">{notice}</p>}
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 text-xs text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /><span>{error}</span>
        </p>
      )}

      <button
        type="button"
        onClick={buy}
        disabled={submitting || resumeBuy !== null || !ready}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-home-navy hover:bg-home-ink disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl transition-colors cursor-pointer"
      >
        {submitting || resumeBuy !== null ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : user ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
        <span>{submitting ? 'Opening PayPal…' : `Buy now · $${PRICE_USD}`}</span>
      </button>
      <p className="mt-2.5 text-[11px] text-slate-500 leading-snug text-center">
        Add your business name and phone after paying. By buying you agree to the{' '}
        <a href="/terms/" target="_blank" rel="noopener noreferrer" className="underline hover:text-home-ink">Terms of Service</a>,
        including arbitration (Section 7).
      </p>
    </div>
  );
};
