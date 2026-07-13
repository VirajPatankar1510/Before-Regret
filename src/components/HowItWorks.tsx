import React from 'react';
import { Search, UserCheck, MessageSquare, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 'step-1',
      icon: <Search className="w-5 h-5 text-blue-600" />,
      title: 'Search a location',
      description: 'Enter any housing society, apartment complex, building, or layout across India.',
      color: 'bg-blue-50/70 border-blue-100/50'
    },
    {
      id: 'step-2',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Choose a resident',
      description: 'Browse local experts who actually reside there and see their response stats.',
      color: 'bg-emerald-50/70 border-emerald-100/50'
    },
    {
      id: 'step-3',
      icon: <MessageSquare className="w-5 h-5 text-amber-600" />,
      title: 'Ask your question',
      description: 'Get firsthand answers to key facts about rules, water supply, and general maintenance.',
      color: 'bg-amber-50/70 border-amber-100/50'
    }
  ];

  return (
    <section className="bg-slate-50/50 py-6 sm:py-8 border-b border-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Section Title */}
        <div className="text-center mb-5 sm:mb-6">
          <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
            Three simple steps to direct local truth
          </p>
        </div>

        {/* 3 Grid Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className="bg-white border border-slate-200/60 p-3.5 sm:p-4 rounded-lg shadow-2xs relative flex flex-col justify-between group hover:border-slate-300 transition-all"
            >
              <div>
                {/* Icon Circle */}
                <div className={`p-2 rounded-md border inline-block ${step.color} mb-3`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              {/* Decorative Step Indicator */}
              <span className="absolute top-2.5 right-3.5 text-2xl font-black font-display text-slate-100 select-none leading-none">
                0{idx + 1}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
