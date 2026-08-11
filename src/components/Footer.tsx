import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onNewSearch: () => void;
  onNavigate?: (path: string) => void;
}

interface GuideSummary {
  slug: string;
  title: string;
}

export const Footer: React.FC<FooterProps> = ({ onNewSearch, onNavigate }) => {
  const [guides, setGuides] = useState<GuideSummary[]>([]);

  useEffect(() => {
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.articles)) {
          setGuides(data.articles.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 shrink-0" />
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight block">Before Regret</span>
                <span className="text-[10px] font-medium text-slate-500">Check it before you sign it.</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Expert property research guides and vendor marketplace for US home buyers. Uncover what matters before closing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400 pb-6 border-b border-slate-900">
            {guides.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Editorial Guides</span>
                </div>
                <ul className="space-y-1">
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <button onClick={() => onNavigate(`/guides/${guide.slug}/`)} className="hover:text-white cursor-pointer">{guide.title}</button>
                    </li>
                  ))}
                  <li>
                    <button onClick={() => onNavigate('/guides/')} className="hover:text-white cursor-pointer font-bold text-blue-300">View all guides →</button>
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Legal & Support Policies</span>
              </div>
              <ul className="space-y-1">
                <li><button onClick={() => onNavigate('/about')} className="hover:text-white cursor-pointer font-bold text-blue-300">About & Methodology</button></li>
                <li><button onClick={() => onNavigate('/advertise')} className="hover:text-white cursor-pointer font-bold text-blue-300">Advertise With Us</button></li>
                <li><button onClick={() => onNavigate('/support')} className="hover:text-white cursor-pointer font-medium text-slate-300">Customer Support</button></li>
                <li><button onClick={() => onNavigate('/terms')} className="hover:text-white cursor-pointer text-slate-400">Terms of Service</button></li>
                <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white cursor-pointer text-slate-400">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('/refunds')} className="hover:text-white cursor-pointer text-slate-400">Refund & Cancellation</button></li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Before Regret. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};
