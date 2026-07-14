import React, { useState, useEffect } from 'react';
import { Shield, FileText, RefreshCw, Mail, Truck, AlertTriangle, ArrowLeft, ExternalLink, Calendar, MapPin, Phone } from 'lucide-react';

interface PoliciesProps {
  initialTab?: 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer';
  onBackToHome: () => void;
}

export const Policies: React.FC<PoliciesProps> = ({ initialTab = 'terms', onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const tabs = [
    { id: 'disclaimer', label: 'Legal Disclaimer', icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'refunds', label: 'Refund & Cancellation', icon: RefreshCw, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'shipping', label: 'Service Fulfillment', icon: Truck, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'contact', label: 'Contact Us', icon: Mail, color: 'text-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
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

      <div className="text-center md:text-left mb-10 border-b border-slate-100 pb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
          Legal center & Policies
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Official guidelines, payment policies, terms of service, and comprehensive liability disclosures for 
          <strong> Before Regret</strong>, an unregistered brand operated by <strong>Atmostellar</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono px-3 mb-3">
            Policy Sections
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-slate-800 text-white' : tab.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-6 space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Corporate Entity
            </div>
            <div className="text-xs font-bold text-slate-800">Atmostellar</div>
            <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
              "Before Regret" is operated as an unregistered proprietary brand owned entirely by Atmostellar. All contracts and obligations lie with the parent entity.
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-3xs">
          
          {/* Active Tab: LEGAL DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Legal Disclaimer & Waiver of Liability</h2>
                  <p className="text-xs text-slate-400 font-medium">Last Updated: July 14, 2026</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-amber-800 text-xs font-medium leading-relaxed">
                  <strong>CRITICAL NOTICE:</strong> Please read this Legal Disclaimer carefully before using before-regret.com or seeking resident consultations. By accessing, browsing, or transacting on this platform, you acknowledge and agree that you are bound by these terms, which fully insulate <strong>Atmostellar</strong> and its brand <strong>Before Regret</strong> from any legal disputes, real estate transactions, financial damages, or incorrect facts.
                </div>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">1. "As-Is" Crowdsourced Information</h3>
                <p>
                  All content, ratings, reviews, responses, or Wiki facts presented on Before Regret are user-declared, crowdsourced opinions written by independent residential occupants, prospective buyers, or local agents. Atmostellar acts purely as a technology facilitator and does not independently audit, verify, investigate, or warrant the factual accuracy of any post, advice, or review.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">2. Absolutely No Professional Advice</h3>
                <p>
                  Any opinion shared by a listed "Local Expert" or resident represents their personal experience only. It does not constitute legal, financial, structural, architectural, or regulatory advice. Buying or renting real estate involves substantial capital risks. You are strictly advised to conduct official due diligence, legal search, and builder background checks via official property registration portals before making any real estate commitment.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">3. Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by applicable laws in India, neither <strong>Atmostellar</strong> nor its representatives, directors, or unregistered brand brand-associates shall be held liable for:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
                  <li>Any direct, indirect, incidental, or consequential damages resulting from choosing a property based on wiki entries or consultant chats.</li>
                  <li>Inaccurate reporting of property parameters (such as water quality, bachelor rules, maintenance fee structures, or sound insulation).</li>
                  <li>Any personal disputes, financial losses, or physical conflicts between users and resident experts.</li>
                  <li>Any system downtimes, delay in consultant replies, or external payment processing failures on our gateway partners.</li>
                </ul>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">4. Absolute Indemnity</h3>
                <p>
                  By utilizing our website, you agree to indemnify, defend, and hold harmless Atmostellar, its proprietary brand Before Regret, its founder, employees, and licensing affiliates from any claims, suits, losses, liabilities, costs, or legal expenses (including reasonable attorney fees) arising directly or indirectly out of your reliance on the information on this website or interaction with any local experts.
                </p>
              </div>
            </div>
          )}

          {/* Active Tab: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Terms & Conditions of Service</h2>
                  <p className="text-xs text-slate-400 font-medium">Effective Date: July 14, 2026</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <p>
                  Welcome to Before Regret, a digital technology marketplace provided by <strong>Atmostellar</strong> ("Company", "We", "Us"). These Terms govern your access to the Before Regret platform, including its Wiki, direct resident chat bookings, and consulting solutions.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. Platform Nature & Services</h3>
                <p>
                  Before Regret is an online peer-to-peer venue connecting property seekers with active residents of gated societies. Atmostellar facilitates payments via authorized gateways (e.g., Razorpay) but is not a party to the conversation, nor does it guarantee response completeness.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">2. Paid Consultation Packages</h3>
                <p>
                  Seekers may buy "Quick Consultation" (₹99), "Comprehensive Bundle" (₹199), or "Live Chat" (₹299) packages to direct precise questions to listed Local Experts. All bookings are subject to our Refund Policy.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">3. User Obligations</h3>
                <p>
                  Users must provide genuine questions and must not use offensive language, send spam, or ask for private contact numbers. Any expert who leaks personal client details or violates gated society confidentiality will be immediately banned and their accrued wallet earnings forfeited to Atmostellar.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">4. Governing Law & Jurisdiction</h3>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of India. Any legal actions or disputes arising from this platform shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.
                </p>
              </div>
            </div>
          )}

          {/* Active Tab: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Privacy Policy</h2>
                  <p className="text-xs text-slate-400 font-medium">Effective Date: July 14, 2026</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <p>
                  At <strong>Atmostellar</strong> (owner of the unregistered brand <strong>Before Regret</strong>), we value your privacy. This policy documents how we collect, store, and utilize user information for seamless platform delivery.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. Information We Collect</h3>
                <p>
                  We collect names, email addresses, phone numbers, self-declared locality details (for resident verification), and custom questions submitted through our forms. All financial transactions are directly processed via secure, PCI-DSS compliant servers of our payment gateway, Razorpay. We do not store or see your credit card or bank credentials on our servers.
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
          )}

          {/* Active Tab: REFUND & CANCELLATION */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Refund & Cancellation Policy</h2>
                  <p className="text-xs text-slate-400 font-medium">Effective Date: July 14, 2026</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-200/50 rounded-2xl text-indigo-900 text-xs font-semibold leading-relaxed">
                  <strong>Razorpay Compliant Refund Policy:</strong> At Atmostellar, we maintain an absolute consumer-first refund program. Seekers are guaranteed full financial security for their consultancy bookings.
                </div>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. Auto-Refund for Inactivity</h3>
                <p>
                  When you submit a consultation query to a Local Expert, the expert has exactly <strong>48 hours</strong> to respond. If the expert does not accept or answer the inquiry within this window, the transaction is automatically cancelled, and a full 100% refund is initiated immediately.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">2. Seeking Manual Refunds (Quality Claims)</h3>
                <p>
                  If an expert provides an evasive, incomplete, copy-pasted, or demonstrably false answer, you can file a quality claim by emailing <strong>support@beforeregret.com</strong> within 3 days of receiving the response. Our admin board will review the chat logs and, if the expert is found in default, process a 100% refund.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">3. Refund Processing Timelines</h3>
                <p>
                  Once a refund is approved by our administrator or auto-triggered due to timeout:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
                  <li>The amount is credited directly back to your original source payment mechanism (Credit Card, Debit Card, UPI, or NetBanking).</li>
                  <li>The payment gateway processing time generally ranges between <strong>5 to 7 working days</strong> to reflect in your bank account, in accordance with standard bank terms.</li>
                </ul>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">4. Cancellation by Seeker</h3>
                <p>
                  Consultation requests cannot be cancelled by the seeker once the Local Expert has actively accepted the ticket and initiated the answer, as the expert's time is valuable. However, if the query remains unaccepted, you can request immediate cancellation by writing to support.
                </p>
              </div>
            </div>
          )}

          {/* Active Tab: SERVICE FULFILLMENT */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-2xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Service Delivery & Fulfillment Policy</h2>
                  <p className="text-xs text-slate-400 font-medium">Effective Date: July 14, 2026</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
                <div className="p-4 bg-purple-50/50 border border-purple-200/50 rounded-2xl text-purple-900 text-xs font-semibold leading-relaxed">
                  <strong>NO PHYSICAL SHIPPING APPLICABLE:</strong> Since Before Regret is a digital-only software-as-a-service (SaaS) marketplace, physical delivery of goods is not applicable. No logistics, courier fees, or transit guidelines apply to any of the plans listed.
                </div>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. How Services are Delivered</h3>
                <p>
                  Upon successful payment via the Razorpay gateway, your direct consult query is published instantly onto the designated Local Expert's dashboard. All interactions, answers, and documents are shared securely inside our web-based chat room or private dashboard view.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">2. Timelines</h3>
                <p>
                  Service delivery is immediate upon expert response. Standard expert reply times vary but are legally capped at <strong>48 hours</strong>. If they exceed this period, refer to our Refund & Cancellation policy.
                </p>
              </div>
            </div>
          )}

          {/* Active Tab: CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900">Contact Us</h2>
                  <p className="text-xs text-slate-400 font-medium">Get in Touch with Atmostellar Support</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    If you have any questions, transaction queries, payment disputes, or expert onboarding issues, please reach out directly to the corporate parent board. We generally reply within 12-24 business hours.
                  </p>

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Entity Legal Name</div>
                        <div className="text-slate-500 mt-0.5">Atmostellar</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Brand Designation</div>
                        <div className="text-slate-500 mt-0.5">Before Regret (Unregistered Brand)</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Support Email Address</div>
                        <a href="mailto:support@beforeregret.com" className="text-blue-600 hover:underline mt-0.5 block">
                          support@beforeregret.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Registered Mailing Address</div>
                        <div className="text-slate-500 mt-0.5 leading-relaxed">
                          Atmostellar Headquarters,<br />
                          Mumbai, Maharashtra,<br />
                          PIN 400063, India.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Need Help with a Paid Booking?</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    If you are writing regarding an active transaction, please ensure your email includes the following details so we can trace your billing on Razorpay:
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>• Seeker Name & Email Address</li>
                    <li>• Date of transaction</li>
                    <li>• Booking ID or Seeker/Expert Name</li>
                    <li>• Razorpay Payment ID (e.g., pay_xxxxx)</li>
                  </ul>
                  <div className="pt-2 text-[10px] text-amber-600 font-medium bg-amber-50 rounded-xl p-3 border border-amber-100/50 leading-relaxed">
                    Please do not share your bank credentials, PIN numbers, or card CVVs in your email communications. Atmostellar will never ask for password variables.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
