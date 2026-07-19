import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  setView: (view: string) => void;
  onNavigateToPolicy?: (tab: 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer') => void;
}

export const Footer: React.FC<FooterProps> = ({ setView, onNavigateToPolicy }) => {
  const handlePolicyClick = (e: React.MouseEvent, tab: 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer') => {
    e.preventDefault();
    if (onNavigateToPolicy) {
      onNavigateToPolicy(tab);
    } else {
      setView('policies');
    }
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 sm:py-16 border-t border-slate-800 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Brand Description Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => { setView('home'); window.scrollTo(0, 0); }}>
            <Logo size={36} />
            <span className="font-logo font-black text-xl tracking-tight text-white">
              Before<span className="text-blue-500">Regret</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
            A premium resident marketplace for home buyers, renters, and migrating professionals in India to check facts before committing to a home.
          </p>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-mono">Legal & Policies</h4>
          <ul className="grid grid-cols-2 md:grid-cols-1 gap-2 text-xs">
            <li>
              <a href="/legal-disclaimer" onClick={(e) => handlePolicyClick(e, 'disclaimer')} className="hover:text-white transition-colors text-amber-500 font-semibold">
                ⚠ Legal Disclaimer
              </a>
            </li>
            <li>
              <a href="/terms-and-conditions" onClick={(e) => handlePolicyClick(e, 'terms')} className="hover:text-white transition-colors">
                Terms & Conditions
              </a>
            </li>
            <li>
              <a href="/privacy-policy" onClick={(e) => handlePolicyClick(e, 'privacy')} className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/refund-policy" onClick={(e) => handlePolicyClick(e, 'refunds')} className="hover:text-white transition-colors">
                Refund & Cancellation
              </a>
            </li>
            <li>
              <a href="/shipping-policy" onClick={(e) => handlePolicyClick(e, 'shipping')} className="hover:text-white transition-colors">
                Service Fulfillment
              </a>
            </li>
            <li>
              <a href="/contact-us" onClick={(e) => handlePolicyClick(e, 'contact')} className="hover:text-white transition-colors font-medium text-blue-400">
                Contact Us (Support)
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer copyright and legally protective disclaimer */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 space-y-4 text-center text-[10px] text-slate-500 font-mono">
        <p>© {new Date().getFullYear()} Before Regret. Operated by Atmostellar. All Rights Reserved. Built in India.</p>
      </div>

    </footer>
  );
};
