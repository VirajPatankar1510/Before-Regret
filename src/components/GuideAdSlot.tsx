import React, { useEffect, useState } from 'react';
import { Phone, Globe, Megaphone } from 'lucide-react';
import { guessBusinessPhraseFromTitle } from '../data/guideAdCategoryGuess';

interface GuideAdSlotProps {
  articleId: number;
  position: 'top' | 'bottom';
  guideTitle: string;
}

interface ActiveVendor {
  businessName: string;
  tradeCategory: string;
  phone: string;
  website?: string;
  tagline?: string;
}

// Self-serve vendor ad slot, open market, $7.99/30 days -- see src/server/guideAdsApi.ts. Always
// renders something (unlike AdSlot.tsx's Google units, which render nothing until configured):
// either the paying vendor currently occupying this slot, or a recruitment CTA asking a business
// in a topic-matched trade to buy it. Both states carry the same small "Ad" corner label -- this
// is ad inventory either way, sold or not, and disclosing that plainly regardless of which state
// it's in is the same honesty standard as every other claim on this site.
export const GuideAdSlot: React.FC<GuideAdSlotProps> = ({ articleId, position, guideTitle }) => {
  const [vendor, setVendor] = useState<ActiveVendor | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/guide-ads/active/${articleId}/${position}`)
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
  }, [articleId, position]);

  // Loading: reserve the space silently rather than flashing "want to advertise here?" for a
  // moment before a real vendor's card swaps in a beat later.
  if (vendor === undefined) {
    return <div className="h-24" aria-hidden="true" />;
  }

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <span className="absolute top-2 right-3 text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
        Ad
      </span>

      {vendor ? (
        <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{vendor.tradeCategory}</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{vendor.businessName}</div>
            {vendor.tagline && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{vendor.tagline}</p>}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
              <Phone className="w-3.5 h-3.5" />
              <span>{vendor.phone}</span>
            </a>
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <Globe className="w-3 h-3" />
                <span>Visit website</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <a href="/guide-ads" className="flex items-center gap-3 pr-8 group">
          <div className="shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <Megaphone className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Are you in the {guessBusinessPhraseFromTitle(guideTitle)} business?
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Get your phone number in front of readers of this guide -- $7.99, 30 days.
            </div>
          </div>
        </a>
      )}
    </div>
  );
};
