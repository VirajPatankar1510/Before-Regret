import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type Status = 'capturing' | 'granted' | 'not-granted' | 'error';

interface ZipAdsCheckoutSuccessProps {
  onNavigate: (path: string) => void;
}

// PayPal's redirect back from approval lands here with ?token=<orderId>. Calls the capture
// endpoint itself rather than reading back an already-captured record -- same pattern as
// GuideAdsCheckoutSuccess.tsx for the same reason (nothing else in this flow captures it).
export const ZipAdsCheckoutSuccess: React.FC<ZipAdsCheckoutSuccessProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<Status>('capturing');
  const [errorMessage, setErrorMessage] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('token');
    if (!orderId) {
      setErrorMessage('No order ID found in the return URL.');
      setStatus('error');
      return;
    }
    fetch(`/api/zip-ads/checkout/${orderId}/capture`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setErrorMessage(data.error || 'Payment capture failed.');
          setStatus('error');
          return;
        }
        setZipCode(data.zipCode || '');
        setTradeCategory(data.tradeCategory || '');
        setStatus(data.granted ? 'granted' : 'not-granted');
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
            <p className="text-slate-600">Please wait while we activate your ad slot...</p>
          </>
        )}

        {status === 'granted' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">You're Live</h1>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
              Your {tradeCategory} slot for ZIP {zipCode} is active for the next 30 days.
            </div>
            <button
              onClick={() => onNavigate('/')}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}

        {status === 'not-granted' && (
          <>
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Received</h1>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              Both slots for {tradeCategory} in ZIP {zipCode} were taken by another advertiser right before your payment completed.
              Contact support for a refund.
            </div>
            <button
              onClick={() => onNavigate('/vendors')}
              className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Back to Vendor Signup
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
              onClick={() => onNavigate('/vendors')}
              className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Back to Vendor Signup
            </button>
          </>
        )}
      </div>
    </div>
  );
};
