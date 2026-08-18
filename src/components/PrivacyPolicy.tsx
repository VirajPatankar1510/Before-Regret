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

          <span className="text-xs font-mono text-slate-500">Effective Date: August 17, 2026</span>
        </div>

        {/* Content Pane */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Property research guides for US home buyers, built from public records.
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
                    <li>Technical session metadata (IP address, browser type, device OS) for rate limiting, security, and to record your acceptance of our Terms of Service.</li>
                    <li>Inquiries sent to customer support via email.</li>
                    <li className="font-semibold text-slate-900">
                      For any report beyond your first free report, payment is taken through <strong>PayPal</strong>, a PCI-DSS compliant third-party payment processor. You are redirected to PayPal's own checkout to pay, PayPal handles your payment details under its own privacy policy, and Atmostellar receives only a confirmation that payment succeeded — never your card number.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>B. Local Business Vendors (Subscribers)</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Business contact details (company name, account email address, business phone number, and an optional website) -- self-reported by the vendor at checkout, not independently verified by us.</li>
                    <li>A licence, registration, or certification number, required at checkout for most trade categories. This is <strong>published in the vendor's placement</strong> exactly as supplied, and is not verified by us against any licensing authority.</li>
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
                Both consumer report purchases and vendor placement fees are processed entirely through <strong>PayPal</strong>, a PCI-DSS Level 1 compliant third-party payment processor. Payment happens on PayPal's own checkout, not on this site, and is subject to PayPal's privacy policy in addition to this one.
              </p>
              <p className="text-xs font-bold text-emerald-950 bg-white p-3 rounded-xl border border-emerald-200">
                Atmostellar NEVER stores, transmits, or sees full payment card numbers, credit card CVVs, or bank credentials on our servers — we never handle them at all. We receive from PayPal only the transaction identifier and a confirmation that the payment succeeded, which we store against your order.
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
                We retain vendor registration and receipt records for the duration of the active placement plus required legal tax retention periods.
              </p>
              {/* This paragraph replaced a sentence claiming consumer search logs were retained only
                  "in aggregated, non-personally-identifiable form." That was accurate when written
                  and stopped being accurate the moment the generated_reports table landed (see
                  db.ts): that table stores a specific address alongside an IP, a user-agent, and an
                  account identifier, which is neither aggregated nor non-identifiable. Leaving the
                  old sentence in place would have been an affirmative misstatement about our own
                  practices in the document a regulator reads first -- a materially worse position
                  than disclosing the record plainly, which is what this now does. Modelled directly
                  on the Terms-acceptance paragraph below, which solved the same problem. */}
              <p>
                <strong>Report request records.</strong> When you generate a property report, we keep
                a record of that request: the address you researched, the property type, year built,
                and unit number you entered, your account identifier where you were signed in, and
                the IP address and browser user-agent at that moment. This is a record about you, not
                an anonymous statistic, and we keep it deliberately for two reasons: it is the
                evidence of what was actually submitted if a report is later disputed as inaccurate
                (see sections 3.5 and 3.6 of our{' '}
                <a href="/terms/" className="text-blue-600 font-bold hover:underline">Terms of Service</a>),
                and it is what lets us investigate abuse of the free-report allowance. We retain it
                for <strong>three years</strong> from the date of the request, then delete it.
              </p>
              {/* Added when consumer Terms acceptance began being recorded (see
                  src/server/termsApi.ts). Disclosing this specifically matters: it is a record
                  ABOUT the user, kept deliberately and long-term, and the deletion carve-out below
                  is meaningless unless the reader first knows the record exists. */}
              <p>
                <strong>Terms acceptance records.</strong> When you accept our Terms of Service, we
                record that acceptance: your account identifier and email address, which revision of
                the Terms you accepted, the date and time, and the IP address and browser user-agent
                at that moment. This is kept as evidence of the agreement between us, for as long as
                that agreement could give rise to a claim.
              </p>
              {/* The mirror of the paragraph above, and disclosed for the same reason. An opt-out
                  ledger is a record kept ABOUT a user that they never see, created by an email they
                  sent -- exactly the kind of quiet retention a privacy policy exists to surface.
                  See arbitration_opt_outs in src/server/db.ts. */}
              <p>
                <strong>Arbitration opt-out records.</strong> If you email us to opt out of the
                arbitration agreement in section 7.9 of the Terms, we record that too: your email
                address, the revision of the Terms you are rejecting, the date you sent it, and a
                copy of your message. We keep this <strong>so that your opt-out can be proved later
                by either of us</strong> -- a right nobody can evidence is not much of a right. It is
                retained on the same basis, and for the same reason, as the acceptance record above.
              </p>
              <p>
                <strong>Your Data Rights:</strong> You have the right to request access to, correction of, or permanent deletion of your personal information stored by Atmostellar. To submit a data privacy request, email <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>. Privacy requests are fulfilled within 14 business days.
              </p>
              <p>
                <strong>One limit on deletion, stated plainly.</strong> We may retain the Terms
                acceptance record and the report request record described above, and records of
                payments, after other data is deleted, where retention is necessary to establish,
                exercise, or defend a legal claim, or to meet a tax or accounting obligation.
                Deleting the record of an agreement, or of what was submitted to produce a report,
                would remove the evidence of what each side actually did, which does not serve
                either of us. Everything not needed for those purposes is deleted on request, and
                the report request record is deleted outright once the three-year period above has
                run.
              </p>
            </section>

            {/* Section 8 -- short pointer to Terms Section 7, not a restatement of it, for the same
                reason the Disclaimer and Refund Policy carry the same pointer: the operative clause
                should have exactly one home. */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                8. Disputes About Privacy
              </h2>
              <p>
                Contact us first -- most concerns are resolved directly, and{' '}
                <a href="/terms/" className="text-blue-600 font-bold hover:underline">section 7.1 of our Terms of Service</a>{' '}
                requires both sides to attempt informal resolution for 60 days before any formal
                proceeding. Beyond that, a claim relating to this policy is subject to the binding
                individual arbitration agreement and class action waiver in{' '}
                <a href="/terms/" className="text-blue-600 font-bold hover:underline">section 7 of the Terms</a>,
                which control over this summary, with the same <strong>small claims</strong> carve-out
                and the same <strong>30-day opt-out</strong>. None of this limits any right you have
                to complain to a data protection authority in your jurisdiction.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                9. Privacy Contact Point
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
