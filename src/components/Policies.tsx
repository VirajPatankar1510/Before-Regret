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
          <strong> Before Regret</strong> operated by <strong>Atmostellar</strong>.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Content Pane */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-3xs">
          
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
                <p className="font-medium text-slate-850">
                  Welcome to BeforeRegret, a platform operated by Atmostellar ("Company", "we", "our", or "us").
                </p>
                <p>
                  BeforeRegret is an online marketplace that helps people connect with Local Experts and community members to learn about neighborhoods, residential societies, and local living experiences before renting or buying a home.
                </p>
                <p className="italic font-medium text-amber-700">
                  Please read this disclaimer carefully before using the platform.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">1. Information Shared on BeforeRegret</h3>
                <p>
                  The information available on BeforeRegret is primarily based on personal experiences, opinions, observations, and community discussions shared by individual users and Local Experts.
                </p>
                <p>
                  Experiences may vary from person to person. Information shared by one user may not reflect the experiences of others.
                </p>
                <p>
                  While we encourage honest and accurate contributions and actively moderate content, BeforeRegret does not independently verify every statement, opinion, review, rating, or response published on the platform.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">2. Not Professional Advice</h3>
                <p>
                  BeforeRegret does not provide:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Legal advice</li>
                  <li>Financial or investment advice</li>
                  <li>Property valuation services</li>
                  <li>Real estate brokerage services</li>
                  <li>Engineering or structural advice</li>
                  <li>Architectural advice</li>
                  <li>Tax advice</li>
                  <li>Insurance advice</li>
                  <li>Government certification or verification</li>
                </ul>
                <p>
                  Information available on the platform should be used only as a helpful reference and should not replace independent research or professional consultation.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">3. Your Responsibility</h3>
                <p>
                  Any decision relating to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Renting a property</li>
                  <li>Purchasing a property</li>
                  <li>Paying token amounts</li>
                  <li>Entering into lease agreements</li>
                  <li>Investing in real estate</li>
                  <li>Choosing a neighborhood</li>
                </ul>
                <p className="font-semibold text-slate-800">
                  is entirely your own decision.
                </p>
                <p>
                  Users are responsible for independently verifying all important information before making financial or legal commitments.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">4. Local Experts</h3>
                <p>
                  Local Experts are independent users of the platform.
                </p>
                <p>
                  Their responses represent their personal knowledge, opinions and experiences.
                </p>
                <p>
                  They are not employees, representatives, agents or partners of BeforeRegret or Atmostellar unless expressly stated.
                </p>
                <p>
                  BeforeRegret does not guarantee that any Local Expert possesses specific qualifications, certifications or professional expertise.
                </p>
                <p>
                  Local Experts are strictly prohibited from representing commercial real estate interests, builder entities, or brokerage firms while interacting with buyers on the platform. BeforeRegret assumes no liability for any conflict of interest, misrepresentation, or collusion by a Local Expert.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">5. User Generated Content</h3>
                <p>
                  Reviews, questions, answers, ratings, comments, polls and discussions published on BeforeRegret are user-generated content.
                </p>
                <p>
                  The opinions expressed belong solely to their respective authors.
                </p>
                <p>
                  BeforeRegret does not endorse every opinion shared by users.
                </p>
                <p>
                  If you believe any content is inaccurate, unlawful, defamatory or violates your rights, please contact us through our content reporting process. We will review reports in accordance with our policies.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">6. Payments</h3>
                <p>
                  Payments made through BeforeRegret are processed using secure third-party payment providers.
                </p>
                <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                  Payments made through BeforeRegret are securely processed via secured third-party payment gateways. The Company acts strictly as a facilitating marketplace engine. Funds are split programmatically between the platform and the Local Expert only upon successful delivery of the service. Automated reversals or cancellations due to non-response by a Local Expert within the designated platform window are subject to standard banking and gateway settlement timelines. We hold no liability for minor gateway processing latencies.
                </p>
                <p>
                  Refunds, cancellations and payment disputes are governed by our Refund & Cancellation Policy.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">7. Limitation of Liability</h3>
                <p>
                  To the fullest extent permitted under applicable law, BeforeRegret and Atmostellar shall not be liable for any direct, indirect, incidental, special or consequential loss arising from:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Reliance on information shared by users or Local Experts</li>
                  <li>Property purchases or rental decisions</li>
                  <li>Financial losses</li>
                  <li>Builder disputes</li>
                  <li>Society disputes</li>
                  <li>Maintenance issues</li>
                  <li>Neighborhood conditions</li>
                  <li>Changes in infrastructure</li>
                  <li>Government policies</li>
                  <li>Discrepancies in water tanker reliance, groundwater quality, or municipal water frequency.</li>
                  <li>Unannounced power outages or failure of society backup generators.</li>
                  <li>Monsoonal flooding, localized waterlogging, or public transit bottlenecks.</li>
                  <li>Arbitrary resident welfare association (RWA) rules, tenant restrictions, or maintenance fee hikes.</li>
                  <li>Delays, interruptions or inaccuracies in user-generated content</li>
                </ul>
                <p className="font-medium text-slate-800">
                  Your use of the platform is entirely at your own discretion and risk.
                </p>
                <p>
                  Nothing in this Disclaimer limits liability where such limitation is prohibited by applicable law.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">8. Platform Improvements</h3>
                <p>
                  We continuously improve BeforeRegret by updating information, moderating content, improving safety measures and enhancing user experience.
                </p>
                <p>
                  However, we cannot guarantee that every page or discussion will always contain complete, current or error-free information.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">9. Intellectual Property</h3>
                <p>
                  All platform design, branding, software, graphics and original content created by BeforeRegret remain the intellectual property of Atmostellar unless otherwise stated.
                </p>
                <p>
                  User-generated content remains subject to the rights granted under our Terms & Conditions.
                </p>

                <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">10. Contact Us</h3>
                <p>
                  If you have questions about this Disclaimer or wish to report content, please contact us through our official support channels.
                </p>

                <div className="border-t border-slate-100 pt-6 mt-8">
                  <h4 className="text-sm font-bold text-slate-950 uppercase tracking-tight">About BeforeRegret</h4>
                  <p className="mt-2 text-slate-600">
                    BeforeRegret is a brand owned and operated by Atmostellar.
                  </p>
                  <p className="text-slate-600 mt-1">
                    Our mission is to help people make better housing decisions by learning from the experiences of others before renting or buying a home.
                  </p>
                </div>
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
                  Welcome to Before Regret, a digital technology marketplace operated by <strong>Atmostellar</strong> ("Company", "We", "Us"). These Terms govern your access to the Before Regret platform, including its Wiki, community-contributed cautionary files, peer-to-peer expert matching solutions, and booking mechanisms.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">1. Platform Nature & Intermediary Role</h3>
                <p>
                  Before Regret is strictly an online venue connecting home-seekers with independent active residents of gated societies. Atmostellar facilitates payments via secure authorized gateways but is not a party to the transactions, conversations, or advice shared. Atmostellar does not verify the credentials, legal status, or accuracy of any "Local Expert" or reviewer.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">2. Decisional Disclaimer & Decisional Autonomy</h3>
                <p className="font-semibold text-slate-800">
                  Users agree that Before Regret does not provide commercial real estate advisory services, legal advisory, financial, architectural, or civil engineering consultancy. The platform acts as a community-sourced reference board to aid preliminary neighborhood screening. Any and all real estate investments, token money transfers, lease agreements, or commitments are done at the user's sole financial risk. You must obtain independent professional advice.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">3. Paid Peer-to-Peer Consultation Packages</h3>
                <p>
                  Seekers may purchase consulting credits ("Quick Consultation" ₹99, "Comprehensive Bundle" ₹199, or "Live Chat" ₹299) to send direct inquiries to listed independent resident consultants. All booking fees are held securely and dispersed in accordance with our Refund and Cancellation Policy. Atmostellar is not liable for delayed, incomplete, or highly opinionated responses.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">4. Code of Conduct & Resident Confidentiality</h3>
                <p>
                  Local experts and users must communicate in a professional, courteous manner. Experts are strictly prohibited from sharing confidential builder agreements, internal managing committee documents, private resident phone numbers, or structural designs that violate the security or bylaws of their residential societies. Any such breach will result in instant deletion of accounts and forfeiture of pending wallet balances.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">5. Exclusion of Warranty & Limitation of Liability</h3>
                <p>
                  We provide this platform on an "As-Is" and "As-Available" basis without warranties of any kind, express or implied. Under no legal theory (contract, tort, strict liability, or otherwise) shall Atmostellar be responsible for any losses, transaction failures, incorrect reviews, property depreciations, builder legal issues, RWA disputes, or financial damages suffered by users of Before Regret.
                </p>

                <h3 className="font-bold text-slate-900 mt-4 text-sm uppercase">6. Governing Law, Dispute Resolution & Jurisdiction</h3>
                <p>
                  These Terms shall be governed, construed, and enforced exclusively in accordance with the laws of India, without regard to conflict of law principles. Any dispute, claim, or controversy arising out of or relating to these Terms, including its validity or termination, shall be resolved through binding individual arbitration under the <strong>Arbitration and Conciliation Act, 1996</strong> in Mumbai, India. The arbitration proceedings shall be conducted in English by a sole arbitrator appointed by Atmostellar. Subject to arbitration, users submit to the exclusive jurisdiction of courts located in <strong>Mumbai, Maharashtra, India</strong>.
                </p>
                <p className="font-bold text-slate-800 underline">
                  CLASS ACTION WAIVER: TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
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
                  <strong>Refund Policy:</strong> At Atmostellar, we maintain an absolute consumer-first refund program. Seekers are guaranteed full financial security for their consultancy bookings.
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
                  Upon successful payment, your direct consult query is published instantly onto the designated Local Expert's dashboard. All interactions, answers, and documents are shared securely inside our web-based chat room or private dashboard view.
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
                        <div className="text-slate-500 mt-0.5">Before Regret</div>
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
                          Atmostellar,<br />
                          Mumbai, Maharashtra,<br />
                          PIN 401203, India.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Need Help with a Paid Booking?</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    If you are writing regarding an active transaction, please ensure your email includes the following details so we can trace your billing:
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>• Seeker Name & Email Address</li>
                    <li>• Date of transaction</li>
                    <li>• Booking ID or Seeker/Expert Name</li>
                    <li>• Payment ID (e.g., pay_xxxxx)</li>
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
