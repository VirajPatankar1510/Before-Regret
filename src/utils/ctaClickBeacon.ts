// Counts clicks on "get a report" calls to action, by page, so we can see which guides send readers
// on to a report and which lose them (owner, 2026-10-14: Vercel shows a 75% bounce rate, but not
// which pages, or whether anyone clicks through). Server side: src/server/ctaClicksApi.ts.
//
// Same rules as adClickBeacon.ts: a beacon, so the request survives the navigation the click starts;
// best effort, never throws into the click handler. Only the page path is sent -- no query string,
// no personal data.
export type CtaId = 'guide_closing_report' | 'nav_free_report';

export function reportCtaClick(cta: CtaId): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    const page = typeof window !== 'undefined' ? window.location.pathname : '';
    navigator.sendBeacon('/api/cta-click', new Blob([JSON.stringify({ cta, page })], { type: 'application/json' }));
  } catch {
    /* measurement must never break the link it measures */
  }
}
