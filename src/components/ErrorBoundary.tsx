import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg shadow-sm space-y-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Something went wrong displaying the report
        </h2>
        <p className="text-sm text-slate-600">
          We encountered a temporary rendering issue. Please try refreshing or restarting the property search.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={resetErrorBoundary}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
