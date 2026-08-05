import React from 'react';
import { Phone, ExternalLink, Megaphone, Mail } from 'lucide-react';
import { SponsoredVendor } from '../types';

interface SponsoredVendorCardProps {
  vendor: SponsoredVendor | null | undefined;
  zipCode?: string;
}

// Two honest states only -- never a third "placeholder business" state. When no vendor has
// actually paid for this ZIP, the slot says so plainly and doubles as the sales pitch, rather
// than being left blank (wasted) or filled with an invented business (exactly the fabrication
// problem the rest of this report has been built to avoid).
export const SponsoredVendorCard: React.FC<SponsoredVendorCardProps> = ({ vendor, zipCode }) => {
  if (vendor) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            <Megaphone className="w-3 h-3" />
            <span>Sponsored -- {vendor.tradeCategory}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">{vendor.businessName}</h3>
          {vendor.tagline && (
            <p className="text-xs sm:text-sm text-slate-600">{vendor.tagline}</p>
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
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          <Megaphone className="w-3 h-3" />
          <span>Sponsor Spot Open{zipCode ? ` -- ZIP ${zipCode}` : ''}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md">
          Be the only local pro featured on every report generated for this ZIP code -- in front of people actively researching a specific property here, for less than $1/day.
        </p>
      </div>
      <a
        href={`mailto:hello@beforeregret.com?subject=${encodeURIComponent(`Vendor sponsorship -- ZIP ${zipCode || ''}`)}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shrink-0"
      >
        <Mail className="w-3.5 h-3.5" />
        <span>Advertise Here</span>
      </a>
    </div>
  );
};
