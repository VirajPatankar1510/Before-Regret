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
  const { user, loading: authLoading, triggerClerkSignIn, requestClerkLoad } = useAuth();

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

  const loadPlacements = (uid: string) => {
    fetch(`/api/my-ads/${uid}`)
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
    if (user) loadPlacements(user.uid);
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
    try {
      const res = await fetch(`/api/my-ads/guide/${purchaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.uid, phone: editPhone.trim(), website: editWebsite.trim() || undefined, tagline: editTagline.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data?.error || 'Could not save.'); setSavingEdit(false); return; }
      setGuidePlacements((prev) => (prev || []).map((p) => p.purchaseId === purchaseId ? { ...p, phone: editPhone.trim(), website: editWebsite.trim() || null, tagline: editTagline.trim() || null } : p));
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
    try {
      const res = await fetch(`/api/my-ads/zip/${purchaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.uid, phone: editPhone.trim(), website: editWebsite.trim() || undefined, tagline: editTagline.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data?.error || 'Could not save.'); setSavingEdit(false); return; }
      setZipPlacements((prev) => (prev || []).map((p) => p.purchaseId === purchaseId ? { ...p, phone: editPhone.trim(), website: editWebsite.trim() || null, tagline: editTagline.trim() || null } : p));
      setEditingKey(null);
    } catch {
      setEditError('Could not reach the server.');
    } finally {
      setSavingEdit(false);
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

  const editForm = (onSave: () => void) => (
    <div className="mt-3 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
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
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">My Placements</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-2">Manage what you've bought</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Proof of purchase, expiry, and contact details for every placement on this account.
            We don't track impressions or clicks for either product -- click through to a live guide to see it yourself.
          </p>
        </div>

        {loadError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{loadError}</p>}

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
                    <div className="flex gap-3 mt-3">
                      <button type="button" onClick={() => startEdit(key, p)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                        <Pencil className="w-3 h-3" /><span>Edit contact info</span>
                      </button>
                      <button type="button" onClick={() => renewGuide(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                        <RotateCcw className="w-3 h-3" /><span>Renew</span>
                      </button>
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
                    <div className="flex gap-3 mt-3">
                      <button type="button" onClick={() => startEdit(key, p)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                        <Pencil className="w-3 h-3" /><span>Edit contact info</span>
                      </button>
                      <button type="button" onClick={() => renewZip(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                        <RotateCcw className="w-3 h-3" /><span>Renew</span>
                      </button>
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
