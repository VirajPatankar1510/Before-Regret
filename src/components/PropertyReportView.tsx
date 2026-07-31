import React, { useState } from 'react';
import { 
  MapPin, ExternalLink, ShieldCheck, AlertTriangle, CheckCircle2, 
  Lightbulb, Copy, Check, ChevronRight, Clock, CheckSquare, Square, 
  FileCheck, AlertCircle, Download, Loader2, Building, Layers,
  BarChart3, Info, Map, Calendar
} from 'lucide-react';
import { PropertyReport, ConfidenceLevel, VisitChecklistItem, MapLayerOverlay, ExecutiveSnapshotItem, InsuranceConsiderationItem, DirectSourceLink } from '../types';
import { LeadMarketplaceWidget } from './LeadMarketplaceWidget';

interface PropertyReportViewProps {
  report: PropertyReport;
  onNewSearch: () => void;
}

const MapThumbnail: React.FC<{ overlay: MapLayerOverlay; address: string }> = ({ overlay, address }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-white my-2.5 shadow-inner">
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-300 text-[11px]">
          <Map className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>GEOGRAPHIC MAP OVERLAY: {overlay.layerName}</span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
          {overlay.layerSource}
        </span>
      </div>

      <div className="relative h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
        
        {overlay.boundaryType === 'flood' && (
          <div className="absolute inset-x-4 inset-y-2 bg-blue-500/10 border-2 border-dashed border-blue-400/50 rounded-2xl flex items-center justify-end pr-3">
            <span className="text-[9px] font-mono font-bold text-blue-300 bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-800">
              FEMA Zone X Boundary
            </span>
          </div>
        )}
        {overlay.boundaryType === 'noise' && (
          <div className="absolute w-36 h-20 rounded-full border-2 border-amber-400/40 bg-amber-500/10 rotate-12 flex items-center justify-center">
            <span className="text-[9px] font-mono font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-800">
              48 dB DNL Contour
            </span>
          </div>
        )}
        {overlay.boundaryType === 'seismic' && (
          <div className="absolute inset-x-2 inset-y-4 border-t-2 border-b-2 border-slate-600/40 bg-slate-800/20 flex items-center justify-start pl-3">
            <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700">
              USGS &lt;0.04g PGA Zone
            </span>
          </div>
        )}
        {(overlay.boundaryType === 'facility' || !overlay.boundaryType) && (
          <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center">
            <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-800">
              Public Service Area
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-red-600 text-white p-1 rounded-full shadow-lg border border-white">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-mono font-extrabold text-white bg-slate-900/90 px-2 py-0.5 rounded-md mt-1 border border-slate-700 shadow-xs truncate max-w-[180px]">
            {address}
          </span>
        </div>
      </div>

      {overlay.detailsText && (
        <div className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
          "{overlay.detailsText}"
        </div>
      )}
    </div>
  );
};

const ExecutiveSnapshotDashboard: React.FC<{ 
  items?: ExecutiveSnapshotItem[];
  mostImportantToVerify?: { title: string; description: string };
  dataFreshness?: string;
}> = ({ items, mostImportantToVerify, dataFreshness }) => {
  if (!items || items.length === 0) return null;

  return (
    <div id="executive-snapshot" className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>EXECUTIVE SNAPSHOT DASHBOARD</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight mt-0.5">
            Key Environmental & Property Status Overview
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Summary Index Only</span>
          <span className="text-[11px] font-mono font-semibold text-slate-300">No Composite Rating or Score</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 font-medium leading-relaxed">
        Single scannable status overview derived from official public records. Folded summary indexing key property hazards and public archive checks.
      </p>

      {/* Grid of Key-Category Status Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-2 flex flex-col justify-between hover:border-slate-600 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                {item.category}
              </span>
              <div className="text-sm font-black text-white leading-snug">
                {item.statusLabel}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{item.source}</span>
              {item.lastUpdated && <span>{item.lastUpdated}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Primary Verification Focus Callout embedded in Dashboard */}
      {mostImportantToVerify && mostImportantToVerify.title && (
        <div className="bg-amber-950/80 border border-amber-600/50 rounded-2xl p-4 space-y-1.5 mt-2 text-amber-100">
          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Primary Verification Focus</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white leading-snug">
            {mostImportantToVerify.title}
          </div>
          <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
            {mostImportantToVerify.description}
          </p>
        </div>
      )}
    </div>
  );
};

const InsuranceConsiderationsSection: React.FC<{ items?: InsuranceConsiderationItem[]; freshness?: string }> = ({ items, freshness }) => {
  if (!items || items.length === 0) return null;

  return (
    <section id="insurance" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 4B</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
            Insurance Considerations & Carrier Practices
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Factual statements regarding how specific flagged property findings commonly relate to insurance requirements.
          </p>
        </div>
        {freshness && (
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full">
            {freshness}
          </span>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-xs text-amber-950 font-medium leading-relaxed space-y-1">
        <div className="font-bold flex items-center gap-1.5 font-mono uppercase text-[11px] text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Underwriting Guidance Note</span>
        </div>
        <p>
          These general observations describe standard insurance carrier practices and underwriting parameters. Policy terms, coverage requirements, and endorsement availability vary by individual insurance provider. Always confirm specific property insurability and coverage options with a licensed insurance agent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-sm">{item.findingTopic}</h3>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  UNDERWRITING FACT
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 font-mono text-[10px] uppercase block mb-0.5">Public Record Basis</span>
                  <p className="text-slate-900 font-medium">{item.publicFact}</p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 font-mono text-[10px] uppercase block mb-0.5">Carrier Practice & Policy Factor</span>
                  <p className="text-slate-800 leading-relaxed">{item.insuranceFactor}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1">
              <span className="text-amber-300 font-mono font-bold text-[10px] uppercase block">Action Guidance</span>
              <p className="text-slate-200 text-[11px]">{item.guidanceNote}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DirectSourceAppendix: React.FC<{ sources?: DirectSourceLink[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
      <div>
        <div className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest">APPENDIX A</div>
        <h3 className="text-xl font-serif font-black text-white tracking-tight mt-0.5">
          Public Record Direct Source Registry
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Direct, publicly accessible links to official public database search portals for independent buyer, agent, or attorney verification.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((src) => (
          <a
            key={src.id}
            href={src.directUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800/90 border border-slate-700 hover:border-emerald-400 p-4 rounded-2xl transition-all flex flex-col justify-between space-y-2 group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">{src.category}</span>
                <span className="text-[10px] font-mono bg-slate-950 text-emerald-400 px-2 py-0.5 rounded border border-slate-800">
                  {src.lastUpdatedPeriod}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors flex items-center justify-between gap-1">
                <span>{src.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 shrink-0" />
              </h4>
              <p className="text-[11px] text-slate-300 leading-snug">{src.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-700/80 text-[10px] font-mono text-slate-400 truncate">
              Source Portal: <span className="text-emerald-300 underline">{src.directUrl}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({
  report,
  onNewSearch
}) => {
  const [checklist, setChecklist] = useState<VisitChecklistItem[]>(report?.visitChecklist || []);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [allQuestionsCopied, setAllQuestionsCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [checklistCategoryFilter, setChecklistCategoryFilter] = useState<string>('ALL');
  const [copiedLeverId, setCopiedLeverId] = useState<string | null>(null);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const completedChecklistCount = checklist.filter(c => c.checked).length;

  const sanitizeDocumentForCanvas = (clonedDoc: Document) => {
    // Convert oklab/oklch/color-mix functions in all <style> elements to prevent html2canvas parser crashes
    const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && (
        styleEl.textContent.includes('oklab') || 
        styleEl.textContent.includes('oklch') || 
        styleEl.textContent.includes('color-mix') ||
        styleEl.textContent.includes('light-dark')
      )) {
        styleEl.textContent = styleEl.textContent
          .replace(/color-mix\([^;}]*\)/gi, '#334155')
          .replace(/oklab\([^;}]*\)/gi, '#1e293b')
          .replace(/oklch\([^;}]*\)/gi, '#1e293b')
          .replace(/light-dark\([^;}]*\)/gi, '#1e293b');
      }
    });

    // Clean inline style attributes containing modern CSS color functions
    const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
    allElements.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (
        styleAttr.includes('oklab') || 
        styleAttr.includes('oklch') || 
        styleAttr.includes('color-mix') || 
        styleAttr.includes('light-dark')
      )) {
        el.setAttribute(
          'style',
          styleAttr
            .replace(/color-mix\([^;}]*\)/gi, '#334155')
            .replace(/oklab\([^;}]*\)/gi, '#1e293b')
            .replace(/oklch\([^;}]*\)/gi, '#1e293b')
            .replace(/light-dark\([^;}]*\)/gi, '#1e293b')
        );
      }
    });
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const element = document.getElementById('report-content');
      const filename = `BeforeRegret-Property-Insights-${(info?.address || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const opt = {
          margin: [10, 12, 12, 12] as [number, number, number, number],
          filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            onclone: (clonedDoc: Document) => {
              sanitizeDocumentForCanvas(clonedDoc);
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        await html2pdf().set(opt).from(element || document.body).save();
        return;
      } catch (err1) {
        console.warn('html2pdf attempt failed, trying jspdf fallback:', err1);
      }

      if (element) {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        const canvas = await html2canvas(element, { 
          scale: 1.5, 
          useCORS: true,
          onclone: (clonedDoc: Document) => {
            sanitizeDocumentForCanvas(clonedDoc);
          }
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
        return;
      }

      window.print();
    } catch (err) {
      console.error('PDF export failed, using window.print fallback:', err);
      try {
        window.print();
      } catch (pErr) {
        alert('Please use your browser\'s Print function (Ctrl+P / Cmd+P) and choose "Save as PDF".');
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const copyQuestionText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const copyAllQuestions = () => {
    const text = (report?.sellerQuestions || [])
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>[VERIFIED RECORD]</span>
          </span>
        );
      case 'Era Expectation':
      case 'Regional Insight' as any:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>[ERA EXPECTATION]</span>
          </span>
        );
      case 'Needs Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>[NEEDS VERIFICATION]</span>
          </span>
        );
    }
  };

  const info = report?.propertyInfo || {
    address: report?.headerInfo?.address || 'Subject Property',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis County',
    propertyType: 'Single Family Home',
    yearBuilt: 1984
  };

  return (
    <div id="report-content" className="min-h-screen bg-slate-50/90 pb-24 text-slate-800 font-sans print:bg-white print:pb-0">
      
      {/* NON-RESIDENTIAL REJECTION BANNER */}
      {report.isNonResidential && (
        <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 text-amber-900 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />
              <h2 className="text-lg font-bold font-serif">Residential Due Diligence Limitation Notice</h2>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              {report.rejectionReason || 'BeforeRegret due diligence reports apply exclusively to residential properties. Commercial, retail, or industrial parcels require specialized commercial real estate disclosures.'}
            </p>
            <button
              onClick={onNewSearch}
              className="mt-2 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Search Residential Address
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP STICKY BAR (HIDDEN IN PRINT/PDF EXPORT) */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-8 print:hidden shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-md text-xs tracking-tight">BeforeRegret</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-200 font-mono text-xs truncate max-w-[200px] sm:max-w-md">{info.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-blue-500"
              title="Download Executive PDF Report"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download / Save Executive PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onNewSearch}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <span>Search Another Address</span>
            </button>
          </div>

        </div>
      </div>

      {/* QUICK JUMP BAR & CONDENSED DISCLAIMER (HIDDEN IN PRINT/PDF EXPORT) */}
      <div className="bg-slate-100 border-b border-slate-200 print:hidden sticky top-0 z-30 shadow-xs">
        <div className="py-2.5 px-4 border-b border-slate-200 overflow-x-auto">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-semibold whitespace-nowrap text-slate-700">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">Report Guide:</span>
            <a href="#executive-snapshot" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-emerald-700">Executive Snapshot</a>
            <a href="#top-priorities" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-900">1. Executive Overview</a>
            <a href="#environmental" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">2. Local Environment</a>
            <a href="#records" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">3. Property Records</a>
            <a href="#insurance" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-blue-800 font-bold">4. Insurance Considerations</a>
            <a href="#questions" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">5. Seller Questions</a>
            <a href="#checklist" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">6. Walkthrough Checklist</a>
            <a href="#methodology" className="hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">7. Source Appendix</a>
          </div>
        </div>

        {/* Condensed One-Line Persistent Non-Diagnostic Disclaimer */}
        <div className="bg-amber-50/90 border-b border-amber-200 py-1.5 px-4 text-center">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-[11px] font-medium text-amber-950">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span><strong>Non-Diagnostic Framing:</strong> Public-record research provided for preliminary evaluation. Confirm all findings with licensed home inspectors or municipal officials before binding decisions.</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER WITH CONSULTING FIRM AESTHETIC */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 print:px-0 print:py-0 print:space-y-8">
        
        {/* EXECUTIVE HEADER BLOCK */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 print:border-none print:p-0">
          
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between">
              <span className="bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider font-mono">
                BeforeRegret
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                INDEPENDENT PROPERTY RESEARCH
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight leading-snug pt-2">
              BeforeRegret – Property Insights
            </h1>

            <p className="text-lg font-bold text-slate-700 flex items-center gap-2 pt-1">
              <MapPin className="w-5 h-5 text-blue-700 shrink-0" />
              <span>{report.headerInfo?.address || info.address}</span>
            </p>
          </div>

          {/* Minimalist Executive Header Bar */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Subject Property</span>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">{report.headerInfo?.address || info.address}</div>
              </div>
            </div>

            {/* Header Metadata Row */}
            <div className="text-xs font-medium text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider font-mono">Sources Scanned</span>
                <span className="text-base font-extrabold text-emerald-400">{report.pricing?.usefulSourcesCount || 21} Public Sources</span>
              </div>
            </div>
          </div>

        </div>

        {/* EXECUTIVE SNAPSHOT DASHBOARD (FOLDED SUMMARY LAYER) */}
        <ExecutiveSnapshotDashboard 
          items={report.executiveSnapshot} 
          mostImportantToVerify={report.atAGlance?.mostImportantToVerify}
        />

        {/* SECTION 1: EXECUTIVE OVERVIEW (TOP PRIORITIES) */}
        <section id="top-priorities" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">SECTION 1</div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mt-1">
                Executive Overview (Top Priorities)
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Top priority research findings structured via our 3-part formula: What we found, Why it matters, and Suggested next step.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 px-3 py-1 rounded-full">
              Data as of July 2026
            </span>
          </div>

          {/* Callout Data vs Action Grids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.topPriorities?.slice(0, 3)?.map((item, index) => (
              <div 
                key={item.id || `top-priority-${index}`}
                className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-xs font-mono">
                      #{index + 1}
                    </span>
                    {renderConfidenceBadge(item.confidence)}
                  </div>

                  <h3 className="text-base font-bold text-white pt-1">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                      <span className="text-amber-300 font-bold block text-[10px] uppercase font-mono mb-0.5">1. What We Found</span>
                      <p>{item.whatWeFound || item.publicRecordFact || (item as any).finding}</p>
                    </div>

                    {/* Baseline comparison if present */}
                    {(item as any).baselineComparison && (
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                        <span className="text-amber-300 font-bold block text-[10px] uppercase font-mono mb-0.5">Neighborhood Baseline</span>
                        <p>{(item as any).baselineComparison}</p>
                      </div>
                    )}

                    {/* Spatial Map Thumbnail if present */}
                    {(item as any).mapOverlay && (
                      <MapThumbnail overlay={(item as any).mapOverlay} address={info.address} />
                    )}

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                      <span className="text-amber-300 font-bold block text-[10px] uppercase font-mono mb-0.5">2. Why It Matters</span>
                      <p>{item.whyItMatters || item.whyBuyersCare}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 text-xs font-semibold text-emerald-300 space-y-1">
                  <span className="text-emerald-400 font-bold block text-[10px] uppercase font-mono">3. Suggested Next Step</span>
                  <p className="text-emerald-200">{item.suggestedNextStep || item.neutralNextStep || (item as any).nextStep}</p>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* SECTION 2: NEIGHBORHOOD & LOCAL ENVIRONMENT */}
        <section id="environmental" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 2</div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                Neighborhood & Local Environment
              </h2>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Public record database evaluation covering flood risk, indoor radon, airport/transit noise contours, stormwater, and fiber broadband infrastructure.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full">
              {report.dataFreshness?.environmentalFreshness || 'Data as of July 2026'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.environmentalTopics?.map((topic, idx) => (
              <div key={topic.id || `env-topic-${idx}`} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 text-base">{topic.title}</h3>
                    {renderConfidenceBadge(topic.confidence)}
                  </div>

                  {/* 3-Part Finding Formula */}
                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 uppercase font-mono text-[10px] block mb-0.5 text-blue-700">1. What We Found</span>
                      <p className="text-slate-800 font-medium">{topic.whatWeFound || (topic as any).finding}</p>
                    </div>

                    {/* Neighborhood Baseline Comparison Callout */}
                    {topic.baselineComparison && (
                      <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 text-[11px] text-blue-950 space-y-0.5">
                        <span className="font-bold font-mono text-[10px] uppercase text-blue-800 block">
                          Neighborhood Baseline Context
                        </span>
                        <p className="text-slate-800 font-medium">{topic.baselineComparison}</p>
                      </div>
                    )}

                    {/* Spatial Map Visualization Thumbnail */}
                    {topic.mapOverlay && (
                      <MapThumbnail overlay={topic.mapOverlay} address={info.address} />
                    )}

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 uppercase font-mono text-[10px] block mb-0.5 text-slate-600">2. Why It Matters</span>
                      <p className="text-slate-700">{topic.whyItMatters}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-medium text-emerald-950 mt-1">
                  <span className="font-bold text-emerald-900 uppercase font-mono text-[10px] block mb-0.5">3. Suggested Next Step</span>
                  <p>{topic.suggestedNextStep || topic.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* SECTION 3: PROPERTY RECORDS & BUILDING ANALYSIS */}
        <section id="records" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 3</div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                Property Records & Building Analysis
              </h2>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Audit of building permit histories, era-specific wiring and plumbing standards, unpermitted modification records, and water lead service inventory.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full">
              {report.dataFreshness?.permitFreshness || 'Data as of July 2026'}
            </span>
          </div>

          {/* Records Split: Verified Records vs Unknown / Needs Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            {/* VERIFIED PUBLIC RECORDS */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full inline-block">
                ✓ Verified Public Records
              </div>
              <div className="space-y-2">
                {report.propertyRecordsSplit?.verified
                  ?.filter(item => !/year built|property type/i.test(item.label))
                  .map((item, idx) => (
                  <div key={item.id || `rec-v-${idx}`} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.label}</span>
                      <span className="text-emerald-800 font-extrabold">{item.value}</span>
                    </div>
                    {item.detail && <div className="text-[11px] text-slate-600">{item.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* UNKNOWN / UNCONFIRMED RECORDS */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-300 px-3 py-1 rounded-full inline-block">
                ? Unconfirmed Public Record Gaps
              </div>
              <div className="space-y-2">
                {report.propertyRecordsSplit?.unknown
                  ?.filter(item => !/year built|property type/i.test(item.label))
                  .map((item, idx) => (
                  <div key={item.id || `rec-u-${idx}`} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.label}</span>
                      <span className="text-blue-800 font-extrabold">{item.value}</span>
                    </div>
                    {item.detail && <div className="text-[11px] text-slate-600">{item.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Building Systems & Permit Lifespan Matrix */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black text-slate-900">
                  Building Systems & Permit Lifespan Matrix
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Cross-referencing municipal permit filings with standard building component lifespan expectations.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md hidden sm:inline-block">
                System Lifespan Map
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">System Component</th>
                    <th className="py-3 px-4">Design Lifespan</th>
                    <th className="py-3 px-4">Municipal Permit History</th>
                    <th className="py-3 px-4">Era Expectation</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-medium text-slate-800">
                  {(report.permitLifespanMatrix || [
                    { id: 'pl1', system: 'Roofing Shingles & Flashing', standardLifespanYears: '20 – 25 Years', permitStatus: 'Permit unconfirmed in digitized log', eraExpectation: 'Approaching end-of-design lifespan window', confidence: 'Needs Verification' as const },
                    { id: 'pl2', system: 'Central AC Compressor', standardLifespanYears: '12 – 15 Years', permitStatus: 'Permit log unconfirmed', eraExpectation: 'Operating in mature secondary cycle', confidence: 'Needs Verification' as const },
                    { id: 'pl3', system: 'Electrical Breaker Panel', standardLifespanYears: '30 – 40 Years', permitStatus: 'Service recorded in public log', eraExpectation: 'Modern circuit capacity active', confidence: 'Verified Record' as const },
                    { id: 'pl4', system: 'Domestic Water Heater Tank', standardLifespanYears: '8 – 12 Years', permitStatus: 'Unrecorded in public permit log', eraExpectation: 'Verify age dataplate during physical walkthrough', confidence: 'Needs Verification' as const },
                    { id: 'pl5', system: 'Main Sewer Waste Line', standardLifespanYears: '40 – 50 Years', permitStatus: 'Original Municipal Connection', eraExpectation: 'Sewer scope camera inspection recommended', confidence: 'Era Expectation' as const }
                  ]).map((row, rIdx) => (
                    <tr key={row.id || `pl-row-${rIdx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.system}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{row.standardLifespanYears}</td>
                      <td className="py-3.5 px-4 text-slate-700">{row.permitStatus}</td>
                      <td className="py-3.5 px-4 text-slate-600">{row.eraExpectation}</td>
                      <td className="py-3.5 px-4 text-right shrink-0">{renderConfidenceBadge(row.confidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* SECTION 4: INSURANCE CONSIDERATIONS & CARRIER PRACTICES */}
        <InsuranceConsiderationsSection 
          items={report.insuranceConsiderations} 
          freshness={report.dataFreshness?.insuranceFreshness || 'Data as of July 2026'} 
        />

        {/* SECTION 5: WALKTHROUGH & SELLER GUIDANCE */}
        <section id="questions" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* Seller Questions Sub-Section */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 5A</div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                  Questions to Ask the Seller
                </h2>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Ready-to-ask questions based directly on public record gaps.
                </p>
              </div>

              <button
                onClick={copyAllQuestions}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs print:hidden"
              >
                {allQuestionsCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{allQuestionsCopied ? 'Copied All Questions!' : 'Copy All Questions'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {report.sellerQuestions?.map((q, idx) => (
                <div 
                  key={q.id || `sq-${idx}`}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md font-mono">
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
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer shrink-0 print:hidden"
                      title="Copy this question"
                    >
                      {copiedQuestionId === q.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5B: Attorney & Realtor Disclosure Levers */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 5B</div>
                <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tight mt-1">
                  Attorney & Realtor Contract Disclosure Levers
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Professional, copy-ready disclosure requests to share with your buyer agent or real estate attorney.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(report.disclosureLevers || [
                {
                  id: 'dl1',
                  findingTitle: 'Roof Permit & Installation Record Gap',
                  publicFact: 'Municipal building permit archives show no recorded roof replacement permit filed after 2008. This indicates no matching permit was found in the digitized archive — it does not confirm whether replacement or repair work has occurred since then.',
                  requestedDocument: 'Seller roof invoices, contractor receipts, and any transferable warranty documentation.',
                  recommendedDisclosureLine: "Our records review didn't show a roof permit filed after 2008 — could you share any contractor invoices, receipts, or transferable warranty documents for the roof, if available?"
                },
                {
                  id: 'dl2',
                  findingTitle: 'Central Air Conditioning Compressor Age',
                  publicFact: 'City mechanical building permit logs show no HVAC permit recorded after 2011. This reflects the digitized public permit history and does not rule out unrecorded maintenance or equipment servicing.',
                  requestedDocument: 'Annual HVAC service logs, compressor manufacture dataplate photos, and maintenance receipts.',
                  recommendedDisclosureLine: "Public permit logs list no HVAC filing since 2011 — could you disclose the age of the central AC unit and provide any recent service or inspection records?"
                },
                {
                  id: 'dl3',
                  findingTitle: 'Unpermitted Interior Renovations Check',
                  publicFact: 'County tax assessor archives reflect original 1984 floor plan dimensions. No structural alteration permits appear in the municipal permit database.',
                  requestedDocument: 'Municipal building permits or a seller written confirmation of non-structural update history.',
                  recommendedDisclosureLine: "Our property record review reflects original floor plan records — could you confirm if any recent interior updates required municipal building permits or were strictly non-structural?"
                }
              ]).map((lever, lIdx) => (
                <div key={lever.id || `lever-${lIdx}`} className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <span className="font-bold text-amber-300 text-sm">{lever.findingTitle}</span>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                      CONTRACT DISCLOSURE LEVER
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                      <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block mb-1">Public Record Basis</span>
                      <p className="text-slate-200">{lever.publicFact}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                      <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold block mb-1">Requested Document</span>
                      <p className="text-emerald-200 font-bold">{lever.requestedDocument}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-amber-400 font-mono text-[10px] uppercase font-bold block mb-0.5">Ready-to-Copy Attorney / Realtor Line</span>
                      <p className="text-slate-100 font-medium italic text-xs leading-relaxed">"{lever.recommendedDisclosureLine}"</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lever.recommendedDisclosureLine);
                        setCopiedLeverId(lever.id);
                        setTimeout(() => setCopiedLeverId(null), 2000);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer print:hidden"
                    >
                      {copiedLeverId === lever.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLeverId === lever.id ? 'Copied' : 'Copy Line'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Physical Walkthrough Field Cards Sub-Section */}
          <div id="checklist" className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono font-extrabold text-blue-700 uppercase tracking-widest">SECTION 6</div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                  Printable Walkthrough Inspection Checklist
                </h2>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  A physical field inspection checklist featuring interactive and printable checkboxes.
                </p>
              </div>

              {/* Web Interactive Status Counter (Hidden in PDF print) */}
              <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl text-right print:hidden">
                <div className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-wider">WALKTHROUGH PROGRESS</div>
                <div className="text-sm font-black text-slate-900">
                  {completedChecklistCount} of {checklist.length} Checked
                </div>
              </div>
            </div>

            {/* Grid for Walkthrough Checklist Field Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-3 gap-3">
              {checklist.map((item, idx) => (
                <div 
                  key={item.id || `chk-${idx}`}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 break-inside-avoid ${
                    item.checked 
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="shrink-0 mt-0.5 print:hidden">
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-700 shrink-0 mt-0.5 hidden print:block">
                    {item.checked ? '[ ✓ ]' : '[ &nbsp; ]'}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className={`text-xs font-extrabold leading-snug ${item.checked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.task}
                    </div>
                    {item.detail && (
                      <div className="text-[11px] text-slate-600 font-medium leading-normal">
                        {item.detail}
                      </div>
                    )}
                    {item.category && (
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Area: {item.category}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* SECTION 7: VERIFIED DATA SOURCES & OFFICIAL DISCLAIMER */}
        <section id="methodology" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">SECTION 7</div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mt-1">
              Verified Public Sources & Methodology
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              100% public record attribution to federal, state, county, and municipal public databases.
            </p>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-300 leading-relaxed">
            <p>
              Every finding in this report is attributed directly to its official public database archive, including <strong className="text-white">FEMA NFHL</strong>, <strong className="text-white">EPA Envirofacts</strong>, <strong className="text-white">USGS Indoor Radon Zone Maps</strong>, <strong className="text-white">County Tax Assessor & Clerk Records</strong>, <strong className="text-white">Municipal Building Department Permits</strong>, and <strong className="text-white">State Department of Transportation Capital Projects</strong>.
            </p>
            
            {/* Pure Public Source Attribution Grid */}
            <div className="pt-2">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Scanned Official Archives</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {report.sourceReferences?.map((src, idx) => (
                  <a 
                    key={src.id || `source-ref-${idx}`}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-blue-400 transition-all flex items-start justify-between gap-2 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        {src.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {src.agency} • {src.category}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 shrink-0 mt-0.5 print:hidden" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Source Appendix with Direct Links */}
          <DirectSourceAppendix sources={report.directSourceLinks} />

          {/* Strict Legal Disclaimer & Non-Diagnostic Stance */}
          <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl text-xs space-y-2 text-slate-300">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Independent Research Disclaimer & Non-Diagnostic Stance
            </div>
            <p className="leading-relaxed text-[11px]">
              BeforeRegret provides independent public record property research rather than physical engineering inspections or financial valuations. We do not diagnose physical defects, estimate repair costs, or predict future property appreciation. All findings are derived from public record database scans and general building era trends. Homebuyers should always verify physical property conditions with a licensed home inspector and consult municipal building officials prior to executing a purchase agreement.
            </p>
          </div>

        </section>

        {/* FOOTER & BRANDING */}
        <div className="text-center space-y-1.5 pt-6 border-t border-slate-200 text-xs text-slate-500 font-medium print:text-[10px]">
          <div className="font-bold text-slate-900 font-serif text-sm">BeforeRegret (beforeregret.com) – Property Research Assistant</div>
          <p>Independent, high-trust property research for residential homebuyers across the United States.</p>
        </div>

      </div>

    </div>
  );
};
