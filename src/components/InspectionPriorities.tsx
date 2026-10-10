import React, { useEffect, useState } from 'react';
import { ClipboardCheck, ShieldAlert, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { getInspectionPriorities, PriorityLevel } from '../engine/inspectionPriorities';
import { InspectionPrioritiesReportData, InspectionPriorityWithVendor } from '../types';
import { SponsoredVendorCards } from './SponsoredVendorCard';

interface InspectionPrioritiesProps {
  yearBuilt?: number | null;
  county?: string | null;
  state?: string | null;
  precomputed?: InspectionPrioritiesReportData | null;
}

// Redesigned 2026-10-10 (owner: "more professional and uncluttered"). Each priority is now one row
// in a single card instead of a free-floating block: a checkbox, the title, the action to take and
// the two costs are always visible; the era background ("Why it matters") folds away behind a
// toggle. That background is the longest text in the report and the part a reader needs least on a
// second visit. The checkboxes replace the separate "Your Action List" section, which repeated each
// priority's howToCheck word for word.
//
// PRINT: a collapsed "Why it matters" body is still in the DOM with `hidden print:block`, so the
// exported PDF always carries it. The toggle button itself is hidden in print by index.css; the
// checkbox carries .print-keep so it survives as a box to tick on paper.
const PRIORITY_STYLES: Record<PriorityLevel, { label: string; dot: string; text: string }> = {
  high: { label: 'Check first', dot: 'bg-blue-600', text: 'text-blue-700' },
  medium: { label: 'Worth checking', dot: 'bg-slate-400', text: 'text-slate-600' },
  lower: { label: 'Lower priority', dot: 'bg-slate-300', text: 'text-slate-500' },
};

export const InspectionPriorities: React.FC<InspectionPrioritiesProps> = ({ yearBuilt, county, state, precomputed }) => {
  const result = precomputed !== undefined ? precomputed : getInspectionPriorities(yearBuilt, county, state);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Expand every "Why it matters" before the browser lays out the PDF, so the printed copy matches
  // the CSS fallback even in browsers that snapshot the live layout.
  useEffect(() => {
    const expandAll = () => setOpen(Object.fromEntries((result?.priorities || []).map((p) => [p.id, true])));
    window.addEventListener('beforeprint', expandAll);
    return () => window.removeEventListener('beforeprint', expandAll);
  }, [result]);

  if (!result) return null;

  const renderPriorityItem = (item: (typeof result.priorities)[number]) => {
    const styles = PRIORITY_STYLES[item.priority];
    const isDone = Boolean(done[item.id]);
    const isOpen = Boolean(open[item.id]);
    const vendors = (item as InspectionPriorityWithVendor).sponsoredVendors;
    return (
      <li key={item.id} data-print-block className="py-5 first:pt-0 last:pb-0">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
            aria-pressed={isDone}
            aria-label={isDone ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
            className="print-keep self-start mt-0.5 shrink-0 cursor-pointer"
          >
            {isDone ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className={`font-semibold text-[15px] leading-snug ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {item.title}
              </h3>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${styles.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
                {styles.label}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">{item.howToCheck}</p>

            <div className="space-y-0.5 text-xs leading-relaxed">
              <p>
                <span className="text-slate-500">To check: </span>
                <span className="font-semibold text-slate-800">{item.costToCheck}</span>
              </p>
              {item.typicalRepairCost && (
                <p>
                  <span className="text-slate-500">If found: </span>
                  <span className="font-semibold text-slate-800">{item.typicalRepairCost}</span>
                </p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                aria-expanded={isOpen}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <span>Why it matters</span>
              </button>
              <p className={`${isOpen ? 'block' : 'hidden print:block'} mt-1.5 text-xs text-slate-600 leading-relaxed`}>
                {item.eraBasis}
              </p>
            </div>
          </div>
        </div>

        {/* Contextual vendor match(es) for this item's trade category, if a real vendor has paid
            for it in this ZIP -- present only on the server-precomputed path. Set apart from the
            item by indent and the ad card's own amber treatment. */}
        {vendors && vendors.length > 0 && (
          <div className="mt-3 sm:pl-8">
            <SponsoredVendorCards vendors={vendors} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
      <div className="space-y-1.5 mb-6">
        <div className="flex items-center gap-2 text-slate-900">
          <ClipboardCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <h2 className="text-xl font-serif font-bold tracking-tight">Inspection priorities</h2>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          What tends to matter most for a home built in <strong className="text-slate-800 font-semibold">{result.yearBuilt}</strong> in
          this area, as the year you entered. Not findings about this house. Tick each one off as you go.
        </p>
      </div>

      <ol className="divide-y divide-slate-100">
        {result.priorities.map(renderPriorityItem)}
      </ol>

      {/* Cross-cutting view of items above that already carry a documented insurance impact -- no
          new facts, pulled out of individual eraBasis paragraphs. Rose, not amber: amber is
          reserved for sponsored placements in the report. */}
      {result.insuranceRedFlags.length > 0 && (
        <div data-print-block className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-bold">Insurance red flags for a {result.eraLabel} home</h3>
          </div>
          <ul className="space-y-1 text-sm text-rose-950/80 leading-relaxed list-disc pl-5">
            {result.insuranceRedFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
          <p className="text-xs text-rose-800/80 leading-relaxed">
            Call an insurance agent for a quote before you remove contingencies — not after. Carrier rules vary and this is not a determination that any of the above is actually present in this home.
          </p>
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 mt-6">
        A budgeting guide built from published building-science norms for this construction era and region — not a home
        inspection, a condition assessment, or an opinion of value. Year built is as you entered it and has not been
        independently verified. Costs are typical ranges and vary by contractor and scope; confirm every item with an
        appropriately licensed professional.
      </p>
    </div>
  );
};
