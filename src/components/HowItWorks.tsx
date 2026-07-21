import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 'step-1',
      title: '1. Search a location',
      description: 'Enter any housing society, apartment complex, or layout across India.',
    },
    {
      id: 'step-2',
      title: '2. Choose a resident',
      description: 'Browse resident guides who actually reside there and check their stats.',
    },
    {
      id: 'step-3',
      title: '3. Ask your question',
      description: 'Get firsthand answers to key facts about water, rules, and maintenance.',
    }
  ];

  return (
    <section className="bg-slate-50/40 py-5 sm:py-6 border-b border-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 3 Grid Steps (No icons, no numbers overlay, very clean and compact layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="bg-white border border-slate-100 p-3 sm:p-3.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all text-center md:text-left"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                {step.title}
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

