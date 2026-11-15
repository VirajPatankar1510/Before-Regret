// A local hint that THIS browser has paid for an ad that is still waiting for business details
// (pay-first checkout, 2026-11-15). It exists because Clerk is lazy-loaded (AuthContext.tsx): the
// sitewide reminder must not load ~190KB of auth code on every homebuyer's page view just to ask
// "is anyone signed in?". With the hint set, the reminder loads Clerk and asks the server, which
// is the real source of truth; the hint itself is never shown to anyone and holds no personal
// data, only a timestamp.
//
// Set: the "Payment received, one step left" page (AdPaidNextStep.tsx), and My Ads whenever it
// finds a pending order. Cleared: My Ads when none is left, and the reminder when the server says
// none. Expires on its own after the 30-day hold, so a stale hint can't nag forever.

const KEY = 'br_ad_details_pending';
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000;

export function setAdDetailsHint(pending: boolean): void {
  try {
    if (pending) localStorage.setItem(KEY, String(Date.now()));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the reminder simply won't show on this browser. My Ads
    // still lists the order.
  }
}

export function hasAdDetailsHint(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
