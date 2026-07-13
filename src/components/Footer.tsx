import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  setView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 sm:py-16 border-t border-slate-800 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Description Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setView('home')}>
            <Logo size={36} />
            <span className="font-logo font-black text-xl tracking-tight text-white">
              Before<span className="text-blue-500">Regret</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
            A premium resident marketplace for home buyers, renters, and migrating professionals in India to check facts before committing to a home.
          </p>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-mono">Marketplace</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => setView('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                Search Localities
              </button>
            </li>
            <li>
              <button onClick={() => setView('explore')} className="hover:text-white transition-colors cursor-pointer text-left">
                Explore Societies
              </button>
            </li>
            <li>
              <button onClick={() => setView('become_expert')} className="hover:text-white transition-colors cursor-pointer text-left font-bold text-blue-400">
                Become a Local Expert
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-mono">Help & Trust</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Before Regret Support Ticket system: Please reach out at support@beforeregret.in'); }} className="hover:text-white transition-colors flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Contact Support</span>
              </a>
            </li>
            <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">How Our Safeguard Works</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Trust Score Calculation</a></li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-mono">Legal & Policies</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Safe Refund Guidelines</a></li>
            <li className="pt-2">
              <button
                onClick={() => setView('admin_panel')}
                className="hover:text-white text-slate-500 font-mono text-[10px] transition-colors cursor-pointer flex items-center gap-1"
              >
                🔒 Admin
              </button>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
        <p>© {new Date().getFullYear()} Before Regret. All Rights Reserved. Built with uncompromised integrity in India.</p>
        <p className="mt-1">All consulting services and resident advice are fully self-declared. Buyer discretion is advised.</p>
      </div>

    </footer>
  );
};
