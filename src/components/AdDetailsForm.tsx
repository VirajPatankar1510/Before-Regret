import React, { useState } from 'react';
import { Loader2, Rocket, AlertCircle } from 'lucide-react';
import { TRADE_CATEGORIES, requiresLicenceNumber, requiresBrokerageName, brokerageNameError } from '../data/sponsoredVendors';
import { checkVendorWebsite, VENDOR_WEBSITE_RULE } from '../data/vendorWebsite';

export interface AdDetailsDefaults {
  businessName?: string;
  tradeCategory?: string;
  phone?: string;
  website?: string | null;
  licenceNumber?: string | null;
}

interface AdDetailsFormProps {
  kind: 'guide' | 'zip';
  orderId: number;
  /** A Report Ad's trade is part of the slot and was chosen at checkout; a Topic Ad's is chosen here. */
  fixedTrade?: string;
  /** From the vendor's most recent live ad, so a returning vendor doesn't type it all again. */
  defaults?: AdDetailsDefaults;
  getToken: () => Promise<string | null>;
  onSaved: (paidThrough: string) => void;
}

// The second half of the pay-first checkout (owner, 2026-11-15): the business details that used to
// stand between the vendor and PayPal. One form per order. The same rules the old checkout forms
// enforced are checked here for a quick answer, and enforced for real by POST /api/my-ads/details.
// The accuracy warranty moved here too, because this is where the details it vouches for are typed.
export const AdDetailsForm: React.FC<AdDetailsFormProps> = ({ kind, orderId, fixedTrade, defaults, getToken, onSaved }) => {
  const [businessName, setBusinessName] = useState(defaults?.businessName || '');
  const [tradeCategory, setTradeCategory] = useState(fixedTrade || defaults?.tradeCategory || '');
  const [phone, setPhone] = useState(defaults?.phone || '');
  const [website, setWebsite] = useState(defaults?.website || '');
  const [licenceNumber, setLicenceNumber] = useState(defaults?.licenceNumber || '');
  const [brokerageName, setBrokerageName] = useState('');
  const [attested, setAttested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsLicence = Boolean(tradeCategory) && requiresLicenceNumber(tradeCategory);
  const needsBrokerage = Boolean(tradeCategory) && requiresBrokerageName(tradeCategory);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (businessName.trim().length < 2) return setError('Enter your business name.');
    if (!tradeCategory) return setError('Choose your business type.');
    if (phone.trim().length < 7) return setError('Enter a phone number readers can call.');
    if (needsLicence && licenceNumber.trim().length < 3) return setError(`A license, registration, or certification number is required for ${tradeCategory}.`);
    if (needsBrokerage) {
      const err = brokerageNameError(brokerageName);
      if (err) return setError(err);
    }
    const site = checkVendorWebsite(website);
    if (!site.ok) return setError(site.error || VENDOR_WEBSITE_RULE);
    if (!attested) return setError('Tick the box to confirm your details are accurate.');

    setSaving(true);
    const token = await getToken();
    if (!token) {
      setError('Your session has expired -- please sign in again.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/my-ads/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kind, orderId,
          businessName: businessName.trim(),
          tradeCategory,
          phone: phone.trim(),
          website: website.trim() || undefined,
          licenceNumber: needsLicence ? licenceNumber.trim() : undefined,
          brokerageName: needsBrokerage ? brokerageName.trim() : undefined,
          attestedAccurate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || 'Could not save your details.');
        setSaving(false);
        return;
      }
      onSaved(data.paidThrough);
    } catch {
      setError('Could not reach the server.');
      setSaving(false);
    }
  };

  const field = 'w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base sm:text-sm bg-white';

  return (
    <form onSubmit={save} className="mt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-slate-700">Business name</span>
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={100} autoComplete="organization" className={`mt-1 ${field}`} />
        </label>
        {fixedTrade ? (
          <div>
            <span className="text-xs font-bold text-slate-700">Business type</span>
            <p className="mt-1 px-3.5 py-3 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">{fixedTrade}</p>
          </div>
        ) : (
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Business type</span>
            <select value={tradeCategory} onChange={(e) => setTradeCategory(e.target.value)} className={`mt-1 ${field}`}>
              <option value="">Choose…</option>
              {TRADE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="text-xs font-bold text-slate-700">Phone readers will call</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" className={`mt-1 ${field}`} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-700">Website <span className="font-normal text-slate-500">(optional)</span></span>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} autoComplete="url" className={`mt-1 ${field}`} />
          <span className="mt-1 block text-[11px] text-slate-500 leading-snug">{VENDOR_WEBSITE_RULE}</span>
        </label>
        {needsBrokerage && (
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-slate-700">Brokerage name</span>
            <input type="text" value={brokerageName} onChange={(e) => setBrokerageName(e.target.value)} maxLength={80} className={`mt-1 ${field}`} />
            <span className="mt-1 block text-[11px] text-slate-500 leading-snug">
              Shown in your ad right after your name. Some states require it in every real estate ad. Following
              your state&apos;s advertising rules is your responsibility.
            </span>
          </label>
        )}
        {needsLicence && (
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-slate-700">License, registration or certification number</span>
            <input type="text" value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} maxLength={60} className={`mt-1 ${field}`} />
            {/* Deliberately does not tell the advertiser "we don't verify this": the public ad card tells
                readers that, and saying it here only advertises the gap to the one party who could use it. */}
            <span className="mt-1 block text-[11px] text-slate-500 leading-snug">
              Required for {tradeCategory}. It appears in your ad exactly as typed. Movers may enter a USDOT or
              MC number; agents, their real estate license number.
            </span>
          </label>
        )}
      </div>

      <label className="flex items-start gap-2.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer">
        <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 accent-home-navy cursor-pointer" />
        <span>
          These details are accurate, I&apos;m allowed to advertise this business, and it holds the licenses and
          insurance its trade requires. A false or expired license number means removal without refund{' '}
          (<a href="/terms/" target="_blank" rel="noopener noreferrer" className="underline">Terms 4.4</a>).
        </span>
      </label>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /><span>{error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-home-navy hover:bg-home-ink disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Rocket className="w-4 h-4" aria-hidden="true" />}
        <span>{saving ? 'Publishing…' : 'Publish my ad'}</span>
      </button>
    </form>
  );
};
