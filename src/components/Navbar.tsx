import React from 'react';
import { MapPin, Search, Sparkles, User, LogIn, Award } from 'lucide-react';
import { Logo } from './Logo';

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
            onClick={() => setView('become_expert')}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Become a Local Expert</span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {activeRole === 'guest' ? (
            <button
              onClick={() => {
                setActiveRole('buyer');
                setView('buyer_dashboard');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (activeRole === 'buyer') {
                  setView('buyer_dashboard');
                } else {
                  setView('expert_dashboard');
                }
              }}
              className="inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-all cursor-pointer bg-slate-50 text-slate-800"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 font-mono">
                {activeRole === 'buyer' ? 'R' : 'P'}
              </div>
              <span className="text-xs font-semibold capitalize hidden sm:inline">
                {activeRole === 'buyer' ? 'Rohan (Buyer)' : 'Priya (Expert)'}
              </span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
