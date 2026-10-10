import React, { useEffect, useState } from 'react';
import { MessageCircleQuestion, Copy, Check, ChevronDown } from 'lucide-react';
import { getSellerQuestions, QuestionPriority, DeclaredPropertyType } from '../engine/sellerQuestions';
import { SellerQuestionsReportData, SellerQuestionWithVendor } from '../types';
import { SponsoredVendorCards } from './SponsoredVendorCard';

interface SellerQuestionsProps {
  yearBuilt?: number | null;
  county?: string | null;
  state?: string | null;
  declaredPropertyType?: DeclaredPropertyType | null;
  precomputed?: SellerQuestionsReportData | null;
}

// Redesigned 2026-10-10 alongside InspectionPriorities.tsx: one numbered list in a single card. The
// question and "Listen for" (what a reassuring answer sounds like) stay visible -- they are what a
// buyer reads off a phone in front of the agent; the reasoning ("Why ask") folds away. Collapsed
// text stays in the DOM with `hidden print:block`, so the PDF always carries it.
const PRIORITY_STYLES: Record<QuestionPriority, { label: string; text: string }> = {
  high: { label: 'Ask first', text: 'text-blue-700' },
  medium: { label: 'Ask', text: 'text-slate-500' },
  lower: { label: 'If relevant', text: 'text-slate-400' },
};

export const SellerQuestions: React.FC<SellerQuestionsProps> = ({
  yearBuilt,
  county,
  state,
  declaredPropertyType,
  precomputed,
}) => {
  const result =
    precomputed !== undefined ? precomputed : getSellerQuestions(yearBuilt, county, state, declaredPropertyType);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const expandAll = () => setOpen(Object.fromEntries((result?.questions || []).map((q) => [q.id, true])));
    window.addEventListener('beforeprint', expandAll);
    return () => window.removeEventListener('beforeprint', expandAll);
  }, [result]);

  if (!result) return null;

  const handleCopy = () => {
    const text = result.questions.map((q) => `- ${q.question}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderQuestionItem = (item: (typeof result.questions)[number], idx: number) => {
    const styles = PRIORITY_STYLES[item.priority];
    const isOpen = Boolean(open[item.id]);
    const vendors = (item as SellerQuestionWithVendor).sponsoredVendors;
    return (
      <li key={item.id} data-print-block className="py-5 first:pt-0 last:pb-0">
        <div className="flex gap-3">
          <span className="self-start shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5 tabular-nums">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-semibold text-[15px] leading-snug text-slate-900">{item.question}</h3>
              <span className={`text-[11px] font-semibold ${styles.text}`}>{styles.label}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Listen for: </span>
              {item.whatToListenFor}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                aria-expanded={isOpen}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <span>Why ask</span>
              </button>
              <p className={`${isOpen ? 'block' : 'hidden print:block'} mt-1.5 text-xs text-slate-600 leading-relaxed`}>
                {item.whyAsking}
              </p>
            </div>
          </div>
        </div>
        {/* Contextual vendor match(es), if a real vendor has paid for it in this ZIP (see
            sponsoredVendors.ts) -- server-precomputed path only, same as InspectionPriorities.tsx. */}
        {vendors && vendors.length > 0 && (
          <div className="mt-3 sm:pl-9">
            <SponsoredVendorCards vendors={vendors} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
      <div className="space-y-1.5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900">
            <MessageCircleQuestion className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-serif font-bold tracking-tight">Questions for the seller</h2>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer print:hidden"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy all'}</span>
          </button>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          For the seller or listing agent, based on the year you entered (<strong className="text-slate-800 font-semibold">{result.yearBuilt}</strong>)
          and what is common for homes of that era here. Answers are not checked by Before Regret; get anything important in writing.
        </p>
      </div>

      <ol className="divide-y divide-slate-100">
        {result.questions.map((q, i) => renderQuestionItem(q, i))}
      </ol>
    </div>
  );
};
