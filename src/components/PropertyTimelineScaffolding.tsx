import React from 'react';
import { Calendar, ShieldCheck, Wrench, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';

interface PropertyTimelineScaffoldingProps {
  yearBuilt: number;
}

export const PropertyTimelineScaffolding: React.FC<PropertyTimelineScaffoldingProps> = ({ yearBuilt }) => {
  // Build dynamic timeline milestones based on construction era
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;

  const milestones = [
    {
      year: yearBuilt,
      tag: 'Construction Year',
      title: 'Original Structure Built',
      description: `Built in ${yearBuilt}. Standard construction methods, electrical, and plumbing codes of the mid-1980s era applied at time of initial municipal inspection.`,
      status: 'VERIFIED RECORD' as const,
      icon: Calendar,
      color: 'bg-slate-900 text-white border-slate-900'
    },
    {
      year: Math.min(yearBuilt + 12, 1996),
      tag: 'Code Milestone',
      title: '1996 NEC Electrical Code Update',
      description: 'National Electrical Code required GFCI protection near all wet locations and phased out non-grounded circuit branches in residential renovations.',
      status: 'ERA EXPECTATION' as const,
      icon: ShieldCheck,
      color: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      year: Math.max(yearBuilt + 20, 2008),
      tag: 'Permit Archive Window',
      title: 'Roof & Major Systems Permit Window',
      description: '20-year typical lifespan threshold for original roofing shingles and central HVAC condenser units. Municipal permit archives searched for major replacement records.',
      status: 'NEEDS VERIFICATION' as const,
      icon: AlertTriangle,
      color: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      year: 2015,
      tag: 'Permit Record',
      title: 'Electrical Panel Inspection & Permit',
      description: '200-Amp main panel replacement and service upgrade permit recorded and passed final inspection with city building department.',
      status: 'VERIFIED RECORD' as const,
      icon: FileCheck,
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      year: currentYear,
      tag: 'Present Day Focus',
      title: 'Physical Walkthrough & Verification Focus',
      description: 'Targeted focus items for buyer walkthrough: roof shingle condition, attic insulation depth, central AC manufacture dataplate, and perimeter drainage.',
      status: 'NEEDS VERIFICATION' as const,
      icon: Wrench,
      color: 'bg-slate-100 text-slate-900 border-slate-300'
    }
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="text-[11px] font-mono font-bold text-blue-700 uppercase tracking-widest">
            Visual Building Timeline
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Property Timeline & Building Era Milestones
          </h3>
        </div>
        <div className="text-xs font-mono font-bold bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700">
          Age: {age} Years ({yearBuilt})
        </div>
      </div>

      {/* Vertical Timeline Bar */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300">
        {milestones.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2 group">
              
              {/* Timeline Dot / Icon */}
              <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              </div>

              {/* Milestone Content */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded-md">
                    {m.year}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {m.tag}
                  </span>
                  <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    m.status === 'VERIFIED RECORD' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    m.status === 'ERA EXPECTATION' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    [{m.status}]
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {m.title}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                  {m.description}
                </p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
