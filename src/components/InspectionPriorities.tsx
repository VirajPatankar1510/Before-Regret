import React from 'react';
import { ClipboardCheck, Info } from 'lucide-react';
import { getInspectionPriorities, PriorityLevel } from '../engine/inspectionPriorities';

interface InspectionPrioritiesProps {
  yearBuilt?: number | null;
  county?: string | null;
}

const PRIORITY_STYLES: Record<PriorityLevel, { label: string; chip: string; rail: string }> = {
  high: {
    label: 'Worth checking first',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    rail: 'bg-blue-600',
  },
  medium: {
    label: 'Worth checking',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    rail: 'bg-slate-400',
  },
  lower: {
    label: 'Lower priority',
    chip: 'bg-slate-100 text-slate-500 border-slate-200',
    rail: 'bg-slate-300',
  },
};

// Renders nothing at all when no rule set covers this (year built, county) pair -- which is the
// honest answer for most US addresses today, since v1 covers one era in one county. Never falls
// back to generic filler, same principle as SponsoredVendorCard rendering nothing without a real
// paying vendor.
export const InspectionPriorities: React.FC<InspectionPrioritiesProps> = ({ yearBuilt, county }) => {
  const result = getInspectionPriorities(yearBuilt, county);
  if (!result) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Where your inspection budget goes furthest</span>
        </div>
        <h3 className="font-sans text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Priorities for {result.eraLabel} in {result.regionLabel}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Based on the year built you entered (<strong className="text-slate-900">{result.yearBuilt}</strong>). These are
          the checks that tend to matter most for homes of this era and area — not findings about this specific house.
        </p>
      </div>

      <div className="space-y-4">
        {result.priorities.map((item) => {
          const styles = PRIORITY_STYLES[item.priority];
          return (
            <div key={item.id} className="flex gap-3.5">
              <div className={`w-1 rounded-full shrink-0 ${styles.rail}`} aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-2 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">{item.title}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.chip}`}>
                    {styles.label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.eraBasis}</p>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <div>
                    <span className="text-slate-500">Cost to check: </span>
                    <span className="font-bold text-slate-900">{item.costToCheck}</span>
                  </div>
                  {item.typicalRepairCost && (
                    <div>
                      <span className="text-slate-500">Typical cost if present: </span>
                      <span className="font-bold text-slate-900">{item.typicalRepairCost}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
                  {item.howToCheck}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          This is a budgeting guide built from published building-science norms for this construction era and region —
          it is not a home inspection, a condition assessment, or an opinion of value, and nothing here is a finding
          about this particular property. Year built is as you entered it and has not been independently verified.
          Costs are typical ranges and vary by contractor and scope. Every item above should be confirmed by an
          appropriately licensed professional.
        </p>
      </div>
    </div>
  );
};
