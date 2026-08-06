import { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Manually-maintained, same reasoning as SPONSORED_VENDORS in sponsoredVendors.ts: there is no
// lead-discovery pipeline or CRM yet, and building one before a single outreach email has been
// sent and validated would be automating a message nobody has confirmed converts. Add real
// prospects here by hand -- a business you or a teammate found, with a real email you're
// confident is theirs. Never invent a plausible-sounding business to fill this list; an empty
// array is the honest, correct state until real prospecting happens.
//
// Real Estate Attorney and Moving Category are deliberately excluded from
// OUTREACH_ELIGIBLE_TRADES below -- neither has a placement anywhere in the report yet (see
// FINDING_TRADE_CATEGORY / PRIORITY_TRADE_CATEGORY in sponsoredVendors.ts), so a prospect who
// signs up under either category would pay and never actually appear. Don't add prospects in
// those two categories until a real placement exists for them.
export const OUTREACH_ELIGIBLE_TRADES = TRADE_CATEGORIES.filter(
  (t) => t !== 'Real Estate Attorney' && t !== 'Moving Company'
);

export type ProspectStatus =
  | 'not_contacted'
  | 'contacted'
  | 'replied'
  | 'signed_up'
  | 'declined'
  | 'opted_out';

export interface VendorProspect {
  id: string;
  businessName: string;
  tradeCategory: (typeof OUTREACH_ELIGIBLE_TRADES)[number];
  zipCode: string;
  email: string;
  contactName?: string;
  status: ProspectStatus;
  // Set by the send script after a successful send -- not auto-updated any other way. This file
  // is hand-maintained; update status here yourself after checking outreach-log.json or a reply.
  contactedAt?: string;
  notes?: string;
}

export const VENDOR_PROSPECTS: VendorProspect[] = [];
