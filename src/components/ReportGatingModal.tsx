import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, Lock, CreditCard, Sparkles,
  AlertCircle, ArrowRight, Loader2, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentProcessor } from './PaymentProcessor';

interface ReportGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAddress: string;
  onConfirmAndGenerate: (userEmail: string, isPaid: boolean) => void;
}

// Internal testing account -- always gets the free-claim step regardless of report count, so
// whoever's verifying report generation end-to-end doesn't hit the $14.99 paywall on every
// second attempt. Deliberately a single real, Clerk-authenticated email rather than a
// separate demo/mock login path -- there's no way to reach this state without actually signing
// in through Clerk first.
const UNLIMITED_ACCESS_EMAIL = 'hello@beforeregret.com';

export const ReportGatingModal: React.FC<ReportGatingModalProps> = ({
  isOpen,
  onClose,
  targetAddress,
  onConfirmAndGenerate
}) => {
  const { user, triggerClerkSignIn } = useAuth();

  const [step, setStep] = useState<'AUTH_REQUIRED' | 'CLAIM_FREE' | 'PAYMENT_INTERCEPT' | 'PROCESSING' | 'PAYMENT'>('CLAIM_FREE');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync step based on authentication status and report quota
  useEffect(() => {
    if (!user) {
      setStep('AUTH_REQUIRED');
      return;
    }
    const activeEmail = user.email || `${user.uid}@beforeregret.com`;
    if (activeEmail.toLowerCase().trim() === UNLIMITED_ACCESS_EMAIL) {
      setStep('CLAIM_FREE');
      return;
    }
    const count = getReportCount(activeEmail);
    if (count >= 1) {
      setStep('PAYMENT_INTERCEPT');
    } else {
      setStep('CLAIM_FREE');
    }
  }, [user]);

  if (!isOpen) return null;

  function getReportCount(email: string) {
    const counts: Record<string, number> = JSON.parse(localStorage.getItem('beforeregret_email_report_counts') || '{}');
    return counts[email.toLowerCase().trim()] || 0;
  }

  const handleClaimFreeReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStep('AUTH_REQUIRED');
      return;
    }
    const activeEmail = user.email || `${user.uid}@beforeregret.com`;
    handleProceedGeneration(activeEmail, false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStep('PAYMENT');
  };

  const handlePaymentSuccess = (result: any) => {
    setStep('PROCESSING');
    setTimeout(() => {
      const activeEmail = user?.email || `${user?.uid}@beforeregret.com`;
      handleProceedGeneration(activeEmail, true);
    }, 1200);
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    setStep('PAYMENT_INTERCEPT');
  };

  const handleProceedGeneration = (email: string, isPaid: boolean) => {
    const counts: Record<string, number> = JSON.parse(localStorage.getItem('beforeregret_email_report_counts') || '{}');
    const currentCount = counts[email.toLowerCase()] || 0;
    counts[email.toLowerCase()] = currentCount + 1;
    localStorage.setItem('beforeregret_email_report_counts', JSON.stringify(counts));

    onConfirmAndGenerate(email, isPaid);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-slate-900 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold p-2 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>

        {/* STEP A: MANDATORY AUTH PROMPT (WHEN NOT LOGGED IN) */}
        {!user && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold border border-blue-100">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign-In Required</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Sign In to Unlock Property Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Sign in to generate and save your report. No manual email typing required.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold truncate">{targetAddress}</span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => triggerClerkSignIn()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-blue-200" />
                <span>Sign In / Sign Up</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-mono">
              Your first report is 100% free after signing in.
            </p>
          </div>
        )}

        {/* STEP B: CLAIM FREE REPORT (WHEN LOGGED IN AND 0 REPORTS USED) */}
        {user && step === 'CLAIM_FREE' && (
          <form onSubmit={handleClaimFreeReport} className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>First Report Free</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Get Your Property Insight Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your account is verified. Click below to generate your report immediately — no email typing or credit card needed.
              </p>
            </div>

            {/* Target Address Display */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold truncate">{targetAddress}</span>
            </div>

            {/* Verified Account Banner */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    {user.email || user.displayName || 'Authenticated User'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Verified Account
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                1 FREE CLAIM
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Claim Free Property Report</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center font-normal">
              No credit card required for your first report. Additional reports are $14.99 each.
            </p>
          </form>
        )}

        {/* STEP C: PAYMENT INTERCEPT FOR SUBSEQUENT REPORTS ($14.99) */}
        {user && step === 'PAYMENT_INTERCEPT' && (
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
                You've already claimed your 1 free report for <strong className="text-slate-900">{user.email || user.displayName}</strong>. Additional reports are $14.99 each.
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

            <div className="py-2">
              <div className="text-xs text-slate-600 text-center mb-3 font-medium">
                Secure Payment Processing
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to PayPal</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP C2: PAYPAL PAYMENT */}
        {user && step === 'PAYMENT' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono font-bold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Secure Payment</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Complete Your Payment
              </h3>
            </div>

            <PaymentProcessor
              amount={14.99}
              currency="USD"
              type="report"
              description={`Property Report for ${targetAddress}`}
              propertyAddress={targetAddress}
              userEmail={user.email || `${user.uid}@beforeregret.com`}
              userId={user.uid}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onClose={() => setStep('PAYMENT_INTERCEPT')}
            />
          </div>
        )}

        {/* STEP D: PROCESSING SPINNER */}
        {step === 'PROCESSING' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <h4 className="font-serif text-lg font-bold text-slate-900">
              Processing Payment &amp; Assembling Report...
            </h4>
            <p className="text-xs text-slate-500">
              Connecting with Travis County Tax Assessor &amp; Municipal APIs.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
