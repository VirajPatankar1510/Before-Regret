import React, { useState } from 'react';
import { Flag, X, Send, AlertCircle, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface ErrorReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress: string;
  reportId: string;
}

export const ErrorReportingModal: React.FC<ErrorReportingModalProps> = ({
  isOpen,
  onClose,
  propertyAddress,
  reportId
}) => {
  const [findingTopic, setFindingTopic] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setFindingTopic('');
    setUserEmail('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans text-slate-900 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-auto">
        
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Discrepancy Report Received
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Thank you for flagging this item for property <strong className="text-slate-900">{propertyAddress}</strong>. Our data research team will cross-verify the underlying government API endpoint query and respond within <strong className="text-slate-900">1–2 business days</strong>.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 font-mono">
              Report Ticket ID: DISCREP_{Date.now().toString().slice(-6)}
            </div>
            <button
              onClick={handleResetAndClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Return to Research Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold font-mono">
                <Flag className="w-3.5 h-3.5" />
                <span>Active Data Discrepancy Channel</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Report a Suspected Data Error
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you suspect a public record finding is outdated, incomplete, or contains a clerical error, let us know. We verify all flags against original government source logs within 1–2 business days.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Property Parcel Under Review:</p>
              <p className="font-mono text-slate-700 truncate">{propertyAddress}</p>
              <p className="text-[11px] text-slate-400">Report Reference: {reportId}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Which Finding Topic Needs Verification?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Permit History, Flood Zone Designation"
                  value={findingTopic}
                  onChange={(e) => setFindingTopic(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Details of Discrepancy or Corrective Context</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe why this public record item appears incomplete, inaccurate, or outdated..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Guaranteed Review Turnaround:</strong> 1–2 business days review by data research staff.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Discrepancy Flag</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
