import React from 'react';
import { Check } from 'lucide-react';

interface PricingSectionProps {
  onScrollToSearch?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onScrollToSearch }) => {
  const handleGoToMap = () => {
    if (onScrollToSearch) {
      onScrollToSearch();
    } else {
      const el = document.getElementById('address-search-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="what-we-found" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 home-reveal">
      
      {/* Header. 2026-10-05, owner: reports are 100% free for home buyers. A second card that
          explained how the site is paid for was removed the same day at the owner's direction. */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">
          Free for Home Buyers
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          No sign-up, no card, no subscription. Check every house you&rsquo;re considering.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white border border-home-linen rounded-3xl p-8 shadow-sm relative flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Every Report</span>
                <h3 className="font-sans text-xl font-bold text-slate-900">Free, no sign-up</h3>
              </div>
              <div className="text-3xl font-black text-blue-600">$0</div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>What to ask the seller</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>What to inspect first, for its age and county</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Earthquake risk for the exact address</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Opens as a link you can come back to</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGoToMap}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            Check an address
          </button>
        </div>
      </div>

    </section>
  );
};

