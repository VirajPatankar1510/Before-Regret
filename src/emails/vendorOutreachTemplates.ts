import type { VendorProspect } from '../data/vendorProspects.js';

// CAN-SPAM (the relevant law for this -- B2B cold outreach, not consumer marketing) requires:
// a valid physical postal address of the sender, a working opt-out mechanism, and a subject line
// that isn't deceptive about the email's content. All three are baked into buildOutreachEmail
// below rather than left to whoever edits copy later.
const SENDER_ADDRESS = 'Atmostellar, Mumbai, Maharashtra, India';
const SUPPORT_EMAIL = 'hello@beforeregret.com';

// What a vendor in this trade actually gets shown next to, grounded in the real finding/priority
// ids from server.ts and inspectionPriorities.ts -- not a generic "get more customers" pitch.
// Keep this in sync with FINDING_TRADE_CATEGORY / PRIORITY_TRADE_CATEGORY in sponsoredVendors.ts;
// it exists specifically so the two can't quietly describe a different mechanic than the one that
// actually ships.
const PLACEMENT_CONTEXT: Partial<Record<VendorProspect['tradeCategory'], string>> = {
  'Roof Inspection': 'the Roof Replacement Permit finding',
  'HVAC Inspection': 'the HVAC Compressor & Mechanical System finding',
  'Sewer Scope': 'the sewer-line finding we add automatically for any home built before 1974',
  'Radon Testing': 'the radon-test item, regardless of the home\'s age',
  'Foundation Engineer': 'the Seismic Design Category finding, plus the foundation item we add for any pre-1980 home',
  Electrician: 'the Main Electrical Service Panel finding, plus the wiring/panel items we add for homes built between 1950 and 1989',
  'Home Inspector': 'the general-inspection items -- supply pipe material, crawlspace access, synthetic stucco, and system age -- that appear across a wide range of home ages',
  'Insurance Agent': 'the FEMA Flood Hazard Risk Zone finding',
};

export interface OutreachEmailContent {
  subject: string;
  html: string;
  text: string;
}

// Deliberately does not claim any traffic or impression numbers -- BeforeRegret doesn't have
// verified figures to back a claim like that yet, and an unverifiable number in a cold email is
// exactly the kind of thing this whole codebase has been built to avoid asserting.
export function buildOutreachEmail(prospect: VendorProspect): OutreachEmailContent {
  const placementContext = PLACEMENT_CONTEXT[prospect.tradeCategory];
  if (!placementContext) {
    throw new Error(
      `No placement context defined for trade category "${prospect.tradeCategory}" -- refusing to send an email describing a placement mechanic that may not exist. Check PLACEMENT_CONTEXT and FINDING_TRADE_CATEGORY/PRIORITY_TRADE_CATEGORY are in sync.`
    );
  }

  const firstName = prospect.contactName ? prospect.contactName.split(' ')[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : `Hi,`;

  const subject = `${prospect.businessName} — a placement idea for ${prospect.zipCode}`;

  const text = `${greeting}

I run BeforeRegret (beforeregret.com), a property research tool homebuyers use during their option period -- checking flood zones, permit history, and similar records before closing.

On every report for ${prospect.zipCode}, we show ${placementContext}. Right below it, we place a spot for one local ${prospect.tradeCategory.toLowerCase()} business -- your name, phone number, and a one-line tagline, shown at the exact moment someone is reading about the issue you'd be called in for.

The terms are simple: $29/month, flat rate, for exclusive placement in ${prospect.zipCode} under ${prospect.tradeCategory}. We only allow 2 businesses per ZIP/category, first come first served, and either side can cancel anytime -- no long-term contract.

If that's of interest, just reply to this email or take a look at beforeregret.com/vendors. Happy to answer questions either way.

Viraj
Atmostellar (operating BeforeRegret)

---
This is a one-time email about advertising your business on BeforeRegret. If you'd rather not hear from us again, just reply "no thanks" or email ${SUPPORT_EMAIL} and we won't contact you again.
${SENDER_ADDRESS}`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #0f172a; max-width: 560px;">
  <p>${greeting}</p>
  <p>I run <a href="https://beforeregret.com" style="color:#2563eb;">BeforeRegret</a>, a property research tool homebuyers use during their option period &mdash; checking flood zones, permit history, and similar records before closing.</p>
  <p>On every report for <strong>${prospect.zipCode}</strong>, we show ${placementContext}. Right below it, we place a spot for <strong>one local ${prospect.tradeCategory.toLowerCase()} business</strong> &mdash; your name, phone number, and a one-line tagline, shown at the exact moment someone is reading about the issue you'd be called in for.</p>
  <p>The terms are simple: <strong>$29/month</strong>, flat rate, for exclusive placement in ${prospect.zipCode} under ${prospect.tradeCategory}. We only allow 2 businesses per ZIP/category, first come first served, and either side can cancel anytime &mdash; no long-term contract.</p>
  <p>If that's of interest, just reply to this email or take a look at <a href="https://beforeregret.com/vendors" style="color:#2563eb;">beforeregret.com/vendors</a>. Happy to answer questions either way.</p>
  <p>Viraj<br/>Atmostellar (operating BeforeRegret)</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
  <p style="font-size:11px;color:#64748b;">
    This is a one-time email about advertising your business on BeforeRegret. If you'd rather not hear from us again, just reply "no thanks" or email <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748b;">${SUPPORT_EMAIL}</a> and we won't contact you again.<br/>
    ${SENDER_ADDRESS}
  </p>
</div>`;

  return { subject, html, text };
}
