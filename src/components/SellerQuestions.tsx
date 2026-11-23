import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Send } from 'lucide-react';
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
// 2026-11-23 (Apple-style report): one numbered list in a white card. The question and "Listen for" stay visible --
// they are what a buyer reads off a phone in front of the agent; "Why ask" folds away (still in the DOM for print).
// "Send to your agent" opens the phone's share sheet with the questions, or copies them where sharing isn't offered.
const PRIORITY_STYLES: Record<QuestionPriority, { label: string; text: string }> = {
  high: { label: 'Ask first', text: 'text-blue-600' },
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

  const questionsText = result.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
  const handleSend = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Questions for the seller', text: questionsText });
        return;
      }
      await navigator.clipboard.writeText(questionsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet closed or clipboard blocked: nothing to do.
    }
  };

  const renderQuestionItem = (item: (typeof result.questions)[number], idx: number) => {
    const styles = PRIORITY_STYLES[item.priority];
    const isOpen = Boolean(open[item.id]);
    const vendors = (item as SellerQuestionWithVendor).sponsoredVendors;
    return (
      <li key={item.id} data-print-block className="px-4 sm:px-5 py-4">
        <div className="flex gap-3">
          <span className="w-6 shrink-0 text-[17px] font-semibold text-slate-400 tabular-nums">{idx + 1}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-[17px] font-semibold leading-snug text-slate-900">{item.question}</h3>
            <p className={`text-[13px] font-medium ${styles.text}`}>{styles.label}</p>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">Listen for: </span>
              {item.whatToListenFor}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                aria-expanded={isOpen}
                className="inline-flex items-center gap-0.5 text-[15px] text-blue-600 hover:underline underline-offset-2 cursor-pointer"
              >
                <span>Why ask</span>
                <ChevronRight aria-hidden="true" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>
              <p className={`${isOpen ? 'block' : 'hidden print:block'} mt-1.5 text-[15px] text-slate-600 leading-relaxed`}>
                {item.whyAsking}
              </p>
            </div>
          </div>
        </div>
        {/* Contextual vendor match(es), if a real vendor has paid for it in this ZIP (see sponsoredVendors.ts) --
            server-precomputed path only, same as InspectionPriorities.tsx. Always visible. */}
        {vendors && vendors.length > 0 && (
          <div className="mt-3 sm:pl-9">
            <SponsoredVendorCards vendors={vendors} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <div data-print-block className="mb-6">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.025em] text-slate-900">Questions for the seller</h2>
        <p className="mt-2 text-[17px] text-slate-500 leading-relaxed">
          For the seller or listing agent, based on what is common for homes built around{' '}
          <span className="text-slate-900 font-semibold">{result.yearBuilt}</span> here. Answers are not checked by Before Regret; get anything important in writing.
        </p>
      </div>

      <ol className="rounded-3xl bg-white divide-y divide-slate-200/70">
        {result.questions.map((q, i) => renderQuestionItem(q, i))}
      </ol>

      <button
        type="button"
        onClick={handleSend}
        className="print:hidden mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-[15px] font-medium text-white cursor-pointer transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        <span>{copied ? 'Questions copied' : 'Send to your agent'}</span>
      </button>
    </div>
  );
};
