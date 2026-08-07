import React, { useState } from 'react';
import {
  MapPin, ExternalLink,
  Check, Clock, CheckSquare, Square,
  FileCheck, AlertCircle, Download, Building, Layers,
  BarChart3, Calendar, Database, Sparkles, Filter, ArrowRight
} from 'lucide-react';
import { PropertyReport, CanonicalFinding } from '../types';
import { LeadMarketplaceWidget } from './LeadMarketplaceWidget';
import { SourceRegistryModal } from './SourceRegistryModal';
import { OFFICIAL_SOURCE_REGISTRY } from '../data/sourceRegistry';
import { ErrorReportingModal } from './ErrorReportingModal';
import { SponsoredVendorCard } from './SponsoredVendorCard';
import { InspectionPriorities } from './InspectionPriorities';
import { SellerQuestions } from './SellerQuestions';

interface PropertyReportViewProps {
  report: PropertyReport;
  onNewSearch: () => void;
}

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({ report, onNewSearch }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Address formatting helper ensuring proper spacing after commas
  const formattedAddress = (report.headerInfo?.address || report.propertyInfo?.address || '')
    .replace(/,/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  // If the address validation gate blocked this address, show why -- headline varies by which
  // layer blocked it (bad address format / government facility / unsupported jurisdiction).
  if (report.isNonResidential) {
    const layerHeadline: Record<number, string> = {
      1: 'Address Could Not Be Verified',
      2: 'Government Facility Detected',
      3: 'Area Not Yet Supported',
    };
    const headline = layerHeadline[report.blockedAtLayer as number] || 'Residential Address Required';

    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <Building className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">VALIDATION GATE</span>
              <h1 className="text-2xl font-serif font-black text-white">Residential Scope Verification</h1>
            </div>
          </div>

          <div className="bg-amber-950/60 border border-amber-600/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-amber-200">{headline}</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {report.rejectionReason || `BeforeRegret insight reports apply exclusively to residential properties. ${formattedAddress || 'This address'} could not be verified as a residential property.`}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              Need research for a residential property instead?
            </p>
            <button
              onClick={onNewSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Search Residential Address</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derive canonical findings array. report.canonicalFindings is always populated by the time
  // this component renders -- App.tsx guarantees a report via createFallbackReport
  // (reportFallback.ts) even when the server call fails -- so this is a defensive empty-array
  // fallback, not a second copy of fabricated content.
  const findings: CanonicalFinding[] = report.canonicalFindings || [];

  // Source count shown in the header/metrics comes from the same honest registry the modal
  // renders (src/data/sourceRegistry.ts) -- not a report-specific list, since BeforeRegret
  // queries the same fixed set of public sources for every address.
  const sourceCount = OFFICIAL_SOURCE_REGISTRY.length;

  // Filter findings by status. Most findings today are 'NOT YET VERIFIED' because BeforeRegret
  // has no live data connection yet -- this stays generic so it renders correctly once real
  // 'CONFIRMED RECORD' / 'NO RECORD FOUND' data exists for a jurisdiction.
  const verifiedFindings = findings.filter(f => f.status === 'CONFIRMED RECORD');
  const pendingFindings = findings.filter(f => f.status === 'NOT YET VERIFIED');
  // This used to only flip to the confident "VERIFIED PUBLIC PROPERTY RESEARCH" / "Full Public
  // Audit" label when *every* finding was unverified. Once USGS seismic became a genuinely live
  // finding queried for every address, that meant a single real source out of ~21 permanently
  // flipped every report to the confident label -- 1-for-21 is not an audit. Require verified
  // findings to be a real majority before making that claim; short of that, stay in the honest
  // reference-checklist framing regardless of exactly how many sources are still pending.
  const mostlyUnverified = findings.length === 0 || verifiedFindings.length < findings.length / 2;

  // Inspection Budget Priorities and Questions for Seller are each optional and independent of
  // one another (a property can match one rule set but not the other) -- both sub-components own
  // their full heading now, so no section-numbering scheme is needed here.
  const hasInspectionPriorities = Boolean(report.inspectionPriorities);
  const hasSellerQuestions = Boolean(report.sellerQuestionsScript);

  // Findings whose status is a real outcome -- we queried a live source and got an answer either
  // way -- get a full card. 'NOT YET VERIFIED' ones are rendered as a compact list instead: they
  // all say materially the same thing ("no live connection yet, check it here"), so six identical
  // full-size cards made the report look padded rather than thorough.
  const resolvedFindings = findings.filter(f => f.status !== 'NOT YET VERIFIED');

  const statusBadgeClasses = (status: string) => {
    if (status === 'CONFIRMED RECORD') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'NO RECORD FOUND') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-300';
  };

  // Display-only labels. The underlying CanonicalStatus values are the wire/data contract (they
  // come back from the server and drive the filters above), so they stay as-is -- only what the
  // reader sees changes. 'NOT YET VERIFIED' in particular read as a system error rather than an
  // instruction; 'Needs verification' says the same thing as a next step.
  const STATUS_LABEL: Record<string, string> = {
    'CONFIRMED RECORD': 'Confirmed',
    'NO RECORD FOUND': 'No record found',
    'NOT YET VERIFIED': 'Needs verification',
  };
  const statusLabel = (status: string) => STATUS_LABEL[status] || status;

  // Toggle checklist checkbox
  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Print / PDF Print Styles */}
      <style>{`
        @media print {
          @page { margin: 14mm; }
          header { display: none !important; }
          footer { display: none !important; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; color: #0f172a !important; background: #ffffff !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          h1, h2, h3, h4 { word-spacing: normal !important; letter-spacing: normal !important; break-after: avoid; }
          .shadow-xs, .shadow-sm, .shadow-md, .shadow-xl { box-shadow: none !important; }
          a { text-decoration: underline !important; color: #2563eb !important; }
          /* Keep each finding, priority, and question intact rather than letting one split across
             a page boundary; sections themselves are allowed to break since they run long. */
          section { margin-bottom: 20px !important; }
          [data-print-block] { break-inside: avoid; page-break-inside: avoid; }
          /* Status chips and priority rails carry meaning here, so keep their fills in print. */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Just a label, not a second brand lockup -- the global Navbar directly above this
              already carries the logo and wordmark, and stacking two of them read as chrome
              rather than as a document. */}
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Property Insights
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Source Registry</span> ({sourceCount})
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Document Header Panel */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {/* The "what kind of document is this" line. The caveat it used to spell out in full
                  caps now lives where it's actionable instead -- the Needs verification list below
                  and the closing disclaimer -- rather than shouting it above the address. */}
              <span className={`text-xs font-semibold uppercase tracking-wide block ${mostlyUnverified ? 'text-slate-500' : 'text-blue-600'}`}>
                {mostlyUnverified ? 'Public records reference' : 'Verified public property research'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                {formattedAddress}
              </h1>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {report.headerInfo?.reportDate || 'August 2026'}
            </span>
          </div>
        </section>

        {/* SECTION: DETAILED FINDINGS */}
        <section id="section-findings" className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Public record findings</span>
            </div>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              What We Checked
            </h2>
          </div>

          {/* Real outcomes -- full cards. */}
          {resolvedFindings.length > 0 && (
            <div className="space-y-4">
              {resolvedFindings.map((finding) => (
                <div
                  key={finding.id}
                  data-print-block
                  className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {finding.category} · {finding.sourceAgency || 'Public Source'}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                        {finding.subject}
                      </h3>
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClasses(finding.status)}`}>
                      {statusLabel(finding.status)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {finding.whatWeFound} {finding.whyItMatters} {finding.suggestedNextStep}
                    {finding.sourceUrl && (
                      <>
                        {' '}
                        <a
                          href={finding.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                        >
                          <span>Check the official record</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </p>

                  {/* Contextual vendor match for this specific finding's trade category, if a real
                      vendor has paid for it in this ZIP -- renders nothing otherwise. */}
                  {finding.sponsoredVendor && (
                    <SponsoredVendorCard vendor={finding.sponsoredVendor} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Needs verification -- one dense list instead of N near-identical cards. */}
          {pendingFindings.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-base font-bold text-slate-900">Needs verification</h3>
                <span className="text-xs text-slate-500">
                  {pendingFindings.length} {pendingFindings.length === 1 ? 'record' : 'records'} to confirm at the source
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {pendingFindings.map((finding) => (
                  <div key={finding.id} data-print-block className="p-5 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h4 className="text-sm font-bold text-slate-900 min-w-0">
                        {finding.subject}
                      </h4>
                      {finding.sourceUrl && (
                        <a
                          href={finding.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                        >
                          <span>{finding.sourceAgency || 'Check record'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {finding.suggestedNextStep}
                    </p>

                    {finding.sponsoredVendor && (
                      <SponsoredVendorCard vendor={finding.sponsoredVendor} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Want to see every public source BeforeRegret checks, and which ones are live vs. reference-only?{' '}
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
            >
              Open the full Source Registry
            </button>.
          </p>
        </section>

        {/* SECTION: INSPECTION BUDGET PRIORITIES -- renders nothing when no rule set covers
            this (year built, county) pair, same as the free summary version. Owns its own full
            heading now (see InspectionPriorities.tsx), so no outer wrapper heading here. */}
        {hasInspectionPriorities && (
          <section id="section-inspection-priorities">
            <InspectionPriorities precomputed={report.inspectionPriorities} />
          </section>
        )}

        {/* SECTION: QUESTIONS FOR SELLER -- same render-nothing-when-no-rule-applies principle.
            Replaces the old per-finding actionItem-derived mini card, which pulled from a fixed,
            non-era-aware Gemini/fallback list rather than this deterministic engine. Owns its
            own full heading now (see SellerQuestions.tsx). */}
        {hasSellerQuestions && (
          <section id="section-seller-questions">
            <SellerQuestions precomputed={report.sellerQuestionsScript} />
          </section>
        )}

        {/* SECTION: YOUR ACTION LIST */}
        <section id="section-action-list" className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Before your walkthrough</span>
            </div>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Your Action List
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Walkthrough Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Walkthrough Checklist</span>
                </h3>
              </div>

              <div className="space-y-3">
                {findings.filter(f => f.actionItem?.type === 'walkthroughItem').map((f, idx) => {
                  const checkId = `wt-${idx}`;
                  const isChecked = checkedItems[checkId] || false;
                  return (
                    <div
                      key={checkId}
                      onClick={() => toggleCheck(checkId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                        isChecked 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <button className="mt-0.5 text-blue-600 shrink-0">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <div className="space-y-0.5">
                        <span className={`font-bold block ${isChecked ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                          {f.actionItem?.title || f.subject}
                        </span>
                        <p className="text-slate-600 leading-relaxed">{f.actionItem?.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Legal Disclaimer -- kept short and at the bottom, not a full page section, but the
            substance (no physical inspection, no title search, no valuation, verify at source)
            has to stay somewhere on every report. */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-700 block uppercase font-mono tracking-wider mb-1">Disclaimer</span>
          BeforeRegret links you to official public sources -- it does not perform physical engineering inspections, legal title searches, or property valuations. Nothing on this page is a confirmed record until you verify it directly with the source agency, and physical building conditions should be confirmed with a licensed home inspector before closing.
        </div>

      </main>

      {/* Source Modal */}
      {isSourceModalOpen && (
        <SourceRegistryModal
          onClose={() => setIsSourceModalOpen(false)}
        />
      )}

      {/* Error Reporting Modal */}
      {isErrorModalOpen && (
        <ErrorReportingModal
          reportId={report.id}
          address={report.headerInfo?.address || ''}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </div>
  );
};
