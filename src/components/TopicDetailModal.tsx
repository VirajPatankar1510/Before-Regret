import React from 'react';
import { TopicKnowledge } from '../types';
import { X, Clock, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface TopicDetailModalProps {
  topic: TopicKnowledge | null;
  onClose: () => void;
  societyName: string;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  societyName,
}) => {
  if (!topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white border border-[#E4E4E7] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E4E4E7] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                {topic.category}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {topic.readingTime}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {topic.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {societyName} • Unvarnished Resident Fact Sheet
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Freshness Banner required by prompt */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status: {topic.freshnessStatus}</span>
            </div>
            <span>Updated {topic.lastUpdated}</span>
          </div>

          {/* Synthesized Natural Paragraph Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Synthesized Resident Summary
            </h3>
            <div className="p-4 bg-[#F7F9FC] border border-[#E4E4E7] rounded-xl text-sm text-slate-800 leading-relaxed font-normal">
              {topic.summary}
            </div>
          </div>

          {/* Structured QA Breakdown required by prompt */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Structured Section Breakdown
            </h3>

            <div className="space-y-3">
              {topic.structuredQA && topic.structuredQA.length > 0 ? (
                topic.structuredQA.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-white border border-[#E4E4E7] rounded-xl space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                        {item.question}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-[#F7F9FC] p-3 rounded-lg border border-slate-100">
                      {item.answer}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Comprehensive topic evaluation verified by resident contributor.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E4E4E7] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
          >
            Close Insight
          </button>
        </div>

      </div>
    </div>
  );
};
