import React from 'react';
import { ViewState } from '../types';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  setView: (view: ViewState) => void;
  onOpenSearch: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setView, onOpenSearch }) => {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Logo className="w-7 h-7 shrink-0" color="#3B82F6" />
              <span className="font-bold text-lg tracking-tight text-white">
                Before Regret
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md font-normal leading-relaxed">
              The premium knowledge marketplace for residential societies. Know what real residents wish they knew before buying or renting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[#18px] text-xs font-medium text-slate-300">
            <a 
              href="/" 
              onClick={(e) => { e.preventDefault(); setView('HOME'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </a>
            <button onClick={onOpenSearch} className="hover:text-white transition-colors cursor-pointer">
              Search Societies
            </button>
            <a 
              href="/library" 
              onClick={(e) => { e.preventDefault(); setView('LIBRARY'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              My Library
            </a>
            <a 
              href="/contributor" 
              onClick={(e) => { e.preventDefault(); setView('CONTRIBUTOR_FLOW'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Become a Contributor
            </a>
            <a 
              href="/terms-and-conditions" 
              onClick={(e) => { e.preventDefault(); setView('TERMS'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms
            </a>
            <a 
              href="/privacy-policy" 
              onClick={(e) => { e.preventDefault(); setView('PRIVACY'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </a>
            <a 
              href="/refund-policy" 
              onClick={(e) => { e.preventDefault(); setView('REFUND'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Refund Policy
            </a>
            <a 
              href="/legal-disclaimer" 
              onClick={(e) => { e.preventDefault(); setView('DISCLAIMER'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Disclaimer
            </a>
            <a 
              href="/contact-us" 
              onClick={(e) => { e.preventDefault(); setView('CONTACT'); }} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sans text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>BeforeRegret shares resident experiences to help buyers make informed decisions. BeforeRegret is not against any builder, broker, housing society, or residential project.</span>
          </div>
          <div>
            © {new Date().getFullYear()} Before Regret Inc. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};
