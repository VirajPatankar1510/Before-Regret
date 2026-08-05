import type { SponsoredVendor } from '../types.js';

// Manually-maintained for v1 -- there is no vendor self-serve signup or payment flow yet (that's
// a separate, larger piece: persistent storage, Stripe billing, a vendor dashboard). Add a real
// vendor here only once they've actually paid; this list must never contain placeholder/sample
// businesses, since it renders directly into real property reports shown to real users. An empty
// or no-match result is the correct, honest state for every ZIP with no paying sponsor yet --
// SponsoredVendorCard shows that ZIP's ad slot as available rather than inventing a business to
// fill it.
export const SPONSORED_VENDORS: SponsoredVendor[] = [];

export function getSponsoredVendorForZip(zipCode: string | undefined | null): SponsoredVendor | null {
  if (!zipCode) return null;
  return SPONSORED_VENDORS.find(v => v.active && v.zipCode === zipCode) || null;
}
