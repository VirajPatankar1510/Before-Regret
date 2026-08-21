import React, { useState } from 'react';
import { Flag, X, Send, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

// Reader-facing "something here is wrong" form, used from property reports AND from guide articles.
//
// WHAT THIS USED TO DO. Nothing. The submit handler's entire body was `setSubmitted(true)` -- there
// was no fetch, no endpoint and no table behind it -- and the success screen then told the reader
// "our data research team will cross-verify the underlying government API endpoint query and
// respond within 1-2 business days", over a ticket ID built from Date.now(). Every correction
// anyone ever sent went nowhere, and the reply that was promised could not be sent by anyone. That
// is the same defect as the fabricated Austin report: a confident statement about something that
// did not happen.
//
// Two things were needed to fix it, and neither alone would have been enough: the submission now
// goes to POST /api/content-reports and lands in the content_reports table (see db.ts), and the
// copy no longer describes a team, a verification process, or a turnaround that does not exist.
// Storing the report while keeping the old wording would have been the smaller version of the same
// lie.
//
// On the guide path specifically: this is opened by a BUTTON, never a link. That is deliberate --
// a <button> has no href, creates no crawlable URL, and passes no authority, so putting it on all
// 159 guides adds nothing for a crawler to follow and cannot dilute internal link equity or create
// a thin indexable page. A "/report-an-error" route linked from every guide would have done all
// three.

interface ErrorReportingModalProps {
  onClose: () => void;
  /** 'report' for a generated property report, 'guide' for an editorial article. */
  sourceType: 'report' | 'guide';
  /** The report id or the guide slug -- whatever identifies the thing being corrected. */
  sourceRef: string;
  /** Human-readable name of that thing: a property address, or a guide title. */
  sourceLabel: string;
}

export const ErrorReportingModal: React.FC<ErrorReportingModalProps> = ({
  onClose,
  sourceType,
  sourceRef,
  sourceLabel,
}) => {
  const [topic, setTopic] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGuide = sourceType === 'guide';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/content-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType, sourceRef, sourceLabel, topic, description, reporterEmail: userEmail }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        // Show the failure. The previous version could not fail, because it never tried.
        setError(data?.message || 'We could not record that just now. Please email hello@beforeregret.com instead.');
        return;
      }
      setReferenceId(data.referenceId);
    } catch {
      setError('We could not reach the server. Please email hello@beforeregret.com instead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans text-slate-900 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-auto">

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {referenceId ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Thanks — we've got it</h3>
            {/* Says what actually happens: it was saved, a person reads it, and if it is wrong we
                fix it and say so. No team, no "cross-verification against government source logs",
                no turnaround commitment nobody is staffed to meet. */}
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your report about <strong className="text-slate-900">{sourceLabel}</strong> has been saved
              and will be read by a person. If something here is wrong, we'll correct it
              {userEmail ? ' and reply to you' : ''}. We can't promise a specific turnaround, but
              corrections are the part of this we take most seriously.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 font-mono">
              Reference: {referenceId}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                <Flag className="w-3.5 h-3.5" />
                <span>Report an inaccuracy</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isGuide ? 'Something wrong in this guide?' : 'Report a suspected data error'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isGuide
                  ? 'If a fact, figure, or rule on this page looks wrong or out of date, tell us. We would rather hear it from you than leave it up.'
                  : 'If a finding looks outdated, incomplete, or wrong for this property, tell us which one and why.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">{isGuide ? 'Guide' : 'Property'}</p>
              <p className="text-slate-700 break-words">{sourceLabel}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label htmlFor="cr-topic" className="block font-bold text-slate-800 mb-1">
                  {isGuide ? 'Which part of the page?' : 'Which finding?'}
                </label>
                <input
                  id="cr-topic"
                  type="text"
                  required
                  placeholder={isGuide ? 'e.g. the section on lead paint disclosure' : 'e.g. Building permit history, flood zone'}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cr-desc" className="block font-bold text-slate-800 mb-1">What's wrong with it?</label>
                <textarea
                  id="cr-desc"
                  required
                  rows={4}
                  placeholder="What does it say, and what should it say? A source or link helps a lot."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                {/* Optional, and labelled as such. Requiring an email on a correction form turns
                    away the reader who just wants to flag something and move on -- and their
                    correction is worth exactly as much as anyone else's. */}
                <label htmlFor="cr-email" className="block font-bold text-slate-800 mb-1">
                  Your email <span className="font-normal text-slate-500">(optional — only so we can reply)</span>
                </label>
                <input
                  id="cr-email"
                  type="email"
                  placeholder="name@domain.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>A person reads every one of these. We can't promise a turnaround time, so we won't.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Sending…' : 'Send report'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
