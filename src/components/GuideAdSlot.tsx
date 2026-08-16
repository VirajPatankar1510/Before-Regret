import React, { useEffect, useState } from 'react';
import { Phone, Globe, Wrench } from 'lucide-react';
import { guessBusinessPhraseFromTitle } from '../data/guideAdCategoryGuess';

interface GuideAdSlotProps {
  articleId: number;
  guideTitle: string;
}

interface ActiveVendor {
  businessName: string;
  tradeCategory: string;
  phone: string;
  website?: string;
}

// Self-serve vendor ad slot, open market, $7.99/30 days -- see src/server/guideAdsApi.ts. One
// slot per guide, not two: an earlier top+bottom split sold both positions at the same price
// despite unequal placement value, which meant a rational vendor always bought "top" and "bottom"
// sat unsold -- and an unsold slot renders as a recruitment CTA, so every guide showed two empty
// "want to advertise here?" boxes with zero vendors. Always renders something (unlike AdSlot.tsx's
// Google units, which render nothing until configured): either the paying vendor currently
// occupying this slot, or a recruitment CTA asking a business in a topic-matched trade to buy it.
// Both states carry the same "Ad" badge -- this is ad inventory either way, sold or not, and
// disclosing that plainly regardless of which state it's in is the same honesty standard as every
// other claim on this site. Colored left border and badge distinguish the two states for a reader
// at a glance (blue = open, green = a real vendor is here) without either one reading as a banner
// ad or a popup.
//
// The recruitment copy deliberately did NOT end up as "Need a sewer inspection before closing?"
// (an earlier draft) -- that addressed the reader, not the vendor who's the actual audience for
// this state, and a business owner skimming past would read it as reader content and miss the
// pitch entirely. "Are you in the X business?" keeps the vendor as the addressee throughout.
export const GuideAdSlot: React.FC<GuideAdSlotProps> = ({ articleId, guideTitle }) => {
  const [vendor, setVendor] = useState<ActiveVendor | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/guide-ads/active/${articleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setVendor(data?.success && data.active ? data.vendor : null);
      })
      .catch(() => {
        if (!cancelled) setVendor(null);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  // Loading: reserve the space silently rather than flashing "want to advertise here?" for a
  // moment before a real vendor's card swaps in a beat later.
  if (vendor === undefined) {
    return <div className="h-24" aria-hidden="true" />;
  }

  if (vendor) {
    return (
      <div className="relative bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-r-2xl p-4 sm:p-5">
        <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          Ad
        </span>
        <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{vendor.tradeCategory}</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{vendor.businessName}</div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
              <Phone className="w-3.5 h-3.5" />
              <span>{vendor.phone}</span>
            </a>
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <Globe className="w-3 h-3" />
                <span>Visit website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-blue-50/60 border border-slate-200 border-l-4 border-l-blue-500 rounded-r-2xl p-4 sm:p-5">
      <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded">
        Ad
      </span>
      <a href="/advertise" className="flex items-center gap-3 pr-10 group">
        <div className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center">
          <Wrench className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            Are you in the {guessBusinessPhraseFromTitle(guideTitle)} business?
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Add your contact number here. Readers researching this exact problem see your number.
          </div>
        </div>
      </a>
    </div>
  );
};
