import React from 'react';
import { Phone, ExternalLink, Megaphone } from 'lucide-react';
import { SponsoredVendor } from '../types';

interface SponsoredVendorCardProps {
  vendor: SponsoredVendor | null | undefined;
}

// Renders only when a real, paying vendor exists for this ZIP -- vendor acquisition (the
// "advertise here" pitch, landing page, signup) is a separate flow entirely, aimed at business
// owners, not something to surface inside a report a homebuyer is reading. When there's no
// sponsor, this renders nothing; it never shows a placeholder or an invented business.
export const SponsoredVendorCard: React.FC<SponsoredVendorCardProps> = ({ vendor }) => {
  if (!vendor) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <Megaphone className="w-3 h-3" />
          <span>Sponsored · {vendor.tradeCategory}</span>
        </div>
        <h3 className="font-bold text-slate-900 text-base sm:text-lg">{vendor.businessName}</h3>
        {/* Printed because several states require a contractor's licence number to appear in the
            advertisement itself, and because a reader who wants to check the licence needs the
            number to check it with. The "not verified by us" half is not boilerplate softening --
            this site runs no check against any licensing board, and presenting a self-reported
            number as though it had been validated would be a worse misrepresentation than showing
            no number at all. Absent for the licence-exempt trade category and for placements sold
            before this field existed, so it renders conditionally. */}
        {vendor.licenceNumber && (
          <p className="text-[11px] text-slate-500 font-mono">
            Licence #{vendor.licenceNumber}
            <span className="font-sans not-italic"> · provided by the advertiser, not verified by us</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`tel:${vendor.phone}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{vendor.phone}</span>
        </a>
        {vendor.website && (
          <a
            href={vendor.website}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

interface SponsoredVendorCardsProps {
  vendors: SponsoredVendor[] | null | undefined;
}

// Up to MAX_SLOTS_PER_ZIP_TRADE (2) vendors can now be attached to one spot -- see
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
