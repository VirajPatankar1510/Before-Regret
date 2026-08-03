import React from 'react';
import { ShieldCheck, ArrowRight, MapPin, BookOpen, Scale, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onNewSearch: () => void;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNewSearch, onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 shrink-0" color="#3B82F6" />
              <span className="font-extrabold text-lg text-white tracking-tight">BeforeRegret</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Helping property buyers discover what they might regret overlooking before purchasing a property in the United States. Sourced directly from FEMA, USGS, and municipal records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/admin/seo')}
                className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-blue-500 text-blue-400 hover:text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>pSEO Admin Engine</span>
              </button>
            )}

            <button
              onClick={onNewSearch}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Research a Property</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Directory Links for pSEO & Legal */}
        {onNavigate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-400 pb-6 border-b border-slate-900">
            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Texas Municipal Hubs</span>
              </div>
              <ul className="space-y-1">
                <li><button onClick={() => onNavigate('/state/texas/austin/')} className="hover:text-white cursor-pointer">Austin TX Property Directory</button></li>
                <li><button onClick={() => onNavigate('/state/texas/austin/78701/')} className="hover:text-white cursor-pointer">Zip 78701 (Downtown)</button></li>
                <li><button onClick={() => onNavigate('/state/texas/austin/78704/')} className="hover:text-white cursor-pointer">Zip 78704 (South Lamar / Zilker)</button></li>
                <li><button onClick={() => onNavigate('/state/texas/austin/78746/')} className="hover:text-white cursor-pointer">Zip 78746 (West Lake Hills)</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Editorial Guides</span>
              </div>
              <ul className="space-y-1">
                <li><button onClick={() => onNavigate('/guides/moving-to-austin-tx-2026/')} className="hover:text-white cursor-pointer">Moving to Austin TX in 2026 Guide</button></li>
                <li><button onClick={() => onNavigate('/guides/austin-flood-zones-explained/')} className="hover:text-white cursor-pointer">Austin Flood Zones Explained</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zip Comparisons</span>
              </div>
              <ul className="space-y-1">
                <li><button onClick={() => onNavigate('/compare/78701-vs-78704/')} className="hover:text-white cursor-pointer">78701 vs 78704 Data Comparison</button></li>
                <li><button onClick={() => onNavigate('/compare/78704-vs-78746/')} className="hover:text-white cursor-pointer">78704 vs 78746 Data Comparison</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Legal & Support Policies</span>
              </div>
              <ul className="space-y-1">
                <li><button onClick={() => onNavigate('/support')} className="hover:text-white cursor-pointer font-medium text-slate-300">Customer Support (/support)</button></li>
                <li><button onClick={() => onNavigate('/terms')} className="hover:text-white cursor-pointer text-slate-400">Terms of Service (/terms)</button></li>
                <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white cursor-pointer text-slate-400">Privacy Policy (/privacy)</button></li>
                <li><button onClick={() => onNavigate('/refunds')} className="hover:text-white cursor-pointer text-slate-400">Refund & Cancellation (/refunds)</button></li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BeforeRegret. Brand operated by Atmostellar (Mumbai, MH, India). All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            {onNavigate && (
              <>
                <button onClick={() => onNavigate('/support')} className="hover:text-white cursor-pointer">Support</button>
                <span>•</span>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white cursor-pointer">Terms</button>
                <span>•</span>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white cursor-pointer">Privacy</button>
                <span>•</span>
                <button onClick={() => onNavigate('/refunds')} className="hover:text-white cursor-pointer">Refunds</button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
