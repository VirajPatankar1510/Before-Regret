import React, { useEffect } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBackToHome: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBackToHome }) => {
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
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">Privacy Policy</h1>
              <p className="text-xs text-slate-400 font-medium">Effective Date: July 14, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              At <strong>Atmostellar</strong> (owner of <strong>Before Regret</strong>), we value your privacy. This policy documents how we collect, store, and utilize user information for seamless platform delivery.
            </p>

            <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. Information We Collect</h3>
            <p>
              We collect names, email addresses, phone numbers, self-declared locality details (for resident verification), and custom questions submitted through our forms. All financial transactions are directly processed via secure, PCI-DSS compliant servers of our payment gateway. We do not store or see your credit card or bank credentials on our servers.
            </p>

            <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">2. Use of Information</h3>
            <p>
              Your details are utilized to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
              <li>Facilitate P2P consulting connections.</li>
              <li>Notify you of received replies.</li>
              <li>Improve the resident wiki search quality.</li>
              <li>Fulfill accounting, taxation, and statutory guidelines.</li>
            </ul>

            <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">3. Data Retention & Security</h3>
            <p>
              We utilize robust industry-grade encryption to protect your records. If you wish to delete your Before Regret profile or consultation logs, you can contact us at support@beforeregret.com. We will delete your records within 14 working days, except where retention is legally mandatory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
