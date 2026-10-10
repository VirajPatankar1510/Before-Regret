import React from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import { SponsoredVendor } from '../types';
import { reportAdClick } from '../utils/adClickBeacon';

interface SponsoredVendorCardProps {
  vendor: SponsoredVendor | null | undefined;
}

// Renders only when a real, paying vendor exists for this ZIP -- vendor acquisition (the
// "advertise here" pitch, landing page, signup) is a separate flow entirely, aimed at business
// owners, not something to surface inside a report a homebuyer is reading. When there's no
// sponsor, this renders nothing; it never shows a placeholder or an invented business.
//
// LOOK (2026-10-10, owner: ads must be "highlighted and do not get hidden/camouflaged in the
// report's content"). The card used to be a white box with a tiny grey "Sponsored" label -- the
// same shape as every content card around it, which is exactly how an ad gets missed (by a vendor
// checking their placement) or mistaken for a finding (by a buyer). It is now unmistakably an ad:
// amber tint and border, a solid SPONSORED pill, and the trade named in the label. Amber is reserved
// for ads in the report -- the insurance red-flag box moved to rose so the two never look alike.
export const SponsoredVendorCard: React.FC<SponsoredVendorCardProps> = ({ vendor }) => {
  if (!vendor) return null;

  return (
    <aside
      aria-label={`Sponsored: ${vendor.businessName}`}
      data-print-block
      className="relative bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-amber-600 px-2 py-0.5 rounded">
            Sponsored
          </span>
          <span className="text-[11px] font-semibold text-amber-900">Local {vendor.tradeCategory.toLowerCase()}</span>
        </div>
        <h3 className="font-bold text-slate-900 text-base">{vendor.businessName}</h3>
        {/* The licence number is printed because several states require a contractor's licence
            number to appear in the advertisement itself, and because a reader who wants to check
            the licence needs the number to check it with.

            The "not verified by us" line is UNCONDITIONAL, and that is the point of this block's
            shape. It used to be nested inside the licenceNumber check, which meant the two cases
            with no number -- the licence-exempt trade category (Chimney Sweep) and placements sold
            before the field existed -- rendered a business name and a phone number with no
            disclosure of any kind on the card. The disclosure has to survive the absence of the
            number, so it lives outside the conditional. Do not re-nest it. */}
        {vendor.licenceNumber && (
          <p className="text-[11px] text-slate-600 font-mono">
            Licence #{vendor.licenceNumber}
          </p>
        )}
        <p className="text-[11px] text-slate-600">
          Paid placement. Details supplied by the advertiser and not verified by us --{' '}
          <a href="/disclaimer/" className="underline hover:text-slate-800">check any licence yourself</a>.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* vendor.id is the zip_ad_purchases row id (see fetchActiveZipVendors), which is what a
            click is attributed to. The tel: href is deliberately left alone -- measurement rides
            alongside it and never stands between a reader and the dialler. See
            src/utils/adClickBeacon.ts. */}
        <a
          href={`tel:${vendor.phone}`}
          onClick={() => reportAdClick('zip', Number(vendor.id), 'phone')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{vendor.phone}</span>
        </a>
        {vendor.website && (
          // Counted server-side via /out/, so a website click registers without JavaScript. The
          // raw URL stays as the fallback for an id that doesn't parse, so the link is never dead.
          <a
            href={Number.isFinite(Number(vendor.id)) ? `/out/zip/${Number(vendor.id)}` : vendor.website}
            target="_blank"
            rel="sponsored noopener noreferrer"
            aria-label={`${vendor.businessName} website`}
            className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </aside>
  );
};

interface SponsoredVendorCardsProps {
  vendors: SponsoredVendor[] | null | undefined;
}

// Up to MAX_SLOTS_PER_ZIP_TRADE (2) vendors can be attached to one spot -- see
// CanonicalFinding.sponsoredVendors in types.ts for why. Renders nothing for an empty or missing
// list, same principle as SponsoredVendorCard itself.
export const SponsoredVendorCards: React.FC<SponsoredVendorCardsProps> = ({ vendors }) => {
  if (!vendors || vendors.length === 0) return null;
  return (
    <div className="space-y-2">
      {vendors.map((vendor) => (
        <SponsoredVendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
};
