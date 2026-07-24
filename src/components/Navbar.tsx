import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, BookOpen, UserPlus, LogIn, LogOut, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../types';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  unlockedCount: number;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  unlockedCount,
  onOpenSearch,
}) => {
  const { user, isClerkActive, triggerClerkSignIn, loginWithMockUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const handleSignIn = async () => {
    const path = window.location.pathname;
    const isContributorRoute = currentView === 'CONTRIBUTOR_FLOW' || path.startsWith('/contributor') || path.startsWith('/become-expert') || path.startsWith('/contributor-registration');
    const targetUrl = isContributorRoute
      ? `${window.location.origin}/contributor-registration`
      : window.location.href;

    if (isClerkActive) {
      triggerClerkSignIn(targetUrl);
    } else {
      await loginWithMockUser({
        uid: `user_${Date.now()}`,
        displayName: 'Resident Contributor',
        email: 'contributor@example.com'
      });
      if (isContributorRoute) {
        setView('CONTRIBUTOR_FLOW');
      }
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Auto-close menu when clicking or tapping outside or pressing Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay to catch clicks/taps outside the menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-30 sm:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <header ref={headerRef} className="sticky top-0 z-40 bg-[#F7F9FC]/95 backdrop-blur-md border-b border-[#E4E4E7]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => {
            setView('HOME');
            closeMobileMenu();
          }}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform group-hover:scale-105" />
          <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg md:text-xl">
            Before Regret
          </span>
        </div>

        {/* Center Search Trigger (Desktop) */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white border border-[#E4E4E7] text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all text-xs font-normal shadow-2xs w-64 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Search any society...</span>
          <kbd className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-sans">
            ⌘K
          </kbd>
        </button>

        {/* Desktop Navigation Controls */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          
          {/* Browse Societies link */}
          <button
            onClick={() => {
              setView('HOME');
              setTimeout(() => {
                const el = document.getElementById('browse-societies');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Browse</span>
          </button>

          {/* Unlocked Knowledge Library */}
          <button
            onClick={() => setView('LIBRARY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>My Library</span>
            {unlockedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-[#2563EB] text-white text-[10px] font-bold rounded-full">
                {unlockedCount}
              </span>
            )}
          </button>

          {/* Become a Contributor */}
          <button
            onClick={() => setView('CONTRIBUTOR_FLOW')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-medium transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Become a Contributor</span>
          </button>

          {/* Clerk / Auth Integration */}
          {isClerkActive ? (
            <>
              <SignedIn>
                <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all cursor-pointer shrink-0 ml-1 shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Sign In</span>
                </button>
              </SignedOut>
            </>
          ) : (
            user ? (
              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200">
                <span className="text-xs font-medium text-slate-700 truncate max-w-[100px]">
                  {user.displayName || user.email || 'User'}
                </span>
                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all cursor-pointer shrink-0 ml-1 shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>Sign In</span>
              </button>
            )
          )}
        </div>

        {/* Mobile Header Action Buttons */}
        <div className="flex sm:hidden items-center gap-1">
          <button
            onClick={() => {
              onOpenSearch();
              closeMobileMenu();
            }}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Search societies"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>
        </div>

      </div>

      {/* Auto-Resizing Collapsible Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden sm:hidden bg-white border-t border-slate-200 shadow-lg"
          >
            <div className="p-3.5 space-y-2.5">
              
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  onOpenSearch();
                  closeMobileMenu();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Search societies by name or city...</span>
              </button>

              <div className="grid grid-cols-1 gap-1 pt-1">
                {/* Browse Societies */}
                <button
                  onClick={() => {
                    setView('HOME');
                    closeMobileMenu();
                    setTimeout(() => {
                      const el = document.getElementById('browse-societies');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors text-left"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Browse Societies</span>
                </button>

                {/* My Library */}
                <button
                  onClick={() => {
                    setView('LIBRARY');
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[#2563EB]" />
                    <span>My Knowledge Library</span>
                  </div>
                  {unlockedCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-full">
                      {unlockedCount} Unlocked
                    </span>
                  )}
                </button>

                {/* Become a Contributor */}
                <button
                  onClick={() => {
                    setView('CONTRIBUTOR_FLOW');
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors text-left"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Become a Resident Contributor</span>
                </button>
              </div>

              {/* Account / Auth section in mobile menu */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isClerkActive ? (
                  <>
                    <SignedIn>
                      <div className="flex items-center justify-between w-full px-1 py-1">
                        <span className="text-xs font-medium text-slate-600">Account</span>
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </SignedIn>
                    <SignedOut>
                      <button
                        onClick={() => {
                          handleSignIn();
                          closeMobileMenu();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold transition-all active:scale-[0.98]"
                      >
                        <LogIn className="w-4 h-4 text-white" />
                        <span>Sign In / Register</span>
                      </button>
                    </SignedOut>
                  </>
                ) : (
                  user ? (
                    <div className="flex items-center justify-between w-full px-1 py-1">
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
                        {user.displayName || user.email || 'User Account'}
                      </span>
                      <button
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn();
                        closeMobileMenu();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold transition-all active:scale-[0.98]"
                    >
                      <LogIn className="w-4 h-4 text-white" />
                      <span>Sign In / Register</span>
                    </button>
                  )
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
};


