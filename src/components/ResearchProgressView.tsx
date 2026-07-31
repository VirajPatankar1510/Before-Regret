import React, { useState, useEffect } from 'react';
import { Search, Database, ShieldCheck, Cpu, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { PropertySearchResult } from '../types';

interface ResearchProgressViewProps {
  property: PropertySearchResult;
  onComplete: () => void;
}

interface StepItem {
  id: string;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

const RESEARCH_STEPS: StepItem[] = [
  {
    id: 'public_records',
    label: 'Searching public records...',
    subLabel: 'County Tax Assessor, Clerk Deeds, Deed Liens, Building Permits',
    icon: Database
  },
  {
    id: 'environmental',
    label: 'Searching environmental databases...',
    subLabel: 'FEMA Flood Hazard Layers, EPA Superfund, AQI, USGS Indoor Radon',
    icon: ShieldCheck
  },
  {
    id: 'government',
    label: 'Searching government datasets...',
    subLabel: 'USFS Wildfire Risk, NOAA Severe Weather, FAA Flight Paths, FRA Rail Lines',
    icon: Search
  },
  {
    id: 'infrastructure',
    label: 'Analyzing nearby infrastructure...',
    subLabel: 'State DOT Capital Projects, Power Grid Logs, FCC Fiber Broadband',
    icon: Cpu
  },
  {
    id: 'insights',
    label: 'Generating buyer insights...',
    subLabel: 'Synthesizing verification points, seller questions & visit checklist',
    icon: Sparkles
  }
];

export const ResearchProgressView: React.FC<ResearchProgressViewProps> = ({
  property,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [usefulItemsCount, setUsefulItemsCount] = useState(0);

  // Animate progress steps
  useEffect(() => {
    // Sources increment interval
    const sourcesInterval = setInterval(() => {
      setSourcesCount(prev => (prev < 27 ? prev + 1 : 27));
    }, 120);

    // Useful items increment interval
    const itemsInterval = setInterval(() => {
      setUsefulItemsCount(prev => (prev < 18 ? prev + 1 : 18));
    }, 180);

    // Steps sequence
    const stepTimer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < RESEARCH_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepTimer);
          setTimeout(() => {
            onComplete();
          }, 800);
          return prev;
        }
      });
    }, 1200);

    return () => {
      clearInterval(sourcesInterval);
      clearInterval(itemsInterval);
      clearInterval(stepTimer);
    };
  }, [onComplete]);

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / RESEARCH_STEPS.length) * 100));

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Live Public Record Investigation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Researching Property
          </h2>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto truncate">
            {property.displayName || property.formattedAddress}
          </p>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {sourcesCount} <span className="text-slate-400 text-lg font-normal">/ 27</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Public Sources Scanned
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {usefulItemsCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Useful Record Findings
            </div>
          </div>
        </div>

        {/* Step Items List */}
        <div className="space-y-3.5">
          {RESEARCH_STEPS.map((step, idx) => {
            const IconComponent = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                    : isCurrent
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100 text-slate-900 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-bold ${
                      isDone
                        ? 'text-emerald-950'
                        : isCurrent
                        ? 'text-blue-950'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      isDone
                        ? 'text-emerald-700 font-medium'
                        : isCurrent
                        ? 'text-blue-700 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.subLabel}
                  </div>
                </div>

                {isDone && (
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider shrink-0">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Synthesizing official public datasets into actionable buyer intelligence...</span>
        </div>

      </div>
    </div>
  );
};
