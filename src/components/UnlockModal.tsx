import React, { useState } from 'react';
import { ResidentKnowledgeProfile, TopicKnowledge } from '../types';
import { X, ShieldCheck, Lock, Unlock, CheckCircle, CreditCard, Sparkles } from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ResidentKnowledgeProfile | null;
  selectedTopic: TopicKnowledge | null;
  onConfirmPayment: (profileId: string, topicId?: string, pricePaid?: number) => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  profile,
  selectedTopic,
  onConfirmPayment,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  if (!isOpen || !profile) return null;

  const isSingleTopic = !!selectedTopic;
  const price = isSingleTopic ? 129 : 399;
  const title = isSingleTopic ? `Unlock "${selectedTopic.title}"` : `Unlock Full Society Intelligence`;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDone(true);
      setTimeout(() => {
        onConfirmPayment(profile.id, selectedTopic?.id, price);
        setPaymentDone(false);
        onClose();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white border border-[#E4E4E7] rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentDone ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Unlock Successful!</h3>
            <p className="text-xs text-slate-500 font-mono">
              Redirecting to your unlocked resident intelligence...
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[11px] font-mono font-semibold border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Resident Intelligence</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {profile.societyName} • {profile.city}
              </p>
            </div>

            {/* Price breakdown card */}
            <div className="p-4 bg-[#F7F9FC] border border-[#E4E4E7] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{isSingleTopic ? selectedTopic.title : `Complete Profile (${profile.topics.length} Topics)`}</span>
                <span className="font-mono text-slate-900 font-bold">₹{price}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                <span>GST & Access Fee:</span>
                <span>Included</span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-lg text-[#2563EB]">₹{price}</span>
              </div>
            </div>

            {/* Trust highlights */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant access on desktop & mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved permanently in your Knowledge Library</span>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>{isProcessing ? 'Processing Payment...' : `Pay ₹${price} & Unlock Now`}</span>
            </button>

            <p className="text-[10px] text-center text-slate-400 font-mono">
              256-bit encrypted secure checkout simulation
            </p>
          </>
        )}

      </div>
    </div>
  );
};
