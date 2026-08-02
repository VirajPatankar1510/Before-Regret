import React from 'react';
import { Search, ShieldAlert, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  onNewSearch: () => void;
  currentStep: 'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT';
  selectedAddress?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewSearch,
  currentStep,
  selectedAddress
}) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button
          onClick={onNewSearch}
          className="flex items-center gap-2.5 text-slate-900 group text-left cursor-pointer"
        >
          <Logo className="w-9 h-9 shrink-0 transition-transform group-hover:scale-105" color="#1A6CFF" />
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>BeforeRegret</span>
            </div>
            <div className="text-[10px] font-medium text-slate-500 hidden sm:block">
              Property Research Assistant
            </div>
          </div>
        </button>

        {/* Selected Address Indicator if in report or summary */}
        {selectedAddress && currentStep !== 'HOME' && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 max-w-md truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{selectedAddress}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {currentStep !== 'HOME' && (
            <button
              onClick={onNewSearch}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search Another Address</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
