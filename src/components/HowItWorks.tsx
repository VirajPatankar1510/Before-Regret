import React from 'react';
import { Search, UserCheck, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 'step-1',
      icon: <Search className="w-6 h-6 text-blue-600" />,
      title: 'Search a location',
      description: 'Enter any housing society, apartment complex, building, or layout across India.',
      color: 'bg-blue-50/70 border-blue-100/50'
    },
    {
      id: 'step-2',
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      title: 'Choose a resident',
      description: 'Browse verified local experts who actually reside there and see their response stats.',
      color: 'bg-emerald-50/70 border-emerald-100/50'
    },
    {
      id: 'step-3',
      icon: <MessageSquare className="w-6 h-6 text-amber-600" />,
      title: 'Ask your question',
      description: 'Get firsthand answers to unvarnished facts about rules, water supply, and general maintenance.',
      color: 'bg-amber-50/70 border-amber-100/50'
    }
  ];

  return (
    <section className="bg-slate-50/50 py-16 sm:py-20 border-b border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-widest uppercase mt-2">
            Three simple steps to unvarnished local truth
          </p>
        </div>

        {/* 3 Grid Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className="bg-white border border-slate-200/60 p-6 sm:p-8 rounded-2xl shadow-2xs relative flex flex-col justify-between group hover:border-slate-300 transition-all"
            >
              <div>
                {/* Icon Circle */}
                <div className={`p-3.5 rounded-xl border inline-block ${step.color} mb-6`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              {/* Decorative Step Indicator */}
              <span className="absolute top-4 right-4 text-[44px] font-black font-display text-slate-100 select-none leading-none">
                0{idx + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Protection Banner */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto shadow-3xs">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              Dual-Protected Escrow Safeguard
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
              Your payment is held securely in escrow. Funds are only transferred to the resident after they have answered your questions. Otherwise, get an instant 100% refund.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
