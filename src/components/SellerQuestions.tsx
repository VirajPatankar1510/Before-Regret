import React, { useState } from 'react';
import { MessageCircleQuestion, Info, Copy, Check } from 'lucide-react';
import { getSellerQuestions, QuestionPriority, DeclaredPropertyType } from '../engine/sellerQuestions';
import { SellerQuestionsReportData } from '../types';

interface SellerQuestionsProps {
  yearBuilt?: number | null;
  county?: string | null;
  state?: string | null;
  declaredPropertyType?: DeclaredPropertyType | null;
  // If provided, skip client-side computation and render this directly -- same dual-mode pattern
  // as InspectionPriorities.tsx (see the comment there). Takes precedence over the individual
  // props when present.
  precomputed?: SellerQuestionsReportData | null;
}

const PRIORITY_STYLES: Record<QuestionPriority, { label: string; chip: string; rail: string }> = {
  high: {
    label: 'Ask first',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    rail: 'bg-blue-600',
  },
  medium: {
    label: 'Ask',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    rail: 'bg-slate-400',
  },
  lower: {
    label: 'If relevant',
    chip: 'bg-slate-100 text-slate-500 border-slate-200',
    rail: 'bg-slate-300',
  },
};

// Every question renders fully expanded, matching InspectionPriorities' rail layout. This was
// previously a tap-to-open accordion, which hid why-asking / what-to-listen-for behind an
// interaction -- fine on screen, but it meant a printed or PDF-exported report lost that content
// entirely (collapsed panels don't print), and the paid report is explicitly meant to be
// PDF-friendly. Renders nothing at all when no rule applies, same principle as
// InspectionPriorities.
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

  if (!result) return null;

  const handleCopy = () => {
    const text = result.questions.map((q) => `- ${q.question}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            <span>Questions for seller</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer print:hidden"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy questions'}</span>
          </button>
        </div>
        <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
          Questions to ask the seller or listing agent
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Based on the year built you entered (<strong className="text-slate-900">{result.yearBuilt}</strong>) and this
          property's era and area.
        </p>
      </div>

      <div className="space-y-4">
        {result.questions.map((item) => {
          const styles = PRIORITY_STYLES[item.priority];
          return (
            <div key={item.id} data-print-block className="flex gap-3.5">
              <div className={`w-1 rounded-full shrink-0 ${styles.rail}`} aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-2 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">{item.question}</h4>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.chip}`}
                  >
                    {styles.label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.whyAsking}</p>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
                  <span className="font-bold text-slate-900">Listen for: </span>
                  {item.whatToListenFor}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          These are questions to ask, not verified answers -- BeforeRegret has not independently confirmed anything a
          seller or agent tells you. Get anything important in writing and confirm it with a licensed professional
          before your option period ends.
        </p>
      </div>
    </div>
  );
};
