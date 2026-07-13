import React from 'react';
import { Home, MapPin, Search, Sparkles, User, LogIn, Award } from 'lucide-react';

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
      {/* Simulation Persona Bar */}
      <div className="bg-blue-50 border-b border-blue-100/60 px-4 py-1.5 text-center text-xs flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] mx-auto sm:mx-0">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Simulation Workspace Mode: Test both sides of the marketplace</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center mx-auto sm:mx-0">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Perspective:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/60 font-medium">
            <button
              onClick={() => {
                setActiveRole('guest');
                setView('home');
              }}
              className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all cursor-pointer ${
                activeRole === 'guest'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Guest
            </button>
            <button
              onClick={() => {
                setActiveRole('buyer');
                setView('buyer_dashboard');
              }}
              className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all cursor-pointer ${
                activeRole === 'buyer'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buyer (Rohan)
            </button>
            <button
              onClick={() => {
                setActiveRole('expert');
                setView('expert_dashboard');
              }}
              className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all cursor-pointer ${
                activeRole === 'expert'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expert (Priya)
            </button>
          </div>
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="bg-blue-600 text-white p-2 rounded-xl transition-transform group-hover:scale-105">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-black text-lg tracking-tight text-slate-900">
              Before<span className="text-blue-600">Regret</span>
            </span>
            <span className="block text-[9px] text-slate-400 font-mono tracking-widest uppercase -mt-1">
              Verified Resident Intelligence
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
