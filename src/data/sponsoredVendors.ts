import type { SponsoredVendor } from '../types.js';

// Manually-maintained for v1 -- there is no vendor self-serve signup or payment flow yet (that's
// a separate, larger piece: persistent storage, Stripe billing, a vendor dashboard). Add a real
// vendor here only once they've actually paid; this list must never contain placeholder/sample
// businesses, since it renders directly into real property reports shown to real users. An empty
// or no-match result is the correct, honest state for every ZIP with no paying sponsor yet --
// SponsoredVendorCard shows that ZIP's ad slot as available rather than inventing a business to
// fill it.
export const SPONSORED_VENDORS: SponsoredVendor[] = [];

// First come, first served: at most this many active sponsors per (ZIP, trade category) pair.
// Single source of truth -- Vendors.tsx and the slot-availability API both reference this rather
// than hardcoding the number separately, so the two can never quietly drift out of sync again
// (the pre-existing landing page copy claimed "3 vendors per category" before this was wired up).
export const MAX_SLOTS_PER_ZIP_TRADE = 2;

// Shared between the signup form's dropdown and the server-side validation on submission, so
// the two can't silently diverge (a category typed on one side but not recognized on the other).
export const TRADE_CATEGORIES = [
  'Roof Inspection',
  'HVAC Inspection',
  'Sewer Scope',
  'Radon Testing',
  'Foundation Engineer',
  'Electrician',
  'Home Inspector',
  'Insurance Agent',
  'Real Estate Attorney',
  'Moving Company',
] as const;

export function getSponsoredVendorForZip(zipCode: string | undefined | null): SponsoredVendor | null {
  if (!zipCode) return null;
  return SPONSORED_VENDORS.find(v => v.active && v.zipCode === zipCode) || null;
}

// Matches a specific report finding's trade category, not just its ZIP. Report findings today
// are a small, fixed set (see validateAndFixReportContradictions in server.ts) -- this maps each
// finding id to whichever paid trade category it's actually relevant to, so a report can carry a
// separate, contextual vendor match per finding instead of one generic slot for the whole report.
// f_code (municipal code enforcement) has no natural trade match and is deliberately omitted --
// not every finding needs an ad slot.
export const FINDING_TRADE_CATEGORY: Partial<Record<string, typeof TRADE_CATEGORIES[number]>> = {
  f_roof: 'Roof Inspection',
  f_elec: 'Electrician',
  f_hvac: 'HVAC Inspection',
  f_flood: 'Insurance Agent',
  f_seismic: 'Foundation Engineer',
};

export function getSponsoredVendorForZipAndTrade(
  zipCode: string | undefined | null,
  tradeCategory: string | undefined | null
): SponsoredVendor | null {
  if (!zipCode || !tradeCategory) return null;
  return SPONSORED_VENDORS.find(v => v.active && v.zipCode === zipCode && v.tradeCategory === tradeCategory) || null;
}

export interface SlotAvailability {
  zipCode: string;
  tradeCategory: string;
  slotsTotal: number;
  slotsTaken: number;
  slotsRemaining: number;
  available: boolean;
}

export function getSlotAvailability(zipCode: string, tradeCategory: string): SlotAvailability {
  const slotsTaken = SPONSORED_VENDORS.filter(
    v => v.active && v.zipCode === zipCode && v.tradeCategory === tradeCategory
  ).length;
  const slotsRemaining = Math.max(0, MAX_SLOTS_PER_ZIP_TRADE - slotsTaken);
  return {
    zipCode,
    tradeCategory,
    slotsTotal: MAX_SLOTS_PER_ZIP_TRADE,
    slotsTaken,
    slotsRemaining,
    available: slotsRemaining > 0,
  };
}
