import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

export const PaymentCancelled: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <XCircle className="w-12 h-12 text-orange-600 mx-auto" />

        <h1 className="text-2xl font-bold text-slate-900">Payment Cancelled</h1>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </div>

        <p className="text-slate-600">
          You can try again anytime to generate your property report.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};
