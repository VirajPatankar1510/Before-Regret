import React, { useEffect, useState } from 'react';
import { Phone, ExternalLink, ChevronRight, Megaphone } from 'lucide-react';
import { guessBusinessPhraseFromTitle, guessTradeCategoryFromTitle } from '../data/guideAdCategoryGuess';
import { reportAdClick } from '../utils/adClickBeacon';

interface GuideAdSlotProps {
  articleId: number;
  guideTitle: string;
  /** Pre-selects this article on /topic-ads/ when a business clicks the open slot's button. */
  guideSlug?: string;
}

/** The slot's resting height before it knows what to show -- measured from the open (unsold) card,
 *  which is what almost every guide shows. Re-measured 2026-11-16 when the card gained its button.
 *  Used for the loading state here and for the static stand-in in GuideArticleLayout, so neither the
 *  static page nor the first live render jumps. Re-measured 2026-11-19 when the open slot gained
 *  its example ad inside the same box, re-measured after two lines were cut: 276px on a phone, 206px from sm. */
export const GUIDE_AD_SLOT_PLACEHOLDER = 'h-[276px] sm:h-[206px]';
/** The open box never renders shorter than the placeholder, so loading → open never jumps; only a
 *  long trade phrase that wraps can make it taller (measured 169px / 125px for the longest). */
const OPEN_SLOT_MIN_HEIGHT = 'min-h-[147px] sm:min-h-[103px]';

export interface ActiveVendor {
  // Identifies which placement a click belongs to. Optional so a cached response from before click
  // tracking existed still renders a working ad -- the links just go untracked, which is the right
  // failure direction.
  purchaseId?: number;
  businessName: string;
  tradeCategory: string;
  phone: string;
  website?: string;
  // Advertiser-supplied, republished verbatim, never validated against a licensing board -- same
  // field and same caveat as SponsoredVendor.licenceNumber in types.ts. Optional: absent for the
  // license-exempt category and for placements sold before the field existed.
  licenceNumber?: string;
}

// Self-serve vendor ad slot, one per guide, directly under the Quick Answer -- see
// src/server/guideAdsApi.ts. Always renders something: the paying vendor who holds this slot, or
// the open-slot box inviting a business in a topic-matched trade to take it.
//
// LOOK, 2026-11-16 (owner): both states "feel lost and look like ads people scroll past"; they
// should be highlighted and carry a call to action, without the "Ad" badge. So:
// - The paid card is amber-tinted (amber is the ad colour in reports too, SponsoredVendorCard.tsx),
//   with the business name large and real buttons: "Call" and "Website".
// - The open slot is a navy box addressed to businesses, with a button that opens /topic-ads/ with
//   THIS article already chosen, so a business can buy in one step.
//
// DISCLOSURE. The separate "Ad" badge is gone, but the paid card still says "Sponsored" in its top
// line. A paid listing has to be recognisable as paid (the FTC's native-advertising guidance), and
// since 2026-11-14 this word is the card's only disclosure (the per-card "not verified" line was
// removed then). The open-slot box needs no label: it is our own offer, addressed to businesses,
// not a paid placement.
/**
 * The sold state of a Topic Ad -- exactly what a reader sees on a guide. Split out of GuideAdSlot
 * (2026-10-04) so /advertise/ can show the real card with an example vendor instead of a hand-drawn
 * copy that could drift from it. Purely presentational: no fetch, no state.
 */
export const GuideAdVendorCard: React.FC<{ vendor: ActiveVendor }> = ({ vendor }) => (
  <aside
    aria-label={`Sponsored: ${vendor.businessName}`}
    className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm"
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
      <div className="min-w-0">
        {/* Keep "Sponsored": it is this card's only ad disclosure (see the note above). */}
        <p className="text-xs font-semibold text-amber-800">
          Sponsored · {vendor.tradeCategory}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 leading-snug">{vendor.businessName}</p>
        {vendor.licenceNumber && (
          <p className="mt-0.5 text-[11px] text-slate-600 font-mono">License #{vendor.licenceNumber}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 shrink-0">
        {/* The tel: href is untouched by click tracking -- see src/utils/adClickBeacon.ts.
            The number must dial whether or not measurement works. */}
        <a
          href={`tel:${vendor.phone}`}
          onClick={() => { if (vendor.purchaseId) reportAdClick('guide', vendor.purchaseId, 'phone'); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full whitespace-nowrap transition-colors"
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
          <span>Call {vendor.phone}</span>
        </a>
        {vendor.website && (
          // Routed through /out/ so the click is counted server-side, with no dependency on
          // JavaScript. Falls back to the raw URL when the placement id is missing, so the
          // link always goes somewhere real. rel="sponsored" is kept either way: it describes
          // the commercial relationship, which the redirect doesn't change.
          <a
            href={vendor.purchaseId ? `/out/guide/${vendor.purchaseId}` : vendor.website}
            data-print-url={vendor.website}
            target="_blank"
            rel="sponsored noopener noreferrer"
            aria-label={`${vendor.businessName} website`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-white border border-amber-300 hover:bg-amber-100 text-slate-800 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors"
          >
            <span>Website</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  </aside>
);

/** The open state: our own offer to businesses, shown while nobody holds the slot, with a demo of
 *  the ad a business would get directly under it (owner, 2026-11-19: "add a demo ad for topic ads
 *  below the advertise here button", and the button's arrow points down at it).
 *
 *  THE DEMO IS INERT AND OBVIOUSLY A PLACEHOLDER. It's the real GuideAdVendorCard, so it can't drift
 *  from what a buyer gets, but wrapped the way GuideAdsCheckout.tsx wraps its example: inert, no
 *  pointer events, one accessible name. The name "Your Business Name"
 *  (owner removed the "Your ad would look like this" label, 2026-11-19) keeps a reader from mistaking it for a real business, and the 555-01xx number is a range reserved
 *  for fiction, so it can't reach anyone even if copied. The trade matches the guide's. */
export const GuideAdOpenSlot: React.FC<{ guideTitle: string; guideSlug?: string }> = ({ guideTitle, guideSlug }) => {
  const href = guideSlug ? `/topic-ads/?guide=${encodeURIComponent(guideSlug)}` : '/topic-ads/';
  // ONE section, not two (owner, 2026-11-19): the demo sits inside the same highlighted box, under
  // the pitch row, as a preview.
  //
  // THE WHOLE BOX IS ONE LINK (owner, 2026-11-26: the "Advertise here" pill "looks same and feels
  // duplicate" next to the demo's Call pill; "what would Apple do ... the entire section should be
  // clickable"). So: one tile, one action, and the only call to action is a quiet blue text link,
  // leaving the demo's Call pill as the one button in the box. The demo contains <a> elements, and a
  // link inside a link is invalid HTML, so the box isn't wrapped in <a>: one link's ::after is
  // stretched over the whole box instead (the "stretched link" pattern). The demo already has
  // pointer-events: none, so a tap anywhere -- including on the example Call button -- lands on the
  // stretched link and opens /topic-ads/. It never dials: the demo stays inert.
  return (
    <div
      className={`${OPEN_SLOT_MIN_HEIGHT} group relative bg-blue-50 text-home-ink rounded-2xl p-4 sm:p-5 transition-shadow duration-300 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] focus-within:ring-2 focus-within:ring-blue-600`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="hidden sm:flex shrink-0 w-9 h-9 rounded-full bg-blue-100 items-center justify-center" aria-hidden="true">
            <Megaphone className="w-4 h-4 text-blue-600" />
          </span>
          <span className="block text-base font-bold leading-snug">
            Are you in the {guessBusinessPhraseFromTitle(guideTitle)} business?
          </span>
        </div>
        <a
          href={href}
          className="shrink-0 inline-flex items-center gap-0.5 text-[15px] font-semibold text-blue-600 group-hover:underline underline-offset-2 focus:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          Advertise here
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
      <div
        className="mt-4 border-t border-blue-100 pt-4 pointer-events-none select-none"
        role="img"
        aria-label="Example ad: how a business's listing appears here, with its name, trade and phone number"
      >
        <div aria-hidden="true" inert>
          <GuideAdVendorCard
            vendor={{ businessName: 'Your Business Name', tradeCategory: guessTradeCategoryFromTitle(guideTitle), phone: '(555) 555-0100' }}
          />
        </div>
      </div>
    </div>
  );
};

export const GuideAdSlot: React.FC<GuideAdSlotProps> = ({ articleId, guideTitle, guideSlug }) => {
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

  // Loading: reserve the space silently rather than flashing the open-slot box for a moment
  // before a real vendor's card swaps in a beat later.
  if (vendor === undefined) {
    return <div className={GUIDE_AD_SLOT_PLACEHOLDER} aria-hidden="true" />;
  }

  if (vendor) {
    return <GuideAdVendorCard vendor={vendor} />;
  }

  return <GuideAdOpenSlot guideTitle={guideTitle} guideSlug={guideSlug} />;
};
