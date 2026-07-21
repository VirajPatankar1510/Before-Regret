import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, Check, Send, FileText, Shield, MapPin } from 'lucide-react';

interface ContactUsProps {
  onBackToHome: () => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onBackToHome }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setIsSubmitting(true);
    
    // Simulate API call and then trigger mailto client-side
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      const subject = `Contact Message from ${contactName}`;
      const body = `Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`;
      
      // Open standard mailto link
      window.location.href = `mailto:support@beforeregret.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Reset form after a small delay
      setTimeout(() => {
        setContactName('');
        setContactEmail('');
        setContactMessage('');
        setSubmitSuccess(false);
      }, 5000);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 font-sans">
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
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">Contact Us</h1>
              <p className="text-xs text-slate-400 font-medium">Get in Touch with Atmostellar Support</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            {/* Left side: Contact form */}
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Send us a Message</h3>
                <p className="text-xs text-slate-400 mt-1">Fill out the form below to initiate an email to our support board.</p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Email Address
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="contactMessage" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Message
                  </label>
                  <textarea
                    id="contactMessage"
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs animate-none"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Preparing email client...</span>
                    </>
                  ) : submitSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Email Client Opened!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>

                {submitSuccess && (
                  <p className="text-[11px] text-emerald-600 text-center font-semibold bg-emerald-50 rounded-xl p-3 border border-emerald-100/50 animate-none">
                    If your email client didn't launch automatically, please copy your message and mail it directly to support@beforeregret.com
                  </p>
                )}
              </form>
            </div>

            {/* Right side: Contact Information & Billing Guidelines */}
            <div className="lg:col-span-5 space-y-6">
              {/* Corporate Block */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  We generally reply within 12-24 business hours to all registered queries.
                </p>

                <div className="space-y-3.5">


                  <div className="flex items-start gap-3 text-xs">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Support Email Address</div>
                      <a href="mailto:support@beforeregret.com" className="text-blue-600 hover:underline mt-0.5 block font-semibold">
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

              {/* Billing Instructions Card */}
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
        </div>
      </div>
    </div>
  );
};
