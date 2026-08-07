import React, { useState } from 'react';
import { MessageCircleQuestion, ChevronDown, Info, Copy, Check } from 'lucide-react';
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

const PRIORITY_CHIP: Record<QuestionPriority, string> = {
  high: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-slate-100 text-slate-700 border-slate-200',
  lower: 'bg-slate-100 text-slate-500 border-slate-200',
};

// Collapsed by default -- each question is one line until tapped. With up to 8 questions
// possible for an older home in a soil-region county, showing why-asking + what-to-listen-for
// for all of them at once would read as a wall of text rather than a short checklist you can
// actually bring to a call with your agent. Renders nothing at all when no rule applies, same
// principle as InspectionPriorities.
export const SellerQuestions: React.FC<SellerQuestionsProps> = ({
  yearBuilt,
  county,
  state,
  declaredPropertyType,
  precomputed,
}) => {
  const result =
    precomputed !== undefined ? precomputed : getSellerQuestions(yearBuilt, county, state, declaredPropertyType);
  const [openId, setOpenId] = useState<string | null>(null);
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
            className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
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
          property's era and area. Tap a question to see why it's worth asking and what to listen for in the answer.
        </p>
      </div>

      <div className="space-y-2">
        {result.questions.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_CHIP[item.priority]}`}
                >
                  {item.priority === 'high' ? 'Ask first' : item.priority === 'medium' ? 'Ask' : 'If relevant'}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.whyAsking}</p>
                  <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
                    <span className="font-bold text-slate-900">Listen for: </span>
                    {item.whatToListenFor}
                  </p>
                </div>
              )}
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
