import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogIn, Sparkles, ChevronDown, CheckCircle2, ShieldCheck, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onNewSearch: () => void;
  currentStep: 'HOME' | 'RESEARCHING' | 'SUMMARY' | 'REPORT';
  selectedAddress?: string;
  onNavigate?: (path: string) => void;
}

// The content destinations the header offers on mobile. Deliberately only the four browsing
// destinations, not the full footer list -- legal pages belong in the footer, and a menu that
// tries to be a sitemap stops being a menu.
const MOBILE_NAV_LINKS: { href: string; label: string }[] = [
  { href: '/guides/', label: 'Guides' },
  { href: '/advertise/', label: 'Advertise' },
  { href: '/about/', label: 'About & Methodology' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onNewSearch,
  currentStep,
  selectedAddress,
  onNavigate
}) => {
  const { user, requestClerkLoad } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Mobile-only menu. Below the sm breakpoint the header previously showed the logo and the auth
  // button and nothing else -- the "Guides" button is `hidden sm:inline` and there was no
  // replacement, so a phone visitor had no persistent route to the guide library, the county
  // library, /advertise or /about from anywhere on the site. The footer carried those links, but
  // only after scrolling to the bottom of whatever page they happened to be on.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);

  // Escape to close, and a click anywhere outside the header dismisses it. Both are registered
  // only while the menu is actually open, so there is no always-on document listener for a
  // control most visitors never touch.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header ref={menuRef} className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
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
            {/* Mobile-only menu toggle. Mirrors the desktop "Guides" button's own visibility rule
                in reverse (sm:hidden vs hidden sm:inline) so exactly one of the two is on screen
                at any width -- never both, never neither, which was the bug. */}
            {onNavigate && (
              <button
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav"
                className="sm:hidden p-2 -mr-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
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

        {/* Mobile nav panel. Rendered inside <header> on purpose: the header is the sticky,
            z-30 element, so the panel inherits that stacking context and cannot end up behind
            page content. Also keeps it inside menuRef, so the outside-click handler correctly
            treats a tap on the toggle button as "inside" rather than immediately reopening. */}
        {onNavigate && isMenuOpen && (
          <nav id="mobile-nav" className="sm:hidden border-t border-slate-200 bg-white px-4 py-2 shadow-sm">
            {MOBILE_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  // Real href so the link is crawlable and middle-click/open-in-new-tab behave
                  // normally; the handler intercepts a plain left click for SPA navigation, the
                  // same split ContentLink uses elsewhere.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setIsMenuOpen(false);
                  onNavigate(link.href);
                }}
                className="block py-3 text-sm font-bold text-slate-700 hover:text-blue-700 border-b border-slate-100 last:border-0"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};

