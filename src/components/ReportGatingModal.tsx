import React, { useState, useEffect } from 'react';
import { 
  Mail, ShieldCheck, CheckCircle2, Lock, CreditCard, Sparkles, 
  AlertCircle, ArrowRight, Loader2, KeyRound, MapPin, Check, UserCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, isClerkActive, triggerClerkSignIn, loginWithMockUser, setActiveRole } = useAuth();

  const [step, setStep] = useState<'AUTH_REQUIRED' | 'CLAIM_FREE' | 'PAYMENT_INTERCEPT' | 'PROCESSING'>('CLAIM_FREE');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [simulatedFailure, setSimulatedFailure] = useState(false);
  const [isBypassing, setIsBypassing] = useState(false);

  // Sync step based on authentication status and report quota
  useEffect(() => {
    if (!user) {
      setStep('AUTH_REQUIRED');
    } else if (user.uid.startsWith('demo_') || user.uid.startsWith('mock_')) {
      // Demo/mock sessions always use the same fixed email (buyer.demo@beforeregret.com), so the
      // per-email free-report cap below would otherwise hit the simulated $14.99 card form on the
      // second and every later click -- defeating the entire point of a button whose job is
      // letting someone test the flow repeatedly. Demo sessions skip the paywall entirely instead.
      setStep('CLAIM_FREE');
    } else {
      const activeEmail = user.email || `${user.uid}@beforeregret.com`;
      const count = getReportCount(activeEmail);
      if (count >= 1) {
        setStep('PAYMENT_INTERCEPT');
      } else {
        setStep('CLAIM_FREE');
      }
    }
  }, [user]);

  if (!isOpen) return null;

  function getReportCount(email: string) {
    const counts: Record<string, number> = JSON.parse(localStorage.getItem('beforeregret_email_report_counts') || '{}');
    return counts[email.toLowerCase().trim()] || 0;
  }

  const handleDemoBypass = async () => {
    setIsBypassing(true);
    try {
      const mockUid = `demo_user_${Date.now()}`;
      await loginWithMockUser({
        uid: mockUid,
        displayName: 'Demo Homebuyer',
        email: 'buyer.demo@beforeregret.com',
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BuyerSeed'
      });
      setActiveRole('buyer');
      setIsBypassing(false);
    } catch (err) {
      console.error(err);
      setIsBypassing(false);
    }
  };

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
      const activeEmail = user?.email || `${user?.uid}@beforeregret.com`;
      handleProceedGeneration(activeEmail, true);
    }, 1200);
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
                <span>Clerk Authentication Mandatory</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Sign In to Unlock Property Report
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Authentication through Clerk is required to generate and save your report. No manual email typing required.
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
                <span>Sign In / Sign Up with Clerk</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold">OR TESTING BYPASS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoBypass}
                disabled={isBypassing}
                className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>{isBypassing ? 'Initializing Demo Session...' : 'Instant Demo Bypass (Testing Mode)'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-mono">
              Your first report is 100% free upon Clerk authentication.
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
                    {user.uid.startsWith('demo_') || user.uid.startsWith('mock_') ? 'Verified Demo Account' : 'Verified Clerk Account'}
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
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span>Simulate Card Decline</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay $14.99 &amp; Generate Report</span>
            </button>
          </form>
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
