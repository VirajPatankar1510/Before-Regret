import React, { useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, Building2, HelpCircle } from 'lucide-react';

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
            <p className="text-xs font-medium text-slate-400">
              Expert property research guides for US home buyers. Uncover what matters before closing.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cancellation & Refund Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This Cancellation & Refund Policy outlines the terms governing consumer property insight report purchases and paid local business vendor placements for <strong>Before Regret</strong>, owned and operated by <strong>Atmostellar</strong>. Registered Office: Atmostellar, Mumbai, Maharashtra, India. Contact: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>.
            </p>
          </div>

          {/* Core Rule Banner #1: First Report Free Notice */}
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your First Property Insight Report Is Free</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Every account is entitled to one free property insight report, with no payment information required. Because no financial transaction takes place for a first report, <strong>no cancellations, billing charges, or refund claims apply to a first free report.</strong> Additional reports beyond your first are a one-time paid purchase — see Section 1 below.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">

            {/* Section 1 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                1. Consumer Report Purchases
              </h2>
              <p>
                Every consumer account is entitled to <strong>one free property insight report</strong>, with no payment information required. Each additional report beyond your first is a <strong>one-time purchase of $14.99 USD</strong> — this is a single, non-recurring charge per report, not a subscription. A new report request only reaches payment after the property address has already been confirmed eligible (a valid U.S. residential property); addresses that cannot be verified are never charged.
              </p>
              <p>
                <strong>No Refunds:</strong> Because payment is only collected after address eligibility is confirmed and the report is generated and delivered immediately upon payment, <strong>all report purchases are final and non-refundable.</strong>
              </p>
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>Card details are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                2. Business Vendor Placements Overview
              </h2>
              <p>
                Atmostellar offers two self-serve, one-time-payment placement products for local business vendors (contractors, home inspectors, pest control specialists, environmental remediation specialists): a <strong>Topic Ad</strong>, shown on educational guide articles across the site, and a <strong>Report Ad</strong>, shown as a sponsored placement ("Need help verifying this?" section) inside property reports for a bundle of three zip codes within one trade category. Neither is a subscription -- each is a single, one-time charge for a fixed 30-day placement window, with no automatic renewal or re-billing of any kind.
              </p>
              <p>Pricing is a flat rate per slot, with no tiers:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Topic Ad, Per Slot</span>
                  <div className="text-lg font-black text-blue-900">$7.99 <span className="text-xs font-normal text-blue-600">/ 30 days</span></div>
                  <p className="text-xs text-blue-800 font-medium">One-time charge, no auto-renewal</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Report Ad, 3 Zips + Trade</span>
                  <div className="text-lg font-black text-emerald-900">$29 <span className="text-xs font-normal text-emerald-600">/ 30 days</span></div>
                  <p className="text-xs text-emerald-800 font-medium">One-time charge, no auto-renewal</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                A separate one-time purchase, charged separately at the same flat rate, is required for each additional slot or bundle a vendor wishes to appear in. To keep a placement active beyond its 30-day window, the vendor must return and purchase another window -- nothing renews automatically.
              </p>
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>Card details are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number.</p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                3. Placement Expiration & Early Removal
              </h2>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <strong>Automatic Expiration:</strong> A placement runs for the fixed 30-day window it was purchased for, then expires automatically. There is no subscription to cancel and no recurring payment of any kind -- the full charge was collected once, upfront, at checkout.
                </li>
                <li>
                  <strong>Early Removal on Request:</strong> A vendor may have an active placement removed before it expires at any time by emailing <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>.
                </li>
                <li>
                  <strong>Slot Release:</strong> Upon expiration, or upon early removal at the vendor's request, the slot immediately becomes available to other vendors on a first-come, first-served basis.
                </li>
                <li>
                  <strong>No Refunds for Early Removal:</strong> Placements are paid in full, upfront, for a fixed 30-day window. <strong>No refunds, partial refunds, or credits are issued</strong> for any unused or remaining portion of that window, regardless of when during the window the vendor requests removal.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                4. Listing Removal & Refund Eligibility (Atmostellar-Initiated)
              </h2>
              <p>
                Vendor placements are self-serve: Atmostellar does not independently verify a vendor's trade license, insurance, or credentials before a placement goes live -- business name, trade category, and contact details are self-reported by the vendor at checkout. Atmostellar reserves the right to remove a placement, or discontinue the placement program entirely, for administrative or business reasons, or upon becoming aware of a problem with a listing.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                  <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Removal for Vendor Policy Violation or Breach (NO REFUND)</span>
                  </h3>
                  <p className="text-amber-900 leading-relaxed">
                    If Atmostellar becomes aware -- through a consumer complaint or otherwise -- that a vendor's trade license has expired or been revoked, or that a listing involves fraudulent business practices or a breach of our Terms of Service, and suspends or removes the placement as a result, <strong>no refund or credit will be issued</strong> for the remaining portion of the 30-day placement window. The removal is a direct consequence of vendor non-compliance.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1.5">
                  <h3 className="font-bold text-blue-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Removal for Atmostellar Administrative Reasons (NO REFUND)</span>
                  </h3>
                  <p className="text-blue-900 leading-relaxed">
                    If Atmostellar removes or terminates a vendor's sponsored placement prior to the end of its 30-day window for internal administrative, technical, or business restructuring reasons not attributable to any fault of the vendor, the placement is discontinued for the remainder of that window. Consistent with our all-sales-final billing policy, <strong>no refund or credit is issued</strong> in this case either.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                5. Policy Summary Matrix
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 font-bold">
                      <th className="p-3">User / Event Scenario</th>
                      <th className="p-3">Timing</th>
                      <th className="p-3">Refund Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Consumer First Report</td>
                      <td className="p-3">N/A (Always Free)</td>
                      <td className="p-3 text-emerald-700 font-bold">N/A (No charge ever)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Consumer Additional Report Purchase ($14.99)</td>
                      <td className="p-3">N/A (One-time purchase)</td>
                      <td className="p-3 text-rose-700 font-bold">No refund</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Vendor Placement Expiration (Topic Ad / Report Ad, 30 Days Elapsed)</td>
                      <td className="p-3">N/A — runs its full paid term, then expires</td>
                      <td className="p-3 text-emerald-700 font-bold">N/A (No charge was pending)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Vendor Early Removal Request</td>
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

            {/* Section 6 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                6. Billing Support & Inquiries
              </h2>
              <p>
                If you have questions regarding a report purchase, a vendor placement receipt, or billing status, please contact our support team:
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
