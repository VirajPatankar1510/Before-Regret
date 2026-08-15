import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, ExternalLink, Pencil, Check, X, RotateCcw, Receipt, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GuidePlacement {
  purchaseId: number;
  articleId: number;
  slug: string;
  title: string;
  businessName: string;
  tradeCategory: string;
  phone: string;
  website: string | null;
  tagline: string | null;
  paidThrough: string;
  active: boolean;
  contactEdited: boolean;
}

interface ZipPlacement {
  purchaseId: number;
  zipCode: string;
  tradeCategory: string;
  businessName: string;
  phone: string;
  website: string | null;
  tagline: string | null;
  paidThrough: string;
  active: boolean;
  contactEdited: boolean;
}

interface OrderHistoryRow {
  type: 'guide' | 'zip';
  orderId: number;
  paypalOrderId: string;
  paypalCaptureId: string | null;
  amountUsd: string;
  createdAt: string;
  description: string;
}

interface MyAdsPanelProps {
  onNavigate: (path: string) => void;
}

// Used only by the Expired section's "Buy again" -- a lapsed slot may already belong to someone
// else, so that goes through the normal checkout flow (which re-checks availability properly),
// prefilled from what was here before. An active placement's Renew button, below, is a completely
// different, dedicated flow (src/server/guideAdsApi.ts / zipAdsApi.ts's /renew routes) that never
// touches availability at all -- it extends paid_through on the existing row in place, since the
// vendor already owns it and there's nothing to contend for. Earlier attempts routed early
// renewal through this same checkout flow and were verified, live, to fail: the availability
// check reads the vendor's own active row as "taken" regardless of how close to expiry it is.
const RENEW_GUIDE_KEY = 'br_renew_guide_ads';
const RENEW_ZIP_KEY = 'br_renew_zip_ad';

function daysLeft(paidThrough: string): number {
  return Math.ceil((new Date(paidThrough).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function expiryLabel(paidThrough: string): string {
  return new Date(paidThrough).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Deliberately named "My Placements," never "Dashboard" -- this app doesn't track or guarantee
// impressions, clicks, or any other visibility metric for either ad product (see
// AdvertiseCompare.tsx's "buying a fixed placement, not impressions" framing), so a page called
// "Dashboard" would set an expectation of analytics this can't and won't deliver. Its actual job
// is proof of purchase, expiry, contact-detail edits, and renewal -- a placement manager, not a
// stats board. See src/server/myAdsApi.ts.
export const MyAdsPanel: React.FC<MyAdsPanelProps> = ({ onNavigate }) => {
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();

  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

  const [guidePlacements, setGuidePlacements] = useState<GuidePlacement[] | null>(null);
  const [zipPlacements, setZipPlacements] = useState<ZipPlacement[] | null>(null);
  const [orders, setOrders] = useState<OrderHistoryRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [renewingKey, setRenewingKey] = useState<string | null>(null);
  const [renewBanner, setRenewBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPlacements = async () => {
    // Verified session token, not the uid -- the server derives identity from this (see
    // clerkAuth.ts) rather than trusting an id in the URL, which used to mean anyone could list
    // another vendor's placements just by knowing their Clerk user id.
    const token = await getToken();
    if (!token) {
      setLoadError('Your session has expired -- please sign in again.');
      return;
    }
    fetch('/api/my-ads', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setLoadError(data?.error || 'Could not load your placements.');
          return;
        }
        setGuidePlacements(data.guidePlacements);
        setZipPlacements(data.zipPlacements);
        setOrders(data.orders || []);
      })
      .catch(() => setLoadError('Could not reach the server.'));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) loadPlacements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // PayPal lands back here with ?renewed=guide|zip&token=<orderId> after a renewal approval --
  // same "capture on the return page" shape as GuideAdsCheckoutSuccess.tsx / ZipAdsCheckoutSuccess.tsx,
  // just inline here instead of a dedicated success page, since there's nothing to show beyond
  // "it worked, here's your new expiry" and the vendor is already looking at the right list.
  // Query params are stripped immediately so a later refresh of this page can't re-fire the capture.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const renewed = params.get('renewed');
    const token = params.get('token');
    if (!renewed || !token) return;
    window.history.replaceState({}, '', '/my-ads');
    const endpoint = renewed === 'guide' ? `/api/guide-ads/renew/${token}/capture` : `/api/zip-ads/renew/${token}/capture`;
    fetch(endpoint, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setRenewBanner({ type: 'error', message: data?.error || 'Could not confirm the renewal payment.' });
          return;
        }
        const label = renewed === 'guide' ? data.title || 'Your topic ad' : `${data.tradeCategory || 'Your report ad'} in ZIP ${data.zipCode || ''}`;
        setRenewBanner({ type: 'success', message: `Renewed -- ${label} is now live through ${expiryLabel(data.paidThrough)}.` });
        loadPlacements();
      })
      .catch(() => setRenewBanner({ type: 'error', message: 'Could not reach the server to confirm the renewal.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const activeGuides = useMemo(
    () => (guidePlacements || []).filter((p) => p.active).sort((a, b) => new Date(a.paidThrough).getTime() - new Date(b.paidThrough).getTime()),
    [guidePlacements]
  );
  const expiredGuides = useMemo(() => (guidePlacements || []).filter((p) => !p.active), [guidePlacements]);
  const activeZips = useMemo(
    () => (zipPlacements || []).filter((p) => p.active).sort((a, b) => new Date(a.paidThrough).getTime() - new Date(b.paidThrough).getTime()),
    [zipPlacements]
  );
  const expiredZips = useMemo(() => (zipPlacements || []).filter((p) => !p.active), [zipPlacements]);

  const startEdit = (key: string, p: { phone: string; website: string | null; tagline: string | null }) => {
    setEditingKey(key);
    setEditPhone(p.phone);
    setEditWebsite(p.website || '');
    setEditTagline(p.tagline || '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditError(null);
  };

  const saveGuideEdit = async (purchaseId: number) => {
    if (!user) return;
    if (!editPhone.trim()) return setEditError('Phone number is required.');
    setSavingEdit(true);
    setEditError(null);
    const token = await getToken();
    if (!token) { setEditError('Your session has expired -- please sign in again.'); setSavingEdit(false); return; }
    try {
      const res = await fetch(`/api/my-ads/guide/${purchaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: editPhone.trim(), website: editWebsite.trim() || undefined, tagline: editTagline.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data?.error || 'Could not save.'); setSavingEdit(false); return; }
      setGuidePlacements((prev) => (prev || []).map((p) => p.purchaseId === purchaseId ? { ...p, phone: editPhone.trim(), website: editWebsite.trim() || null, tagline: editTagline.trim() || null, contactEdited: true } : p));
      setEditingKey(null);
    } catch {
      setEditError('Could not reach the server.');
    } finally {
      setSavingEdit(false);
    }
  };

  const saveZipEdit = async (purchaseId: number) => {
    if (!user) return;
    if (!editPhone.trim()) return setEditError('Phone number is required.');
    setSavingEdit(true);
    setEditError(null);
    const token = await getToken();
    if (!token) { setEditError('Your session has expired -- please sign in again.'); setSavingEdit(false); return; }
    try {
      const res = await fetch(`/api/my-ads/zip/${purchaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: editPhone.trim(), website: editWebsite.trim() || undefined, tagline: editTagline.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data?.error || 'Could not save.'); setSavingEdit(false); return; }
      setZipPlacements((prev) => (prev || []).map((p) => p.purchaseId === purchaseId ? { ...p, phone: editPhone.trim(), website: editWebsite.trim() || null, tagline: editTagline.trim() || null, contactEdited: true } : p));
      setEditingKey(null);
    } catch {
      setEditError('Could not reach the server.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Extends the existing placement in place -- see the comment above RENEW_GUIDE_KEY for how this
  // differs from renewGuide/renewZip below, which start a fresh checkout for an already-expired one.
  const startGuideRenew = async (p: GuidePlacement) => {
    if (!user) return;
    const key = `guide-${p.purchaseId}`;
    setRenewingKey(key);
    setRenewBanner(null);
    const token = await getToken();
    if (!token) {
      setRenewBanner({ type: 'error', message: 'Your session has expired -- please sign in again.' });
      setRenewingKey(null);
      return;
    }
    try {
      const res = await fetch(`/api/guide-ads/renew/${p.purchaseId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) {
        setRenewBanner({ type: 'error', message: data?.error || 'Could not start renewal.' });
        setRenewingKey(null);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setRenewBanner({ type: 'error', message: 'Could not reach the server.' });
      setRenewingKey(null);
    }
  };

  const startZipRenew = async (p: ZipPlacement) => {
    if (!user) return;
    const key = `zip-${p.purchaseId}`;
    setRenewingKey(key);
    setRenewBanner(null);
    const token = await getToken();
    if (!token) {
      setRenewBanner({ type: 'error', message: 'Your session has expired -- please sign in again.' });
      setRenewingKey(null);
      return;
    }
    try {
      const res = await fetch(`/api/zip-ads/renew/${p.purchaseId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) {
        setRenewBanner({ type: 'error', message: data?.error || 'Could not start renewal.' });
        setRenewingKey(null);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setRenewBanner({ type: 'error', message: 'Could not reach the server.' });
      setRenewingKey(null);
    }
  };

  const renewGuide = (p: GuidePlacement) => {
    sessionStorage.setItem(RENEW_GUIDE_KEY, JSON.stringify({
      articleIds: [p.articleId], businessName: p.businessName, tradeCategory: p.tradeCategory,
      phone: p.phone, website: p.website, tagline: p.tagline,
    }));
    onNavigate('/topic-ads');
  };

  const renewZip = (p: ZipPlacement) => {
    sessionStorage.setItem(RENEW_ZIP_KEY, JSON.stringify({
      zipCode: p.zipCode, tradeCategory: p.tradeCategory, businessName: p.businessName,
      phone: p.phone, website: p.website, tagline: p.tagline,
    }));
    onNavigate('/report-ads');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-medium">Checking your account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold border border-blue-100">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sign-In Required</span>
          </div>
          <h1 className="font-serif text-xl font-bold text-slate-900">Sign in to manage your placements</h1>
          <p className="text-xs text-slate-600 leading-relaxed">Your placements are tied to the account you checked out with.</p>
          <button
            type="button"
            onClick={() => triggerClerkSignIn()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In / Sign Up</span>
          </button>
        </div>
      </div>
    );
  }

  // Shared by both active-guide and active-zip cards.
  const renewButton = (key: string, onRenew: () => void) => (
    <button
      type="button"
      onClick={onRenew}
      disabled={renewingKey === key}
      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-60 disabled:cursor-wait"
    >
      {renewingKey === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
      <span>Renew (+30 days)</span>
    </button>
  );

  const editForm = (onSave: () => void) => (
    <div className="mt-3 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
        <Lock className="w-3 h-3 shrink-0" />
        <span>You get one edit per placement -- double-check these before saving.</span>
      </p>
      <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
      <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website (optional)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
      <input type="text" value={editTagline} onChange={(e) => setEditTagline(e.target.value)} placeholder="Tagline (optional)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
      {editError && <p className="text-xs text-rose-600">{editError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onSave} disabled={savingEdit} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg disabled:opacity-60">
          {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          <span>Save</span>
        </button>
        <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg">
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Manage what you've bought</h1>
        </div>

        {loadError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{loadError}</p>}

        {renewBanner && (
          <p className={`text-xs rounded-lg p-3 border ${renewBanner.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
            {renewBanner.message}
          </p>
        )}

        {(guidePlacements === null || zipPlacements === null) && !loadError && (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
        )}

        {guidePlacements !== null && zipPlacements !== null && (
          <>
            {/* --- Active placements ------------------------------------------------------- */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Active</h2>
              {activeGuides.length === 0 && activeZips.length === 0 && (
                <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-4">No active placements right now.</p>
              )}
              {activeGuides.map((p) => {
                const key = `guide-${p.purchaseId}`;
                const left = daysLeft(p.paidThrough);
                return (
                  <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          <BookOpen className="w-3 h-3" /><span>Topic Ad</span>
                        </div>
                        <a href={`/guides/${p.slug}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-blue-700 mt-0.5">
                          <span>{p.title}</span><ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <p className="text-xs text-slate-500 mt-1">{p.businessName} &middot; {p.tradeCategory} &middot; {p.phone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${left <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{left} day{left === 1 ? '' : 's'} left</div>
                        <div className="text-[11px] text-slate-400">Live until {expiryLabel(p.paidThrough)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {p.contactEdited ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Lock className="w-3 h-3" /><span>Contact info edit used</span>
                        </span>
                      ) : (
                        <button type="button" onClick={() => startEdit(key, p)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                          <Pencil className="w-3 h-3" /><span>Edit contact info</span>
                        </button>
                      )}
                      {renewButton(key, () => startGuideRenew(p))}
                    </div>
                    {editingKey === key && editForm(() => saveGuideEdit(p.purchaseId))}
                  </div>
                );
              })}
              {activeZips.map((p) => {
                const key = `zip-${p.purchaseId}`;
                const left = daysLeft(p.paidThrough);
                return (
                  <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          <MapPin className="w-3 h-3" /><span>Report Ad</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{p.tradeCategory} in ZIP {p.zipCode}</p>
                        <p className="text-xs text-slate-500 mt-1">{p.businessName} &middot; {p.phone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${left <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{left} day{left === 1 ? '' : 's'} left</div>
                        <div className="text-[11px] text-slate-400">Live until {expiryLabel(p.paidThrough)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {p.contactEdited ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Lock className="w-3 h-3" /><span>Contact info edit used</span>
                        </span>
                      ) : (
                        <button type="button" onClick={() => startEdit(key, p)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                          <Pencil className="w-3 h-3" /><span>Edit contact info</span>
                        </button>
                      )}
                      {renewButton(key, () => startZipRenew(p))}
                    </div>
                    {editingKey === key && editForm(() => saveZipEdit(p.purchaseId))}
                  </div>
                );
              })}
            </section>

            {/* --- Expired -- renewal is the whole point of this zone, kept visually prominent - */}
            {(expiredGuides.length > 0 || expiredZips.length > 0) && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Expired</h2>
                {expiredGuides.map((p) => (
                  <div key={`ex-guide-${p.purchaseId}`} className="bg-slate-100 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 opacity-80">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-600">{p.title}</p>
                      <p className="text-xs text-slate-400">Expired {expiryLabel(p.paidThrough)}</p>
                    </div>
                    <button type="button" onClick={() => renewGuide(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" /><span>Buy again</span>
                    </button>
                  </div>
                ))}
                {expiredZips.map((p) => (
                  <div key={`ex-zip-${p.purchaseId}`} className="bg-slate-100 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 opacity-80">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-600">{p.tradeCategory} in ZIP {p.zipCode}</p>
                      <p className="text-xs text-slate-400">Expired {expiryLabel(p.paidThrough)}</p>
                    </div>
                    <button type="button" onClick={() => renewZip(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" /><span>Buy again</span>
                    </button>
                  </div>
                ))}
              </section>
            )}

            {/* --- Order history: with no email receipt sent for either product, this table is -
                the only proof of purchase that exists anywhere. */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="w-4 h-4" /><span>Order History</span>
              </h2>
              {orders.length === 0 && <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-4">No completed orders yet.</p>}
              {orders.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <th className="py-2.5 px-4 font-semibold">Date</th>
                          <th className="py-2.5 px-4 font-semibold">What</th>
                          <th className="py-2.5 px-4 font-semibold">Amount</th>
                          <th className="py-2.5 px-4 font-semibold">Payment Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((o) => (
                          <tr key={`${o.type}-${o.orderId}`}>
                            <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td className="py-2.5 px-4 text-slate-800">{o.description}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">${Number(o.amountUsd).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{o.paypalCaptureId || o.paypalOrderId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
