import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PaymentSuccess: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('token');

      if (!orderId) {
        setErrorMessage('No payment order ID found. Please try again.');
        setStatus('error');
        return;
      }

      const response = await fetch(`/api/paypal/transaction/${orderId}`);
      const data = await response.json();

      if (!data.success) {
        setErrorMessage('Payment verification failed. Please contact support.');
        setStatus('error');
        return;
      }

      setTransactionId(data.transaction.paypal_order_id);
      setStatus('success');
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setErrorMessage(error.message || 'An error occurred during payment verification.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Verifying Payment</h1>
            <p className="text-slate-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Successful!</h1>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-900">
                Your payment has been processed successfully.
              </p>
              <p className="text-xs text-emerald-700 mt-2 font-mono">
                Transaction ID: {transactionId}
              </p>
            </div>
            <p className="text-slate-600">
              Your property report is being generated. You'll receive an email confirmation shortly.
            </p>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Issue</h1>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-900">{errorMessage}</p>
            </div>
            <p className="text-slate-600">
              Please contact support if you need assistance with your payment.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => verifyPayment()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
