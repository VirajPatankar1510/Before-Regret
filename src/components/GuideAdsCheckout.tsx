import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Loader2, AlertCircle, CheckSquare, Square, Lock, Search, Megaphone, Globe,
  ListChecks, CircleDollarSign, Phone, ExternalLink, ChevronDown, CreditCard, ShieldCheck, XCircle,
} from 'lucide-react';
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

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Do you verify businesses before listing them?',
    a: 'No -- this is self-serve. Business name, trade category, and contact details are self-reported at checkout, not independently verified.',
  },
  {
    q: 'How many people will see my ad?',
    a: "We don't track or guarantee impressions, clicks, or leads -- you're buying a fixed placement for the window, not a performance number.",
  },
  {
    q: 'Can I pick more than one guide?',
    a: 'Yes -- select as many as you want in one checkout. Each guide is a separate $7.99 charge, all paid in one PayPal transaction.',
  },
  {
    q: 'What happens when my placement expires?',
    a: 'It stops showing and the slot reopens for other vendors. No reminder email is sent right now -- check My Placements or come back to buy another window if you want to stay live.',
  },
  {
    q: 'Can I edit my phone or website after I’ve paid?',
    a: 'Yes, any time from My Placements. Business name and trade category are locked once purchased.',
  },
  {
    q: 'Is this a subscription?',
    a: "No. It's a single flat charge for a fixed 30-day window -- nothing bills you again automatically.",
  },
];

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
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();

  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pricePerSlot, setPricePerSlot] = useState(7.99);
  const [slotDurationDays, setSlotDurationDays] = useState(30);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [showAllGuides, setShowAllGuides] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Starts the Clerk chunk loading as soon as this page mounts -- not on the "Sign In to Pay"
  // click itself. requestClerkLoad() only flips a flag that mounts ClerkAuthBridge; the actual
  // sign-in trigger (clerkInstanceRef) isn't ready until that bridge reports back, which is
  // asynchronous. Calling both requestClerkLoad() and triggerClerkSignIn() in the same click
  // handler (the previous version of this effect) meant triggerClerkSignIn() almost always fired
  // before Clerk had loaded and no-opped with just a console.warn -- worse, `authLoading` never
  // resolves to false without this call at all, so the button was stuck permanently disabled
  // (see its `disabled={authLoading}` below). Guide browsing itself stays unauthenticated either
  // way -- this only front-loads the auth chunk, not a sign-in prompt.
  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

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

  // Clerk is already loading by the time this is clickable (see the mount effect above) -- the
  // button itself is disabled while authLoading is true, so triggerClerkSignIn() only ever fires
  // once clerkInstanceRef is actually populated.
  const handleSignInClick = () => {
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

  // Guides matching the vendor's own selected trade are split into their own group -- with 96
  // guides and no grouping otherwise, a roofer had to scroll an alphabetical wall of titles to
  // find the handful actually relevant to their trade. "Other guides" stays collapsed behind a
  // toggle unless the vendor is actively searching (search intent overrides grouping) or hasn't
  // picked a trade yet (nothing to group by, so there's just one browsable list).
  const isSearching = search.trim().length > 0;
  const { matchedGuides, otherGuides } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = guides ? guides.filter((g) => !query || g.title.toLowerCase().includes(query)) : [];
    if (!tradeCategory) return { matchedGuides: [] as GuideRow[], otherGuides: filtered };
    const matched: GuideRow[] = [];
    const rest: GuideRow[] = [];
    for (const g of filtered) {
      (guessTradeCategoryFromTitle(g.title) === tradeCategory ? matched : rest).push(g);
    }
    return { matchedGuides: matched, otherGuides: rest };
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
    // A verified session token, not the raw uid -- the server checks this against Clerk's own
    // signing keys (src/server/clerkAuth.ts) rather than trusting whatever id gets sent, so an
    // order can no longer be attributed to an account that isn't actually the one paying.
    const token = await getToken();
    if (!token) {
      setSubmitError('Your session has expired -- please sign in again.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/guide-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tradeCategory,
          phone: phone.trim(),
          website: website.trim() || undefined,
          tagline: tagline.trim() || undefined,
          contactEmail,
          slots: Array.from(selected),
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

  // Shared row markup for both the "matches your trade" and "other guides" groups (and the flat
  // search-results list) -- one definition so the taken/selected states can't visually drift
  // between whichever group a given guide happens to render in.
  const renderGuideRow = (g: GuideRow) => {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-10">
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

        {/* Hero -- this page used to jump straight from a plain heading into a form, which read
            as abrupt next to /advertise and /report-ads' dark hero banners. Matches their visual
            language so the three ad pages feel like one funnel rather than three unrelated pages. */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-mono font-bold text-blue-300">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Topic Ads</span>
          </div>

          <div className="space-y-4 max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight">
              Get your phone number in front of people researching this exact problem
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              ${pricePerSlot.toFixed(2)} per guide, {slotDurationDays} days -- pick as many guides as you want,
              pay once, and your business shows up there until it expires. Any business can advertise on any guide.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              No subscription
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Self-serve checkout
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              No auto-renewal
            </span>
          </div>
        </div>

        {/* Three value points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Nationwide Reach</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Shown on the educational guides you pick, across the whole site -- not tied to any one ZIP code.
              Readers researching that exact topic see you, wherever they are.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ListChecks className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">You Choose the Topics</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Any business, any guide -- pick exactly which pages you appear on and how many, all in one checkout.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Lowest Cost Per Slot</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              ${pricePerSlot.toFixed(2)} vs. $29 for a Report Ad -- a good fit if you serve customers across many
              cities or the whole country.
            </p>
          </div>
        </div>

        {/* Visual placement preview -- mirrors GuideAdSlot.tsx's real active-vendor card exactly
            (green border, "Ad" badge, business name/trade/phone), so this can never drift from
            what actually renders on a live guide page. */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Visual Placement Preview</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">How Your Listing Appears</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              This is exactly what your placement looks like on a guide page, right after the reader's Quick Answer:
            </p>
          </div>

          <div className="relative bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-r-2xl p-4 sm:p-5 max-w-2xl mx-auto">
            <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Ad
            </span>
            <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Electrician</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">Example Electric Co.</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Locally owned, same-day estimates</p>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600">
                  <Phone className="w-3.5 h-3.5" />
                  <span>(512) 555-0100</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <ExternalLink className="w-3 h-3" />
                  <span>Visit website</span>
                </span>
              </div>
            </div>
          </div>
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
              {guides && guides.length > 0 && (
                <span className="text-[11px] text-slate-400 font-medium">{guides.length} guides available</span>
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

            {guides && guides.length > 0 && matchedGuides.length + otherGuides.length === 0 && (
              <p className="text-xs text-slate-500 py-4">No guides match "{search}".</p>
            )}

            {/* Searching overrides grouping -- flat results, matched-trade guides still first. */}
            {guides && guides.length > 0 && isSearching && matchedGuides.length + otherGuides.length > 0 && (
              <div className="divide-y divide-slate-100 -mx-1 max-h-[28rem] overflow-y-auto">
                {[...matchedGuides, ...otherGuides].map(renderGuideRow)}
              </div>
            )}

            {/* Not searching, a trade is picked: matched guides shown expanded, everything else
                collapsed behind a toggle -- this is the group breakdown that replaces the old
                single 96-item scroll. */}
            {guides && guides.length > 0 && !isSearching && tradeCategory && (
              <>
                <div className="space-y-1.5">
                  <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                    Matches {tradeCategory} ({matchedGuides.length})
                  </span>
                  {matchedGuides.length > 0 ? (
                    <div className="divide-y divide-slate-100 -mx-1 border-y border-slate-100">
                      {matchedGuides.map(renderGuideRow)}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-2">No guide titles matched {tradeCategory} specifically -- browse all guides below.</p>
                  )}
                </div>

                {otherGuides.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAllGuides((v) => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 cursor-pointer"
                    >
                      <span>{showAllGuides ? 'Hide' : 'Show'} {otherGuides.length} other guide{otherGuides.length === 1 ? '' : 's'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllGuides ? 'rotate-180' : ''}`} />
                    </button>
                    {showAllGuides && (
                      <div className="divide-y divide-slate-100 -mx-1 max-h-[24rem] overflow-y-auto">
                        {otherGuides.map(renderGuideRow)}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* No trade picked yet, not searching: nothing to group by, so just offer to browse
                everything rather than dumping all 96 titles by default. */}
            {guides && guides.length > 0 && !isSearching && !tradeCategory && (
              <>
                <p className="text-xs text-slate-500">
                  Pick a business type above to see guides matching your trade first, or browse all {otherGuides.length} guides below.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllGuides((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 cursor-pointer"
                >
                  <span>{showAllGuides ? 'Hide' : 'Browse all'} {otherGuides.length} guides</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllGuides ? 'rotate-180' : ''}`} />
                </button>
                {showAllGuides && (
                  <div className="divide-y divide-slate-100 -mx-1 max-h-[28rem] overflow-y-auto">
                    {otherGuides.map(renderGuideRow)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* FAQ -- right before the total/CTA, so the honest answers (no verification, no view
              guarantee, no refunds) land just before the moment of paying rather than after. */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-1">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Questions before you buy</h2>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="border-t border-slate-100 first:border-t-0 py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{item.q}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.a}</p>
                  )}
                </div>
              );
            })}
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
