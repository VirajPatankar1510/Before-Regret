import React, { useEffect, useState } from 'react';
import { ChevronRight, Loader2, Lock, CheckCircle2, AlertCircle, X, ArrowRight, Trash2 } from 'lucide-react';
import { TRADE_CATEGORIES, requiresLicenceNumber, requiresBrokerageName, brokerageNameError } from '../data/sponsoredVendors';
import { checkVendorWebsite, VENDOR_WEBSITE_RULE } from '../data/vendorWebsite';
import { useAuth } from '../context/AuthContext';
import { ContentLink } from './home/ContentLink';
import type { ProListing } from './FindAPro';

// "Get listed free" -- the self-serve side of Find a Pro (src/server/proListingsApi.ts). A verified sign-in
// is the email confirmation; the listing goes live as soon as it is saved (owner decision, 2026-10-18).
// Free listings appear in the /pros/ directory and on their own page only, never in property reports.

const MAX_ZIPS = 5;
const MAX_DESCRIPTION = 300;
const STASH_KEY = 'br_pending_pro_listing';

interface Props { onNavigate: (path: string) => void }

type Mine = ProListing & { id: number };

export const ProListingJoin: React.FC<Props> = ({ onNavigate }) => {
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();
  useEffect(() => { requestClerkLoad(); window.scrollTo(0, 0); }, [requestClerkLoad]);

  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [zips, setZips] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [brokerageName, setBrokerageName] = useState('');
  const [description, setDescription] = useState('');
  const [attested, setAttested] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<ProListing | null>(null);
  const [mine, setMine] = useState<Mine[] | null>(null);

  // Restore what the business typed before signing in (the sign-in redirect reloads the page).
  useEffect(() => {
    const raw = sessionStorage.getItem(STASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(STASH_KEY);
    try {
      const s = JSON.parse(raw);
      setBusinessName(s.businessName || ''); setTradeCategory(s.tradeCategory || ''); setZips(s.zips || []);
      setPhone(s.phone || ''); setWebsite(s.website || ''); setLicenceNumber(s.licenceNumber || '');
      setBrokerageName(s.brokerageName || ''); setDescription(s.description || '');
    } catch { /* ignore a malformed stash */ }
  }, []);

  const loadMine = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/pros/mine', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.success) setMine(data.listings);
    } catch { /* the form still works without this list */ }
  };
  useEffect(() => { if (user) loadMine(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const addZip = () => {
    const z = zipInput.trim();
    if (!/^\d{5}$/.test(z)) return setErrors(['Enter a 5-digit ZIP code.']);
    if (zips.includes(z)) return setErrors(['You already added that ZIP code.']);
    if (zips.length >= MAX_ZIPS) return setErrors([`You can list up to ${MAX_ZIPS} ZIP codes.`]);
    setErrors([]); setZips([...zips, z]); setZipInput('');
  };

  const signIn = () => {
    sessionStorage.setItem(STASH_KEY, JSON.stringify({ businessName, tradeCategory, zips, phone, website, licenceNumber, brokerageName, description }));
    triggerClerkSignIn();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (businessName.trim().length < 2) errs.push('Enter your business name.');
    if (!tradeCategory) errs.push('Choose your business type.');
    if (zips.length < 1) errs.push('Add at least one ZIP code you serve.');
    if (phone.trim().length < 7) errs.push('Enter a phone number buyers can call.');
    if (tradeCategory && requiresLicenceNumber(tradeCategory) && licenceNumber.trim().length < 3) errs.push(`A licence, registration, or certification number is required for ${tradeCategory}.`);
    if (tradeCategory && requiresBrokerageName(tradeCategory)) { const b = brokerageNameError(brokerageName); if (b) errs.push(b); }
    const site = checkVendorWebsite(website);
    if (!site.ok) errs.push(site.error || VENDOR_WEBSITE_RULE);
    if (!attested) errs.push('Tick the confirmation box to accept the Terms of Service.');
    if (errs.length) return setErrors(errs);
    if (!user) return setErrors(['Please sign in first.']);
    setSaving(true); setErrors([]);
    const token = await getToken();
    if (!token) { setSaving(false); return setErrors(['Your session has expired -- please sign in again.']); }
    try {
      const res = await fetch('/api/pros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: businessName.trim(), tradeCategory, zipCodes: zips, phone: phone.trim(),
          website: website.trim() || undefined, licenceNumber: licenceNumber.trim() || undefined,
          brokerageName: requiresBrokerageName(tradeCategory) ? brokerageName.trim() : undefined,
          description: description.trim() || undefined, contactEmail: user.email || '', attestedAccurate: attested,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setErrors(data?.errors || [data?.error || 'Could not save your listing.']); return; }
      setCreated(data.listing);
      loadMine();
    } catch {
      setErrors(['Could not reach the server. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remove this listing from Find a Pro?')) return;
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/pros/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadMine();
  };

  const input = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500';

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink">
      <div className="border-b border-home-linen bg-white/70">
        <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <ContentLink href="/pros/" onNavigate={onNavigate} className="hover:text-home-ink">Find a Pro</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-home-ink font-semibold">Get listed free</span>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12">
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-moss">For businesses</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight [text-wrap:balance]">Get your business listed free</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Find a Pro is where home buyers on Before Regret look for local inspectors, contractors and specialists. A free
            listing shows your business name, phone, website and the ZIP codes you serve, and gives you a page of your own.
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            {['Free, with no time limit', 'Live as soon as you save it', 'Remove it any time'].map((t) => (
              <li key={t} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-home-moss mt-0.5 shrink-0" />{t}</li>
            ))}
          </ul>
          <div className="rounded-2xl bg-white border border-home-linen p-5 text-sm text-slate-600 leading-relaxed">
            <span className="font-bold text-home-ink">Want to be seen first?</span> Featured businesses appear at the top of
            Find a Pro for their ZIP codes and inside the property reports buyers run there.{' '}
            <ContentLink href="/advertise/" onNavigate={onNavigate} className="font-bold text-blue-600 hover:text-blue-700">See featured options</ContentLink>.
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          {created ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-2xl font-semibold">You&apos;re listed</h2>
              <p className="text-sm text-slate-600">{created.businessName} is now live in Find a Pro.</p>
              <ContentLink href={`/pros/${created.slug}/`} onNavigate={onNavigate} className="inline-flex items-center gap-2 px-5 py-3 bg-home-navy text-white text-sm font-bold rounded-xl">
                <span>View your listing</span><ArrowRight className="w-4 h-4" />
              </ContentLink>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold">Your listing</h2>
              <input className={input} placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={80} />
              <select className={input} value={tradeCategory} onChange={(e) => setTradeCategory(e.target.value)} aria-label="Business type">
                <option value="">Select your business type...</option>
                {TRADE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    className={input} inputMode="numeric" placeholder={`ZIP codes you serve (up to ${MAX_ZIPS})`} value={zipInput}
                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addZip(); } }}
                  />
                  <button type="button" onClick={addZip} className="px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shrink-0">Add</button>
                </div>
                {zips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {zips.map((z) => (
                      <span key={z} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                        ZIP {z}
                        <button type="button" onClick={() => setZips(zips.filter((x) => x !== z))} aria-label={`Remove ZIP ${z}`}><X className="w-3.5 h-3.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <input className={input} type="tel" placeholder="Phone buyers will call" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={input} type="url" placeholder="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
              <p className="text-[11px] text-slate-500 -mt-1">{VENDOR_WEBSITE_RULE}</p>
              {tradeCategory && requiresBrokerageName(tradeCategory) && (
                <input className={input} placeholder="Brokerage name (shown next to your name)" value={brokerageName} onChange={(e) => setBrokerageName(e.target.value)} maxLength={80} />
              )}
              {tradeCategory && requiresLicenceNumber(tradeCategory) && (
                <div className="space-y-1">
                  <input className={input} placeholder="State licence / registration number" value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} maxLength={60} />
                  <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                    Required for {tradeCategory}. It <strong>appears on your listing</strong> exactly as you type it. You are confirming it is
                    current, valid for this trade and held by this business -- a false or expired number means removal (Terms 4.4).
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <textarea
                  className={`${input} min-h-[90px]`} placeholder="A short description of what you do (optional)" value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                />
                <p className="text-[11px] text-slate-500 flex justify-between gap-3">
                  <span>{description.trim().length >= 80 ? 'Your page can appear in Google search.' : 'Write at least 80 characters and your page can appear in Google search for your business name.'}</span>
                  <span className="shrink-0">{description.length}/{MAX_DESCRIPTION}</span>
                </p>
              </div>

              {authLoading && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>}
              {!authLoading && !user && (
                <div className="rounded-2xl border border-slate-200 p-5 text-center space-y-3">
                  <p className="text-sm text-slate-600">Sign in to confirm your email and publish your listing. What you&apos;ve typed is kept.</p>
                  <button type="button" onClick={signIn} className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl">
                    <Lock className="w-4 h-4" /><span>Sign in / Sign up</span>
                  </button>
                </div>
              )}
              {!authLoading && user && (
                <>
                  <p className="text-xs text-slate-500 text-right">Signed in as <span className="font-semibold text-slate-700">{user.email || user.displayName}</span></p>
                  <label className="flex items-start gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-blue-600" />
                    <span>
                      I confirm these details are accurate, that I&apos;m authorized to list this business, and that I hold any licenses
                      and insurance my trade requires. I agree to the{' '}
                      <a href="/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Terms of Service</a>,
                      which include a binding individual arbitration agreement and class action waiver (Section 7) that I may opt out of within 30 days.
                    </span>
                  </label>
                  <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}<span>{saving ? 'Publishing…' : 'Publish my free listing'}</span>
                  </button>
                </>
              )}
              {errors.length > 0 && (
                <ul className="text-xs text-red-600 font-medium space-y-0.5">
                  {errors.map((e, i) => <li key={i} className="flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{e}</li>)}
                </ul>
              )}
            </form>
          )}

          {mine && mine.length > 0 && (
            <div className="border-t border-slate-200 pt-5 space-y-2">
              <h3 className="text-sm font-bold text-home-ink">Your listings</h3>
              {mine.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <ContentLink href={`/pros/${l.slug}/`} onNavigate={onNavigate} className="font-semibold text-blue-700 hover:underline truncate">{l.businessName}</ContentLink>
                  <button type="button" onClick={() => remove(l.id)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
