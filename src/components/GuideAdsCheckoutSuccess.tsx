import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type Status = 'capturing' | 'success' | 'error';

interface GuideAdsCheckoutSuccessProps {
  onNavigate: (path: string) => void;
}

// PayPal's redirect back from approval lands here with ?token=<orderId>. Deliberately calls the
// capture endpoint itself rather than just reading back an already-captured record -- checked the
// existing PaymentSuccess.tsx (the report-payment equivalent) and it only reads a transaction row,
// it never actually calls /api/paypal/orders/:orderId/capture anywhere; nothing else in that flow
// captures it either as far as this file's own code shows. Not fixing that here since it's a
// separate, pre-existing flow, but not copying the same gap into a new one either.
export const GuideAdsCheckoutSuccess: React.FC<GuideAdsCheckoutSuccessProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<Status>('capturing');
  const [errorMessage, setErrorMessage] = useState('');
  const [grantedCount, setGrantedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('token');
    if (!orderId) {
      setErrorMessage('No order ID found in the return URL.');
      setStatus('error');
      return;
    }
    fetch(`/api/guide-ads/checkout/${orderId}/capture`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setErrorMessage(data.error || 'Payment capture failed.');
          setStatus('error');
          return;
        }
        setGrantedCount(data.grantedSlots?.length ?? 0);
        setSkippedCount(data.skippedSlots?.length ?? 0);
        setStatus('success');
      })
      .catch(() => {
        setErrorMessage('Could not reach the server to confirm payment.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'capturing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Confirming Payment</h1>
            <p className="text-slate-600">Please wait while we activate your ad slots...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">You're Live</h1>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
              {grantedCount} slot{grantedCount === 1 ? '' : 's'} activated for the next 30 days.
              {skippedCount > 0 && (
                <p className="mt-2 text-amber-700">
                  {skippedCount} slot{skippedCount === 1 ? '' : 's'} you selected were taken by someone else right before payment completed
                  and were not charged for -- contact support for a refund on those if you were still charged.
                </p>
              )}
            </div>
            <button
              onClick={() => onNavigate('/')}
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
            <button
              onClick={() => onNavigate('/topic-ads')}
              className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Back to Ad Selection
            </button>
          </>
        )}
      </div>
    </div>
  );
};
