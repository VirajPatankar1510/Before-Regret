import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Calendar, Hash } from 'lucide-react';

type Status = 'capturing' | 'success' | 'error';

interface GrantedGuide {
  articleId: number;
  slug: string;
  title: string;
}

interface GuideAdsCheckoutSuccessProps {
  onNavigate: (path: string) => void;
}

// PayPal's redirect back from approval lands here with ?token=<orderId>. Deliberately calls the
// capture endpoint itself rather than just reading back an already-captured record -- checked the
// existing PaymentSuccess.tsx (the report-payment equivalent) and it only reads a transaction row,
// it never actually calls /api/paypal/orders/:orderId/capture anywhere; nothing else in that flow
// captures it either as far as this file's own code shows. Not fixing that here since it's a
// separate, pre-existing flow, but not copying the same gap into a new one either.
//
// This used to be a dead end -- "You're Live" plus a count of slots and a button back to the
// homepage, no expiry date, no proof of purchase, no way back to what was just bought. With
// Resend removed and no transactional email at all right now, this page IS the receipt; a vendor
// who closes this tab has nothing else confirming the charge until /my-ads is built out further.
export const GuideAdsCheckoutSuccess: React.FC<GuideAdsCheckoutSuccessProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<Status>('capturing');
  const [errorMessage, setErrorMessage] = useState('');
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [paidThrough, setPaidThrough] = useState<string | null>(null);
  const [grantedGuides, setGrantedGuides] = useState<GrantedGuide[]>([]);
  const [skippedGuides, setSkippedGuides] = useState<GrantedGuide[]>([]);

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
        setCaptureId(data.captureId ?? null);
        setPaidThrough(data.paidThrough ?? null);
        setGrantedGuides(data.grantedGuides ?? []);
        setSkippedGuides(data.skippedGuides ?? []);
        setStatus('success');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center space-y-6">
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

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-3">
              <p className="text-sm text-emerald-900 font-semibold">
                {grantedGuides.length} guide{grantedGuides.length === 1 ? '' : 's'} activated
              </p>
              {grantedGuides.length > 0 && (
                <ul className="space-y-1.5">
                  {grantedGuides.map((g) => (
                    <li key={g.articleId} className="text-xs text-emerald-800">
                      <a
                        href={`/guides/${g.slug}/`}
                        target="_blank" rel="noopener noreferrer"
                        className="hover:underline font-medium"
                      >
                        {g.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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

            {skippedGuides.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1.5">
                <p className="text-xs font-semibold text-amber-900">
                  {skippedGuides.length} guide{skippedGuides.length === 1 ? '' : 's'} were taken by someone else right before payment completed
                </p>
                <ul className="space-y-1">
                  {skippedGuides.map((g) => (
                    <li key={g.articleId} className="text-xs text-amber-800">{g.title}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-700">
                  You were still charged for these -- contact support for a refund on that portion.
                </p>
              </div>
            )}

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
