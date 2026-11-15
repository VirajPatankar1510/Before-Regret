import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasAdDetailsHint, setAdDetailsHint } from '../utils/adDetailsHint';

interface AdDetailsReminderProps {
  pathname: string;
  onNavigate: (path: string) => void;
}

// Pages that already say what to do next, so the bar would only repeat them.
const HIDDEN_ON = ['/my-ads', '/report-ads/success', '/topic-ads/success'];
const DISMISS_KEY = 'br_ad_details_reminder_dismissed';

const heldLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Sitewide reminder for a vendor who paid (pay-first checkout, 2026-11-15) but closed the browser
// before adding their business details: their ad holds its slot but shows nowhere until they do.
//
// Shown only when the SERVER confirms a pending order (/api/my-ads/exists → pendingDetails), and it
// only asks when there is a reason to: this browser carries the pending hint (adDetailsHint.ts), or
// Clerk is already loaded with someone signed in. A homebuyer's page view never loads Clerk for it.
// Renders nothing on first paint, so prerendered pages hydrate unchanged.
export const AdDetailsReminder: React.FC<AdDetailsReminderProps> = ({ pathname, onNavigate }) => {
  const { user, loading, getToken, requestClerkLoad } = useAuth();
  const [hinted, setHinted] = useState(false);
  const [pending, setPending] = useState<{ count: number; heldUntil: string | null } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const h = hasAdDetailsHint();
    setHinted(h);
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1'); } catch { /* storage blocked */ }
    if (h) requestClerkLoad();
  }, [requestClerkLoad]);

  // Re-asked when the signed-in user changes, and when the vendor moves between pages, so the bar
  // disappears on the next page after they save their details on My Ads.
  useEffect(() => {
    if (!user) { setPending(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/my-ads/exists', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const count = Number(data?.pendingDetails ?? 0);
        setPending({ count, heldUntil: data?.heldUntil ?? null });
        setAdDetailsHint(count > 0);
        setHinted(count > 0);
      } catch {
        // No bar. My Ads still lists the order.
      }
    })();
    return () => { cancelled = true; };
  }, [user, getToken, pathname]);

  if (dismissed || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage blocked */ }
  };

  let message: React.ReactNode = null;
  let action = 'Add my details';
  if (user && pending && pending.count > 0) {
    message = (
      <>
        <span className="font-bold">{pending.count === 1 ? "Your ad isn't live yet." : `${pending.count} of your ads aren't live yet.`}</span>{' '}
        Add your business details to publish {pending.count === 1 ? 'it' : 'them'}
        {pending.heldUntil ? `. Your spot is held until ${heldLabel(pending.heldUntil)}.` : '.'}
      </>
    );
  } else if (!user && !loading && hinted) {
    // Signed out on a browser that paid. The server can't be asked without a session, so the
    // wording stays true even if the details were since added on another device.
    message = (
      <>
        <span className="font-bold">Paid for an ad?</span> Sign in to add your business details and put it live.
      </>
    );
    action = 'Go to My Ads';
  }
  if (!message) return null;

  return (
    <div role="status" className="bg-amber-50 border-b border-amber-200 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <Clock className="w-4 h-4 text-amber-700 shrink-0 hidden sm:block" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-xs sm:text-sm leading-snug">{message}</p>
        <a
          href="/my-ads/"
          onClick={(e) => { e.preventDefault(); onNavigate('/my-ads/'); }}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-home-navy hover:bg-home-ink text-white text-xs font-bold rounded-lg transition-colors"
        >
          {action} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide this reminder"
          className="shrink-0 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
