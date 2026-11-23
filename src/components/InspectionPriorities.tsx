import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, TriangleAlert } from 'lucide-react';
import { getInspectionPriorities, insuranceFlagRuleId, PriorityLevel } from '../engine/inspectionPriorities';
import { currentWording } from '../engine/rewordedText';
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
// 2026-11-23 (Apple-style report, owner "go" on docs/mockups/apple-report-mockup-2026-11.html): the items are
// grouped by priority into Settings-style lists. Each row shows a round tick, the title and a short "To check"
// line; tapping the row opens the action, the two costs and "Why it matters". Every word is still the engine's.
// Collapsed text stays in the DOM (`hidden print:block`), so the PDF always carries all of it. Sponsored cards
// sit under their row and are never folded away.
const PRIORITY_STYLES: Record<PriorityLevel, { label: string; dot: string }> = {
  high: { label: 'Check first', dot: 'bg-blue-600' },
  medium: { label: 'Worth checking', dot: 'bg-slate-400' },
  lower: { label: 'Lower priority', dot: 'bg-slate-300' },
};
const PRIORITY_ORDER: PriorityLevel[] = ['high', 'medium', 'lower'];

// The row's one-liner: the "To check" text up to its first dash, and a price range without its "for a ..." tail.
// "$300 – $500 for a camera scope" -> "$300 – $500"; "Free — required for most pre-1978 homes" -> "Free".
function shortCost(cost: string): string {
  let c = cost.split(' — ')[0].split(' -- ')[0].trim();
  if (/^\$/.test(c)) c = c.replace(/\s+for\s.*$/i, '');
  return c.replace(/\.$/, '');
}

export const InspectionPriorities: React.FC<InspectionPrioritiesProps> = ({ yearBuilt, county, state, precomputed }) => {
  const result = precomputed !== undefined ? precomputed : getInspectionPriorities(yearBuilt, county, state);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Expand every row before the browser lays out the PDF, so the printed copy matches the CSS fallback even in
  // browsers that snapshot the live layout.
  useEffect(() => {
    const expandAll = () => setOpen(Object.fromEntries((result?.priorities || []).map((p) => [p.id, true])));
    window.addEventListener('beforeprint', expandAll);
    return () => window.removeEventListener('beforeprint', expandAll);
  }, [result]);

  if (!result) return null;

  // Each red-flag line with the Inspect row it came from (current wording, even on a report saved before a rewording).
  const insuranceFlags = result.insuranceRedFlags.map((flag) => ({ text: currentWording(flag), ruleId: insuranceFlagRuleId(flag) }))
    .map((f) => ({ ...f, ruleId: f.ruleId && result.priorities.some((p) => p.id === f.ruleId) ? f.ruleId : undefined }));

  const openItem = (id: string) => {
    setOpen((o) => ({ ...o, [id]: true }));
    requestAnimationFrame(() => document.getElementById(`priority-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const renderPriorityItem = (item: (typeof result.priorities)[number]) => {
    const isDone = Boolean(done[item.id]);
    const isOpen = Boolean(open[item.id]);
    const vendors = (item as InspectionPriorityWithVendor).sponsoredVendors;
    const panelId = `priority-panel-${item.id}`;
    return (
      <li key={item.id} id={`priority-${item.id}`} data-print-block className="scroll-mt-32">
        <div className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
          <button
            type="button"
            onClick={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
            aria-pressed={isDone}
            aria-label={isDone ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
            className={`print-keep mt-0.5 shrink-0 w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${isDone ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-slate-400'}`}
          >
            {isDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="print-row min-w-0 flex-1 flex items-start gap-3 text-left cursor-pointer"
          >
            <span className="min-w-0 flex-1">
              <span className={`block text-[17px] font-semibold leading-snug ${isDone ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}>
                {item.title}
              </span>
              <span className="block mt-0.5 text-[15px] text-slate-500 leading-snug">To check: {shortCost(item.costToCheck)}</span>
            </span>
            <ChevronRight aria-hidden="true" className={`print:hidden mt-1 w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div id={panelId} className={`${isOpen ? 'block' : 'hidden print:block'} pl-[52px] sm:pl-14 pr-4 sm:pr-6 pb-5 space-y-4`}>
          <p className="text-[17px] text-slate-800 leading-relaxed">{item.howToCheck}</p>
          <dl className="border-t border-slate-200/70 text-[15px]">
            <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5 border-b border-slate-200/70">
              <dt className="text-slate-500">To check</dt>
              <dd className="text-slate-900 tabular-nums">{item.costToCheck}</dd>
            </div>
            {item.typicalRepairCost && (
              <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5 border-b border-slate-200/70">
                <dt className="text-slate-500">If found</dt>
                <dd className="text-slate-900 tabular-nums">{item.typicalRepairCost}</dd>
              </div>
            )}
          </dl>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900">Why it matters. </span>
            {currentWording(item.eraBasis)}
          </p>
        </div>

        {/* Contextual vendor match(es) for this item's trade category, if a real vendor has paid for it in this ZIP --
            present only on the server-precomputed path. Always visible, under its row, in the ad card's own treatment. */}
        {vendors && vendors.length > 0 && (
          <div className="px-4 sm:pl-14 sm:pr-6 pb-4">
            <SponsoredVendorCards vendors={vendors} />
          </div>
        )}
      </li>
    );
  };

  const groups = PRIORITY_ORDER
    .map((level) => ({ level, items: result.priorities.filter((p) => p.priority === level) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div data-print-block className="mb-2">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.025em] text-slate-900">Inspection priorities</h2>
        <p className="mt-2 text-[17px] text-slate-500 leading-relaxed">
          What tends to matter most for a home built in <span className="text-slate-900 font-semibold">{result.yearBuilt}</span> in
          this area. Tick each one off as you go.
        </p>
      </div>

      {groups.map((g) => (
        <div key={g.level}>
          <p className="mt-6 mb-2 ml-4 flex items-center gap-2 text-[13px] text-slate-500 [break-after:avoid]">
            <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[g.level].dot}`} />
            {PRIORITY_STYLES[g.level].label} · {g.items.length}
          </p>
          <ol className="rounded-3xl bg-white divide-y divide-slate-200/70 overflow-hidden">
            {g.items.map(renderPriorityItem)}
          </ol>
        </div>
      ))}

      {/* Cross-cutting view of items above that already carry a documented insurance impact -- no new facts, pulled
          out of the rules' own lines. 2026-11-23 (owner: "yes, do both"): Apple-style emphasis. The card stays white
          and only the icon carries colour (orange-600, never a tinted ground: amber backgrounds are the sponsored
          cards' treatment, so a tinted box could read as an ad). Each line is a row that opens its Inspect item.
          The cover links here ("N things here can affect your insurance"). */}
      {insuranceFlags.length > 0 && (
        <div id="insurance-flags" data-print-block className="scroll-mt-32 mt-8">
          <div className="flex items-center gap-2 ml-4 mb-2 [break-after:avoid]">
            <TriangleAlert aria-hidden="true" className="w-[18px] h-[18px] text-orange-600 shrink-0" strokeWidth={2.25} />
            <h3 className="text-[17px] font-semibold text-slate-900">Ask your insurer about these</h3>
          </div>
          <div className="rounded-3xl bg-white overflow-hidden">
            <ul className="divide-y divide-slate-200/70">
              {insuranceFlags.map(({ text, ruleId }) => {
                const [name, ...rest] = text.split(' — ');
                const detail = rest.join(' — ');
                const body = (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug text-slate-900">{name}</span>
                    {detail && <span className="block mt-0.5 text-[15px] text-slate-500 leading-snug">{detail.charAt(0).toUpperCase() + detail.slice(1)}</span>}
                  </span>
                );
                return (
                  <li key={text}>
                    {ruleId ? (
                      <button
                        type="button"
                        onClick={() => openItem(ruleId)}
                        className="print-row w-full flex items-start gap-3 px-4 sm:px-5 py-3.5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        {body}
                        <ChevronRight aria-hidden="true" className="print:hidden mt-1 w-4 h-4 shrink-0 text-slate-400" />
                      </button>
                    ) : (
                      <div className="flex items-start gap-3 px-4 sm:px-5 py-3.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-slate-200/70 px-4 sm:px-5 py-4 space-y-1.5">
              {/* Dark, not blue: on an Apple page blue means "tap me", and this line is advice, not a link. */}
              <p className="text-[15px] font-semibold text-slate-900 leading-snug">Get a quote before you remove contingencies, not after.</p>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Carrier rules vary, and this is not a determination that any of the above is actually present in this home.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 mx-4 text-xs text-slate-500 leading-relaxed">
        A budgeting guide built from published building-science norms for this construction era and region — not a home
        inspection, a condition assessment, or an opinion of value. The year built is the one you gave us; we haven't
        verified it. Costs are typical ranges and vary by contractor and scope; confirm every item with an
        appropriately licensed professional.
      </p>
    </div>
  );
};
