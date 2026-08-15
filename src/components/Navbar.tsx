import React, { useState } from 'react';
import { Search, User, LogIn, Sparkles, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onNewSearch: () => void;
  currentStep: 'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT';
  selectedAddress?: string;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewSearch,
  currentStep,
  selectedAddress,
  onNavigate
}) => {
  const { user, requestClerkLoad } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <button
            onClick={onNewSearch}
            className="flex items-center gap-2.5 text-slate-900 group text-left cursor-pointer"
          >
            <Logo className="w-9 h-9 shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Before Regret</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 hidden sm:block">
                Check it before you sign it.
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/guides/')}
                className="hidden sm:inline px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Guides
              </button>
            )}
            {currentStep !== 'HOME' && (
              <button
                onClick={onNewSearch}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Search Another Address</span>
                <span className="sm:hidden">Search</span>
              </button>
            )}

            {/* Auth Button / Profile Pill */}
            {user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white overflow-hidden flex items-center justify-center shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <span className="max-w-[100px] sm:max-w-[140px] truncate font-bold">{user.displayName || 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              // onMouseEnter/onFocus start the Clerk chunk downloading before the click even
              // happens, on desktop -- by the time a mouse click lands, the hover almost always
              // preceded it by enough time to have a head start. onClick is the guaranteed
              // trigger for touch (no hover event exists) and keyboard activation without a
              // preceding focus... though focus does normally precede Enter-key activation too;
              // onClick just costs nothing extra since requestClerkLoad is idempotent.
              <button
                onClick={() => { requestClerkLoad(); setIsAuthModalOpen(true); }}
                onMouseEnter={requestClerkLoad}
                onFocus={requestClerkLoad}
                className="px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Free Report</span>
              </button>
            )}
          </div>

        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};

