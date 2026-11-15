import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { reportCtaClick } from '../utils/ctaClickBeacon';

interface NavbarProps {
  onNewSearch: () => void;
  currentStep: 'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT';
  selectedAddress?: string;
  onNavigate?: (path: string) => void;
}

// The header, cut down 2026-11-16 at the owner's request: Guides, About & Methodology, For
// businesses, Search Another Address and the Free Report button were all removed, and the mobile
// menu with them. What is left is the logo (which still goes back to the homepage address search)
// and ONE link, "For Advertisers", shown at every width -- a plain text link, not a button (owner,
// 2026-11-16). The other destinations are still in the
// footer on every page (Footer.tsx / StaticFooterLinks.tsx).
//
// The account pill stays for a signed-in visitor -- it is the only way to sign out or reach My Ads
// from the header, and it only ever appears for someone who has signed in (vendors, since reports
// need no account).
export const Navbar: React.FC<NavbarProps> = ({
  onNewSearch,
  currentStep,
  selectedAddress,
  onNavigate
}) => {
  const { user } = useAuth();
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* A real href so it is crawlable and opens in a new tab normally; a plain left click is
                intercepted for SPA navigation, the same split ContentLink uses elsewhere. */}
            <a
              href="/advertise/"
              onClick={(e) => {
                reportCtaClick('nav_for_advertisers');
                if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                onNavigate('/advertise/');
              }}
              className="px-1 py-2 text-sm font-semibold text-slate-700 hover:text-home-navy underline-offset-4 hover:underline transition-colors"
            >
              For Advertisers
            </a>

            {user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Your account"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white overflow-hidden flex items-center justify-center shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <span className="hidden sm:inline max-w-[140px] truncate font-bold">{user.displayName || 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
