import React from 'react';
import { AlertCircle, MapPin, Sparkles } from 'lucide-react';
import { ReportAssentNotice } from './ReportAssentNotice';

interface ReportGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAddress: string;
  /** Kept as (email, isPaid) so the caller's signature did not have to change; always ('', false) now. */
  onConfirmAndGenerate: (userEmail: string, isPaid: boolean) => void;
  /** Set when the server refused the last attempt (daily limit); shown instead of the button. */
  notice?: string | null;
}

// The confirm step before a report is generated (2026-10-05, owner: "100% free for our end users").
//
// It used to be three gates in one: a mandatory Clerk sign-in, a one-free-report count kept in
// localStorage, and a $14.99 PayPal step for every report after the first. All three are gone.
// Reports are free, need no account, and no longer call any AI model, so there is no per-report
// cost to ration. Abuse is handled where it can actually be enforced -- the server's per-IP and
// site-wide daily caps (src/server/reportGenerationLimiter.ts), which a browser cannot bypass the
// way it could bypass the old localStorage count.
//
// What stays is the assent notice (the pricing sentence removed, "generating" now "getting" to match
// the button): getting a report is still agreeing to the Terms and confirming the declared inputs
// (Terms 3.5-3.6), and the notice still sits directly under the button so a reasonable person would
// see it. When the daily limit is hit there is no button, so neither the prompt nor the notice shows.
export const ReportGatingModal: React.FC<ReportGatingModalProps> = ({
  isOpen,
  onClose,
  targetAddress,
  onConfirmAndGenerate,
  notice,
}) => {
  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAndGenerate('', false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-slate-900 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold p-2 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">Get your property report</h3>
            {!notice && (
              <p className="text-sm text-slate-600 leading-relaxed">
                Check the address below, then get your report. No account or card needed.
              </p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold truncate">{targetAddress}</span>
          </div>

          {notice ? (
            <div role="status" className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get my free report</span>
            </button>
          )}

          {/* Assent notice, kept directly under the action -- see the comment at the top. */}
          {!notice && <ReportAssentNotice />}
        </form>
      </div>
    </div>
  );
};
