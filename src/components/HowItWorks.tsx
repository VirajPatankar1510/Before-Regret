import React from 'react';
import { Search, HelpCircle, KeyRound } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Search,
      title: 'Search',
      desc: 'Find the society by name, locality, or city.',
    },
    {
      num: '02',
      icon: HelpCircle,
      title: 'Browse',
      desc: 'Choose the questions you need answered.',
    },
    {
      num: '03',
      icon: KeyRound,
      title: 'Unlock',
      desc: 'Unlock resident\'s answer for Rs. 129.',
    },
  ];

  return (
    <section className="py-6 sm:py-8 bg-slate-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Compact 3-Step Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num}
                className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      {step.num}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};




