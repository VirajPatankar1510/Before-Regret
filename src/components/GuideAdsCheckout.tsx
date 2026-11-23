import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Loader2, AlertCircle, Check, Search, ChevronDown, Lock, CreditCard, ClipboardEdit, MousePointerClick,
} from 'lucide-react';
import { TRADE_CATEGORIES, requiresLicenceNumber } from '../data/sponsoredVendors';
import { rankArticlesForTrade } from '../data/guideAdRelevance';
import { useAuth } from '../context/AuthContext';
import { GuideAdVendorCard } from './GuideAdSlot';

interface GuideRow {
  articleId: number;
  slug: string;
  title: string;
  taken: boolean;
  // Which price band this guide sells at -- see src/server/adPricing.ts. Optional so a stale cached
  // response from before tiers existed still renders; the fallback treats it as standard.
  tier?: 'standard' | 'geo';
  priceUsd?: number;
}

// A topic sponsorship on offer (src/data/adClusters.ts): one advertiser on every open guide in a
// topic, for one flat price, priced and checked server-side.
interface ClusterOffer {
  key: string;
  name: string;
  priceUsd: number;
  trades: string[];
  openCount: number;
  guides: Array<{ articleId: number; slug: string; title: string; taken: boolean }>;
}

interface GuideAdsCheckoutProps {
  onNavigate: (path: string) => void;
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'What do I fill in after paying?',
    a: 'Your business name, a phone number readers can call, and your website if you have one. You add them in My Ads right after PayPal, once for the whole order, and your ad goes live as soon as you save them. Your business type, and your license number if your trade needs one, are asked before you pay, so you can finish without getting stuck.',
  },
  {
    q: 'When do my 30 days start?',
    a: 'When your ad goes live, which is when you save your business details. Until then the articles you bought are held for you. If details are never added, the hold ends 30 days after payment and the articles reopen.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. You sign in with your email when you buy, so only you can see and manage your ads in My Ads.',
  },
  {
    q: 'How many people will see my ad?',
    a: "We don't guarantee impressions, clicks or leads. You're buying a fixed placement for 30 days, not a performance number. We can't count article views either: guide pages are served from a cache that never reaches our server.",
  },
  {
    q: 'Is this a subscription? Can I get a refund?',
    a: "It's a single flat charge for 30 days. Nothing bills you again automatically. There are no refunds once payment completes.",
  },
];

// /topic-ads/ -- the Topic Ads checkout. REBUILT 2026-11-15 after the owner's vendor survey: almost
// every vendor found the old page long and hard to follow before they ever reached PayPal (a
// business-details form, a trade dropdown, a license field and a legal checkbox all sat in front of
// the button). Now the page asks for exactly one thing, which articles, and the button pays for
// them. The business name, phone and website are collected AFTER payment in My Ads (see
// AdDetailsForm.tsx and POST /api/my-ads/details), where the same rules are enforced. Owner,
// 2026-11-22: the business type (and the license number for trades that need one) moved back in
// front of the button, so a business that has no license number finds out before paying, not after.
// The business-type dropdown also sorts the article list.
//
// Sign-in still happens before PayPal: the order has to belong to an account so the vendor can
// find it again to add their details. A vendor who isn't signed in clicks Buy now, signs in, and is
// taken straight on to PayPal with their selection intact (AUTH_STASH_KEY + autoBuy below).
const AUTH_STASH_KEY = 'br_pending_guide_ads_signup';
const RENEW_STASH_KEY = 'br_renew_guide_ads';
// Written right before the redirect to PayPal, so "Cancel and return" (?token=...) brings back the selection.
const PAYPAL_STASH_KEY = 'br_paypal_return_guide_ads';

type Stash = { articleIds?: number[]; clusterKey?: string | null; tradeCategory?: string; licenceNumber?: string | null; autoBuy?: boolean };

export const GuideAdsCheckout: React.FC<GuideAdsCheckoutProps> = ({ onNavigate }) => {
  const { user, loading: authLoading, triggerClerkSignIn, getToken, requestClerkLoad } = useAuth();

  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pricePerSlot, setPricePerSlot] = useState(9.99);
  const [slotDurationDays, setSlotDurationDays] = useState(30);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [clusters, setClusters] = useState<ClusterOffer[]>([]);
  // A topic sponsorship and single guides are separate purchases, so choosing one clears the other.
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Required since 2026-11-22 (owner): the business type is chosen before payment, with the license
  // number for trades that need one, so nobody pays and then can't finish. It also sorts the list so
  // articles for this trade come first, and it is fixed for the order after payment.
  const [tradeCategory, setTradeCategory] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [showAllGuides, setShowAllGuides] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  // 'auth': back from sign-in, continue only if signed in. 'click': Buy now pressed while the
  // account was still loading, so carry on (to sign-in or PayPal) as soon as it has.
  const [resumeBuy, setResumeBuy] = useState<'auth' | 'click' | null>(null);
  const [returnNotice, setReturnNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load the Clerk chunk on mount, so Buy now can open sign-in at once (see AuthContext.tsx).
  useEffect(() => {
    requestClerkLoad();
  }, [requestClerkLoad]);

  // A real navigation away and back (sign-in redirect, PayPal cancel, "Buy again" in My Ads)
  // remounts the app and wipes state, so the selection is restored from sessionStorage.
  useEffect(() => {
    const restore = (raw: string): Stash => {
      const stash = JSON.parse(raw) as Stash;
      setSelected(new Set(stash.articleIds || []));
      setSelectedCluster(stash.clusterKey || null);
      if (stash.tradeCategory) setTradeCategory(stash.tradeCategory);
      if (stash.licenceNumber) setLicenceNumber(stash.licenceNumber);
      return stash;
    };
    const paypalRaw = sessionStorage.getItem(PAYPAL_STASH_KEY);
    sessionStorage.removeItem(PAYPAL_STASH_KEY);
    const params = new URLSearchParams(window.location.search);
    if (paypalRaw && params.has('token')) {
      try {
        restore(paypalRaw);
        setReturnNotice('Your PayPal checkout was cancelled and nothing was charged. Your articles are still selected.');
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
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch('/api/guide-ads/slots')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const rows: GuideRow[] = data.guides;
          setGuides(rows);
          const offers: ClusterOffer[] = Array.isArray(data.clusters) ? data.clusters : [];
          setClusters(offers);
          const params = new URLSearchParams(window.location.search);
          // /topic-ads/?topic=stucco opens with that sponsorship chosen; /topic-ads/?guide=<slug>
          // opens with that one article chosen, so a pitch can link straight to "buy this page".
          // Only when actually available, and never over a restored selection.
          const wantedTopic = params.get('topic');
          if (wantedTopic && offers.some((c) => c.key === wantedTopic)) {
            setSelectedCluster((prev) => prev ?? wantedTopic);
          }
          const wantedGuide = params.get('guide');
          const guide = wantedGuide ? rows.find((g) => g.slug === wantedGuide && !g.taken) : undefined;
          if (guide) setSelected((prev) => (prev.size > 0 ? prev : new Set([guide.articleId])));
          if (typeof data.pricePerSlotUsd === 'number') setPricePerSlot(data.pricePerSlotUsd);
          if (typeof data.tierPricesUsd?.standard === 'number') setPricePerSlot(data.tierPricesUsd.standard);
          if (typeof data.slotDurationDays === 'number') setSlotDurationDays(data.slotDurationDays);
        } else {
          setLoadError(data?.error || 'Could not load available placements.');
        }
      })
      .catch(() => setLoadError('Could not reach the server.'));
  }, []);

  const toggleSlot = (articleId: number) => {
    setSelectedCluster(null);
    setSubmitError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  };

  const toggleCluster = (key: string) => {
    setSelected(new Set());
    setSubmitError(null);
    setSelectedCluster((prev) => (prev === key ? null : key));
  };

  // Once a business type is picked: articles about its own subject first, then the next-best
  // articles (neighbouring trades' subjects, see src/data/guideAdRelevance.ts), both shown open; the
  // rest sit behind a toggle. Owner, 2026-11-22: the old one-trade-per-title match left most trades
  // with an empty-looking list. Searching overrides the grouping; no business type = one list.
  const isSearching = search.trim().length > 0;
  const { bestGuides, relatedGuides, otherGuides } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = guides ? guides.filter((g) => !query || g.title.toLowerCase().includes(query)) : [];
    if (!tradeCategory) return { bestGuides: [] as GuideRow[], relatedGuides: [] as GuideRow[], otherGuides: filtered };
    const ranked = rankArticlesForTrade(filtered, tradeCategory);
    return { bestGuides: ranked.best, relatedGuides: ranked.related, otherGuides: ranked.rest };
  }, [guides, search, tradeCategory]);
  const matchedGuides = useMemo(() => [...bestGuides, ...relatedGuides], [bestGuides, relatedGuides]);

  // Topics follow the trade filter when one is set; otherwise every topic on offer shows. A chosen
  // topic always stays visible, so the cart never holds something the vendor can't see.
  const visibleClusters = useMemo(
    () => clusters.filter((c) => !tradeCategory || c.trades.includes(tradeCategory) || c.key === selectedCluster),
    [clusters, tradeCategory, selectedCluster]
  );
  const chosenCluster = clusters.find((c) => c.key === selectedCluster) ?? null;

  const selectedCount = selected.size;
  // Display only -- the amount charged is recomputed server-side from each guide's stored tier.
  const priceOf = (g: GuideRow) => (typeof g.priceUsd === 'number' ? g.priceUsd : pricePerSlot);
  const total = useMemo(() => {
    if (chosenCluster) return chosenCluster.priceUsd;
    if (!guides) return selectedCount * pricePerSlot;
    return guides.reduce((sum, g) => (selected.has(g.articleId) ? sum + priceOf(g) : sum), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guides, selected, pricePerSlot, selectedCount, chosenCluster]);
  const hasSelection = selectedCount > 0 || chosenCluster !== null;
  const needsLicence = Boolean(tradeCategory) && requiresLicenceNumber(tradeCategory);
  const licenceTrimmed = licenceNumber.trim();
  const licenceOk = !needsLicence || (licenceTrimmed.length >= 3 && licenceTrimmed.length <= 60);
  const canBuy = hasSelection && Boolean(tradeCategory) && licenceOk;

  const buy = async () => {
    setSubmitError(null);
    setReturnNotice(null);
    if (!hasSelection) return setSubmitError('Pick at least one article first.');
    if (!tradeCategory) return setSubmitError('Choose your business type at the top.');
    if (!licenceOk) return setSubmitError(`Enter your license number at the top. It's required for ${tradeCategory}.`);
    if (authLoading) {
      setResumeBuy('click');
      return;
    }
    if (!user) {
      // Sign-in's completion is a real browser navigation, so the selection rides in sessionStorage
      // and autoBuy carries the vendor straight on to PayPal once they're back.
      sessionStorage.setItem(AUTH_STASH_KEY, JSON.stringify({
        articleIds: Array.from(selected), clusterKey: selectedCluster, tradeCategory, licenceNumber: licenceTrimmed, autoBuy: true,
      } satisfies Stash));
      triggerClerkSignIn();
      return;
    }
    setSubmitting(true);
    const token = await getToken();
    if (!token) {
      setSubmitError('Your session has expired -- please sign in again.');
      setSubmitting(false);
      return;
    }
    try {
      const base = {
        quick: true, acceptedTerms: true, contactEmail: user.email || `${user.uid}@beforeregret.com`,
        tradeCategory, licenceNumber: needsLicence ? licenceTrimmed : undefined,
      };
      const res = await fetch(chosenCluster ? '/api/guide-ads/cluster-checkout' : '/api/guide-ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(chosenCluster ? { ...base, clusterKey: chosenCluster.key } : { ...base, slots: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data?.clusterTaken) {
          setSubmitError('This topic was just sponsored by someone else, or one of its articles was taken. Refresh the page to see what is open.');
        } else if (data?.takenArticleIds) {
          setSubmitError('One or more of your articles were just taken by someone else. Refresh the page and pick again.');
        } else {
          setSubmitError(data?.error || 'Could not start checkout.');
        }
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem(PAYPAL_STASH_KEY, JSON.stringify({
        articleIds: Array.from(selected), clusterKey: selectedCluster, tradeCategory, licenceNumber: licenceTrimmed,
      } satisfies Stash));
      window.location.href = data.approvalUrl;
    } catch {
      setSubmitError('Could not reach the server.');
      setSubmitting(false);
    }
  };

  // Back from sign-in with autoBuy: continue to PayPal once the account and the article list are ready.
  useEffect(() => {
    if (!resumeBuy || authLoading || !guides) return;
    const why = resumeBuy;
    setResumeBuy(null);
    if (canBuy && (user || why === 'click')) buy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeBuy, authLoading, user, guides, canBuy]);

  const renderGuideRow = (g: GuideRow) => {
    const isSelected = selected.has(g.articleId);
    return (
      <button
        type="button"
        key={g.articleId}
        disabled={g.taken}
        onClick={() => toggleSlot(g.articleId)}
        aria-pressed={isSelected}
        className={`w-full px-3 py-3 flex items-center gap-3 text-left rounded-xl transition-colors ${
          g.taken ? 'cursor-not-allowed opacity-50' : isSelected ? 'bg-home-sage/60' : 'cursor-pointer hover:bg-home-stone'
        }`}
      >
        <span
          aria-hidden="true"
          className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </span>
        <span className="text-sm text-home-ink min-w-0 flex-1">{g.title}</span>
        <span className="text-xs font-bold text-slate-500 shrink-0 tabular-nums">
          {g.taken ? 'Taken' : `$${priceOf(g).toFixed(2)}`}
        </span>
      </button>
    );
  };

  const steps = [
    { icon: MousePointerClick, t: 'Pick your articles' },
    { icon: CreditCard, t: 'Pay with PayPal' },
    { icon: ClipboardEdit, t: 'Add your details. You’re live.' },
  ];

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink pb-32">
      {/* Hero: what it is, what it costs, and the three steps, in one glance. */}
      <section className="relative overflow-hidden bg-white text-home-ink">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <button
            type="button"
            onClick={() => onNavigate('/advertise/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-home-ink cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All ad options
          </button>
          <p className="mt-6 text-base sm:text-lg font-semibold text-slate-500">Topic Ads</p>
          <h1 className="mt-3 font-serif text-[2rem] leading-[1.1] sm:text-5xl font-semibold tracking-[-0.01em] [text-wrap:balance]">
            Your phone number on the articles people read before they buy
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            <span className="font-semibold text-home-ink">${pricePerSlot.toFixed(2)} per article</span> for {slotDurationDays} days.
            No subscription.
          </p>
          <ol className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            {steps.map(({ icon: Icon, t }, i) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-home-mist px-3 py-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <Icon className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative space-y-8">
        {/* The one thing to do on this page. */}
        <section className="bg-white rounded-3xl shadow-xl p-4 sm:p-6">
          <h2 className="font-serif text-2xl font-semibold px-1">Pick your articles</h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search" placeholder="Search articles" value={search} aria-label="Search articles"
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
              />
            </div>
            <select
              value={tradeCategory} onChange={(e) => { setTradeCategory(e.target.value); setSubmitError(null); }}
              aria-label="Your business type"
              className={`px-3 py-2.5 border rounded-xl text-sm bg-white ${tradeCategory ? 'border-slate-300' : 'border-home-oak'}`}
            >
              <option value="">Your business type (required)</option>
              {TRADE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {needsLicence && (
            <div className="mt-3">
              <label htmlFor="topic-ad-licence" className="block text-xs font-bold text-slate-700 px-1">Your license number</label>
              <input
                id="topic-ad-licence"
                type="text"
                value={licenceNumber}
                onChange={(e) => { setLicenceNumber(e.target.value); setSubmitError(null); }}
                maxLength={60}
                placeholder="License or registration number"
                className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white"
              />
              <p className="mt-1 px-1 text-[11px] text-slate-500 leading-snug">
                Required for {tradeCategory} before you can buy. It appears in your ad exactly as typed.
                {tradeCategory === 'Moving Company' ? ' Movers may enter a USDOT or MC number.' : ''}
                {tradeCategory === 'Real Estate Agent' ? ' Agents, your real estate license number.' : ''}
              </p>
            </div>
          )}

          {visibleClusters.length > 0 && (
            <div className="mt-5 space-y-3">
              {visibleClusters.map((c) => {
                const isChosen = selectedCluster === c.key;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => toggleCluster(c.key)}
                    aria-pressed={isChosen}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-colors cursor-pointer ${
                      isChosen ? 'border-blue-600 bg-home-sage/40' : 'border-home-oak/60 bg-home-stone hover:border-home-oak'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
                          isChosen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        {isChosen && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-home-brass">Whole topic</span>
                        <span className="block mt-0.5 text-base font-bold">Every {c.name} article</span>
                        <span className="block mt-1 text-xs text-slate-600">
                          {c.openCount} articles now, plus every new one we add. One sponsor per topic.
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums">${c.priceUsd.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
              <p className="text-center text-xs font-semibold text-slate-500 pt-1">or pick single articles, ${pricePerSlot.toFixed(2)} each</p>
            </div>
          )}

          <div className="mt-4">
            {loadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{loadError}</span>
              </div>
            )}
            {!guides && !loadError && (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" aria-label="Loading articles" />
              </div>
            )}
            {guides && guides.length === 0 && (
              <p className="text-sm text-slate-500 py-4 px-1">No articles are open right now. Check back soon.</p>
            )}
            {guides && guides.length > 0 && matchedGuides.length + otherGuides.length === 0 && (
              <p className="text-sm text-slate-500 py-4 px-1">No articles match "{search}".</p>
            )}

            {guides && guides.length > 0 && isSearching && matchedGuides.length + otherGuides.length > 0 && (
              <div className="max-h-[28rem] overflow-y-auto -mx-1">{[...matchedGuides, ...otherGuides].map(renderGuideRow)}</div>
            )}

            {guides && guides.length > 0 && !isSearching && tradeCategory && (
              <>
                <div className="max-h-[32rem] overflow-y-auto -mx-1">
                  {bestGuides.length > 0 && (
                    <>
                      <p className="px-2 pt-1 pb-1 text-xs font-bold text-home-moss">Best for {tradeCategory} ({bestGuides.length})</p>
                      {bestGuides.map(renderGuideRow)}
                    </>
                  )}
                  {relatedGuides.length > 0 && (
                    <>
                      <p className="px-2 pt-3 pb-1 text-xs font-bold text-home-moss">
                        {bestGuides.length > 0 ? `Also a good fit for ${tradeCategory}` : `Closest matches for ${tradeCategory}`} ({relatedGuides.length})
                      </p>
                      {bestGuides.length === 0 && (
                        <p className="px-2 pb-1 text-[11px] text-slate-500 leading-snug">No open article is about {tradeCategory} by name yet, so these are the closest topics.</p>
                      )}
                      {relatedGuides.map(renderGuideRow)}
                    </>
                  )}
                  {matchedGuides.length === 0 && (
                    <p className="text-xs text-slate-500 py-2 px-2">No open article is close to {tradeCategory} yet. Every open article is below.</p>
                  )}
                </div>
                {otherGuides.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAllGuides((v) => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-home-ink py-3 cursor-pointer"
                    >
                      <span>{showAllGuides ? 'Hide' : 'Show'} {otherGuides.length} other article{otherGuides.length === 1 ? '' : 's'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllGuides ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {(showAllGuides || matchedGuides.length === 0) && <div className="max-h-[24rem] overflow-y-auto -mx-1">{otherGuides.map(renderGuideRow)}</div>}
                  </>
                )}
              </>
            )}

            {/* No trade and no search: the whole list, scrollable. Shown open, because picking is the job. */}
            {guides && guides.length > 0 && !isSearching && !tradeCategory && (
              <div className="max-h-[28rem] overflow-y-auto -mx-1">{otherGuides.map(renderGuideRow)}</div>
            )}
          </div>
        </section>

        {/* What the ad looks like, so the vendor knows what they're getting before they pay. */}
        <section className="rounded-3xl bg-white p-5 sm:p-7">
          <h2 className="font-serif text-xl font-semibold">How your ad looks</h2>
          <p className="mt-1 text-sm text-slate-600">Right under the article's quick answer. Example business:</p>
          <div className="mt-4 pointer-events-none select-none" role="img" aria-label="Example Topic Ad: a business name, trade and phone number under an article's quick answer">
            <div aria-hidden="true" inert>
              <GuideAdVendorCard vendor={{ businessName: 'Example Plumbing Co.', tradeCategory: 'Plumber', phone: '(512) 555-0100' }} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 sm:p-7">
          <h2 className="font-serif text-xl font-semibold">Questions</h2>
          <div className="mt-3 divide-y divide-home-linen">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {isOpen && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* The buy bar: always on screen, so the price and the button are never a scroll away. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-home-linen bg-white/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 space-y-1.5">
          {(submitError || returnNotice) && (
            <p role="status" className={`text-xs flex items-start gap-1.5 ${submitError ? 'text-rose-700' : 'text-home-ink'}`}>
              {submitError && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />}
              <span>{submitError || returnNotice}</span>
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl font-black tabular-nums leading-none">${total.toFixed(2)}</div>
              <div className="mt-1 text-xs text-slate-500 truncate">
                {chosenCluster
                  ? `Every ${chosenCluster.name} article · ${slotDurationDays} days`
                  : selectedCount === 0
                    ? 'Pick an article above'
                    : `${selectedCount} article${selectedCount === 1 ? '' : 's'} · ${slotDurationDays} days`}
                {hasSelection && !tradeCategory ? ' · choose your business type above' : ''}
                {hasSelection && tradeCategory && !licenceOk ? ' · add your license number above' : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={buy}
              disabled={submitting || resumeBuy !== null || !canBuy}
              className="shrink-0 inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-full transition-colors cursor-pointer"
            >
              {submitting || resumeBuy !== null ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : user ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
              <span>{submitting ? 'Opening PayPal…' : 'Buy now'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Add your business name and phone after paying. By buying you agree to the{' '}
            <a href="/terms/" target="_blank" rel="noopener noreferrer" className="underline hover:text-home-ink">Terms of Service</a>,
            including arbitration (Section 7).
          </p>
        </div>
      </div>
    </div>
  );
};
