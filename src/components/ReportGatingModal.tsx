import React, { useState } from 'react';
import { 
  Mail, ShieldCheck, CheckCircle2, Lock, CreditCard, Sparkles, 
  AlertCircle, ArrowRight, Loader2, KeyRound, MapPin, Check
} from 'lucide-react';

interface ReportGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAddress: string;
  onConfirmAndGenerate: (userEmail: string, isPaid: boolean) => void;
}

export const ReportGatingModal: React.FC<ReportGatingModalProps> = ({
  isOpen,
  onClose,
  targetAddress,
  onConfirmAndGenerate
}) => {
  const [emailInput, setEmailInput] = useState(() => {
    return localStorage.getItem('beforeregret_user_email') || '';
  });
  const [step, setStep] = useState<'EMAIL_PROMPT' | 'VERIFICATION_SENT' | 'PAYMENT_INTERCEPT' | 'PROCESSING'>('EMAIL_PROMPT');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [simulatedFailure, setSimulatedFailure] = useState(false);

  if (!isOpen) return null;

  // Check if current email has already used free report
  const isEmailVerified = (email: string) => {
    const verifiedEmails: string[] = JSON.parse(localStorage.getItem('beforeregret_verified_emails') || '[]');
    return verifiedEmails.includes(email.toLowerCase().trim());
  };

  const getReportCount = (email: string) => {
    const counts: Record<string, number> = JSON.parse(localStorage.getItem('beforeregret_email_report_counts') || '{}');
    return counts[email.toLowerCase().trim()] || 0;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = emailInput.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Save current email
    localStorage.setItem('beforeregret_user_email', cleanEmail);

    if (isEmailVerified(cleanEmail)) {
      const count = getReportCount(cleanEmail);
      if (count >= 1) {
        // Email already used free report -> go to payment screen
        setStep('PAYMENT_INTERCEPT');
      } else {
        // Verified email, 0 reports used -> generate free
        handleProceedGeneration(cleanEmail, false);
      }
    } else {
      // Unverified email -> send verification email step
      setStep('VERIFICATION_SENT');
    }
  };

  const handleConfirmEmailVerification = () => {
    const cleanEmail = emailInput.toLowerCase().trim();
    // Save to verified list
    const verifiedEmails: string[] = JSON.parse(localStorage.getItem('beforeregret_verified_emails') || '[]');
    if (!verifiedEmails.includes(cleanEmail)) {
      verifiedEmails.push(cleanEmail);
      localStorage.setItem('beforeregret_verified_emails', JSON.stringify(verifiedEmails));
    }

    handleProceedGeneration(cleanEmail, false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (simulatedFailure) {
      setErrorMessage('Payment failed: Card declined by bank. Please verify your billing details or try a different card.');
      return;
    }

    if (!cardNumber || cardNumber.length < 12) {
      setErrorMessage('Please enter a valid credit card number.');
      return;
    }

    setStep('PROCESSING');
    setTimeout(() => {
      const cleanEmail = emailInput.toLowerCase().trim();
      handleProceedGeneration(cleanEmail, true);
    }, 1200);
  };

  const handleProceedGeneration = (email: string, isPaid: boolean) => {
    // Record count
    const counts: Record<string, number> = JSON.parse(localStorage.getItem('beforeregret_email_report_counts') || '{}');
    const currentCount = counts[email] || 0;
    counts[email] = currentCount + 1;
    localStorage.setItem('beforeregret_email_report_counts', JSON.stringify(counts));

    onConfirmAndGenerate(email, isPaid);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-slate-900 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold p-2 cursor-pointer"
        >
          ✕
        </button>

        {/* STEP 1: EMAIL PROMPT */}
        {step === 'EMAIL_PROMPT' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>First Report Free</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Get Your Property Insight Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your email to get your first report free — no credit card required.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold truncate">{targetAddress}</span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center font-normal">
              No credit card required for your first report. Additional reports are $14.99 each.
            </p>
          </form>
        )}

        {/* STEP 2: VERIFICATION LINK SENT */}
        {step === 'VERIFICATION_SENT' && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-slate-900">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We've sent a verification email to <strong className="text-slate-900 font-bold">{emailInput}</strong>.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
                Click the confirmation link in the email to confirm your address and instantly generate your free report.
              </div>
            </div>

            {/* Simulation of one-click email confirmation */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="text-[11px] text-slate-400 font-mono">
                [Testing Simulation Mode]
              </div>

              <button
                type="button"
                onClick={handleConfirmEmailVerification}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Clicking Email Confirmation Link</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT INTERCEPT FOR SUBSEQUENT REPORTS ($14.99) */}
        {step === 'PAYMENT_INTERCEPT' && (
          <form onSubmit={handleProcessPayment} className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Additional Report Purchase</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Generate Additional Property Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You've already claimed your 1 free report for <strong className="text-slate-900">{emailInput}</strong>. Additional reports are $14.99 each — no subscription required.
              </p>
            </div>

            {/* Address Confirmation Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Target Address Being Researched:
              </div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{targetAddress}</span>
              </div>
            </div>

            {/* Price Row */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-900">One-Time Property Report</div>
                <div className="text-[11px] text-blue-700">Full 20+ public dataset synthesis</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">$14.99</div>
                <div className="text-[10px] text-emerald-700 font-bold">No Subscription</div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Card Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="4242 •••• •••• 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVC</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Edge Case Test Toggle */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulatedFailure}
                  onChange={(e) => setSimulatedFailure(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Simulate payment error (test retry handling)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Pay $14.99 & Generate Report</span>
            </button>
          </form>
        )}

        {/* STEP 4: PROCESSING */}
        {step === 'PROCESSING' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-slate-900">Payment Confirmed</h3>
              <p className="text-xs text-slate-600">Starting public record synthesis for target address...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
