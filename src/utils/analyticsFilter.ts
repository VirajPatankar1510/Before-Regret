// Drops analytics events from our own browsers, so the Vercel dashboard measures visitors rather
// than us.
//
// WHY THIS IS NEEDED. The 7-day figures on 2026-09-07 were 169 visitors and 468 pageviews, with
// only 54 of those carrying a referrer -- roughly two thirds arriving "direct" on a domain with no
// brand recognition and no marketing spend. India was 23% of visitors, and this project is
// developed from IST. A large but unknown share of that is the operator and the agent hitting the
// live site during development, which makes the visitor count an upper bound rather than a figure.
// The referrer breakdown was still trustworthy; the totals were not.
//
// HOW IT WORKS, verified against the served script rather than assumed. /_vercel/insights/script.js
// keeps a `beforeSend` handler and applies it inside its send function as:
//
//     let v = a({type, url, payload});
//     if (!1 === v || null === v) return;      // false or null -> event dropped before the fetch
//
// The handler is registered either by calling window.va('beforeSend', fn) or by pushing
// ['beforeSend', fn] onto window.vaq, which the script replays on init:
//
//     window.vaq?.forEach(([e, t]) => window.va(e, t));
//
// and that replay happens inside U(), which runs BEFORE the first pageview k() fires -- so the
// initial pageview is filtered too, not just later ones.
//
// WHAT IT CANNOT DO. It does not filter retroactively: everything recorded before today stays in
// the dashboard. It only silences browsers where the flag has been set, so it needs setting once
// per device and per browser profile. And it does nothing about bots, though the Vercel script
// already refuses to send when navigator.webdriver is set or the UA contains "Headless".
const FLAG = 'br-no-analytics';
const PARAM = 'no-analytics';

/**
 * True when this browser has opted out. Reading localStorage can throw in a private window or when
 * site data is blocked, so a failure means "not opted out" rather than an exception on every event.
 */
export function isAnalyticsMuted(): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has(PARAM)) {
      const on = url.searchParams.get(PARAM) !== '0';
      if (on) window.localStorage.setItem(FLAG, '1');
      else window.localStorage.removeItem(FLAG);
    }
    return window.localStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

/** Passed to <Analytics beforeSend>. Returning null drops the event. */
export function analyticsBeforeSend<T>(event: T): T | null {
  return isAnalyticsMuted() ? null : event;
}
