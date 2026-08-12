import React, { useState } from 'react';
import { ShieldCheck, PhoneCall, CheckCircle2, Lock, Unlock, AlertCircle, ArrowRight, Smartphone, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { LeadWidget, MaskedLeadAsset } from '../types';

interface LeadMarketplaceWidgetProps {
  widget: LeadWidget;
}

export const LeadMarketplaceWidget: React.FC<LeadMarketplaceWidgetProps> = ({ widget }) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [timeline, setTimeline] = useState('Under Contract');
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'SUCCESS'>('INPUT');
  const [otpCode, setOtpCode] = useState('');
  const [createdLead, setCreatedLead] = useState<MaskedLeadAsset | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);

  const vendorNames = widget.vendors.map(v => v.name).join(' or ');

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    setStep('OTP');
  };

  const handleVerifyOtp = () => {
    const maskedN = fullName ? `${fullName.charAt(0)}*** ${fullName.split(' ')[1] ? fullName.split(' ')[1].charAt(0) + '***' : ''}` : 'J*** D***';
    const maskedP = phone.length > 6 ? `(${phone.slice(0,3)}) ***-${phone.slice(-4)}` : '(512) ***-4829';

    const newLeadAsset: MaskedLeadAsset = {
      leadId: `lead_${Date.now()}`,
      zipCode: widget.zipCode || '78701',
      propertyEra: widget.propertyEra || '1984 Build',
      identifiedGap: widget.identifiedGap,
      tradeCategory: widget.tradeCategory,
      timeline,
      smsVerificationStatus: 'OTP Verified',
      unlockFee: 35,
      maskedName: maskedN,
      maskedPhone: maskedP,
      maskedAddress: `${widget.zipCode} ZIP Area, Travis County`,
      unmaskedDetails: {
        fullName,
        phone,
        address: `123 Target St, ${widget.zipCode}`,
        email: 'client@example.com',
        notes: `Requested quote for ${widget.identifiedGap}. Timeline: ${timeline}.`
      }
    };

    setCreatedLead(newLeadAsset);
    setStep('SUCCESS');
  };

  const handleSimulateStripeUnlock = () => {
    setIsProcessingUnlock(true);
    setTimeout(() => {
      setIsUnlocked(true);
      setIsProcessingUnlock(false);
    }, 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white space-y-4 my-3 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Local Service Verification Trigger ({widget.tradeCategory})</span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
          NEEDS VERIFICATION
        </span>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-white">{widget.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          <strong className="text-slate-100">Identified Record Gap:</strong> {widget.identifiedGap}
        </p>
      </div>

      {/* Dynamic Local Vendor Badges */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-2">
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          Matched Local {widget.tradeCategory} Pros in {widget.zipCode}:
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {widget.vendors.map((vendor, vIdx) => (
            <div key={vIdx} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{vendor.name}</span>
              <span className="text-amber-400 font-mono text-[11px]">★ {vendor.rating}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic TCPA Consent Injection Notice */}
      <div className="text-[11px] text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
        "{widget.consentStatement}"
      </div>

      {/* CTA Button */}
      <div className="pt-1">
        <button
          onClick={() => setIsOpenModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Connect with Local {widget.tradeCategory} Pros</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MODAL: LEAD CAPTURE & SMS OTP & MASKED MARKETPLACE PREVIEW */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-white shadow-2xl relative">
            <button
              onClick={() => {
                setIsOpenModal(false);
                setStep('INPUT');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-2"
            >
              ✕
            </button>

            {step === 'INPUT' && (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    100% Free Verification Request
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Request Professional {widget.tradeCategory} Inspection
                  </h3>
                  <p className="text-xs text-slate-300">
                    Get an objective quote for {widget.identifiedGap} from top local contractors.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mobile Phone Number (for SMS Verification)</label>
                    <input
                      type="tel"
                      required
                      placeholder="(512) 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Purchase Timeline</label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Under Contract">Under Contract (Closing Soon)</option>
                      <option value="Actively Shopping">Actively Shopping / Touring</option>
                      <option value="Property Owner">Current Owner / Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Explicit TCPA Vendor Consent Block */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Explicit TCPA Consent Statement:</span>
                  </div>
                  <p className="italic">
                    "By submitting, I explicitly consent to receive calls and text messages from {vendorNames} at the number provided regarding my request. Consent is not a condition of purchase."
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send SMS Verification Code</span>
                </button>
              </form>
            )}

            {step === 'OTP' && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">SMS Security Verification</h3>
                  <p className="text-xs text-slate-300">
                    Enter the 4-digit verification code sent to <strong className="text-white">{phone}</strong>.
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1 2 3 4"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-36 mx-auto text-center font-mono text-xl tracking-widest bg-slate-800 border border-amber-400 rounded-xl py-3 text-white focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-400 mt-2">Demo mode: Enter any 4 digits to verify.</div>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length < 4}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Verify Number & Submit Request
                </button>
              </div>
            )}

            {step === 'SUCCESS' && createdLead && (
              <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-emerald-300">Request Confirmed & SMS Validated!</div>
                    <div className="text-xs text-slate-300">Matching contractors ({vendorNames}) have been notified.</div>
                  </div>
                </div>

                {/* B2B MASKED LEAD MARKETPLACE PRODUCT PREVIEW CARD */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Contractor Marketplace Preview ("Lead Asset")</span>
                    </span>
                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                      MAX 2 UNLOCKS
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 text-[10px] uppercase">LEAD ID</span>
                      <span className="text-amber-300 font-bold">{createdLead.leadId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-slate-300 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px]">ZIP CODE</span>
                        <span className="font-bold text-white">{createdLead.zipCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">PROPERTY ERA</span>
                        <span className="font-bold text-white">{createdLead.propertyEra}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">TIMELINE</span>
                        <span className="font-bold text-emerald-400">{createdLead.timeline}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">SMS STATUS</span>
                        <span className="font-bold text-blue-400">✓ {createdLead.smsVerificationStatus}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      <span className="text-slate-400 block text-[9px]">IDENTIFIED GAP</span>
                      <span className="text-amber-200 font-bold">{createdLead.identifiedGap}</span>
                    </div>

                    {/* Masked vs Unmasked PII Display */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="text-slate-400 font-bold text-[10px] uppercase flex items-center justify-between mb-1">
                        <span>CLIENT CONTACT PII</span>
                        <span>{isUnlocked ? <span className="text-emerald-400 flex items-center gap-1"><Unlock className="w-3 h-3" /> UNMASKED</span> : <span className="text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" /> MASKED</span>}</span>
                      </div>

                      {isUnlocked && createdLead.unmaskedDetails ? (
                        <div className="space-y-1 text-emerald-300 font-mono">
                          <div><strong>Name:</strong> {createdLead.unmaskedDetails.fullName}</div>
                          <div><strong>Phone:</strong> {createdLead.unmaskedDetails.phone}</div>
                          <div><strong>Address:</strong> {createdLead.unmaskedDetails.address}</div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-400 font-mono">
                          <div><strong>Name:</strong> {createdLead.maskedName}</div>
                          <div><strong>Phone:</strong> {createdLead.maskedPhone}</div>
                          <div><strong>Address:</strong> {createdLead.maskedAddress}</div>
                        </div>
                      )}
                    </div>

                    {/* Contractor Unlock Button */}
                    {!isUnlocked ? (
                      <button
                        onClick={handleSimulateStripeUnlock}
                        disabled={isProcessingUnlock}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5 text-blue-200" />
                        <span>{isProcessingUnlock ? 'Unmasking via Stripe...' : `Contractor Unlock ($${createdLead.unlockFee} Stripe Unlock Fee)`}</span>
                      </button>
                    ) : (
                      <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-sans font-bold text-xs rounded-xl">
                        ✓ Lead Contact Details Unmasked for Local Pro
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsOpenModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
