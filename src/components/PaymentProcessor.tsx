import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface PaymentProcessorProps {
  amount: number;
  currency?: string;
  type: 'report' | 'vendor_subscription';
  description: string;
  propertyAddress?: string;
  vendorId?: string;
  userEmail: string;
  userId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  currency = 'USD',
  type,
  description,
  propertyAddress,
  vendorId,
  userEmail,
  userId,
  onSuccess,
  onError,
  onClose,
}) => {
  const [step, setStep] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setStep('loading');
      const response = await fetch('/api/paypal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          type,
          description,
          propertyAddress,
          vendorId,
          userEmail,
          userId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      setOrderId(data.orderId);
      setApprovalUrl(data.approvalUrl);
      setStep('ready');
    } catch (error: any) {
      const message = error.message || 'Failed to initialize payment';
      setErrorMessage(message);
      onError(message);
      setStep('error');
    }
  };

  const handlePayPalClick = () => {
    if (approvalUrl) {
      window.location.href = approvalUrl;
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-600">Initializing secure payment...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
        <p className="text-red-600 mb-4 text-center">{errorMessage}</p>
        <button
          onClick={initializePayment}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
        <p className="text-green-600 mb-4">Payment successful!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">
            {currency} {amount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-semibold capitalize">{type.replace('_', ' ')}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center">
        You will be redirected to PayPal to complete your payment securely.
      </p>

      <button
        onClick={handlePayPalClick}
        disabled={!approvalUrl}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 4.004-.025.15a.806.806 0 01-.794.68h-2.31a.537.537 0 01-.53-.625l1.19-7.56h.03c.44-2.8 2.05-4.435 3.845-4.435h1.57c1.065 0 1.97-.28 2.427-1.346z" />
        </svg>
        Pay with PayPal
      </button>

      <button
        onClick={onClose}
        className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
