import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Calendar, Hash } from 'lucide-react';

type Status = 'capturing' | 'granted' | 'not-granted' | 'error';

interface ZipAdsCheckoutSuccessProps {
  onNavigate: (path: string) => void;
}

// PayPal's redirect back from approval lands here with ?token=<orderId>. Calls the capture
// endpoint itself rather than reading back an already-captured record -- same pattern as
// GuideAdsCheckoutSuccess.tsx for the same reason (nothing else in this flow captures it).
//
// Same dead-end fix as GuideAdsCheckoutSuccess.tsx: with no transactional email right now, this
// page is the only receipt a vendor gets -- expiry date and payment reference need to be on it,
// and it needs a way back to /my-ads instead of stopping at "Return to Home."
export const ZipAdsCheckoutSuccess: React.FC<ZipAdsCheckoutSuccessProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<Status>('capturing');
  const [errorMessage, setErrorMessage] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [paidThrough, setPaidThrough] = useState<string | null>(null);

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
        setCaptureId(data.captureId ?? null);
        setPaidThrough(data.paidThrough ?? null);
        setStatus(data.granted ? 'granted' : 'not-granted');
      })
      .catch(() => {
        setErrorMessage('Could not reach the server to confirm payment.');
        setStatus('error');
      });
  }, []);

  const expiryLabel = paidThrough
    ? new Date(paidThrough).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

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
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm text-emerald-900">
                Your {tradeCategory} slot for ZIP {zipCode} is active.
              </p>
              {expiryLabel && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-800 pt-2 border-t border-emerald-200">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Live through {expiryLabel} -- no auto-renewal, it simply expires then.</span>
                </p>
              )}
              {captureId && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-700/80">
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span>Payment reference: {captureId}</span>
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              No email receipt is sent for this yet -- bookmark this page or keep your payment reference above.
              Everything here is also saved to your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('/my-ads')}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Manage My Placements
              </button>
              <button
                onClick={() => onNavigate('/')}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Return to Home
              </button>
            </div>
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
              onClick={() => onNavigate('/report-ads')}
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
              onClick={() => onNavigate('/report-ads')}
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
