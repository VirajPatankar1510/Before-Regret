// Reports a click on a paying advertiser's phone number. See src/server/adClicksApi.ts for what
// gets counted and why impressions deliberately aren't.
//
// WHY A BEACON AND NOT A REDIRECT. Website links go through /out/:adKind/:purchaseId, which counts
// the click server-side and forwards -- no JavaScript involved, nothing to fail. Phone numbers
// can't use that: redirecting to a `tel:` URI behaves inconsistently across browsers, and the cost
// of getting it wrong is that a paying vendor's number stops dialling. So the `tel:` href stays
// exactly as it was, and the click is reported alongside it.
//
// Everything here is best-effort by design. sendBeacon hands the request to the browser to deliver
// after the page has gone (a `tel:` tap backgrounds the page immediately, which is precisely when
// a normal fetch gets cancelled). If it's unavailable or refuses, the click simply goes uncounted
// -- an undercount is acceptable; a dialler that doesn't open is not. Nothing in this function is
// allowed to throw into the click handler.
export function reportAdClick(adKind: 'guide' | 'zip', purchaseId: number, target: 'phone' | 'website'): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    navigator.sendBeacon(
      '/api/ad-click',
      new Blob([JSON.stringify({ adKind, purchaseId, target })], { type: 'application/json' })
    );
  } catch {
    /* measurement must never break the ad it is measuring */
  }
}
