import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ShieldCheck, HelpCircle, FileText, CheckCircle2, AlertTriangle, RefreshCw, ThumbsUp, ThumbsDown, DollarSign, Check, Lock } from 'lucide-react';

export interface AiReportSection {
  topicId?: string;
  topicTitle: string;
  overallSummary: string;
  everydayLifeImpact: string;
  thingsToKeepInMind: string;
  positiveAspects: string;
  questionsToClarify: string;
  finalAssessment: string;
}

export interface AiReportData {
  overallSummary: string;
  sections: AiReportSection[];
}

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyName: string;
  locality?: string;
  city?: string;
  residentType?: string;
  yearsLiving?: number;
  topicsData: Array<{
    topicId: string;
    topicTitle: string;
    qaList: Array<{ question: string; answer: string }>;
  }>;
  onReattemptQuestionnaire?: () => void;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({
  isOpen,
  onClose,
  societyName,
  locality,
  city,
  residentType = 'Resident',
  yearsLiving = 3,
  topicsData,
  onReattemptQuestionnaire,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReportData | null>(null);
  const [activeTab, setActiveTab] = useState<number>(-1); // Default to full report PDF view

  // Approval & Re-attempt State
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected_first' | 'final_rejected'>('pending');
  const [hasReattempted, setHasReattempted] = useState<boolean>(false);
  const [showRejectOptions, setShowRejectOptions] = useState<boolean>(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyName,
          locality,
          city,
          residentType,
          yearsLiving,
          topicsData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI report.');
      }

      setReport(data.report);
      setApprovalStatus('pending');
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Unable to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report && !loading && topicsData.length > 0) {
      generateReport();
    }
  }, [isOpen]);

  const handleApprove = () => {
    setApprovalStatus('approved');
  };

  const handleRejectClick = () => {
    if (hasReattempted) {
      setApprovalStatus('final_rejected');
    } else {
      setShowRejectOptions(true);
    }
  };

  const handleConfirmReattempt = () => {
    setHasReattempted(true);
    setShowRejectOptions(false);
    if (onReattemptQuestionnaire) {
      onReattemptQuestionnaire();
    } else {
      generateReport();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/30 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Resident Intelligence Report
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase rounded border border-blue-400/30">
                  AI Intelligence Product
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {societyName} {locality ? `• ${locality}` : ''} {city ? `(${city})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {/* Zero Hallucination Guarantee Banner */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900">Evidence Interpreter Guarantee: </strong>
              This report is generated strictly from resident questionnaire responses. Every statement is traceable, objective, and tailored for prospective buyers & tenants in Indian residential societies.
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Synthesizing Resident Intelligence Report...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gemini AI is executing strict evidence interpretation based on resident input.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <div className="text-sm font-semibold text-red-900">{error}</div>
              <button
                onClick={generateReport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Retry Report Generation
              </button>
            </div>
          )}

          {/* Report Display Container (Target for PDF Render) */}
          {report && !loading && (
            <div className="space-y-6">

              {/* Contributor Verification Card */}
              <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Contributor Verification Step</span>
                    {approvalStatus === 'approved' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Approved for Marketplace (₹129/topic)
                      </span>
                    )}
                    {hasReattempted && approvalStatus !== 'approved' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                        Final Review Attempt
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Price: ₹129 / main topic</span>
                </div>

                {approvalStatus === 'pending' && !showRejectOptions && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">
                      Please review the generated report below. Do you approve this content for publication to buyers?
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRejectClick}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>I Need Changes</span>
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Approve Report</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Show Re-Attempt Modal Options */}
                {showRejectOptions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                    <div className="text-xs text-amber-900 font-semibold">
                      Would you like to answer the questionnaire one more time to refine the report?
                    </div>
                    <p className="text-[11px] text-amber-800 leading-normal">
                      <strong>Important Notice:</strong> You can re-attempt answering the questions once. This second attempt will be your final opportunity to adjust responses before final publication.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setShowRejectOptions(false)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmReattempt}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Answer Questionnaire (Final)</span>
                      </button>
                    </div>
                  </div>
                )}

                {approvalStatus === 'final_rejected' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    You have completed your final re-attempt limit. The report below represents the final synthesized version based on your answers.
                  </div>
                )}

                {approvalStatus === 'approved' && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                    <span className="text-xs text-emerald-900 font-medium">
                      Thank you! This report is approved and generated as a read-only Resident Intelligence Report (₹129/topic product).
                    </span>
                    <div className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shrink-0">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Non-Downloadable Report</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Printable PDF Canvas Wrapper */}
              <div ref={reportContainerRef} className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 space-y-6">
                
                {/* PDF Printable Header */}
                <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-1">
                      Resident Intelligence Platform
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {societyName}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      {locality ? `${locality}, ` : ''}{city ? city : ''} • Resident Analysis
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white p-3 rounded-xl shrink-0 text-right space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Report Product
                    </div>
                    <div className="text-sm font-extrabold text-blue-400">
                      ₹129 per main question topic
                    </div>
                  </div>
                </div>

                {/* Overall Executive Summary */}
                <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Executive Summary</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {report.overallSummary}
                  </p>
                </div>

                {/* All Topics 6-Section Breakdowns for Complete PDF Generation */}
                {report.sections && report.sections.length > 0 && (
                  <div className="space-y-8">
                    
                    {/* Interactive Tab Navigation for On-Screen Reading */}
                    <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 no-print">
                      <button
                        type="button"
                        onClick={() => setActiveTab(-1)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeTab === -1
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Topics (Full PDF View)
                      </button>
                      {report.sections.map((sec, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveTab(idx)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === idx
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {sec.topicTitle}
                        </button>
                      ))}
                    </div>

                    {/* Topic Sections Renderer */}
                    {report.sections
                      .filter((_, idx) => activeTab === -1 || activeTab === idx)
                      .map((sec, secIdx) => (
                        <div key={secIdx} className="space-y-4 pt-2 border-b border-slate-100 pb-6 last:border-0">
                          
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <h3 className="text-base font-bold text-slate-900">
                              {sec.topicTitle}
                            </h3>
                            <span className="text-[11px] font-medium text-slate-500">
                              Topic Insight #{secIdx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* 1. Overall Summary */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <span>1. Overall Summary</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {sec.overallSummary}
                              </p>
                            </div>

                            {/* 2. What This Means in Everyday Life */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                <span>2. Everyday Life Impact</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {sec.everydayLifeImpact}
                              </p>
                            </div>

                            {/* 3. Things Worth Keeping in Mind */}
                            <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>3. Things Worth Keeping in Mind</span>
                              </div>
                              <p className="text-xs text-amber-900 leading-relaxed">
                                {sec.thingsToKeepInMind}
                              </p>
                            </div>

                            {/* 4. Positive Aspects */}
                            <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>4. Positive Aspects</span>
                              </div>
                              <p className="text-xs text-emerald-900 leading-relaxed">
                                {sec.positiveAspects}
                              </p>
                            </div>

                            {/* 5. Questions You May Want to Clarify */}
                            <div className="p-4 bg-blue-50/70 border border-blue-200/90 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>5. Questions You May Want to Clarify</span>
                              </div>
                              <p className="text-xs text-blue-900 leading-relaxed">
                                {sec.questionsToClarify}
                              </p>
                            </div>

                            {/* 6. Final Assessment */}
                            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl space-y-1.5">
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                                <span>6. Final Assessment</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {sec.finalAssessment}
                              </p>
                            </div>

                          </div>

                        </div>
                      ))}
                  </div>
                )}

                {/* PDF Footer Disclaimer */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Resident Intelligence Platform • ₹129/topic Intelligence Report</span>
                  <span>Zero Hallucination Standard Applied</span>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600 font-semibold">
              Product Price: <strong className="text-slate-900 font-bold">₹129 per topic</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Read-Only PDF View (Non-Downloadable)</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
