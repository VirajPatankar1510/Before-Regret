import React, { useState } from 'react';
import { 
  Printer, MapPin, Building, ExternalLink, Sparkles, 
  ShieldCheck, AlertTriangle, CheckCircle2, HelpCircle, 
  DollarSign, Lightbulb, Compass, Copy, Check, ChevronRight, Eye,
  Clock, CheckSquare, Square, FileCheck, Layers, Info, ArrowUpRight,
  ShieldAlert, Sparkle, AlertCircle
} from 'lucide-react';
import { PropertyReport, ConfidenceLevel, VisitChecklistItem } from '../types';

interface PropertyReportViewProps {
  report: PropertyReport;
  onNewSearch: () => void;
}

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({
  report,
  onNewSearch
}) => {
  const [checklist, setChecklist] = useState<VisitChecklistItem[]>(report.visitChecklist || []);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [allQuestionsCopied, setAllQuestionsCopied] = useState(false);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const completedChecklistCount = checklist.filter(c => c.checked).length;

  const handlePrint = () => {
    window.print();
  };

  const copyQuestionText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const copyAllQuestions = () => {
    const text = report.sellerQuestions
      .map((q, idx) => `${idx + 1}. Ask: "${q.ask}"\n   Reason: ${q.why}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setAllQuestionsCopied(true);
    setTimeout(() => setAllQuestionsCopied(false), 2000);
  };

  const renderConfidenceBadge = (confidence?: ConfidenceLevel) => {
    switch (confidence) {
      case 'Verified Record':
      case 'Verified' as any:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>🟢 Verified Record</span>
          </span>
        );
      case 'Era Expectation':
      case 'Regional Insight' as any:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>🟡 Era Expectation</span>
          </span>
        );
      case 'Needs Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>🔵 Needs Verification</span>
          </span>
        );
    }
  };

  const info = report.propertyInfo;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-24 text-slate-800 font-sans print:bg-white print:pb-0">
      
      {/* 1. TOP STICKY BAR */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-3 px-4 sm:px-8 print:hidden shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <span className="bg-slate-900 text-white font-black px-2.5 py-1 rounded-md text-xs tracking-tight">BeforeRegret</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-mono text-xs truncate max-w-[200px] sm:max-w-md">{info.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-blue-700"
              title="Download or Save as PDF Report"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Download / Save PDF</span>
            </button>

            <button
              onClick={onNewSearch}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Search Another Address</span>
            </button>
          </div>

        </div>
      </div>

      {/* QUICK JUMP BAR */}
      <div className="bg-slate-100/80 border-b border-slate-200/80 py-2.5 px-4 print:hidden overflow-x-auto">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-semibold whitespace-nowrap text-slate-600">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">Report Guide:</span>
          <a href="#glance" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">1. At a Glance</a>
          <a href="#top-priorities" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-blue-700">2. Executive Overview (Top Priorities)</a>
          <a href="#environmental" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">3. Neighborhood & Local Environment</a>
          <a href="#records" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">4. Property Records & Building Analysis</a>
          <a href="#questions" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">5. Seller Questions</a>
          <a href="#checklist" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">6. Physical Visit Checklist</a>
          <a href="#methodology" className="hover:text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">7. Verified Sources & Disclaimer</a>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16 print:px-0 print:py-0 print:space-y-8">
        
        {/* COVER PAGE HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:p-0">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                BeforeRegret
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Property Insights
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              BeforeRegret – Property Insights
            </h1>

            <p className="text-xl font-semibold text-slate-700 flex items-center gap-2 pt-1">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
              <span>{report.headerInfo?.address || info.address}</span>
            </p>
          </div>

          {/* Minimalist Executive Header Banner */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Subject Property</span>
                <div className="text-lg font-bold text-white mt-0.5">{report.headerInfo?.address || info.address}</div>
              </div>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-3 py-1 rounded-full">
                {info.propertyType || 'Residential'}
              </span>
            </div>

            {/* Header Metadata Row (Address, Year Built, Report Date, Version) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Year Built</span>
                <span className="text-base font-bold text-white">{report.headerInfo?.yearBuilt || info.yearBuilt || 1984}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Report Date</span>
                <span className="text-base font-bold text-white">{report.headerInfo?.reportDate || report.generatedAt}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Report Version</span>
                <span className="text-base font-bold text-white">{report.headerInfo?.reportVersion || report.reportVersion || 'v1.0.4'}</span>
              </div>
            </div>
          </div>

          {/* Key Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-700">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Public Sources Used</div>
                <div className="text-slate-900 font-extrabold">{report.pricing?.usefulSourcesCount || 21} Verified Sources</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estimated Reading Time</div>
                <div className="text-slate-900 font-extrabold">{report.readingTimeMinutes || 8} Minutes</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <FileCheck className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Independent Assessment</div>
                <div className="text-slate-900 font-extrabold">Public Record Due Diligence</div>
              </div>
            </div>
          </div>

        </div>

        {/* PAGE 1: AT A GLANCE */}
        <section id="glance" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Page 1</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              At a Glance
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              The top research status points every buyer should see first.
            </p>
          </div>

          {/* LARGE SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.atAGlance?.cards?.map(card => (
              <div 
                key={card.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="text-sm font-bold text-slate-900">
                  {card.title}
                </div>
                {renderConfidenceBadge(card.confidence)}
              </div>
            ))}
          </div>

          {/* MOST IMPORTANT THING TO VERIFY CALLOUT */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Most Important Thing To Verify</span>
            </div>
            <div className="text-lg font-bold text-slate-900 leading-snug">
              {report.atAGlance.mostImportantToVerify.title}
            </div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {report.atAGlance.mostImportantToVerify.description}
            </p>
          </div>

        </section>

        {/* PAGE 2: WHAT WE FOUND (THREE COLUMNS) */}
        <section id="what-we-found" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Page 2</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              What We Found
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              A high-level summary categorizing official records versus open questions.
            </p>
          </div>

          {/* THREE COLUMNS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* COLUMN 1: VERIFIED */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm border-b border-emerald-200 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✅ Verified</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">Confirmed through official records.</p>
              <ul className="space-y-2 text-xs font-semibold text-emerald-950">
                {report.whatWeFound?.verified?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 2: NEEDS VERIFICATION */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-black text-sm border-b border-blue-200 pb-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>⚠ Needs Verification</span>
              </div>
              <p className="text-xs text-blue-800 font-medium">Information public records could not confirm.</p>
              <ul className="space-y-2 text-xs font-semibold text-blue-950">
                {report.whatWeFound?.needsVerification?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 3: WORTH ASKING ABOUT */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm border-b border-amber-200 pb-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>💡 Worth Asking About</span>
              </div>
              <p className="text-xs text-amber-800 font-medium">Deserves direct discussion with the seller.</p>
              <ul className="space-y-2 text-xs font-semibold text-amber-950">
                {report.whatWeFound?.worthAskingAbout?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </section>

        {/* SECTION 3: TOP PRIORITIES BEFORE YOU MAKE AN OFFER */}
        <section id="top-priorities" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Section 3</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Top Priorities Before You Make an Offer
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              The three most important public record findings to investigate before submitting a purchase agreement.
            </p>
          </div>

          {/* THREE TOP PRIORITIES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.topPriorities?.slice(0, 3)?.map((item, index) => (
              <div 
                key={item.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-xs">
                      #{index + 1}
                    </span>
                    {renderConfidenceBadge(item.confidence)}
                  </div>

                  <h3 className="text-base font-bold text-white pt-1">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                    <p><strong className="text-amber-300">1. What We Found:</strong> {item.whatWeFound || item.publicRecordFact || (item as any).finding}</p>
                    <p><strong className="text-amber-300">2. Why It Matters:</strong> {item.whyItMatters || item.whyBuyersCare}</p>
                    {item.cautiousExplanation && (
                      <p><strong className="text-amber-300">Note:</strong> {item.cautiousExplanation}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 text-xs font-semibold text-emerald-300 flex items-start gap-1.5">
                  <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>3. Suggested Next Step:</strong> {item.suggestedNextStep || item.neutralNextStep || (item as any).nextStep}</span>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* SECTION 4: THINGS WORTH VERIFYING (SIGNATURE FEATURE) */}
        {(report.thingsWorthVerifying?.length ?? 0) > 0 && (
          <section id="things-verifying" className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 relative">
            
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-xs">
              Signature BeforeRegret Analysis
            </div>

            <div className="border-b border-slate-200 pb-4">
              <div className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Section 4</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Things Worth Verifying
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Detailed findings from public record database scans, categorized by truth hierarchy and actionable next steps.
              </p>
            </div>

            {/* VERIFICATION CARDS */}
            <div className="space-y-4">
              {report.thingsWorthVerifying?.map((item, idx) => (
                <div 
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    </div>
                    {renderConfidenceBadge(item.confidence)}
                  </div>

                  {/* 3-Part Finding Formula */}
                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block mb-0.5 text-blue-700">1. What We Found</span>
                      <p className="font-medium text-slate-800">{item.whatWeFound || item.publicRecordFact || (item as any).finding}</p>
                    </div>

                    <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl space-y-0.5">
                      <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] block">2. Why It Matters</span>
                      <p className="text-amber-950 font-medium">{item.whyItMatters || item.whyBuyersCare}</p>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl">
                      <span className="font-extrabold text-emerald-900 uppercase tracking-wider text-[10px] block mb-0.5">3. Suggested Next Step</span>
                      <p className="text-emerald-950 font-medium">{item.suggestedNextStep || item.neutralNextStep || (item as any).howToVerify}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </section>
        )}

        {/* PAGE 5: COULD THIS AFFECT YOUR BUDGET? */}
        <section id="budget" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Page 5</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Could This Affect Your Budget?
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Potential near-term expenses categorized by budget size. All amounts represent approximate local replacement costs.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* LARGE EXPENSES */}
            {report.categorizedBudget?.largeExpenses?.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full inline-block">
                  Large Future Expenses
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.categorizedBudget.largeExpenses.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{item.approximateCost}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{item.finding}</p>
                      {item.note && <p className="text-[11px] text-slate-500 italic pt-1">💡 {item.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEDIUM EXPENSES */}
            {report.categorizedBudget?.mediumExpenses?.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block">
                  Medium Expenses
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.categorizedBudget.mediumExpenses.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{item.approximateCost}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{item.finding}</p>
                      {item.note && <p className="text-[11px] text-slate-500 italic pt-1">💡 {item.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOW EXPENSES */}
            {report.categorizedBudget?.lowExpenses?.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full inline-block">
                  Low Expenses
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.categorizedBudget.lowExpenses.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{item.approximateCost}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{item.finding}</p>
                      {item.note && <p className="text-[11px] text-slate-500 italic pt-1">💡 {item.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </section>

        {/* PAGE 6: ENVIRONMENTAL & LOCATION */}
        <section id="environmental" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Page 6</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Environmental & Location
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Plain English assessment of natural risk factors without technical jargon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.environmentalTopics?.map(topic => (
              <div key={topic.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 text-base">{topic.title}</h3>
                    {renderConfidenceBadge(topic.confidence)}
                  </div>

                  {topic.statusText && (
                    <div className="text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      Status: {topic.statusText}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <p className="font-medium text-slate-800">
                      <strong>What We Found:</strong> {topic.whatWeFound || (topic as any).finding}
                    </p>
                    {topic.whyItMatters && (
                      <p className="text-slate-600">
                        <strong>Why It Matters:</strong> {topic.whyItMatters}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl text-xs font-medium text-emerald-950 mt-2">
                  <strong>Suggested Next Step:</strong> {topic.suggestedNextStep || topic.recommendedAction}
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* PAGE 7: PROPERTY RECORDS (VERIFIED VS UNKNOWN) */}
        <section id="records" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Page 7</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Property Records
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              What official public databases can and cannot tell us.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* VERIFIED RECORDS */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                ✓ Verified Public Records
              </div>
              <div className="space-y-2">
                {report.propertyRecordsSplit?.verified?.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.label}</span>
                      <span className="text-emerald-800 font-extrabold">{item.value}</span>
                    </div>
                    {item.detail && <div className="text-[11px] text-slate-500">{item.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* UNKNOWN RECORDS */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block">
                ? Unknown / Needs Verification
              </div>
              <div className="space-y-2">
                {report.propertyRecordsSplit?.unknown?.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.label}</span>
                      <span className="text-blue-800 font-extrabold">{item.value}</span>
                    </div>
                    {item.detail && <div className="text-[11px] text-slate-500">{item.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* PAGE 8: QUESTIONS TO ASK THE SELLER */}
        <section id="questions" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Page 8</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Questions to Ask the Seller
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Ready-to-use questions based on public record gaps.
              </p>
            </div>

            <button
              onClick={copyAllQuestions}
              className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {allQuestionsCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{allQuestionsCopied ? 'Copied All Questions!' : 'Copy All Questions'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {report.sellerQuestions?.map((q, idx) => (
              <div 
                key={q.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        Q{idx + 1}
                      </span>
                      {renderConfidenceBadge(q.confidence)}
                    </div>
                    
                    <div className="text-base font-bold text-slate-900">
                      <strong className="text-blue-700">Ask:</strong> "{q.ask}"
                    </div>
                    
                    <div className="text-xs text-slate-600 font-medium">
                      <strong className="text-slate-800">Why:</strong> {q.why}
                    </div>
                  </div>

                  <button
                    onClick={() => copyQuestionText(`Ask: ${q.ask}\nWhy: ${q.why}`, q.id)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer shrink-0"
                    title="Copy this question"
                  >
                    {copiedQuestionId === q.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* PAGE 9: PROPERTY VISIT CHECKLIST */}
        <section id="checklist" className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Page 9</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Property Visit Checklist
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Print or check off during your physical walkthrough.
              </p>
            </div>

            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl text-right">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Completed</div>
              <div className="text-base font-black text-slate-900">
                {completedChecklistCount} of {checklist.length} Checked
              </div>
            </div>
          </div>

          {/* CHECKLIST ITEMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklist.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  item.checked 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-sm font-bold ${item.checked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    □ {item.task}
                  </div>
                  {item.detail && (
                    <div className="text-xs text-slate-500 mt-1 font-normal">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* PAGE 10: RESEARCH METHODOLOGY & PUBLIC SOURCES */}
        <section id="methodology" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Page 10</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Research Methodology
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              How BeforeRegret scans public databases to build decision guides.
            </p>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-300 leading-relaxed">
            <p>
              We searched official public databases including <strong className="text-white">FEMA</strong>, <strong className="text-white">EPA</strong>, <strong className="text-white">USGS</strong>, <strong className="text-white">County Tax Assessor & Parcel Registries</strong>, <strong className="text-white">Municipal Permit Databases</strong>, and <strong className="text-white">State Department of Transportation Capital Projects</strong>.
            </p>
            <p>
              BeforeRegret combines verified public information with AI synthesis to organize complex raw records into a practical, easy-to-read property research report.
            </p>
            
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1.5 text-slate-300 text-xs">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Important Disclaimers</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>We never inspect the property physically.</li>
                <li>We never guarantee the physical condition of any property.</li>
                <li>We help buyers identify what deserves closer attention before making an offer.</li>
              </ul>
            </div>
          </div>

          {/* VERIFIED SOURCES GRID */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scanned Data Sources</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.sourceReferences?.map(src => (
                <a 
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-800 p-3 rounded-xl border border-slate-700/80 hover:border-blue-400 transition-all flex items-start justify-between gap-2 group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {src.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {src.agency} • {src.category}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>

        </section>

        {/* FOOTER & DISCLAIMER */}
        <div className="space-y-4 pt-8 border-t border-slate-200 text-xs text-slate-500 font-medium print:text-[10px]">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-left space-y-2">
            <div className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Independent Public Record Research Disclaimer</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              BeforeRegret provides independent, informational public record property research rather than legal, engineering, structural, or physical inspection advice. All findings are derived from public record database scans and general regional building trends. Buyers should always consult qualified professionals (such as licensed home inspectors, structural engineers, real estate attorneys, and municipal officials) before making purchasing decisions or executing purchase agreements.
            </p>
          </div>

          <div className="text-center space-y-1 text-slate-400 text-[11px]">
            <p className="font-bold text-slate-700">BeforeRegret (beforeregret.com) Property Research Assistant</p>
            <p>Helping homebuyers make informed decisions before making an offer on a residential property.</p>
          </div>
        </div>

      </div>

    </div>
  );
};
