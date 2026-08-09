import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, Clock, Building2, MapPin, Search, FileSpreadsheet } from 'lucide-react';

interface ContactUsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onBackToHome, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'consumer' | 'vendor' | 'error_flag'>('consumer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [addressOrZip, setAddressOrZip] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      const emailSubject = `[BeforeRegret ${activeTab.toUpperCase()}] ${subject || 'Inquiry'}`;
      const emailBody = `Sender Name: ${name}
Sender Email: ${email}
Category: ${activeTab === 'consumer' ? 'Free Consumer Report Question' : activeTab === 'vendor' ? 'Vendor Subscription & Billing' : 'Report Data Discrepancy Flag'}
${addressOrZip ? `Property Address / Zip Code: ${addressOrZip}\n` : ''}
Message:
${message}`;

      window.location.href = `mailto:hello@beforeregret.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/');
              else onBackToHome();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Property Search</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Operating Entity: <strong>Atmostellar</strong></span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-4 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Expert property research guides and vendor marketplace for US home buyers. Uncover what matters before closing.
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              How Can We Help You?
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Before Regret is a property research product owned and operated by Atmostellar. Whether you are a home buyer inquiring about a report or a business vendor managing a sponsored placement, we are here to assist.
            </p>
          </div>
          
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Contact Channel: <strong>hello@beforeregret.com</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Expected Response Time: <strong>1–2 business days</strong></span>
            </div>
          </div>
        </div>

        {/* Contact Path Selector & Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Send an Inquiry</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your category below so your inquiry routes logically to the right support queue.
              </p>
            </div>

            {/* Path Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setActiveTab('consumer'); setIsSubmitted(false); }}
                className={`py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'consumer'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Consumer Inquiry
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('vendor'); setIsSubmitted(false); }}
                className={`py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'vendor'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vendor Billing
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('error_flag'); setIsSubmitted(false); }}
                className={`py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'error_flag'
                    ? 'bg-white text-amber-800 shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Data Discrepancy
              </button>
            </div>

            {/* Path Explanatory Note */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 leading-relaxed">
              {activeTab === 'consumer' && (
                <p>
                  <strong>Consumer Report Support:</strong> For property buyers or renters with questions regarding your free or purchased property reports, data coverage, or understanding public dataset indicators.
                </p>
              )}
              {activeTab === 'vendor' && (
                <p>
                  <strong>Business Vendor Support:</strong> For contractors, inspectors, structural engineers, or trade specialists with questions about sponsored placements, zip code availability, or billing.
                </p>
              )}
              {activeTab === 'error_flag' && (
                <p>
                  <strong>Data Discrepancy Flag:</strong> Found a discrepancy between a BeforeRegret report and an official government record? Report it here for rapid audit and correction by our data team.
                </p>
              )}
            </div>

            {isSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-950 text-base">Inquiry Dispatched</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your email client has been opened with your pre-formatted message addressed to <strong>hello@beforeregret.com</strong>. Our team will review your message and reply within 1–2 business days.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sarah Jenkins"
                      className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., sarah@example.com"
                      className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      activeTab === 'vendor'
                        ? 'e.g., Change placement zip codes or billing'
                        : activeTab === 'error_flag'
                        ? 'e.g., Flood zone classification correction for ZIP 78701'
                        : 'e.g., Question about Austin TX property report sources'
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Property Address or ZIP Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressOrZip}
                    onChange={(e) => setAddressOrZip(e.target.value)}
                    placeholder="e.g., 1204 Oakridge Dr, Austin, TX 78701"
                    className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      activeTab === 'error_flag'
                        ? 'Please specify the exact data point, the address/zip, and provide a link or reference to the official source showing the correct record.'
                        : 'Describe your question or inquiry in detail...'
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 outline-none font-medium resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Preparing Email...' : 'Send Message to hello@beforeregret.com'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Info Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Contact Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Contact & Entity Details</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block font-medium">Product Brand:</span>
                  <span className="font-bold text-slate-900">Before Regret</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Operating Legal Entity:</span>
                  <span className="font-bold text-slate-900">Atmostellar</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Support Email:</span>
                  <a href="mailto:hello@beforeregret.com" className="font-bold text-blue-600 hover:underline">
                    hello@beforeregret.com
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Registered Business Location:</span>
                  <p className="font-medium text-slate-800">
                    Atmostellar<br />
                    Mumbai, Maharashtra, India
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Operational Support Hours:</span>
                  <span className="font-medium text-slate-800">Monday – Friday (10:00 AM – 6:00 PM IST)</span>
                </div>
              </div>
            </div>

            {/* Informational Disclaimer Box */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Informational Research Disclaimer</span>
              </div>
              <p className="leading-relaxed">
                BeforeRegret property research reports are compiled strictly for preliminary informational research purposes. Reports are not physical home inspections, engineering assessments, legal title reviews, or financial valuations. All findings must be independently confirmed with licensed professionals before making property purchase or leasing decisions.
              </p>
            </div>

          </div>

        </div>

        {/* Frequently Asked Questions (FAQ) Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Frequently Asked Support Questions</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quick answers to common questions about report data, vendor listings, and placement terms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FAQ 1 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                Is the report accurate or guaranteed?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                BeforeRegret reports assemble public data from official sources including FEMA, USGS, FCC, and municipal open data archives. Reports are provided on an <strong>"as-is"</strong> basis for preliminary research only. We do not warrant complete accuracy or real-time completeness, and reports are <strong>not guaranteed</strong> or a substitute for a licensed professional home inspection or engineering evaluation.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                How do I stop seeing ads for a specific business?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Local business listings appearing in "Need help verifying this?" sections are clearly labeled as <strong>"Sponsored"</strong> placements. If you believe a sponsored vendor listing violates our editorial standards, contains inaccurate credential claims, or is inappropriate, please email <strong>hello@beforeregret.com</strong> with details and our compliance team will review the listing.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                How do I remove my vendor placement early?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Topic Ad and Report Ad placements are one-time purchases for a fixed 30-day window, not a subscription -- there's nothing to cancel because nothing renews automatically. If you'd like an active placement removed before it expires, email <strong>hello@beforeregret.com</strong> and we'll remove it right away. All payments are final -- no refunds are issued for any unused portion of the 30-day window.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                How do I report incorrect information in a report?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you identify a data error or discrepancy between a BeforeRegret report and an official municipal archive or GIS layer, select the <strong>"Data Discrepancy"</strong> tab above or email <strong>hello@beforeregret.com</strong>. Include the property address/zip code, the specific data field in question, and a link or citation to the official record. Our audit team reviews and corrects confirmed errors within 1–2 business days.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
