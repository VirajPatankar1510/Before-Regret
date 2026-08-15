import React, { useEffect } from 'react';
import { ArrowLeft, Lock, Eye, Database, FileText, CheckCircle2, Building2 } from 'lucide-react';

interface PrivacyPolicyProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBackToHome, onNavigate }) => {
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
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Expert property research guides for US home buyers. Uncover what matters before closing.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              At <strong>Atmostellar</strong> (operating the brand name <strong>Before Regret</strong>), we respect your privacy and are committed to protecting personal data collected across our free consumer property research platform and paid vendor placement services. Support Contact: <a href="mailto:hello@beforeregret.com" className="text-blue-600 hover:underline font-bold">hello@beforeregret.com</a>.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
            
            {/* Section 1 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>1. Operating Entity & Scope</span>
              </h2>
              <p>
                This Privacy Policy documents how Atmostellar ("Company", "we", "us", "our"), registered in Mumbai, Maharashtra, India, collects, uses, stores, and safeguards personal information when you access <strong className="text-slate-900">beforeregret.com</strong> or use Before Regret services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                2. Information We Collect
              </h2>
              <p>
                The type of data we collect depends on how you interact with our platform:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>A. Consumer Users</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Property address and zip code search query inputs.</li>
                    <li>Account email address (required to claim your free report and track per-account usage).</li>
                    <li>Technical session metadata (IP address, browser type, device OS) for rate limiting and security.</li>
                    <li>Inquiries sent to customer support via email.</li>
                    <li className="font-semibold text-slate-900">
                      For any report beyond your first free report, billing and payment card details are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>B. Local Business Vendors (Subscribers)</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Business contact details (company name, account email address, business phone number, and an optional website and tagline) -- self-reported by the vendor at checkout, not independently verified by us.</li>
                    <li>Trade category and selected zip code placement choices.</li>
                    <li>Billing and invoice transaction records handled by our secure payment gateway.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
              <h2 className="text-base font-bold text-emerald-950 border-b border-emerald-200/80 pb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>3. Payment Card Handling & Processor Security</span>
              </h2>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Vendor placement fees are processed entirely through a PCI-DSS Level 1 compliant secure third-party payment processor.
              </p>
              <p className="text-xs font-bold text-emerald-950 bg-white p-3 rounded-xl border border-emerald-200">
                Atmostellar NEVER stores, transmits, or sees full payment card numbers, credit card CVVs, or bank credentials directly on our servers. All financial data is encrypted and tokenized by the third-party payment gateway.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                4. How We Use Collected Data
              </h2>
              <p>We utilize collected information solely for operational and service delivery purposes:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                <li>Generating and rendering free property research reports.</li>
                <li>Managing vendor placement billing, account modifications, and the contact details a vendor submits for their own listing.</li>
                <li>Auditing dataset accuracy, resolving user data error flags, and improving pSEO page rendering.</li>
                <li>Maintaining cybersecurity, detecting abuse, and fulfilling legal tax and accounting requirements.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                5. Third-Party Data Sharing & Disclosure
              </h2>
              <p>
                We adhere to strict data minimization standards:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                <li>
                  <strong>Vendor Business Information:</strong> For vendors with an active placement, business contact details (company name, trade category, phone number, and logo) appear publicly within sponsored placements ("Need help verifying this?" sections) on free property reports in the vendor's selected zip codes. Vendor internal billing records are never disclosed publicly.
                </li>
                <li>
                  <strong>Consumer Data Privacy:</strong> Consumer search queries, IP addresses, and personal inquiry emails are <strong>NEVER sold, rented, monetized, or shared</strong> with third-party advertisers, market brokers, or commercial vendors.
                </li>
                <li>
                  <strong>Statutory Disclosures:</strong> We disclose information only when required by valid judicial order, law enforcement subpoena, or statutory legal obligation.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                6. Cookie & Analytics Disclosure
              </h2>
              <p>
                Before Regret utilizes standard, non-intrusive session cookies and privacy-preserving analytics scripts to measure aggregate traffic patterns, analyze page performance across zip codes, and prevent automated spam bot activity.
              </p>
              <p className="text-xs text-slate-500 italic">
                Note: Cookies used on our platform do not track your activity on non-Atmostellar websites and do not sell user profiles to advertising networks. Users can manage or disable cookie preferences through standard browser settings.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                7. Data Retention & User Rights
              </h2>
              <p>
                We retain vendor registration and receipt records for the duration of the active placement plus required legal tax retention periods. Consumer search logs are retained in aggregated, non-personally-identifiable form for system optimization.
              </p>
              <p>
                <strong>Your Data Rights:</strong> You have the right to request access to, correction of, or permanent deletion of your personal information stored by Atmostellar. To submit a data privacy request, email <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>. Privacy requests are fulfilled within 14 business days.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                8. Privacy Contact Point
              </h2>
              <p>
                For any privacy concerns, data deletion requests, or questions regarding this policy, please reach out to:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Atmostellar (Owner of Before Regret)</p>
                <p>Mumbai, Maharashtra, India</p>
                <p>Privacy Email: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a></p>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
};
