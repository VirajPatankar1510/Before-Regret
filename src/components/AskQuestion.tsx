import React, { useState } from 'react';
import { ExpertProfile, Neighborhood } from '../types';
import { pricingPlans } from '../data';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, CreditCard, Lock, Eye, AlertCircle, RefreshCw } from 'lucide-react';

interface AskQuestionProps {
  expert: ExpertProfile;
  locality: Neighborhood;
  selectedPackageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT';
  onBack: () => void;
  onSubmitQuestion: (queryText: string, packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT', bookedSlot?: string) => void;
}

export const AskQuestion: React.FC<AskQuestionProps> = ({
  expert,
  locality,
  selectedPackageId,
  onBack,
  onSubmitQuestion,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(2); // Start at step 2 since they chose package in profile, but allow toggle
  const [packageId, setPackageId] = useState<'QUICK' | 'BUNDLE' | 'LIVE_CHAT'>(selectedPackageId);
  const [queryText, setQueryText] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>(
    expert.availableSlots && expert.availableSlots.length > 0 ? expert.availableSlots[0] : 'Today, 05:00 PM - 05:30 PM'
  );
  const [error, setError] = useState('');
  
  // Razorpay simulation state
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayStep, setRazorpayStep] = useState<'details' | 'otp' | 'success'>('details');
  const [cardNumber, setCardNumber] = useState('4532 7150 2000 8952');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activePlan = pricingPlans.find((p) => p.id === packageId) || pricingPlans[0];

  const handleNextToPayment = () => {
    if (queryText.trim().length < 20) {
      setError('Please describe your query in at least 20 characters so the resident can provide a complete answer.');
      return;
    }
    setError('');
    setStep(3);
  };

  const startRazorpayPayment = () => {
    setShowRazorpay(true);
    setRazorpayStep('details');
  };

  const handleProcessRazorpayDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRazorpayStep('otp');
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRazorpayStep('success');
      setTimeout(() => {
        setShowRazorpay(false);
        onSubmitQuestion(queryText, packageId, packageId === 'LIVE_CHAT' ? selectedSlot : undefined);
      }, 1500);
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans relative">
      
      {/* Wizard Header Progress */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">
          Consult {expert.fullName}
        </h1>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">
          Escrow-backed direct neighbor advice
        </p>

        {/* Step Indicator Bullets */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div 
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">1</span>
            <span>Choose Package</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <div 
            onClick={() => { if (step > 1) setStep(2); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
            <span>Write Question</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">3</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHOOSE PACKAGE */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Step 1: Choose Your Consultation Option</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setPackageId(plan.id)}
                className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                  packageId === plan.id
                    ? 'border-blue-600 bg-blue-50/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${plan.badgeStyle}`}>
                    {plan.badge}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mt-3">{plan.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{plan.description}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-900 font-mono">Rs. {plan.price}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{plan.pricePeriod}</span>
                  </div>
                  <button className={`w-full mt-4 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl text-center border transition-all ${
                    packageId === plan.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    {packageId === plan.id ? 'Selected Option' : 'Select Option'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-slate-100">
            <button
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Write Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WRITE QUESTION */}
      {step === 2 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Describe what you want to verify</h2>
              <p className="text-xs text-slate-500 mt-0.5">Please be specific. Your questions are protected by escrow.</p>
            </div>
            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
              {activePlan.title} (Rs. {activePlan.price})
            </span>
          </div>

          {packageId === 'LIVE_CHAT' && (
            <div className="mb-6 p-4 bg-orange-50/40 border border-orange-100 rounded-xl">
              <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-2.5 font-sans">
                📅 Select Your Preferred 30-Minute Time Slot:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(expert.availableSlots && expert.availableSlots.length > 0
                  ? expert.availableSlots
                  : [
                      'Today, 04:30 PM - 05:00 PM',
                      'Today, 06:00 PM - 06:30 PM',
                      'Tomorrow, 11:00 AM - 11:30 AM',
                      'Tomorrow, 03:00 PM - 03:30 PM'
                    ]
                ).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 text-xs font-bold font-mono rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                      selectedSlot === slot
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
                    }`}
                  >
                    <span>{slot}</span>
                    {selectedSlot === slot && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-sans">Selected</span>}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-orange-700/80 mt-2 font-sans font-medium">
                * The resident will receive an instant notification and will join the live chat room at this exact chosen hour.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {packageId === 'LIVE_CHAT' ? 'Topics or questions you want to discuss live:' : `Your inquiry message to ${expert.fullName}:`}
            </label>
            <textarea
              rows={6}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={packageId === 'LIVE_CHAT' 
                ? "Enter the topics or questions you would like to discuss during the 30-minute live chat (e.g. water leakage, parking policies, safety at night)..."
                : "Example placeholder:\nI'm moving here with my family.\nHow safe is this area after dark? How are the schools?\nAnything I should know about the water pressure, power cut histories, or society bachelor rules before buying?"}
              className="w-full p-4 text-xs sm:text-sm border-2 border-slate-200 focus:border-blue-600 rounded-xl outline-hidden leading-relaxed text-slate-800 placeholder-slate-400 font-medium font-sans"
            />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextToPayment}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SECURE CHECKOUT */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Step 3: Secure Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Consultation Fee ({activePlan.title})</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Assigned to Local Resident: {expert.fullName}</p>
                  </div>
                  <span className="font-black text-slate-800 font-mono">Rs. {activePlan.price}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Service Charge & Escrow Protection</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dual Escrow hold management</p>
                  </div>
                  <span className="font-bold text-emerald-600 font-mono text-xs">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <h3 className="font-black text-slate-900 text-base">Total Payable Amount</h3>
                  <span className="font-black text-slate-900 font-mono text-lg">Rs. {activePlan.price}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-xs sm:text-sm">Before Regret Refund Guarantee</h4>
                <p className="text-[11px] sm:text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  Your funds are secured until {expert.fullName} responds. If they do not answer within the standard SLA time or if the reply does not address your queries, dispute the response within 48 hours for a direct 100% refund.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Checkout CTA card */}
          <div className="md:col-span-1">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Payment Gateway</p>
              <h3 className="font-bold text-slate-800 mt-2 text-sm">Instant Checkout</h3>
              <p className="text-xs text-slate-500 mt-1">Pay via Razorpay UPI, Cards, Netbanking</p>
              
              <div className="my-6 border-t border-b border-slate-100 py-4">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Amount due</span>
                <span className="text-2xl font-black text-slate-900 font-mono">Rs. {activePlan.price}</span>
              </div>

              <button
                onClick={startRazorpayPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via Razorpay</span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold font-mono">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>256-bit AES Encryption</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
            >
              Modify Question Text
            </button>
          </div>
        </div>
      )}

      {/* RAZORPAY PAYMENT GATEWAY DIALOG OVERLAY */}
      {showRazorpay && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm border border-slate-100 shadow-2xl animate-scaleUp font-sans">
            
            {/* Razorpay Brand Header */}
            <div className="bg-[#183B56] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-1 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-white animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest font-mono">Razorpay SECURE</h3>
                  <p className="text-[9px] text-blue-200 font-medium">Powering Before Regret payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-400 uppercase tracking-widest">Payable</p>
                <p className="font-mono text-sm font-black text-white">₹{activePlan.price}.00</p>
              </div>
            </div>

            {/* Merchant Identity Panel */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Merchant: Before Regret</span>
              <span>Inquiry with: {expert.fullName}</span>
            </div>

            {/* Step Content */}
            <div className="p-5">
              
              {/* DETAILS ENTRY FORM */}
              {razorpayStep === 'details' && (
                <form onSubmit={handleProcessRazorpayDetails} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      defaultValue="Rohan Deshmukh"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 font-mono text-slate-700"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 font-mono text-slate-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        required
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={3}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 font-mono text-slate-700 text-center"
                      />
                    </div>
                  </div>

                  {/* Submit card details */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow-xs"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Card...</span>
                      </>
                    ) : (
                      <span>Proceed to Pay ₹{activePlan.price}.00</span>
                    )}
                  </button>
                </form>
              )}

              {/* OTP CHALLENGE FORM */}
              {razorpayStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 py-3 text-center">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50 inline-block">
                    <Lock className="w-5 h-5 text-blue-600 mx-auto" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Enter Secure OTP</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    We sent a secure 6-digit verification code to the registered mobile number ending with 8952.
                  </p>

                  <div className="max-w-xs mx-auto">
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-Digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full px-3 py-2.5 text-center text-sm tracking-widest border-2 border-slate-200 rounded-lg outline-hidden focus:border-blue-600 font-black font-mono text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-4"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Authorizing payment...</span>
                      </>
                    ) : (
                      <span>Confirm & Authenticate OTP</span>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 font-medium">
                    Didn't receive code? <span className="text-blue-600 font-bold hover:underline cursor-pointer">Resend OTP</span>
                  </p>
                </form>
              )}

              {/* SUCCESS PANEL */}
              {razorpayStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto text-xl animate-bounce">
                    ✓
                  </div>
                  <h4 className="font-black text-emerald-600 text-base">Payment Successful!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Transaction authorized and settled safely via Razorpay Escrow engine. Redirecting you...
                  </p>
                </div>
              )}

            </div>

            {/* Secure Badges */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-center items-center gap-3.5 text-[9px] text-slate-400 font-mono">
              <span className="flex items-center gap-0.5">✓ PCI-DSS Compliant</span>
              <span className="flex items-center gap-0.5">✓ 100% Secure Checkout</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
