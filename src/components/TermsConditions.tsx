import React, { useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Building2, CheckCircle2, Lock, Scale, AlertTriangle } from 'lucide-react';

interface TermsConditionsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({ onBackToHome, onNavigate }) => {
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

          <span className="text-xs font-mono text-slate-500">Last Revised: August 3, 2026</span>
        </div>

        {/* Content Pane */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Expert property research guides for US home buyers. Uncover what matters before closing.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the web platform, software, and property research services provided under the brand name <strong>Before Regret</strong>, owned and operated by <strong>Atmostellar</strong> ("Company", "we", "us", "our"). Registered Office: Atmostellar, Mumbai, Maharashtra, India. Support Contact: <a href="mailto:hello@beforeregret.com" className="text-blue-600 hover:underline font-bold">hello@beforeregret.com</a>.
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mandatory Informational Research Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              BeforeRegret property research reports are compiled solely for preliminary informational and research purposes. Reports do NOT constitute a physical home inspection, structural engineering report, legal title opinion, property valuation, or professional financial advice. All findings must be independently confirmed with licensed professionals before entering into any binding real estate purchase or leasing contract.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
            
            {/* Section 1 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>1. Acceptance of Terms & Entity Information</span>
              </h2>
              <p>
                By accessing, browsing, or utilizing the Before Regret platform or generating property research reports, you ("User", "you", or "your") acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
              <p>
                <strong>Operating Entity:</strong> Atmostellar is a registered corporate entity headquartered in Mumbai, Maharashtra, India. The name "Before Regret" is used strictly as a commercial brand and product name representing Atmostellar's online property research software.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>2. Platform Business Model & Service Structure</span>
              </h2>
              <p>
                Before Regret operates two distinct services within one unified platform:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Consumer Property Insight Reports:</strong> Property research and due diligence guides helping home buyers and renters uncover publicly available information about a property before making an offer or signing a lease. Every consumer account is entitled to <strong>one free report</strong>; each additional report is a one-time purchase of <strong>$14.99 USD</strong>.
                </li>
                <li>
                  <strong>Paid Business Vendor Placements:</strong> Two self-serve, one-time-payment advertising products for local business vendors (contractors, licensed inspectors, structural engineers, environmental specialists): a <strong>Topic Ad</strong> shown on educational guide articles across the site, and a <strong>Report Ad</strong> shown as a sponsored placement ("Need help verifying this?" section, clearly labeled "Sponsored") within a designated zip code and trade category on consumer reports. Both are flat, one-time charges for a fixed 30-day placement window -- neither is a subscription, and neither renews automatically.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                3. Terms Applicable to Consumer Users
              </h2>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>3.1 Report Pricing & Payment:</strong> Your first property insight report is free, with no payment information required. Each additional report is a one-time purchase of $14.99 USD — a single, non-recurring charge, not a subscription. Card details for paid reports are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number. Using or viewing a report does not establish a contractual or fiduciary advisory relationship between you and Atmostellar.
                </p>
                <p>
                  <strong>3.2 As-Is Provision & Non-Diagnostic Stance:</strong> Property research reports assemble raw or aggregated public data provided by third-party government and municipal agencies. All reports are provided strictly on an <strong>"AS-IS"</strong> and <strong>"AS-AVAILABLE"</strong> basis without warranty of any kind. Atmostellar makes no guarantees regarding the completeness, accuracy, timeliness, or real-time status of public records.
                </p>
                <p>
                  <strong>3.3 Duty to Independently Confirm:</strong> BeforeRegret reports are preliminary discovery tools only. They are not a substitute for physical site visits, structural inspections, environmental testing, or legal title searches. Consumers expressly agree that they remain solely responsible for independently confirming all hazard classifications, building permit histories, and property characteristics with qualified, licensed professionals prior to making any financial, leasing, or purchasing commitment.
                </p>
                <p>
                  <strong>3.4 No Refunds on Report Purchases:</strong> Report purchases are only charged after a property address has been confirmed eligible and the report is generated and delivered immediately upon payment. <strong>All report purchases are final and non-refundable.</strong> See our Cancellation & Refund Policy for full detail.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                4. Terms Applicable to Local Business Vendors (Sponsored Placements)
              </h2>
              <div className="space-y-2.5 text-xs text-slate-600">
                <p>
                  <strong>4.1 Placement Pricing & Payment:</strong> Local business vendors may purchase one of two self-serve placement products, each a <strong>single, one-time, non-recurring charge</strong> for a fixed 30-day placement window: a <strong>Topic Ad</strong> at a flat rate of <strong>$7.99 USD</strong> per (guide article, position) slot, or a <strong>Report Ad</strong> at a flat rate of <strong>$29.00 USD</strong> per (zip code, trade category) slot. Neither product is a subscription; there is <strong>no automatic renewal or re-billing of any kind</strong>. To keep a placement active beyond its 30-day window, the vendor must return and purchase another window -- if they do not, the slot automatically becomes available to other vendors. A separate purchase, charged separately, is required for each additional slot a vendor wishes to appear in.
                </p>

                <p>
                  <strong>4.2 First-Come, First-Served Slot Allocation:</strong> Report Ad placements are bound to the specific zip code and trade category (e.g., Roof Inspection, Electrician, Home Inspector) selected at checkout, capped at a maximum of <strong>two (2) active vendors per trade category within any individual zip code</strong>. Topic Ad placements are bound to the specific guide article and position selected at checkout, with one vendor per position. Available slots are allocated strictly on a first-come, first-served basis at the time payment is successfully completed; selecting a slot does not reserve it until payment succeeds.
                </p>

                <p>
                  <strong>4.3 Placement Expiration & Early Removal:</strong> A placement runs for the fixed 30-day window it was purchased for and then expires automatically -- there is no recurring payment to cancel. A vendor may also have an active placement removed before it expires at any time by contacting <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>. Upon expiration, or upon early removal at the vendor's request, the slot becomes immediately available to other vendors on a first-come, first-served basis. <strong>All payments are final. No refunds, partial refunds, or credits are issued under any circumstance</strong>, including early removal at the vendor's request or removal by Atmostellar as described in Section 4.4. See our Cancellation & Refund Policy for full detail.
                </p>

                <p>
                  <strong>4.4 Vendor Licensure & Removal Rights:</strong> Vendors warrant that they hold valid, active state/local licenses and liability insurance required for their trade category. Atmostellar explicitly reserves the right to immediately suspend or remove a vendor's sponsored placement without notice if: (a) the vendor's professional licensure or registration expires, is suspended, or is revoked; (b) unresolved consumer fraud or quality complaints are filed; or (c) the vendor breaches these Terms.
                </p>

                <p>
                  <strong>4.5 No Lead Volume or Outcome Guarantee:</strong> Sponsored placements are promotional advertisements clearly labeled "Sponsored". Atmostellar makes <strong>no guarantee or representation</strong> regarding specific impression volumes, click-through rates, phone call volumes, lead generation numbers, client conversions, or revenue outcomes resulting from a sponsored placement.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                5. Intellectual Property Rights
              </h2>
              <p>
                All rights, title, and interest in and to the Before Regret platform, including software code, report layout structures, compiled dataset formats, visual designs, graphics, and trademarks, are and shall remain the exclusive property of Atmostellar. User-submitted vendor business details (company logos, trademarks, and business contact information) remain the property of the respective vendor, and the vendor grants Atmostellar a non-exclusive, worldwide license to display such material within sponsored placements.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, in no event shall Atmostellar, its directors, officers, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, real estate transaction losses, data errors, or business interruption, arising out of or in connection with your use of Before Regret. Atmostellar's total aggregate liability for any claims under these Terms shall not exceed the total fees actually paid by you to Atmostellar in the three (3) months preceding the claim, or $100 in the case of free report consumers.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                7. Governing Law, Jurisdiction & Legal Note
              </h2>
              <p>
                These Terms shall be governed by, construed, and enforced in accordance with the laws of India, without regard to its conflict of law principles. Any dispute or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India.
              </p>
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 font-mono">
                <strong>Legal Jurisdiction Note:</strong> Governing law and jurisdiction are specified based on Atmostellar's corporate registration in Mumbai, Maharashtra, India. Prior to US commercial scaling, formal legal confirmation regarding Indian vs. US jurisdiction for US-based consumer and vendor contracts is recommended.
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                8. General Provisions
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Severability:</strong> If any provision of these Terms is held invalid or unenforceable, that provision shall be severed and the remaining provisions shall continue in full force.</li>
                <li><strong>Modifications:</strong> Atmostellar reserves the right to modify these Terms at any time. Updated Terms will be published on the platform with a revised effective date.</li>
                <li><strong>Age Requirement:</strong> You must be at least 18 years of age to use this platform or purchase a placement as a business vendor.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                9. Contact Information
              </h2>
              <p>
                For questions or formal notices regarding these Terms of Service, please contact us at:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Atmostellar (Operating Entity for Before Regret)</p>
                <p>Mumbai, Maharashtra, India</p>
                <p>Support Email: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a></p>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
};
