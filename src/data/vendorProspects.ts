import { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Manually-maintained, same reasoning as SPONSORED_VENDORS in sponsoredVendors.ts: there is no
// lead-discovery pipeline or CRM yet, and building one before a single outreach email has been
// sent and validated would be automating a message nobody has confirmed converts. Add real
// prospects here by hand -- a business you or a teammate found, with a real email you're
// confident is theirs. Never invent a plausible-sounding business to fill this list; an empty
// array is the honest, correct state until real prospecting happens.
//
// Real Estate Attorney and Moving Company are deliberately excluded from
// OUTREACH_ELIGIBLE_TRADES below -- neither has a placement anywhere in the report yet (see
// FINDING_TRADE_CATEGORY / PRIORITY_TRADE_CATEGORY in sponsoredVendors.ts), so a prospect who
// signs up under either category would pay and never actually appear. Don't add prospects in
// those two categories until a real placement exists for them.
//
// Prospects sourced via Instagram DM (see docs/VENDOR_INSTAGRAM_OUTREACH_PLAYBOOK.md) belong in
// this same list once they reply with interest -- add a note saying where they came from. That
// playbook is a manual, human-executed workflow, not a script; nothing here automates it.
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

// Each entry below was researched, not guessed: verified by loading the business's own site and
// finding a real <a href="mailto:..."> link in its markup, not by pattern-guessing an address from
// a business name. Sources checked 2026-08-06:
//   - Austin Roofers   -- https://austinroofer.com (footer mailto link)
//   - Malco Electric   -- https://malcoelectric.com (footer mailto link)
//   - The Chill Brothers -- https://thechillbrothers.com (footer mailto link)
export const VENDOR_PROSPECTS: VendorProspect[] = [
  {
    id: 'prospect_austin_roofers',
    businessName: 'Austin Roofers',
    tradeCategory: 'Roof Inspection',
    zipCode: '78701',
    email: 'info@austinroofer.com',
    status: 'not_contacted',
    notes: 'Residential + commercial roofer, Austin TX 78701, serving since 2008. Site lists Roof Inspection, Repair, Replacement as residential services.',
  },
  {
    id: 'prospect_malco_electric',
    businessName: 'Malco Electric',
    tradeCategory: 'Electrician',
    zipCode: '78746',
    email: 'info@malcoelectric.com',
    status: 'not_contacted',
    notes: 'Family-owned Austin electrician since 1983. Service area explicitly includes West Lake Hills (78746).',
  },
  {
    id: 'prospect_chill_brothers',
    businessName: 'The Chill Brothers',
    tradeCategory: 'HVAC Inspection',
    zipCode: '78704',
    email: 'hello@thechillbrothers.com',
    status: 'not_contacted',
    notes: 'HVAC + air purification, residential-focused. Branded specifically around the Zilker/South Lamar (78704) area. Has an active Instagram -- also a Phase 4 playbook candidate.',
  },
];
