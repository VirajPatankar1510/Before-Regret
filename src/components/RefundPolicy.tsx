import React, { useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface RefundPolicyProps {
  onBackToHome: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      {/* Back Button */}
      <button
        onClick={() => {
          onBackToHome();
          window.scrollTo(0, 0);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all mb-8 cursor-pointer border border-slate-200/50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Content Pane */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-3xs">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">Refund & Cancellation Policy</h1>
              <p className="text-xs text-slate-400 font-medium">Effective Date: 20 July 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              At BeforeRegret (Atmostellar), we provide live, time-based Resident Chats that allow users to connect with independent residents and learn from their personal experiences before renting or buying a property.
            </p>

            <p>
              By booking a Resident Chat, you agree to the following Refund & Cancellation Policy.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm uppercase">1. Cancellation Policy</h3>
            <p>
              Once a Resident Chat has been booked and the session has started, it cannot be cancelled.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm uppercase">2. Refund Policy</h3>
            <p>
              Resident Chats are live, time-based services that are consumed as they are delivered. Therefore, refunds are not available once a Resident Chat has started or has been completed.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm uppercase">3. Exceptions</h3>
            <p>
              A refund or a replacement Resident Chat may be provided only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>The resident does not join the scheduled chat.</li>
              <li>The Resident Chat cannot be completed due to a verified technical issue on the BeforeRegret platform.</li>
              <li>The service cannot be delivered due to an issue caused solely by BeforeRegret.</li>
            </ul>
            <p className="italic text-slate-500">
              All requests are reviewed on a case-by-case basis.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm uppercase">4. User Responsibility</h3>
            <p>
              Users are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Joining the Resident Chat on time.</li>
              <li>Having a stable internet connection.</li>
              <li>Using the allotted chat time to ask their questions.</li>
            </ul>
            <p>
              Failure to attend or fully utilize a booked Resident Chat does not qualify for a refund.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm uppercase">5. Contact Us</h3>
            <p>
              If you believe your booking qualifies for an exception, please contact us within 48 hours of the scheduled Resident Chat by emailing <a href="mailto:support@beforeregret.com" className="text-blue-600 hover:underline font-semibold">support@beforeregret.com</a>. Please include your booking details and a brief description of the issue. We will review your request and respond as soon as reasonably possible.
            </p>

            <div className="border-t border-slate-100 pt-6 mt-8">
              <p className="font-medium text-slate-800">
                By booking a Resident Chat on BeforeRegret, you acknowledge that the service is delivered in real time and agree to this Refund & Cancellation Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
