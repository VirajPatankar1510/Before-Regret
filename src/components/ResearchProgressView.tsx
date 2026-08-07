import React, { useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { PropertySearchResult } from '../types';

interface ResearchProgressViewProps {
  property: PropertySearchResult;
  onComplete: () => void;
}

// Brief, honest loading transition -- not a progress simulation. The previous version animated a
// fake step list ("Searching public records... County Tax Assessor, Clerk Deeds...") and counted
// up "27 sources scanned" / "18 useful findings" on fixed timers regardless of the address, under
// a "Live Public Record Investigation" banner. None of that was real: there is no live data
// connection to any of those sources, and the numbers were scripted, not queried. The actual
// summary fetch (see handleSelectProperty in App.tsx) runs in the background independent of this
// screen; this is just a short, non-deceptive wait state while that resolves.
const MIN_DISPLAY_MS = 900;

export const ResearchProgressView: React.FC<ResearchProgressViewProps> = ({ property, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Preparing your summary</h2>
          <p className="text-sm font-medium text-slate-500 truncate">
            {property.displayName || property.formattedAddress}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>One moment...</span>
        </div>
      </div>
    </div>
  );
};
