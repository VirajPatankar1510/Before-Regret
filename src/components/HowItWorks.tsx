import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-4 sm:py-5 bg-[#F7F9FC] border-b border-[#E4E4E7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-white border border-[#E4E4E7] rounded-lg p-3 sm:p-3.5 text-center sm:text-left">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 tracking-tight">
              Search
            </h3>
            <p className="text-xs text-slate-600 leading-snug">
              Find the society by name, locality, or city.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-lg p-3 sm:p-3.5 text-center sm:text-left">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 tracking-tight">
              Browse
            </h3>
            <p className="text-xs text-slate-600 leading-snug">
              Explore resident profiles and available topic breakdowns.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-lg p-3 sm:p-3.5 text-center sm:text-left flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 tracking-tight">
                Unlock
              </h3>
              <p className="text-xs text-slate-600 leading-snug">
                Unlock this resident's experience for Rs.{' '}
                <span className="select-none blur-[4px] bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono font-bold inline-block">
                  9,999
                </span>
              </p>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-slate-500 select-none">
              <motion.span
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Scroll Down to reveal price
              </motion.span>
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


