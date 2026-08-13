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
  articleType?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNewSearch, onNavigate }) => {
  const [guides, setGuides] = useState<GuideSummary[]>([]);

  useEffect(() => {
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.articles)) {
          // Evergreen guides only -- /api/guides returns every published article newest-first,
          // which now includes timely FEMA county-event pieces and data-comparison reports
          // alongside the evergreen "how to" guides this list was built to showcase. A footer
          // that mixes "Does Buying a House Reset Property Tax Assessment" with "FEMA Declaration
          // DR-4906-WA" reads as incoherent -- a first-time visitor can't tell what the site is
          // from a list like that. Filtering to article_type = 'guide' keeps this list what it
          // was meant to be: a first impression of the evergreen editorial content.
          setGuides(data.articles.filter((a: GuideSummary) => (a.articleType ?? 'guide') === 'guide').slice(0, 4));
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
                <span className="text-[10px] font-medium text-slate-400">Check it before you sign it.</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Expert property research guides for US home buyers. Uncover what matters before closing.
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
                <ul className="space-y-2">
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <button onClick={() => onNavigate(`/guides/${guide.slug}/`)} className="hover:text-white cursor-pointer block py-1.5">{guide.title}</button>
                    </li>
                  ))}
                  <li>
                    <button onClick={() => onNavigate('/guides/')} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">View all guides →</button>
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Legal & Support Policies</span>
              </div>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('/about')} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">About & Methodology</button></li>
                <li><button onClick={() => onNavigate('/advertise')} className="hover:text-white cursor-pointer font-bold text-blue-300 block py-1.5">Advertise With Us</button></li>
                <li><button onClick={() => onNavigate('/support')} className="hover:text-white cursor-pointer font-medium text-slate-300 block py-1.5">Customer Support</button></li>
                <li><button onClick={() => onNavigate('/terms')} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Terms of Service</button></li>
                <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('/refunds')} className="hover:text-white cursor-pointer text-slate-400 block py-1.5">Refund & Cancellation</button></li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Before Regret. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};
