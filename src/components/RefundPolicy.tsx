import React, { useEffect } from 'react';
import { RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, Building2, HelpCircle } from 'lucide-react';

interface RefundPolicyProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/');
              else onBackToHome();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>

          <span className="text-xs font-mono text-slate-500">Effective Date: August 3, 2026</span>
        </div>

        {/* Content Pane */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold font-mono">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Financial Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cancellation & Refund Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This Cancellation & Refund Policy outlines the terms governing free consumer usage and paid local business vendor subscriptions for <strong>Before Regret</strong>, owned and operated by <strong>Atmostellar</strong>. Registered Office: Atmostellar, Mumbai, Maharashtra, India. Contact: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>.
            </p>
          </div>

          {/* Core Rule Banner #1: Consumer Free Notice */}
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Consumer Property Research Reports: 100% Free of Charge</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              BeforeRegret consumer property research reports are provided completely free of charge. Consumer users are never required to submit payment information, credit card credentials, or enter into a paid contract. Because no financial transaction takes place for report usage, <strong>no cancellations, billing charges, or refund claims apply to consumer users.</strong>
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                1. Business Vendor Subscriptions Overview
              </h2>
              <p>
                Atmostellar offers a paid monthly subscription service for local business vendors (contractors, licensed home inspectors, structural engineers, environmental remediation specialists) to display a sponsored placement ("Need help inspecting this?" section) in one specific zip code and trade category on free consumer reports.
              </p>
              <p>Vendor pricing is a single flat rate, with no tiers or bundles:</p>

              <div className="max-w-xs mx-auto p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Per Zip Code, Per Trade Category</span>
                <div className="text-lg font-black text-blue-900">$29 <span className="text-xs font-normal text-blue-600">/ mo</span></div>
                <p className="text-xs text-blue-800 font-medium">Recurring monthly charge, auto-renews until cancelled</p>
              </div>
              <p className="text-xs text-slate-500">
                A separate subscription, billed separately at the same flat rate, is required for each additional zip code and/or trade category combination.
              </p>
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>Card details are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                2. Vendor Cancellation Terms
              </h2>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <strong>Cancellation Anytime:</strong> Subscribed vendors may cancel their subscription at any time by sending an email to <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>.
                </li>
                <li>
                  <strong>Effective Date of Cancellation & Slot Release:</strong> Upon cancellation, or upon a failed or declined renewal payment, the vendor's sponsored placement is removed and the zip code/trade category slot immediately becomes available to other vendors on a first-come, first-served basis.
                </li>
                <li>
                  <strong>No Refunds for Vendor Self-Cancellation:</strong> Vendor subscriptions are billed in advance on a monthly, auto-renewing basis. <strong>No refunds, partial refunds, or credits are issued</strong> for any unused or remaining portion of a billing period, regardless of when during the cycle the vendor cancels.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                3. Listing Removal & Refund Eligibility (Atmostellar-Initiated)
              </h2>
              <p>
                To maintain the integrity of BeforeRegret reports, Atmostellar enforces strict vendor licensure and quality standards, and also reserves the right to discontinue the vendor placement program, or a specific placement, for administrative or business reasons.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                  <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Removal for Vendor Policy Violation or Breach (NO REFUND)</span>
                  </h3>
                  <p className="text-amber-900 leading-relaxed">
                    If Atmostellar suspends or removes a vendor's sponsored placement due to expired or revoked trade licensure, fraudulent business practices, unresolved consumer complaints, or breach of our Terms of Service, <strong>no refund or credit will be issued</strong> for the remaining portion of the billing cycle. The removal is a direct consequence of vendor non-compliance.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1.5">
                  <h3 className="font-bold text-blue-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Removal for Atmostellar Administrative Reasons (NO REFUND)</span>
                  </h3>
                  <p className="text-blue-900 leading-relaxed">
                    If Atmostellar removes or terminates a vendor's sponsored placement prior to the end of a billing cycle for internal administrative, technical, or business restructuring reasons not attributable to any fault of the vendor, the placement is discontinued for the remainder of that cycle. Consistent with our all-sales-final billing policy, <strong>no refund or credit is issued</strong> in this case either.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                4. Policy Summary Matrix
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 font-bold">
                      <th className="p-3">User / Event Scenario</th>
                      <th className="p-3">Cancellation Timing</th>
                      <th className="p-3">Refund Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Consumer Report Usage</td>
                      <td className="p-3">N/A (Always Free)</td>
                      <td className="p-3 text-emerald-700 font-bold">N/A (No charge ever)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Vendor Self-Cancellation</td>
                      <td className="p-3">Immediate — slot released to other vendors</td>
                      <td className="p-3 text-rose-700 font-bold">No refund</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Declined / Failed Renewal Payment</td>
                      <td className="p-3">Immediate — slot released to other vendors</td>
                      <td className="p-3 text-rose-700 font-bold">No refund</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Atmostellar Removal (Vendor License Breach / Fraud)</td>
                      <td className="p-3">Immediate removal</td>
                      <td className="p-3 text-rose-700 font-bold">No refund (Forfeited due to violation)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Atmostellar Removal (Administrative / No Vendor Fault)</td>
                      <td className="p-3">Immediate removal</td>
                      <td className="p-3 text-rose-700 font-bold">No refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                5. Billing Support & Inquiries
              </h2>
              <p>
                If you have questions regarding a vendor subscription invoice or billing status, please contact our support team:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Atmostellar Support Desk</p>
                <p>Mumbai, Maharashtra, India</p>
                <p>Support Channel: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a></p>
                <p className="text-slate-500 pt-1">Expected Response Time: 1–2 business days</p>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
};
