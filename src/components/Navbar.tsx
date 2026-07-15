import React, { useState } from 'react';
import { MapPin, Search, Sparkles, User, LogIn, LogOut, Award, BookOpen, ChevronDown, Check, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  activeRole: 'guest' | 'buyer' | 'expert';
  setActiveRole: (role: 'guest' | 'buyer' | 'expert') => void;
  onSearchFocus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  activeRole,
  setActiveRole,
  onSearchFocus,
}) => {
  const { user, loginWithGoogle, logout, expertProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setView('explore');
    } catch (err) {
      console.error('Failed to log in', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setView('home');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="border-b border-slate-100 bg-white sticky top-0 z-50 shadow-2xs font-sans">

      <header className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <Logo size={36} className="transition-transform group-hover:scale-105" />
          <div>
            <span className="font-logo font-black text-xl tracking-tight text-slate-900">
              Before <span className="text-slate-900">Regret</span>
            </span>
            <span className="block text-[8px] sm:text-[9px] text-slate-400 font-logo font-semibold tracking-wider sm:tracking-widest uppercase mt-0.5">
              Before You Decide, Ask.
            </span>
          </div>
        </div>

        {/* Minimal Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              onSearchFocus();
              setView('home');
            }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setView('explore')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Explore
          </button>
          <button
            onClick={() => { setView('regret_files'); window.scrollTo(0, 0); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentView === 'regret_files' ? 'bg-amber-500 text-slate-900' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Regret Files</span>
          </button>
          <button
            onClick={() => setView('become_expert')}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Become a Local Expert</span>
          </button>
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {!user ? (
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-all cursor-pointer bg-slate-50 text-slate-800"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    referrerPolicy="no-referrer" 
                    alt={user.displayName || 'User'} 
                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 font-mono">
                    {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold capitalize hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold uppercase tracking-wider scale-90">
                  {activeRole}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20 font-sans">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="px-2 py-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                        Select Active View Mode
                      </div>
                      <button
                        onClick={() => {
                          setActiveRole('buyer');
                          setView('buyer_dashboard');
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${activeRole === 'buyer' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>Buyer Mode (Ask & Track)</span>
                        {activeRole === 'buyer' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setActiveRole('expert');
                          setView('expert_dashboard');
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${activeRole === 'expert' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>Local Expert Mode (Answer)</span>
                        {activeRole === 'expert' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1 px-2">
                      <button
                        onClick={() => {
                          setView('explore');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Explore Societies
                      </button>
                      <button
                        onClick={() => {
                          setView('become_expert');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Become a Local Expert</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-inner">
          <button
            onClick={() => {
              onSearchFocus();
              setView('home');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all text-left"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search Neighborhoods</span>
          </button>
          
          <button
            onClick={() => {
              setView('explore');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
              currentView === 'explore'
                ? 'bg-blue-50/70 text-blue-600 font-bold'
                : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Explore Societies</span>
          </button>
          
          <button
            onClick={() => {
              setView('regret_files');
              window.scrollTo(0, 0);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
              currentView === 'regret_files'
                ? 'bg-amber-500 text-slate-900 shadow-xs'
                : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>The Regret Files</span>
          </button>
          
          <button
            onClick={() => {
              setView('become_expert');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
              currentView === 'become_expert'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Become a Local Expert</span>
          </button>

          {user && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-1">
                Active Dashboards
              </div>
              <button
                onClick={() => {
                  setActiveRole('buyer');
                  setView('buyer_dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeRole === 'buyer' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Buyer Dashboard</span>
                {activeRole === 'buyer' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setActiveRole('expert');
                  setView('expert_dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeRole === 'expert' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Local Expert Dashboard</span>
                {activeRole === 'expert' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

