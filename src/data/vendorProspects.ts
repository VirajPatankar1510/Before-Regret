import { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Manually-maintained, same reasoning as SPONSORED_VENDORS in sponsoredVendors.ts: there is no
// lead-discovery pipeline or CRM yet. Add real prospects here by hand -- a business you or a
// teammate found, with a real email you're confident is theirs. Never invent a plausible-sounding
// business to fill this list; an empty array is the honest, correct state until real prospecting
// happens.
//
// There used to be an automated cold-email script (Resend) that read this list -- removed
// entirely, since Resend's Acceptable Use Policy explicitly prohibits "cold outreach... to
// recipients who have [not] explicitly opted in," which is exactly what these prospects are
// (verified real contacts, but no prior relationship or consent). The only outreach channel this
// list now feeds is the manual, human-executed Instagram DM workflow in
// docs/VENDOR_INSTAGRAM_OUTREACH_PLAYBOOK.md -- add a business here once you've found it, and log
// the outcome (replied, signed up, declined) after reaching out yourself. Nothing here sends
// anything automatically.
//
// Real Estate Attorney and Moving Company are deliberately excluded from
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
  // Nothing sets this automatically -- this file is hand-maintained; update status and this field
  // yourself after reaching out via Instagram DM (see the playbook) and getting a reply.
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
