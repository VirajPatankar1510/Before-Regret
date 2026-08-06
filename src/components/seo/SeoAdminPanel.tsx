import React from 'react';
import { Hammer, CheckCircle2 } from 'lucide-react';

interface SeoAdminPanelProps {
  onNavigate: (path: string) => void;
}

// The previous version of this panel had four tabs (Directory, Inspector, Content Queue,
// Sitemaps) that looked like a working publishing pipeline but weren't -- "Publish" just flipped
// a string in local React state and reset on refresh; the fact-check logs, keyword volumes, and
// article bodies were all typed in by hand rather than generated or verified. It was gutted
// rather than patched, same as the fabricated-stats pSEO pages it fed into (see
// src/data/seoDataset.ts). A real version -- writing to Neon, so "publish" means something -- is
// being built next. This stub exists so the admin route keeps compiling and the honest state is
// visible in the meantime, rather than leaving fake controls live behind the password gate.
export const SeoAdminPanel: React.FC<SeoAdminPanelProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto">
          <Hammer className="w-6 h-6 text-blue-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Article editor is being rebuilt</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The old version of this page showed a "publish" button that didn't actually publish anything —
            it only changed something on your screen, not on the live site. Rather than leave that in place,
            it's been removed while the real version is built: write an article, see it save for real, then
            publish it for real.
          </p>
        </div>
        <div className="text-left bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Already done</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>36 pages built on invented statistics were removed from the live site and the sitemap</li>
            <li>Database connection is configured</li>
          </ul>
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="text-xs text-slate-400 hover:text-white font-medium underline underline-offset-2"
        >
          Back to homepage
        </button>
      </div>
    </div>
  );
};
