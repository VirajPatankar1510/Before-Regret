import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, Hash } from 'lucide-react';
import { setAdDetailsHint } from '../utils/adDetailsHint';

interface AdPaidNextStepProps {
  /** What was bought, in a few words: "3 articles", "Plumber in ZIP 78701, 78702, 78703". */
  what: string;
  captureId: string | null;
  /** Anything that went wrong with part of the order (a slot lost at capture), shown under the main message. */
  children?: React.ReactNode;
  onNavigate: (path: string) => void;
}

// The return page after PayPal, for a pay-first order (owner, 2026-11-15): payment is done, and the
// one remaining step is the business details, so the page says that and offers a single button.
// Used by GuideAdsCheckoutSuccess.tsx and ZipAdsCheckoutSuccess.tsx.
// Also marks this browser as having an ad waiting for details, so the sitewide reminder
// (AdDetailsReminder.tsx) can bring the vendor back if they close the tab here.
export const AdPaidNextStep: React.FC<AdPaidNextStepProps> = ({ what, captureId, children, onNavigate }) => {
  useEffect(() => { setAdDetailsHint(true); }, []);
  return (
  <>
    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" aria-hidden="true" />
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Payment received</h1>
      <p className="mt-1 text-sm text-slate-600">{what}</p>
    </div>
    <div className="bg-home-stone border border-home-linen rounded-2xl p-5 text-left">
      <p className="text-xs font-semibold text-home-brass">One step left</p>
      <p className="mt-1.5 text-base font-bold text-slate-900">Add your business name and phone number</p>
      <p className="mt-1 text-sm text-slate-600">
        Your ad goes live as soon as you save them, and your 30 days start then. Your spot is held for you until you do.
      </p>
      <button
        type="button"
        onClick={() => onNavigate('/my-ads/')}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm transition-colors cursor-pointer"
      >
        Add my details <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
    {children}
    {captureId && (
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Hash className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Payment reference: {captureId}. It's also saved in My Ads.</span>
      </p>
    )}
  </>
  );
};
